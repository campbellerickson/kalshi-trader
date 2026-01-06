const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase connection
const supabaseUrl = 'https://dseoabejewthjyyxmdwp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZW9hYmVqZXd0aGp5eXhtZHdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyMDk1NSwiZXhwIjoyMDgzMjk2OTU1fQ.NB5A3J5Ni_trYMI2RwqrVa_W9IYawj9hfOAYsZy-JFU';

async function runMigration() {
  console.log('📦 Reading migration file...');
  const migrationPath = path.join(__dirname, '../lib/database/migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  // Use Supabase REST API to execute SQL
  console.log('🔌 Connecting to Supabase...');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim().length === 0) continue;
    
    try {
      // Use Supabase REST API to execute SQL via rpc
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ query: statement }),
      });
      
      if (!response.ok) {
        // Try alternative approach - execute via direct SQL endpoint
        const altResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: statement }),
        });
        
        if (!altResponse.ok) {
          const errorText = await altResponse.text();
          console.log(`⚠️  Statement ${i + 1} may have failed (continuing): ${errorText.substring(0, 100)}`);
        } else {
          console.log(`✅ Statement ${i + 1} executed`);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed`);
      }
    } catch (err) {
      console.log(`⚠️  Statement ${i + 1} error (continuing): ${err.message}`);
    }
  }
  
  console.log('\n📋 Migration script complete!');
  console.log('\n⚠️  Note: Supabase requires SQL to be run via their SQL Editor.');
  console.log('Please copy the migration SQL and run it in the Supabase dashboard:');
  console.log('https://supabase.com/dashboard/project/dseoabejewthjyyxmdwp/sql\n');
}

runMigration().catch(console.error);

