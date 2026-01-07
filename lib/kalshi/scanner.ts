import { getOrderbookWithLiquidity, calculateDaysToResolution } from './client';
import { getCachedMarkets } from './cache';
import { Contract, ScanCriteria, Market } from '../../types';
import { TRADING_CONSTANTS } from '../../config/constants';

/**
 * Check if a market has a simple yes/no question (not multiple questions)
 * Filters out markets with complex criteria like "yes X, yes Y, no Z"
 */
function isSimpleYesNoMarket(question: string): boolean {
  if (!question || question.length === 0) {
    return false;
  }

  const questionLower = question.toLowerCase().trim();
  
  // Skip if question is too long (likely complex)
  if (question.length > 200) {
    return false;
  }
  
  // Count occurrences of "yes" and "no" keywords followed by colons or spaces
  // Complex markets often have patterns like "yes X: Y, yes Z: W"
  const yesPattern = /\b(yes|y)\s+[^,]+:/gi;
  const noPattern = /\b(no|n)\s+[^,]+:/gi;
  const yesMatches = questionLower.match(yesPattern) || [];
  const noMatches = questionLower.match(noPattern) || [];
  
  // If there are multiple "yes" or "no" clauses, it's likely a complex market
  if (yesMatches.length > 1 || noMatches.length > 1 || (yesMatches.length + noMatches.length) > 2) {
    return false;
  }
  
  // Check for multiple comma-separated conditions (common in complex markets)
  // Simple markets usually have one question, complex ones have multiple clauses
  const commaCount = (question.match(/,/g) || []).length;
  if (commaCount > 2) {
    // More than 2 commas likely indicates multiple conditions
    return false;
  }
  
  // Check for patterns like "yes X, yes Y" (multiple yes clauses)
  if (questionLower.match(/\byes\s+[^,]+,/g) && questionLower.match(/\byes\s+[^,]+,/g)!.length > 1) {
    return false;
  }
  
  // Check for patterns like "no X, no Y" (multiple no clauses)
  if (questionLower.match(/\bno\s+[^,]+,/g) && questionLower.match(/\bno\s+[^,]+,/g)!.length > 1) {
    return false;
  }
  
  // If it passes all checks, it's likely a simple yes/no market
  return true;
}

/**
 * Filter-then-Fetch approach for efficient market scanning:
 * 1. Scan all markets and filter for high-conviction (yes price >85¢ or <15¢)
 * 2. Enrich only those candidates with orderbook data for true liquidity
 */
