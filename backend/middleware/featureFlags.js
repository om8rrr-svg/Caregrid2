const featureFlagsService = require('../services/featureFlagsService');

/**
 * Middleware to check if a feature flag is enabled for the current user
 * Adds the flag status to req.featureFlags
 */
const checkFeatureFlag = (flagName, options = {}) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || 'anonymous';
      const userContext = {
        role: req.user?.role,
        plan: req.user?.plan,
        accountAgedays: req.user?.accountAgedays,
        ...options.context
      };

      const isEnabled = await featureFlagsService.isFeatureEnabled(flagName, userId, userContext);
      
      // Initialize featureFlags object if it doesn't exist
      if (!req.featureFlags) {
        req.featureFlags = {};
      }
      
      req.featureFlags[flagName] = isEnabled;
      
      // If flag is required and not enabled, return 403
      if (options.required && !isEnabled) {
        return res.status(403).json({
          success: false,
          message: `Feature '${flagName}' is not available`,
          code: 'FEATURE_NOT_AVAILABLE'
        });
      }
      
      next();
    } catch (error) {
      console.error(`Error checking feature flag '${flagName}':`, error);
      
      // If flag check fails and it's required, deny access
      if (options.required) {
        return res.status(500).json({
          success: false,
          message: 'Feature availability check failed'
        });
      }
      
      // Otherwise, default to disabled and continue
      if (!req.featureFlags) {
        req.featureFlags = {};
      }
      req.featureFlags[flagName] = false;
      next();
    }
  };
};

/**
 * Middleware to get experiment variant for the current user
 * Adds the variant to req.experiments
 */
const getExperimentVariant = (experimentName, options = {}) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || 'anonymous';
      const userContext = {
        role: req.user?.role,
        plan: req.user?.plan,
        accountAgedays: req.user?.accountAgedays,
        ...options.context
      };

      const variant = await featureFlagsService.getExperimentVariant(experimentName, userId, userContext);
      
      // Initialize experiments object if it doesn't exist
      if (!req.experiments) {
        req.experiments = {};
      }
      
      req.experiments[experimentName] = variant;
      
      next();
    } catch (error) {
      console.error(`Error getting experiment variant for '${experimentName}':`, error);
      
      // Default to null variant and continue
      if (!req.experiments) {
        req.experiments = {};
      }
      req.experiments[experimentName] = null;
      next();
    }
  };
};

/**
 * Middleware to check multiple feature flags at once
 */
const checkMultipleFlags = (flagConfigs) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || 'anonymous';
      const baseUserContext = {
        role: req.user?.role,
        plan: req.user?.plan,
        accountAgedays: req.user?.accountAgedays
      };

      if (!req.featureFlags) {
        req.featureFlags = {};
      }

      const flagChecks = flagConfigs.map(async (config) => {
        const { name, required = false, context = {} } = config;
        const userContext = { ...baseUserContext, ...context };
        
        try {
          const isEnabled = await featureFlagsService.isFeatureEnabled(name, userId, userContext);
          req.featureFlags[name] = isEnabled;
          
          return { name, enabled: isEnabled, required };
        } catch (error) {
          console.error(`Error checking feature flag '${name}':`, error);
          req.featureFlags[name] = false;
          return { name, enabled: false, required, error: true };
        }
      });

      const results = await Promise.all(flagChecks);
      
      // Check if any required flags are disabled
      const failedRequiredFlags = results.filter(result => result.required && !result.enabled);
      
      if (failedRequiredFlags.length > 0) {
        const flagNames = failedRequiredFlags.map(f => f.name).join(', ');
        return res.status(403).json({
          success: false,
          message: `Required features are not available: ${flagNames}`,
          code: 'REQUIRED_FEATURES_NOT_AVAILABLE',
          unavailableFeatures: flagNames
        });
      }
      
      next();
    } catch (error) {
      console.error('Error checking multiple feature flags:', error);
      res.status(500).json({
        success: false,
        message: 'Feature availability check failed'
      });
    }
  };
};

/**
 * Middleware to track conversion events automatically
 */
const trackConversion = (eventName, options = {}) => {
  return async (req, res, next) => {
    // Store the original res.json method
    const originalJson = res.json;
    
    // Override res.json to track conversion on successful responses
    res.json = function(data) {
      // Only track on successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id || 'anonymous';
        const experimentName = options.experimentName || req.experiments?.[options.experimentKey];
        const value = options.value || (typeof options.getValue === 'function' ? options.getValue(req, res, data) : 1);
        
        // Track conversion asynchronously (don't block response)
        setImmediate(async () => {
          try {
            await featureFlagsService.trackConversion(userId, eventName, experimentName, value);
          } catch (error) {
            console.error(`Error tracking conversion '${eventName}':`, error);
          }
        });
      }
      
      // Call the original res.json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware to add feature flags context to response
 * Useful for frontend applications to know which features are available
 */
const addFeatureFlagsToResponse = (options = {}) => {
  return (req, res, next) => {
    // Store the original res.json method
    const originalJson = res.json;
    
    // Override res.json to add feature flags to response
    res.json = function(data) {
      if (options.includeFlags && req.featureFlags) {
        // Add feature flags to response data
        if (typeof data === 'object' && data !== null) {
          data.featureFlags = req.featureFlags;
        }
      }
      
      if (options.includeExperiments && req.experiments) {
        // Add experiments to response data
        if (typeof data === 'object' && data !== null) {
          data.experiments = req.experiments;
        }
      }
      
      // Call the original res.json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Utility function to create a feature flag guard for routes
 * Returns a middleware that checks if a feature is enabled before allowing access
 */
const requireFeature = (flagName, options = {}) => {
  return checkFeatureFlag(flagName, { ...options, required: true });
};

/**
 * Utility function to create an experiment-aware middleware
 * Automatically assigns users to experiments and tracks exposures
 */
const withExperiment = (experimentName, options = {}) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || 'anonymous';
      const userContext = {
        role: req.user?.role,
        plan: req.user?.plan,
        accountAgedays: req.user?.accountAgedays,
        ...options.context
      };

      const variant = await featureFlagsService.getExperimentVariant(experimentName, userId, userContext);
      
      if (!req.experiments) {
        req.experiments = {};
      }
      req.experiments[experimentName] = variant;
      
      // If variant-specific handling is needed
      if (options.variantHandlers && variant && options.variantHandlers[variant]) {
        return options.variantHandlers[variant](req, res, next);
      }
      
      next();
    } catch (error) {
      console.error(`Error in experiment middleware for '${experimentName}':`, error);
      
      if (!req.experiments) {
        req.experiments = {};
      }
      req.experiments[experimentName] = null;
      next();
    }
  };
};

/**
 * Helper function to check if a feature is enabled in route handlers
 */
const isFeatureEnabled = (req, flagName) => {
  return req.featureFlags && req.featureFlags[flagName] === true;
};

/**
 * Helper function to get experiment variant in route handlers
 */
const getVariant = (req, experimentName) => {
  return req.experiments && req.experiments[experimentName];
};

module.exports = {
  checkFeatureFlag,
  getExperimentVariant,
  checkMultipleFlags,
  trackConversion,
  addFeatureFlagsToResponse,
  requireFeature,
  withExperiment,
  isFeatureEnabled,
  getVariant
};