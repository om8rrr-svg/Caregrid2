# CareGrid Data Lifecycle Management Policies

🗂️ **HIPAA-Compliant Patient Data Retention & Secure Deletion Framework**

This document establishes comprehensive data lifecycle policies for CareGrid, ensuring HIPAA compliance, patient privacy protection, and secure data management throughout the entire data lifecycle.

---

## 📋 Policy Overview

### Regulatory Compliance
- **HIPAA Security Rule** (45 CFR §164.312)
- **HIPAA Privacy Rule** (45 CFR §164.502)
- **State Medical Records Laws**
- **GDPR Article 17** (Right to Erasure)
- **CCPA Section 1798.105** (Right to Delete)

### Data Classification

| Data Type | Sensitivity | Retention Period | Deletion Method |
|-----------|-------------|------------------|----------------|
| **PHI (Protected Health Information)** | Critical | 7 years | Cryptographic erasure |
| **Appointment Records** | High | 7 years | Secure overwrite |
| **Payment Information** | High | 7 years | Immediate tokenization |
| **User Profiles** | Medium | Account lifetime + 30 days | Standard deletion |
| **Audit Logs** | High | 10 years | Encrypted archival |
| **Analytics Data** | Low | 2 years | Bulk deletion |

---

## 🔒 Data Retention Policies

### Healthcare Records Retention

**Primary Care Records:**
- **Adult Patients:** 7 years from last treatment
- **Pediatric Patients:** 7 years after reaching age of majority (varies by state)
- **Deceased Patients:** 7 years from date of death
- **Mental Health Records:** 10 years (extended retention)

**Appointment & Treatment Data:**
```sql
-- Retention policy implementation
CREATE OR REPLACE FUNCTION enforce_retention_policy()
RETURNS void AS $$
BEGIN
  -- Mark records for deletion after retention period
  UPDATE appointments 
  SET deletion_scheduled = NOW() + INTERVAL '30 days'
  WHERE created_at < NOW() - INTERVAL '7 years'
    AND deletion_scheduled IS NULL;
  
  -- Mark user profiles for deletion (inactive accounts)
  UPDATE user_profiles 
  SET deletion_scheduled = NOW() + INTERVAL '30 days'
  WHERE last_activity < NOW() - INTERVAL '3 years'
    AND deletion_scheduled IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily retention policy enforcement
SELECT cron.schedule('retention-policy', '0 2 * * *', 'SELECT enforce_retention_policy();');
```

**Legal Hold Procedures:**
```sql
-- Legal hold implementation
CREATE TABLE legal_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(100) NOT NULL,
  patient_id UUID REFERENCES users(id),
  hold_reason TEXT NOT NULL,
  hold_start_date TIMESTAMP DEFAULT NOW(),
  hold_end_date TIMESTAMP,
  authorized_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prevent deletion of records under legal hold
CREATE OR REPLACE FUNCTION check_legal_hold()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM legal_holds 
    WHERE patient_id = OLD.user_id 
      AND (hold_end_date IS NULL OR hold_end_date > NOW())
  ) THEN
    RAISE EXCEPTION 'Cannot delete record under legal hold';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_deletion_under_hold
  BEFORE DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION check_legal_hold();
```

### Business Data Retention

**Operational Data:**
- **System Logs:** 1 year (operational), 7 years (security)
- **Performance Metrics:** 2 years
- **Error Logs:** 1 year
- **Backup Data:** 90 days (operational), 7 years (compliance)

**Marketing & Analytics:**
- **Website Analytics:** 2 years
- **Marketing Campaigns:** 3 years
- **A/B Test Data:** 1 year
- **User Behavior Data:** 2 years (anonymized)

---

## 🗑️ Secure Deletion Procedures

### Data Sanitization Standards

**Level 1 - Standard Deletion:**
- **Method:** Logical deletion with overwrite
- **Use Case:** Non-sensitive operational data
- **Verification:** Deletion confirmation log

**Level 2 - Secure Overwrite:**
- **Method:** DoD 5220.22-M (3-pass overwrite)
- **Use Case:** Sensitive business data
- **Verification:** Cryptographic hash verification

**Level 3 - Cryptographic Erasure:**
- **Method:** Encryption key destruction
- **Use Case:** PHI and critical healthcare data
- **Verification:** Key destruction certificate

