#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'postgres' // Connect to default database first
};

const targetDatabase = process.env.DB_NAME || 'caregrid_dev';

async function setupDatabase() {
  const client = new Client(config);
  
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    
    // Check if database exists
    const dbCheckResult = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDatabase]
    );
    
    if (dbCheckResult.rows.length === 0) {
      console.log(`📦 Creating database '${targetDatabase}'...`);
      await client.query(`CREATE DATABASE "${targetDatabase}"`);
      console.log('✅ Database created successfully!');
    } else {
      console.log(`📦 Database '${targetDatabase}' already exists.`);
    }
    
    await client.end();
    
    // Connect to the target database
    const targetClient = new Client({
      ...config,
      database: targetDatabase
    });
    
    await targetClient.connect();
    console.log(`🔌 Connected to database '${targetDatabase}'`);
    
    // Run migrations
    await runMigrations(targetClient);
    
    // Run seeds if enabled
    if (process.env.SEED_DATABASE === 'true' || process.argv.includes('--seed')) {
      await runSeeds(targetClient);
    }
    
    await targetClient.end();
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

async function runMigrations(client) {
  console.log('🔄 Running database migrations...');
  
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 No migrations directory found, skipping migrations.');
    return;
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  if (migrationFiles.length === 0) {
    console.log('📄 No migration files found.');
    return;
  }
  
  // Create migrations table if it doesn't exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  for (const file of migrationFiles) {
    // Check if migration has already been run
    const result = await client.query(
      'SELECT 1 FROM migrations WHERE filename = $1',
      [file]
    );
    
    if (result.rows.length > 0) {
      console.log(`⏭️  Skipping migration ${file} (already executed)`);
      continue;
    }
    
    console.log(`🔄 Running migration: ${file}`);
    
    const migrationPath = path.join(migrationsDir, file);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    try {
      await client.query('BEGIN');
      await client.query(migrationSQL);
      await client.query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
      console.log(`✅ Migration ${file} completed successfully`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${error.message}`);
    }
  }
  
  console.log('✅ All migrations completed successfully!');
}

async function runSeeds(client) {
  console.log('🌱 Running database seeds...');
  
  const seedsDir = path.join(__dirname, '..', 'seeds');
  
  if (!fs.existsSync(seedsDir)) {
    console.log('📁 No seeds directory found, skipping seeds.');
    return;
  }
  
  const seedFiles = fs.readdirSync(seedsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  if (seedFiles.length === 0) {
    console.log('📄 No seed files found.');
    return;
  }
  
  // Create seeds table if it doesn't exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS seeds (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  for (const file of seedFiles) {
    // Check if seed has already been run
    const result = await client.query(
      'SELECT 1 FROM seeds WHERE filename = $1',
      [file]
    );
    
    if (result.rows.length > 0) {
      console.log(`⏭️  Skipping seed ${file} (already executed)`);
      continue;
    }
    
    console.log(`🌱 Running seed: ${file}`);
    
    const seedPath = path.join(seedsDir, file);
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    try {
      await client.query('BEGIN');
      await client.query(seedSQL);
      await client.query(
        'INSERT INTO seeds (filename) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
      console.log(`✅ Seed ${file} completed successfully`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Seed ${file} failed: ${error.message}`);
    }
  }
  
  console.log('✅ All seeds completed successfully!');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
CareGrid Database Setup Script

Usage: node setup-database.js [options]

Options:
  --seed    Force run seeds even if SEED_DATABASE is not set to true
  --help    Show this help message

Environment Variables:
  DB_HOST           Database host (default: localhost)
  DB_PORT           Database port (default: 5432)
  DB_USER           Database user (default: postgres)
  DB_PASSWORD       Database password (required)
  DB_NAME           Target database name (default: caregrid_dev)
  SEED_DATABASE     Set to 'true' to automatically run seeds
`);
  process.exit(0);
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase, runMigrations, runSeeds };