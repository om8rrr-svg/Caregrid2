const cron = require('node-cron');
const {
  TRANSACTION_TYPES,
  executeSyntheticTransaction,
  runAllSyntheticTransactions,
  getSyntheticSummary
} = require('./synthetic');

// Scheduler configuration
const schedulerConfig = {
  enabled: process.env.SYNTHETIC_MONITORING_ENABLED !== 'false',
  schedules: {
    // Run health checks every 5 minutes
    healthCheck: {
      cron: '*/5 * * * *',
      transaction: TRANSACTION_TYPES.API_HEALTH,
      enabled: true
    },
    // Run user login test every 15 minutes
    userLogin: {
      cron: '*/15 * * * *',
      transaction: TRANSACTION_TYPES.USER_LOGIN,
      enabled: true
    },
    // Run clinic search test every 30 minutes
    clinicSearch: {
      cron: '*/30 * * * *',
      transaction: TRANSACTION_TYPES.CLINIC_SEARCH,
      enabled: true
    },
    // Run full suite every hour
    fullSuite: {
      cron: '0 * * * *',
      transaction: 'ALL',
      enabled: true
    },
    // Run contact form test every 2 hours
    contactForm: {
      cron: '0 */2 * * *',
      transaction: TRANSACTION_TYPES.CONTACT_FORM,
      enabled: true
    },
    // Run appointment booking test every 4 hours
    appointmentBooking: {
      cron: '0 */4 * * *',
      transaction: TRANSACTION_TYPES.APPOINTMENT_BOOKING,
      enabled: false // Disabled by default to avoid test bookings
    },
    // Run user registration test every 6 hours
    userRegistration: {
      cron: '0 */6 * * *',
      transaction: TRANSACTION_TYPES.USER_REGISTRATION,
      enabled: false // Disabled by default to avoid test users
    }
  }
};

// Active scheduled tasks
const activeTasks = new Map();

// Scheduler status
let schedulerStatus = {
  enabled: false,
  startTime: null,
  lastRun: null,
  totalRuns: 0,
  activeTasks: 0,
  errors: []
};

/**
 * Start the synthetic monitoring scheduler
 */