### Deletion Implementation

**Automated Deletion Pipeline:**
```javascript
// scripts/data-lifecycle-manager.js
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

class DataLifecycleManager {
  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    this.deletionLog = [];
  }

  async executeScheduledDeletions() {
    console.log('🗑️ Starting scheduled data deletion process...');
    
    try {
      // Get records scheduled for deletion
      const { data: scheduledDeletions } = await this.supabase
        .from('deletion_queue')
        .select('*')
        .lte('deletion_date', new Date().toISOString());

      for (const record of scheduledDeletions) {
        await this.secureDelete(record);
      }

      console.log(`✅ Completed deletion of ${scheduledDeletions.length} records`);
    } catch (error) {
      console.error('❌ Deletion process failed:', error);
      await this.notifyAdministrators(error);
    }
  }

  async secureDelete(record) {
    const { table_name, record_id, deletion_level, data_type } = record;
    
    switch (deletion_level) {
      case 'CRYPTOGRAPHIC_ERASURE':
        await this.cryptographicErasure(table_name, record_id);
        break;
      case 'SECURE_OVERWRITE':
        await this.secureOverwrite(table_name, record_id);
        break;
      case 'STANDARD_DELETION':
        await this.standardDeletion(table_name, record_id);
        break;
    }

    // Log deletion for audit trail
    await this.logDeletion(record);
  }

  async cryptographicErasure(table, recordId) {
    // For PHI data, destroy encryption keys
    const keyId = `${table}_${recordId}`;
    
    // Remove encryption key from key management system
    await this.destroyEncryptionKey(keyId);
    
    // Mark record as cryptographically erased
    await this.supabase
      .from(table)
      .update({ 
        data_erased: true, 
        erasure_method: 'CRYPTOGRAPHIC',
        erasure_timestamp: new Date().toISOString()
      })
      .eq('id', recordId);
  }

  async secureOverwrite(table, recordId) {
    // DoD 5220.22-M standard: 3-pass overwrite
    const overwritePatterns = [
      Buffer.alloc(1024, 0x00), // All zeros
      Buffer.alloc(1024, 0xFF), // All ones
      crypto.randomBytes(1024)   // Random data
    ];

    for (const pattern of overwritePatterns) {
      await this.overwriteRecord(table, recordId, pattern);
    }

    // Final deletion
    await this.supabase
      .from(table)
      .delete()
      .eq('id', recordId);
  }

  async standardDeletion(table, recordId) {
    await this.supabase
      .from(table)
      .delete()
      .eq('id', recordId);
  }

  async logDeletion(record) {
    await this.supabase
      .from('deletion_audit_log')
      .insert({
        table_name: record.table_name,
        record_id: record.record_id,
        deletion_method: record.deletion_level,
        deletion_timestamp: new Date().toISOString(),
        authorized_by: 'SYSTEM_AUTOMATED',
        compliance_reason: record.retention_reason
      });
  }
}

// Schedule daily execution
const manager = new DataLifecycleManager();
setInterval(() => {
  manager.executeScheduledDeletions();
}, 24 * 60 * 60 * 1000); // Daily
```

