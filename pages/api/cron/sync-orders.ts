import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrdersApi } from '../../../lib/kalshi/client';
import { supabase } from '../../../lib/database/client';
import { logError } from '../../../lib/utils/logger';

/**
 * Daily cron job to sync order statuses from Kalshi to database
 * Runs at 10am and 4pm daily to keep dashboard data fresh
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🔄 [CRON] Syncing order statuses from Kalshi...');

  try {
    // Get all orders from Kalshi
    const ordersApi = getOrdersApi();
    const response = await ordersApi.getOrders();
    const orders = (response.data as any).orders || [];

    console.log(`   Found ${orders.length} total orders on Kalshi`);

    // Filter cancelled orders
    const cancelledOrders = orders.filter((o: any) =>
      o.status === 'canceled' || o.status === 'cancelled'
    );

    console.log(`   Found ${cancelledOrders.length} cancelled orders`);

    // Get all open trades from database
    const { data: openTrades, error } = await supabase
      .from('trades')
      .select('*, contract:contracts(*)')
      .eq('status', 'open');

    if (error) {
      throw new Error(`Failed to fetch open trades: ${error.message}`);
    }

    console.log(`   Found ${openTrades?.length || 0} open trades in database`);

    let updated = 0;

    // Match cancelled orders to open trades and update
    for (const trade of (openTrades || [])) {
      // Find matching cancelled order (by market_id and approximate time)
      const matchingOrder = cancelledOrders.find((order: any) => {
        const orderTime = new Date(order.created_time).getTime();
        const tradeTime = new Date(trade.executed_at).getTime();
        const timeDiff = Math.abs(orderTime - tradeTime);

        return (
          order.ticker === trade.contract.market_id &&
          timeDiff < 60000 // Within 1 minute
        );
      });

      if (matchingOrder) {
        console.log(`   Updating trade ${trade.id} to cancelled (order ${matchingOrder.order_id})`);

        const { error: updateError } = await supabase
          .from('trades')
          .update({
            status: 'cancelled',
            exit_odds: null,
            pnl: 0,
            resolved_at: new Date().toISOString(),
          })
          .eq('id', trade.id);

        if (updateError) {
          console.error(`   ⚠️ Failed to update trade ${trade.id}:`, updateError.message);
        } else {
          updated++;
        }
      }
    }

    console.log(`✅ [CRON] Sync complete: Updated ${updated} trades to cancelled status`);

    // Log warning if we updated trades
    if (updated > 0) {
      await logError(
        'warning',
        `Synced ${updated} cancelled orders from Kalshi to database`,
        undefined,
        {
          cancelled_orders: cancelledOrders.length,
          trades_updated: updated
        },
        'cron'
      );
    }

    return res.status(200).json({
      success: true,
      total_orders: orders.length,
      cancelled_orders: cancelledOrders.length,
      trades_updated: updated,
    });

  } catch (error: any) {
    console.error('❌ [CRON] Order sync failed:', error.message);
    await logError('error', 'Order sync cron job failed', error, {}, 'cron');

    return res.status(500).json({
      error: error.message,
    });
  }
}
