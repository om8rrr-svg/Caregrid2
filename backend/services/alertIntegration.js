const { createAlert, ALERT_TYPES, ALERT_SEVERITY } = require('./alerting');
const { getSyntheticSummary } = require('./synthetic');

// Alert thresholds
const ALERT_THRESHOLDS = {
  SYNTHETIC_SUCCESS_RATE: 80, // %
  SYNTHETIC_FAILURE_COUNT: 5, // consecutive failures
  RESPONSE_TIME_THRESHOLD: 5000, // ms
  ERROR_RATE_THRESHOLD: 10, // %
  MEMORY_USAGE_THRESHOLD: 90, // %
  CPU_USAGE_THRESHOLD: 85, // %
  DISK_USAGE_THRESHOLD: 90 // %
};

// Alert state tracking
let alertState = {
  lastHealthCheck: null,
  consecutiveFailures: {},
  lastAlerts: {},
  suppressionWindows: {}
};

// Alert suppression (prevent spam)
const SUPPRESSION_WINDOWS = {
  [ALERT_TYPES.HEALTH_CHECK_FAILED]: 300000, // 5 minutes
  [ALERT_TYPES.SYNTHETIC_TRANSACTION_FAILED]: 600000, // 10 minutes
  [ALERT_TYPES.HIGH_ERROR_RATE]: 900000, // 15 minutes
  [ALERT_TYPES.PERFORMANCE_DEGRADATION]: 600000, // 10 minutes
  [ALERT_TYPES.SYSTEM_RESOURCE_EXHAUSTION]: 300000 // 5 minutes
};

// Check if alert should be suppressed
function shouldSuppressAlert(alertType, identifier = 'default') {
  const key = `${alertType}_${identifier}`;
  const lastAlert = alertState.lastAlerts[key];
  const suppressionWindow = SUPPRESSION_WINDOWS[alertType] || 300000;

  if (!lastAlert) {
    return false;
  }

  const timeSinceLastAlert = Date.now() - lastAlert;
  return timeSinceLastAlert < suppressionWindow;
}

// Record alert
function recordAlert(alertType, identifier = 'default') {
  const key = `${alertType}_${identifier}`;
  alertState.lastAlerts[key] = Date.now();
}

