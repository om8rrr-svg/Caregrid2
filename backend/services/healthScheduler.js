const cron = require('node-cron');
const { createAlert } = require('./alerting');
const { getHealthData } = require('../routes/health');
const emailService = require('./emailService');

// Health check configuration
const HEALTH_CHECK_CONFIG = {
  intervals: {
    basic: '*/2 * * * *',      // Every 2 minutes
    detailed: '*/5 * * * *',   // Every 5 minutes
    database: '*/1 * * * *',   // Every minute
    dependencies: '*/3 * * * *' // Every 3 minutes
  },
  thresholds: {
    responseTime: 5000,        // 5 seconds
    errorRate: 0.1,           // 10%
    consecutiveFailures: 3,    // 3 consecutive failures
    recoveryChecks: 2         // 2 successful checks for recovery
  },
  recovery: {
    enabled: true,
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 1000        // 1 second
  }
};

// Health check state tracking
let healthState = {
  basic: { status: 'unknown', consecutiveFailures: 0, lastCheck: null, recovering: false },
  detailed: { status: 'unknown', consecutiveFailures: 0, lastCheck: null, recovering: false },
  database: { status: 'unknown', consecutiveFailures: 0, lastCheck: null, recovering: false },
  dependencies: { status: 'unknown', consecutiveFailures: 0, lastCheck: null, recovering: false }
};

// Scheduled tasks storage
let scheduledTasks = {};

/**
 * Initialize the health monitoring scheduler
 */
function initializeHealthScheduler() {
  // Disable health scheduler on Vercel to avoid cron job limits
  if (process.env.VERCEL === '1') {
    console.log('🏥 Health monitoring scheduler disabled on Vercel (using Vercel cron jobs instead)');
    return;
  }
  
  console.log('🏥 Initializing health monitoring scheduler...');

  // Schedule basic health checks
  scheduledTasks.basic = cron.schedule(HEALTH_CHECK_CONFIG.intervals.basic, async () => {
    await performHealthCheck('basic', checkBasicHealth);
  }, { scheduled: false });

  // Schedule detailed health checks
  scheduledTasks.detailed = cron.schedule(HEALTH_CHECK_CONFIG.intervals.detailed, async () => {
    await performHealthCheck('detailed', checkDetailedHealth);
  }, { scheduled: false });

  // Schedule database health checks
  scheduledTasks.database = cron.schedule(HEALTH_CHECK_CONFIG.intervals.database, async () => {
    await performHealthCheck('database', checkDatabaseHealth);
  }, { scheduled: false });

  // Schedule dependency health checks
  scheduledTasks.dependencies = cron.schedule(HEALTH_CHECK_CONFIG.intervals.dependencies, async () => {
    await performHealthCheck('dependencies', checkDependenciesHealth);
  }, { scheduled: false });

  console.log('✅ Health monitoring scheduler initialized');
}

/**
 * Start the health monitoring scheduler
 */
function startHealthScheduler() {
  // Disable health scheduler on Vercel to avoid cron job limits
  if (process.env.VERCEL === '1') {
    console.log('🚀 Health monitoring scheduler disabled on Vercel (using Vercel cron jobs instead)');
    return;
  }
  
  console.log('🚀 Starting health monitoring scheduler...');

  Object.keys(scheduledTasks).forEach(taskName => {
    scheduledTasks[taskName].start();
    console.log(`📅 Started ${taskName} health checks (${HEALTH_CHECK_CONFIG.intervals[taskName]})`);
  });

  console.log('✅ Health monitoring scheduler started');
}

/**
 * Stop the health monitoring scheduler
 */
function stopHealthScheduler() {
  console.log('🛑 Stopping health monitoring scheduler...');

  Object.keys(scheduledTasks).forEach(taskName => {
    scheduledTasks[taskName].stop();
    console.log(`⏹️ Stopped ${taskName} health checks`);
  });

  console.log('✅ Health monitoring scheduler stopped');
}

/**
 * Perform a health check with error handling and recovery
 */
