import type { NextApiRequest, NextApiResponse } from 'next';
import { getRecentAIDecisions } from '../../lib/database/queries';

/**
 * Get recent AI decisions (both selected and rejected)
 * Public endpoint to view AI reasoning
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const decisions = await getRecentAIDecisions(limit);

    // Format decisions for easy reading
    const formatted = decisions.map((d: any) => ({
      id: d.id,
      created_at: d.created_at,
      selected: d.allocated_amount > 0,
      market_id: d.contract_snapshot?.market_id,
      question: d.contract_snapshot?.question,
      yes_odds: d.features_analyzed?.yes_odds ? `${(d.features_analyzed.yes_odds * 100).toFixed(1)}%` : 'N/A',
      no_odds: d.features_analyzed?.no_odds ? `${(d.features_analyzed.no_odds * 100).toFixed(1)}%` : 'N/A',
      allocated: d.allocated_amount > 0 ? `$${d.allocated_amount}` : 'REJECTED',
      confidence: d.confidence_score,
      reasoning: d.decision_factors?.reasoning || 'No reasoning',
      risk_factors: d.risk_factors || [],
      days_to_resolution: d.features_analyzed?.days_to_resolution,
      liquidity: d.features_analyzed?.liquidity,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      decisions: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching AI decisions:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
