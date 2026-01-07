/**
 * Run database migration via Supabase REST API
 * This script executes the monthly_analysis table creation
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log('🔧 Running monthly_analysis table migration...');

  // Read the migration SQL
  const migrationPath = path.join(__dirname, '../lib/database/migrations/003_monthly_analysis.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Execute via Supabase RPC (if available) or direct SQL
  // Note: Supabase REST API doesn't support arbitrary SQL execution
  // We need to use the Supabase Dashboard or create a migration function
  
  // Alternative: Use Supabase's REST API to create the table via PostgREST
  // But PostgREST doesn't support CREATE TABLE, so we'll use a workaround:
  // Create a migration function in Supabase that can be called via RPC
  
  console.log('📋 Migration SQL:');
  console.log(migrationSQL);
  console.log('');
  console.log('⚠️  Supabase REST API cannot execute CREATE TABLE statements directly.');
  console.log('📝 Please run this SQL in Supabase Dashboard → SQL Editor:');
  console.log('');
  console.log('---');
  console.log(migrationSQL);
  console.log('---');
  console.log('');
  console.log('Or use the Supabase CLI:');
  console.log('  supabase db push');
  console.log('');
  
  // Try to check if table exists
  const { data, error } = await supabase
    .from('monthly_analysis')
    .select('id')
    .limit(1);

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('not found')) {
      console.log('❌ Table does not exist. Please run the migration SQL above.');
      process.exit(1);
    } else {
      throw error;
    }
  } else {
    console.log('✅ Table already exists!');
  }
}

runMigration().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

