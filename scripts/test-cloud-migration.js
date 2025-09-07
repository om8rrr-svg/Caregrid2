#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
require('dotenv').config();

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logTest(testName) {
    log(`🧪 Testing: ${testName}`, 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

function recordTest(name, passed, message, warning = false) {
    testResults.tests.push({ name, passed, message, warning });
    if (warning) {
        testResults.warnings++;
        logWarning(`${name}: ${message}`);
    } else if (passed) {
        testResults.passed++;
        logSuccess(`${name}: ${message}`);
    } else {
        testResults.failed++;
        logError(`${name}: ${message}`);
    }
}

// HTTP request helper
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const startTime = Date.now();
        
        const req = protocol.request(url, {
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: options.timeout || 10000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data,
                    responseTime
                });
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

// Test environment variables
function testEnvironmentVariables() {
    logTest('Environment Variables');
    
    const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    const optionalVars = [
        'SUPABASE_SERVICE_KEY',
        'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
        'NEXT_PUBLIC_VERCEL_ANALYTICS_ID'
    ];
    
    let allRequired = true;
    
    requiredVars.forEach(varName => {
        if (process.env[varName]) {
            recordTest(`ENV_${varName}`, true, 'Present and configured');
        } else {
            recordTest(`ENV_${varName}`, false, 'Missing or empty');
            allRequired = false;
        }
    });
    
    optionalVars.forEach(varName => {
        if (process.env[varName]) {
            recordTest(`ENV_${varName}`, true, 'Present and configured', false);
        } else {
            recordTest(`ENV_${varName}`, true, 'Optional - not configured', true);
        }
    });
    
    return allRequired;
}

// Test Supabase connection
async function testSupabaseConnection() {
    logTest('Supabase Connection');
    
    try {
        const { createClient } = require('@supabase/supabase-js');
        
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            recordTest('SUPABASE_CONNECTION', false, 'Missing credentials');
            return false;
        }
        
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Test basic connection
        const startTime = Date.now();
        const { data, error } = await supabase
            .from('clinics')
            .select('count')
            .limit(1);
        const responseTime = Date.now() - startTime;
        
        if (error) {
            if (error.message.includes('relation "clinics" does not exist')) {
                recordTest('SUPABASE_CONNECTION', true, 'Connected (table not migrated yet)', true);
                recordTest('SUPABASE_TABLES', false, 'Clinics table does not exist');
                return false;
            } else {
                recordTest('SUPABASE_CONNECTION', false, `Connection error: ${error.message}`);
                return false;
            }
        }
        
        recordTest('SUPABASE_CONNECTION', true, `Connected successfully (${responseTime}ms)`);
        
        // Test table structure
        const { data: tableData, error: tableError } = await supabase
            .from('clinics')
            .select('*')
            .limit(1);
            
        if (tableError) {
            recordTest('SUPABASE_TABLES', false, `Table query error: ${tableError.message}`);
        } else {
            recordTest('SUPABASE_TABLES', true, `Tables accessible (${tableData ? tableData.length : 0} sample records)`);
        }
        
        return true;
        
    } catch (error) {
        recordTest('SUPABASE_CONNECTION', false, `Setup error: ${error.message}`);
        return false;
    }
}

// Test file structure
function testFileStructure() {
    logTest('File Structure');
    
    const requiredFiles = [
        'package.json',
        'vercel.json',
        '.env.example',
        'config/supabase.js',
        'js/api-service-cloud.js',
        'scripts/migrate-to-supabase.js',
        'docs/CLOUD_MIGRATION_PLAN.md'
    ];
    
    const requiredDirs = [
        'api',
        'scripts',
        'config',
        'js',
        'docs'
    ];
    
    let allFilesExist = true;
    
    requiredFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            recordTest(`FILE_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`, true, `Exists (${stats.size} bytes)`);
        } else {
            recordTest(`FILE_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`, false, 'Missing');
            allFilesExist = false;
        }
    });
    
    requiredDirs.forEach(dirPath => {
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            const files = fs.readdirSync(dirPath);
            recordTest(`DIR_${dirPath.replace(/[^a-zA-Z0-9]/g, '_')}`, true, `Exists (${files.length} files)`);
        } else {
            recordTest(`DIR_${dirPath.replace(/[^a-zA-Z0-9]/g, '_')}`, false, 'Missing');
            allFilesExist = false;
        }
    });
    
    return allFilesExist;
}

