-- ============================================
-- Fix missing columns in ai_decisions, trades, and contracts tables
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Add risk_factors column to ai_decisions table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ai_decisions' AND column_name = 'risk_factors'
    ) THEN
        ALTER TABLE ai_decisions ADD COLUMN risk_factors JSONB;
        RAISE NOTICE 'Added risk_factors column to ai_decisions';
    ELSE
        RAISE NOTICE 'risk_factors column already exists in ai_decisions';
    END IF;
END $$;

-- Add risk_factors column to trades table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'trades' AND column_name = 'risk_factors'
    ) THEN
        ALTER TABLE trades ADD COLUMN risk_factors JSONB;
        RAISE NOTICE 'Added risk_factors column to trades';
    ELSE
        RAISE NOTICE 'risk_factors column already exists in trades';
    END IF;
END $$;

-- Add yes_odds and no_odds columns to contracts table (if not done yet)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contracts' AND column_name = 'yes_odds'
    ) THEN
        ALTER TABLE contracts ADD COLUMN yes_odds DECIMAL(5,4);
        RAISE NOTICE 'Added yes_odds column to contracts';
    ELSE
        RAISE NOTICE 'yes_odds column already exists in contracts';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contracts' AND column_name = 'no_odds'
    ) THEN
        ALTER TABLE contracts ADD COLUMN no_odds DECIMAL(5,4);
        RAISE NOTICE 'Added no_odds column to contracts';
    ELSE
        RAISE NOTICE 'no_odds column already exists in contracts';
    END IF;
END $$;

-- Verify all columns exist
SELECT
    'ai_decisions.risk_factors' as column_path,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ai_decisions' AND column_name = 'risk_factors'
    ) as exists
UNION ALL
SELECT
    'trades.risk_factors',
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'trades' AND column_name = 'risk_factors'
    )
UNION ALL
SELECT
    'contracts.yes_odds',
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contracts' AND column_name = 'yes_odds'
    )
UNION ALL
SELECT
    'contracts.no_odds',
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contracts' AND column_name = 'no_odds'
    );

-- Summary
DO $$
DECLARE
    ai_risk INT;
    trades_risk INT;
    contracts_yes INT;
    contracts_no INT;
BEGIN
    SELECT COUNT(*) INTO ai_risk FROM information_schema.columns
    WHERE table_name = 'ai_decisions' AND column_name = 'risk_factors';

    SELECT COUNT(*) INTO trades_risk FROM information_schema.columns
    WHERE table_name = 'trades' AND column_name = 'risk_factors';

    SELECT COUNT(*) INTO contracts_yes FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'yes_odds';

    SELECT COUNT(*) INTO contracts_no FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'no_odds';

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Migration Complete!';
    RAISE NOTICE 'ai_decisions.risk_factors: %', CASE WHEN ai_risk > 0 THEN '✓ EXISTS' ELSE '✗ MISSING' END;
    RAISE NOTICE 'trades.risk_factors: %', CASE WHEN trades_risk > 0 THEN '✓ EXISTS' ELSE '✗ MISSING' END;
    RAISE NOTICE 'contracts.yes_odds: %', CASE WHEN contracts_yes > 0 THEN '✓ EXISTS' ELSE '✗ MISSING' END;
    RAISE NOTICE 'contracts.no_odds: %', CASE WHEN contracts_no > 0 THEN '✓ EXISTS' ELSE '✗ MISSING' END;
    RAISE NOTICE '===========================================';
END $$;
