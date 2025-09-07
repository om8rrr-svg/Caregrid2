# CareGrid Production Hardening Guide

🔒 **Enterprise-Grade Security & Operations Checklist**

This guide transforms your cloud-native CareGrid from "production-ready" to "enterprise-grade" and "audit-ready".

---

## 🎯 Current Status

✅ **Cloud Migration Complete**
- Images → CDN optimized (Cloudinary)
- APIs → Serverless (Vercel)
- Frontend → Cloud-only dependencies
- Configuration → Centralized & encrypted
- Testing → Deployment validation

⚠️ **Next Phase: Production Hardening**

---

## 🔐 1. Database Security (Supabase)

### Row Level Security (RLS)

**Status:** ⚠️ Critical - Execute immediately

```bash
# Deploy RLS policies
psql -h your-supabase-host -U postgres -d postgres -f supabase-rls-policies.sql
```

**Key Policies Implemented:**
- Users can only access their own data
- Clinic owners manage their clinics/appointments
- Admins have full access with audit trails
- Public clinic directory (published only)
- Review system with ownership validation

### Security Checklist

- [ ] **Enable RLS on all tables**
- [ ] **Deploy security policies** (`supabase-rls-policies.sql`)
- [ ] **Rotate SERVICE_ROLE_KEY** (monthly)
- [ ] **Verify anon key usage** (frontend only)
- [ ] **Enable Supabase audit logs**
- [ ] **Set up auth failure alerts**

### Key Rotation Schedule

```bash
# Monthly key rotation (add to cron)
# 1. Generate new service role key in Supabase dashboard
# 2. Update Vercel environment variables
# 3. Deploy and test
# 4. Revoke old key
```

---

## 📊 2. Monitoring & Alerts

### Error Tracking - Sentry

**Setup:**

```javascript
// Add to js/config.js
const SENTRY_CONFIG = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter sensitive data
    if (event.exception) {
      const error = event.exception.values[0];
      if (error.value && error.value.includes('password')) {
        return null; // Don't send password errors
      }
    }
    return event;
  }
};
```

**Environment Variables:**
```bash
# Add to .env.production
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-auth-token
```

### Uptime Monitoring - Pingdom/Cronitor

**Endpoints to Monitor:**
- `https://caregrid.vercel.app/` (main site)
- `https://caregrid.vercel.app/api/health` (API health)
- `https://caregrid.vercel.app/api/clinics` (core functionality)

**Alert Thresholds:**
- Response time > 2 seconds
- Downtime > 30 seconds
- Error rate > 5%

### Database Monitoring

**Supabase Alerts:**
- Database connections > 80%
- Storage usage > 80%
- API requests > 90% of quota
- Auth failures > 10/minute

**Custom Monitoring:**
```sql
-- Add to Supabase cron jobs
SELECT 
  COUNT(*) as failed_logins,
  DATE_TRUNC('hour', created_at) as hour
FROM auth.audit_log_entries 
WHERE event_name = 'user_signedin_failed'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY hour
HAVING COUNT(*) > 10;
```

---

## 🔄 3. Rollback Strategy

### Vercel Rollback

**Emergency Rollback (< 2 minutes):**
```bash
# Method 1: Vercel CLI
vercel rollback --yes

# Method 2: Dashboard
# 1. Go to Vercel dashboard
# 2. Select deployment
# 3. Click "Promote to Production"
```

**Rollback Checklist:**
- [ ] Identify last known good deployment
- [ ] Check database compatibility
- [ ] Verify environment variables
- [ ] Test critical user flows
- [ ] Monitor error rates post-rollback

### Database Rollback

**Supabase Backup Strategy:**
```bash
# Daily automated backups (set in Supabase dashboard)
# Point-in-time recovery available for 7 days

# Manual backup before major changes
pg_dump -h your-supabase-host -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

**Emergency Database Rollback:**
1. **Stop all write operations** (maintenance mode)
2. **Restore from backup:**
   ```sql
   -- In Supabase SQL editor
   SELECT * FROM pg_stat_activity WHERE state = 'active';
   -- Terminate active connections if needed
   ```
3. **Verify data integrity**
4. **Resume operations**

---

## 💰 4. Cost & Scaling Controls

### Supabase Limits

```sql
-- Storage cleanup (run weekly)
DELETE FROM storage.objects 
WHERE created_at < NOW() - INTERVAL '90 days'
AND bucket_id = 'temp-uploads';

-- Audit log cleanup (run monthly)
DELETE FROM audit_log 
WHERE created_at < NOW() - INTERVAL '6 months';
```

**Cost Monitoring:**
- Set storage limit: 10GB (adjust as needed)
- API request alerts: 80% of monthly quota
- Database size alerts: 8GB (Pro plan limit)

### Cloudinary Optimization

```javascript
// Add to image optimizer
const CLOUDINARY_LIMITS = {
  maxTransformations: 25000, // Monthly limit
  maxStorage: 25, // GB limit
  alertThreshold: 0.8 // 80% usage alert
};

