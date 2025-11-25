-- Complete system setup with correct table names and business logic
-- Based on the specifications from the user requirements

-- 1. Add missing columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS fecha_inicio timestamptz,
ADD COLUMN IF NOT EXISTS fecha_fin timestamptz,
ADD COLUMN IF NOT EXISTS capacidad_maxima integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS estado text DEFAULT 'disponible';

-- Update existing events to use new column names if they don't exist
UPDATE public.events 
SET capacidad_maxima = COALESCE(max_capacity, 100)
WHERE capacidad_maxima IS NULL OR capacidad_maxima = 0;

-- 2. Add missing columns to accommodations table (correct table name)
ALTER TABLE public.accommodations 
ADD COLUMN IF NOT EXISTS estado text DEFAULT 'disponible';

-- Update existing accommodations
UPDATE public.accommodations 
SET capacidad_maxima = COALESCE(capacity, 1)
WHERE capacidad_maxima IS NULL OR capacidad_maxima = 0;

-- 3. Update transactions table structure
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS fecha_expiracion timestamptz,
ADD COLUMN IF NOT EXISTS fecha_creacion timestamptz DEFAULT now();

-- Update existing transactions
UPDATE public.transactions 
SET fecha_creacion = COALESCE(created_at, now())
WHERE fecha_creacion IS NULL;

-- 4. Create function to expire pending transactions
CREATE OR REPLACE FUNCTION public.expire_pending_transactions()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.transactions
  SET estado = 'expirado'
  WHERE estado = 'pendiente' 
    AND fecha_expiracion IS NOT NULL 
    AND fecha_expiracion < now();
END;
$$;

-- 5. Create function to update event states
CREATE OR REPLACE FUNCTION public.update_event_states()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Mark events as finalizado if past end date
  UPDATE public.events
  SET estado = 'finalizado'
  WHERE fecha_fin IS NOT NULL 
    AND fecha_fin < now() 
    AND estado <> 'finalizado';

  -- Mark events as cerrado if capacity reached
  UPDATE public.events e
  SET estado = 'cerrado'
  WHERE (
    SELECT COUNT(*) 
    FROM public.transactions t 
    WHERE t.event_id = e.id 
      AND t.estado IN ('pendiente','pagado')
  ) >= COALESCE(e.capacidad_maxima, 0)
    AND e.estado <> 'cerrado'
    AND e.estado <> 'finalizado';

  -- Mark events as disponible if they have capacity and haven't ended
  UPDATE public.events e
  SET estado = 'disponible'
  WHERE (e.fecha_fin IS NULL OR e.fecha_fin >= now())
    AND (
      SELECT COUNT(*) 
      FROM public.transactions t 
      WHERE t.event_id = e.id 
        AND t.estado IN ('pendiente','pagado')
    ) < COALESCE(e.capacidad_maxima, 0)
    AND e.estado NOT IN ('disponible', 'finalizado');
END;
$$;

-- 6. Create maintenance function that runs both
CREATE OR REPLACE FUNCTION public.run_maintenance()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.expire_pending_transactions();
  PERFORM public.update_event_states();
END;
$$;

-- 7. Schedule maintenance with pg_cron (runs every minute)
SELECT cron.schedule('system_maintenance', '*/1 * * * *', $$SELECT public.run_maintenance();$$);

-- 8. Add constraints to prevent duplicates
ALTER TABLE public.events 
ADD CONSTRAINT IF NOT EXISTS events_unique_name_date 
UNIQUE (name, fecha_inicio);

ALTER TABLE public.accommodations 
ADD CONSTRAINT IF NOT EXISTS accommodations_unique_name 
UNIQUE (name);

-- 9. Create updated_at trigger for transactions
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