**Manual Deletion Procedures:**
```sql
-- Emergency deletion procedure (with approval)
CREATE OR REPLACE FUNCTION emergency_delete_patient_data(
  p_patient_id UUID,
  p_authorized_by VARCHAR(255),
  p_reason TEXT
)
RETURNS void AS $$
DECLARE
  deletion_id UUID;
BEGIN
  -- Create deletion record
  INSERT INTO emergency_deletions (patient_id, authorized_by, reason)
  VALUES (p_patient_id, p_authorized_by, p_reason)
  RETURNING id INTO deletion_id;
  
  -- Schedule immediate deletion
  INSERT INTO deletion_queue (
    table_name, record_id, deletion_level, 
    deletion_date, emergency_deletion_id
  )
  SELECT 
    'appointments', id, 'CRYPTOGRAPHIC_ERASURE',
    NOW(), deletion_id
  FROM appointments WHERE user_id = p_patient_id;
  
  INSERT INTO deletion_queue (
    table_name, record_id, deletion_level,
    deletion_date, emergency_deletion_id
  )
  SELECT 
    'user_profiles', id, 'CRYPTOGRAPHIC_ERASURE',
    NOW(), deletion_id
  FROM user_profiles WHERE user_id = p_patient_id;
  
  -- Notify administrators
  INSERT INTO admin_notifications (type, message, priority)
  VALUES (
    'EMERGENCY_DELETION',
    'Emergency patient data deletion requested for patient: ' || p_patient_id,
    'HIGH'
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 👤 Patient Rights & Data Subject Requests

### Right to Access (HIPAA & GDPR)

**Data Export Functionality:**
```javascript
// api/patient-data-export.js
export default async function handler(req, res) {
  const { patientId } = req.query;
  const { user } = await getUser(req);
  
  // Verify patient identity
  if (user.id !== patientId && !user.roles.includes('admin')) {
    return res.status(403).json({ error: 'Unauthorized access' });
  }
  
  try {
    // Compile complete patient data
    const patientData = await compilePatientData(patientId);
    
    // Generate secure download link
    const exportId = crypto.randomUUID();
    const downloadUrl = await generateSecureDownload(exportId, patientData);
    
    // Log data access
    await logDataAccess({
      patientId,
      accessType: 'DATA_EXPORT',
      requestedBy: user.id,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      message: 'Data export prepared',
      downloadUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
  } catch (error) {
    console.error('Data export failed:', error);
    res.status(500).json({ error: 'Export failed' });
  }
}

async function compilePatientData(patientId) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  
  const [profile, appointments, reviews, payments] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', patientId).single(),
    supabase.from('appointments').select('*').eq('user_id', patientId),
    supabase.from('clinic_reviews').select('*').eq('user_id', patientId),
    supabase.from('payment_records').select('*').eq('user_id', patientId)
  ]);
  
  return {
    exportDate: new Date().toISOString(),
    patientId,
    profile: profile.data,
    appointments: appointments.data,
    reviews: reviews.data,
    payments: payments.data.map(p => ({
      ...p,
      // Mask sensitive payment data
      cardNumber: p.cardNumber ? `****-****-****-${p.cardNumber.slice(-4)}` : null
    }))
  };
}
```

### Right to Rectification

**Data Correction Workflow:**
```sql
-- Data correction audit trail
CREATE TABLE data_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  correction_reason TEXT,
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  correction_date TIMESTAMP DEFAULT NOW(),
  approval_date TIMESTAMP
);

-- Correction request function
CREATE OR REPLACE FUNCTION request_data_correction(
  p_table_name VARCHAR(100),
  p_record_id UUID,
  p_field_name VARCHAR(100),
  p_new_value TEXT,
  p_reason TEXT,
  p_requested_by UUID
)
RETURNS UUID AS $$
DECLARE
  correction_id UUID;
  old_value TEXT;
BEGIN
  -- Get current value
  EXECUTE format('SELECT %I FROM %I WHERE id = $1', p_field_name, p_table_name)
  INTO old_value USING p_record_id;
  
  -- Create correction request
  INSERT INTO data_corrections (
    table_name, record_id, field_name, 
    old_value, new_value, correction_reason, requested_by
  )
  VALUES (
    p_table_name, p_record_id, p_field_name,
    old_value, p_new_value, p_reason, p_requested_by
  )
  RETURNING id INTO correction_id;
  
  -- Notify administrators
  INSERT INTO admin_notifications (type, message, priority)
  VALUES (
    'DATA_CORRECTION_REQUEST',
    'Data correction requested for ' || p_table_name || '.' || p_field_name,
    'MEDIUM'
  );
  
  RETURN correction_id;
