-- Migration: Monthly Market Analysis Table
-- Stores monthly performance analysis by market type and series ID

CREATE TABLE IF NOT EXISTS monthly_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month_year DATE NOT NULL UNIQUE, -- First day of month (e.g., 2026-01-01)
  
  -- Overall metrics
  total_trades INT DEFAULT 0,
  total_invested DECIMAL(10,2) DEFAULT 0,
  total_pnl DECIMAL(10,2) DEFAULT 0,
  win_rate DECIMAL(5,4),
  avg_roi DECIMAL(5,2),
  
  -- Analysis by market type/category
  market_type_analysis JSONB, -- { "Elections": { trades: 10, pnl: 150, win_rate: 0.8 }, ... }
  
  -- Analysis by series ID (Kalshi series)
  series_analysis JSONB, -- { "SERIES-123": { trades: 5, pnl: 75, win_rate: 0.9 }, ... }
  
  -- Top performers
  top_market_types JSONB, -- Top 5 market types by ROI
  top_series_ids JSONB, -- Top 5 series IDs by ROI
  
  -- Bottom performers (for learning)
  worst_market_types JSONB, -- Worst 3 market types
  worst_series_ids JSONB, -- Worst 3 series IDs
  
  -- Generated insights
  insights TEXT, -- AI-generated insights about the month
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monthly_analysis_month_year ON monthly_analysis(month_year);
CREATE INDEX IF NOT EXISTS idx_monthly_analysis_created_at ON monthly_analysis(created_at);

-- Comments
COMMENT ON TABLE monthly_analysis IS 'Monthly performance analysis by market type and series ID';
COMMENT ON COLUMN monthly_analysis.market_type_analysis IS 'JSONB object: { "category": { trades, pnl, win_rate, roi } }';
COMMENT ON COLUMN monthly_analysis.series_analysis IS 'JSONB object: { "series_id": { trades, pnl, win_rate, roi } }';