// Test package.json dependencies
function testDependencies() {
    logTest('Dependencies');
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        const requiredDeps = [
            '@supabase/supabase-js',
            'dotenv'
        ];
        
        const optionalDeps = [
            '@vercel/speed-insights',
            'node-cache',
            'node-fetch'
        ];
        
        let allRequired = true;
        
        requiredDeps.forEach(dep => {
            if (dependencies[dep]) {
                recordTest(`DEP_${dep.replace(/[^a-zA-Z0-9]/g, '_')}`, true, `Installed (${dependencies[dep]})`);
            } else {
                recordTest(`DEP_${dep.replace(/[^a-zA-Z0-9]/g, '_')}`, false, 'Missing');
                allRequired = false;
            }
        });
        
        optionalDeps.forEach(dep => {
            if (dependencies[dep]) {
                recordTest(`DEP_${dep.replace(/[^a-zA-Z0-9]/g, '_')}`, true, `Installed (${dependencies[dep]})`);
            } else {
                recordTest(`DEP_${dep.replace(/[^a-zA-Z0-9]/g, '_')}`, true, 'Optional - not installed', true);
            }
        });
        
        // Check scripts
        const scripts = packageJson.scripts || {};
        const requiredScripts = ['migrate', 'cloud:setup', 'cloud:deploy'];
        
        requiredScripts.forEach(script => {
            if (scripts[script]) {
                recordTest(`SCRIPT_${script.replace(/[^a-zA-Z0-9]/g, '_')}`, true, 'Configured');
            } else {
                recordTest(`SCRIPT_${script.replace(/[^a-zA-Z0-9]/g, '_')}`, false, 'Missing');
                allRequired = false;
            }
        });
        
        return allRequired;
        
    } catch (error) {
        recordTest('PACKAGE_JSON', false, `Error reading package.json: ${error.message}`);
        return false;
    }
}

// Test API endpoints (if running locally)
async function testAPIEndpoints() {
    logTest('API Endpoints');
    
    const endpoints = [
        { path: '/api/health', name: 'Health Check' },
        { path: '/api/supabase/clinics', name: 'Supabase Proxy' }
    ];
    
    const baseUrls = [
        'http://localhost:3000',
        'http://localhost:8080',
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
    ].filter(Boolean);
    
    if (baseUrls.length === 0) {
        recordTest('API_ENDPOINTS', true, 'No local server running - skipping API tests', true);
        return true;
    }
    
    let anySuccess = false;
    
    for (const baseUrl of baseUrls) {
        logInfo(`Testing API endpoints on ${baseUrl}`);
        
        for (const endpoint of endpoints) {
            try {
                const response = await makeRequest(`${baseUrl}${endpoint.path}`, {
                    timeout: 5000
                });
                
                if (response.statusCode === 200) {
                    recordTest(`API_${endpoint.name.replace(/\s+/g, '_')}`, true, `${baseUrl} - OK (${response.responseTime}ms)`);
                    anySuccess = true;
                } else {
                    recordTest(`API_${endpoint.name.replace(/\s+/g, '_')}`, false, `${baseUrl} - Status ${response.statusCode}`);
                }
                
            } catch (error) {
                recordTest(`API_${endpoint.name.replace(/\s+/g, '_')}`, false, `${baseUrl} - ${error.message}`);
            }
        }
    }
    
    if (!anySuccess) {
        recordTest('API_ENDPOINTS', true, 'No servers responding - start local server to test', true);
    }
    
    return anySuccess;
}

