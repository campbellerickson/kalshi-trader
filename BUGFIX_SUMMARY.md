# Kalshi Order Placement Bug - FIXED

## Problem
All order submissions to Kalshi API were failing with **"400 invalid order"** error.

## Root Cause
The Kalshi API requires the `yes_price` or `no_price` parameter **even for market orders**.

Our code was only including the price parameter for limit orders:
```typescript
// OLD CODE - BROKEN
if (orderType === 'limit') {
  if (side === 'yes') {
    orderRequest.yes_price = orderPrice;
  } else {
    orderRequest.no_price = orderPrice;
  }
}
// Market orders had NO price parameter - this caused the 400 error
```

## Solution
Always include the price parameter regardless of order type:
```typescript
// NEW CODE - FIXED
// IMPORTANT: Kalshi requires price parameter even for market orders!
if (side === 'yes') {
  orderRequest.yes_price = orderPrice; // Always include
} else {
  orderRequest.no_price = orderPrice; // Always include
}
```

## Test Results
✅ Successfully placed test order on Jan 7, 2026 at 5:49 PM
- Market: KXNCAAMBGAME-26JAN08RUTGILL-RUTG (Rutgers game)
- Side: YES
- Amount: 1 contract
- Price: 10 cents
- **Status: EXECUTED** (filled immediately like a market order should)
- Cost: 7 cents + 1 cent fee = 8 cents total

## Deployment
- Commit: 12e4651
- Deployed to: production (automated-trader-git-main-campbellericksons-projects.vercel.app)
- Date: Jan 7, 2026

## Impact
- All future order placements will succeed
- AI can now execute trades automatically
- No more "400 invalid order" errors
