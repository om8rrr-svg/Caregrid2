const express = require('express');
const router = express.Router();
const {
  getHealthMonitoringStatus,
  updateHealthCheckConfig,
  HEALTH_CHECK_CONFIG
} = require('../services/healthScheduler');

// Get health monitoring status and configuration
router.get('/', (req, res) => {
  try {
    const status = getHealthMonitoringStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting health monitoring status:', error);
    res.status(500).json({
      error: 'Failed to get health monitoring status',
      message: error.message
    });
  }
});

// Get health monitoring configuration
router.get('/config', (req, res) => {
  try {
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      configuration: HEALTH_CHECK_CONFIG
    });
  } catch (error) {
    console.error('Error getting health monitoring config:', error);
    res.status(500).json({
      error: 'Failed to get health monitoring configuration',
      message: error.message
    });
  }
});

// Update health monitoring configuration
router.put('/config', (req, res) => {
  try {
    const { intervals, thresholds, recovery } = req.body;
    
    // Validate configuration
    const updates = {};
    
    if (intervals) {
      // Validate cron expressions (basic validation)
      Object.entries(intervals).forEach(([key, cronExpr]) => {
        if (typeof cronExpr !== 'string' || cronExpr.split(' ').length !== 5) {
          throw new Error(`Invalid cron expression for ${key}: ${cronExpr}`);
        }
      });
      updates.intervals = intervals;
    }
    
    if (thresholds) {
      // Validate threshold values
      if (thresholds.responseTime && (typeof thresholds.responseTime !== 'number' || thresholds.responseTime <= 0)) {
        throw new Error('responseTime must be a positive number');
      }
      if (thresholds.errorRate && (typeof thresholds.errorRate !== 'number' || thresholds.errorRate < 0 || thresholds.errorRate > 1)) {
        throw new Error('errorRate must be a number between 0 and 1');
      }
      if (thresholds.consecutiveFailures && (typeof thresholds.consecutiveFailures !== 'number' || thresholds.consecutiveFailures <= 0)) {
        throw new Error('consecutiveFailures must be a positive number');
      }
      updates.thresholds = thresholds;
    }
    
    if (recovery) {
      // Validate recovery configuration
      if (recovery.enabled !== undefined && typeof recovery.enabled !== 'boolean') {
        throw new Error('recovery.enabled must be a boolean');
      }
      if (recovery.maxAttempts && (typeof recovery.maxAttempts !== 'number' || recovery.maxAttempts <= 0)) {
        throw new Error('recovery.maxAttempts must be a positive number');
      }
      updates.recovery = recovery;
    }
    
    // Update configuration
    updateHealthCheckConfig(updates);
    
    res.json({
      message: 'Health monitoring configuration updated successfully',
      timestamp: new Date().toISOString(),
      updates,
      newConfiguration: HEALTH_CHECK_CONFIG
    });
    
  } catch (error) {
    console.error('Error updating health monitoring config:', error);
    res.status(400).json({
      error: 'Failed to update health monitoring configuration',
      message: error.message
    });
  }
});

// Get health check intervals
router.get('/intervals', (req, res) => {
  try {
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      intervals: HEALTH_CHECK_CONFIG.intervals
    });
  } catch (error) {
    console.error('Error getting health check intervals:', error);
    res.status(500).json({
      error: 'Failed to get health check intervals',
      message: error.message
    });
  }
});

// Update health check intervals
router.put('/intervals', (req, res) => {
  try {
    const { intervals } = req.body;
    
    if (!intervals || typeof intervals !== 'object') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'intervals object is required'
      });
    }
    
    // Validate cron expressions
    Object.entries(intervals).forEach(([key, cronExpr]) => {
      if (typeof cronExpr !== 'string' || cronExpr.split(' ').length !== 5) {
        throw new Error(`Invalid cron expression for ${key}: ${cronExpr}`);
      }
    });
    
    updateHealthCheckConfig({ intervals });
    
    res.json({
      message: 'Health check intervals updated successfully',
      timestamp: new Date().toISOString(),
      intervals: HEALTH_CHECK_CONFIG.intervals
    });
    
  } catch (error) {
    console.error('Error updating health check intervals:', error);
    res.status(400).json({
      error: 'Failed to update health check intervals',
      message: error.message
    });
  }
});

