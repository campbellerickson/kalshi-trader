import { placeOrder, getOrderbook, waitForOrderFill, getMarket } from './client';
import { AnalysisResponse, TradeResult } from '../../types';
import { logTrade } from '../database/queries';
import { calculateContractAmount } from '../utils/kelly';
import { TRADING_CONSTANTS } from '../../config/constants';

export async function executeTrades(
  decisions: AnalysisResponse
): Promise<TradeResult[]> {
  const isForcedTrade = decisions.forcedTrade === true;

  if (isForcedTrade) {
    console.log(`💰 Attempting forced trade (will stop after first success)...`);
  } else {
    console.log(`💰 Executing ${decisions.selectedContracts.length} trades...`);
  }

  const results: TradeResult[] = [];

  for (const decision of decisions.selectedContracts) {
    // If this is a forced trade and we already have a success, stop
    if (isForcedTrade && results.some(r => r.success)) {
      console.log(`   ✅ Forced trade succeeded, skipping remaining contracts`);
      break;
    }
    try {
      console.log(`   Executing: ${decision.contract.question.substring(0, 50)}...`);
      console.log(`   Allocation: $${decision.allocation}, Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
      console.log(`   Cached odds: Yes ${(decision.contract.yes_odds * 100).toFixed(1)}% | No ${((decision.contract.no_odds || (1 - decision.contract.yes_odds)) * 100).toFixed(1)}%`);

      // 1. Fetch LIVE odds from Kalshi (cached odds may be stale/invalid)
      console.log(`   🔄 Fetching live odds from Kalshi...`);
      let liveMarket;
      try {
        liveMarket = await getMarket(decision.contract.market_id);
        console.log(`   ✅ Live odds: Yes ${(liveMarket.yes_odds * 100).toFixed(1)}% | No ${(liveMarket.no_odds * 100).toFixed(1)}%`);

        // Update decision with live odds
        decision.contract.yes_odds = liveMarket.yes_odds;
        decision.contract.no_odds = liveMarket.no_odds;
      } catch (error: any) {
        console.error(`   ❌ Failed to fetch live odds: ${error.message}`);
        throw new Error(`Cannot fetch live odds for ${decision.contract.market_id}`);
      }

      // 2. Validate odds
      const entryOdds = decision.contract.yes_odds;
      if (!entryOdds || entryOdds <= 0 || entryOdds > 1) {
        throw new Error(`Invalid odds after refresh: ${entryOdds}`);
      }

      // 2. Ensure contract is saved to database first
      const { supabase } = await import('../database/client');
      const { data: existingContract } = await supabase
        .from('contracts')
        .select('id')
        .eq('market_id', decision.contract.market_id)
        .single();

      let contractDbId: string;
      if (existingContract) {
        contractDbId = existingContract.id;
      } else {
        // Insert contract into database
        const { data: newContract } = await supabase
          .from('contracts')
          .insert({
            market_id: decision.contract.market_id,
            question: decision.contract.question,
            end_date: decision.contract.end_date,
            current_odds: entryOdds,
            category: decision.contract.category,
            liquidity: decision.contract.liquidity,
            volume_24h: decision.contract.volume_24h,
          })
          .select('id')
          .single();

        if (!newContract) {
          throw new Error('Failed to insert contract into database');
        }
        contractDbId = newContract.id;
      }

      // 3. Get current orderbook
      const orderbook = await getOrderbook(decision.contract.market_id);

      // 4. Calculate contracts to purchase
      const contracts = calculateContractAmount(
        decision.allocation,
        entryOdds
      );

      // 5. Determine which side to buy (always bet the high-probability side)
      // If yes_odds > 50%, buy YES. If yes_odds < 50% (no_odds > 50%), buy NO.
      const side = entryOdds > 0.5 ? 'YES' : 'NO';

      // Use best ask price from orderbook for limit order
      // This ensures we match with existing offers for immediate fill
      const price = side === 'YES'
        ? (orderbook.bestYesAsk || entryOdds)
        : (orderbook.bestNoAsk || (1 - entryOdds));

      console.log(`   Betting ${side} at ${(price * 100).toFixed(1)}% (fading ${side === 'YES' ? 'NO' : 'YES'} tail risk)`);
      console.log(`   Using LIMIT order at best ask price (acts like market order)`);
      console.log(`   Orderbook: YES ask=${orderbook.bestYesAsk?.toFixed(3)}, NO ask=${orderbook.bestNoAsk?.toFixed(3)}`);

      // 6. Execute limit order at best ask price (immediate fill if liquidity exists)
      const order = await placeOrder({
        market: decision.contract.market_id,
        side,
        amount: contracts,
        price, // Limit price = best ask (should fill immediately if orderbook is correct)
        type: 'limit', // Limit order for reliable fills
      });

      if (TRADING_CONSTANTS.DRY_RUN) {
        console.log('   🧪 DRY RUN: Trade simulated');
      } else {
        console.log(`   ✅ Order placed: ${order.order_id || 'unknown'}`);

        // Limit orders at best ask should fill quickly if liquidity exists
        console.log(`   ⏳ Waiting for order fill...`);
        try {
          const filledOrder = await waitForOrderFill(order.order_id, 30000, 2000); // 30s timeout, 2s polling
          console.log(`   ✅ Order filled successfully`);
        } catch (fillError: any) {
          console.error(`   ⚠️ Order did not fill within 30s: ${fillError.message}`);
          console.error(`   ⚠️ Order may be resting in orderbook - will be tracked for later fill`);
          // Don't fail the trade - order is placed and may fill later
        }
      }

      // 6. Log to database
      const trade = await logTrade({
        contract_id: contractDbId,
        entry_odds: entryOdds,
        position_size: decision.allocation,
        side, // Use dynamic side (YES if >50%, NO if <50%)
        contracts_purchased: contracts,
        ai_confidence: decision.confidence,
        ai_reasoning: decision.reasoning,
        risk_factors: decision.riskFactors && decision.riskFactors.length > 0
          ? decision.riskFactors
          : undefined,
      });
      
      results.push({ success: true, trade });
      
    } catch (error: any) {
      console.error(`   ❌ Failed to execute trade:`, error.message);
      results.push({ 
        success: false, 
        error: error.message,
        contract: decision.contract
      });
    }
  }
  
  console.log(`   ✅ Executed ${results.filter(r => r.success).length}/${results.length} trades`);
  return results;
}

