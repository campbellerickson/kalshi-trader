import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/database/client';

/**
 * Debug endpoint to check outcomes distribution
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get all decisions with allocated amounts
    const { data: allDecisions, error: allError } = await supabase
      .from('ai_decisions')
      .select('id, outcome, allocated_amount, created_at')
      .gt('allocated_amount', 0)
      .order('created_at', { ascending: false });

    if (allError) throw allError;

    // Calculate stats
    const stats = {
      total: allDecisions?.length || 0,
      won: allDecisions?.filter(d => d.outcome === 'won').length || 0,
      lost: allDecisions?.filter(d => d.outcome === 'lost').length || 0,
      pending: allDecisions?.filter(d => !d.outcome).length || 0,
      totalAllocated: allDecisions?.reduce((sum, d) => sum + (d.allocated_amount || 0), 0) || 0,
    };

    // Calculate win rate if we have resolved trades
    const resolved = stats.won + stats.lost;
    const winRate = resolved > 0 ? (stats.won / resolved * 100).toFixed(1) : 'N/A';

    // Get sample of each outcome type
    const wonSamples = allDecisions?.filter(d => d.outcome === 'won').slice(0, 3);
    const lostSamples = allDecisions?.filter(d => d.outcome === 'lost').slice(0, 3);
    const pendingSamples = allDecisions?.filter(d => !d.outcome).slice(0, 3);

    return res.status(200).json({
      success: true,
      stats: {
        ...stats,
        resolved,
        winRate: `${winRate}%`,
      },
      samples: {
        won: wonSamples,
        lost: lostSamples,
        pending: pendingSamples,
      }
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
