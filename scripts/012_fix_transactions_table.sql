-- Fixed SQL script to handle existing triggers and constraints
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;

-- Create or replace the function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add capacidad_maxima to alojamientos if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alojamientos' AND column_name = 'capacidad_maxima') THEN
        ALTER TABLE alojamientos ADD COLUMN capacidad_maxima INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing alojamientos to set capacidad_maxima equal to capacity
UPDATE alojamientos SET capacidad_maxima = capacity WHERE capacidad_maxima IS NULL OR capacidad_maxima = 0;
