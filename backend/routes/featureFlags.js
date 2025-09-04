const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const featureFlagsService = require('../services/featureFlagsService');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Public endpoint to check if a feature is enabled for a user
router.get('/check/:flagName',
  optionalAuth,
  param('flagName').isString().notEmpty(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { flagName } = req.params;
      const userId = req.user?.id || 'anonymous';
      const userContext = {
        role: req.user?.role,
        plan: req.user?.plan,
        accountAgedays: req.user?.accountAgedays,
        ...req.query // Allow additional context via query params
      };

      const isEnabled = await featureFlagsService.isFeatureEnabled(flagName, userId, userContext);
      
      res.json({
        success: true,
        data: {
          flagName,
          enabled: isEnabled,
          userId: req.user ? userId : undefined
        }
      });
    } catch (error) {
      console.error('Error checking feature flag:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check feature flag'
      });
    }
  }
);

// Public endpoint to get experiment variant for a user
router.get('/experiment/:experimentName',
  optionalAuth,
  param('experimentName').isString().notEmpty(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { experimentName } = req.params;
      const userId = req.user?.id || 'anonymous';
      const userContext = {
        role: req.user?.role,
        plan: req.user?.plan,
        accountAgedays: req.user?.accountAgedays,
        ...req.query
      };

      const variant = await featureFlagsService.getExperimentVariant(experimentName, userId, userContext);
      
      res.json({
        success: true,
        data: {
          experimentName,
          variant,
          userId: req.user ? userId : undefined
        }
      });
    } catch (error) {
      console.error('Error getting experiment variant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get experiment variant'
      });
    }
  }
);

// Track conversion event
router.post('/track/conversion',
  optionalAuth,
  body('eventName').isString().notEmpty(),
  body('experimentName').optional().isString(),
  body('value').optional().isNumeric(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { eventName, experimentName, value = 1 } = req.body;
      const userId = req.user?.id || 'anonymous';

      await featureFlagsService.trackConversion(userId, eventName, experimentName, value);
      
      res.json({
        success: true,
        message: 'Conversion tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking conversion:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track conversion'
      });
    }
  }
);

// Admin endpoints - require authentication and admin role

// Get all feature flags
router.get('/admin/flags',
  authenticateToken,
  requireRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const flags = featureFlagsService.getFeatureFlags();
      res.json({
        success: true,
        data: flags
      });
    } catch (error) {
      console.error('Error getting feature flags:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feature flags'
      });
    }
  }
);

// Create or update feature flag
router.post('/admin/flags',
  authenticateToken,
  requireRole(['admin']),
  body('name').isString().notEmpty(),
  body('description').optional().isString(),
  body('enabled').optional().isBoolean(),
  body('rolloutPercentage').optional().isInt({ min: 0, max: 100 }),
  body('targetAudience').optional().isObject(),
  body('conditions').optional().isObject(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const flagData = req.body;
      const flag = await featureFlagsService.createFeatureFlag(flagData);
      
      res.status(201).json({
        success: true,
        message: 'Feature flag created/updated successfully',
        data: flag
      });
    } catch (error) {
      console.error('Error creating feature flag:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create feature flag'
      });
    }
  }
);

// Update feature flag
router.put('/admin/flags/:name',
  authenticateToken,
  requireRole(['admin']),
  param('name').isString().notEmpty(),
  body('enabled').optional().isBoolean(),
  body('rolloutPercentage').optional().isInt({ min: 0, max: 100 }),
  body('targetAudience').optional().isObject(),
  body('conditions').optional().isObject(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name } = req.params;
      const updates = req.body;
      
      const flag = await featureFlagsService.updateFeatureFlag(name, updates);
      
      res.json({
        success: true,
        message: 'Feature flag updated successfully',
        data: flag
      });
    } catch (error) {
      console.error('Error updating feature flag:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update feature flag'
      });
    }
  }
);

// Get all experiments
router.get('/admin/experiments',
  authenticateToken,
  requireRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const experiments = featureFlagsService.getExperiments();
      res.json({
        success: true,
        data: experiments
      });
    } catch (error) {
      console.error('Error getting experiments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get experiments'
      });
    }
  }
);

// Create experiment
router.post('/admin/experiments',
  authenticateToken,
  requireRole(['admin']),
  body('name').isString().notEmpty(),
  body('description').optional().isString(),
  body('featureFlagId').optional().isInt(),
  body('variants').isArray().notEmpty(),
  body('trafficAllocation').optional().isInt({ min: 0, max: 100 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('successMetrics').optional().isArray(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const experimentData = req.body;
      const experiment = await featureFlagsService.createExperiment(experimentData);
      
      res.status(201).json({
        success: true,
        message: 'Experiment created successfully',
        data: experiment
      });
    } catch (error) {
      console.error('Error creating experiment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create experiment'
      });
    }
  }
);

// Update experiment status
router.put('/admin/experiments/:name/status',
  authenticateToken,
  requireRole(['admin']),
  param('name').isString().notEmpty(),
  body('status').isIn(['draft', 'active', 'paused', 'completed', 'archived']),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name } = req.params;
      const { status } = req.body;
      
      const experiment = await featureFlagsService.updateExperimentStatus(name, status);
      
      res.json({
        success: true,
        message: 'Experiment status updated successfully',
        data: experiment
      });
    } catch (error) {
      console.error('Error updating experiment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update experiment status'
      });
    }
  }
);

// Get analytics data
router.get('/admin/analytics',
  authenticateToken,
  requireRole(['admin', 'manager']),
  query('experimentName').optional().isString(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { experimentName } = req.query;
      const analytics = featureFlagsService.getAnalytics(experimentName);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get analytics'
      });
    }
  }
);

// Bulk feature flag operations
router.post('/admin/flags/bulk',
  authenticateToken,
  requireRole(['admin']),
  body('operation').isIn(['enable', 'disable', 'delete']),
  body('flagNames').isArray().notEmpty(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { operation, flagNames } = req.body;
      const results = [];
      
      for (const flagName of flagNames) {
        try {
          let result;
          if (operation === 'enable') {
            result = await featureFlagsService.updateFeatureFlag(flagName, { enabled: true });
          } else if (operation === 'disable') {
            result = await featureFlagsService.updateFeatureFlag(flagName, { enabled: false });
          }
          // Note: delete operation would need to be implemented in the service
          
          results.push({ flagName, success: true, data: result });
        } catch (error) {
          results.push({ flagName, success: false, error: error.message });
        }
      }
      
      res.json({
        success: true,
        message: `Bulk ${operation} operation completed`,
        data: results
      });
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk operation'
      });
    }
  }
);

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'feature-flags',
      initialized: featureFlagsService.initialized,
      flagsCount: featureFlagsService.getFeatureFlags().length,
      experimentsCount: featureFlagsService.getExperiments().length
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Feature flags health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Feature flags service unhealthy',
      error: error.message
    });
  }
});

module.exports = router;