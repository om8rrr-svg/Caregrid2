const { Pool } = require('pg');
const path = require('path');

// Database configuration - use DATABASE_URL for production
const databaseUrl = process.env.DATABASE_URL;
const dbConfig = databaseUrl ? {
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
} : {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'caregrid_dev'
};

const pool = new Pool(dbConfig);

async function fixClinicActiveStatus() {
  let client;
  
  try {
    console.log('🔗 Connecting to database...');
    client = await pool.connect();
    
    // Check current status
    console.log('🔍 Checking current clinic status...');
    const statusCheck = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive,
        COUNT(CASE WHEN is_active IS NULL THEN 1 END) as null_status
      FROM clinics
    `);
    
    const stats = statusCheck.rows[0];
    console.log(`📊 Current status: ${stats.total} total, ${stats.active} active, ${stats.inactive} inactive, ${stats.null_status} null`);
    
    // Update all clinics to be active
    console.log('🔧 Setting all clinics to active status...');
    const updateResult = await client.query(`
      UPDATE clinics 
      SET is_active = true 
      WHERE is_active IS NULL OR is_active = false
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} clinics to active status`);
    
    // Verify the fix
    console.log('🔍 Verifying fix...');
    const verifyResult = await client.query(`
      SELECT name, is_active 
      FROM clinics 
      ORDER BY name
    `);
    
    console.log('📋 All clinics status:');
    verifyResult.rows.forEach(clinic => {
      console.log(`  • ${clinic.name}: ${clinic.is_active ? '✅ Active' : '❌ Inactive'}`);
    });
    
    // Test the query that was failing
    console.log('🧪 Testing the original query...');
    const testResult = await client.query(`
      SELECT COUNT(*) as count
      FROM clinics c
      WHERE c.is_active = true OR c.is_active IS NULL
    `);
    
    console.log(`🎯 Query now returns: ${testResult.rows[0].count} clinics`);
    
    console.log('🎉 Clinic active status fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('   Error code:', error.code);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixClinicActiveStatus().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { fixClinicActiveStatus };