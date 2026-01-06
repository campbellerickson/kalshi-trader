-- Migration: Enhance AI Learning Fields
-- This migration is idempotent - safe to run multiple times
-- Adds risk_factors field and ensures all AI learning fields exist

-- Add risk_factors column to trades if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trades' AND column_name = 'risk_factors'
  ) THEN
    ALTER TABLE trades ADD COLUMN risk_factors JSONB;
    COMMENT ON COLUMN trades.risk_factors IS 'Array of risk factors identified by AI at decision time';
  END IF;
END $$;

-- Ensure ai_reasoning is TEXT (should already be, but ensure)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trades' AND column_name = 'ai_reasoning'
  ) THEN
    -- Column exists, ensure it's TEXT type
    IF (SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'trades' AND column_name = 'ai_reasoning') != 'text' THEN
      ALTER TABLE trades ALTER COLUMN ai_reasoning TYPE TEXT;
    END IF;
  ELSE
    -- Column doesn't exist, create it
    ALTER TABLE trades ADD COLUMN ai_reasoning TEXT;
    COMMENT ON COLUMN trades.ai_reasoning IS 'AI reasoning for making this trade decision';
  END IF;
END $$;

-- Ensure ai_confidence exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trades' AND column_name = 'ai_confidence'
  ) THEN
    ALTER TABLE trades ADD COLUMN ai_confidence DECIMAL(3,2);
    COMMENT ON COLUMN trades.ai_confidence IS 'AI confidence score (0-1) at decision time';
  END IF;
END $$;

-- Add index on ai_confidence for pattern analysis
CREATE INDEX IF NOT EXISTS idx_trades_ai_confidence ON trades(ai_confidence) WHERE ai_confidence IS NOT NULL;

-- Add index on ai_reasoning for keyword analysis (using GIN for text search if needed)
-- For now, just ensure we can query by reasoning patterns

-- Ensure contracts table has all needed fields for caching
DO $$ 
BEGIN
  -- Ensure discovered_at exists for cache freshness checks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'discovered_at'
  ) THEN
    ALTER TABLE contracts ADD COLUMN discovered_at TIMESTAMP DEFAULT NOW();
  END IF;
  
  -- Ensure category exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'category'
  ) THEN
    ALTER TABLE contracts ADD COLUMN category TEXT;
  END IF;
END $$;

-- Add index on discovered_at for cache freshness queries
CREATE INDEX IF NOT EXISTS idx_contracts_discovered_at ON contracts(discovered_at) WHERE resolved = false;

-- Ensure ai_decisions table exists with all fields
CREATE TABLE IF NOT EXISTS ai_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  contract_snapshot JSONB,
  features_analyzed JSONB,
  decision_factors JSONB,
  confidence_score DECIMAL(3,2),
  allocated_amount DECIMAL(10,2),
  risk_factors JSONB, -- Store risk factors separately if needed
  outcome TEXT, -- won/lost after resolution
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for AI learning queries
CREATE INDEX IF NOT EXISTS idx_ai_decisions_trade_id ON ai_decisions(trade_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_outcome ON ai_decisions(outcome) WHERE outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_decisions_created_at ON ai_decisions(created_at);

-- Add comments for documentation
COMMENT ON TABLE trades IS 'All trades executed by the system, including AI reasoning and confidence';
COMMENT ON COLUMN trades.ai_reasoning IS 'Detailed reasoning provided by AI for this trade decision';
COMMENT ON COLUMN trades.ai_confidence IS 'AI confidence score (0.0-1.0) at time of decision';
COMMENT ON COLUMN trades.risk_factors IS 'JSONB array of risk factors identified by AI';

COMMENT ON TABLE ai_decisions IS 'Detailed AI decision snapshots for advanced learning analysis';
COMMENT ON COLUMN ai_decisions.contract_snapshot IS 'Full contract data at time of decision';
COMMENT ON COLUMN ai_decisions.features_analyzed IS 'Features the AI considered in its decision';
COMMENT ON COLUMN ai_decisions.decision_factors IS 'Weighted factors that influenced the decision';

