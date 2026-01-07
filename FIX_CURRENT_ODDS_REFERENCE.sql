-- ============================================
-- Fix current_odds reference issue
-- Run this in Supabase Dashboard → SQL Editor
-- Ensures current_odds column is properly renamed to yes_odds
-- ============================================

-- Check if current_odds column still exists
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    -- Check if current_odds exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'contracts'
        AND column_name = 'current_odds'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE '⚠️ current_odds column still exists. Renaming to yes_odds...';
        
        -- Check if yes_odds already exists
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'contracts'
            AND column_name = 'yes_odds'
        ) THEN
            -- Both columns exist - migrate data and drop current_odds
            RAISE NOTICE '   Both columns exist. Migrating data...';
            UPDATE contracts 
            SET yes_odds = current_odds 
            WHERE yes_odds = 0 OR yes_odds IS NULL;
            
            RAISE NOTICE '   Dropping current_odds column...';
            ALTER TABLE contracts DROP COLUMN current_odds;
            RAISE NOTICE '✅ Removed current_odds column';
        ELSE
            -- Rename current_odds to yes_odds
            ALTER TABLE contracts RENAME COLUMN current_odds TO yes_odds;
            RAISE NOTICE '✅ Renamed current_odds to yes_odds';
        END IF;
    ELSE
        RAISE NOTICE '✅ current_odds column does not exist (already renamed or never existed)';
    END IF;
    
    -- Verify yes_odds exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'contracts'
        AND column_name = 'yes_odds'
    ) THEN
        RAISE NOTICE '✅ yes_odds column exists';
    ELSE
        RAISE WARNING '❌ yes_odds column does NOT exist - need to add it';
    END IF;
    
    -- Verify no_odds exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'contracts'
        AND column_name = 'no_odds'
    ) THEN
        RAISE NOTICE '✅ no_odds column exists';
    ELSE
        RAISE WARNING '❌ no_odds column does NOT exist - need to add it';
    END IF;
END $$;

-- Verify final state
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'contracts'
AND column_name IN ('current_odds', 'yes_odds', 'no_odds')
ORDER BY column_name;

