import type { NextApiRequest, NextApiResponse } from 'next';
import { getRecentTrades, getOpenTrades, getCurrentBankroll, getInitialBankroll, getTradesInRange, getOpenPositions } from '../../lib/database/queries';
import { getMarket, getAccountBalance } from '../../lib/kalshi/client';
import { calculateWinRate, calculateTotalPnL } from '../../lib/utils/metrics';
import { getMonthlyAnalysis, getAllMonthlyAnalyses } from '../../lib/analysis/monthly';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📊 Dashboard: Fetching fresh data...');

    // Get LIVE account balance from Kalshi API (most accurate)
    let currentBankroll: number;
    try {
      currentBankroll = await getAccountBalance();
      console.log(`   ✅ Live Kalshi balance: $${currentBankroll.toFixed(2)}`);
    } catch (error) {
      console.warn('   ⚠️ Failed to fetch live balance, using cached:', error);
      currentBankroll = await getCurrentBankroll();
    }

    // Get all trades from database
    const allTrades = await getRecentTrades(1000);
    const resolvedTrades = allTrades.filter(t => t.status !== 'open' && t.status !== 'cancelled');

    // Calculate metrics
    const initialBankroll = await getInitialBankroll();
    const totalPnL = calculateTotalPnL(resolvedTrades);
    const totalReturn = initialBankroll > 0 ? (totalPnL / initialBankroll) * 100 : 0;
    const winRate = calculateWinRate(resolvedTrades);

    console.log(`   Trades: ${allTrades.length} total, ${resolvedTrades.length} resolved`);
    
    // Get open trades
    const openTrades = await getOpenTrades();
    console.log(`   Open trades: ${openTrades.length}`);

    // Get open positions with LIVE current odds from Kalshi
    const openPositions = await getOpenPositions();
    const positionsWithOdds = await Promise.all(
      openPositions.map(async (pos) => {
        try {
          // Fetch LIVE market data from Kalshi
          const market = await getMarket(pos.trade.contract.market_id);
          const currentOdds = pos.trade.side === 'YES' ? market.yes_odds : market.no_odds;

          // Calculate current position value
          const currentValue = pos.trade.contracts_purchased * currentOdds;
          const unrealizedPnL = currentValue - pos.trade.position_size;
          const unrealizedPnLPct = pos.trade.position_size > 0
            ? (unrealizedPnL / pos.trade.position_size) * 100
            : 0;

          console.log(`   Position: ${pos.trade.contract.market_id.substring(0, 30)}... | Entry: ${(pos.trade.entry_odds * 100).toFixed(1)}% | Current: ${(currentOdds * 100).toFixed(1)}% | P&L: $${unrealizedPnL.toFixed(2)}`);

          return {
            ...pos,
            yes_odds: market.yes_odds,
            no_odds: market.no_odds || (1 - market.yes_odds),
            unrealized_pnl: unrealizedPnL,
            unrealized_pnl_pct: unrealizedPnLPct,
          };
        } catch (error: any) {
          console.error(`   ⚠️ Failed to fetch market ${pos.trade.contract.market_id}:`, error.message);
          // If we can't fetch market, use entry odds (fallback)
          return {
            ...pos,
            yes_odds: pos.trade.entry_odds,
            no_odds: 1 - pos.trade.entry_odds,
            unrealized_pnl: 0,
            unrealized_pnl_pct: 0,
          };
        }
      })
    );

    // Calculate total unrealized P&L
    const totalUnrealizedPnL = positionsWithOdds.reduce((sum, p) => sum + p.unrealized_pnl, 0);
    console.log(`   Total unrealized P&L: $${totalUnrealizedPnL.toFixed(2)}`);
    
    // Calculate MTD (Month-to-Date)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mtdTrades = await getTradesInRange(monthStart, now);
    const mtdResolved = mtdTrades.filter(t => t.status !== 'open' && t.status !== 'cancelled');
    const mtdPnL = calculateTotalPnL(mtdResolved);

    // Calculate MTD return based on actual bankroll at month start
    const monthStartBankroll = initialBankroll; // Could be improved by tracking historical bankroll
    const mtdReturn = monthStartBankroll > 0 ? (mtdPnL / monthStartBankroll) * 100 : 0;

    console.log(`   MTD: ${mtdResolved.length} trades, $${mtdPnL.toFixed(2)} P&L (${mtdReturn.toFixed(2)}%)`);

    // Calculate YTD (Year-to-Date)
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const ytdTrades = await getTradesInRange(yearStart, now);
    const ytdResolved = ytdTrades.filter(t => t.status !== 'open' && t.status !== 'cancelled');
    const ytdPnL = calculateTotalPnL(ytdResolved);
    const ytdReturn = initialBankroll > 0 ? (ytdPnL / initialBankroll) * 100 : 0;

    console.log(`   YTD: ${ytdResolved.length} trades, $${ytdPnL.toFixed(2)} P&L (${ytdReturn.toFixed(2)}%)`);
    
    // Get recent trades (last 20)
    const recentTrades = allTrades.slice(0, 20);
    
    // Get monthly analyses (last 3 months)
    // Handle missing table gracefully
    let monthlyAnalyses: any[] = [];
    let recentMonthlyAnalyses: any[] = [];
    let lastMonthAnalysis: any = null;
    
    try {
      monthlyAnalyses = await getAllMonthlyAnalyses();
      recentMonthlyAnalyses = monthlyAnalyses.slice(0, 3);
      
      // Get current month analysis if available
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      lastMonthAnalysis = await getMonthlyAnalysis(
        currentMonth === 1 ? currentYear - 1 : currentYear,
        currentMonth === 1 ? 12 : currentMonth - 1
      );
    } catch (error: any) {
      // Table doesn't exist yet - migrations haven't run
      if (error.code === 'PGRST205' || error.message?.includes('monthly_analysis')) {
        console.warn('⚠️ monthly_analysis table not found. Run migrations in Supabase.');
        monthlyAnalyses = [];
        recentMonthlyAnalyses = [];
        lastMonthAnalysis = null;
      } else {
        throw error; // Re-throw other errors
      }
    }
    
    console.log('✅ Dashboard data ready');

    return res.status(200).json({
      // Live Kalshi balance
      currentBankroll,
      initialBankroll,

      // Performance metrics
      totalPnL,
      totalReturn,
      winRate,
      totalTrades: allTrades.length,
      resolvedTrades: resolvedTrades.length,

      // Open positions (with live odds)
      openTrades: openTrades.length,
      openPositions: positionsWithOdds,
      totalUnrealizedPnL,

      // Time-based metrics
      mtdPnL,
      mtdReturn,
      mtdTrades: mtdResolved.length,
      ytdPnL,
      ytdReturn,
      ytdTrades: ytdResolved.length,

      // Recent activity
      recentTrades,

      // Monthly analysis
      monthlyAnalyses: recentMonthlyAnalyses,
      lastMonthAnalysis,

      // Metadata
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
