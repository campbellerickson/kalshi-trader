import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchMarkets } from '../../../lib/kalshi/client';
import { TRADING_CONSTANTS } from '../../../config/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require the cron secret so this endpoint isn't publicly callable
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const markets = await fetchMarkets();
    
    // Fetch raw API response for debugging
    const { fetchMarkets: _ } = await import('../../../lib/kalshi/client');
    // Note: We'll add raw response logging in the client itself
    
    const now = new Date();
    const filteredMarkets = markets.map((market) => {
      const daysToResolution = (market.end_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return {
        market_id: market.market_id,
        question: market.question,
        yes_odds: market.yes_odds,
        no_odds: market.no_odds,
        liquidity: market.liquidity,
        volume_24h: market.volume_24h,
        end_date: market.end_date,
        days_to_resolution: daysToResolution.toFixed(2),
        resolved: market.resolved,
        passes_odds: market.yes_odds >= TRADING_CONSTANTS.MIN_ODDS && market.yes_odds <= TRADING_CONSTANTS.MAX_ODDS,
        passes_days: daysToResolution <= TRADING_CONSTANTS.MAX_DAYS_TO_RESOLUTION && daysToResolution >= 0,
        passes_liquidity: market.liquidity >= TRADING_CONSTANTS.MIN_LIQUIDITY,
        passes_all: 
          market.yes_odds >= TRADING_CONSTANTS.MIN_ODDS && 
          market.yes_odds <= TRADING_CONSTANTS.MAX_ODDS &&
          daysToResolution <= TRADING_CONSTANTS.MAX_DAYS_TO_RESOLUTION &&
          daysToResolution >= 0 &&
          market.liquidity >= TRADING_CONSTANTS.MIN_LIQUIDITY &&
          !market.resolved,
      };
    });

    const qualifying = filteredMarkets.filter(m => m.passes_all);
    const topByOdds = filteredMarkets
      .filter(m => m.yes_odds >= TRADING_CONSTANTS.MIN_ODDS)
      .sort((a, b) => b.yes_odds - a.yes_odds)
      .slice(0, 10);

    return res.status(200).json({
      ok: true,
      criteria: {
        min_odds: TRADING_CONSTANTS.MIN_ODDS,
        max_odds: TRADING_CONSTANTS.MAX_ODDS,
        max_days: TRADING_CONSTANTS.MAX_DAYS_TO_RESOLUTION,
        min_liquidity: TRADING_CONSTANTS.MIN_LIQUIDITY,
      },
      summary: {
        total_markets: markets.length,
        qualifying: qualifying.length,
        top_by_odds_count: topByOdds.length,
      },
      qualifying_markets: qualifying.slice(0, 20),
      top_by_odds: topByOdds,
      sample_all_markets: filteredMarkets.slice(0, 10),
    });
  } catch (error: any) {
    console.error('Debug markets endpoint error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

