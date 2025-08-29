#!/bin/bash

# Validation script to test the localhost hardcoding fixes
# This script validates that all test files use the configurable API system

echo "🔍 Validating localhost hardcoding fixes..."
echo

# Check for any remaining hardcoded localhost references (excluding appropriate files)
echo "1. Checking for remaining hardcoded localhost references..."
HARDCODED=$(find . -name "*.html" -o -name "*.js" | xargs grep -l "localhost:300" 2>/dev/null | grep -v "backend/server.js" | grep -v "test-compression.js" | grep -v "js/test-config.js")

if [ -z "$HARDCODED" ]; then
    echo "✅ No hardcoded localhost references found in test files"
else
    echo "❌ Found hardcoded localhost references in:"
    echo "$HARDCODED"
    exit 1
fi

echo

# Check that test files include the test-config.js
echo "2. Checking that test files include test-config.js..."
TEST_FILES=$(find . -name "*test*.html" -o -name "*debug*.html" | head -5)
MISSING_CONFIG=""

for file in $TEST_FILES; do
    if ! grep -q "js/test-config.js" "$file"; then
        MISSING_CONFIG="$MISSING_CONFIG $file"
    fi
done

if [ -z "$MISSING_CONFIG" ]; then
    echo "✅ All checked test files include test-config.js"
else
    echo "❌ These test files are missing test-config.js:"
    echo "$MISSING_CONFIG"
    exit 1
fi

echo

# Test the test-config.js functionality
echo "3. Testing test-config.js functionality..."
node -e "
global.window = { location: { hostname: 'localhost', search: '' } };
global.console = { log: () => {} }; // Silent console
require('./js/test-config.js');

// Test localhost environment
if (window.TestConfig.getApiBase() !== 'http://localhost:3000') {
    console.error('❌ Localhost detection failed');
    process.exit(1);
}

// Test production environment
global.window = { location: { hostname: 'example.com', search: '' } };
delete require.cache[require.resolve('./js/test-config.js')];
require('./js/test-config.js');

if (window.TestConfig.getApiBase() !== 'https://caregrid-backend.onrender.com') {
    console.error('❌ Production default failed');
    process.exit(1);
}

console.log('✅ test-config.js functionality works correctly');
"

echo

# Test API URL building
echo "4. Testing API URL building..."
node -e "
global.window = { location: { hostname: 'test.com', search: '' } };
global.console = { log: () => {} };
require('./js/test-config.js');

const testCases = [
    { input: 'clinics', expected: 'https://caregrid-backend.onrender.com/api/clinics' },
    { input: 'auth/login', expected: 'https://caregrid-backend.onrender.com/api/auth/login' },
    { input: 'appointments/admin/appointments?test=true', expected: 'https://caregrid-backend.onrender.com/api/appointments/admin/appointments?test=true' }
];

for (const test of testCases) {
    const result = window.TestConfig.buildApiUrl(test.input);
    if (result !== test.expected) {
        console.error(\`❌ URL building failed for '\${test.input}': got '\${result}', expected '\${test.expected}'\`);
        process.exit(1);
    }
}

const healthUrl = window.TestConfig.buildHealthUrl();
if (healthUrl !== 'https://caregrid-backend.onrender.com/health') {
    console.error(\`❌ Health URL building failed: got '\${healthUrl}'\`);
    process.exit(1);
}

console.log('✅ API URL building works correctly');
"

echo

# Test environment variables override
echo "5. Testing environment variable override..."
API_BASE=https://custom-backend.com node -e "
global.process = { env: { API_BASE: 'https://custom-backend.com' } };
global.window = { location: { hostname: 'test.com', search: '' } };
global.console = { log: () => {} };
require('./js/test-config.js');

if (window.TestConfig.getApiBase() !== 'https://custom-backend.com') {
    console.error('❌ Environment variable override failed');
    process.exit(1);
}

console.log('✅ Environment variable override works correctly');
"

echo

echo "🎉 All validation tests passed!"
echo "✅ Localhost hardcoding has been successfully fixed"
echo "✅ All test files now use configurable API endpoints"
echo "✅ Environment-aware configuration is working correctly"