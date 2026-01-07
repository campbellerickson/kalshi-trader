import { supabase } from '../database/client';
import { getTradesInRange } from '../database/queries';
import { Trade } from '../../types';

export interface MarketTypeStats {
  trades: number;
  total_invested: number;
  total_pnl: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_roi: number;
}

export interface MonthlyAnalysis {
  month_year: Date;
  total_trades: number;
  total_invested: number;
  total_pnl: number;
  win_rate: number;
  avg_roi: number;
  market_type_analysis: Record<string, MarketTypeStats>;
  series_analysis: Record<string, MarketTypeStats>;
  top_market_types: Array<{ type: string; roi: number }>;
  top_series_ids: Array<{ series_id: string; roi: number }>;
  worst_market_types: Array<{ type: string; roi: number }>;
  worst_series_ids: Array<{ series_id: string; roi: number }>;
  insights: string;
}

/**
 * Extract market type from contract question
 */
function extractMarketType(question: string, category?: string): string {
  // Use category if available
  if (category) {
    return category;
  }
  
  // Otherwise, infer from question
  const q = question.toLowerCase();
  
  if (q.includes('election') || q.includes('vote') || q.includes('candidate')) {
    return 'Elections/Politics';
  }
  if (q.includes('sport') || q.includes('game') || q.includes('match') || 
      q.includes('nfl') || q.includes('nba') || q.includes('mlb') || 
      q.includes('football') || q.includes('basketball') || q.includes('baseball')) {
    return 'Sports';
  }
  if (q.includes('earnings') || q.includes('stock') || q.includes('market')) {
    return 'Finance/Earnings';
  }
  if (q.includes('data') || q.includes('release') || q.includes('report')) {
    return 'Data Releases';
  }
  if (q.includes('deadline') || q.includes('date') || q.includes('by')) {
    return 'Time-based';
  }
  if (q.includes('approval') || q.includes('approve') || q.includes('regulatory')) {
    return 'Regulatory/Approval';
  }
  
  return 'Other';
}

/**
 * Extract series ID from market_id
 * Kalshi series IDs are typically in the format: SERIES-SERIESCODE-...
 */
function extractSeriesId(marketId: string): string {
  // Kalshi market IDs often have format like: SERIES-XXXXX-YYYYY
  // Try to extract the series portion
  const parts = marketId.split('-');
  if (parts.length >= 2) {
    // Return first two parts as series identifier
    return parts.slice(0, 2).join('-');
  }
  
  // Fallback: use first part or whole ID if no clear pattern
  return parts[0] || marketId;
}

/**
 * Generate monthly analysis for a specific month
 */
