#!/usr/bin/env node

const { Client } = require('pg');
require('dotenv').config();

// Database configuration for Render
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

async function debugSchema() {
  const client = new Client(config);
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    
    // Check clinics table schema
    console.log('\n📋 Clinics table schema:');
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'clinics' 
      ORDER BY ordinal_position
    `);
    
    schemaResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check if data exists
    console.log('\n📊 Data check:');
    const countResult = await client.query('SELECT COUNT(*) FROM clinics');
    console.log(`   Total clinics: ${countResult.rows[0].count}`);
    
    // Try a simple select
    console.log('\n🧪 Simple SELECT test:');
    const simpleResult = await client.query('SELECT id, name FROM clinics LIMIT 3');
    console.log(`   Returned rows: ${simpleResult.rows.length}`);
    simpleResult.rows.forEach(row => {
      console.log(`   - ID: ${row.id}, Name: ${row.name}`);
    });
    
    // Test the exact query from clinics.js
    console.log('\n🔍 Testing exact query from clinics.js:');
    try {
      const exactResult = await client.query(`
        SELECT 
          c.id, c.name, c.type, c.description, c.address, c.city, c.postcode,
          c.phone, c.email, c.website, c.rating, c.review_count, c.is_premium,
          c.logo_url, c.created_at, c.updated_at, c.frontend_id
         FROM clinics c
         ORDER BY c.is_premium DESC, c.rating DESC, c.name ASC
         LIMIT 3
      `);
      console.log(`   ✅ Query successful! Returned ${exactResult.rows.length} rows`);
      exactResult.rows.forEach(row => {
        console.log(`   - ${row.name} (${row.city})`);
      });
    } catch (queryError) {
      console.log(`   ❌ Query failed: ${queryError.message}`);
      console.log(`   Error code: ${queryError.code}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    process.exit(1);
  } finally {
    if (client._connected) {
      await client.end();
    }
  }
}

if (require.main === module) {
  debugSchema();
}

module.exports = { debugSchema };