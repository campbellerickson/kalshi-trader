import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrdersApi } from '../../../lib/kalshi/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🔍 Checking current order status on Kalshi...');

  const ordersApi = getOrdersApi();

  try {
    const response = await ordersApi.getOrders();
    const orders = (response.data as any).orders || [];

    console.log(`Found ${orders.length} total orders`);

    // Group by status
    const byStatus: Record<string, any[]> = {};
    orders.forEach((order: any) => {
      const status = order.status || 'unknown';
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(order);
    });

    // Print summary
    Object.keys(byStatus).forEach(status => {
      console.log(`${status.toUpperCase()}: ${byStatus[status].length} orders`);
    });

    return res.status(200).json({
      success: true,
      total: orders.length,
      by_status: Object.fromEntries(
        Object.entries(byStatus).map(([status, orders]) => [status, orders.length])
      ),
      orders: orders.map((o: any) => ({
        order_id: o.order_id,
        ticker: o.ticker,
        side: o.side,
        status: o.status,
        count: o.count,
        remaining_count: o.remaining_count,
        created_time: o.created_time,
      })),
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({
      error: error.message,
    });
  }
}
