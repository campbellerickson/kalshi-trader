#!/bin/bash
# Supabase Migration Runner Script
# Connects to Supabase and runs migration SQL

set -e

SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL}}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_KEY}}"
MIGRATION_FILE="${1:-MIGRATIONS_COMPLETE.sql}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  echo "Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ./scripts/run-supabase-migration.sh [migration-file.sql]"
  exit 1
fi

echo "🚀 Running Supabase migration: $MIGRATION_FILE"
echo "📍 Supabase URL: ${SUPABASE_URL:0:30}..."
echo ""

# Use psql if available, otherwise provide instructions
if command -v psql &> /dev/null; then
  # Extract connection details from URL
  # Format: postgres://user:pass@host:port/dbname
  DB_URL="${SUPABASE_URL/postgres:\/\//}"
  
  echo "📝 Executing migration SQL..."
  cat "$MIGRATION_FILE" | psql "$SUPABASE_URL"
  echo "✅ Migration completed!"
else
  echo "⚠️  psql not found. Cannot execute migration directly."
  echo ""
  echo "💡 To run this migration manually:"
  echo "   1. Go to Supabase Dashboard → SQL Editor"
  echo "   2. Open file: $MIGRATION_FILE"
  echo "   3. Copy and paste the SQL"
  echo "   4. Execute"
  echo ""
  echo "Or install PostgreSQL client:"
  echo "   brew install postgresql  # macOS"
  echo "   apt-get install postgresql-client  # Ubuntu/Debian"
fi

