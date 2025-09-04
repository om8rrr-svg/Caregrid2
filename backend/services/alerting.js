const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Alert severity levels
const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Alert types
const ALERT_TYPES = {
  HEALTH_CHECK_FAILED: 'health_check_failed',
  SYNTHETIC_TRANSACTION_FAILED: 'synthetic_transaction_failed',
  DATABASE_CONNECTION_LOST: 'database_connection_lost',
  HIGH_ERROR_RATE: 'high_error_rate',
  PERFORMANCE_DEGRADATION: 'performance_degradation',
  DEPENDENCY_FAILURE: 'dependency_failure',
  SYSTEM_RESOURCE_EXHAUSTION: 'system_resource_exhaustion'
};

// Notification channels
const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  WEBHOOK: 'webhook',
  SLACK: 'slack'
};

// Alert storage
let alertHistory = [];
let alertRules = [];
let notificationChannels = [];
let escalationPolicies = [];
let activeAlerts = new Map();

// Default alert rules
const defaultAlertRules = [
  {
    id: 'health_check_failure',
    name: 'Health Check Failure',
    type: ALERT_TYPES.HEALTH_CHECK_FAILED,
    severity: ALERT_SEVERITY.HIGH,
    condition: {
      metric: 'health_status',
      operator: 'equals',
      value: 'unhealthy',
      duration: 60 // seconds
    },
    enabled: true,
    channels: ['email'],
    escalationPolicy: 'default'
  },
  {
    id: 'synthetic_failure',
    name: 'Synthetic Transaction Failure',
    type: ALERT_TYPES.SYNTHETIC_TRANSACTION_FAILED,
    severity: ALERT_SEVERITY.MEDIUM,
    condition: {
      metric: 'synthetic_success_rate',
      operator: 'less_than',
      value: 80,
      duration: 300 // 5 minutes
    },
    enabled: true,
    channels: ['email'],
    escalationPolicy: 'default'
  },
  {
    id: 'high_error_rate',
    name: 'High Error Rate',
    type: ALERT_TYPES.HIGH_ERROR_RATE,
    severity: ALERT_SEVERITY.HIGH,
    condition: {
      metric: 'error_rate',
      operator: 'greater_than',
      value: 10, // 10%
      duration: 180 // 3 minutes
    },
    enabled: true,
    channels: ['email', 'sms'],
    escalationPolicy: 'critical'
  }
];

// Default escalation policies
const defaultEscalationPolicies = [
  {
    id: 'default',
    name: 'Default Escalation',
    steps: [
      {
        delay: 0, // immediate
        channels: ['email'],
        recipients: ['ops@caregrid.com']
      },
      {
        delay: 900, // 15 minutes
        channels: ['email', 'sms'],
        recipients: ['ops@caregrid.com', 'manager@caregrid.com']
      }
    ]
  },
  {
    id: 'critical',
    name: 'Critical Escalation',
    steps: [
      {
        delay: 0, // immediate
        channels: ['email', 'sms'],
        recipients: ['ops@caregrid.com', 'manager@caregrid.com']
      },
      {
        delay: 300, // 5 minutes
        channels: ['email', 'sms'],
        recipients: ['ops@caregrid.com', 'manager@caregrid.com', 'cto@caregrid.com']
      }
    ]
  }
];

// Initialize alerting system
function initializeAlerting() {
  alertRules = [...defaultAlertRules];
  escalationPolicies = [...defaultEscalationPolicies];
  
  // Initialize default notification channels
  notificationChannels = [
    {
      id: 'email_default',
      type: NOTIFICATION_CHANNELS.EMAIL,
      name: 'Default Email',
      config: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      },
      enabled: true
    }
  ];
  
  console.log('🚨 Alerting system initialized');
}

// Create alert
function createAlert(type, severity, message, metadata = {}) {
  const alertId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const alert = {
    id: alertId,
    type,
    severity,
    message,
    metadata,
    timestamp: new Date().toISOString(),
    status: 'active',
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolvedAt: null,
    escalationLevel: 0,
    notificationsSent: []
  };
  
  // Store alert
  alertHistory.push(alert);
  activeAlerts.set(alertId, alert);
  
  // Process alert rules
  processAlert(alert);
  
  return alert;
}

// Process alert against rules
function processAlert(alert) {
  const matchingRules = alertRules.filter(rule => 
    rule.enabled && rule.type === alert.type
  );
  
  for (const rule of matchingRules) {
    if (evaluateAlertCondition(alert, rule.condition)) {
      triggerNotifications(alert, rule);
    }
  }
}

