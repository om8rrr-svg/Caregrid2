#!/usr/bin/env node

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

async function testConnection() {
  console.log('🔍 Testing Database Connection');
  console.log('============================\n');
  
  if (databaseUrl) {
    console.log('🔗 Using DATABASE_URL connection string');
    console.log(`📍 URL: ${databaseUrl.substring(0, 20)}...`);
  } else {
    console.log('🔗 Using individual DB environment variables');
    console.log(`📍 Host: ${config.host}:${config.port}`);
    console.log(`📍 Database: ${config.database}`);
    console.log(`📍 User: ${config.user}`);
  }
  
  const client = new Client(config);
  
  try {
    console.log('\n🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Test the connection
    const result = await client.query('SELECT version()');
    console.log(`📊 PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📋 Tables in database: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('   ⚠️  No tables found - database needs initialization');
    }
    
    console.log('\n✅ Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  testConnection();
}

module.exports = { testConnection };