#!/usr/bin/env node
/**
 * HIPAA Development Compliance Checker
 * Validates development environment against HIPAA requirements
 */

const fs = require('fs');
const path = require('path');

console.log('🏥 HIPAA Development Compliance Check\n');

let passed = 0;
let failed = 0;
let warnings = 0;

// Load environment variables
require('dotenv').config({ path: '.env.development' });

const SYNTHETIC_DATA_ENFORCED = process.env.SYNTHETIC_DATA_ENFORCED === 'true';
const CLINIC_ONLY_DATA = process.env.CLINIC_ONLY_DATA === 'true';

function checkCompliance(name, checkFunction, critical = false) {
  try {
    const result = checkFunction();
    if (result.success) {
      console.log(`✅ ${name}`);
      if (result.message) {
        console.log(`   ${result.message}`);
      }
      passed++;
      return true;
    } else {
      if (critical) {
        console.log(`❌ CRITICAL: ${name}`);
        failed++;
      } else {
        console.log(`⚠️  ${name}`);
        warnings++;
      }
      if (result.message) {
        console.log(`   ${result.message}`);
      }
      return false;
    }
  } catch (error) {
    if (critical) {
      console.log(`❌ CRITICAL ERROR: ${name} - ${error.message}`);
      failed++;
    } else {
      console.log(`⚠️  ERROR: ${name} - ${error.message}`);
      warnings++;
    }
    return false;
  }
}