END;
$$ LANGUAGE plpgsql;
```

### Right to Erasure ("Right to be Forgotten")

**Patient-Initiated Deletion:**
```javascript
// api/request-data-deletion.js
export default async function handler(req, res) {
  const { reason, confirmationCode } = req.body;
  const { user } = await getUser(req);
  
  // Verify deletion confirmation
  if (!await verifyDeletionConfirmation(user.id, confirmationCode)) {
    return res.status(400).json({ error: 'Invalid confirmation code' });
  }
  
  try {
    // Check for legal holds
    const legalHolds = await checkLegalHolds(user.id);
    if (legalHolds.length > 0) {
      return res.status(409).json({
        error: 'Cannot delete data under legal hold',
        legalHolds
      });
    }
    
    // Schedule deletion with grace period
    const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await schedulePatientDataDeletion({
      patientId: user.id,
      reason,
      deletionDate,
      requestedBy: user.id
    });
    
    // Send confirmation email
    await sendDeletionConfirmation(user.email, deletionDate);
    
    res.json({
      message: 'Data deletion scheduled',
      deletionDate,
      gracePeriod: '30 days',
      cancellationInstructions: 'Contact support to cancel deletion request'
    });
  } catch (error) {
    console.error('Deletion request failed:', error);
    res.status(500).json({ error: 'Deletion request failed' });
  }
}
```

---

## 📊 Data Lifecycle Monitoring

### Retention Compliance Dashboard

**Key Metrics:**
```sql
-- Data retention compliance metrics
CREATE VIEW retention_compliance_metrics AS
SELECT 
  'appointments' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '7 years') as overdue_retention,
  COUNT(*) FILTER (WHERE deletion_scheduled IS NOT NULL) as scheduled_deletion,
  ROUND(
    (COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 years')::DECIMAL / COUNT(*)) * 100, 2
  ) as compliance_percentage
FROM appointments
UNION ALL
SELECT 
  'user_profiles',
  COUNT(*),
  COUNT(*) FILTER (WHERE last_activity < NOW() - INTERVAL '3 years'),
  COUNT(*) FILTER (WHERE deletion_scheduled IS NOT NULL),
  ROUND(
    (COUNT(*) FILTER (WHERE last_activity >= NOW() - INTERVAL '3 years')::DECIMAL / COUNT(*)) * 100, 2
  )
FROM user_profiles;

-- Deletion audit summary
CREATE VIEW deletion_audit_summary AS
SELECT 
  DATE_TRUNC('month', deletion_timestamp) as month,
  deletion_method,
  COUNT(*) as deletions_count,
  STRING_AGG(DISTINCT table_name, ', ') as affected_tables
FROM deletion_audit_log
WHERE deletion_timestamp >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', deletion_timestamp), deletion_method
ORDER BY month DESC;
```

**Automated Reporting:**
```javascript
// scripts/compliance-report.js
const generateComplianceReport = async () => {
  const report = {
    reportDate: new Date().toISOString(),
    retentionCompliance: await getRetentionCompliance(),
    deletionActivity: await getDeletionActivity(),
    dataSubjectRequests: await getDataSubjectRequests(),
    legalHolds: await getActiveLegalHolds()
  };
  
  // Generate PDF report
  const pdfBuffer = await generatePDF(report);
  
  // Send to compliance team
  await sendComplianceReport(pdfBuffer);
  
  console.log('📊 Monthly compliance report generated and sent');
};

// Schedule monthly report
const cron = require('node-cron');
cron.schedule('0 9 1 * *', generateComplianceReport); // 1st of each month at 9 AM
```

### Alert System

**Compliance Alerts:**
```yaml
# monitoring/data-lifecycle-alerts.yml
alerts:
  - name: "Retention Policy Violation"
    query: "SELECT COUNT(*) FROM appointments WHERE created_at < NOW() - INTERVAL '7 years' AND deletion_scheduled IS NULL"
    threshold: "> 0"
    severity: "HIGH"
    notification: "compliance-team@caregrid.com"
    frequency: "daily"
  
  - name: "Failed Deletion Process"
    query: "SELECT COUNT(*) FROM deletion_queue WHERE deletion_date < NOW() - INTERVAL '1 day'"
    threshold: "> 0"
    severity: "CRITICAL"
    notification: "devops-team@caregrid.com"
    frequency: "immediate"
  
  - name: "High Volume Data Subject Requests"
    query: "SELECT COUNT(*) FROM data_subject_requests WHERE created_at > NOW() - INTERVAL '24 hours'"
    threshold: "> 10"
    severity: "MEDIUM"
    notification: "privacy-team@caregrid.com"
    frequency: "hourly"
```

---

## 🔐 Security & Access Controls

### Data Access Logging

```sql
-- Comprehensive data access audit
CREATE TABLE data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  access_type VARCHAR(50) NOT NULL, -- SELECT, INSERT, UPDATE, DELETE
  access_timestamp TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  data_classification VARCHAR(50), -- PHI, PII, PUBLIC
  access_reason TEXT
);