export async function generateMonthlyAnalysis(year: number, month: number): Promise<MonthlyAnalysis> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);
  
  const monthStr = String(month).padStart(2, '0');
  console.log(`📊 Generating monthly analysis for ${year}-${monthStr}...`);
  
  // Get all trades for the month
  const trades = await getTradesInRange(monthStart, monthEnd);
  const resolvedTrades = trades.filter(t => t.status !== 'open' && t.pnl !== null);
  
  if (resolvedTrades.length === 0) {
    return {
      month_year: monthStart,
      total_trades: 0,
      total_invested: 0,
      total_pnl: 0,
      win_rate: 0,
      avg_roi: 0,
      market_type_analysis: {},
      series_analysis: {},
      top_market_types: [],
      top_series_ids: [],
      worst_market_types: [],
      worst_series_ids: [],
      insights: 'No resolved trades for this month.',
    };
  }
  
  // Aggregate by market type
  const marketTypeStats: Record<string, MarketTypeStats> = {};
  const seriesStats: Record<string, MarketTypeStats> = {};
  
  for (const trade of resolvedTrades) {
    const marketType = extractMarketType(
      trade.contract?.question || '',
      trade.contract?.category
    );
    const seriesId = extractSeriesId(trade.contract?.market_id || '');
    
    // Initialize if needed
    if (!marketTypeStats[marketType]) {
      marketTypeStats[marketType] = {
        trades: 0,
        total_invested: 0,
        total_pnl: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
        avg_roi: 0,
      };
    }
    
    if (!seriesStats[seriesId]) {
      seriesStats[seriesId] = {
        trades: 0,
        total_invested: 0,
        total_pnl: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
        avg_roi: 0,
      };
    }
    
    // Update stats
    const positionSize = trade.position_size || 0;
    const pnl = trade.pnl || 0;
    
    marketTypeStats[marketType].trades++;
    marketTypeStats[marketType].total_invested += positionSize;
    marketTypeStats[marketType].total_pnl += pnl;
    if (trade.status === 'won') {
      marketTypeStats[marketType].wins++;
    } else {
      marketTypeStats[marketType].losses++;
    }
    
    seriesStats[seriesId].trades++;
    seriesStats[seriesId].total_invested += positionSize;
    seriesStats[seriesId].total_pnl += pnl;
    if (trade.status === 'won') {
      seriesStats[seriesId].wins++;
    } else {
      seriesStats[seriesId].losses++;
    }
  }
  
  // Calculate win rates and ROI
  const calculateStats = (stats: MarketTypeStats) => {
    stats.win_rate = stats.trades > 0 ? stats.wins / stats.trades : 0;
    stats.avg_roi = stats.total_invested > 0 
      ? (stats.total_pnl / stats.total_invested) * 100 
      : 0;
  };
  
  Object.values(marketTypeStats).forEach(calculateStats);
  Object.values(seriesStats).forEach(calculateStats);
  
  // Overall stats
  const totalInvested = resolvedTrades.reduce((sum, t) => sum + (t.position_size || 0), 0);
  const totalPnL = resolvedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const wins = resolvedTrades.filter(t => t.status === 'won').length;
  const winRate = resolvedTrades.length > 0 ? wins / resolvedTrades.length : 0;
  const avgROI = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  
  // Top/worst performers by ROI
  const marketTypeArray = Object.entries(marketTypeStats)
    .map(([type, stats]) => ({ type, roi: stats.avg_roi, stats }))
    .filter(item => item.stats.trades >= 3); // Only include if 3+ trades
  
  const seriesArray = Object.entries(seriesStats)
    .map(([series_id, stats]) => ({ series_id, roi: stats.avg_roi, stats }))
    .filter(item => item.stats.trades >= 2); // Only include if 2+ trades
  
  const topMarketTypes = marketTypeArray
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 5)
    .map(item => ({ type: item.type, roi: item.roi }));
  
  const worstMarketTypes = marketTypeArray
    .sort((a, b) => a.roi - b.roi)
    .slice(0, 3)
    .map(item => ({ type: item.type, roi: item.roi }));
  
  const topSeriesIds = seriesArray
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 5)
    .map(item => ({ series_id: item.series_id, roi: item.roi }));
  
  const worstSeriesIds = seriesArray
    .sort((a, b) => a.roi - b.roi)
    .slice(0, 3)
    .map(item => ({ series_id: item.series_id, roi: item.roi }));
  
  // Generate insights
  const insights = generateInsights(marketTypeStats, seriesStats, topMarketTypes, worstMarketTypes);
  
  return {
    month_year: monthStart,
    total_trades: resolvedTrades.length,
    total_invested: totalInvested,
    total_pnl: totalPnL,
    win_rate: winRate,
    avg_roi: avgROI,
    market_type_analysis: marketTypeStats,
    series_analysis: seriesStats,
    top_market_types: topMarketTypes,
    top_series_ids: topSeriesIds,
    worst_market_types: worstMarketTypes,
    worst_series_ids: worstSeriesIds,
    insights,
  };
}

/**
 * Generate insights from analysis
 */
function generateInsights(
  marketTypes: Record<string, MarketTypeStats>,
  series: Record<string, MarketTypeStats>,
  topTypes: Array<{ type: string; roi: number }>,
  worstTypes: Array<{ type: string; roi: number }>
): string {
  const insights: string[] = [];
  
  if (topTypes.length > 0) {
    insights.push(`Best performing market types: ${topTypes.map(t => `${t.type} (${t.roi.toFixed(1)}% ROI)`).join(', ')}`);
  }
  
  if (worstTypes.length > 0) {
    insights.push(`Underperforming market types: ${worstTypes.map(t => `${t.type} (${t.roi.toFixed(1)}% ROI)`).join(', ')}`);
  }
  
  // Check for patterns
  const sportsStats = marketTypes['Sports'];
  if (sportsStats && sportsStats.trades >= 5) {
    insights.push(`Sports markets: ${sportsStats.trades} trades, ${(sportsStats.win_rate * 100).toFixed(1)}% win rate, ${sportsStats.avg_roi.toFixed(1)}% ROI`);
  }
  
  const electionStats = marketTypes['Elections/Politics'];
  if (electionStats && electionStats.trades >= 5) {
    insights.push(`Political markets: ${electionStats.trades} trades, ${(electionStats.win_rate * 100).toFixed(1)}% win rate, ${electionStats.avg_roi.toFixed(1)}% ROI`);
  }
  
  if (insights.length === 0) {
    return 'Insufficient data for meaningful insights this month.';
  }
  
  return insights.join('. ') + '.';
}

