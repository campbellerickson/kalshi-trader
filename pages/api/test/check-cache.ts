import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/database/client';

/**
 * Test endpoint to check what's actually in the contracts table
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Count total contracts
    const { count: totalCount, error: countError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });
    
    // Count unresolved contracts (check if resolved column exists)
    let unresolvedCount: number | null = null;
    let resolvedCount: number | null = null;
    let unresolvedError: any = null;
    let resolvedError: any = null;
    
    try {
      const unresolvedResult = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false);
      unresolvedCount = unresolvedResult.count;
      unresolvedError = unresolvedResult.error;
    } catch (e: any) {
      unresolvedError = { message: e.message };
    }
    
    try {
      const resolvedResult = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', true);
      resolvedCount = resolvedResult.count;
      resolvedError = resolvedResult.error;
    } catch (e: any) {
      resolvedError = { message: e.message };
    }
    
    // Get a few sample contracts (try with resolved, fallback without it)
    let samples: any[] = [];
    let samplesError: any = null;
    
    try {
        const result = await supabase
          .from('contracts')
          .select('market_id, question, resolved, discovered_at, yes_odds, no_odds, current_odds')
          .order('discovered_at', { ascending: false })
          .limit(5);
      samples = result.data || [];
      samplesError = result.error;
    } catch (e: any) {
      // If resolved column doesn't exist, try without it
      try {
        const result = await supabase
          .from('contracts')
          .select('market_id, question, discovered_at, yes_odds, no_odds, current_odds')
          .order('discovered_at', { ascending: false })
          .limit(5);
        samples = result.data || [];
        samplesError = result.error;
      } catch (e2: any) {
        samplesError = { message: `First error: ${e.message}, Second error: ${e2.message}` };
      }
    }
    
    // Get contracts from last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const { count: recentCount, error: recentError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .gte('discovered_at', twoHoursAgo.toISOString());
    
    return res.status(200).json({
      totalContracts: totalCount || 0,
      unresolvedContracts: unresolvedCount || 0,
      resolvedContracts: resolvedCount || 0,
      recentContracts: recentCount || 0,
      recentCutoff: twoHoursAgo.toISOString(),
      sampleContracts: samples || [],
      errors: {
        countError: countError?.message,
        unresolvedError: unresolvedError?.message,
        resolvedError: resolvedError?.message,
        samplesError: samplesError?.message,
        recentError: recentError?.message,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}

