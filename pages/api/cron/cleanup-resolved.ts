import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/database/client';

/**
 * Cleanup cron job to delete resolved markets from contracts table
 * Runs daily to prevent the table from growing too large
 * 
 * Deletes markets that:
 * - Are resolved (resolved = true)
 * - Were resolved more than 7 days ago (to allow for reporting/analysis)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🧹 Starting cleanup of resolved markets...');
    
    // Calculate cutoff date: 7 days ago
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    // First, count how many markets will be deleted
    const { count, error: countError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', true)
      .lt('resolved_at', cutoffDate.toISOString());
    
    if (countError) {
      console.error('❌ Error counting resolved markets:', countError);
      throw countError;
    }
    
    const marketsToDelete = count || 0;
    console.log(`   Found ${marketsToDelete} resolved markets older than 7 days`);
    
    if (marketsToDelete === 0) {
      return res.status(200).json({
        success: true,
        deleted: 0,
        message: 'No resolved markets to clean up',
      });
    }
    
    // Delete resolved markets older than 7 days
    const { data, error } = await supabase
      .from('contracts')
      .delete()
      .eq('resolved', true)
      .lt('resolved_at', cutoffDate.toISOString());
    
    if (error) {
      console.error('❌ Error deleting resolved markets:', error);
      throw error;
    }
    
    console.log(`✅ Deleted ${marketsToDelete} resolved markets`);
    
    // Also clean up markets that have been resolved for more than 7 days
    // even if they don't have a resolved_at timestamp (use discovered_at as fallback)
    const { count: countWithoutResolvedAt, error: count2Error } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', true)
      .is('resolved_at', null)
      .lt('discovered_at', cutoffDate.toISOString());
    
    if (!count2Error && (countWithoutResolvedAt || 0) > 0) {
      const { error: delete2Error } = await supabase
        .from('contracts')
        .delete()
        .eq('resolved', true)
        .is('resolved_at', null)
        .lt('discovered_at', cutoffDate.toISOString());
      
      if (delete2Error) {
        console.error('❌ Error deleting resolved markets without resolved_at:', delete2Error);
      } else {
        console.log(`✅ Deleted ${countWithoutResolvedAt} resolved markets without resolved_at timestamp`);
      }
    }
    
    return res.status(200).json({
      success: true,
      deleted: marketsToDelete,
      cutoffDate: cutoffDate.toISOString(),
      message: `Deleted ${marketsToDelete} resolved markets older than 7 days`,
    });
    
  } catch (error: any) {
    console.error('❌ Cleanup cron failed:', error);
    
    const { logCronError } = await import('../../../lib/utils/logger');
    await logCronError('cleanup-resolved', error);
    
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

