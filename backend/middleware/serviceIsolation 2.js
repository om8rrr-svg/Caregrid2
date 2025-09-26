const errorBoundaryService = require('../services/errorBoundaryService');

// Service isolation middleware to prevent cascading failures
class ServiceIsolationManager {
  constructor() {
    this.serviceStates = new Map();
    this.isolationPolicies = new Map();
    this.dependencyGraph = new Map();
    this.healthCheckInterval = 30000; // 30 seconds
    
    this.initializeDefaultPolicies();
    this.startHealthMonitoring();
  }
  
  initializeDefaultPolicies() {
    // Define service isolation policies
    this.isolationPolicies.set('appointments', {
      maxConcurrentRequests: 100,
      timeoutMs: 5000,
      retryAttempts: 3,
      backoffMultiplier: 2,
      isolationLevel: 'high', // high, medium, low
      dependencies: ['database', 'email'],
      fallbackEnabled: true
    });
    
    this.isolationPolicies.set('clinics', {
      maxConcurrentRequests: 50,
      timeoutMs: 3000,
      retryAttempts: 2,
      backoffMultiplier: 1.5,
      isolationLevel: 'medium',
      dependencies: ['database'],
      fallbackEnabled: true
    });
    
    this.isolationPolicies.set('users', {
      maxConcurrentRequests: 200,
      timeoutMs: 2000,
      retryAttempts: 3,
      backoffMultiplier: 2,
      isolationLevel: 'high',
      dependencies: ['database', 'email'],
      fallbackEnabled: false
    });
    
    this.isolationPolicies.set('notifications', {
      maxConcurrentRequests: 30,
      timeoutMs: 10000,
      retryAttempts: 5,
      backoffMultiplier: 1.2,
      isolationLevel: 'low',
      dependencies: ['email', 'external-api'],
      fallbackEnabled: true
    });
    
    // Initialize service states
    for (const [serviceName, policy] of this.isolationPolicies) {
      this.serviceStates.set(serviceName, {
        status: 'healthy',
        activeRequests: 0,
        lastHealthCheck: Date.now(),
        errorCount: 0,
        successCount: 0,
        avgResponseTime: 0,
        isIsolated: false,
        isolationReason: null,
        isolationStartTime: null
      });
    }
  }
  
  // Create isolation middleware for a specific service
  createIsolationMiddleware(serviceName) {
    return async (req, res, next) => {
      const policy = this.isolationPolicies.get(serviceName);
      const state = this.serviceStates.get(serviceName);
      
      if (!policy || !state) {
        console.warn(`⚠️  No isolation policy found for service: ${serviceName}`);
        return next();
      }
      
      // Check if service is isolated
      if (state.isIsolated) {
        return this.handleIsolatedService(req, res, serviceName, state);
      }
      
      // Check concurrent request limit
      if (state.activeRequests >= policy.maxConcurrentRequests) {
        console.warn(`🚫 Service ${serviceName} at max capacity (${state.activeRequests}/${policy.maxConcurrentRequests})`);
        return this.handleOverCapacity(req, res, serviceName);
      }
      
      // Check dependency health
      const unhealthyDeps = this.checkDependencyHealth(policy.dependencies);
      if (unhealthyDeps.length > 0) {
        console.warn(`⚠️  Service ${serviceName} has unhealthy dependencies: ${unhealthyDeps.join(', ')}`);
        
        if (policy.isolationLevel === 'high') {
          return this.handleDependencyFailure(req, res, serviceName, unhealthyDeps);
        }
      }
      
      // Track request
      state.activeRequests++;
      req.serviceStartTime = Date.now();
      req.serviceName = serviceName;
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        if (!res.headersSent) {
          this.handleTimeout(req, res, serviceName);
        }
      }, policy.timeoutMs);
      
      // Override response methods to track completion
      const originalJson = res.json;
      const originalSend = res.send;
      
      const cleanup = () => {
        clearTimeout(timeoutId);
        state.activeRequests = Math.max(0, state.activeRequests - 1);
        
        const responseTime = Date.now() - req.serviceStartTime;
        this.updateServiceMetrics(serviceName, responseTime, res.statusCode < 400);
      };
      
      res.json = function(data) {
        cleanup();
        return originalJson.call(this, data);
      };
      
      res.send = function(data) {
        cleanup();
        return originalSend.call(this, data);
      };
      
