import { getOrdersApi } from '../lib/kalshi/client';

async function checkOrderStatus() {
  console.log('🔍 Checking current order status on Kalshi...\n');

  const ordersApi = getOrdersApi();

  try {
    const response = await ordersApi.getOrders();
    const orders = (response.data as any).orders || [];

    console.log(`Found ${orders.length} total orders\n`);

    if (orders.length === 0) {
      console.log('✅ No orders found - all cancelled successfully!');
      return;
    }

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
    console.log();

    // Show details of each order
    orders.forEach((order: any, i: number) => {
      console.log(`Order ${i + 1}:`);
      console.log(`  ID: ${order.order_id}`);
      console.log(`  Market: ${order.ticker}`);
      console.log(`  Side: ${order.side}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Count: ${order.count}`);
      console.log(`  Remaining: ${order.remaining_count}`);
      console.log(`  Created: ${order.created_time}`);
      console.log();
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

checkOrderStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