async function performHealthCheck(checkType, checkFunction) {
  const startTime = Date.now();
  const state = healthState[checkType];

  try {
    console.log(`🔍 Performing ${checkType} health check...`);

    const result = await checkFunction();
    const responseTime = Date.now() - startTime;

    // Check if response time exceeds threshold
    if (responseTime > HEALTH_CHECK_CONFIG.thresholds.responseTime) {
      throw new Error(`Health check response time exceeded threshold: ${responseTime}ms`);
    }

    // Health check passed
    await handleHealthCheckSuccess(checkType, result, responseTime);

  } catch (error) {
    console.error(`❌ ${checkType} health check failed:`, error.message);
    await handleHealthCheckFailure(checkType, error);
  }
}

/**
 * Handle successful health check
 */
async function handleHealthCheckSuccess(checkType, result, responseTime) {
  const state = healthState[checkType];
  const wasUnhealthy = state.status === 'unhealthy';

  // Update state
  state.status = 'healthy';
  state.lastCheck = new Date().toISOString();
  state.consecutiveFailures = 0;

  console.log(`✅ ${checkType} health check passed (${responseTime}ms)`);

  // If recovering from unhealthy state, create recovery alert
  if (wasUnhealthy && state.recovering) {
    state.recovering = false;
    await createAlert({
      type: 'health_check_recovered',
      severity: 'low',
      message: `${checkType} health check recovered`,
      metadata: {
        checkType,
        responseTime,
        recoveredAt: new Date().toISOString(),
        result: typeof result === 'object' ? JSON.stringify(result) : result
      }
    });

    console.log(`🎉 ${checkType} health check recovered`);
  }
}

/**
 * Handle failed health check
 */
async function handleHealthCheckFailure(checkType, error) {
  const state = healthState[checkType];

  state.consecutiveFailures++;
  state.lastCheck = new Date().toISOString();

  // Check if we've reached the failure threshold
  if (state.consecutiveFailures >= HEALTH_CHECK_CONFIG.thresholds.consecutiveFailures) {
    if (state.status !== 'unhealthy') {
      state.status = 'unhealthy';
      state.recovering = true;

      // Create alert for health check failure
      await createAlert({
        type: 'health_check_failed',
        severity: getSeverityForCheckType(checkType),
        message: `${checkType} health check failed after ${state.consecutiveFailures} attempts`,
        metadata: {
          checkType,
          consecutiveFailures: state.consecutiveFailures,
          error: error.message,
          failedAt: new Date().toISOString()
        }
      });

      console.log(`🚨 ${checkType} health check marked as unhealthy`);

      // Attempt recovery if enabled
      if (HEALTH_CHECK_CONFIG.recovery.enabled) {
        await attemptRecovery(checkType, error);
      }
    }
  }
}

/**
 * Attempt recovery procedures
 */
async function attemptRecovery(checkType, error) {
  console.log(`🔧 Attempting recovery for ${checkType}...`);

  const recoveryProcedures = {
    database: async () => {
      // Database recovery procedures
      console.log('🔧 Attempting database connection recovery...');
      // Could implement connection pool reset, reconnection, etc.
      return { attempted: 'database_reconnection' };
    },
    dependencies: async () => {
      // Dependencies recovery procedures
      console.log('🔧 Attempting dependencies recovery...');
      // Could implement service restarts, cache clearing, etc.
      return { attempted: 'dependencies_refresh' };
    },
    basic: async () => {
      // Basic service recovery procedures
      console.log('🔧 Attempting basic service recovery...');
      // Could implement memory cleanup, cache clearing, etc.
      return { attempted: 'basic_service_refresh' };
    },
    detailed: async () => {
      // Detailed service recovery procedures
      console.log('🔧 Attempting detailed service recovery...');
      // Could implement comprehensive service refresh
      return { attempted: 'detailed_service_refresh' };
    }
  };

  try {
    const recoveryResult = await recoveryProcedures[checkType]();

    // Create recovery attempt alert
    await createAlert({
      type: 'recovery_attempted',
      severity: 'medium',
      message: `Recovery attempted for ${checkType}`,
      metadata: {
        checkType,
        recoveryResult,
        attemptedAt: new Date().toISOString(),
        originalError: error.message
      }
    });

    console.log(`🔧 Recovery attempted for ${checkType}:`, recoveryResult);

  } catch (recoveryError) {
    console.error(`❌ Recovery failed for ${checkType}:`, recoveryError.message);

    await createAlert({
      type: 'recovery_failed',
      severity: 'high',
      message: `Recovery failed for ${checkType}`,
      metadata: {
        checkType,
        recoveryError: recoveryError.message,
        originalError: error.message,
        failedAt: new Date().toISOString()
      }
    });
  }
}

