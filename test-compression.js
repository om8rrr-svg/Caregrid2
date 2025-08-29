#!/usr/bin/env node

/**
 * Test script to verify compression is working
 * Tests both frontend static files and backend API compression
 * Environment-aware - uses environment variables to determine backend URL
 */

const http = require('http');
const https = require('https');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// Environment-aware configuration
const BACKEND_URL = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || 'https://caregrid-backend.onrender.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8000';

console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Frontend URL: ${FRONTEND_URL}`);

// Test URLs
const tests = [
  {
    name: 'Frontend CSS',
    url: `${FRONTEND_URL}/css/style-performance.css`,
    expectedCompression: true
  },
  {
    name: 'Frontend JavaScript',
    url: `${FRONTEND_URL}/js/script.js`,
    expectedCompression: true
  },
  {
    name: 'Backend API Health',
    url: `${BACKEND_URL}/health`,
    expectedCompression: true
  },
  {
    name: 'Frontend HTML',
    url: `${FRONTEND_URL}/index.html`,
    expectedCompression: true
  }
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testCompression(testConfig) {
  return new Promise((resolve) => {
    const url = new URL(testConfig.url);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'CareGrid-Compression-Test/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = Buffer.alloc(0);
      
      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });
      
      res.on('end', () => {
        const contentEncoding = res.headers['content-encoding'];
        const contentLength = parseInt(res.headers['content-length']) || data.length;
        const actualSize = data.length;
        
        const result = {
          name: testConfig.name,
          url: testConfig.url,
          statusCode: res.statusCode,
          contentEncoding: contentEncoding || 'none',
          originalSize: contentLength,
          compressedSize: actualSize,
          compressionRatio: contentLength > 0 ? ((contentLength - actualSize) / contentLength * 100).toFixed(1) : 0,
          isCompressed: !!contentEncoding && contentEncoding !== 'identity',
          success: res.statusCode === 200
        };
        
        resolve(result);
      });
    });
    
    req.on('error', (err) => {
      resolve({
        name: testConfig.name,
        url: testConfig.url,
        error: err.message,
        success: false
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        name: testConfig.name,
        url: testConfig.url,
        error: 'Request timeout',
        success: false
      });
    });
    
    req.end();
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function printResults(results) {
  log('\n' + '='.repeat(80), 'blue');
  log('🗜️  COMPRESSION TEST RESULTS', 'bold');
  log('='.repeat(80), 'blue');
  
  let totalOriginal = 0;
  let totalCompressed = 0;
  let successCount = 0;
  
  results.forEach((result) => {
    log(`\n📄 ${result.name}`, 'bold');
    log(`   URL: ${result.url}`);
    
    if (result.error) {
      log(`   ❌ Error: ${result.error}`, 'red');
      return;
    }
    
    if (!result.success) {
      log(`   ❌ HTTP ${result.statusCode}`, 'red');
      return;
    }
    
    successCount++;
    totalOriginal += result.originalSize || result.compressedSize;
    totalCompressed += result.compressedSize;
    
    const compressionStatus = result.isCompressed ? '✅ Compressed' : '⚠️  Not Compressed';
    const compressionColor = result.isCompressed ? 'green' : 'yellow';
    
    log(`   ${compressionStatus} (${result.contentEncoding})`, compressionColor);
    
    if (result.isCompressed) {
      log(`   📊 Original: ${formatBytes(result.originalSize || result.compressedSize)}`);
      log(`   📊 Compressed: ${formatBytes(result.compressedSize)}`);
      log(`   📊 Savings: ${result.compressionRatio}%`, 'green');
    } else {
      log(`   📊 Size: ${formatBytes(result.compressedSize)}`);
    }
  });
  
  // Summary
  log('\n' + '='.repeat(80), 'blue');
  log('📊 SUMMARY', 'bold');
  log('='.repeat(80), 'blue');
  
  const overallSavings = totalOriginal > 0 ? ((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1) : 0;
  
  log(`✅ Successful tests: ${successCount}/${results.length}`);
  log(`📦 Total original size: ${formatBytes(totalOriginal)}`);
  log(`🗜️  Total compressed size: ${formatBytes(totalCompressed)}`);
  log(`💾 Overall savings: ${overallSavings}%`, overallSavings > 50 ? 'green' : 'yellow');
  
  if (successCount === results.length && overallSavings > 50) {
    log('\n🎉 Compression is working optimally!', 'green');
  } else if (successCount === results.length) {
    log('\n⚠️  Compression is working but could be improved.', 'yellow');
  } else {
    log('\n❌ Some tests failed. Check server configuration.', 'red');
  }
}

async function runTests() {
  log('🚀 Starting compression tests...', 'blue');
  log('⏳ This may take a few seconds...\n');
  
  const results = [];
  
  for (const test of tests) {
    log(`Testing: ${test.name}...`);
    const result = await testCompression(test);
    results.push(result);
  }
  
  printResults(results);
}

// Check if servers are running
function checkServers() {
  log('🔍 Checking if servers are running...', 'blue');
  
  // Parse frontend URL
  const frontendUrl = new URL(FRONTEND_URL);
  const frontendCheck = new Promise((resolve) => {
    const req = http.request({ 
      hostname: frontendUrl.hostname, 
      port: frontendUrl.port || (frontendUrl.protocol === 'https:' ? 443 : 80), 
      path: '/', 
      method: 'HEAD' 
    }, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
    req.end();
  });
  
  // Parse backend URL
  const backendUrl = new URL(BACKEND_URL);
  const requestModule = backendUrl.protocol === 'https:' ? https : http;
  const backendCheck = new Promise((resolve) => {
    const req = requestModule.request({ 
      hostname: backendUrl.hostname, 
      port: backendUrl.port || (backendUrl.protocol === 'https:' ? 443 : 80), 
      path: '/health', 
      method: 'HEAD' 
    }, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
    req.end();
  });
  
  return Promise.all([frontendCheck, backendCheck]);
}

// Main execution
async function main() {
  const [frontendRunning, backendRunning] = await checkServers();
  
  if (!frontendRunning) {
    log(`⚠️  Frontend server (${FRONTEND_URL}) is not running.`, 'yellow');
    if (FRONTEND_URL.includes('localhost')) {
      log('   Start with: python3 -m http.server 8000', 'yellow');
    }
  }
  
  if (!backendRunning) {
    log(`⚠️  Backend server (${BACKEND_URL}) is not running.`, 'yellow');
    if (BACKEND_URL.includes('localhost')) {
      log('   Start with: npm start', 'yellow');
    }
  }
  
  if (!frontendRunning && !backendRunning) {
    log('❌ No servers are running. Please check your configuration and try again.', 'red');
    process.exit(1);
  }
  
  await runTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCompression, runTests };