export async function scanContracts(
  criteria: ScanCriteria = {
    minOdds: TRADING_CONSTANTS.MIN_ODDS,
    maxOdds: TRADING_CONSTANTS.MAX_ODDS,
    maxDaysToResolution: TRADING_CONSTANTS.MAX_DAYS_TO_RESOLUTION,
    minLiquidity: TRADING_CONSTANTS.MIN_LIQUIDITY,
    excludeCategories: TRADING_CONSTANTS.EXCLUDE_CATEGORIES,
    excludeKeywords: TRADING_CONSTANTS.EXCLUDE_KEYWORDS,
  }
): Promise<Contract[]> {
  console.log('🔍 Scanning Kalshi for high-conviction contracts...');
  console.log(`   Criteria: ${criteria.minOdds * 100}%-${criteria.maxOdds * 100}% odds, <${criteria.maxDaysToResolution} days, >$${criteria.minLiquidity} liquidity`);

  // STEP 1: Get markets from cache (refreshed gradually via cron)
  // This avoids hitting rate limits by fetching all markets at once
  const allMarkets = await getCachedMarkets();
  console.log(`   ✅ Retrieved ${allMarkets.length} markets from cache`);
  
  if (allMarkets.length === 0) {
    console.warn('⚠️ No cached markets found. Market refresh cron may not have run yet.');
    return [];
  }

  // STEP 2: Filter for high-conviction markets
  // Keep only markets where yes price is >85 cents OR <15 cents
  // This excludes the middle range (16-84%) where conviction is lower
  const now = new Date();
  const candidates: Market[] = [];

  for (const market of allMarkets) {
    // Skip markets with invalid/zero odds (likely resolved or inactive)
    if (!market.yes_odds || market.yes_odds === 0 || market.yes_odds === null) {
      continue;
    }

    // Filter by price: yes_odds > 0.85 OR < 0.15
    // Convert to cents for comparison
    const yesPriceCents = market.yes_odds * 100;
    
    // Skip if outside our high-conviction range
    // High conviction means: yes_odds >= minOdds (e.g., 85%) OR yes_odds <= (1 - maxOdds) (e.g., 2%)
    const isHighYes = yesPriceCents >= criteria.minOdds * 100; // >= 85%
    const isHighNo = yesPriceCents <= (1 - criteria.maxOdds) * 100; // <= 2% (100% - 98%)
    
    if (!isHighYes && !isHighNo) {
      continue;
    }

    // Filter by resolution date
    const daysToResolution = calculateDaysToResolution(market.end_date);
    if (daysToResolution > criteria.maxDaysToResolution || daysToResolution < 0) {
      continue;
    }

    // Exclude resolved markets
    if (market.resolved) {
      continue;
    }

    // Exclude categories (if available in market data)
    if (market.category && criteria.excludeCategories?.includes(market.category)) {
      continue;
    }

    // Exclude contracts with problematic keywords in the question
    const questionLower = market.question.toLowerCase();
    const excludeKeywords = (criteria.excludeKeywords || []).map(k => k.toLowerCase());
    const hasExcludedKeyword = excludeKeywords.some(keyword => questionLower.includes(keyword));
    if (hasExcludedKeyword) {
      continue;
    }

    // Only include simple yes/no markets (exclude complex multi-question markets)
    if (!isSimpleYesNoMarket(market.question)) {
      continue;
    }

    candidates.push(market);
  }

  console.log(`   📊 Found ${candidates.length} high-conviction candidates after filtering`);

  // STEP 3: Enrich candidates with orderbook data for true liquidity
  // Only fetch orderbook for the filtered candidates (much more efficient)
  const enrichedContracts: Contract[] = [];
  const enrichmentErrors: string[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const market = candidates[i];
    
    try {
      // Fetch orderbook to get true liquidity (contracts available at best price)
      const { liquidity, side } = await getOrderbookWithLiquidity(market.market_id);
      
      // Filter by minimum liquidity (contracts available, not dollar volume)
      // Convert liquidity (contracts) to approximate dollar value for comparison
      // Each contract is worth $1 at resolution, so liquidity in contracts ≈ liquidity in dollars
      if (liquidity < criteria.minLiquidity) {
        continue;
      }

      // Convert to Contract format
      const contract: Contract = {
        id: '', // Will be set when saved to DB
        market_id: market.market_id,
        question: market.question,
        end_date: market.end_date,
        current_odds: market.yes_odds,
        liquidity: liquidity, // True liquidity from orderbook (contracts available)
        volume_24h: market.volume_24h,
        category: market.category,
        discovered_at: new Date(),
      };

      enrichedContracts.push(contract);

      // Log progress every 10 markets
      if ((i + 1) % 10 === 0 || (i + 1) === candidates.length) {
        console.log(`   📈 Enriched ${i + 1}/${candidates.length} candidates... (${enrichedContracts.length} passed liquidity filter)`);
      }
    } catch (error: any) {
      enrichmentErrors.push(`${market.market_id}: ${error.message}`);
      // Continue with next market even if one fails
      continue;
    }
  }

  if (enrichmentErrors.length > 0) {
    console.warn(`   ⚠️ ${enrichmentErrors.length} markets failed enrichment (likely resolved or inactive)`);
    if (enrichmentErrors.length <= 5) {
      enrichmentErrors.forEach(err => console.warn(`      ${err}`));
    }
  }

  // Sort by liquidity (highest first) - true orderbook depth
  enrichedContracts.sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0));

  console.log(`   ✅ Found ${enrichedContracts.length} qualifying contracts with sufficient liquidity`);
  return enrichedContracts;
}
