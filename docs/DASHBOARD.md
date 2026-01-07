# Dashboard Documentation

## Overview

The Kalshi Trader Dashboard is a Next.js web application that provides real-time visibility into trading performance, open positions, and system activity. It consists of frontend pages, API endpoints, and supporting library functions.

## Architecture

```
Dashboard UI (pages/) → API Endpoints (pages/api/) → Database Queries (lib/database/) → Supabase Database
                                           ↓
                                    Utility Functions (lib/utils/)
```

## Frontend Pages

### `pages/index.tsx`
**Purpose:** Main dashboard page displaying trading performance and metrics

**Functionality:**
- Fetches dashboard data from `/api/dashboard` on component mount
- Displays performance metrics:
  - Current bankroll and total P&L
  - Total return percentage
  - Win rate
  - Trade status breakdown (won/lost/stopped/open)
- Shows period-based performance:
  - Month-to-Date (MTD) P&L and return
  - Year-to-Date (YTD) P&L and return
- Displays recent trades table (last 20 trades)
- Shows open positions with current odds and unrealized P&L
- Provides navigation to Logs and Docs pages

**Key Components:**
- Bankroll card showing current total
- Progress bar for trade status breakdown
- Performance metrics grid
- Recent trades table
- Open positions table

**Data Flow:**
1. Component mounts → `useEffect` triggers
2. Fetches from `/api/dashboard`
3. Parses response and sets state
4. Renders cards, tables, and metrics

---

### `pages/logs.tsx`
**Purpose:** Error logs and system activity viewer

**Functionality:**
- Fetches error logs from `/api/logs`
- Displays error log entries in a table
- Shows error type, message, timestamp, and metadata
- Provides filtering by error level (error, warning, info)
- Navigation back to dashboard

**Data Flow:**
1. Component mounts → fetches from `/api/logs`
2. Filters logs by type if needed
3. Renders log entries in table format

---

### `pages/docs.tsx`
**Purpose:** System documentation viewer

**Functionality:**
- Fetches documentation markdown from `/docs/ARCHITECTURE.md`
- Renders markdown as HTML
- Provides basic markdown rendering (headings, lists, code blocks, tables)
- Navigation back to dashboard

**Data Flow:**
1. Component mounts → fetches `/docs/ARCHITECTURE.md`
2. Converts markdown to HTML via `renderMarkdown()` function
3. Displays rendered HTML

---

### `pages/_app.tsx`
**Purpose:** Next.js app wrapper

**Functionality:**
- Imports global CSS styles
- Provides app-wide layout and styling
- Sets up root-level providers (if any)

---

## API Endpoints

### `pages/api/dashboard.ts`
**Purpose:** Main dashboard data API endpoint

**HTTP Method:** `GET`

**Functionality:**
- Aggregates data from multiple sources:
  - Recent trades (last 1000)
  - Open positions with current market data
  - Monthly analysis reports
  - Performance metrics

**Key Functions:**
1. **Fetches Trade Data:**
   - `getRecentTrades(1000)` - Gets last 1000 trades
   - `getOpenTrades()` - Gets all open trades
   - `getTradesInRange()` - Gets trades for MTD/YTD calculations

2. **Calculates Metrics:**
   - `getCurrentBankroll()` - Current account balance
   - `getInitialBankroll()` - Starting bankroll
   - `calculateTotalPnL()` - Total profit/loss from resolved trades
   - `calculateWinRate()` - Win rate percentage
   - Total return: `(totalPnL / initialBankroll) * 100`

3. **Fetches Open Positions:**
   - `getOpenPositions()` - Gets open positions
   - For each position, fetches current market data via `getMarket()`
   - Calculates unrealized P&L: `(currentValue - positionSize)`
   - Calculates unrealized P&L %: `(unrealizedPnL / positionSize) * 100`

4. **Calculates Period Metrics:**
   - **MTD (Month-to-Date):**
     - Gets trades from month start to now
     - Calculates P&L and return for month
   - **YTD (Year-to-Date):**
     - Gets trades from year start to now
     - Calculates P&L and return for year

5. **Fetches Monthly Analyses:**
   - `getAllMonthlyAnalyses()` - Gets all monthly analysis reports
   - `getMonthlyAnalysis()` - Gets specific month's analysis
   - Handles missing table gracefully (migrations not run)

