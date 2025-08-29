# CareGrid Test Configuration Guide

This document explains how the CareGrid test files now use environment-aware API configuration instead of hardcoded localhost URLs.

## Problem Solved

Previously, many test and debug files had hardcoded localhost URLs like:
- `http://localhost:3000/api/...` 
- `http://localhost:3001/api/...`

This caused issues when:
- Files were deployed to production (localhost doesn't exist)
- Backend port changed 
- Different developers used different ports
- Testing needed to be done against production API

## Solution: Environment-Aware Configuration

All test files now use `js/test-config.js` which provides a centralized, configurable API endpoint system.

### How It Works

1. **Automatic Environment Detection**: 
   - If page runs on `localhost` or `127.0.0.1` → Uses development mode (`http://localhost:3000`)
   - Otherwise → Uses production mode (`https://caregrid-backend.onrender.com`)

2. **Environment Variable Override**:
   - `window.__API_BASE__` (runtime override)
   - `process.env.NEXT_PUBLIC_API_BASE` (build-time)
   - `process.env.API_BASE` (build-time)

3. **Fallback Chain**: Runtime → Environment → Production Default

## Usage in Test Files

### Before (Hardcoded)
```javascript
const response = await fetch('http://localhost:3001/api/clinics');
```

### After (Configurable)
```html
<script src="js/test-config.js"></script>
<script>
const response = await fetch(TestConfig.buildApiUrl('clinics'));
</script>
```

## Available Functions

```javascript
// Get the current API base URL
TestConfig.getApiBase() 
// → 'http://localhost:3000' (dev) or 'https://caregrid-backend.onrender.com' (prod)

// Build API endpoint URL
TestConfig.buildApiUrl('clinics')
// → 'http://localhost:3000/api/clinics' or 'https://caregrid-backend.onrender.com/api/clinics'

// Build health check URL  
TestConfig.buildHealthUrl()
// → 'http://localhost:3000/health' or 'https://caregrid-backend.onrender.com/health'

// Check current environment
TestConfig.getEnvironment() // → 'development' or 'production'
TestConfig.isDevelopment() // → true/false

// Force development mode (for testing)
TestConfig.setDevelopmentMode(3000) // Use localhost:3000
```

## Environment Overrides

### For Development with Custom Port
```html
<script>
window.__API_BASE__ = 'http://localhost:3001';
</script>
<script src="js/test-config.js"></script>
```

### For Testing Against Staging
```html
<script>
window.__API_BASE__ = 'https://staging-backend.herokuapp.com';
</script>
<script src="js/test-config.js"></script>
```

### Via Environment Variables (Node.js scripts)
```bash
# Test against custom backend
API_BASE=https://my-backend.com node test-booking-fix.js

# Test with custom frontend and backend
FRONTEND_URL=http://localhost:8080 API_BASE=http://localhost:3001 node test-compression.js
```

## Files Updated

### HTML Test Files (12 files)
- `test-admin-booking-integration.html`
- `simple-test.html` 
- `auth-flow-debug.html`
- `debug-auth.html`
- `simple-auth-test.html`
- `test-admin-dashboard-real.html`
- `test-booking-fix.html`
- `test-booking-reference.html`
- `debug-network.html`
- `login-flow-test.html`
- `test-login.html`
- `network-debug.html`

### JavaScript Test Files (2 files)
- `test-booking-fix.js` (Node.js script)
- `test-compression.js` (Node.js script)

### Main API Services (Unchanged)
The main application API services were already properly configured:
- `js/api-base.js` ✅
- `js/api-service.js` ✅ 
- `admin-api-service.js` ✅

## Backend Port Standardization

All test files now use port 3000 consistently (matching `backend/server.js` default), eliminating the previous inconsistency where some used 3000 and others used 3001.

## Benefits

1. **Production Compatible**: Test files work in production deployments
2. **Environment Flexible**: Easy to test against different backends  
3. **Developer Friendly**: Auto-detects local development
4. **Centralized Configuration**: Single source of truth for API endpoints
5. **Backward Compatible**: Existing main API services unchanged
6. **Port Consistent**: All tests use same backend port (3000)

## Testing the Configuration

Run the validation script:
```bash
./validate-localhost-fixes.sh
```

This verifies:
- No hardcoded localhost references remain
- All test files include the configuration
- Environment detection works correctly
- URL building functions correctly
- Environment variable overrides work