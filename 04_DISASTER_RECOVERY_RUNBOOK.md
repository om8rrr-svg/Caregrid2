# CareGrid Disaster Recovery Runbook

🚨 **Enterprise-Grade Disaster Recovery & Business Continuity Plan**

This runbook provides comprehensive disaster recovery procedures for CareGrid, ensuring minimal downtime and data protection in healthcare-critical scenarios.

---

## 🎯 Recovery Objectives

### Service Level Agreements (SLAs)

| Service Tier | RTO (Recovery Time) | RPO (Recovery Point) | Availability |
|--------------|--------------------|--------------------|-------------|
| **Critical** | < 15 minutes | < 5 minutes | 99.99% |
| **High** | < 1 hour | < 15 minutes | 99.9% |
| **Standard** | < 4 hours | < 1 hour | 99.5% |

### Service Classification

**Critical Services (Tier 1):**
- Patient appointment booking
- Emergency clinic lookup
- Authentication system
- Core API endpoints

**High Priority Services (Tier 2):**
- Clinic management dashboard
- Patient profiles
- Review system
- Payment processing

**Standard Services (Tier 3):**
- Analytics dashboard
- Marketing pages
- Non-critical integrations

---

## 🔥 Incident Classification

### P0 - Critical (RTO: 15 minutes)
**Healthcare Impact:** Patient safety at risk
- Complete system outage
- Database corruption
- Security breach with PHI exposure
- Payment system failure

**Response Team:** All hands on deck
**Escalation:** Immediate C-level notification

### P1 - High (RTO: 1 hour)
**Healthcare Impact:** Service degradation
- Partial system outage
- Performance degradation (>5s response)
- Authentication issues
- Third-party service failures

**Response Team:** On-call engineer + DevOps
**Escalation:** Engineering manager notification

### P2 - Medium (RTO: 4 hours)
**Healthcare Impact:** Minor inconvenience
- Non-critical feature failures
- Cosmetic issues
- Monitoring alerts
- Scheduled maintenance issues

**Response Team:** On-call engineer
**Escalation:** Standard ticket process

---

## 🚨 Emergency Response Procedures

### Immediate Response (First 5 Minutes)

**1. Incident Detection & Triage**
```bash
# Check system status
curl -f https://caregrid.vercel.app/api/health

# Verify database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check critical services
curl -f https://caregrid.vercel.app/api/appointments/health
curl -f https://caregrid.vercel.app/api/auth/health
```

**2. Activate Incident Response**
```bash
# Create incident channel
slack-cli create-channel "incident-$(date +%Y%m%d-%H%M)"

# Page on-call team
pagerduty trigger-incident "CareGrid P0: System Outage"

# Update status page
statuspage update "Investigating service disruption"
```

**3. Initial Assessment**
- [ ] Identify affected services
- [ ] Estimate user impact
- [ ] Determine root cause category
- [ ] Activate appropriate recovery procedure

### Communication Protocol

**Internal Communications:**
```
TO: engineering-team@caregrid.com
SUBJECT: [P0] CareGrid System Outage - $(date)

INCIDENT: Brief description
IMPACT: User impact assessment
STATUS: Current status
ETA: Estimated resolution time
NEXT UPDATE: In 15 minutes
```

**External Communications:**
```
TO: users@caregrid.com
SUBJECT: Service Disruption Notice

We are currently experiencing technical difficulties.
Our team is working to resolve this immediately.
For urgent medical needs, please contact your clinic directly.

Status updates: https://status.caregrid.com
```

---

## 🔧 Recovery Procedures

### Scenario 1: Complete System Outage

**Symptoms:**
- Website returns 5xx errors
- API endpoints unresponsive
- Database connection failures

**Recovery Steps:**

**Step 1: Verify Infrastructure**
```bash
# Check Vercel deployment status
vercel ls --scope=caregrid

# Verify DNS resolution
nslookup caregrid.vercel.app
dig caregrid.vercel.app

# Check CDN status
curl -I https://caregrid.vercel.app
```

**Step 2: Database Recovery**
```bash
# Check Supabase status
curl -f https://api.supabase.com/v1/projects/$PROJECT_ID/health

# Verify database connectivity
psql $DATABASE_URL -c "SELECT version();"

# Check connection pool
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

**Step 3: Application Recovery**
```bash
# Redeploy from last known good state
git checkout $(git log --oneline -n 10 | grep "Production:" | head -1 | cut -d' ' -f1)
vercel --prod

# Verify deployment
curl -f https://caregrid.vercel.app/api/health
```

**Step 4: Service Validation**
```bash
# Run health checks
npm run test:health-check