**Response Format:**
```typescript
{
  currentBankroll: number,
  initialBankroll: number,
  totalPnL: number,
  totalReturn: number,
  winRate: number,
  totalTrades: number,
  openTrades: number,
  mtdPnL: number,
  mtdReturn: number,
  ytdPnL: number,
  ytdReturn: number,
  recentTrades: Trade[],
  openPositions: Position[],
  monthlyAnalyses: MonthlyAnalysis[],
  lastMonthAnalysis: MonthlyAnalysis | null
}
```

**Error Handling:**
- Returns 500 status with error message if database queries fail
- Gracefully handles missing `monthly_analysis` table

---

### `pages/api/logs.ts`
**Purpose:** Error logs API endpoint

**HTTP Method:** `GET`

**Functionality:**
- Fetches error logs from `error_logs` table
- Supports query parameters:
  - `level` - Filter by error level (error, warning, info)
  - `limit` - Limit number of results (default: 100)

**Response Format:**
```typescript
{
  logs: ErrorLog[],
  total: number,
  filtered: number
}
```

---

## Supporting Library Files

### `lib/database/queries.ts`
**Purpose:** Database query functions for dashboard data

**Key Functions:**
1. **`getRecentTrades(limit: number)`**
   - Fetches recent trades from `trades` table
   - Joins with `contracts` table to get contract details
   - Orders by `executed_at` descending
   - Returns: `Trade[]` with contract relations

2. **`getOpenTrades()`**
   - Fetches trades where `status = 'open'`
   - Joins with contracts table
   - Returns: `Trade[]` with contract relations

3. **`getOpenPositions()`**
   - Gets open trades with contract details
   - Calculates basic position data
   - Returns: `Position[]` array

4. **`getCurrentBankroll()`**
   - Fetches current bankroll from `performance_metrics` table
   - Falls back to sum of trade P&L if no metrics exist
   - Returns: `number` (current bankroll)

5. **`getInitialBankroll()`**
   - Gets initial bankroll from `performance_metrics` table
   - Falls back to `TRADING_CONSTANTS.INITIAL_BANKROLL` if not found
   - Returns: `number` (initial bankroll)

6. **`getTradesInRange(startDate: Date, endDate: Date)`**
   - Fetches trades within date range
   - Filters by `executed_at` between start and end dates
   - Returns: `Trade[]` array

**Database Tables Used:**
- `trades` - Trade execution records
- `contracts` - Market contract details
- `performance_metrics` - Bankroll and performance data

---

### `lib/utils/metrics.ts`
**Purpose:** Performance metrics calculation utilities

**Key Functions:**
1. **`calculateTotalPnL(trades: Trade[])`**
   - Sums P&L from all resolved trades
   - Only includes trades with `status !== 'open'`
   - Returns: `number` (total P&L)

2. **`calculateWinRate(trades: Trade[])`**
   - Calculates win rate: `wins / totalResolved`
   - Only counts resolved trades (`status !== 'open'`)
   - Returns: `number` (win rate as decimal, 0-1)

3. **`calculateReturnPnL(pnl: number, initialBankroll: number)`**
   - Calculates return percentage: `(pnl / initialBankroll) * 100`
   - Returns: `number` (return percentage)

**Usage:**
- Called by `dashboard.ts` API endpoint
- Used for MTD, YTD, and total return calculations

---

### `lib/kalshi/client.ts`
**Purpose:** Kalshi API client for fetching market data

**Key Functions Used by Dashboard:**
1. **`getMarket(ticker: string)`**
   - Fetches current market data from Kalshi API
   - Used to get current odds for open positions
   - Returns: `Market` object with current `yes_odds` and `no_odds`

**Usage in Dashboard:**
- `dashboard.ts` calls `getMarket()` for each open position
- Updates position with current market odds
- Calculates unrealized P&L based on current odds

---

### `lib/analysis/monthly.ts`
**Purpose:** Monthly analysis report functions

**Key Functions:**
1. **`getAllMonthlyAnalyses()`**
   - Fetches all monthly analysis reports from `monthly_analysis_reports` table
   - Orders by year and month descending
   - Returns: `MonthlyAnalysisReport[]`

