# Vercel Environment Variables Setup

Add these environment variables to your Vercel project settings:

## Required Environment Variables

### Kalshi API
```
KALSHI_API_ID=9064b32b-a1d8-414a-8a56-f02d140696c9
KALSHI_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
[Your private key here]
-----END RSA PRIVATE KEY-----
```

### Vercel AI Gateway
```
VERCEL_AI_GATEWAY_KEY=vck_3ruMO8EXGbLiZA3f5EuJMMupuPy4KVHm3AGxsNDZLJ3z48kfGj4UUzEk
```

### Supabase Database
```
SUPABASE_URL=https://dseoabejewthjyyxmdwp.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZW9hYmVqZXd0aGp5eXhtZHdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyMDk1NSwiZXhwIjoyMDgzMjk2OTU1fQ.NB5A3J5Ni_trYMI2RwqrVa_W9IYawj9hfOAYsZy-JFU
```

### Security
```
CRON_SECRET=[Generate a random secret string for cron job authentication]
```

### Trading Parameters (Optional - defaults shown)
```
DAILY_BUDGET=100
MIN_ODDS=0.90
MAX_ODDS=0.98
MAX_DAYS_TO_RESOLUTION=2
MIN_LIQUIDITY=10000
DRY_RUN=false
INITIAL_BANKROLL=1000
```

## Setup Instructions

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add each variable above
4. For `KALSHI_PRIVATE_KEY`, paste the entire key including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`
5. For `CRON_SECRET`, generate a secure random string (you can use: `openssl rand -base64 32`)

## Database Migration

After setting up environment variables, run the database migration:

1. Connect to your Supabase database
2. Run the SQL from `lib/database/migrations/001_initial_schema.sql`
3. This will create all necessary tables and indexes

## Verification

Once deployed, verify:
- ✅ Dashboard loads at `https://your-project.vercel.app`
- ✅ Cron jobs are scheduled in Vercel dashboard
- ✅ Database tables are created in Supabase
