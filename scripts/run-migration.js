const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase connection
const supabaseUrl = 'https://dseoabejewthjyyxmdwp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZW9hYmVqZXd0aGp5eXhtZHdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyMDk1NSwiZXhwIjoyMDgzMjk2OTU1fQ.NB5A3J5Ni_trYMI2RwqrVa_W9IYawj9hfOAYsZy-JFU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('📦 Reading migration file...');
  const migrationPath = path.join(__dirname, '../lib/database/migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📝 Found ${statements.length} SQL statements to execute`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim().length === 0) continue;
    
    try {
      console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Try direct query if RPC doesn't work
        const { data, error: queryError } = await supabase
          .from('_migrations')
          .select('*')
          .limit(0); // This will fail but we'll catch the error
        
        // If that doesn't work, try executing via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql_query: statement }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Error executing statement ${i + 1}:`, errorText);
          // Continue with next statement
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.error(`❌ Error on statement ${i + 1}:`, err.message);
      // Continue with next statement
    }
  }
  
  console.log('\n✅ Migration completed!');
}

runMigration().catch(console.error);

