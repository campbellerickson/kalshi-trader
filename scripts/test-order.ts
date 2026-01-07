/**
 * Test script to debug Kalshi order placement
 *
 * Setup:
 * 1. Add credentials to .env.local:
 *    KALSHI_API_KEY=your-api-key
 *    KALSHI_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
 *
 * 2. Run with: npx tsx scripts/test-order.ts
 */

import { Configuration, OrdersApi, PortfolioApi } from 'kalshi-typescript';

// Read credentials from environment variables
const KALSHI_API_KEY = process.env.KALSHI_API_KEY;
const KALSHI_PRIVATE_KEY = process.env.KALSHI_PRIVATE_KEY;

if (!KALSHI_API_KEY || !KALSHI_PRIVATE_KEY) {
  console.error('❌ Missing credentials!');
  console.error('Please set KALSHI_API_KEY and KALSHI_PRIVATE_KEY in .env.local');
  process.exit(1);
}

const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

// Normalize PEM key (same as production code)
function normalizePemKey(raw: string): string {
  let key = (raw ?? '').trim();

  // Strip surrounding quotes if present
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  // Convert escaped newlines to real newlines
  key = key.replace(/\\n/g, '\n');

  // Normalize CRLF
  key = key.replace(/\r\n/g, '\n');

  return key;
}

async function testOrderPlacement() {
  console.log('🧪 Testing Kalshi order placement...\n');

  // Initialize SDK - EXACTLY the same as production code
  const privateKeyPem = normalizePemKey(KALSHI_PRIVATE_KEY);

  const config = new Configuration({
    apiKey: KALSHI_API_KEY,
    privateKeyPem: privateKeyPem,
    basePath: KALSHI_API_BASE,
  });

  const ordersApi = new OrdersApi(config);
  const portfolioApi = new PortfolioApi(config);

  // Cancel any existing orders first
  console.log('🧹 Canceling any existing resting orders...');
  try {
    const ordersResponse = await portfolioApi.getOrders({ status: 'resting' });
    const orders = (ordersResponse.data as any).orders || [];
    for (const order of orders) {
      console.log(`   Canceling order ${order.order_id}...`);
      await ordersApi.cancelOrder(order.order_id);
    }
    console.log(`✅ Canceled ${orders.length} orders\n`);
  } catch (err) {
    console.log('   (No orders to cancel)\n');
  }

  // Test market - we'll try to place a very small order
  const testMarket = 'KXNCAAMBGAME-26JAN08RUTGILL-RUTG'; // Rutgers market from the error logs

  console.log('📊 Test Market:', testMarket);
  console.log('💰 Order size: 1 contract (minimum)');
  console.log('📈 Order type: market');
  console.log();

  // Test 1: Try a market order WITH price (Kalshi requires price even for market orders)
  console.log('Test 1: Market order for YES side with yes_price');
  console.log('───────────────────────────────────────────────────');

  const marketOrderRequest = {
    ticker: testMarket,
    side: 'yes' as 'yes',
    action: 'buy' as 'buy',
    count: 1,
    type: 'market',
    yes_price: 10, // Market orders still need a price in Kalshi API
  };

  console.log('Request:', JSON.stringify(marketOrderRequest, null, 2));

  try {
    const response = await ordersApi.createOrder(marketOrderRequest);
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('❌ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error message:', error.message);
    console.log();

    // Test 2: Try with a limit order instead
    console.log('Test 2: Limit order for YES side at 5 cents');
    console.log('──────────────────────────────────────────────');

    const limitOrderRequest = {
      ticker: testMarket,
      side: 'yes' as 'yes',
      action: 'buy' as 'buy',
      count: 1,
      type: 'limit',
      yes_price: 5, // 5 cents
    };

    console.log('Request:', JSON.stringify(limitOrderRequest, null, 2));

    try {
      const response2 = await ordersApi.createOrder(limitOrderRequest);
      console.log('✅ SUCCESS!');
      console.log('Response:', JSON.stringify(response2.data, null, 2));
    } catch (error2: any) {
      console.log('❌ FAILED');
      console.log('Status:', error2.response?.status);
      console.log('Error data:', JSON.stringify(error2.response?.data, null, 2));
      console.log('Error message:', error2.message);
    }
  }
}

testOrderPlacement().catch(console.error);
