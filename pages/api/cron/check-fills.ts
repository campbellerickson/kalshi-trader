import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrdersApi, getMarket } from '../../../lib/kalshi/client';
import { supabase } from '../../../lib/database/client';

/**
 * Hourly cron job to check if orders are filled
 * Cancels orders that haven't filled after 6 hours
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🔍 Checking order fills...');

  try {
    // 1. Get all open trades from database (only recent ones - last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { data: openTrades, error } = await supabase
      .from('trades')
      .select('*, contract:contracts(*)')
      .eq('status', 'open')
      .gte('executed_at', sevenDaysAgo.toISOString())
      .order('executed_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch open trades: ${error.message}`);
    }

    if (!openTrades || openTrades.length === 0) {
      console.log('✅ No open trades to check');
      return res.status(200).json({
        success: true,
        checked: 0,
        filled: 0,
        cancelled: 0,
      });
    }

    console.log(`Found ${openTrades.length} open trades to check (last 7 days)`);

    const ordersApi = getOrdersApi();
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    let filled = 0;
    let cancelled = 0;
    let still_open = 0;

    // 2. Check each trade's order status
    for (const trade of openTrades) {
      try {
        // First, check if market has resolved (backup to check-resolutions)
        const market = await getMarket(trade.contract.market_id);

        if (market.resolved) {
          console.log(`📊 Market resolved for trade ${trade.id}, marking as resolved`);
          const won = market.outcome === trade.side;
          const pnl = won
            ? (trade.contracts_purchased * 1.0) - trade.position_size
            : -trade.position_size;

          await supabase
            .from('trades')
            .update({
              status: won ? 'won' : 'lost',
              exit_odds: market.final_odds || (trade.side === 'YES' ? market.yes_odds : market.no_odds),
              pnl,
              resolved_at: new Date().toISOString(),
            })
            .eq('id', trade.id);

          filled++;
          continue;
        }

        // Get order from Kalshi (if we have an order ID)
        // Note: We'll need to add order_id to trades table
        const { data: allOrders } = await ordersApi.getOrders();
        const orders = (allOrders as any).orders || [];

        // Find order matching this trade's market
        const order = orders.find((o: any) =>
          o.ticker === trade.contract?.market_id &&
          new Date(o.created_time) >= new Date(trade.executed_at) &&
          new Date(o.created_time) <= new Date(new Date(trade.executed_at).getTime() + 60000) // Within 1 min
        );

        if (!order) {
          console.log(`⚠️ No order found for trade ${trade.id} (likely filled immediately)`);
          continue;
        }

        console.log(`Checking trade ${trade.id} (order ${order.order_id})`);

        // Check if filled
        if (order.status === 'filled' || order.remaining_count === 0) {
          console.log(`  ✅ Filled!`);

          // Update trade status to filled (we'll handle this in resolver)
          // For now, just count it
          filled++;
          continue;
        }

        // Check if cancelled already
        if (order.status === 'canceled' || order.status === 'cancelled') {
          console.log(`  ❌ Already cancelled`);

          // Update trade to show it was cancelled
          await supabase
            .from('trades')
            .update({
              status: 'cancelled',
              exit_odds: null,
              pnl: 0,
              resolved_at: new Date().toISOString(),
            })
            .eq('id', trade.id);

          cancelled++;
          continue;
        }

        // Check if order is >6 hours old and still resting
        const executedAt = new Date(trade.executed_at);
        if (executedAt < sixHoursAgo && order.status === 'resting') {
          console.log(`  ⏰ Order >6 hours old, cancelling...`);

          // Cancel the order
          await ordersApi.cancelOrder(order.order_id);

          // Update trade to show it was cancelled
          await supabase
            .from('trades')
            .update({
              status: 'cancelled',
              exit_odds: null,
              pnl: 0,
              resolved_at: new Date().toISOString(),
            })
            .eq('id', trade.id);

          console.log(`  ✅ Cancelled order ${order.order_id}`);
          cancelled++;
        } else {
          console.log(`  ⏳ Still resting (${order.status})`);
          still_open++;
        }

      } catch (error: any) {
        console.error(`❌ Error checking trade ${trade.id}:`, error.message);
        continue;
      }
    }

    console.log(`\n✅ Check complete:`);
    console.log(`   Filled: ${filled}`);
    console.log(`   Cancelled: ${cancelled}`);
    console.log(`   Still open: ${still_open}`);

    return res.status(200).json({
      success: true,
      checked: openTrades.length,
      filled,
      cancelled,
      still_open,
    });

  } catch (error: any) {
    console.error('❌ Fill check job failed:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
}
