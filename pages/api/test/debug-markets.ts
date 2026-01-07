import type { NextApiRequest, NextApiResponse } from 'next';
import { getMarketApi } from '../../../lib/kalshi/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret for security
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const marketApi = getMarketApi();
    
    // Get first page of open markets
    const response = await marketApi.getMarkets(
      10, // limit to 10 for debugging
      undefined, // cursor
      undefined, // eventTicker
      undefined, // seriesTicker
      undefined, // minCreatedTs
      undefined, // maxCreatedTs
      undefined, // maxCloseTs
      undefined, // minCloseTs
      undefined, // minSettledTs
      undefined, // maxSettledTs
      'open', // status
      undefined, // tickers
      undefined, // mveFilter
    );

    const rawMarkets = response.data.markets || [];
    
    // Return first 3 markets with all their fields
    const sampleMarkets = rawMarkets.slice(0, 3).map((market: any) => ({
      ticker: market.ticker,
      status: market.status,
      yes_bid: market.yes_bid,
      yes_bid_dollars: market.yes_bid_dollars,
      yes_ask: market.yes_ask,
      yes_ask_dollars: market.yes_ask_dollars,
      no_bid: market.no_bid,
      no_bid_dollars: market.no_bid_dollars,
      no_ask: market.no_ask,
      no_ask_dollars: market.no_ask_dollars,
      last_price: market.last_price,
      title: market.title,
      question: market.question,
      allKeys: Object.keys(market),
      priceRelatedKeys: Object.keys(market).filter(k => 
        k.toLowerCase().includes('price') || 
        k.toLowerCase().includes('bid') || 
        k.toLowerCase().includes('ask') ||
        k.toLowerCase().includes('yes') ||
        k.toLowerCase().includes('no')
      ),
    }));

    return res.status(200).json({
      totalMarkets: rawMarkets.length,
      sampleMarkets,
      message: 'First 3 open markets with all pricing fields',
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}
