-- ============================================
-- Complete Database Schema for Kalshi Trader
-- Run this in Supabase Dashboard → SQL Editor
-- This script is idempotent (safe to run multiple times)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Contracts Table
-- ============================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id TEXT NOT NULL UNIQUE,
  question TEXT NOT NULL,
  end_date TIMESTAMP NOT NULL,
  current_odds DECIMAL(5,4) NOT NULL,
  category TEXT,
  liquidity DECIMAL(12,2),
  volume_24h DECIMAL(12,2),
  discovered_at TIMESTAMP DEFAULT NOW(),
  resolution_source TEXT,
  outcome TEXT, -- YES/NO after resolution
  resolved_at TIMESTAMP,
  resolved BOOLEAN DEFAULT false
);

-- ============================================
-- 2. Trades Table (with AI Learning Fields)
-- ============================================
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  executed_at TIMESTAMP DEFAULT NOW(),
  entry_odds DECIMAL(5,4) NOT NULL,
  position_size DECIMAL(10,2) NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('YES', 'NO')),
  contracts_purchased DECIMAL(12,4),
  ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  ai_reasoning TEXT, -- AI reasoning for the trade decision
  risk_factors JSONB, -- Array of risk factors identified by AI
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'stopped')),
  exit_odds DECIMAL(5,4),
  pnl DECIMAL(10,2),
  resolved_at TIMESTAMP
);

-- ============================================
-- 3. AI Decisions Table (Enhanced Learning)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  contract_snapshot JSONB, -- Full contract data at decision time
  features_analyzed JSONB, -- What factors AI considered
  decision_factors JSONB, -- Weighted reasoning
  confidence_score DECIMAL(3,2),
  allocated_amount DECIMAL(10,2),
  risk_factors JSONB, -- Risk factors from AI analysis
  outcome TEXT CHECK (outcome IN ('won', 'lost', 'stopped', NULL)),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. Performance Metrics Table
-- ============================================
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  trades_executed INT DEFAULT 0,
  win_rate DECIMAL(5,4),
  total_pnl DECIMAL(10,2),
  sharpe_ratio DECIMAL(5,4),
  bankroll DECIMAL(10,2),
  avg_hold_time INTERVAL,
  best_trade_pnl DECIMAL(10,2),
  worst_trade_pnl DECIMAL(10,2),
  calculated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. Notification Preferences
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  phone_number TEXT,
  email TEXT,
  report_time TIME DEFAULT '07:00:00',
  timezone TEXT DEFAULT 'America/New_York',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. Daily Reports
-- ============================================
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE NOT NULL,
  trades_executed INT DEFAULT 0,
  total_invested DECIMAL(10,2),
  open_positions_value DECIMAL(10,2),
  cash_balance DECIMAL(10,2),
  total_liquidity DECIMAL(10,2),
  mtd_pnl DECIMAL(10,2),
  ytd_pnl DECIMAL(10,2),
  mtd_return_pct DECIMAL(5,2),
  ytd_return_pct DECIMAL(5,2),
  win_rate_mtd DECIMAL(5,4),
  win_rate_ytd DECIMAL(5,4),
  report_content TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. Stop Loss Events
-- ============================================
CREATE TABLE IF NOT EXISTS stop_loss_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  trigger_odds DECIMAL(5,4) NOT NULL,
  exit_odds DECIMAL(5,4) NOT NULL,
  position_size DECIMAL(10,2) NOT NULL,
  realized_loss DECIMAL(10,2) NOT NULL,
  reason TEXT,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 8. Stop Loss Configuration
-- ============================================
CREATE TABLE IF NOT EXISTS stop_loss_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trigger_threshold DECIMAL(5,4) DEFAULT 0.80,
  enabled BOOLEAN DEFAULT true,
  min_hold_time_hours INT DEFAULT 1,
  max_slippage_pct DECIMAL(5,4) DEFAULT 0.05,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 9. Error Logs
-- ============================================
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('error', 'warning', 'info')),
  message TEXT NOT NULL,
  error TEXT,
  stack TEXT,
  context JSONB,
  source TEXT CHECK (source IN ('cron', 'api', 'system')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Contracts indexes
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_market_id ON contracts(market_id);
CREATE INDEX IF NOT EXISTS idx_contracts_discovered_at ON contracts(discovered_at) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_contracts_resolved ON contracts(resolved);

-- Trades indexes
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_contract_id ON trades(contract_id);
CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON trades(executed_at);
CREATE INDEX IF NOT EXISTS idx_trades_ai_confidence ON trades(ai_confidence) WHERE ai_confidence IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trades_ai_reasoning ON trades USING gin(to_tsvector('english', ai_reasoning)) WHERE ai_reasoning IS NOT NULL;

-- AI Decisions indexes
CREATE INDEX IF NOT EXISTS idx_ai_decisions_trade_id ON ai_decisions(trade_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_outcome ON ai_decisions(outcome) WHERE outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_decisions_created_at ON ai_decisions(created_at);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_date ON performance_metrics(date);

-- Stop loss indexes
CREATE INDEX IF NOT EXISTS idx_stop_loss_trade ON stop_loss_events(trade_id);
CREATE INDEX IF NOT EXISTS idx_stop_loss_executed_at ON stop_loss_events(executed_at);

-- Error logs indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_source ON error_logs(source);

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default stop loss config if not exists
INSERT INTO stop_loss_config (trigger_threshold, enabled) 
VALUES (0.80, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS for Documentation
-- ============================================

COMMENT ON TABLE trades IS 'All trades executed by the system, including AI reasoning and confidence';
COMMENT ON COLUMN trades.ai_reasoning IS 'Detailed reasoning provided by AI for this trade decision';
COMMENT ON COLUMN trades.ai_confidence IS 'AI confidence score (0.0-1.0) at time of decision';
COMMENT ON COLUMN trades.risk_factors IS 'JSONB array of risk factors identified by AI at decision time';

COMMENT ON TABLE ai_decisions IS 'Detailed AI decision snapshots for advanced learning analysis';
COMMENT ON COLUMN ai_decisions.contract_snapshot IS 'Full contract data at time of decision';
COMMENT ON COLUMN ai_decisions.features_analyzed IS 'Features the AI considered in its decision';
COMMENT ON COLUMN ai_decisions.decision_factors IS 'Weighted factors that influenced the decision';
COMMENT ON COLUMN ai_decisions.risk_factors IS 'Risk factors from AI analysis stored separately';

COMMENT ON TABLE contracts IS 'Cached market data from Kalshi API, refreshed gradually';
COMMENT ON COLUMN contracts.discovered_at IS 'Timestamp when market was cached, used for cache freshness checks';

-- ============================================
-- Migration Complete
-- ============================================

SELECT 'Database schema migration completed successfully!' as status;

