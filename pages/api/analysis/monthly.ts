import type { NextApiRequest, NextApiResponse } from 'next';
import { getMonthlyAnalysis, getAllMonthlyAnalyses } from '../../../lib/analysis/monthly';

/**
 * API endpoint to fetch monthly analysis for dashboard
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get specific month or all analyses
    if (req.query.year && req.query.month) {
      const year = parseInt(req.query.year as string);
      const month = parseInt(req.query.month as string);
      const analysis = await getMonthlyAnalysis(year, month);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found for this month' });
      }
      
      return res.status(200).json(analysis);
    }
    
    // Return all analyses
    const analyses = await getAllMonthlyAnalyses();
    return res.status(200).json({ analyses });
    
  } catch (error: any) {
    console.error('Error fetching monthly analysis:', error);
    return res.status(500).json({ error: error.message });
  }
}