2. **`getMonthlyAnalysis(year: number, month: number)`**
   - Fetches specific month's analysis report
   - Returns: `MonthlyAnalysisReport | null`

**Usage:**
- `dashboard.ts` fetches monthly analyses for display
- Shows performance breakdown by market category/series

---

### `lib/database/client.ts`
**Purpose:** Supabase database client

**Functionality:**
- Initializes Supabase client with connection credentials
- Provides singleton instance for database queries
- Exports `supabase` client for use throughout application

**Configuration:**
- Uses environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

---

## Data Flow

### Dashboard Load Sequence

1. **User visits `/` (dashboard page)**
   - `pages/index.tsx` component mounts

2. **Frontend fetches data:**
   - `useEffect` hook triggers
   - Makes `GET` request to `/api/dashboard`

3. **API endpoint processes request:**
   - `pages/api/dashboard.ts` handler executes

4. **Database queries run:**
   - `getRecentTrades(1000)` - Fetches recent trades
   - `getOpenTrades()` - Fetches open trades
   - `getCurrentBankroll()` - Gets current bankroll
   - `getInitialBankroll()` - Gets initial bankroll
   - `getTradesInRange()` - Gets MTD/YTD trades

5. **Metrics calculated:**
   - `calculateTotalPnL()` - Calculates total profit/loss
   - `calculateWinRate()` - Calculates win rate
   - MTD/YTD calculations performed

6. **Market data fetched (for open positions):**
   - For each open position:
     - `getMarket()` - Fetches current market data from Kalshi
     - Calculates unrealized P&L
     - Updates position with current odds

7. **Response sent to frontend:**
   - JSON response with all dashboard data
   - Includes trades, positions, metrics, analyses

8. **Frontend renders:**
   - State updated with response data
   - Cards, tables, and metrics rendered
   - User sees dashboard with live data

---

## Styling

### `styles/globals.css`
**Purpose:** Global CSS styles for dashboard

**Key Features:**
- Mobile-first responsive design
- Card-based layout system
- Color-coded metrics (green for positive, red for negative)
- Progress bars for trade status breakdown
- Table styling for trades and positions
- Navigation header with links

**Design Principles:**
- Clean, minimal interface
- Easy to read on mobile devices
- Color coding for quick status recognition
- Responsive grid layouts

---

## Error Handling

### Frontend Error Handling
- `pages/index.tsx` catches fetch errors
- Displays error message if API call fails
- Shows loading state while fetching

### API Error Handling
- `pages/api/dashboard.ts` catches database errors
- Returns 500 status with error message
- Handles missing tables gracefully (monthly_analysis)

### Database Error Handling
- `lib/database/queries.ts` functions handle Supabase errors
- Returns empty arrays/null on errors
- Logs errors to console

---

## Performance Considerations

### Caching
- No client-side caching currently
- Each page load triggers fresh API call
- Could be optimized with React Query or SWR

### API Optimization
- Dashboard API aggregates multiple queries
- Could be optimized with database views or stored procedures
- Open positions fetch market data sequentially (could be parallelized)

### Database Queries
- Multiple separate queries for different data
- Could be optimized with joins or batch queries
- Consider adding database indexes on frequently queried fields

---

## Dependencies

### Frontend Dependencies
- `next` - Next.js framework
- `react` - React library
- `react-dom` - React DOM rendering

### API Dependencies
- `@supabase/supabase-js` - Supabase client
- `kalshi-typescript` - Kalshi API SDK

---

## Environment Variables

### Required
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` - Supabase API key

### Optional
- `KALSHI_API_ID` - Kalshi API ID (for market data)
- `KALSHI_PRIVATE_KEY` - Kalshi private key (for market data)

---

## Future Improvements

1. **Real-time Updates:**
   - Add WebSocket support for live updates
   - Refresh dashboard data automatically

2. **Caching:**
   - Implement client-side caching with React Query
   - Cache API responses for better performance

3. **Pagination:**
   - Add pagination for recent trades table
   - Load more trades on scroll

4. **Filtering:**
   - Add date range filtering
   - Filter trades by status or side

5. **Charts:**
   - Add performance charts (P&L over time)
   - Visualize win rate trends

6. **Export:**
   - Export trades to CSV
   - Generate PDF reports

