# Polymarket Trader - Setup Guide

This guide will walk you through setting up the Polymarket Automated Trading System from scratch.

## Prerequisites

- Node.js 18+ installed
- A GitHub account
- A Vercel account (free tier works)
- A Supabase account (free tier works)
- API keys for the services below

## Step 1: Clone and Initialize

```bash
cd /Users/campbellerickson/Desktop/Code/polymarket-trader
npm install
```

## Step 2: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is ready, go to the SQL Editor
3. Copy and paste the contents of `lib/database/migrations/001_initial_schema.sql`
4. Run the migration
5. Note your project URL and anon key from Settings > API

## Step 3: Get API Keys

### Polymarket API

1. Go to [Polymarket](https://polymarket.com)
2. Create an account and complete KYC if required
3. Navigate to API settings (or contact Polymarket support for API access)
4. Generate API key and private key
5. Note your wallet address

**Note**: Polymarket API access may require approval. Check their documentation for current requirements.

### Anthropic Claude API

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### Twilio (SMS Notifications) - Optional

1. Go to [twilio.com](https://twilio.com)
2. Sign up for a free trial account
3. Get a phone number from the Twilio Console
4. Note your Account SID and Auth Token from the dashboard

### SendGrid (Email Notifications) - Optional

1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for a free account
3. Verify your sender email address
4. Create an API key in Settings > API Keys
5. Copy the API key

## Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Polymarket API
POLYMARKET_API_KEY=your_polymarket_api_key_here
POLYMARKET_PRIVATE_KEY=your_polymarket_private_key_here
POLYMARKET_WALLET_ADDRESS=your_wallet_address_here

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key-here

# Security
CRON_SECRET=generate-a-random-secret-string-here
# You can generate one with: openssl rand -base64 32

# Notifications (Optional)
NOTIFICATION_EMAIL=your-email@example.com
SENDGRID_API_KEY=your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=reports@yourdomain.com
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
ADMIN_PHONE_NUMBER=+1234567890
ADMIN_EMAIL=your-admin-email@example.com

# Trading Parameters
DAILY_BUDGET=100
MIN_ODDS=0.90
MAX_ODDS=0.98
MAX_DAYS_TO_RESOLUTION=2
MIN_LIQUIDITY=10000
INITIAL_BANKROLL=1000

# Safety Features
DRY_RUN=true
# Set to false when ready to trade with real money
```

## Step 5: Set Up Notification Preferences

After deploying, you'll need to set up notification preferences in the database:

```sql
INSERT INTO notification_preferences (user_id, phone_number, email, report_time, timezone, enabled)
VALUES ('default', '+1234567890', 'your-email@example.com', '07:00:00', 'America/New_York', true);
```

Replace with your actual phone number and email.

## Step 6: Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link your project: `vercel link`
4. Add all environment variables to Vercel:

```bash
vercel env add POLYMARKET_API_KEY
vercel env add POLYMARKET_PRIVATE_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_KEY
vercel env add CRON_SECRET
# ... add all other environment variables
```

5. Deploy: `vercel --prod`

## Step 7: Configure Cron Jobs

Vercel will automatically set up cron jobs based on `vercel.json`. Verify they're active in your Vercel dashboard under Settings > Cron Jobs.

## Step 8: Test the System

### Test Daily Scan (Dry Run)

```bash
curl https://your-app.vercel.app/api/cron/daily-scan \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Morning Report

```bash
curl https://your-app.vercel.app/api/cron/morning-report \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Stop Loss Monitor

```bash
curl https://your-app.vercel.app/api/cron/stop-loss \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Step 9: Enable Live Trading

Once you've tested everything in dry run mode:

1. Update the `DRY_RUN` environment variable in Vercel to `false`
2. Ensure you have sufficient funds in your Polymarket wallet
3. Monitor the first few trades closely

## Step 10: Set Up Backtesting (Optional)

### Load Historical Data

You can backtest against historical Polymarket data. Create a JSON file with historical market data:

```json
[
  {
    "market_id": "market-123",
    "question": "Will X happen?",
    "end_date": "2024-01-15T00:00:00Z",
    "historical_odds": [
      {
        "timestamp": "2024-01-10T00:00:00Z",
        "yes_odds": 0.95,
        "no_odds": 0.05,
        "liquidity": 50000,
        "volume_24h": 10000
      }
    ],
    "resolved": true,
    "outcome": "YES",
    "resolved_at": "2024-01-15T00:00:00Z"
  }
]
```

Save as `historical-data.json` and update `lib/backtest/data-loader.ts` to load from this file.

### Run Backtest

```bash
npm run backtest 2024-01-01 2024-12-31 1000 true
```

## Troubleshooting

### Database Connection Issues

- Verify your Supabase URL and key are correct
- Check that the migration ran successfully
- Ensure your Supabase project is active

### API Errors

- Verify all API keys are correct
- Check API rate limits
- Ensure Polymarket API access is approved

### Cron Jobs Not Running

- Check Vercel cron job configuration
- Verify CRON_SECRET matches in environment variables
- Check Vercel logs for errors

### Notifications Not Sending

- Verify Twilio/SendGrid credentials
- Check notification preferences in database
- Ensure phone numbers are in E.164 format (+1234567890)

## Security Notes

- **Never commit `.env` file to git**
- **Use strong, random CRON_SECRET**
- **Keep API keys secure**
- **Start with DRY_RUN=true**
- **Monitor first trades closely**
- **Set up circuit breakers**

## Support

For issues or questions:
1. Check the logs in Vercel dashboard
2. Review database for error records
3. Test individual components manually

## Next Steps

- Set up monitoring dashboard
- Configure additional alerting
- Fine-tune trading parameters
- Add more sophisticated risk management
- Implement additional backtesting strategies

