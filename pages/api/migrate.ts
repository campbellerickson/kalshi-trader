import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/database/client';

/**
 * Migration endpoint - creates monthly_analysis table if it doesn't exist
 * Requires CRON_SECRET for security
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Require authentication
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if table exists by trying to query it
    const { error: checkError } = await supabase
      .from('monthly_analysis')
      .select('id')
      .limit(1);

    if (!checkError) {
      return res.status(200).json({ 
        message: 'Table already exists',
        table: 'monthly_analysis'
      });
    }

    // Table doesn't exist - provide instructions
    const migrationSQL = `
-- Migration: Monthly Market Analysis Table
CREATE TABLE IF NOT EXISTS monthly_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month_year DATE NOT NULL UNIQUE,
  total_trades INT DEFAULT 0,
  total_invested DECIMAL(10,2) DEFAULT 0,
  total_pnl DECIMAL(10,2) DEFAULT 0,
  win_rate DECIMAL(5,4),
  avg_roi DECIMAL(5,2),
  market_type_analysis JSONB,
  series_analysis JSONB,
  top_market_types JSONB,
  top_series_ids JSONB,
  worst_market_types JSONB,
  worst_series_ids JSONB,
  insights TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monthly_analysis_month_year ON monthly_analysis(month_year);
CREATE INDEX IF NOT EXISTS idx_monthly_analysis_created_at ON monthly_analysis(created_at);
`;

    return res.status(200).json({
      message: 'Table does not exist. Run this SQL in Supabase Dashboard:',
      sql: migrationSQL,
      instructions: [
        '1. Go to Supabase Dashboard → SQL Editor',
        '2. Paste the SQL above',
        '3. Click "Run"',
        '4. Refresh this endpoint to verify'
      ]
    });
  } catch (error: any) {
    console.error('Migration check error:', error);
    return res.status(500).json({ 
      error: error.message,
      hint: 'Run the migration SQL in Supabase Dashboard → SQL Editor'
    });
  }
}

