# CareGrid Troubleshooting Playbook

## Quick Diagnostic Checklist

### 🚨 Emergency Response (Service Down)
1. **Check CareGrid Ops Dashboard** - System health indicators
2. **Verify Backend Status** - API health endpoint: `/api/health`
3. **Database Connectivity** - Connection pool status
4. **Recent Deployments** - Check for breaking changes
5. **External Dependencies** - Email service, payment gateway

### ⚠️ Performance Issues
1. **Response Times** - API endpoint performance
2. **Database Queries** - Slow query identification
3. **Memory Usage** - Server resource consumption
4. **Cache Hit Rates** - Caching effectiveness
5. **CDN Performance** - Static asset delivery

### 🔍 User-Reported Issues
1. **Error Reproduction** - Replicate user steps
2. **Browser Console** - JavaScript errors
3. **Network Tab** - Failed API requests
4. **User Session** - Authentication status
5. **Feature Flags** - Enabled/disabled features

## Common Issues & Solutions

### 1. "Service Temporarily Unavailable" Banner

**Symptoms:**
- Red banner appears on frontend
- API requests failing
- Users cannot book appointments

**Diagnosis Steps:**
```bash
# Check backend health
curl https://api.caregrid.co.uk/health

# Check CareGrid Ops dashboard
# Navigate to System Health section

# Check server logs
tail -f backend/logs/error.log
```

**Common Causes & Fixes:**

#### Backend Server Down
```bash
# Check if process is running
ps aux | grep node

# Restart backend service
cd backend
npm start

# Check for port conflicts
lsof -i :3001
```

#### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool
# Review CareGrid Ops > Database > Connection Pool

# Restart with fresh connections
# Kill backend process and restart
```

#### CORS Configuration Error
```javascript
// Check backend/server.js CORS settings
const corsOptions = {
  origin: [
    'https://www.caregrid.co.uk',
    'https://caregrid.co.uk',
    'https://caregrid-ops.vercel.app'
  ]
};
```

### 2. Authentication Failures

**Symptoms:**
- Users cannot log in
- "Invalid credentials" errors
- Session expires immediately

**Diagnosis Steps:**
1. **Check CareGrid Ops** > Users > Authentication Logs
2. **Verify JWT Secret** consistency across environments
3. **Test API endpoint** directly

```bash
# Test login endpoint
curl -X POST https://api.caregrid.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'
```

**Common Fixes:**

#### JWT Secret Mismatch
```bash
# Check environment variables
echo $JWT_SECRET

# Verify in backend/.env
cat backend/.env | grep JWT_SECRET

# Update if different
```

#### Token Storage Issues
```javascript
// Clear localStorage in browser console
localStorage.clear();

// Check token format
console.log(localStorage.getItem('authToken'));
```

#### Database User Issues
```sql
-- Check user exists
SELECT * FROM users WHERE email = 'user@example.com';

-- Check password hash
SELECT password_hash FROM users WHERE email = 'user@example.com';
```

### 3. Booking Flow Failures

**Symptoms:**
- Booking form submission fails
- "Clinic not available" errors
- Confirmation emails not sent

**Diagnosis Steps:**
1. **CareGrid Ops** > Bookings > Recent Attempts
2. **Check clinic data** seeding
3. **Verify email service** configuration

**Common Fixes:**

#### Missing Clinic Data
```bash
# Check if clinics are seeded
psql $DATABASE_URL -c "SELECT COUNT(*) FROM clinics;"

# Re-run seeding if empty
cd backend
npm run seed
```

#### Email Service Issues
```bash
# Check email service configuration
echo $EMAIL_SERVICE_API_KEY

# Test email endpoint
curl -X POST https://api.caregrid.co.uk/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test"}'
```

#### Database Constraint Violations
```sql
-- Check booking constraints
SELECT * FROM bookings WHERE clinic_id = 1 AND booking_date = '2024-01-15';

-- Check for conflicts
SELECT * FROM bookings 
WHERE clinic_id = 1 
AND booking_date = '2024-01-15' 
AND booking_time = '10:00';
```

### 4. Performance Degradation

**Symptoms:**
- Slow page loads
- API timeouts
- High server resource usage

**Diagnosis Steps:**
1. **CareGrid Ops** > Performance > Response Times
2. **Database** > Slow Queries
3. **System** > Resource Usage

**Performance Fixes:**

#### Database Query Optimization
```sql
-- Identify slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Add missing indexes
CREATE INDEX idx_bookings_clinic_date 
ON bookings(clinic_id, booking_date);
```

#### Memory Leaks
```bash
# Monitor memory usage
top -p $(pgrep node)

# Check for memory leaks in CareGrid Ops
# Navigate to System > Memory Usage

# Restart if memory usage is high
pm2 restart backend
```

#### Cache Issues
```bash
# Clear application cache
# Check CareGrid Ops > Cache > Clear All