// Evaluate alert condition
function evaluateAlertCondition(alert, condition) {
  // For now, return true for all conditions
  // In a real implementation, this would evaluate the condition against metrics
  return true;
}

// Trigger notifications
async function triggerNotifications(alert, rule) {
  const escalationPolicy = escalationPolicies.find(p => p.id === rule.escalationPolicy);
  
  if (!escalationPolicy) {
    console.error(`Escalation policy not found: ${rule.escalationPolicy}`);
    return;
  }
  
  // Start escalation process
  for (let i = 0; i < escalationPolicy.steps.length; i++) {
    const step = escalationPolicy.steps[i];
    
    setTimeout(async () => {
      if (activeAlerts.has(alert.id) && !alert.acknowledgedAt) {
        await sendNotifications(alert, step, i);
      }
    }, step.delay * 1000);
  }
}

// Send notifications
async function sendNotifications(alert, escalationStep, level) {
  const notifications = [];
  
  for (const channelType of escalationStep.channels) {
    for (const recipient of escalationStep.recipients) {
      try {
        let result;
        
        switch (channelType) {
          case NOTIFICATION_CHANNELS.EMAIL:
            result = await sendEmailNotification(alert, recipient, level);
            break;
          case NOTIFICATION_CHANNELS.SMS:
            result = await sendSMSNotification(alert, recipient, level);
            break;
          case NOTIFICATION_CHANNELS.WEBHOOK:
            result = await sendWebhookNotification(alert, recipient, level);
            break;
          default:
            console.warn(`Unsupported notification channel: ${channelType}`);
            continue;
        }
        
        notifications.push({
          channel: channelType,
          recipient,
          level,
          timestamp: new Date().toISOString(),
          success: result.success,
          error: result.error
        });
        
      } catch (error) {
        console.error(`Failed to send ${channelType} notification:`, error);
        notifications.push({
          channel: channelType,
          recipient,
          level,
          timestamp: new Date().toISOString(),
          success: false,
          error: error.message
        });
      }
    }
  }
  
  // Update alert with notification history
  alert.notificationsSent.push(...notifications);
  alert.escalationLevel = Math.max(alert.escalationLevel, level);
}

