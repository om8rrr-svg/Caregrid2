#!/usr/bin/env node

// Script to fix clinic active status on production database
// This will be run locally but connect to production DB

const { Pool } = require('pg');

// Production DATABASE_URL - you'll need to set this as environment variable
const DATABASE_URL = process.env.DATABASE_URL || process.env.RENDER_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.log('Please set DATABASE_URL environment variable with production database connection string');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixClinicStatus() {
  try {
    console.log('🔍 Connecting to production database...');
    
    // Check current clinic status
    const checkQuery = `
      SELECT id, name, is_active, created_at
      FROM clinics 
      ORDER BY id;
    `;
    
    const checkResult = await pool.query(checkQuery);
    console.log(`\n📊 Found ${checkResult.rows.length} clinics:`);
    
    checkResult.rows.forEach(clinic => {
      console.log(`  - ID: ${clinic.id}, Name: ${clinic.name}, Active: ${clinic.is_active}`);
    });
    
    // Count inactive or null clinics
    const inactiveCount = checkResult.rows.filter(c => !c.is_active).length;
    console.log(`\n⚠️  ${inactiveCount} clinics are inactive or null`);
    
    if (inactiveCount > 0) {
      console.log('\n🔧 Updating inactive clinics to active...');
      
      const updateQuery = `
        UPDATE clinics 
        SET is_active = true 
        WHERE is_active IS NULL OR is_active = false;
      `;
      
      const updateResult = await pool.query(updateQuery);
      console.log(`✅ Updated ${updateResult.rowCount} clinics to active status`);
    } else {
      console.log('✅ All clinics are already active');
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const verifyResult = await pool.query(checkQuery);
    const stillInactive = verifyResult.rows.filter(c => !c.is_active).length;
    
    if (stillInactive === 0) {
      console.log('✅ All clinics are now active!');
    } else {
      console.log(`❌ ${stillInactive} clinics are still inactive`);
    }
    
    // Test the original query that was failing
    console.log('\n🧪 Testing original API query...');
    const testQuery = `
      SELECT 
        c.id,
        c.name,
        c.type,
        c.is_active,
        c.rating,
        c.is_premium
      FROM clinics c
      WHERE c.is_active = true OR c.is_active IS NULL
      ORDER BY c.rating DESC, c.name ASC
      LIMIT 10;
    `;
    
    const testResult = await pool.query(testQuery);
    console.log(`✅ Original query now returns ${testResult.rows.length} clinics`);
    
    if (testResult.rows.length > 0) {
      console.log('\n📋 Sample results:');
      testResult.rows.slice(0, 3).forEach(clinic => {
        console.log(`  - ${clinic.name} (ID: ${clinic.id}, Active: ${clinic.is_active}, Rating: ${clinic.rating})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

fixClinicStatus();