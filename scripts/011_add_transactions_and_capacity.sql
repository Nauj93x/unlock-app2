-- Adding transactions table and updating accommodations capacity field
-- Add capacidad_maxima field to accommodations table
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS capacidad_maxima INTEGER DEFAULT 1;

-- Update existing accommodations to have capacidad_maxima equal to current capacity
UPDATE accommodations SET capacidad_maxima = capacity WHERE capacidad_maxima IS NULL;

-- Make capacidad_maxima NOT NULL
ALTER TABLE accommodations ALTER COLUMN capacidad_maxima SET NOT NULL;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    accommodation_id UUID REFERENCES accommodations(id) ON DELETE SET NULL,
    monto NUMERIC(10,2) NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'pagado', 'rechazado')) DEFAULT 'pendiente',
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_event_id ON transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_transactions_estado ON transactions(estado);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample transactions for testing
INSERT INTO transactions (user_id, event_id, accommodation_id, monto, estado) 
SELECT 
    p.id as user_id,
    e.id as event_id,
    a.id as accommodation_id,
    (a.price_per_night * 2) as monto,
    'pendiente' as estado
FROM profiles p
CROSS JOIN events e
CROSS JOIN accommodations a
WHERE p.role = 'cliente'
LIMIT 3;

COMMIT;
