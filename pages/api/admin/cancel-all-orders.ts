import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrdersApi } from '../../../lib/kalshi/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret (same auth as trading cron)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🛑 Cancelling all open Kalshi orders...');

  const ordersApi = getOrdersApi();

  try {
    // Get all orders
    const response = await ordersApi.getOrders();
    const orders = (response.data as any).orders || [];

    console.log(`Found ${orders.length} total orders`);

    // Filter to resting/open orders only
    const openOrders = orders.filter((order: any) =>
      order.status === 'resting' ||
      order.status === 'pending' ||
      (order.status !== 'filled' && order.status !== 'canceled' && order.status !== 'cancelled')
    );

    console.log(`Found ${openOrders.length} open orders to cancel`);

    if (openOrders.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No open orders to cancel',
        cancelled: 0,
        total: orders.length,
      });
    }

    // Cancel each order
    const results = [];
    let cancelled = 0;

    for (const order of openOrders) {
      try {
        console.log(`Cancelling order ${order.order_id}:`);
        console.log(`  Market: ${order.ticker}`);
        console.log(`  Side: ${order.side}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Amount: ${order.count} contracts`);

        await ordersApi.cancelOrder(order.order_id);
        console.log(`  ✅ Cancelled`);

        cancelled++;
        results.push({
          order_id: order.order_id,
          ticker: order.ticker,
          side: order.side,
          cancelled: true,
        });
      } catch (error: any) {
        console.error(`  ❌ Failed to cancel: ${error.message}`);
        results.push({
          order_id: order.order_id,
          ticker: order.ticker,
          side: order.side,
          cancelled: false,
          error: error.message,
        });
      }
    }

    console.log(`✅ Cancelled ${cancelled}/${openOrders.length} orders`);

    return res.status(200).json({
      success: true,
      cancelled,
      total: openOrders.length,
      results,
    });

  } catch (error: any) {
    console.error('❌ Error fetching orders:', error.message);
    return res.status(500).json({
      error: error.message,
    });
  }
}