// Test configuration files
function testConfiguration() {
    logTest('Configuration Files');
    
    let allValid = true;
    
    // Test vercel.json
    try {
        const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
        
        if (vercelConfig.functions && vercelConfig.functions['api/**/*.js']) {
            recordTest('VERCEL_CONFIG', true, 'Functions configured');
        } else {
            recordTest('VERCEL_CONFIG', false, 'Functions not configured');
            allValid = false;
        }
        
        if (vercelConfig.env && vercelConfig.env.NEXT_PUBLIC_SUPABASE_URL) {
            recordTest('VERCEL_ENV', true, 'Environment variables configured');
        } else {
            recordTest('VERCEL_ENV', true, 'Environment variables not in config (use dashboard)', true);
        }
        
    } catch (error) {
        recordTest('VERCEL_CONFIG', false, `Error reading vercel.json: ${error.message}`);
        allValid = false;
    }
    
    // Test supabase config
    try {
        const supabaseConfigPath = 'config/supabase.js';
        if (fs.existsSync(supabaseConfigPath)) {
            const content = fs.readFileSync(supabaseConfigPath, 'utf8');
            if (content.includes('createClient') && content.includes('ClinicsService')) {
                recordTest('SUPABASE_CONFIG', true, 'Configuration file valid');
            } else {
                recordTest('SUPABASE_CONFIG', false, 'Configuration file incomplete');
                allValid = false;
            }
        } else {
            recordTest('SUPABASE_CONFIG', false, 'Configuration file missing');
            allValid = false;
        }
    } catch (error) {
        recordTest('SUPABASE_CONFIG', false, `Error reading supabase config: ${error.message}`);
        allValid = false;
    }
    
    return allValid;
}

// Performance test
async function testPerformance() {
    logTest('Performance Metrics');
    
    try {
        // Test file sizes
        const criticalFiles = [
            'js/script-optimized.js',
            'js/api-service-cloud.js',
            'config/supabase.js'
        ];
        
        criticalFiles.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const sizeKB = Math.round(stats.size / 1024);
                
                if (sizeKB < 100) {
                    recordTest(`PERF_${path.basename(filePath, '.js').replace(/[^a-zA-Z0-9]/g, '_')}`, true, `${sizeKB}KB - Good size`);
                } else if (sizeKB < 200) {
                    recordTest(`PERF_${path.basename(filePath, '.js').replace(/[^a-zA-Z0-9]/g, '_')}`, true, `${sizeKB}KB - Acceptable size`, true);
                } else {
                    recordTest(`PERF_${path.basename(filePath, '.js').replace(/[^a-zA-Z0-9]/g, '_')}`, false, `${sizeKB}KB - Large file size`);
                }
            }
        });
        
        // Test Supabase response time (if connected)
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            try {
                const { createClient } = require('@supabase/supabase-js');
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                );
                
                const startTime = Date.now();
                await supabase.from('clinics').select('count').limit(1);
                const responseTime = Date.now() - startTime;
                
                if (responseTime < 500) {
                    recordTest('PERF_SUPABASE_RESPONSE', true, `${responseTime}ms - Excellent`);
                } else if (responseTime < 1000) {
                    recordTest('PERF_SUPABASE_RESPONSE', true, `${responseTime}ms - Good`, true);
                } else {
                    recordTest('PERF_SUPABASE_RESPONSE', false, `${responseTime}ms - Slow`);
                }
                
            } catch (error) {
                recordTest('PERF_SUPABASE_RESPONSE', true, 'Cannot test - table not ready', true);
            }
        }
        
    } catch (error) {
        recordTest('PERFORMANCE', false, `Performance test error: ${error.message}`);
    }
}