function startScheduler() {
  if (!schedulerConfig.enabled) {
    console.log('🔄 Synthetic monitoring scheduler is disabled');
    return;
  }

  console.log('🚀 Starting synthetic monitoring scheduler...');

  schedulerStatus.enabled = true;
  schedulerStatus.startTime = new Date().toISOString();

  // Schedule each enabled task
  Object.entries(schedulerConfig.schedules).forEach(([name, schedule]) => {
    if (schedule.enabled) {
      try {
        const task = cron.schedule(schedule.cron, async () => {
          await executeScheduledTransaction(name, schedule);
        }, {
          scheduled: false,
          timezone: 'UTC'
        });

        task.start();
        activeTasks.set(name, {
          task,
          schedule,
          lastRun: null,
          runCount: 0,
          errors: []
        });

        console.log(`📅 Scheduled synthetic transaction: ${name} (${schedule.cron})`);
      } catch (error) {
        console.error(`❌ Failed to schedule ${name}:`, error.message);
        schedulerStatus.errors.push({
          task: name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  schedulerStatus.activeTasks = activeTasks.size;
  console.log(`✅ Synthetic monitoring scheduler started with ${activeTasks.size} active tasks`);
}

/**
 * Stop the synthetic monitoring scheduler
 */
function stopScheduler() {
  console.log('🛑 Stopping synthetic monitoring scheduler...');

  activeTasks.forEach((taskInfo, name) => {
    try {
      taskInfo.task.stop();
      console.log(`📅 Stopped scheduled task: ${name}`);
    } catch (error) {
      console.error(`❌ Error stopping task ${name}:`, error.message);
    }
  });

  activeTasks.clear();
  schedulerStatus.enabled = false;
  schedulerStatus.activeTasks = 0;

  console.log('✅ Synthetic monitoring scheduler stopped');
}

/**
 * Execute a scheduled synthetic transaction
 */
async function executeScheduledTransaction(taskName, schedule) {
  const taskInfo = activeTasks.get(taskName);
  if (!taskInfo) {
    console.error(`❌ Task info not found for: ${taskName}`);
    return;
  }

  try {
    console.log(`🔄 Executing scheduled synthetic transaction: ${taskName}`);

    let result;
    if (schedule.transaction === 'ALL') {
      result = await runAllSyntheticTransactions();
    } else {
      result = await executeSyntheticTransaction(schedule.transaction, {
        metadata: {
          scheduled: true,
          taskName,
          scheduledAt: new Date().toISOString()
        }
      });
    }

    // Update task info
    taskInfo.lastRun = new Date().toISOString();
    taskInfo.runCount++;

    // Update scheduler status
    schedulerStatus.lastRun = new Date().toISOString();
    schedulerStatus.totalRuns++;

    console.log(`✅ Completed scheduled synthetic transaction: ${taskName}`);

    // Log results for monitoring
    if (Array.isArray(result)) {
      const failed = result.filter(r => r.status !== 'success');
      if (failed.length > 0) {
        console.warn(`⚠️  ${failed.length}/${result.length} transactions failed in ${taskName}`);
      }
    } else if (result.status !== 'success') {
      console.warn(`⚠️  Scheduled transaction ${taskName} failed:`, result.error?.message);
    }

  } catch (error) {
    console.error(`❌ Error executing scheduled transaction ${taskName}:`, error.message);

    // Track error
    taskInfo.errors.push({
      error: error.message,
      timestamp: new Date().toISOString()
    });

    schedulerStatus.errors.push({
      task: taskName,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Limit error history
    if (taskInfo.errors.length > 10) {
      taskInfo.errors = taskInfo.errors.slice(-10);
    }
    if (schedulerStatus.errors.length > 50) {
      schedulerStatus.errors = schedulerStatus.errors.slice(-50);
    }
  }
}

/**
 * Get scheduler status
 */
function getSchedulerStatus() {
  const tasks = Array.from(activeTasks.entries()).map(([name, info]) => ({
    name,
    enabled: info.schedule.enabled,
    cron: info.schedule.cron,
    transaction: info.schedule.transaction,
    lastRun: info.lastRun,
    runCount: info.runCount,
    errorCount: info.errors.length,
    recentErrors: info.errors.slice(-3)
  }));

  return {
    ...schedulerStatus,
    tasks,
    config: {
      enabled: schedulerConfig.enabled,
      totalSchedules: Object.keys(schedulerConfig.schedules).length,
      enabledSchedules: Object.values(schedulerConfig.schedules).filter(s => s.enabled).length
    }
  };
}

/**
 * Update scheduler configuration
 */
function updateSchedulerConfig(updates) {
  try {
    // Update schedules
    if (updates.schedules) {
      Object.entries(updates.schedules).forEach(([name, config]) => {
        if (schedulerConfig.schedules[name]) {
          Object.assign(schedulerConfig.schedules[name], config);

          // If task is currently active and being disabled, stop it
          if (config.enabled === false && activeTasks.has(name)) {
            const taskInfo = activeTasks.get(name);
            taskInfo.task.stop();
            activeTasks.delete(name);
            console.log(`📅 Disabled scheduled task: ${name}`);
          }

          // If task is being enabled and scheduler is running, start it
          if (config.enabled === true && schedulerStatus.enabled && !activeTasks.has(name)) {
            const schedule = schedulerConfig.schedules[name];
            const task = cron.schedule(schedule.cron, async () => {
              await executeScheduledTransaction(name, schedule);
            }, {
              scheduled: false,
              timezone: 'UTC'
            });

            task.start();
            activeTasks.set(name, {
              task,
              schedule,
              lastRun: null,
              runCount: 0,
              errors: []
            });

            console.log(`📅 Enabled scheduled task: ${name}`);
          }
        }
      });
    }

    // Update global enabled status
    if (typeof updates.enabled === 'boolean') {
      schedulerConfig.enabled = updates.enabled;

      if (updates.enabled && !schedulerStatus.enabled) {
        startScheduler();
      } else if (!updates.enabled && schedulerStatus.enabled) {
        stopScheduler();
      }
    }

    schedulerStatus.activeTasks = activeTasks.size;

    return {
      success: true,
      message: 'Scheduler configuration updated',
      status: getSchedulerStatus()
    };
  } catch (error) {
    console.error('❌ Error updating scheduler configuration:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Manually trigger a scheduled task
 */
async function triggerTask(taskName) {
  const schedule = schedulerConfig.schedules[taskName];
  if (!schedule) {
    throw new Error(`Task not found: ${taskName}`);
  }

  console.log(`🔄 Manually triggering task: ${taskName}`);
  await executeScheduledTransaction(taskName, schedule);

  return {
    success: true,
    message: `Task ${taskName} executed successfully`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get scheduler configuration
 */
function getSchedulerConfig() {
  return {
    ...schedulerConfig,
    status: schedulerStatus
  };
}

module.exports = {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  updateSchedulerConfig,
  triggerTask,
  getSchedulerConfig,
  schedulerConfig
};
