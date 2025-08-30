#!/usr/bin/env node
/**
 * Deployment Environment Validation Script
 * Validates that all required environment variables and configurations are present
 * for successful deployment to production environments like Render.
 */

const fs = require('fs');
const path = require('path');

// Required environment variables for production deployment
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

// Optional but recommended environment variables
const RECOMMENDED_ENV_VARS = [
  'FRONTEND_URL',
  'CORS_ORIGIN',
  'EMAIL_SERVICE_API_KEY',
  'PORT'
];

// Required files for deployment
const REQUIRED_FILES = [
  'package.json',
  'server.js',
  'scripts/setup-render-database.js',
  'config/database.js',
  'routes/auth.js',
  'routes/clinics.js'
];

function validateEnvironmentVariables() {
  console.log('🔍 Validating environment variables...');
  
  const missing = [];
  const present = [];
  
  REQUIRED_ENV_VARS.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  });
  
  if (present.length > 0) {
    console.log('✅ Required environment variables present:');
    present.forEach(varName => console.log(`   - ${varName}`));
  }
  
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(varName => console.log(`   - ${varName}`));
    return false;
  }
  
  // Check recommended variables
  const missingRecommended = [];
  RECOMMENDED_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      missingRecommended.push(varName);
    }
  });
  
  if (missingRecommended.length > 0) {
    console.log('⚠️  Missing recommended environment variables:');
    missingRecommended.forEach(varName => console.log(`   - ${varName}`));
  }
  
  return true;
}

function validateRequiredFiles() {
  console.log('\n📁 Validating required files...');
  
  const missing = [];
  const present = [];
  
  REQUIRED_FILES.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      present.push(filePath);
    } else {
      missing.push(filePath);
    }
  });
  
  if (present.length > 0) {
    console.log('✅ Required files present:');
    present.forEach(filePath => console.log(`   - ${filePath}`));
  }
  
  if (missing.length > 0) {
    console.log('❌ Missing required files:');
    missing.forEach(filePath => console.log(`   - ${filePath}`));
    return false;
  }
  
  return true;
}

function validatePackageJson() {
  console.log('\n📦 Validating package.json...');
  
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check required scripts
    const requiredScripts = ['start'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts || !packageJson.scripts[script]);
    
    if (missingScripts.length > 0) {
      console.log('❌ Missing required npm scripts:');
      missingScripts.forEach(script => console.log(`   - ${script}`));
      return false;
    }
    
    // Check required dependencies
    const requiredDeps = ['express', 'cors', 'helmet', 'pg'];
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies || !packageJson.dependencies[dep]
    );
    
    if (missingDeps.length > 0) {
      console.log('❌ Missing required dependencies:');
      missingDeps.forEach(dep => console.log(`   - ${dep}`));
      return false;
    }
    
    console.log('✅ package.json validation passed');
    return true;
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    return false;
  }
}

function validateDatabaseConnection() {
  console.log('\n🗄️  Validating database configuration...');
  
  try {
    // Check if database config exists
    const dbConfigPath = path.join(__dirname, '..', 'config', 'database.js');
    if (!fs.existsSync(dbConfigPath)) {
      console.log('❌ Database configuration file not found');
      return false;
    }
    
    // Validate DATABASE_URL format if present
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
        console.log('❌ DATABASE_URL must be a valid PostgreSQL connection string');
        return false;
      }
    }
    
    console.log('✅ Database configuration validation passed');
    return true;
  } catch (error) {
    console.log('❌ Error validating database configuration:', error.message);
    return false;
  }
}

function main() {
  console.log('🚀 CareGrid Deployment Validation\n');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Timestamp:', new Date().toISOString());
  console.log('=' .repeat(50));
  
  const validations = [
    validateEnvironmentVariables(),
    validateRequiredFiles(),
    validatePackageJson(),
    validateDatabaseConnection()
  ];
  
  const allPassed = validations.every(result => result === true);
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('✅ All deployment validations passed!');
    console.log('🚀 Ready for deployment to production');
    process.exit(0);
  } else {
    console.log('❌ Deployment validation failed');
    console.log('🔧 Please fix the issues above before deploying');
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironmentVariables,
  validateRequiredFiles,
  validatePackageJson,
  validateDatabaseConnection
};