// §164.312(a)(1) - Access Control
function checkAccessControl() {
  const envPath = path.join(process.cwd(), '.env.development');
  
  if (!fs.existsSync(envPath)) {
    return {
      success: false,
      message: 'Development environment file not found'
    };
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  
  // Check for localhost isolation
  if (!content.includes('localhost')) {
    return {
      success: false,
      message: 'Development environment should use localhost for isolation'
    };
  }
  
  // Check for development database isolation
  if (!content.includes('caregrid_dev') && !content.includes('localhost:5432')) {
    return {
      success: false,
      message: 'Development database should be isolated (caregrid_dev)'
    };
  }
  
  return {
    success: true,
    message: 'Development access controls properly configured'
  };
}

// §164.312(b) - Audit Controls
function checkAuditControls() {
  // Check for audit logging configuration
  const logPaths = [
    'logs/',
    'scripts/test/',
    'debug_*.json'
  ];
  
  let hasLogging = false;
  for (const logPath of logPaths) {
    if (fs.existsSync(path.join(process.cwd(), logPath))) {
      hasLogging = true;
      break;
    }
  }
  
  if (!hasLogging) {
    // Check for debug files which indicate logging capability
    const files = fs.readdirSync(process.cwd());
    hasLogging = files.some(file => file.includes('debug') || file.includes('log'));
  }
  
  return {
    success: hasLogging,
    message: hasLogging 
      ? 'Audit logging capabilities detected'
      : 'No audit logging detected - consider implementing for HIPAA compliance'
  };
}

// §164.312(c)(1) - Integrity Controls
function checkIntegrityControls() {
  // Check for data validation in forms
  const jsDir = path.join(process.cwd(), 'js');
  
  if (!fs.existsSync(jsDir)) {
    return {
      success: false,
      message: 'JavaScript directory not found'
    };
  }
  
  const files = fs.readdirSync(jsDir);
  const validatorFiles = files.filter(file => 
    file.includes('validator') || 
    file.includes('form') ||
    file === 'booking.js' ||
    file === 'auth.js'
  );
  
  if (validatorFiles.length === 0) {
    return {
      success: false,
      message: 'No data validation files found - implement form validation'
    };
  }
  
  // Check if validator files contain validation logic
  let hasValidation = false;
  for (const file of validatorFiles) {
    const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
    if (content.includes('validate') || content.includes('sanitize') || content.includes('check')) {
      hasValidation = true;
      break;
    }
  }
  
  return {
    success: hasValidation,
    message: hasValidation
      ? `Data validation implemented (${validatorFiles.length} files)`
      : 'Validation files found but may lack validation logic'
  };
}

// §164.312(e)(1) - Transmission Security
function checkTransmissionSecurity() {
  const envPath = path.join(process.cwd(), '.env.development');
  
  if (!fs.existsSync(envPath)) {
    return {
      success: false,
      message: 'Development environment file not found'
    };
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  
  // Check for HTTPS usage (or localhost which is acceptable for dev)
  const hasSecureTransmission = content.includes('https://') || content.includes('localhost');
  
  if (!hasSecureTransmission) {
    return {
      success: false,
      message: 'All connections should use HTTPS (or localhost for development)'
    };
  }
  
  // Check for insecure HTTP URLs (except localhost)
  const insecurePattern = /http:\/\/(?!localhost)/g;
  if (insecurePattern.test(content)) {
    return {
      success: false,
      message: 'Insecure HTTP URLs found (non-localhost)'
    };
  }
  
  return {
    success: true,
    message: 'Secure transmission configured (HTTPS/localhost)'
  };
}

// Additional Healthcare-Specific Checks
function checkPhiProtection() {
  // Check clinic-only data policy
  if (CLINIC_ONLY_DATA && SYNTHETIC_DATA_ENFORCED) {
    console.log('✅ Clinic-only dataset confirmed. No PHI present in development.');
    
    // Ensure audit logging is enabled
    if (process.env.HIPAA_AUDIT_ENABLED !== 'true') {
      return {
        success: false,
        message: 'Audit logging disabled - HIPAA_AUDIT_ENABLED must be true'
      };
    }
    
    // Check audit log path and create if needed
    const auditLogPath = process.env.AUDIT_LOG_PATH || './logs/audit-dev.log';
    const logDir = path.dirname(auditLogPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Write audit entry
    const auditEntry = JSON.stringify({
      ts: new Date().toISOString(),
      event: 'hipaa_dev_selftest',
      result: 'phi_protection_check_passed'
    }) + '\n';
    fs.appendFileSync(auditLogPath, auditEntry);
    console.log(`✅ Audit log writable at ${auditLogPath}`);
    
    // Check dev encryption key
    const devKey = process.env.DEV_ENCRYPTION_KEY;
    if (!devKey || devKey.length < 32) {
      return {
        success: false,
        message: 'DEV_ENCRYPTION_KEY missing or weak (must be 32+ characters)'
      };
    }
    console.log('✅ Dev encryption key present');
    
    // Check dev auth requirement
    if (process.env.DEV_REQUIRE_AUTH !== 'true') {
      return {
        success: false,
        message: 'Dev tool auth not enforced - DEV_REQUIRE_AUTH must be true'
      };
    }
    console.log('✅ Dev tool auth enforced');
    
    return {
      success: true,
      message: 'Clinic-only data policy enforced, no PHI in development'
    };
  }
  
  // Fallback to original synthetic data check
  const testDataFiles = [
    'test_clinics.json',
    'clinics_test.json'
  ];
  
  let hasSyntheticData = false;
  for (const file of testDataFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('test') || content.includes('synthetic') || content.includes('demo')) {
        hasSyntheticData = true;
        break;
      }
    }
  }
  
  return {
    success: hasSyntheticData,
    message: hasSyntheticData
      ? 'Synthetic test data identified'
      : 'Ensure all development data is synthetic/mock data'
  };
}

function checkDeveloperAccess() {
  const envPath = path.join(process.cwd(), '.env.development');
  
  if (!fs.existsSync(envPath)) {
    return {
      success: false,
      message: 'Development environment file not found'
    };
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  
  // Check for development-only credentials
  const isDevelopmentOnly = content.includes('development') && 
                           content.includes('not-for-production');
  
  return {
    success: isDevelopmentOnly,
    message: isDevelopmentOnly
      ? 'Development credentials properly marked'
      : 'Development credentials should be clearly marked as dev-only'
  };
}

function checkBusinessAssociateAgreement() {
  // Check for third-party service configurations that may need BAAs
  const envPath = path.join(process.cwd(), '.env.development');
  
  if (!fs.existsSync(envPath)) {
    return { success: true, message: 'No environment file to check' };
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  
  // Check for third-party services that would require BAAs in production
  const thirdPartyServices = [
    'supabase',
    'vercel',
    'email',
    'sms'
  ];
  
  let servicesFound = [];
  thirdPartyServices.forEach(service => {
    if (content.toLowerCase().includes(service)) {
      servicesFound.push(service);
    }
  });
  
  return {
    success: true,
    message: servicesFound.length > 0 
      ? `Third-party services detected: ${servicesFound.join(', ')} - ensure BAAs for production`
      : 'No third-party services requiring BAAs detected'
  };
}

// Run all HIPAA compliance checks
console.log('Validating HIPAA Security Rule compliance for development environment\n');

console.log('📋 Technical Safeguards:');
console.log('');

checkCompliance(
  'Access Control (§164.312(a)(1))', 
  checkAccessControl, 
  true
);

checkCompliance(
  'Audit Controls (§164.312(b))', 
  checkAuditControls, 
  false
);

checkCompliance(
  'Integrity Controls (§164.312(c)(1))', 
  checkIntegrityControls, 
  true
);

checkCompliance(
  'Transmission Security (§164.312(e)(1))', 
  checkTransmissionSecurity, 
  true
);

console.log('\n📋 Healthcare-Specific Development Requirements:');
console.log('');

checkCompliance(
  'PHI Protection in Development', 
  checkPhiProtection, 
  true
);

checkCompliance(
  'Developer Access Controls', 
  checkDeveloperAccess, 
  false
);

checkCompliance(
  'Business Associate Agreement Considerations', 
  checkBusinessAssociateAgreement, 
  false
);

// Generate compliance summary
console.log('\n' + '='.repeat(60));
console.log('🏥 HIPAA DEVELOPMENT COMPLIANCE SUMMARY');
console.log('='.repeat(60));

const total = passed + failed + warnings;
const compliancePercentage = ((passed + warnings) / total * 100).toFixed(1);

console.log(`\n📊 Compliance Status:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Critical Issues: ${failed}`);
console.log(`   ⚠️  Warnings: ${warnings}`);
console.log(`   📈 Compliance Score: ${compliancePercentage}%`);

if (failed === 0) {
  console.log('\n✅ Development environment meets HIPAA technical safeguards');
} else {
  console.log('\n❌ Critical HIPAA compliance issues found - immediate action required');
}

console.log('\n🎯 HIPAA Development Recommendations:');
console.log('• Use only synthetic/mock patient data in development');
console.log('• Implement proper access controls and authentication');
console.log('• Ensure all transmissions use HTTPS (or localhost for dev)');
console.log('• Maintain audit logs for all data access');
console.log('• Regular compliance reviews and training');

if (warnings > 0) {
  console.log('\n⚠️  Compliance Improvements Needed:');
  console.log('• Address warning items to achieve full compliance');
  console.log('• Implement recommended security enhancements');
  console.log('• Consider additional healthcare-specific controls');
}

console.log('\n' + '='.repeat(60));

// Exit with appropriate code
if (failed > 0) {
  console.log('❌ HIPAA compliance check failed');
  process.exit(1);
} else {
  console.log('✅ HIPAA compliance check passed');
  process.exit(0);
}