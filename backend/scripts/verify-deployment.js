#!/usr/bin/env node

/**
 * Deployment Verification Script for CareGrid
 * Checks if the deployment is working correctly and diagnoses common issues
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function verifyDeployment() {
  log('🔍 CareGrid Deployment Verification', colors.blue);
  log('=====================================\n', colors.blue);
  
  const results = {
    environment: checkEnvironmentVariables(),
    database: await checkDatabaseConnection(),
    migrations: await checkMigrations(),
    endpoints: checkRequiredFiles()
  };
  
  // Print summary
  log('\n📋 Verification Summary', colors.blue);
  log('=======================\n', colors.blue);
  
  const allPassed = Object.values(results).every(result => result.status === 'passed');
  
  Object.entries(results).forEach(([test, result]) => {
    const icon = result.status === 'passed' ? '✅' : '❌';
    const color = result.status === 'passed' ? colors.green : colors.red;
    log(`${icon} ${test.toUpperCase()}: ${result.status}`, color);
    
    if (result.issues && result.issues.length > 0) {
      result.issues.forEach(issue => log(`   ⚠️  ${issue}`, colors.yellow));
    }
    
    if (result.recommendations && result.recommendations.length > 0) {
      result.recommendations.forEach(rec => log(`   💡 ${rec}`, colors.blue));
    }
  });
  
  log(`\n🎯 Overall Status: ${allPassed ? 'READY FOR DEPLOYMENT' : 'NEEDS ATTENTION'}`, 
      allPassed ? colors.green : colors.red);
  
  if (!allPassed) {
    log('\n📞 Need help? Check the deployment documentation or contact support.', colors.yellow);
  }
  
  return allPassed;
}

function checkEnvironmentVariables() {
  const required = [
    'NODE_ENV',
    'PORT',
    'JWT_SECRET'
  ];
  
  const database = [
    'DATABASE_URL',
    // OR individual DB vars
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'
  ];
  
  const optional = [
    'FRONTEND_URL',
    'CORS_ORIGIN',
    'EMAIL_SERVICE',
    'EMAIL_USER',
    'EMAIL_PASSWORD'
  ];
  
  const issues = [];
  const recommendations = [];
  
  // Check required variables
  required.forEach(key => {
    if (!process.env[key]) {
      issues.push(`Missing required environment variable: ${key}`);
    }
  });
  
  // Check database configuration
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasIndividualDbVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
    .every(key => !!process.env[key]);
  
  if (!hasDatabaseUrl && !hasIndividualDbVars) {
    issues.push('Missing database configuration. Need either DATABASE_URL or individual DB_* variables');
  }
  
  // Check optional but important variables
  optional.forEach(key => {
    if (!process.env[key]) {
      recommendations.push(`Consider setting ${key} for full functionality`);
    }
  });
  
  return {
    status: issues.length === 0 ? 'passed' : 'failed',
    issues,
    recommendations
  };
}

async function checkDatabaseConnection() {
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
  
  const issues = [];
  const recommendations = [];
  
  const client = new Client(config);
  
  try {
    await client.connect();
    
    // Test basic query
    const result = await client.query('SELECT version()');
    log(`📊 Connected to PostgreSQL: ${result.rows[0].version.split(' ')[1]}`, colors.green);
    
    // Check if UUID function is available
    try {
      await client.query('SELECT generate_uuid()');
      log('🆔 UUID generation function available', colors.green);
    } catch (error) {
      issues.push('UUID generation function not available - migrations may fail');
      recommendations.push('Run database setup script to create UUID functions');
    }
    
    await client.end();
    
  } catch (error) {
    issues.push(`Database connection failed: ${error.message}`);
    recommendations.push('Check database credentials and network connectivity');
    
    return {
      status: 'failed',
      issues,
      recommendations
    };
  }
  
  return {
    status: issues.length === 0 ? 'passed' : 'failed',
    issues,
    recommendations
  };
}

async function checkMigrations() {
  const issues = [];
  const recommendations = [];
  
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    issues.push('Migrations directory not found');
    return { status: 'failed', issues, recommendations };
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'));
  
  if (migrationFiles.length === 0) {
    issues.push('No migration files found');
    return { status: 'failed', issues, recommendations };
  }
  
  log(`📁 Found ${migrationFiles.length} migration file(s)`, colors.green);
  
  // Check if migrations are syntactically valid
  migrationFiles.forEach(file => {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    if (content.trim().length === 0) {
      issues.push(`Migration file ${file} is empty`);
    }
  });
  
  return {
    status: issues.length === 0 ? 'passed' : 'failed',
    issues,
    recommendations
  };
}

function checkRequiredFiles() {
  const requiredFiles = [
    'server.js',
    'package.json',
    'routes/auth.js',
    'routes/clinics.js',
    'routes/appointments.js',
    'config/database.js'
  ];
  
  const issues = [];
  const baseDir = path.join(__dirname, '..');
  
  requiredFiles.forEach(file => {
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) {
      issues.push(`Required file missing: ${file}`);
    }
  });
  
  return {
    status: issues.length === 0 ? 'passed' : 'failed',
    issues,
    recommendations: []
  };
}

if (require.main === module) {
  verifyDeployment()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`❌ Verification failed: ${error.message}`, colors.red);
      process.exit(1);
    });
}

module.exports = { verifyDeployment };