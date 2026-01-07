import type { NextApiRequest, NextApiResponse } from 'next';
import { scanContracts } from '../../../lib/kalshi/scanner';
import { getCachedMarkets } from '../../../lib/kalshi/cache';
import { calculateDaysToResolution } from '../../../lib/kalshi/client';
import { TRADING_CONSTANTS } from '../../../config/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require the cron secret so this endpoint isn't publicly callable
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const breakdown: any = {
      timestamp: new Date().toISOString(),
      criteria: {
        minOdds: TRADING_CONSTANTS.MIN_ODDS,
        maxOdds: TRADING_CONSTANTS.MAX_ODDS,
        maxDaysToResolution: TRADING_CONSTANTS.MAX_DAYS_TO_RESOLUTION,
        minLiquidity: TRADING_CONSTANTS.MIN_LIQUIDITY,
        excludeCategories: TRADING_CONSTANTS.EXCLUDE_CATEGORIES,
        excludeKeywords: TRADING_CONSTANTS.EXCLUDE_KEYWORDS,
      },
      stages: {},
    };

    // STAGE 1: Get cached markets
    const allMarkets = await getCachedMarkets();
    breakdown.stages.cached_markets = {
      count: allMarkets.length,
      sample: allMarkets.slice(0, 3).map(m => ({
        market_id: m.market_id,
        question: m.question.substring(0, 80),
        yes_odds: m.yes_odds,
        end_date: m.end_date,
      })),
    };

    if (allMarkets.length === 0) {
      return res.status(200).json({
        ...breakdown,
        summary: {
          qualifying_count: 0,
          message: 'No cached markets found. Market refresh cron may need to run.',
        },
      });
    }

    // STAGE 2: Filter by odds and resolution time
    const now = new Date();
    const candidates = allMarkets.filter(market => {
      // Skip markets with invalid/zero odds
      if (!market.yes_odds || market.yes_odds === 0 || market.yes_odds === null) {
        return false;
      }

      // Filter by price: yes_odds >= 0.85 OR <= 0.15
      const yesPriceCents = market.yes_odds * 100;
      const isHighYes = yesPriceCents >= TRADING_CONSTANTS.MIN_ODDS * 100; // >= 85%
      const isHighNo = yesPriceCents <= (1 - TRADING_CONSTANTS.MAX_ODDS) * 100; // <= 2%
      
      if (!isHighYes && !isHighNo) {
        return false;
      }

      // Filter by resolution date
      const daysToResolution = calculateDaysToResolution(market.end_date);
      if (daysToResolution > TRADING_CONSTANTS.MAX_DAYS_TO_RESOLUTION || daysToResolution < 0) {
        return false;
      }

      // Exclude resolved markets
      if (market.resolved) {
        return false;
      }

      // Exclude categories (if any)
      if (market.category && TRADING_CONSTANTS.EXCLUDE_CATEGORIES.length > 0) {
        const excludeCategories = TRADING_CONSTANTS.EXCLUDE_CATEGORIES as string[];
        if (excludeCategories.includes(market.category)) {
          return false;
        }
      }

      // Exclude keywords (if any)
      if (TRADING_CONSTANTS.EXCLUDE_KEYWORDS.length > 0) {
        const excludeKeywords = TRADING_CONSTANTS.EXCLUDE_KEYWORDS as string[];
        const questionLower = market.question.toLowerCase();
        const hasExcludedKeyword = excludeKeywords.some(keyword => 
          questionLower.includes(keyword.toLowerCase())
        );
        if (hasExcludedKeyword) {
          return false;
        }
      }

      return true;
    });

    breakdown.stages.after_filtering = {
      count: candidates.length,
      filtered_out: allMarkets.length - candidates.length,
      sample: candidates.slice(0, 5).map(m => ({
        market_id: m.market_id,
        question: m.question.substring(0, 80),
        yes_odds: m.yes_odds,
        yes_price_cents: Math.round(m.yes_odds * 100),
        days_to_resolution: calculateDaysToResolution(m.end_date),
        category: m.category,
      })),
    };

    // STAGE 3: Full scan with liquidity check (this actually calls the API)
    console.log('🔍 Running full scan with liquidity checks...');
    const qualifyingContracts = await scanContracts();

    breakdown.stages.after_liquidity_check = {
      count: qualifyingContracts.length,
      filtered_out: candidates.length - qualifyingContracts.length,
      sample: qualifyingContracts.slice(0, 5).map(c => ({
        market_id: c.market_id,
        question: c.question.substring(0, 80),
        current_odds: c.current_odds,
        odds_percent: Math.round(c.current_odds * 100),
        liquidity: c.liquidity,
        days_to_resolution: calculateDaysToResolution(c.end_date),
        category: c.category,
      })),
    };

    // Breakdown by criteria
    const breakdownByOdds = {
      high_yes: qualifyingContracts.filter(c => c.current_odds >= TRADING_CONSTANTS.MIN_ODDS).length,
      high_no: qualifyingContracts.filter(c => c.current_odds <= (1 - TRADING_CONSTANTS.MAX_ODDS)).length,
    };

    const breakdownByDays = {
      today: qualifyingContracts.filter(c => calculateDaysToResolution(c.end_date) < 1).length,
      tomorrow: qualifyingContracts.filter(c => {
        const days = calculateDaysToResolution(c.end_date);
        return days >= 1 && days < 2;
      }).length,
      two_days: qualifyingContracts.filter(c => {
        const days = calculateDaysToResolution(c.end_date);
        return days >= 2 && days <= TRADING_CONSTANTS.MAX_DAYS_TO_RESOLUTION;
      }).length,
    };

    breakdown.summary = {
      qualifying_count: qualifyingContracts.length,
      breakdown_by_odds: breakdownByOdds,
      breakdown_by_days: breakdownByDays,
      message: qualifyingContracts.length > 0
        ? `Found ${qualifyingContracts.length} qualifying contracts meeting all criteria`
        : 'No qualifying contracts found. All contracts were filtered out at one or more stages.',
      stages_completed: [
        'Cached markets retrieved',
        'Odds and resolution time filtered',
        'Liquidity checked via orderbook',
      ],
    };

    return res.status(200).json(breakdown);
  } catch (error: any) {
    console.error('Qualifying contracts test error:', error);
    return res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

