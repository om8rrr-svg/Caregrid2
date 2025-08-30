#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

// Use DATABASE_URL for Render, fallback to individual vars for local
const databaseUrl = process.env.DATABASE_URL;
const config = databaseUrl ? {
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
} : {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'caregrid'
};

async function setupRenderDatabase() {
  console.log('🏥 CareGrid Render Database Setup');
  console.log('=================================\n');
  
  if (databaseUrl) {
    console.log('🔗 Using DATABASE_URL connection string');
  } else {
    console.log('🔗 Using individual DB environment variables');
  }
  
  // Add connection retry logic with exponential backoff
  const maxRetries = 5;
  let client = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔌 Connecting to PostgreSQL... (attempt ${attempt}/${maxRetries})`);
      client = new Client(config);
      
      // Set connection timeout
      const connectPromise = client.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      console.log('✅ Connected successfully!');
      
      // Test the connection
      const result = await client.query('SELECT version()');
      console.log(`📊 PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
      
      // Run migrations
      await runMigrations(client);
      
      console.log('\n✅ Database setup completed successfully!');
      console.log('\n🎯 Next steps:');
      console.log('   1. Test the API: python3 test_api_mode.py');
      console.log('   2. Run clinic import: python3 caregrid_listings_manager.py input/test_clinics.csv');
      
      return; // Success, exit the retry loop
      
    } catch (error) {
      console.error(`❌ Database setup attempt ${attempt} failed:`, error.message);
      if (error.code) {
        console.error(`   Error code: ${error.code}`);
      }
      
      if (client && client._connected) {
        try {
          await client.end();
        } catch (endError) {
          // Ignore connection end errors
        }
      }
      
      if (attempt === maxRetries) {
        console.error('⚠️  All connection attempts failed. Server will start without database setup.');
        console.error('💡 Database setup can be attempted later via API or manual setup.');
        // Write failure status to a file for health check
        try {
          fs.writeFileSync('/tmp/db-setup-failed', JSON.stringify({
            timestamp: new Date().toISOString(),
            lastError: error.message,
            attempts: maxRetries
          }));
        } catch (writeError) {
          // Ignore write errors
        }
        // Exit successfully to avoid blocking deployment
        process.exit(0);
      }
      
      // Wait before retry with exponential backoff
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

async function runMigrations(client) {
  console.log('\n📦 Running database migrations...');
  
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('⚠️  No migrations directory found, skipping migrations.');
    return;
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  if (migrationFiles.length === 0) {
    console.log('⚠️  No migration files found.');
    return;
  }
  
  // Create migrations tracking table if it doesn't exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  for (const file of migrationFiles) {
    const version = path.basename(file, '.sql');
    
    // Check if migration already applied
    const existingMigration = await client.query(
      'SELECT version FROM schema_migrations WHERE version = $1',
      [version]
    );
    
    if (existingMigration.rows.length > 0) {
      console.log(`⏭️  Skipping ${file} (already applied)`);
      continue;
    }
    
    console.log(`🔄 Applying migration: ${file}`);
    
    const migrationPath = path.join(migrationsDir, file);
    let migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Skip UUID compatibility handling - use migration file as-is
    
    try {
      // Execute migration in a transaction
      await client.query('BEGIN');
      
      // Execute the entire migration as one statement to handle complex SQL
      await client.query(migrationSQL);
      
      await client.query(
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        [version]
      );
      await client.query('COMMIT');
      
      console.log(`✅ Applied migration: ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Failed to apply migration ${file}:`, error.message);
      
      // For initial schema migration, try to provide more helpful error info
      if (file.includes('initial') && error.message.includes('uuid')) {
        console.error('💡 Tip: This may be a UUID extension issue. The migration has been updated to handle this.');
      }
      
      throw error;
    }
  }
  
  console.log(`\n✅ Applied ${migrationFiles.length} migrations successfully!`);
}

if (require.main === module) {
  setupRenderDatabase();
}

module.exports = { setupRenderDatabase, runMigrations };