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
  
  // Retry logic for database connection
  const maxRetries = 5;
  const retryDelay = 3000; // 3 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const client = new Client(config);
    
    try {
      console.log(`🔌 Connecting to PostgreSQL (attempt ${attempt}/${maxRetries})...`);
      await client.connect();
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
      
      await client.end();
      return; // Success, exit the retry loop
      
    } catch (error) {
      console.error(`❌ Database setup attempt ${attempt} failed:`, error.message);
      if (error.code) {
        console.error(`   Error code: ${error.code}`);
      }
      
      if (client._connected) {
        await client.end();
      }
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('⚠️  All database setup attempts failed - server will continue with fallback mode');
        console.error('⚠️  Database may need manual setup or may not be ready yet');
        // Throw error to indicate failure for status tracking
        throw new Error('Database setup failed after all retry attempts');
      }
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
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    try {
      // Execute migration in a transaction
      await client.query('BEGIN');
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
      throw error;
    }
  }
  
  console.log(`\n✅ Applied ${migrationFiles.length} migrations successfully!`);
}

if (require.main === module) {
  setupRenderDatabase();
}

module.exports = { setupRenderDatabase, runMigrations };