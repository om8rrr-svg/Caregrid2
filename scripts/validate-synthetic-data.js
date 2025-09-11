#!/usr/bin/env node
/**
 * Synthetic Data Validation Script
 * Ensures all test data is synthetic and contains no real PHI
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Synthetic Test Data for Healthcare Compliance...\n');

let errors = 0;
let warnings = 0;
let filesChecked = 0;

// Patterns that might indicate real data
const realDataPatterns = [
  {
    pattern: /NHS\s?\d{10}/gi,
    description: 'NHS Number format',
    severity: 'critical'
  },
  {
    pattern: /\b[A-Z]{2}\d{2}\s?\d{3}[A-Z]\b/g,
    description: 'UK National Insurance Number format',
    severity: 'critical'
  },
  {
    pattern: /\b0[1-9]\d{8,9}\b/g,
    description: 'UK Phone Number format',
    severity: 'warning'
  },
  {
    pattern: /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/g,
    description: 'UK Postcode format',
    severity: 'warning'
  },
  {
    pattern: /\b\d{2}\/\d{2}\/\d{4}\b/g,
    description: 'Date of Birth format',
    severity: 'warning'
  },
  {
    pattern: /\b[A-Za-z]+\s+[A-Za-z]+@[a-z]+\.[a-z]{2,}\b/g,
    description: 'Real-looking email address',
    severity: 'warning'
  }
];

// Common real names that should not appear in test data
const commonRealNames = [
  'john smith', 'jane doe', 'michael johnson', 'sarah williams',
  'david brown', 'emma davis', 'james wilson', 'olivia taylor',
  'robert anderson', 'sophia thomas'
];

// Test data file locations
const testDataLocations = [
  'test_clinics.json',
  'clinics_test.json',
  'debug_test.json',
  'final_test.json',
  'scripts/test/',
  'input/',
  'output/',
  'js/test-config.js',
  'js/test-booking.js'
];

function checkFileForRealData(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  
  const stats = fs.statSync(filePath);
  if (stats.isDirectory()) {
    const files = fs.readdirSync(filePath);
    files.forEach(file => {
      if (file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.csv')) {
        checkFileForRealData(path.join(filePath, file));
      }
    });
    return;
  }
  
  if (!(filePath.endsWith('.json') || filePath.endsWith('.js') || filePath.endsWith('.csv'))) {
    return;
  }
  
  console.log(`📄 Checking: ${path.relative(process.cwd(), filePath)}`);
  filesChecked++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Check if file is marked as test/synthetic data
    const isMarkedAsTest = content.toLowerCase().includes('test') || 
                          content.toLowerCase().includes('synthetic') ||
                          content.toLowerCase().includes('fake') ||
                          content.toLowerCase().includes('demo') ||
                          fileName.includes('test') ||
                          fileName.includes('mock');
    
    if (!isMarkedAsTest) {
      console.log(`⚠️  File may not be clearly marked as test data: ${fileName}`);
      warnings++;
    }
    
    // Check for real data patterns
    realDataPatterns.forEach(({ pattern, description, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        const uniqueMatches = [...new Set(matches)];
        
        if (severity === 'critical') {
          console.log(`🚨 CRITICAL: Possible real ${description} found in ${fileName}:`);
          uniqueMatches.forEach(match => console.log(`   "${match}"`));
          errors++;
        } else {
          console.log(`⚠️  WARNING: Possible real ${description} found in ${fileName}:`);
          uniqueMatches.slice(0, 3).forEach(match => console.log(`   "${match}"`));
          if (uniqueMatches.length > 3) {
            console.log(`   ... and ${uniqueMatches.length - 3} more`);
          }
          warnings++;
        }
      }
    });
    
    // Check for common real names
    const lowerContent = content.toLowerCase();
    commonRealNames.forEach(name => {
      if (lowerContent.includes(name)) {
        console.log(`⚠️  Common real name "${name}" found in ${fileName}`);
        warnings++;
      }
    });
    
    // Special checks for JSON files
    if (filePath.endsWith('.json')) {
      checkJsonStructure(filePath, content);
    }
    
    // Special checks for healthcare data
    checkHealthcareData(filePath, content);
    
  } catch (error) {
    console.log(`❌ Error reading ${filePath}: ${error.message}`);
    errors++;
  }
}

function checkJsonStructure(filePath, content) {
  try {
    const data = JSON.parse(content);
    const fileName = path.basename(filePath);
    
    // If it's an array, check each item
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (item.id && typeof item.id === 'number' && item.id > 1000000) {
          console.log(`⚠️  Large ID (${item.id}) in ${fileName}[${index}] - may be real data reference`);
          warnings++;
        }
        
        if (item.email && !item.email.includes('test') && !item.email.includes('example')) {
          console.log(`⚠️  Realistic email (${item.email}) in ${fileName}[${index}]`);
          warnings++;
        }
      });
    }
    
    // Check for realistic but potentially real clinic data
    if (data.clinics || (Array.isArray(data) && data[0] && data[0].name)) {
      checkClinicData(data, fileName);
    }
    
  } catch (error) {
    // Not valid JSON, skip JSON-specific checks
  }
}

function checkClinicData(data, fileName) {
  const clinics = data.clinics || data;
  
  if (Array.isArray(clinics)) {
    clinics.forEach((clinic, index) => {
      if (clinic.name) {
        // Check if clinic name sounds too realistic
        const name = clinic.name.toLowerCase();
        if (name.includes('nhs') || name.includes('hospital') || name.includes('medical centre')) {
          if (!name.includes('test') && !name.includes('demo') && !name.includes('fake')) {
            console.log(`⚠️  Realistic clinic name "${clinic.name}" in ${fileName}[${index}]`);
            warnings++;
          }
        }
      }
      
      if (clinic.address) {
        // Check if address looks too specific/real
        if (clinic.address.includes('Street') || clinic.address.includes('Road') || clinic.address.includes('Avenue')) {
          if (!clinic.address.includes('Test') && !clinic.address.includes('Demo')) {
            console.log(`ℹ️  Specific address found in ${fileName}[${index}]: "${clinic.address}"`);
          }
        }
      }
    });
  }
}

function checkHealthcareData(filePath, content) {
  const fileName = path.basename(filePath);
  
  // Check for healthcare-specific sensitive data
  const healthcarePatterns = [
    { pattern: /patient\s+id\s*:\s*\d+/gi, description: 'Patient ID references' },
    { pattern: /diagnosis\s*:\s*[a-z\s]+/gi, description: 'Medical diagnoses' },
    { pattern: /treatment\s*:\s*[a-z\s]+/gi, description: 'Medical treatments' },
    { pattern: /prescription\s*:\s*[a-z\s]+/gi, description: 'Prescription information' }
  ];
  
  healthcarePatterns.forEach(({ pattern, description }) => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      const isMarkedAsTest = matches.some(match => 
        match.toLowerCase().includes('test') || 
        match.toLowerCase().includes('demo') ||
        match.toLowerCase().includes('fake')
      );
      
      if (!isMarkedAsTest) {
        console.log(`⚠️  ${description} found in ${fileName} (ensure it's clearly test data)`);
        warnings++;
      }
    }
  });
}

function generateSyntheticDataReport() {
  console.log('\n📋 Synthetic Data Validation Report');
  console.log('='.repeat(50));
  
  console.log(`📊 Files Checked: ${filesChecked}`);
  console.log(`❌ Critical Issues: ${errors}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  
  if (errors === 0 && warnings === 0) {
    console.log('\n✅ Excellent! All test data appears to be properly synthetic');
    console.log('🔒 No real PHI detected in development environment');
  } else {
    console.log('\n🎯 Recommendations:');
    
    if (errors > 0) {
      console.log('🚨 IMMEDIATE ACTION REQUIRED:');
      console.log('   • Replace any real PHI with synthetic data');
      console.log('   • Verify no NHS numbers or National Insurance numbers');
      console.log('   • Remove any real patient information');
    }
    
    if (warnings > 0) {
      console.log('⚠️  IMPROVEMENTS RECOMMENDED:');
      console.log('   • Clearly mark all test files as synthetic/test data');
      console.log('   • Use obviously fake names (e.g., "Test Patient", "Demo User")');
      console.log('   • Use test email domains (e.g., @example.com, @test.local)');
      console.log('   • Consider using faker.js for generating synthetic data');
    }
  }
  
  console.log('\n🏥 Healthcare Data Best Practices:');
  console.log('• Use completely synthetic patient data');
  console.log('• Avoid realistic NHS numbers or medical record numbers');
  console.log('• Mark all test data files clearly');
  console.log('• Use fake addresses and contact information');
  console.log('• Generate data that looks realistic but is obviously fake');
  
  console.log('\n' + '='.repeat(50));
}

// Main execution
console.log('🏥 CareGrid Synthetic Data Validation\n');
console.log('Ensuring HIPAA compliance by validating test data contains no real PHI\n');

testDataLocations.forEach(location => {
  const fullPath = path.join(process.cwd(), location);
  checkFileForRealData(fullPath);
});

generateSyntheticDataReport();

// Exit with appropriate code
if (errors > 0) {
  console.log('❌ Synthetic data validation failed - real PHI may be present');
  process.exit(1);
} else if (warnings > 0) {
  console.log('⚠️  Synthetic data validation completed with warnings');
  process.exit(0);
} else {
  console.log('✅ Synthetic data validation passed');
  process.exit(0);
}