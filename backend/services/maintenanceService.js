const fs = require('fs').promises;
const path = require('path');
const { createAlert } = require('./alerting');
const emailService = require('./emailService');

// Maintenance state
let maintenanceState = {
  enabled: false,
  startTime: null,
  endTime: null,
  reason: null,
  message: 'System is currently under maintenance. Please try again later.',
  allowedIPs: [], // IPs that can bypass maintenance mode
  gracePeriod: 30000, // 30 seconds grace period for ongoing requests
  notificationsSent: false
};

// Track active connections for graceful shutdown
let activeConnections = new Set();
let shutdownInProgress = false;

/**
 * Enable maintenance mode
 * @param {Object} options - Maintenance options
 * @param {string} options.reason - Reason for maintenance
 * @param {string} options.message - Custom message to display
 * @param {Date} options.endTime - Expected end time
 * @param {Array} options.allowedIPs - IPs that can bypass maintenance
 * @param {number} options.gracePeriod - Grace period in milliseconds
 */
async function enableMaintenanceMode(options = {}) {
  try {
    console.log('🚧 Enabling maintenance mode...');
    
    maintenanceState = {
      enabled: true,
      startTime: new Date(),
      endTime: options.endTime || null,
      reason: options.reason || 'Scheduled maintenance',
      message: options.message || 'System is currently under maintenance. Please try again later.',
      allowedIPs: options.allowedIPs || [],
      gracePeriod: options.gracePeriod || 30000,
      notificationsSent: false
    };
    
    // Save maintenance state to file for persistence
    await saveMaintenanceState();
    
    // Send notifications
    await sendMaintenanceNotifications('enabled');
    
    // Create alert
    await createAlert({
      type: 'maintenance_mode_enabled',
      severity: 'medium',
      message: `Maintenance mode enabled: ${maintenanceState.reason}`,
      metadata: {
        startTime: maintenanceState.startTime,
        endTime: maintenanceState.endTime,
        reason: maintenanceState.reason
      }
    });
    
    console.log('✅ Maintenance mode enabled successfully');
    return { success: true, state: maintenanceState };
    
  } catch (error) {
    console.error('❌ Error enabling maintenance mode:', error);
    throw error;
  }
}

/**
 * Disable maintenance mode
 */
async function disableMaintenanceMode() {
  try {
    console.log('🔧 Disabling maintenance mode...');
    
    const previousState = { ...maintenanceState };
    
    maintenanceState = {
      enabled: false,
      startTime: null,
      endTime: null,
      reason: null,
      message: 'System is currently under maintenance. Please try again later.',
      allowedIPs: [],
      gracePeriod: 30000,
      notificationsSent: false
    };
    
    // Save maintenance state to file
    await saveMaintenanceState();
    
    // Send notifications
    await sendMaintenanceNotifications('disabled', previousState);
    
    // Create alert
    await createAlert({
      type: 'maintenance_mode_disabled',
      severity: 'low',
      message: 'Maintenance mode disabled - System is back online',
      metadata: {
        previousStartTime: previousState.startTime,
        duration: previousState.startTime ? Date.now() - new Date(previousState.startTime).getTime() : 0,
        reason: previousState.reason
      }
    });
    
    console.log('✅ Maintenance mode disabled successfully');
    return { success: true, state: maintenanceState };
    
  } catch (error) {
    console.error('❌ Error disabling maintenance mode:', error);
    throw error;
  }
}

/**
 * Get current maintenance state
 */
function getMaintenanceState() {
  return {
    ...maintenanceState,
    activeConnections: activeConnections.size,
    shutdownInProgress
  };
}

/**
 * Check if IP is allowed during maintenance
 */
function isIPAllowed(ip) {
  if (!maintenanceState.enabled) return true;
  
  // Always allow localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  
  return maintenanceState.allowedIPs.includes(ip);
}

/**
 * Middleware to check maintenance mode
 */
function maintenanceMiddleware(req, res, next) {
  // Skip maintenance check for health endpoints
  if (req.path.startsWith('/health') || req.path === '/api/maintenance') {
    return next();
  }
  
  if (maintenanceState.enabled && !isIPAllowed(req.ip)) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: maintenanceState.message,
      maintenanceMode: true,
      startTime: maintenanceState.startTime,
      endTime: maintenanceState.endTime,
      reason: maintenanceState.reason
    });
  }
  
  // Track active connections
  const connectionId = `${req.ip}-${Date.now()}-${Math.random()}`;
  activeConnections.add(connectionId);
  
  // Remove connection when request ends
  res.on('finish', () => {
    activeConnections.delete(connectionId);
  });
  
  res.on('close', () => {
    activeConnections.delete(connectionId);
  });
  
  next();
}

/**
 * Graceful shutdown with maintenance mode
 */