# Verify critical paths
curl -f https://caregrid.vercel.app/api/appointments
curl -f https://caregrid.vercel.app/api/clinics
curl -f https://caregrid.vercel.app/api/auth/session
```

### Scenario 2: Database Corruption/Failure

**Symptoms:**
- Database connection errors
- Data inconsistency
- Query timeouts

**Recovery Steps:**

**Step 1: Assess Damage**
```sql
-- Check database integrity
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE schemaname = 'public';

-- Verify critical tables
SELECT count(*) FROM users;
SELECT count(*) FROM clinics;
SELECT count(*) FROM appointments;
```

**Step 2: Point-in-Time Recovery**
```bash
# Identify last good backup
supabase db list-backups

# Restore from backup (if needed)
supabase db restore --backup-id=$BACKUP_ID

# Verify restoration
psql $DATABASE_URL -c "SELECT max(created_at) FROM appointments;"
```

**Step 3: Data Validation**
```sql
-- Run data integrity checks
SELECT 
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check referential integrity
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f';
```

### Scenario 3: Security Breach

**Symptoms:**
- Unauthorized access detected
- Suspicious database queries
- Data exfiltration alerts

**Immediate Actions:**

**Step 1: Contain the Breach**
```bash
# Rotate all API keys immediately
supabase secrets set DATABASE_URL="$NEW_DATABASE_URL"
vercel env rm DATABASE_URL
vercel env add DATABASE_URL="$NEW_DATABASE_URL"

# Invalidate all user sessions
psql $DATABASE_URL -c "DELETE FROM auth.sessions;"

# Enable IP restrictions
supabase network-restrictions add --cidr="OFFICE_IP/32"
```

**Step 2: Forensic Analysis**
```sql
-- Check access logs
SELECT 
  timestamp,
  user_id,
  action,
  resource,
  ip_address
FROM audit_logs 
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Identify compromised accounts
SELECT 
  u.email,
  u.last_sign_in_at,
  u.sign_in_count
FROM auth.users u
WHERE u.last_sign_in_at > NOW() - INTERVAL '24 hours';
```

**Step 3: Breach Notification**
```bash
# HIPAA breach notification (if PHI involved)
echo "Potential PHI breach detected at $(date)" | \
  mail -s "URGENT: HIPAA Breach Notification" compliance@caregrid.com

# Regulatory notification (within 72 hours)
# Document all affected records
# Prepare breach assessment report
```

### Scenario 4: Third-Party Service Failure

**Common Failures:**
- Supabase outage
- Vercel deployment issues
- Cloudinary CDN problems
- Payment processor downtime

**Recovery Steps:**

**Step 1: Activate Fallbacks**
```bash
# Switch to backup CDN
export CDN_URL="https://backup-cdn.caregrid.com"
vercel env add CDN_URL="$CDN_URL"

# Enable maintenance mode
vercel env add MAINTENANCE_MODE="true"

# Deploy maintenance page
vercel --prod
```

**Step 2: Monitor Service Status**
```bash
# Check service status pages
curl -s https://status.supabase.com/api/v2/status.json
curl -s https://www.vercel-status.com/api/v2/status.json

# Set up monitoring
while true; do
  curl -f https://api.supabase.com/v1/projects/$PROJECT_ID/health || \
    echo "Supabase still down at $(date)"
  sleep 60
done
```

---

## 📊 Recovery Validation

### Health Check Suite

**Critical Path Testing:**
```bash
#!/bin/bash
# scripts/health-check.sh

echo "🔍 Running post-recovery validation..."

# Test authentication
echo "Testing authentication..."
TOKEN=$(curl -s -X POST https://caregrid.vercel.app/api/auth/login \
  -d '{"email":"test@caregrid.com","password":"test123"}' | \
  jq -r '.access_token')

if [ "$TOKEN" != "null" ]; then
  echo "✅ Authentication working"
else
  echo "❌ Authentication failed"
  exit 1
fi

# Test appointment booking
echo "Testing appointment booking..."
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  https://caregrid.vercel.app/api/appointments)

if echo "$RESPONSE" | jq -e '.appointments' > /dev/null; then
  echo "✅ Appointment system working"
else
  echo "❌ Appointment system failed"
  exit 1
fi

