-- Add no_odds column to contracts table and rename current_odds to yes_odds
-- Run this in Supabase Dashboard → SQL Editor

-- Add yes_odds column if it doesn't exist (rename current_odds)
DO $$ 
BEGIN
    -- Check if yes_odds column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'yes_odds'
    ) THEN
        -- Check if current_odds exists (old column name)
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'contracts' 
            AND column_name = 'current_odds'
        ) THEN
            -- Rename current_odds to yes_odds
            ALTER TABLE contracts RENAME COLUMN current_odds TO yes_odds;
            RAISE NOTICE 'Renamed current_odds to yes_odds';
        ELSE
            -- Add yes_odds column if current_odds doesn't exist
            ALTER TABLE contracts ADD COLUMN yes_odds DECIMAL(5,4) NOT NULL DEFAULT 0;
            RAISE NOTICE 'Added yes_odds column to contracts table';
        END IF;
    ELSE
        RAISE NOTICE 'yes_odds column already exists';
    END IF;
END $$;

-- Add no_odds column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'no_odds'
    ) THEN
        ALTER TABLE contracts ADD COLUMN no_odds DECIMAL(5,4) NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added no_odds column to contracts table';
        
        -- Populate no_odds from yes_odds: no_odds = 1 - yes_odds
        UPDATE contracts 
        SET no_odds = ROUND((1 - yes_odds)::numeric, 4)
        WHERE yes_odds > 0;
        
        RAISE NOTICE 'Populated no_odds from yes_odds';
    ELSE
        RAISE NOTICE 'no_odds column already exists';
    END IF;
END $$;

-- Verify the columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND column_name IN ('yes_odds', 'no_odds', 'current_odds')
ORDER BY column_name;

