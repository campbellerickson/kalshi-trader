import { getOrdersApi } from '../lib/kalshi/client';

async function cancelAllOrders() {
  console.log('🛑 Cancelling all open Kalshi orders...\n');

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

    console.log(`Found ${openOrders.length} open orders to cancel\n`);

    if (openOrders.length === 0) {
      console.log('✅ No open orders to cancel');
      return;
    }

    // Cancel each order
    let cancelled = 0;
    for (const order of openOrders) {
      try {
        console.log(`Cancelling order ${order.order_id}:`);
        console.log(`  Market: ${order.ticker}`);
        console.log(`  Side: ${order.side}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Amount: ${order.count} contracts`);

        await ordersApi.cancelOrder(order.order_id);
        console.log(`  ✅ Cancelled\n`);
        cancelled++;
      } catch (error: any) {
        console.error(`  ❌ Failed to cancel: ${error.message}\n`);
      }
    }

    console.log(`\n✅ Cancelled ${cancelled}/${openOrders.length} orders`);

  } catch (error: any) {
    console.error('❌ Error fetching orders:', error.message);
    throw error;
  }
}

// Export for module usage
export { cancelAllOrders };

// Run if executed directly
if (require.main === module) {
  cancelAllOrders()
    .then(() => {
      console.log('\n✅ Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error);
      process.exit(1);
    });
}
