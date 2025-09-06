const express = require('express');
const router = express.Router();
const {
  ALERT_SEVERITY,
  ALERT_TYPES,
  NOTIFICATION_CHANNELS,
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
} = require('../services/alerting');

// Get alerting system overview
router.get('/', (req, res) => {
  try {
    const statistics = getAlertStatistics();
    const activeAlerts = getActiveAlerts();
    const recentAlerts = getAlertHistory(10);

    res.json({
      status: 'active',
      timestamp: new Date().toISOString(),
      statistics,
      activeAlerts: activeAlerts.length,
      recentAlerts: recentAlerts.slice(0, 5).map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp,
        status: alert.status
      }))
    });
  } catch (error) {
    console.error('Error getting alerting overview:', error);
    res.status(500).json({
      error: 'Failed to get alerting overview',
      message: error.message
    });
  }
});

// Get active alerts
router.get('/active', (req, res) => {
  try {
    const activeAlerts = getActiveAlerts();

    res.json({
      alerts: activeAlerts,
      count: activeAlerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting active alerts:', error);
    res.status(500).json({
      error: 'Failed to get active alerts',
      message: error.message
    });
  }
});

// Get alert history
router.get('/history', (req, res) => {
  try {
    const {
      limit = 50,
      severity,
      type,
      status
    } = req.query;

    const filters = {};
    if (severity) filters.severity = severity;
    if (type) filters.type = type;
    if (status) filters.status = status;

    const history = getAlertHistory(parseInt(limit), filters);

    res.json({
      alerts: history,
      count: history.length,
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting alert history:', error);
    res.status(500).json({
      error: 'Failed to get alert history',
      message: error.message
    });
  }
});

// Get alert statistics
router.get('/statistics', (req, res) => {
  try {
    const statistics = getAlertStatistics();

    res.json({
      statistics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting alert statistics:', error);
    res.status(500).json({
      error: 'Failed to get alert statistics',
      message: error.message
    });
  }
});

// Create new alert
router.post('/create', (req, res) => {
  try {
    const { type, severity, message, metadata } = req.body;

    if (!type || !severity || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['type', 'severity', 'message']
      });
    }

    if (!Object.values(ALERT_TYPES).includes(type)) {
      return res.status(400).json({
        error: 'Invalid alert type',
        validTypes: Object.values(ALERT_TYPES)
      });
    }

    if (!Object.values(ALERT_SEVERITY).includes(severity)) {
      return res.status(400).json({
        error: 'Invalid alert severity',
        validSeverities: Object.values(ALERT_SEVERITY)
      });
    }

    const alert = createAlert(type, severity, message, metadata || {});

    res.status(201).json({
      message: 'Alert created successfully',
      alert,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      error: 'Failed to create alert',
      message: error.message
    });
  }
});

// Acknowledge alert
router.post('/:alertId/acknowledge', (req, res) => {
  try {
    const { alertId } = req.params;
    const { acknowledgedBy } = req.body;

    if (!acknowledgedBy) {
      return res.status(400).json({
        error: 'Missing acknowledgedBy field'
      });
    }

    const alert = acknowledgeAlert(alertId, acknowledgedBy);

    res.json({
      message: 'Alert acknowledged successfully',
      alert,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    const statusCode = error.message === 'Alert not found' ? 404 : 500;
    res.status(statusCode).json({
      error: 'Failed to acknowledge alert',
      message: error.message
    });
  }
});

// Resolve alert
router.post('/:alertId/resolve', (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolvedBy } = req.body;

    if (!resolvedBy) {
      return res.status(400).json({
        error: 'Missing resolvedBy field'
      });
    }

    const alert = resolveAlert(alertId, resolvedBy);

    res.json({
      message: 'Alert resolved successfully',
      alert,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    const statusCode = error.message === 'Alert not found' ? 404 : 500;
    res.status(statusCode).json({
      error: 'Failed to resolve alert',
      message: error.message
    });
  }
});

// Get alert rules
router.get('/rules', (req, res) => {
  try {
    const rules = getAlertRules();

    res.json({
      rules,
      count: rules.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting alert rules:', error);
    res.status(500).json({
      error: 'Failed to get alert rules',
      message: error.message
    });
  }
});

// Create alert rule
router.post('/rules', (req, res) => {
  try {
    const rule = req.body;

    if (!rule.name || !rule.type || !rule.severity) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'type', 'severity']
      });
    }

    const newRule = addAlertRule(rule);

    res.status(201).json({
      message: 'Alert rule created successfully',
      rule: newRule,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating alert rule:', error);
    res.status(500).json({
      error: 'Failed to create alert rule',
      message: error.message
    });
  }
});

// Update alert rule
router.put('/rules/:ruleId', (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    const updatedRule = updateAlertRule(ruleId, updates);

    res.json({
      message: 'Alert rule updated successfully',
      rule: updatedRule,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating alert rule:', error);
    const statusCode = error.message === 'Alert rule not found' ? 404 : 500;
    res.status(statusCode).json({
      error: 'Failed to update alert rule',
      message: error.message
    });
  }
});

// Delete alert rule
router.delete('/rules/:ruleId', (req, res) => {
  try {
    const { ruleId } = req.params;

    const deletedRule = deleteAlertRule(ruleId);

    res.json({
      message: 'Alert rule deleted successfully',
      rule: deletedRule,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    const statusCode = error.message === 'Alert rule not found' ? 404 : 500;
    res.status(statusCode).json({
      error: 'Failed to delete alert rule',
      message: error.message
    });
  }
});

// Get alert types and severities
router.get('/config', (req, res) => {
  try {
    res.json({
      alertTypes: Object.values(ALERT_TYPES),
      alertSeverities: Object.values(ALERT_SEVERITY),
      notificationChannels: Object.values(NOTIFICATION_CHANNELS),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting alert config:', error);
    res.status(500).json({
      error: 'Failed to get alert config',
      message: error.message
    });
  }
});

// Test alert (for testing purposes)
router.post('/test', (req, res) => {
  try {
    const { severity = ALERT_SEVERITY.LOW, message = 'Test alert' } = req.body;

    const alert = createAlert(
      ALERT_TYPES.HEALTH_CHECK_FAILED,
      severity,
      message,
      {
        test: true,
        triggeredBy: 'manual_test',
        timestamp: new Date().toISOString()
      }
    );

    res.json({
      message: 'Test alert created successfully',
      alert,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating test alert:', error);
    res.status(500).json({
      error: 'Failed to create test alert',
      message: error.message
    });
  }
});

// Health check for alerting system
router.get('/health', (req, res) => {
  try {
    const statistics = getAlertStatistics();
    const activeAlerts = getActiveAlerts();

    const criticalAlerts = activeAlerts.filter(alert =>
      alert.severity === ALERT_SEVERITY.CRITICAL
    ).length;

    const highAlerts = activeAlerts.filter(alert =>
      alert.severity === ALERT_SEVERITY.HIGH
    ).length;

    const status = criticalAlerts > 0 ? 'critical' :
                  highAlerts > 5 ? 'degraded' : 'healthy';

    res.json({
      status,
      timestamp: new Date().toISOString(),
      metrics: {
        activeAlerts: activeAlerts.length,
        criticalAlerts,
        highAlerts,
        totalAlerts: statistics.total,
        alertsLast24h: statistics.last24h.total
      },
      details: {
        alertingSystemActive: true,
        rulesConfigured: getAlertRules().length,
        lastAlert: activeAlerts.length > 0 ?
          activeAlerts[activeAlerts.length - 1].timestamp : null
      }
    });
  } catch (error) {
    console.error('Error getting alerting health:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Failed to get alerting health',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
