/**
 * Supabase Migration Script
 * Connects directly to Supabase and runs SQL migrations
 * 
 * Usage: 
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/apply-migrations-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Set these environment variables and try again.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runSQL(sql) {
  // Supabase doesn't have a direct SQL execution endpoint
  // We'll need to use the REST API or provide instructions for manual execution
  // For now, output the SQL for manual execution or use a Postgres client
  
  console.log('📝 SQL to execute:');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('');
  console.log('💡 To execute this migration:');
  console.log('   1. Go to Supabase Dashboard → SQL Editor');
  console.log('   2. Copy the SQL above');
  console.log('   3. Paste and execute');
  console.log('');
}

async function applyMigration(filename) {
  const migrationPath = path.join(__dirname, '..', 'lib', 'database', 'migrations', filename);
  
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  console.log(`\n📄 Migration: ${filename}`);
  console.log('═'.repeat(60));
  
  await runSQL(sql);
  
  console.log(`✅ Migration ${filename} prepared`);
}

async function main() {
  console.log('🚀 Preparing Supabase Migrations\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL.substring(0, 30)}...`);
  console.log('');
  
  const migrations = [
    '001_initial_schema.sql',
    '002_enhance_ai_learning.sql',
  ];
  
  for (const migration of migrations) {
    try {
      await applyMigration(migration);
    } catch (error) {
      console.error(`\n❌ Failed to process migration: ${migration}`);
      console.error(error.message);
      process.exit(1);
    }
  }
  
  console.log('\n✅ All migrations prepared!');
  console.log('\n📋 Next steps:');
  console.log('   1. Copy the SQL from above');
  console.log('   2. Go to Supabase Dashboard → SQL Editor');
  console.log('   3. Paste and execute each migration');
  console.log('');
}

main().catch(console.error);