// Send email notification
async function sendEmailNotification(alert, recipient, level) {
  try {
    const emailService = require('./emailService');
    
    const result = await emailService.sendAlertEmail(alert, recipient);
    
    if (result.success) {
      console.log(`📧 Email notification sent for alert ${alert.id} to ${recipient}`);
      return {
        success: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      };
    } else {
      console.error(`Failed to send email notification for alert ${alert.id}:`, result.error);
      return {
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Send SMS notification (placeholder)
async function sendSMSNotification(alert, recipient, level) {
  // Placeholder for SMS implementation
  // In a real implementation, this would use a service like Twilio
  console.log(`SMS notification sent to ${recipient}: ${alert.message}`);
  return { success: true };
}

// Send webhook notification
async function sendWebhookNotification(alert, webhookUrl, level) {
  try {
    const response = await axios.post(webhookUrl, {
      alert,
      level,
      timestamp: new Date().toISOString()
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CareGrid-Alerting/1.0'
      }
    });
    
    return { success: true, statusCode: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Generate email template
function generateEmailTemplate(alert, level) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>CareGrid Alert</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: ${getSeverityColor(alert.severity)}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .alert-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .severity-${alert.severity} { border-left: 4px solid ${getSeverityColor(alert.severity)}; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 CareGrid Alert</h1>
                <p>Severity: ${alert.severity.toUpperCase()}</p>
            </div>
            <div class="content">
                <h2>${alert.message}</h2>
                <div class="alert-info severity-${alert.severity}">
                    <p><strong>Alert ID:</strong> ${alert.id}</p>
                    <p><strong>Type:</strong> ${alert.type}</p>
                    <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
                    <p><strong>Escalation Level:</strong> ${level + 1}</p>
                    ${alert.metadata && Object.keys(alert.metadata).length > 0 ? 
                      `<p><strong>Additional Info:</strong></p><pre>${JSON.stringify(alert.metadata, null, 2)}</pre>` : 
                      ''
                    }
                </div>
                <p>Please investigate this alert and take appropriate action.</p>
                <p>To acknowledge this alert, please contact the operations team.</p>
            </div>
            <div class="footer">
                <p>This is an automated alert from CareGrid monitoring system.</p>
                <p>Alert generated at ${new Date().toISOString()}</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Get severity color
function getSeverityColor(severity) {
  const colors = {
    [ALERT_SEVERITY.LOW]: '#28a745',
    [ALERT_SEVERITY.MEDIUM]: '#ffc107',
    [ALERT_SEVERITY.HIGH]: '#fd7e14',
    [ALERT_SEVERITY.CRITICAL]: '#dc3545'
  };
  return colors[severity] || '#6c757d';
}

// Acknowledge alert
function acknowledgeAlert(alertId, acknowledgedBy) {
  const alert = activeAlerts.get(alertId);
  if (!alert) {
    throw new Error('Alert not found');
  }
  
  alert.acknowledgedBy = acknowledgedBy;
  alert.acknowledgedAt = new Date().toISOString();
  
  console.log(`Alert ${alertId} acknowledged by ${acknowledgedBy}`);
  return alert;
}

// Resolve alert
function resolveAlert(alertId, resolvedBy) {
  const alert = activeAlerts.get(alertId);
  if (!alert) {
    throw new Error('Alert not found');
  }
  
  alert.status = 'resolved';
  alert.resolvedAt = new Date().toISOString();
  alert.resolvedBy = resolvedBy;
  
  activeAlerts.delete(alertId);
  
  console.log(`Alert ${alertId} resolved by ${resolvedBy}`);
  return alert;
}

// Get active alerts
function getActiveAlerts() {
  return Array.from(activeAlerts.values());
}

// Get alert history
function getAlertHistory(limit = 100, filters = {}) {
  let filtered = alertHistory;
  
  if (filters.severity) {
    filtered = filtered.filter(alert => alert.severity === filters.severity);
  }
  
  if (filters.type) {
    filtered = filtered.filter(alert => alert.type === filters.type);
  }
  
  if (filters.status) {
    filtered = filtered.filter(alert => alert.status === filters.status);
  }
  
  return filtered
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

// Get alert statistics
function getAlertStatistics() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recent24h = alertHistory.filter(alert => new Date(alert.timestamp) > last24h);
  const recent7d = alertHistory.filter(alert => new Date(alert.timestamp) > last7d);
  
  return {
    total: alertHistory.length,
    active: activeAlerts.size,
    last24h: {
      total: recent24h.length,
      bySeverity: {
        low: recent24h.filter(a => a.severity === ALERT_SEVERITY.LOW).length,
        medium: recent24h.filter(a => a.severity === ALERT_SEVERITY.MEDIUM).length,
        high: recent24h.filter(a => a.severity === ALERT_SEVERITY.HIGH).length,
        critical: recent24h.filter(a => a.severity === ALERT_SEVERITY.CRITICAL).length
      }
    },
    last7d: {
      total: recent7d.length,
      bySeverity: {
        low: recent7d.filter(a => a.severity === ALERT_SEVERITY.LOW).length,
        medium: recent7d.filter(a => a.severity === ALERT_SEVERITY.MEDIUM).length,
        high: recent7d.filter(a => a.severity === ALERT_SEVERITY.HIGH).length,
        critical: recent7d.filter(a => a.severity === ALERT_SEVERITY.CRITICAL).length
      }
    }
  };
}

// Add alert rule
function addAlertRule(rule) {
  const ruleId = rule.id || `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newRule = {
    id: ruleId,
    ...rule,
    createdAt: new Date().toISOString()
  };
  
  alertRules.push(newRule);
  return newRule;
}

// Update alert rule
function updateAlertRule(ruleId, updates) {
  const ruleIndex = alertRules.findIndex(rule => rule.id === ruleId);
  if (ruleIndex === -1) {
    throw new Error('Alert rule not found');
  }
  
  alertRules[ruleIndex] = {
    ...alertRules[ruleIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  return alertRules[ruleIndex];
}

// Delete alert rule
function deleteAlertRule(ruleId) {
  const ruleIndex = alertRules.findIndex(rule => rule.id === ruleId);
  if (ruleIndex === -1) {
    throw new Error('Alert rule not found');
  }
  
  const deletedRule = alertRules.splice(ruleIndex, 1)[0];
  return deletedRule;
}

// Get alert rules
function getAlertRules() {
  return alertRules;
}

module.exports = {
  ALERT_SEVERITY,
  ALERT_TYPES,
  NOTIFICATION_CHANNELS,
  initializeAlerting,
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  getActiveAlerts,
  getAlertHistory,
  getAlertStatistics,
  addAlertRule,
  updateAlertRule,
  deleteAlertRule,
  getAlertRules
};