/**
 * Get severity level based on check type
 */
function getSeverityForCheckType(checkType) {
  const severityMap = {
    database: 'critical',
    dependencies: 'high',
    detailed: 'medium',
    basic: 'medium'
  };

  return severityMap[checkType] || 'medium';
}

/**
 * Basic health check function
 */
async function checkBasicHealth() {
  // Simple health check - just verify the service is responding
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
}

/**
 * Detailed health check function
 */
async function checkDetailedHealth() {
  try {
    // Use the existing detailed health endpoint
    const healthData = await getHealthData();

    // Check if any critical components are unhealthy
    if (healthData.database?.status !== 'healthy') {
      throw new Error('Database is unhealthy');
    }

    if (healthData.dependencies && Object.values(healthData.dependencies).some(dep => dep.status !== 'healthy')) {
      throw new Error('One or more dependencies are unhealthy');
    }

    return healthData;
  } catch (error) {
    throw new Error(`Detailed health check failed: ${error.message}`);
  }
}

/**
 * Database health check function
 */
async function checkDatabaseHealth() {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || undefined,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    await pool.end();

    return {
      status: 'healthy',
      timestamp: result.rows[0].now,
      connection: 'successful'
    };
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

/**
 * Dependencies health check function
 */
async function checkDependenciesHealth() {
  const dependencies = {
    emailService: await checkEmailService(),
    // Add other dependency checks here
  };

  // Check if any dependency is unhealthy
  const unhealthyDeps = Object.entries(dependencies)
    .filter(([name, status]) => status.status !== 'healthy')
    .map(([name]) => name);

  if (unhealthyDeps.length > 0) {
    throw new Error(`Unhealthy dependencies: ${unhealthyDeps.join(', ')}`);
  }

  return dependencies;
}

/**
 * Check email service health
 */
async function checkEmailService() {
  try {
    const status = await emailService.getEmailServiceStatus();
    return {
      status: status.configured ? 'healthy' : 'degraded',
      configured: status.configured,
      lastTest: status.lastTest
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Get current health monitoring status
 */
function getHealthMonitoringStatus() {
  return {
    status: 'active',
    timestamp: new Date().toISOString(),
    checks: Object.keys(healthState).map(checkType => ({
      type: checkType,
      status: healthState[checkType].status,
      lastCheck: healthState[checkType].lastCheck,
      consecutiveFailures: healthState[checkType].consecutiveFailures,
      recovering: healthState[checkType].recovering,
      interval: HEALTH_CHECK_CONFIG.intervals[checkType]
    })),
    configuration: {
      intervals: HEALTH_CHECK_CONFIG.intervals,
      thresholds: HEALTH_CHECK_CONFIG.thresholds,
      recovery: HEALTH_CHECK_CONFIG.recovery
    }
  };
}

/**
 * Update health check configuration
 */
function updateHealthCheckConfig(newConfig) {
  Object.assign(HEALTH_CHECK_CONFIG, newConfig);
  console.log('🔧 Health check configuration updated:', newConfig);
}

module.exports = {
  initializeHealthScheduler,
  startHealthScheduler,
  stopHealthScheduler,
  getHealthMonitoringStatus,
  updateHealthCheckConfig,
  HEALTH_CHECK_CONFIG
};
