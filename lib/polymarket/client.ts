import { env } from '../../config/env';
import { Market, Orderbook } from '../../types';

const POLYMARKET_API_BASE = 'https://clob.polymarket.com';

export async function fetchMarkets(): Promise<Market[]> {
  const response = await fetch(`${POLYMARKET_API_BASE}/markets`, {
    headers: {
      'Authorization': `Bearer ${env.POLYMARKET_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Polymarket API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Transform Polymarket API response to our Market format
  return data.map((market: any) => ({
    market_id: market.id || market.market_id,
    question: market.question || market.title,
    end_date: new Date(market.end_date || market.endDate),
    yes_odds: parseFloat(market.yes_odds || market.yesOdds || 0),
    no_odds: parseFloat(market.no_odds || market.noOdds || 0),
    liquidity: parseFloat(market.liquidity || 0),
    volume_24h: parseFloat(market.volume_24h || market.volume24h || 0),
    resolved: market.resolved || false,
    outcome: market.outcome,
    final_odds: market.final_odds ? parseFloat(market.final_odds) : undefined,
    resolved_at: market.resolved_at ? new Date(market.resolved_at) : undefined,
  }));
}

export async function getMarket(marketId: string): Promise<Market> {
  const response = await fetch(`${POLYMARKET_API_BASE}/markets/${marketId}`, {
    headers: {
      'Authorization': `Bearer ${env.POLYMARKET_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch market: ${response.statusText}`);
  }

  const market = await response.json();
  
  return {
    market_id: market.id || market.market_id,
    question: market.question || market.title,
    end_date: new Date(market.end_date || market.endDate),
    yes_odds: parseFloat(market.yes_odds || market.yesOdds || 0),
    no_odds: parseFloat(market.no_odds || market.noOdds || 0),
    liquidity: parseFloat(market.liquidity || 0),
    volume_24h: parseFloat(market.volume_24h || market.volume24h || 0),
    resolved: market.resolved || false,
    outcome: market.outcome,
    final_odds: market.final_odds ? parseFloat(market.final_odds) : undefined,
    resolved_at: market.resolved_at ? new Date(market.resolved_at) : undefined,
  };
}

export async function getOrderbook(marketId: string): Promise<Orderbook> {
  const response = await fetch(`${POLYMARKET_API_BASE}/markets/${marketId}/orderbook`, {
    headers: {
      'Authorization': `Bearer ${env.POLYMARKET_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch orderbook: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    market_id: marketId,
    bestYesBid: parseFloat(data.best_yes_bid || data.bestYesBid || 0),
    bestYesAsk: parseFloat(data.best_yes_ask || data.bestYesAsk || 0),
    bestNoBid: parseFloat(data.best_no_bid || data.bestNoBid || 0),
    bestNoAsk: parseFloat(data.best_no_ask || data.bestNoAsk || 0),
  };
}

export async function placeOrder(order: {
  market: string;
  side: 'YES' | 'NO' | 'SELL_YES' | 'SELL_NO';
  amount: number;
  price: number;
}): Promise<any> {
  if (process.env.DRY_RUN === 'true') {
    console.log('🧪 DRY RUN: Would place order:', order);
    return { id: 'dry-run-order', status: 'filled' };
  }

  const response = await fetch(`${POLYMARKET_API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.POLYMARKET_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      market: order.market,
      side: order.side,
      amount: order.amount.toString(),
      price: order.price.toString(),
      // Add signature if required by Polymarket API
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to place order: ${error}`);
  }

  return await response.json();
}