# Verify cache headers
curl -I https://api.caregrid.co.uk/api/clinics
```

### 5. Frontend JavaScript Errors

**Symptoms:**
- Broken functionality
- Console errors
- White screen of death

**Diagnosis Steps:**
1. **Browser Console** - Check for JavaScript errors
2. **Network Tab** - Failed resource loads
3. **CareGrid Ops** > Frontend Errors

**Common Fixes:**

#### Missing Dependencies
```html
<!-- Check script loading order in HTML -->
<script src="js/config.js"></script>
<script src="js/api-service.js"></script>
<script src="js/auth.js"></script>
```

#### API Configuration Issues
```javascript
// Check js/config.js
const API_BASE_URL = 'https://api.caregrid.co.uk';

// Verify endpoints are accessible
fetch(API_BASE_URL + '/health')
  .then(response => console.log(response.status));
```

#### CORS Errors
```javascript
// Check browser console for CORS errors
// Verify backend CORS configuration
// Ensure frontend domain is in allowlist
```

## CareGrid Ops Monitoring Guide

### Dashboard Overview

#### System Health Section
- **Green**: All systems operational
- **Yellow**: Warning conditions detected
- **Red**: Critical issues requiring immediate attention

#### Key Metrics to Monitor
1. **API Response Time** - Should be < 500ms average
2. **Error Rate** - Should be < 1% of total requests
3. **Database Connections** - Should not exceed 80% of pool
4. **Memory Usage** - Should be < 80% of available
5. **Disk Space** - Should have > 20% free space

### Alert Configuration

#### Critical Alerts (Immediate Response)
- API response time > 2 seconds
- Error rate > 5%
- Database connection failures
- Service completely down

#### Warning Alerts (Monitor Closely)
- API response time > 1 second
- Error rate > 2%
- Memory usage > 80%
- Disk space < 30%

### Error Log Analysis

#### Error Categories
1. **4xx Errors** - Client-side issues (bad requests, auth failures)
2. **5xx Errors** - Server-side issues (database errors, crashes)
3. **Database Errors** - Connection, query, constraint violations
4. **External Service Errors** - Email, payment, third-party APIs

#### Log Filtering
```bash
# Filter by error type
grep "ERROR" backend/logs/app.log | tail -50

# Filter by time range
grep "2024-01-15" backend/logs/app.log | grep "ERROR"

# Filter by specific endpoint
grep "/api/bookings" backend/logs/app.log | grep "ERROR"
```

## Preventive Maintenance

### Daily Checks
- [ ] System health indicators all green
- [ ] Error rate below 1%
- [ ] No critical alerts
- [ ] Database backup completed
- [ ] SSL certificates valid

### Weekly Checks
- [ ] Performance trends review
- [ ] Security scan results
- [ ] Dependency update check
- [ ] Disk space monitoring
- [ ] User feedback review

### Monthly Checks
- [ ] Full system backup test
- [ ] Disaster recovery drill
- [ ] Security audit
- [ ] Performance optimization
- [ ] Capacity planning review

## Emergency Contacts & Escalation

### Severity Levels

#### P0 - Critical (Immediate Response)
- Complete service outage
- Data breach or security incident
- Payment processing failures
- Database corruption

#### P1 - High (Response within 2 hours)
- Partial service degradation
- Authentication system issues
- Booking system failures
- Performance severely impacted

#### P2 - Medium (Response within 24 hours)
- Minor feature issues
- Non-critical performance issues
- UI/UX problems
- Email delivery delays

#### P3 - Low (Response within 72 hours)
- Enhancement requests
- Documentation updates
- Minor cosmetic issues
- Feature requests

### Escalation Procedure
1. **Initial Response** - Acknowledge issue in CareGrid Ops
2. **Assessment** - Determine severity and impact
3. **Communication** - Update stakeholders
4. **Resolution** - Implement fix and test
5. **Post-mortem** - Document lessons learned

## Recovery Procedures

### Database Recovery
```bash
# Restore from backup
pg_restore -d caregrid_production backup_file.sql

# Verify data integrity
psql caregrid_production -c "SELECT COUNT(*) FROM users;"

# Run health checks
curl https://api.caregrid.co.uk/health
```

### Application Recovery
```bash
# Rollback to previous version
git checkout previous-stable-tag
npm install
npm start

# Verify functionality
curl https://api.caregrid.co.uk/health
```

### Cache Recovery
```bash
# Clear all caches
# Use CareGrid Ops > Cache > Clear All

# Restart services
pm2 restart all

# Warm up cache
curl https://api.caregrid.co.uk/api/clinics
```

This playbook provides comprehensive guidance for maintaining CareGrid's health and resolving issues quickly when they arise. Always use CareGrid Ops as your primary monitoring and diagnostic tool.