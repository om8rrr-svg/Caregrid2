#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

async function runPerformanceMigration() {
  console.log('🚀 Running performance optimization migration...');
  
  try {
    // Read the performance indexes migration
    const migrationPath = path.join(__dirname, '..', 'migrations', '003_performance_indexes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📊 Creating performance indexes...');
    
    // Execute the migration
    await query(migrationSQL);
    
    console.log('✅ Performance indexes created successfully!');
    console.log('🎯 Database optimization completed.');
    
    // Test a sample query to verify performance
    console.log('🔍 Testing query performance...');
    const testResult = await query(`
      EXPLAIN (ANALYZE, BUFFERS) 
      SELECT a.*, c.name as clinic_name, u.first_name, u.last_name 
      FROM appointments a 
      LEFT JOIN clinics c ON a.clinic_id = c.id 
      LEFT JOIN users u ON a.user_id = u.id 
      WHERE a.status = 'confirmed' 
      ORDER BY a.appointment_date DESC 
      LIMIT 10
    `);
    
    console.log('📈 Query execution plan:');
    testResult.rows.forEach(row => {
      console.log(`   ${row['QUERY PLAN']}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Check if it's just because indexes already exist
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Some indexes already exist - this is normal.');
      console.log('✅ Performance optimization completed (indexes were already present).');
    } else {
      throw error;
    }
  }
}

if (require.main === module) {
  runPerformanceMigration()
    .then(() => {
      console.log('🎉 Performance migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Performance migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runPerformanceMigration };