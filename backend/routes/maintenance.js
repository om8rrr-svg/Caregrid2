const express = require('express');
const router = express.Router();
const {
  enableMaintenanceMode,
  disableMaintenanceMode,
  getMaintenanceState,
  gracefulShutdown
} = require('../services/maintenanceService');
const { authenticateToken } = require('../middleware/auth');

// Get maintenance status (public endpoint)
router.get('/status', (req, res) => {
  try {
    const state = getMaintenanceState();
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      maintenance: {
        enabled: state.enabled,
        startTime: state.startTime,
        endTime: state.endTime,
        reason: state.reason,
        message: state.message
      }
    });
  } catch (error) {
    console.error('Error getting maintenance status:', error);
    res.status(500).json({
      error: 'Failed to get maintenance status',
      message: error.message
    });
  }
});

// Get detailed maintenance state (authenticated)
router.get('/', authenticateToken, (req, res) => {
  try {
    const state = getMaintenanceState();
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      maintenance: state
    });
  } catch (error) {
    console.error('Error getting maintenance state:', error);
    res.status(500).json({
      error: 'Failed to get maintenance state',
      message: error.message
    });
  }
});

// Enable maintenance mode
router.post('/enable', authenticateToken, async (req, res) => {
  try {
    const { reason, message, endTime, allowedIPs, gracePeriod } = req.body;
    
    // Validate required fields
    if (!reason) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'reason is required'
      });
    }
    
    // Parse endTime if provided
    let parsedEndTime = null;
    if (endTime) {
      parsedEndTime = new Date(endTime);
      if (isNaN(parsedEndTime.getTime())) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'endTime must be a valid ISO date string'
        });
      }
      
      if (parsedEndTime <= new Date()) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'endTime must be in the future'
        });
      }
    }
    
    // Validate gracePeriod
    if (gracePeriod !== undefined && (typeof gracePeriod !== 'number' || gracePeriod < 0)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'gracePeriod must be a positive number'
      });
    }
    
    // Validate allowedIPs
    if (allowedIPs && !Array.isArray(allowedIPs)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'allowedIPs must be an array'
      });
    }
    
    const result = await enableMaintenanceMode({
      reason,
      message,
      endTime: parsedEndTime,
      allowedIPs: allowedIPs || [],
      gracePeriod: gracePeriod || 30000
    });
    
    res.json({
      message: 'Maintenance mode enabled successfully',
      timestamp: new Date().toISOString(),
      maintenance: result.state
    });
    
  } catch (error) {
    console.error('Error enabling maintenance mode:', error);
    res.status(500).json({
      error: 'Failed to enable maintenance mode',
      message: error.message
    });
  }
});

// Disable maintenance mode
router.post('/disable', authenticateToken, async (req, res) => {
  try {
    const result = await disableMaintenanceMode();
    
    res.json({
      message: 'Maintenance mode disabled successfully',
      timestamp: new Date().toISOString(),
      maintenance: result.state
    });
    
  } catch (error) {
    console.error('Error disabling maintenance mode:', error);
    res.status(500).json({
      error: 'Failed to disable maintenance mode',
      message: error.message
    });
  }
});

// Toggle maintenance mode
router.post('/toggle', authenticateToken, async (req, res) => {
  try {
    const currentState = getMaintenanceState();
    
    if (currentState.enabled) {
      const result = await disableMaintenanceMode();
      res.json({
        message: 'Maintenance mode disabled',
        timestamp: new Date().toISOString(),
        maintenance: result.state
      });
    } else {
      const { reason, message, endTime, allowedIPs, gracePeriod } = req.body;
      
      const result = await enableMaintenanceMode({
        reason: reason || 'Manual toggle',
        message,
        endTime: endTime ? new Date(endTime) : null,
        allowedIPs: allowedIPs || [],
        gracePeriod: gracePeriod || 30000
      });
      
      res.json({
        message: 'Maintenance mode enabled',
        timestamp: new Date().toISOString(),
        maintenance: result.state
      });
    }
    
  } catch (error) {
    console.error('Error toggling maintenance mode:', error);
    res.status(500).json({
      error: 'Failed to toggle maintenance mode',
      message: error.message
    });
  }
});

// Graceful shutdown
router.post('/shutdown', authenticateToken, async (req, res) => {
  try {
    const { reason, message, gracePeriod } = req.body;
    
    // Send response before initiating shutdown
    res.json({
      message: 'Graceful shutdown initiated',
      timestamp: new Date().toISOString(),
      gracePeriod: gracePeriod || 30000
    });
    
    // Initiate shutdown after a short delay to ensure response is sent
    setTimeout(async () => {
      try {
        await gracefulShutdown({
          reason: reason || 'Manual shutdown',
          message: message || 'System is shutting down for maintenance.',
          gracePeriod: gracePeriod || 30000
        });
        
        // Exit the process
        process.exit(0);
      } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    }, 1000);
    
  } catch (error) {
    console.error('Error initiating shutdown:', error);
    res.status(500).json({
      error: 'Failed to initiate shutdown',
      message: error.message
    });
  }
});

// Health check for maintenance service
router.get('/health', (req, res) => {
  try {
    const state = getMaintenanceState();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'maintenance',
      details: {
        maintenanceEnabled: state.enabled,
        activeConnections: state.activeConnections,
        shutdownInProgress: state.shutdownInProgress
      }
    });
  } catch (error) {
    console.error('Error checking maintenance service health:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'maintenance',
      error: error.message
    });
  }
});

module.exports = router;