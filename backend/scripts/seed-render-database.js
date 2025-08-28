#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
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

async function seedRenderDatabase() {
  const client = new Client(config);
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    
    // Check PostgreSQL version
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', versionResult.rows[0].version.split(' ')[1]);
    
    // Load and execute seed data
    console.log('\n🌱 Loading seed data...');
    const seedPath = path.join(__dirname, '..', 'seeds', '001_sample_data.sql');
    
    if (!fs.existsSync(seedPath)) {
      console.error('❌ Seed file not found:', seedPath);
      return;
    }
    
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    // Clear existing data first
    console.log('🧹 Clearing existing data...');
    await client.query('TRUNCATE TABLE appointments, clinic_reviews, clinic_services, user_favorites, clinics, users RESTART IDENTITY CASCADE');
    
    // Execute seed data
    console.log('📥 Inserting seed data...');
    await client.query(seedSQL);
    
    // Verify data was inserted
    const clinicCount = await client.query('SELECT COUNT(*) FROM clinics');
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    
    console.log('\n✅ Seed data loaded successfully!');
    console.log(`   📊 Clinics: ${clinicCount.rows[0].count}`);
    console.log(`   👥 Users: ${userCount.rows[0].count}`);
    
    // Test a sample clinic query
    console.log('\n🧪 Testing clinic query...');
    const testQuery = await client.query(`
      SELECT id, name, city, type, rating 
      FROM clinics 
      LIMIT 3
    `);
    
    console.log('📋 Sample clinics:');
    testQuery.rows.forEach(clinic => {
      console.log(`   - ${clinic.name} (${clinic.city}) - ${clinic.type} - Rating: ${clinic.rating}`);
    });
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    if (client._connected) {
      await client.end();
    }
  }
}

if (require.main === module) {
  seedRenderDatabase();
}

module.exports = { seedRenderDatabase };