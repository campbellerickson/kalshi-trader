const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase PostgreSQL connection
const client = new Client({
  host: 'db.dseoabejewthjyyxmdwp.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'eVxD1cfw7IDn2haz',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    console.log('\n📦 Reading migration file...');
    const migrationPath = path.join(__dirname, '../lib/database/migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration...\n');
    
    // Execute the entire migration
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Check for stop_loss_config
    const configCheck = await client.query('SELECT * FROM stop_loss_config LIMIT 1');
    if (configCheck.rows.length > 0) {
      console.log('\n✅ Stop loss config initialized');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigration();

