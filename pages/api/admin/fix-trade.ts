import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/database/client';

/**
 * Manually fix a trade's status in the database
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { trade_id, status } = req.query;

  if (!trade_id || !status) {
    return res.status(400).json({ error: 'Missing trade_id or status' });
  }

  try {
    console.log(`Manually updating trade ${trade_id} to ${status}`);

    const { error } = await supabase
      .from('trades')
      .update({
        status: status as string,
        exit_odds: null,
        pnl: 0,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', trade_id);

    if (error) {
      throw new Error(`Failed to update trade: ${error.message}`);
    }

    console.log(`✅ Trade ${trade_id} updated to ${status}`);

    return res.status(200).json({
      success: true,
      trade_id,
      status,
    });

  } catch (error: any) {
    console.error('❌ Fix trade failed:', error.message);
    return res.status(500).json({
      error: error.message,
    });
  }
}