// Get health check thresholds
router.get('/thresholds', (req, res) => {
  try {
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      thresholds: HEALTH_CHECK_CONFIG.thresholds
    });
  } catch (error) {
    console.error('Error getting health check thresholds:', error);
    res.status(500).json({
      error: 'Failed to get health check thresholds',
      message: error.message
    });
  }
});

// Update health check thresholds
router.put('/thresholds', (req, res) => {
  try {
    const { thresholds } = req.body;
    
    if (!thresholds || typeof thresholds !== 'object') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'thresholds object is required'
      });
    }
    
    // Validate threshold values
    if (thresholds.responseTime && (typeof thresholds.responseTime !== 'number' || thresholds.responseTime <= 0)) {
      throw new Error('responseTime must be a positive number');
    }
    if (thresholds.errorRate && (typeof thresholds.errorRate !== 'number' || thresholds.errorRate < 0 || thresholds.errorRate > 1)) {
      throw new Error('errorRate must be a number between 0 and 1');
    }
    if (thresholds.consecutiveFailures && (typeof thresholds.consecutiveFailures !== 'number' || thresholds.consecutiveFailures <= 0)) {
      throw new Error('consecutiveFailures must be a positive number');
    }
    if (thresholds.recoveryChecks && (typeof thresholds.recoveryChecks !== 'number' || thresholds.recoveryChecks <= 0)) {
      throw new Error('recoveryChecks must be a positive number');
    }
    
    updateHealthCheckConfig({ thresholds });
    
    res.json({
      message: 'Health check thresholds updated successfully',
      timestamp: new Date().toISOString(),
      thresholds: HEALTH_CHECK_CONFIG.thresholds
    });
    
  } catch (error) {
    console.error('Error updating health check thresholds:', error);
    res.status(400).json({
      error: 'Failed to update health check thresholds',
      message: error.message
    });
  }
});

// Get recovery configuration
router.get('/recovery', (req, res) => {
  try {
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      recovery: HEALTH_CHECK_CONFIG.recovery
    });
  } catch (error) {
    console.error('Error getting recovery configuration:', error);
    res.status(500).json({
      error: 'Failed to get recovery configuration',
      message: error.message
    });
  }
});

// Update recovery configuration
router.put('/recovery', (req, res) => {
  try {
    const { recovery } = req.body;
    
    if (!recovery || typeof recovery !== 'object') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'recovery object is required'
      });
    }
    
    // Validate recovery configuration
    if (recovery.enabled !== undefined && typeof recovery.enabled !== 'boolean') {
      throw new Error('recovery.enabled must be a boolean');
    }
    if (recovery.maxAttempts && (typeof recovery.maxAttempts !== 'number' || recovery.maxAttempts <= 0)) {
      throw new Error('recovery.maxAttempts must be a positive number');
    }
    if (recovery.backoffMultiplier && (typeof recovery.backoffMultiplier !== 'number' || recovery.backoffMultiplier <= 0)) {
      throw new Error('recovery.backoffMultiplier must be a positive number');
    }
    if (recovery.initialDelay && (typeof recovery.initialDelay !== 'number' || recovery.initialDelay <= 0)) {
      throw new Error('recovery.initialDelay must be a positive number');
    }
    
    updateHealthCheckConfig({ recovery });
    
    res.json({
      message: 'Recovery configuration updated successfully',
      timestamp: new Date().toISOString(),
      recovery: HEALTH_CHECK_CONFIG.recovery
    });
    
  } catch (error) {
    console.error('Error updating recovery configuration:', error);
    res.status(400).json({
      error: 'Failed to update recovery configuration',
      message: error.message
    });
  }
});

// Health monitoring system health check
router.get('/health', (req, res) => {
  try {
    const status = getHealthMonitoringStatus();
    const activeChecks = status.checks.filter(check => check.status === 'healthy').length;
    const totalChecks = status.checks.length;
    const healthPercentage = totalChecks > 0 ? (activeChecks / totalChecks) * 100 : 0;
    
    res.json({
      status: healthPercentage >= 75 ? 'healthy' : healthPercentage >= 50 ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      metrics: {
        activeChecks,
        totalChecks,
        healthPercentage: Math.round(healthPercentage),
        recoveringChecks: status.checks.filter(check => check.recovering).length
      },
      details: {
        monitoringActive: true,
        lastUpdate: status.timestamp,
        checksConfigured: Object.keys(HEALTH_CHECK_CONFIG.intervals).length
      }
    });
  } catch (error) {
    console.error('Error getting health monitoring health:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Failed to get health monitoring status',
      message: error.message
    });
  }
});

module.exports = router;