#!/usr/bin/env node
/**
 * Development Environment Isolation Checker
 * Ensures development environment is properly separated from production
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Development Environment Isolation...\n');

let errors = 0;
let warnings = 0;

function checkFile(filePath, description) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${description}: File not found - ${filePath}`);
    warnings++;
    return null;
  }
  return fs.readFileSync(filePath, 'utf8');
}

function checkEnvironmentFile() {
  console.log('📁 Checking .env.development file...');
  
  const devEnvPath = path.join(process.cwd(), '.env.development');
  const content = checkFile(devEnvPath, 'Development environment file');
  
  if (!content) return;

  // Check for localhost usage
  if (!content.includes('localhost')) {
    console.log('❌ Development environment should use localhost URLs');
    errors++;
  } else {
    console.log('✅ Localhost URLs configured for development');
  }

  // Check for development database
  if (content.includes('caregrid_dev') || content.includes('localhost:5432')) {
    console.log('✅ Development database properly configured');
  } else {
    console.log('❌ Development database not properly isolated');
    errors++;
  }

  // Check for production keywords
  const productionPatterns = [
    /production/i,
    /prod/i,
    /live/i
  ];
  
  let hasProductionRefs = false;
  productionPatterns.forEach(pattern => {
    if (pattern.test(content) && !content.includes('not-for-production')) {
      hasProductionRefs = true;
    }
  });

  if (hasProductionRefs) {
    console.log('⚠️  Production references found in development environment');
    warnings++;
  } else {
    console.log('✅ No production references in development environment');
  }

  // Check JWT secret
  if (content.includes('development-jwt-secret-key-not-for-production')) {
    console.log('✅ Development JWT secret properly marked');
  } else {
    console.log('⚠️  JWT secret should be clearly marked as development-only');
    warnings++;
  }

  // Check CORS origins
  if (content.includes('CORS_ORIGINS') && content.includes('localhost')) {
    console.log('✅ CORS properly configured for localhost');
  } else {
    console.log('⚠️  CORS configuration should be restricted to localhost in development');
    warnings++;
  }
}

function checkGitignore() {
  console.log('\n📁 Checking .gitignore for secrets protection...');
  
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const content = checkFile(gitignorePath, 'Gitignore file');
  
  if (!content) return;

  const requiredPatterns = [
    '.env',
    '.env.local',
    'node_modules/',
    '*.log'
  ];

  requiredPatterns.forEach(pattern => {
    if (content.includes(pattern)) {
      console.log(`✅ ${pattern} properly ignored`);
    } else {
      console.log(`❌ ${pattern} should be in .gitignore`);
      errors++;
    }
  });
}

function checkPackageJson() {
  console.log('\n📁 Checking package.json for security configurations...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  const content = checkFile(packagePath, 'Package.json file');
  
  if (!content) return;

  try {
    const pkg = JSON.parse(content);
    
    // Check for development dependencies
    const securityDevDeps = [
      'http-server',
      'jsdom'
    ];
    
    if (pkg.devDependencies) {
      securityDevDeps.forEach(dep => {
        if (pkg.devDependencies[dep]) {
          console.log(`✅ Development dependency: ${dep}`);
        }
      });
    }
    
    // Check scripts for development commands
    if (pkg.scripts && pkg.scripts.start && pkg.scripts.start.includes('http-server')) {
      console.log('✅ Development server configured with http-server');
    }
    
    // Check for security-related scripts
    if (pkg.scripts && (pkg.scripts.smoke || pkg.scripts['performance:test'])) {
      console.log('✅ Security testing scripts available');
    } else {
      console.log('⚠️  Consider adding security testing scripts');
      warnings++;
    }
    
  } catch (error) {
    console.log('❌ Invalid package.json format');
    errors++;
  }
}

function checkDevelopmentFiles() {
  console.log('\n📁 Checking for development-specific files...');
  
  const devFiles = [
    'scripts/smoke.js',
    'js/test-config.js',
    'test_clinics.json'
  ];
  
  devFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ Development file present: ${file}`);
    } else {
      console.log(`ℹ️  Development file not found: ${file} (optional)`);
    }
  });
}

function checkProductionFiles() {
  console.log('\n📁 Checking that production files are properly protected...');
  
  const productionFiles = [
    '.env.production',
    '.env.production.local',
    'vercel.json'
  ];
  
  productionFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`ℹ️  Production file exists: ${file}`);
      
      // If it's a vercel.json, check it doesn't expose development settings
      if (file === 'vercel.json') {
        const content = fs.readFileSync(filePath, 'utf8');
        try {
          const config = JSON.parse(content);
          if (config.env && JSON.stringify(config.env).includes('development')) {
            console.log('⚠️  Vercel config may contain development references');
            warnings++;
          } else {
            console.log('✅ Vercel config appears production-ready');
          }
        } catch (error) {
          console.log('⚠️  Could not parse vercel.json');
          warnings++;
        }
      }
    }
  });
}

// Run all checks
console.log('🔒 CareGrid Development Environment Isolation Check\n');

checkEnvironmentFile();
checkGitignore();
checkPackageJson();
checkDevelopmentFiles();
checkProductionFiles();

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 DEVELOPMENT ISOLATION SUMMARY');
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('✅ Excellent! Development environment is properly isolated');
  console.log('🔒 No security concerns found');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} critical issue(s) found - immediate action required`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} warning(s) found - consider addressing`);
  }
}

console.log('\n🎯 Healthcare Development Best Practices:');
console.log('• Use only localhost URLs in development');
console.log('• Keep development database separate from production');
console.log('• Use synthetic/mock data for all healthcare testing');
console.log('• Ensure proper environment variable management');
console.log('• Regular security audits of development environment');

console.log('\n' + '='.repeat(50));

// Exit with appropriate code
if (errors > 0) {
  console.log('❌ Environment isolation check failed');
  process.exit(1);
} else {
  console.log('✅ Environment isolation check passed');
  process.exit(0);
}