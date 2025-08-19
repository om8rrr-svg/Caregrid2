#!/usr/bin/env node

/**
 * Test script to verify compression is working
 * Tests both frontend static files and backend API compression
 */

const http = require('http');
const https = require('https');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// Test URLs
const tests = [
  {
    name: 'Frontend CSS (Local)',
    url: 'http://localhost:8000/css/style-performance.css',
    expectedCompression: true
  },
  {
    name: 'Frontend JavaScript (Local)',
    url: 'http://localhost:8000/js/script.js',
    expectedCompression: true
  },
  {
    name: 'Backend API Health (Local)',
    url: 'http://localhost:3000/health',
    expectedCompression: true
  },
  {
    name: 'Frontend HTML (Local)',
    url: 'http://localhost:8000/index.html',
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
  
  const frontendCheck = new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port: 8000, path: '/', method: 'HEAD' }, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
    req.end();
  });
  
  const backendCheck = new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port: 3000, path: '/health', method: 'HEAD' }, (res) => {
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
    log('⚠️  Frontend server (port 8000) is not running. Start with: python3 -m http.server 8000', 'yellow');
  }
  
  if (!backendRunning) {
    log('⚠️  Backend server (port 3000) is not running. Start with: npm start', 'yellow');
  }
  
  if (!frontendRunning && !backendRunning) {
    log('❌ No servers are running. Please start the servers and try again.', 'red');
    process.exit(1);
  }
  
  await runTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCompression, runTests };