async function gracefulShutdown(options = {}) {
  try {
    console.log('🛑 Initiating graceful shutdown...');
    shutdownInProgress = true;
    
    // Enable maintenance mode if not already enabled
    if (!maintenanceState.enabled) {
      await enableMaintenanceMode({
        reason: options.reason || 'System shutdown',
        message: options.message || 'System is shutting down for maintenance.',
        gracePeriod: options.gracePeriod || 30000
      });
    }
    
    console.log(`⏳ Waiting for ${activeConnections.size} active connections to finish...`);
    console.log(`⏱️ Grace period: ${maintenanceState.gracePeriod}ms`);
    
    // Wait for active connections to finish or grace period to expire
    const startTime = Date.now();
    while (activeConnections.size > 0 && (Date.now() - startTime) < maintenanceState.gracePeriod) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (activeConnections.size > 0) {
      console.log(`⚠️ Force closing ${activeConnections.size} remaining connections`);
    } else {
      console.log('✅ All connections closed gracefully');
    }
    
    // Create shutdown alert
    await createAlert({
      type: 'system_shutdown',
      severity: 'high',
      message: 'System shutdown initiated',
      metadata: {
        reason: options.reason || 'System shutdown',
        activeConnections: activeConnections.size,
        gracePeriod: maintenanceState.gracePeriod,
        forceClosed: activeConnections.size > 0
      }
    });
    
    console.log('🔄 Graceful shutdown completed');
    return { success: true, connectionsForced: activeConnections.size };
    
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    throw error;
  }
}

/**
 * Send maintenance notifications
 */
async function sendMaintenanceNotifications(action, previousState = null) {
  try {
    if (maintenanceState.notificationsSent && action === 'enabled') {
      return; // Avoid duplicate notifications
    }
    
    const subject = action === 'enabled' 
      ? `🚧 Maintenance Mode Enabled - ${maintenanceState.reason}`
      : '✅ Maintenance Mode Disabled - System Online';
    
    const message = action === 'enabled'
      ? `Maintenance mode has been enabled.\n\nReason: ${maintenanceState.reason}\nStart Time: ${maintenanceState.startTime}\nExpected End: ${maintenanceState.endTime || 'TBD'}\nMessage: ${maintenanceState.message}`
      : `Maintenance mode has been disabled. System is back online.\n\nPrevious maintenance:\nReason: ${previousState?.reason || 'N/A'}\nDuration: ${previousState?.startTime ? Math.round((Date.now() - new Date(previousState.startTime).getTime()) / 1000 / 60) : 0} minutes`;
    
    // Send email notification (if configured)
    if (process.env.MAINTENANCE_NOTIFICATION_EMAIL) {
      await emailService.sendEmail({
        to: process.env.MAINTENANCE_NOTIFICATION_EMAIL,
        subject,
        text: message,
        html: `<pre>${message}</pre>`
      });
    }
    
    if (action === 'enabled') {
      maintenanceState.notificationsSent = true;
    }
    
  } catch (error) {
    console.error('Error sending maintenance notifications:', error);
  }
}

/**
 * Save maintenance state to file for persistence
 */
async function saveMaintenanceState() {
  try {
    const stateFile = path.join(__dirname, '../data/maintenance-state.json');
    const dataDir = path.dirname(stateFile);
    
    // Ensure data directory exists
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
    
    await fs.writeFile(stateFile, JSON.stringify(maintenanceState, null, 2));
  } catch (error) {
    console.error('Error saving maintenance state:', error);
  }
}

/**
 * Load maintenance state from file
 */
async function loadMaintenanceState() {
  try {
    const stateFile = path.join(__dirname, '../data/maintenance-state.json');
    const data = await fs.readFile(stateFile, 'utf8');
    const savedState = JSON.parse(data);
    
    // Only restore if maintenance was enabled and hasn't expired
    if (savedState.enabled) {
      if (!savedState.endTime || new Date(savedState.endTime) > new Date()) {
        maintenanceState = { ...maintenanceState, ...savedState };
        console.log('🔄 Restored maintenance mode from previous session');
      } else {
        console.log('⏰ Previous maintenance mode has expired');
        await disableMaintenanceMode();
      }
    }
  } catch (error) {
    // File doesn't exist or is invalid, use default state
    console.log('📝 No previous maintenance state found, using defaults');
  }
}

/**
 * Initialize maintenance service
 */
async function initializeMaintenanceService() {
  try {
    console.log('🔧 Initializing maintenance service...');
    
    // Load previous state
    await loadMaintenanceState();
    
    console.log('✅ Maintenance service initialized');
    return { success: true, state: maintenanceState };
    
  } catch (error) {
    console.error('❌ Error initializing maintenance service:', error);
    throw error;
  }
}

module.exports = {
  enableMaintenanceMode,
  disableMaintenanceMode,
  getMaintenanceState,
  isIPAllowed,
  maintenanceMiddleware,
  gracefulShutdown,
  initializeMaintenanceService,
  // For testing
  activeConnections
};