// Monitor usage
const checkCloudinaryUsage = async () => {
  const usage = await cloudinary.v2.api.usage();
  if (usage.transformations / CLOUDINARY_LIMITS.maxTransformations > CLOUDINARY_LIMITS.alertThreshold) {
    // Send alert
  }
};
```

### Redis/Stripe Alerts

**Environment Variables:**
```bash
# Cost monitoring
REDIS_MEMORY_LIMIT=256mb
STRIPE_WEBHOOK_TOLERANCE=300
MAX_DAILY_TRANSACTIONS=1000
```

---

## ⚡ 5. Performance Validation

### Lighthouse Benchmarks

**Before Migration (Baseline):**
```bash
# Run and save baseline
lighthouse https://old-caregrid.com --output=json --output-path=./benchmarks/before.json
```

**After Migration (Target):**
- Performance: 90+ (vs baseline 70)
- Accessibility: 95+ (vs baseline 85)
- Best Practices: 90+ (vs baseline 75)
- SEO: 95+ (vs baseline 80)

**Automated Testing:**
```javascript
// Add to package.json scripts
"scripts": {
  "perf-test": "lighthouse https://caregrid.vercel.app --output=json --output-path=./benchmarks/current.json",
  "perf-compare": "node scripts/compare-lighthouse.js"
}
```

### API Performance

**Response Time Targets:**
- GET /api/clinics: < 200ms (p95)
- POST /api/appointments: < 500ms (p95)
- GET /api/health: < 100ms (p95)

**Load Testing:**
```bash
# Install k6 for load testing
npm install -g k6

# Run load test
k6 run scripts/load-test.js
```

**Load Test Script:**
```javascript
// scripts/load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
};

export default function() {
  let response = http.get('https://caregrid.vercel.app/api/clinics');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## 🚨 6. Security Headers & Compliance

### Vercel Security Headers

**Add to `vercel.json`:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.supabase.co https://api.stripe.com;"
        }
      ]
    }
  ]
}
```

### GDPR Compliance

**Data Processing:**
- [ ] User consent management
- [ ] Data export functionality
- [ ] Data deletion (right to be forgotten)
- [ ] Privacy policy updates
- [ ] Cookie consent banner

---

## 📋 7. Deployment Checklist

### Pre-Deployment

- [ ] **Security scan** (`npm audit --audit-level=high`)
- [ ] **Dependency updates** (security patches only)
- [ ] **Environment variables** (production values)
- [ ] **Database migrations** (test in staging)
- [ ] **Performance tests** (Lighthouse + load test)

### Deployment

- [ ] **Deploy to staging** first
- [ ] **Run smoke tests**
- [ ] **Deploy to production**
- [ ] **Verify health endpoints**
- [ ] **Monitor error rates** (first 30 minutes)

### Post-Deployment

- [ ] **Performance validation** (Lighthouse scores)
- [ ] **User acceptance testing** (critical flows)
- [ ] **Monitor alerts** (24 hours)
- [ ] **Update documentation**

---

## 🎯 Success Metrics

### Technical KPIs

- **Uptime:** 99.9% (target)
- **Response Time:** < 200ms (p95)
- **Error Rate:** < 0.1%
- **Security Score:** A+ (SSL Labs)
- **Performance Score:** 90+ (Lighthouse)

### Business KPIs

- **User Satisfaction:** > 4.5/5
- **Conversion Rate:** Baseline + 15%
- **Support Tickets:** Baseline - 30%
- **Cost per User:** Baseline - 20%

---

## 🔧 Emergency Contacts

### Service Providers

- **Vercel Support:** [Vercel Dashboard](https://vercel.com/dashboard)
- **Supabase Support:** [Supabase Dashboard](https://app.supabase.com)
- **Cloudinary Support:** [Cloudinary Console](https://cloudinary.com/console)

### Escalation Matrix

1. **P1 (Critical):** Site down, data breach
   - Response: < 15 minutes
   - Contact: On-call engineer + CTO

2. **P2 (High):** Performance degradation, feature broken
   - Response: < 1 hour
   - Contact: Development team lead

3. **P3 (Medium):** Minor bugs, enhancement requests
   - Response: < 24 hours
   - Contact: Product team

---

## 📚 Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Security Headers](https://vercel.com/docs/edge-network/headers)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Web Performance Best Practices](https://web.dev/performance/)

---

**Status:** 🚀 Ready for Enterprise Deployment

*This guide transforms CareGrid from a cloud-native application to an enterprise-grade, audit-ready platform suitable for healthcare environments.*