# Test clinic search
echo "Testing clinic search..."
RESPONSE=$(curl -s https://caregrid.vercel.app/api/clinics?search=dental)

if echo "$RESPONSE" | jq -e '.clinics' > /dev/null; then
  echo "✅ Clinic search working"
else
  echo "❌ Clinic search failed"
  exit 1
fi

echo "🎉 All critical systems operational"
```

**Performance Validation:**
```bash
# Response time check
for endpoint in "/api/health" "/api/clinics" "/api/appointments"; do
  RESPONSE_TIME=$(curl -w "%{time_total}" -s -o /dev/null \
    https://caregrid.vercel.app$endpoint)
  
  if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
    echo "⚠️  Slow response: $endpoint (${RESPONSE_TIME}s)"
  else
    echo "✅ Fast response: $endpoint (${RESPONSE_TIME}s)"
  fi
done
```

### Data Integrity Checks

```sql
-- Verify data consistency
SELECT 
  'users' as table_name,
  count(*) as record_count,
  max(created_at) as latest_record
FROM users
UNION ALL
SELECT 
  'appointments',
  count(*),
  max(created_at)
FROM appointments
UNION ALL
SELECT 
  'clinics',
  count(*),
  max(created_at)
FROM clinics;

-- Check for orphaned records
SELECT 
  a.id,
  a.user_id,
  a.clinic_id
FROM appointments a
LEFT JOIN users u ON a.user_id = u.id
LEFT JOIN clinics c ON a.clinic_id = c.id
WHERE u.id IS NULL OR c.id IS NULL;
```

---

## 🔄 Backup & Recovery Strategy

### Automated Backup Schedule

**Database Backups:**
- **Continuous:** WAL-E streaming (RPO: 5 minutes)
- **Hourly:** Point-in-time snapshots
- **Daily:** Full database dump
- **Weekly:** Cross-region backup
- **Monthly:** Long-term archival

**Application Backups:**
- **Git:** All code changes tracked
- **Vercel:** Deployment history (50 deployments)
- **Environment:** Encrypted config backups
- **Assets:** CDN with multi-region replication

### Recovery Testing

**Monthly Recovery Drills:**
```bash
#!/bin/bash
# scripts/recovery-drill.sh

echo "🧪 Starting monthly recovery drill..."

# Create test environment
vercel env add DRILL_MODE="true" --scope=caregrid-test

# Restore from 24h old backup
BACKUP_ID=$(supabase db list-backups | grep "24 hours ago" | cut -d' ' -f1)
supabase db restore --backup-id=$BACKUP_ID --target=test-db

# Run validation suite
npm run test:recovery-validation

# Measure recovery time
echo "Recovery completed in: $(($(date +%s) - $START_TIME)) seconds"

# Cleanup test environment
vercel env rm DRILL_MODE --scope=caregrid-test
```

### Backup Validation

```sql
-- Verify backup integrity
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check backup freshness
SELECT 
  table_name,
  max(created_at) as latest_record,
  NOW() - max(created_at) as age
FROM (
  SELECT 'users' as table_name, max(created_at) as created_at FROM users
  UNION ALL
  SELECT 'appointments', max(created_at) FROM appointments
  UNION ALL
  SELECT 'clinics', max(created_at) FROM clinics
) t
GROUP BY table_name;
```

---

## 📞 Emergency Contacts

### Internal Team

**Primary On-Call:**
- **DevOps Lead:** +1-555-0101 (24/7)
- **Engineering Manager:** +1-555-0102
- **CTO:** +1-555-0103 (P0 only)

**Secondary On-Call:**
- **Senior Developer:** +1-555-0104
- **Database Admin:** +1-555-0105
- **Security Officer:** +1-555-0106

### External Vendors

**Infrastructure:**
- **Vercel Support:** support@vercel.com (Enterprise)
- **Supabase Support:** support@supabase.com (Pro)
- **Cloudinary Support:** support@cloudinary.com

**Compliance:**
- **Legal Counsel:** legal@caregrid.com
- **HIPAA Consultant:** hipaa@compliancepartner.com
- **Cyber Insurance:** claims@cyberinsurance.com

### Escalation Matrix

| Time | P0 | P1 | P2 |
|------|----|----|----|
| 0-15 min | On-call engineer | On-call engineer | On-call engineer |
| 15-30 min | + Engineering Manager | On-call engineer | On-call engineer |
| 30-60 min | + CTO | + Engineering Manager | On-call engineer |
| 1+ hours | + CEO | + Engineering Manager | Standard process |

---

## 📈 Post-Incident Procedures

### Incident Review Process

**Within 24 Hours:**
- [ ] Conduct blameless post-mortem
- [ ] Document timeline of events
- [ ] Identify root cause
- [ ] Create action items

**Within 48 Hours:**
- [ ] Update runbook with lessons learned
- [ ] Implement immediate fixes
- [ ] Schedule follow-up improvements
- [ ] Notify stakeholders of resolution

**Within 1 Week:**
- [ ] Complete all action items
- [ ] Update monitoring/alerting
- [ ] Conduct team retrospective
- [ ] Update disaster recovery plan

### Post-Mortem Template

```markdown
# Incident Post-Mortem: [INCIDENT-ID]

## Summary
**Date:** [DATE]
**Duration:** [DURATION]
**Impact:** [USER IMPACT]
**Root Cause:** [ROOT CAUSE]

## Timeline
- **[TIME]:** Incident detected
- **[TIME]:** Response team activated
- **[TIME]:** Root cause identified
- **[TIME]:** Fix implemented
- **[TIME]:** Service restored
- **[TIME]:** Incident closed

## What Went Well
- [POSITIVE ASPECTS]

## What Went Wrong
- [ISSUES IDENTIFIED]

## Action Items
- [ ] [ACTION 1] - Owner: [NAME] - Due: [DATE]
- [ ] [ACTION 2] - Owner: [NAME] - Due: [DATE]

## Lessons Learned
- [KEY TAKEAWAYS]
```

---

## 🔍 Monitoring & Alerting

### Critical Alerts

**System Health:**
```yaml
# monitoring/alerts.yml
alerts:
  - name: "System Down"
    condition: "http_response_code != 200"
    threshold: "3 consecutive failures"
    notification: "pagerduty + slack"
    severity: "P0"
  
  - name: "High Response Time"
    condition: "response_time > 5s"
    threshold: "5 minutes"
    notification: "slack"
    severity: "P1"
  
  - name: "Database Connection Failure"
    condition: "db_connections_failed > 0"
    threshold: "immediate"
    notification: "pagerduty + slack"
    severity: "P0"
```

**Business Metrics:**
```yaml
  - name: "Appointment Booking Failure"
    condition: "booking_success_rate < 95%"
    threshold: "10 minutes"
    notification: "slack"
    severity: "P1"
  
  - name: "Payment Processing Failure"
    condition: "payment_success_rate < 98%"
    threshold: "5 minutes"
    notification: "pagerduty + slack"
    severity: "P0"
```

### Dashboard URLs

- **System Status:** https://status.caregrid.com
- **Vercel Analytics:** https://vercel.com/caregrid/analytics
- **Supabase Metrics:** https://app.supabase.com/project/metrics
- **Error Tracking:** https://sentry.io/caregrid/
- **Uptime Monitoring:** https://pingdom.com/caregrid/

---

## 🧪 Testing & Validation

### Disaster Recovery Testing Schedule

**Monthly Tests:**
- [ ] Database backup restoration
- [ ] Application rollback procedures
- [ ] Monitoring alert validation
- [ ] Communication protocol test

**Quarterly Tests:**
- [ ] Full system recovery drill
- [ ] Cross-region failover test
- [ ] Security incident simulation
- [ ] Business continuity validation

**Annual Tests:**
- [ ] Complete disaster scenario
- [ ] Third-party vendor coordination
- [ ] Regulatory compliance audit
- [ ] Insurance claim simulation

### Test Results Tracking

```bash
# scripts/test-tracking.sh
echo "DR Test Results - $(date)" >> dr-test-log.txt
echo "RTO Target: 15 minutes" >> dr-test-log.txt
echo "RTO Actual: $ACTUAL_RTO minutes" >> dr-test-log.txt
echo "RPO Target: 5 minutes" >> dr-test-log.txt
echo "RPO Actual: $ACTUAL_RPO minutes" >> dr-test-log.txt
echo "Success: $TEST_SUCCESS" >> dr-test-log.txt
echo "---" >> dr-test-log.txt
```

---

## 📋 Recovery Checklist

### Pre-Recovery Checklist
- [ ] Incident severity assessed
- [ ] Response team activated
- [ ] Stakeholders notified
- [ ] Status page updated
- [ ] Recovery procedure selected

### During Recovery Checklist
- [ ] Progress updates every 15 minutes
- [ ] Actions documented in real-time
- [ ] Backup plans ready if primary fails
- [ ] Team coordination maintained
- [ ] Customer communication ongoing

### Post-Recovery Checklist
- [ ] All systems validated
- [ ] Performance metrics normal
- [ ] Data integrity confirmed
- [ ] Security posture verified
- [ ] Stakeholders notified of resolution
- [ ] Post-mortem scheduled
- [ ] Documentation updated

---

**Status:** 🚨 Enterprise Disaster Recovery Ready

*This runbook ensures CareGrid can recover from any disaster scenario while maintaining healthcare-grade reliability and compliance standards.*