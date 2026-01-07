-- Add missing resolved column to contracts table
-- Run this in Supabase Dashboard → SQL Editor

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'resolved'
    ) THEN
        ALTER TABLE contracts ADD COLUMN resolved BOOLEAN DEFAULT false;
        CREATE INDEX IF NOT EXISTS idx_contracts_resolved ON contracts(resolved);
        CREATE INDEX IF NOT EXISTS idx_contracts_discovered_at ON contracts(discovered_at) WHERE resolved = false;
        
        RAISE NOTICE 'Added resolved column to contracts table';
    ELSE
        RAISE NOTICE 'resolved column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND column_name = 'resolved';

