#!/usr/bin/env node
/**
 * Comprehensive API Endpoint Testing Script
 * Tests all CareGrid API endpoints after database fixes
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://caregrid2-ddk7-n16rxr16c-care-grid-uk.vercel.app';
const TIMEOUT = 10000; // 10 seconds

// Test data
const testData = {
  contact: {
    name: 'Test User',
    email: 'test@example.com',
    message: 'This is a test message from the API testing script'
  },
  auth: {
    register: {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    },
    login: {
      email: 'test@example.com',
      password: 'TestPassword123!'
    }
  },
  appointment: {
    clinicId: '123e4567-e89b-12d3-a456-426614174000', // This would need to be a real clinic ID
    patientName: 'Test Patient',
    patientEmail: 'patient@example.com',
    patientPhone: '+44 7700 900123',
    appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    appointmentTime: '10:00',
    serviceType: 'General Consultation',
    notes: 'Test appointment booking'
  }
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CareGrid-API-Tester/1.0',
        ...options.headers
      },
      timeout: TIMEOUT
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            raw: data,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log('\n🏥 Testing Health Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    if (response.status === 200 && response.data.status === 'healthy') {
      console.log('   ✅ Health endpoint: PASSED');
      return true;
    } else {
      console.log(`   ❌ Health endpoint: FAILED (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Health endpoint: ERROR - ${error.message}`);
    return false;
  }
}

async function testClinicsEndpoint() {
  console.log('\n🏢 Testing Clinics Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/clinics?limit=1`);
    if (response.status === 200 && response.data.success) {
      console.log('   ✅ Clinics endpoint: PASSED');
      return true;
    } else {
      console.log(`   ❌ Clinics endpoint: FAILED (Status: ${response.status})`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Clinics endpoint: ERROR - ${error.message}`);
    return false;
  }
}

async function testContactEndpoint() {
  console.log('\n📧 Testing Contact Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/contact`, {
      method: 'POST',
      body: testData.contact
    });
    if (response.status === 200 && response.data.success) {
      console.log('   ✅ Contact endpoint: PASSED');
      return true;
    } else {
      console.log(`   ❌ Contact endpoint: FAILED (Status: ${response.status})`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Contact endpoint: ERROR - ${error.message}`);
    return false;
  }
}

async function testAuthEndpoint() {
  console.log('\n🔐 Testing Auth Endpoint...');
  try {
    // Test registration
    const registerResponse = await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      body: testData.auth.register
    });
    
    if (registerResponse.status === 201 && registerResponse.data.success) {
      console.log('   ✅ Auth registration: PASSED');
    } else if (registerResponse.status === 400 && registerResponse.data.message?.includes('already exists')) {
      console.log('   ⚠️  Auth registration: User already exists (expected)');
    } else {
      console.log(`   ❌ Auth registration: FAILED (Status: ${registerResponse.status})`);
      console.log(`   Response: ${JSON.stringify(registerResponse.data, null, 2)}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Auth endpoint: ERROR - ${error.message}`);
    return false;
  }
}

async function testAppointmentsEndpoint() {
  console.log('\n📅 Testing Appointments Endpoint...');
  try {
    // First, get a real clinic ID
    const clinicsResponse = await makeRequest(`${BASE_URL}/api/clinics?limit=1`);
    if (clinicsResponse.status !== 200 || !clinicsResponse.data.success || !clinicsResponse.data.data.length) {
      console.log('   ⚠️  Cannot test appointments: No clinics available');
      return false;
    }
    
    const clinicId = clinicsResponse.data.data[0].id;
    const appointmentData = { ...testData.appointment, clinicId };
    
    const response = await makeRequest(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      body: appointmentData
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('   ✅ Appointments endpoint: PASSED');
      return true;
    } else {
      console.log(`   ❌ Appointments endpoint: FAILED (Status: ${response.status})`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Appointments endpoint: ERROR - ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 CareGrid API Endpoint Testing');
  console.log('=================================');
  console.log(`Testing against: ${BASE_URL}`);
  
  const results = {
    health: await testHealthEndpoint(),
    clinics: await testClinicsEndpoint(),
    contact: await testContactEndpoint(),
    auth: await testAuthEndpoint(),
    appointments: await testAppointmentsEndpoint()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([endpoint, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`   ${endpoint.padEnd(12)}: ${status}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 All API endpoints are working correctly!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some endpoints need attention. Check the database deployment.');
    console.log('   Run: node scripts/deploy-database-fixes.js');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('\n💥 Test runner error:', error.message);
    process.exit(1);
  });
}

module.exports = { runTests, testHealthEndpoint, testClinicsEndpoint, testContactEndpoint, testAuthEndpoint, testAppointmentsEndpoint };