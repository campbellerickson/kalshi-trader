import type { NextApiRequest, NextApiResponse } from 'next';
import { generateMonthlyAnalysis, saveMonthlyAnalysis } from '../../../lib/analysis/monthly';
import { logCronError } from '../../../lib/utils/logger';

/**
 * Monthly Analysis Cron Job
 * Runs on the 1st of each month to analyze previous month's performance
 * Schedule: "0 0 1 * *" (midnight on 1st day of month)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Calculate previous month (if run on 1st, analyze last month)
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    // If it's the 1st, analyze previous month
    // Otherwise, analyze the month specified in query params (for testing)
    let targetYear = currentYear;
    let targetMonth = currentMonth - 1;
    
    if (targetMonth === 0) {
      targetMonth = 12;
      targetYear = currentYear - 1;
    }
    
    // Allow override via query params for testing
    if (req.query.year && req.query.month) {
      targetYear = parseInt(req.query.year as string);
      targetMonth = parseInt(req.query.month as string);
    }
    
    console.log(`📊 Generating monthly analysis for ${targetYear}-${String(targetMonth).padStart(2, '0')}...`);
    
    // Generate analysis
    const analysis = await generateMonthlyAnalysis(targetYear, targetMonth);
    
    // Save to database
    await saveMonthlyAnalysis(analysis);
    
    console.log(`✅ Monthly analysis complete:`);
    console.log(`   Total trades: ${analysis.total_trades}`);
    console.log(`   Total P&L: $${analysis.total_pnl.toFixed(2)}`);
    console.log(`   Win rate: ${(analysis.win_rate * 100).toFixed(1)}%`);
    console.log(`   Avg ROI: ${analysis.avg_roi.toFixed(2)}%`);
    console.log(`   Market types analyzed: ${Object.keys(analysis.market_type_analysis).length}`);
    console.log(`   Series IDs analyzed: ${Object.keys(analysis.series_analysis).length}`);
    
    return res.status(200).json({
      success: true,
      month: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
      analysis: {
        total_trades: analysis.total_trades,
        total_pnl: analysis.total_pnl,
        win_rate: analysis.win_rate,
        avg_roi: analysis.avg_roi,
        market_types_count: Object.keys(analysis.market_type_analysis).length,
        series_count: Object.keys(analysis.series_analysis).length,
        top_market_types: analysis.top_market_types,
        top_series_ids: analysis.top_series_ids,
        insights: analysis.insights,
      },
    });
    
  } catch (error: any) {
    console.error('❌ Monthly analysis cron failed:', error);
    await logCronError('monthly-analysis', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