/**
 * Save monthly analysis to database
 */
export async function saveMonthlyAnalysis(analysis: MonthlyAnalysis): Promise<void> {
  const year = analysis.month_year.getFullYear();
  const month = String(analysis.month_year.getMonth() + 1).padStart(2, '0');
  const monthYearStr = `${year}-${month}-01`;
  
  const { error } = await supabase
    .from('monthly_analysis')
    .upsert({
      month_year: monthYearStr,
      total_trades: analysis.total_trades,
      total_invested: analysis.total_invested,
      total_pnl: analysis.total_pnl,
      win_rate: analysis.win_rate,
      avg_roi: analysis.avg_roi,
      market_type_analysis: analysis.market_type_analysis,
      series_analysis: analysis.series_analysis,
      top_market_types: analysis.top_market_types,
      top_series_ids: analysis.top_series_ids,
      worst_market_types: analysis.worst_market_types,
      worst_series_ids: analysis.worst_series_ids,
      insights: analysis.insights,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'month_year',
    });
  
  if (error) {
    throw new Error(`Failed to save monthly analysis: ${error.message}`);
  }
  
  console.log(`✅ Saved monthly analysis for ${monthYearStr}`);
}

/**
 * Get monthly analysis for a specific month
 */
export async function getMonthlyAnalysis(year: number, month: number): Promise<MonthlyAnalysis | null> {
  const monthStr = String(month).padStart(2, '0');
  const monthYearStr = `${year}-${monthStr}-01`;
  
  const { data, error } = await supabase
    .from('monthly_analysis')
    .select('*')
    .eq('month_year', monthYearStr)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    // Handle missing table gracefully
    if (error.code === 'PGRST205' || error.message?.includes('not found')) {
      console.warn('⚠️ monthly_analysis table not found. Run migrations.');
      return null;
    }
    throw error;
  }
  
  if (!data) return null;
  
  return {
    month_year: new Date(data.month_year),
    total_trades: data.total_trades,
    total_invested: parseFloat(data.total_invested?.toString() || '0'),
    total_pnl: parseFloat(data.total_pnl?.toString() || '0'),
    win_rate: parseFloat(data.win_rate?.toString() || '0'),
    avg_roi: parseFloat(data.avg_roi?.toString() || '0'),
    market_type_analysis: data.market_type_analysis || {},
    series_analysis: data.series_analysis || {},
    top_market_types: data.top_market_types || [],
    top_series_ids: data.top_series_ids || [],
    worst_market_types: data.worst_market_types || [],
    worst_series_ids: data.worst_series_ids || [],
    insights: data.insights || '',
  };
}

/**
 * Get all monthly analyses
 */
export async function getAllMonthlyAnalyses(): Promise<MonthlyAnalysis[]> {
  const { data, error } = await supabase
    .from('monthly_analysis')
    .select('*')
    .order('month_year', { ascending: false });
  
  if (error) {
    // Handle missing table gracefully
    if (error.code === 'PGRST205' || error.message?.includes('not found')) {
      console.warn('⚠️ monthly_analysis table not found. Run migrations.');
      return [];
    }
    throw error;
  }
  
  if (!data) return [];
  
  return data.map((row: any) => ({
    month_year: new Date(row.month_year),
    total_trades: row.total_trades,
    total_invested: parseFloat(row.total_invested?.toString() || '0'),
    total_pnl: parseFloat(row.total_pnl?.toString() || '0'),
    win_rate: parseFloat(row.win_rate?.toString() || '0'),
    avg_roi: parseFloat(row.avg_roi?.toString() || '0'),
    market_type_analysis: row.market_type_analysis || {},
    series_analysis: row.series_analysis || {},
    top_market_types: row.top_market_types || [],
    top_series_ids: row.top_series_ids || [],
    worst_market_types: row.worst_market_types || [],
    worst_series_ids: row.worst_series_ids || [],
    insights: row.insights || '',
  }));
}

