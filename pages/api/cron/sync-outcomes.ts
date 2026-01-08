import type { NextApiRequest, NextApiResponse } from 'next';
import { getMarket } from '../../../lib/kalshi/client';
import { supabase } from '../../../lib/database/client';

/**
 * Daily cron job to sync resolved market outcomes to ai_decisions table
 * This enables historical learning by showing AI what actually happened
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🔄 Syncing resolved market outcomes to ai_decisions...');

  try {
    // 1. Get all ai_decisions with NULL outcomes (only recent ones - last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data: decisions, error: fetchError } = await supabase
      .from('ai_decisions')
      .select('id, contract_id, contract_snapshot')
      .is('outcome', null)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .limit(100); // Process 100 at a time

    if (fetchError) {
      throw new Error(`Failed to fetch ai_decisions: ${fetchError.message}`);
    }

    if (!decisions || decisions.length === 0) {
      console.log('✅ No unresolved ai_decisions to sync');
      return res.status(200).json({
        success: true,
        synced: 0,
      });
    }

    console.log(`Found ${decisions.length} ai_decisions with NULL outcomes`);

    let synced = 0;
    let skipped = 0;

    // 2. Check each decision's market for resolution
    for (const decision of decisions) {
      try {
        const marketId = decision.contract_snapshot?.market_id;

        if (!marketId) {
          console.log(`⚠️ No market_id for decision ${decision.id}, skipping`);
          skipped++;
          continue;
        }

        // Fetch current market data from Kalshi
        const market = await getMarket(marketId);

        // If market is resolved, update the ai_decision with outcome
        if (market.resolved && market.outcome) {
          console.log(`✅ Market ${marketId} resolved: ${market.outcome}`);

          const { error: updateError } = await supabase
            .from('ai_decisions')
            .update({
              outcome: market.outcome,
              resolution_source: 'sync-outcomes-cron',
              resolved_at: market.resolved_at || new Date().toISOString(),
            })
            .eq('id', decision.id);

          if (updateError) {
            console.error(`❌ Failed to update decision ${decision.id}:`, updateError.message);
            continue;
          }

          synced++;
        } else {
          // Market not resolved yet, skip
          skipped++;
        }

      } catch (error: any) {
        console.error(`❌ Error processing decision ${decision.id}:`, error.message);
        skipped++;
        continue;
      }
    }

    console.log(`\n✅ Sync complete:`);
    console.log(`   Synced: ${synced}`);
    console.log(`   Skipped: ${skipped}`);

    return res.status(200).json({
      success: true,
      synced,
      skipped,
    });

  } catch (error: any) {
    console.error('❌ Sync outcomes job failed:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
}