-- Trigger for automatic logging
CREATE OR REPLACE FUNCTION log_data_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO data_access_log (
    user_id, table_name, record_id, access_type,
    ip_address, data_classification
  )
  VALUES (
    current_setting('app.current_user_id')::UUID,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    current_setting('app.client_ip')::INET,
    CASE 
      WHEN TG_TABLE_NAME IN ('appointments', 'user_profiles') THEN 'PHI'
      WHEN TG_TABLE_NAME IN ('payment_records') THEN 'PII'
      ELSE 'STANDARD'
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to sensitive tables
CREATE TRIGGER audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION log_data_access();

CREATE TRIGGER audit_user_profiles
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION log_data_access();
```

### Role-Based Data Lifecycle Management

```sql
-- Data lifecycle roles
CREATE ROLE data_lifecycle_admin;
CREATE ROLE data_lifecycle_operator;
CREATE ROLE compliance_auditor;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON deletion_queue TO data_lifecycle_operator;
GRANT SELECT ON deletion_audit_log TO compliance_auditor;
GRANT ALL ON deletion_queue, deletion_audit_log TO data_lifecycle_admin;

-- Row-level security for data access
ALTER TABLE deletion_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY deletion_queue_access ON deletion_queue
  FOR ALL TO data_lifecycle_operator
  USING (authorized_by = current_user OR current_user = 'data_lifecycle_admin');
```

---

## 📋 Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Create data classification schema
- [ ] Implement retention policy tables
- [ ] Set up deletion queue system
- [ ] Create audit logging infrastructure
- [ ] Deploy automated retention enforcement

### Phase 2: Patient Rights (Week 3-4)
- [ ] Build data export functionality
- [ ] Implement correction request system
- [ ] Create deletion request workflow
- [ ] Set up confirmation mechanisms
- [ ] Test patient-facing interfaces

### Phase 3: Compliance & Monitoring (Week 5-6)
- [ ] Deploy compliance dashboard
- [ ] Set up automated reporting
- [ ] Configure alert system
- [ ] Create compliance documentation
- [ ] Conduct staff training

### Phase 4: Testing & Validation (Week 7-8)
- [ ] Test all deletion procedures
- [ ] Validate retention policies
- [ ] Audit access controls
- [ ] Perform compliance review
- [ ] Document procedures

---

## 📚 Training & Documentation

### Staff Training Requirements

**All Staff:**
- Data classification awareness
- Patient privacy rights
- Incident reporting procedures
- Basic data handling policies

**Technical Staff:**
- Secure deletion procedures
- Retention policy implementation
- Audit log analysis
- Emergency response protocols

**Compliance Team:**
- Regulatory requirements
- Audit procedures
- Report generation
- Legal hold management

### Documentation Requirements

**Policy Documents:**
- [ ] Data Retention Policy
- [ ] Secure Deletion Procedures
- [ ] Patient Rights Handbook
- [ ] Compliance Audit Guide
- [ ] Emergency Response Plan

**Technical Documentation:**
- [ ] Database Schema Documentation
- [ ] API Endpoint Documentation
- [ ] Monitoring Setup Guide
- [ ] Troubleshooting Manual
- [ ] Recovery Procedures

---

## 🎯 Success Metrics

### Compliance KPIs

- **Retention Compliance:** 100% adherence to retention schedules
- **Deletion Timeliness:** 95% of scheduled deletions completed on time
- **Data Subject Response:** 100% of requests processed within 30 days
- **Audit Trail Completeness:** 100% of data access logged
- **Security Incident Response:** < 24 hours for data-related incidents

### Operational Metrics

- **Automated Deletion Success Rate:** > 99%
- **Manual Intervention Required:** < 1% of deletions
- **Compliance Report Generation:** 100% on-time monthly reports
- **Staff Training Completion:** 100% annual certification
- **Policy Update Frequency:** Quarterly review and updates

---

**Status:** 🗂️ Healthcare Data Lifecycle Management Ready

*This comprehensive framework ensures CareGrid maintains the highest standards of patient data protection, regulatory compliance, and secure data lifecycle management throughout the entire data journey.*