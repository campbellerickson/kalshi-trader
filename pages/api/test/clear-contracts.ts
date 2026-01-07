import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/database/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret for security
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🗑️ Clearing all contracts from database...');
    
    // Delete all contracts
    // First get count
    const { count: totalCount } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });
    
    // Then delete all
    const { error } = await supabase
      .from('contracts')
      .delete()
      .neq('market_id', '') // Delete all (this is a workaround for Supabase delete without WHERE)
      .select();

    if (error) {
      // If the above fails, try a different approach
      console.warn('First delete attempt failed, trying alternative method...');
      
      // Alternative: Delete in batches
      let deletedCount = 0;
      let hasMore = true;
      
      while (hasMore) {
        const { data: batch, error: batchError } = await supabase
          .from('contracts')
          .select('market_id')
          .limit(100);
        
        if (batchError) {
          throw new Error(`Failed to fetch contracts: ${batchError.message}`);
        }
        
        if (!batch || batch.length === 0) {
          hasMore = false;
          break;
        }
        
        const marketIds = batch.map(c => c.market_id);
        const { error: deleteError } = await supabase
          .from('contracts')
          .delete()
          .in('market_id', marketIds);
        
        if (deleteError) {
          throw new Error(`Failed to delete contracts: ${deleteError.message}`);
        }
        
        deletedCount += batch.length;
        console.log(`   Deleted ${deletedCount} contracts...`);
        
        if (batch.length < 100) {
          hasMore = false;
        }
      }
      
      console.log(`✅ Deleted ${deletedCount} contracts`);
      
      return res.status(200).json({
        success: true,
        deleted: deletedCount,
        message: `Successfully cleared ${deletedCount} contracts from database`,
      });
    }

    const deletedCount = totalCount || 0;
    console.log(`✅ Deleted ${deletedCount} contracts`);

    return res.status(200).json({
      success: true,
      deleted: deletedCount,
      message: `Successfully cleared ${deletedCount} contracts from database`,
    });
  } catch (error: any) {
    console.error('❌ Error clearing contracts:', error);
    return res.status(500).json({
      error: error.message,
      details: error.stack,
    });
  }
}

