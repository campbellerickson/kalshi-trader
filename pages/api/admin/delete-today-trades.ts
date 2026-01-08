import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/database/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🗑️ Deleting today\'s trades...');

    // Get start of today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Delete today's trades
    const { data, error } = await supabase
      .from('trades')
      .delete()
      .gte('executed_at', todayStart.toISOString())
      .select();

    if (error) {
      throw error;
    }

    console.log(`✅ Deleted ${data?.length || 0} trades from today`);

    return res.status(200).json({
      success: true,
      deleted: data?.length || 0,
      trades: data
    });
  } catch (error: any) {
    console.error('❌ Error deleting trades:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
