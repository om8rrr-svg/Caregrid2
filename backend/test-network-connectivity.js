#!/usr/bin/env node

/**
 * Network Connectivity Test Script
 * 
 * This script tests the network connectivity issues mentioned in the GitHub issue:
 * - api.nodemailer.com (for email test account creation)
 * - caregrid-backend.onrender.com (for backend API connectivity)
 * 
 * Usage: node test-network-connectivity.js
 */

const https = require('https');
const dns = require('dns');
const nodemailer = require('nodemailer');

console.log('🌐 CareGrid Network Connectivity Test');
console.log('=====================================');
console.log('');

async function testDNSResolution(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, (err, address, family) => {
      if (err) {
        reject(err);
      } else {
        resolve({ address, family });
      }
    });
  });
}

async function testHTTPSConnection(hostname, path = '/') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: 'HEAD',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.end();
  });
}

async function runTests() {
  const tests = [
    {
      name: 'DNS Resolution: api.nodemailer.com',
      test: () => testDNSResolution('api.nodemailer.com')
    },
    {
      name: 'DNS Resolution: caregrid-backend.onrender.com',
      test: () => testDNSResolution('caregrid-backend.onrender.com')
    },
    {
      name: 'HTTPS Connection: api.nodemailer.com',
      test: () => testHTTPSConnection('api.nodemailer.com')
    },
    {
      name: 'HTTPS Connection: caregrid-backend.onrender.com/health',
      test: () => testHTTPSConnection('caregrid-backend.onrender.com', '/health')
    },
    {
      name: 'Nodemailer Test Account Creation',
      test: () => nodemailer.createTestAccount()
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      const result = await test.test();
      
      if (test.name.includes('DNS Resolution')) {
        console.log(`   ✅ Resolved to: ${result.address} (IPv${result.family})`);
      } else if (test.name.includes('HTTPS Connection')) {
        console.log(`   ✅ Status: ${result.statusCode}`);
      } else if (test.name.includes('Nodemailer Test Account')) {
        console.log(`   ✅ Test account created: ${result.user}`);
      }
      
      passedTests++;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
    console.log('');
  }

  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All network connectivity tests passed!');
    console.log('✅ The firewall issues have been resolved.');
    console.log('✅ All previously blocked services are now accessible.');
  } else {
    console.log('⚠️  Some tests failed. There may still be network issues.');
  }
  
  console.log('');
  console.log('🔍 What this means:');
  console.log('  • api.nodemailer.com: Used for creating test email accounts in development');
  console.log('  • caregrid-backend.onrender.com: Your deployed backend API');
  console.log('  • DNS resolution: Basic network connectivity');
  console.log('  • HTTPS connections: Secure API access');
  console.log('  • Nodemailer test accounts: Email functionality for development/testing');
}

runTests().catch(console.error);