      next();
    };
  }
  
  // Handle isolated service requests
  handleIsolatedService(req, res, serviceName, state) {
    const isolationDuration = Date.now() - state.isolationStartTime;
    const maxIsolationTime = 300000; // 5 minutes
    
    if (isolationDuration > maxIsolationTime) {
      // Try to recover from isolation
      console.log(`🔄 Attempting to recover service ${serviceName} from isolation`);
      this.attemptServiceRecovery(serviceName);
    }
    
    return res.status(503).json({
      success: false,
      error: {
        message: `Service ${serviceName} is temporarily isolated`,
        code: 'SERVICE_ISOLATED',
        reason: state.isolationReason,
        isolatedSince: new Date(state.isolationStartTime).toISOString(),
        estimatedRecovery: new Date(state.isolationStartTime + maxIsolationTime).toISOString()
      },
      fallback: true,
      retryAfter: 60
    });
  }
  
  // Handle over-capacity scenarios
  handleOverCapacity(req, res, serviceName) {
    return res.status(503).json({
      success: false,
      error: {
        message: `Service ${serviceName} is at maximum capacity`,
        code: 'SERVICE_OVERLOADED',
        statusCode: 503
      },
      retryAfter: 30
    });
  }
  
  // Handle dependency failures
  handleDependencyFailure(req, res, serviceName, unhealthyDeps) {
    return res.status(503).json({
      success: false,
      error: {
        message: `Service ${serviceName} dependencies are unavailable`,
        code: 'DEPENDENCY_FAILURE',
        dependencies: unhealthyDeps,
        statusCode: 503
      },
      retryAfter: 60
    });
  }
  
  // Handle request timeouts
  handleTimeout(req, res, serviceName) {
    const state = this.serviceStates.get(serviceName);
    state.activeRequests = Math.max(0, state.activeRequests - 1);
    
    console.error(`⏰ Request timeout for service ${serviceName}`);
    
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: {
          message: `Request to ${serviceName} timed out`,
          code: 'REQUEST_TIMEOUT',
          statusCode: 408
        }
      });
    }
  }
  
  // Check health of service dependencies
  checkDependencyHealth(dependencies) {
    const unhealthy = [];
    
    for (const dep of dependencies) {
      const metrics = errorBoundaryService.getMetrics(dep);
      
      if (metrics && (metrics.state === 'OPEN' || metrics.failureRate > 0.5)) {
        unhealthy.push(dep);
      }
    }
    
    return unhealthy;
  }
  
  // Update service metrics
  updateServiceMetrics(serviceName, responseTime, isSuccess) {
    const state = this.serviceStates.get(serviceName);
    
    if (isSuccess) {
      state.successCount++;
    } else {
      state.errorCount++;
    }
    
    // Update average response time
    const totalRequests = state.successCount + state.errorCount;
    state.avgResponseTime = ((state.avgResponseTime * (totalRequests - 1)) + responseTime) / totalRequests;
    
    // Check if service should be isolated
    this.evaluateServiceHealth(serviceName);
  }
  
  // Evaluate if a service should be isolated
  evaluateServiceHealth(serviceName) {
    const state = this.serviceStates.get(serviceName);
    const policy = this.isolationPolicies.get(serviceName);
    
    const totalRequests = state.successCount + state.errorCount;
    const errorRate = totalRequests > 0 ? state.errorCount / totalRequests : 0;
    
    // Isolation criteria
    const shouldIsolate = (
      errorRate > 0.7 || // 70% error rate
      state.avgResponseTime > policy.timeoutMs * 0.8 || // Response time near timeout
      state.errorCount > 50 // Absolute error threshold
    ) && totalRequests > 10; // Minimum sample size
    
    if (shouldIsolate && !state.isIsolated) {
      this.isolateService(serviceName, 'High error rate or slow response time');
    }
  }
  
  // Isolate a service
  isolateService(serviceName, reason) {
    const state = this.serviceStates.get(serviceName);
    
    state.isIsolated = true;
    state.isolationReason = reason;
    state.isolationStartTime = Date.now();
    state.status = 'isolated';
    
    console.error(`🔒 Service ${serviceName} has been isolated: ${reason}`);
    
    // Reset counters for recovery evaluation
    state.errorCount = 0;
    state.successCount = 0;
  }
  
  // Attempt service recovery
  attemptServiceRecovery(serviceName) {
    const state = this.serviceStates.get(serviceName);
    
    // Check if dependencies are healthy
    const policy = this.isolationPolicies.get(serviceName);
    const unhealthyDeps = this.checkDependencyHealth(policy.dependencies);
    
    if (unhealthyDeps.length === 0) {
      state.isIsolated = false;
      state.isolationReason = null;
      state.isolationStartTime = null;
      state.status = 'healthy';
      
      console.log(`✅ Service ${serviceName} recovered from isolation`);
    } else {
      console.log(`❌ Service ${serviceName} recovery failed - dependencies still unhealthy: ${unhealthyDeps.join(', ')}`);
    }
  }
  
  // Start health monitoring
  startHealthMonitoring() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);
  }
  
  // Perform periodic health checks
  performHealthChecks() {
    for (const [serviceName, state] of this.serviceStates) {
      state.lastHealthCheck = Date.now();
      
      // Auto-recovery for isolated services
      if (state.isIsolated) {
        this.attemptServiceRecovery(serviceName);
      }
    }
  }
  
  // Get service status
  getServiceStatus(serviceName) {
    return this.serviceStates.get(serviceName);
  }
  
  // Get all service statuses
  getAllServiceStatuses() {
    const statuses = {};
    
    for (const [serviceName, state] of this.serviceStates) {
      statuses[serviceName] = {
        ...state,
        policy: this.isolationPolicies.get(serviceName)
      };
    }
    
    return statuses;
  }
}

// Create singleton instance
const serviceIsolationManager = new ServiceIsolationManager();

// Export middleware factory and manager
module.exports = {
  createServiceIsolation: (serviceName) => serviceIsolationManager.createIsolationMiddleware(serviceName),
  serviceIsolationManager,
  
  // Health check middleware
  serviceHealthMiddleware: (req, res, next) => {
    if (req.originalUrl === '/health' || req.originalUrl === '/api/health') {
      const originalJson = res.json;
      
      res.json = function(data) {
        const serviceStatuses = serviceIsolationManager.getAllServiceStatuses();
        
        const enhancedData = {
          ...data,
          serviceIsolation: {
            status: 'active',
            services: serviceStatuses,
            timestamp: new Date().toISOString()
          }
        };
        
        return originalJson.call(this, enhancedData);
      };
    }
    
    next();
  }
};