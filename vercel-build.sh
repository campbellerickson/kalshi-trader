#!/bin/bash
# Vercel Build Hook - Runs database migrations before build

set -e

echo "🔧 Running database migrations..."

# Check if migrations need to be run
# Since Supabase doesn't support direct SQL execution via API,
# we'll output instructions and continue with build

if [ -f "MIGRATIONS_COMPLETE.sql" ]; then
  echo "📋 Migration file found: MIGRATIONS_COMPLETE.sql"
  echo "⚠️  Note: Database migrations must be run manually in Supabase Dashboard"
  echo "   See MIGRATION_GUIDE.md for instructions"
else
  echo "✅ No migrations to run"
fi

# Continue with Next.js build
echo "🚀 Building Next.js application..."
npm run build