// Monitor health status
function monitorHealthStatus(healthData) {
  try {
    alertState.lastHealthCheck = Date.now();

    // Check overall health status
    if (healthData.status === 'unhealthy') {
      if (!shouldSuppressAlert(ALERT_TYPES.HEALTH_CHECK_FAILED)) {
        createAlert(
          ALERT_TYPES.HEALTH_CHECK_FAILED,
          ALERT_SEVERITY.HIGH,
          'System health check failed',
          {
            healthData,
            timestamp: new Date().toISOString(),
            source: 'health_monitor'
          }
        );
        recordAlert(ALERT_TYPES.HEALTH_CHECK_FAILED);
      }
    }

    // Check database health
    if (healthData.checks && healthData.checks.database) {
      const dbHealth = healthData.checks.database;
      if (dbHealth.status !== 'healthy') {
        if (!shouldSuppressAlert(ALERT_TYPES.DATABASE_CONNECTION_LOST, 'database')) {
          createAlert(
            ALERT_TYPES.DATABASE_CONNECTION_LOST,
            ALERT_SEVERITY.CRITICAL,
            'Database connection lost or unhealthy',
            {
              databaseStatus: dbHealth,
              timestamp: new Date().toISOString(),
              source: 'health_monitor'
            }
          );
          recordAlert(ALERT_TYPES.DATABASE_CONNECTION_LOST, 'database');
        }
      }
    }

    // Check API services
    if (healthData.checks && healthData.checks.apiServices) {
      const apiServices = healthData.checks.apiServices;

      Object.entries(apiServices).forEach(([serviceName, serviceHealth]) => {
        if (serviceHealth.status === 'degraded' || serviceHealth.status === 'unhealthy') {
          if (!shouldSuppressAlert(ALERT_TYPES.DEPENDENCY_FAILURE, serviceName)) {
            createAlert(
              ALERT_TYPES.DEPENDENCY_FAILURE,
              serviceHealth.status === 'unhealthy' ? ALERT_SEVERITY.HIGH : ALERT_SEVERITY.MEDIUM,
              `API service ${serviceName} is ${serviceHealth.status}`,
              {
                serviceName,
                serviceHealth,
                timestamp: new Date().toISOString(),
                source: 'health_monitor'
              }
            );
            recordAlert(ALERT_TYPES.DEPENDENCY_FAILURE, serviceName);
          }
        }
      });
    }

    // Check system resources
    if (healthData.system) {
      const system = healthData.system;

      // Memory usage
      if (system.memory && system.memory.usage > ALERT_THRESHOLDS.MEMORY_USAGE_THRESHOLD) {
        if (!shouldSuppressAlert(ALERT_TYPES.SYSTEM_RESOURCE_EXHAUSTION, 'memory')) {
          createAlert(
            ALERT_TYPES.SYSTEM_RESOURCE_EXHAUSTION,
            ALERT_SEVERITY.HIGH,
            `High memory usage: ${system.memory.usage.toFixed(1)}%`,
            {
              resourceType: 'memory',
              usage: system.memory.usage,
              threshold: ALERT_THRESHOLDS.MEMORY_USAGE_THRESHOLD,
              timestamp: new Date().toISOString(),
              source: 'health_monitor'
            }
          );
          recordAlert(ALERT_TYPES.SYSTEM_RESOURCE_EXHAUSTION, 'memory');
        }
      }
    }

    // Check performance metrics
    if (healthData.performance) {
      const performance = healthData.performance;

      // Error rate
      if (performance.requests) {
        const errorRate = (performance.requests.failed / performance.requests.total) * 100;

        if (errorRate > ALERT_THRESHOLDS.ERROR_RATE_THRESHOLD) {
          if (!shouldSuppressAlert(ALERT_TYPES.HIGH_ERROR_RATE)) {
            createAlert(
              ALERT_TYPES.HIGH_ERROR_RATE,
              ALERT_SEVERITY.HIGH,
              `High error rate: ${errorRate.toFixed(1)}%`,
              {
                errorRate,
                threshold: ALERT_THRESHOLDS.ERROR_RATE_THRESHOLD,
                requests: performance.requests,
                timestamp: new Date().toISOString(),
                source: 'health_monitor'
              }
            );
            recordAlert(ALERT_TYPES.HIGH_ERROR_RATE);
          }
        }

        // Response time
        if (performance.requests.averageResponseTime > ALERT_THRESHOLDS.RESPONSE_TIME_THRESHOLD) {
          if (!shouldSuppressAlert(ALERT_TYPES.PERFORMANCE_DEGRADATION, 'response_time')) {
            createAlert(
              ALERT_TYPES.PERFORMANCE_DEGRADATION,
              ALERT_SEVERITY.MEDIUM,
              `High response time: ${performance.requests.averageResponseTime}ms`,
              {
                responseTime: performance.requests.averageResponseTime,
                threshold: ALERT_THRESHOLDS.RESPONSE_TIME_THRESHOLD,
                timestamp: new Date().toISOString(),
                source: 'health_monitor'
              }
            );
            recordAlert(ALERT_TYPES.PERFORMANCE_DEGRADATION, 'response_time');
          }
        }
      }
    }

  } catch (error) {
    console.error('Error monitoring health status:', error);
  }
}

// Monitor synthetic transaction results
function monitorSyntheticResults(syntheticData) {
  try {
    if (!syntheticData || !syntheticData.summary) {
      return;
    }

    const summary = syntheticData.summary;

    // Check overall success rate
    if (summary.successRate < ALERT_THRESHOLDS.SYNTHETIC_SUCCESS_RATE) {
      if (!shouldSuppressAlert(ALERT_TYPES.SYNTHETIC_TRANSACTION_FAILED, 'overall')) {
        createAlert(
          ALERT_TYPES.SYNTHETIC_TRANSACTION_FAILED,
          ALERT_SEVERITY.MEDIUM,
          `Low synthetic transaction success rate: ${summary.successRate}%`,
          {
            successRate: summary.successRate,
            threshold: ALERT_THRESHOLDS.SYNTHETIC_SUCCESS_RATE,
            summary,
            timestamp: new Date().toISOString(),
            source: 'synthetic_monitor'
          }
        );
        recordAlert(ALERT_TYPES.SYNTHETIC_TRANSACTION_FAILED, 'overall');
      }
    }

    // Check individual transaction types
    if (syntheticData.transactionTypes) {
      syntheticData.transactionTypes.forEach(transactionType => {
        if (transactionType.total > 0 && transactionType.successRate < ALERT_THRESHOLDS.SYNTHETIC_SUCCESS_RATE) {
          if (!shouldSuppressAlert(ALERT_TYPES.SYNTHETIC_TRANSACTION_FAILED, transactionType.type)) {
            createAlert(
              ALERT_TYPES.SYNTHETIC_TRANSACTION_FAILED,
              ALERT_SEVERITY.MEDIUM,
              `Synthetic transaction ${transactionType.type} failing: ${transactionType.successRate}% success rate`,
              {
                transactionType: transactionType.type,
                successRate: transactionType.successRate,
                threshold: ALERT_THRESHOLDS.SYNTHETIC_SUCCESS_RATE,
                transactionData: transactionType,
                timestamp: new Date().toISOString(),
                source: 'synthetic_monitor'
              }
            );
            recordAlert(ALERT_TYPES.SYNTHETIC_TRANSACTION_FAILED, transactionType.type);
          }
        }
      });
    }

    // Check for recent failures
    if (syntheticData.recentFailures && syntheticData.recentFailures.length > 0) {
      const recentFailureCount = syntheticData.recentFailures.length;

      if (recentFailureCount >= ALERT_THRESHOLDS.SYNTHETIC_FAILURE_COUNT) {
        if (!shouldSuppressAlert(ALERT_TYPES.SYNTHETIC_TRANSACTION_FAILED, 'recent_failures')) {
          createAlert(
            ALERT_TYPES.SYNTHETIC_TRANSACTION_FAILED,
            ALERT_SEVERITY.HIGH,
            `Multiple recent synthetic transaction failures: ${recentFailureCount} failures`,
            {
              failureCount: recentFailureCount,
              threshold: ALERT_THRESHOLDS.SYNTHETIC_FAILURE_COUNT,
              recentFailures: syntheticData.recentFailures.slice(0, 5), // Include first 5 failures
              timestamp: new Date().toISOString(),
              source: 'synthetic_monitor'
            }
          );
          recordAlert(ALERT_TYPES.SYNTHETIC_TRANSACTION_FAILED, 'recent_failures');
        }
      }
    }

  } catch (error) {
    console.error('Error monitoring synthetic results:', error);
  }
}