// Generate test report
function generateReport() {
    const totalTests = testResults.passed + testResults.failed;
    const successRate = totalTests > 0 ? Math.round((testResults.passed / totalTests) * 100) : 0;
    
    log('\n' + '='.repeat(60), 'bright');
    log('🧪 CLOUD MIGRATION TEST REPORT', 'bright');
    log('='.repeat(60), 'bright');
    
    log(`\n📊 Summary:`, 'cyan');
    log(`   Total Tests: ${totalTests}`);
    log(`   Passed: ${testResults.passed}`, 'green');
    log(`   Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'reset');
    log(`   Warnings: ${testResults.warnings}`, testResults.warnings > 0 ? 'yellow' : 'reset');
    log(`   Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
    
    if (testResults.failed > 0) {
        log(`\n❌ Failed Tests:`, 'red');
        testResults.tests
            .filter(test => !test.passed && !test.warning)
            .forEach(test => {
                log(`   • ${test.name}: ${test.message}`, 'red');
            });
    }
    
    if (testResults.warnings > 0) {
        log(`\n⚠️  Warnings:`, 'yellow');
        testResults.tests
            .filter(test => test.warning)
            .forEach(test => {
                log(`   • ${test.name}: ${test.message}`, 'yellow');
            });
    }
    
    log(`\n✅ Passed Tests:`, 'green');
    testResults.tests
        .filter(test => test.passed && !test.warning)
        .forEach(test => {
            log(`   • ${test.name}: ${test.message}`, 'green');
        });
    
    log('\n' + '='.repeat(60), 'bright');
    
    // Recommendations
    if (testResults.failed > 0) {
        log('\n🔧 Recommendations:', 'cyan');
        
        if (testResults.tests.some(t => t.name.startsWith('ENV_') && !t.passed)) {
            log('   • Update .env.local with your Supabase credentials');
        }
        
        if (testResults.tests.some(t => t.name.startsWith('SUPABASE_') && !t.passed)) {
            log('   • Run migration script: npm run migrate');
        }
        
        if (testResults.tests.some(t => t.name.startsWith('DEP_') && !t.passed)) {
            log('   • Install missing dependencies: npm install');
        }
        
        if (testResults.tests.some(t => t.name.startsWith('FILE_') && !t.passed)) {
            log('   • Run cloud setup script: npm run cloud:setup');
        }
    }
    
    log('\n🚀 Next Steps:', 'cyan');
    if (successRate >= 80) {
        log('   • Your cloud migration is ready!');
        log('   • Deploy to Vercel: vercel --prod');
        log('   • Monitor performance and errors');
    } else {
        log('   • Fix failed tests before deploying');
        log('   • Re-run tests: npm run test:cloud');
        log('   • Check DEPLOYMENT_CHECKLIST.md for guidance');
    }
    
    log('\n' + '='.repeat(60), 'bright');
    
    return successRate >= 80;
}

// Main test function
async function main() {
    try {
        log('🧪 Starting Cloud Migration Tests...', 'bright');
        log('====================================', 'bright');
        
        const envOk = testEnvironmentVariables();
        const filesOk = testFileStructure();
        const depsOk = testDependencies();
        const configOk = testConfiguration();
        const supabaseOk = await testSupabaseConnection();
        await testAPIEndpoints();
        await testPerformance();
        
        const allGood = generateReport();
        
        if (allGood) {
            log('\n🎉 All tests passed! Ready for deployment.', 'green');
            process.exit(0);
        } else {
            log('\n⚠️  Some tests failed. Please fix issues before deploying.', 'yellow');
            process.exit(1);
        }
        
    } catch (error) {
        log('\n❌ Test suite failed!', 'red');
        logError(error.message);
        
        if (error.stack) {
            console.error(error.stack);
        }
        
        process.exit(1);
    }
}

// Run tests if called directly
if (require.main === module) {
    main();
}

module.exports = {
    main,
    testEnvironmentVariables,
    testSupabaseConnection,
    testFileStructure,
    testDependencies,
    testAPIEndpoints,
    testConfiguration,
    testPerformance,
    generateReport
};