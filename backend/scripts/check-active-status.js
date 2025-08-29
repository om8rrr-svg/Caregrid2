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

async function checkActiveStatus() {
  const client = new Client(config);
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    
    // Check is_active values
    console.log('\n📊 Checking is_active status:');
    const activeResult = await client.query(`
      SELECT 
        id, name, is_active,
        CASE 
          WHEN is_active IS NULL THEN 'NULL'
          WHEN is_active = true THEN 'TRUE'
          WHEN is_active = false THEN 'FALSE'
        END as status
      FROM clinics 
      ORDER BY name
    `);
    
    console.log(`   Total clinics: ${activeResult.rows.length}`);
    activeResult.rows.forEach(row => {
      console.log(`   - ${row.name}: is_active = ${row.status}`);
    });
    
    // Test the filter condition
    console.log('\n🔍 Testing filter condition:');
    const filterResult = await client.query(`
      SELECT COUNT(*) as count
      FROM clinics 
      WHERE (is_active = true OR is_active IS NULL)
    `);
    
    console.log(`   Clinics matching filter: ${filterResult.rows[0].count}`);
    
    // Update all clinics to be active
    console.log('\n🔄 Setting all clinics to active...');
    const updateResult = await client.query(`
      UPDATE clinics 
      SET is_active = true 
      WHERE is_active IS NULL OR is_active = false
    `);
    
    console.log(`   Updated ${updateResult.rowCount} clinics`);
    
    // Verify the update
    const verifyResult = await client.query(`
      SELECT COUNT(*) as count
      FROM clinics 
      WHERE is_active = true
    `);
    
    console.log(`   ✅ Active clinics now: ${verifyResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  } finally {
    if (client._connected) {
      await client.end();
    }
  }
}

if (require.main === module) {
  checkActiveStatus();
}

module.exports = { checkActiveStatus };