// Monitor specific transaction failure
function monitorTransactionFailure(transactionResult) {
  try {
    if (transactionResult.status === 'failure') {
      const transactionType = transactionResult.type;
      const key = `consecutive_${transactionType}`;

      // Track consecutive failures
      if (!alertState.consecutiveFailures[key]) {
        alertState.consecutiveFailures[key] = 0;
      }
      alertState.consecutiveFailures[key]++;

      // Alert on consecutive failures
      if (alertState.consecutiveFailures[key] >= ALERT_THRESHOLDS.SYNTHETIC_FAILURE_COUNT) {
        if (!shouldSuppressAlert(ALERT_TYPES.SYNTHETIC_TRANSACTION_FAILED, `consecutive_${transactionType}`)) {
          createAlert(
            ALERT_TYPES.SYNTHETIC_TRANSACTION_FAILED,
            ALERT_SEVERITY.HIGH,
            `Consecutive failures in ${transactionType}: ${alertState.consecutiveFailures[key]} failures`,
            {
              transactionType,
              consecutiveFailures: alertState.consecutiveFailures[key],
              lastFailure: transactionResult,
              timestamp: new Date().toISOString(),
              source: 'synthetic_monitor'
            }
          );
          recordAlert(ALERT_TYPES.SYNTHETIC_TRANSACTION_FAILED, `consecutive_${transactionType}`);
        }
      }
    } else {
      // Reset consecutive failure count on success
      const transactionType = transactionResult.type;
      const key = `consecutive_${transactionType}`;
      alertState.consecutiveFailures[key] = 0;
    }

  } catch (error) {
    console.error('Error monitoring transaction failure:', error);
  }
}

// Get alert integration status
function getAlertIntegrationStatus() {
  return {
    status: 'active',
    lastHealthCheck: alertState.lastHealthCheck,
    thresholds: ALERT_THRESHOLDS,
    suppressionWindows: SUPPRESSION_WINDOWS,
    consecutiveFailures: alertState.consecutiveFailures,
    activeSuppressions: Object.keys(alertState.lastAlerts).filter(key => {
      const alertType = key.split('_')[0];
      const suppressionWindow = SUPPRESSION_WINDOWS[alertType] || 300000;
      const timeSinceLastAlert = Date.now() - alertState.lastAlerts[key];
      return timeSinceLastAlert < suppressionWindow;
    }),
    timestamp: new Date().toISOString()
  };
}

// Update alert thresholds
function updateAlertThresholds(newThresholds) {
  Object.assign(ALERT_THRESHOLDS, newThresholds);
  console.log('Alert thresholds updated:', ALERT_THRESHOLDS);
}

// Clear alert state (for testing)
function clearAlertState() {
  alertState = {
    lastHealthCheck: null,
    consecutiveFailures: {},
    lastAlerts: {},
    suppressionWindows: {}
  };
  console.log('Alert state cleared');
}

module.exports = {
  monitorHealthStatus,
  monitorSyntheticResults,
  monitorTransactionFailure,
  getAlertIntegrationStatus,
  updateAlertThresholds,
  clearAlertState,
  ALERT_THRESHOLDS
};
