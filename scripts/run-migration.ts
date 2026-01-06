/**
 * Supabase Migration Runner
 * Runs all pending migrations against Supabase database
 * Can be run manually or via deployment hook
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runMigration(filename: string): Promise<void> {
  const migrationPath = join(process.cwd(), 'lib/database/migrations', filename);
  
  try {
    const sql = readFileSync(migrationPath, 'utf-8');
    console.log(`📄 Running migration: ${filename}`);
    
    // Split by semicolon and execute statements
    // Note: Supabase client doesn't support raw SQL directly
    // We'll use the REST API or pg client
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Fallback: Try using the PostgREST API
      // For now, log and suggest manual execution
      console.warn(`⚠️  Could not execute via RPC. Error: ${error.message}`);
      console.log('💡 To run this migration manually:');
      console.log(`   1. Go to Supabase Dashboard → SQL Editor`);
      console.log(`   2. Copy the contents of: ${migrationPath}`);
      console.log(`   3. Paste and execute in the SQL Editor`);
      throw error;
    }
    
    console.log(`✅ Migration ${filename} completed successfully`);
  } catch (error: any) {
    console.error(`❌ Migration ${filename} failed:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database migrations...\n');
  
  const migrations = [
    '001_initial_schema.sql',
    '002_enhance_ai_learning.sql',
  ];
  
  for (const migration of migrations) {
    try {
      await runMigration(migration);
      console.log('');
    } catch (error) {
      console.error(`\n❌ Failed to run migration: ${migration}`);
      console.error('Migration runner will exit. Please resolve errors and try again.');
      process.exit(1);
    }
  }
  
  console.log('✅ All migrations completed successfully!');
}

if (require.main === module) {
  main().catch(console.error);
}

export { runMigration };

