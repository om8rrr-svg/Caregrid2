const EventEmitter = require('events');

class CircuitBreaker extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.requestCount = 0;
    
    // Metrics
    this.metrics = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      averageResponseTime: 0,
      lastReset: Date.now()
    };
  }

  async execute(operation, fallback = null) {
    this.requestCount++;
    this.metrics.totalRequests++;
    
    const startTime = Date.now();
    
    try {
      // Check circuit state
      if (this.state === 'OPEN') {
        if (Date.now() - this.lastFailureTime > this.resetTimeout) {
          this.state = 'HALF_OPEN';
          console.log(`🔄 Circuit breaker ${this.name} transitioning to HALF_OPEN`);
        } else {
          throw new Error(`Circuit breaker ${this.name} is OPEN`);
        }
      }
      
      const result = await operation();
      this.onSuccess(Date.now() - startTime);
      return result;
      
    } catch (error) {
      this.onFailure(error, Date.now() - startTime);
      
      // Try fallback if available
      if (fallback && typeof fallback === 'function') {
        try {
          console.log(`🔄 Executing fallback for ${this.name}`);
          return await fallback(error);
        } catch (fallbackError) {
          console.error(`❌ Fallback failed for ${this.name}:`, fallbackError.message);
          throw error; // Throw original error
        }
      }
      
      throw error;
    }
  }
  
  onSuccess(responseTime) {
    this.successCount++;
    this.metrics.totalSuccesses++;
    this.updateAverageResponseTime(responseTime);
    
    if (this.state === 'HALF_OPEN') {
      this.reset();
    }
    
    // Reset failure count on success
    this.failureCount = 0;
  }
  
  onFailure(error, responseTime) {
    this.failureCount++;
    this.metrics.totalFailures++;
    this.lastFailureTime = Date.now();
    this.updateAverageResponseTime(responseTime);
    
    console.error(`❌ Circuit breaker ${this.name} failure (${this.failureCount}/${this.failureThreshold}):`, error.message);
    
    if (this.failureCount >= this.failureThreshold) {
      this.trip();
    }
    
    this.emit('failure', { error, failureCount: this.failureCount });
  }
  
  trip() {
    this.state = 'OPEN';
    this.emit('open', { 
      name: this.name, 
      failureCount: this.failureCount,
      timestamp: new Date().toISOString()
    });
    console.warn(`🚨 Circuit breaker ${this.name} OPENED after ${this.failureCount} failures`);
  }
  
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.metrics.lastReset = Date.now();
    this.emit('reset', { name: this.name, timestamp: new Date().toISOString() });
    console.log(`✅ Circuit breaker ${this.name} RESET`);
  }
  
  updateAverageResponseTime(responseTime) {
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;
  }
  
  getMetrics() {
    return {
      name: this.name,
      state: this.state,
      ...this.metrics,
      failureRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.totalFailures / this.metrics.totalRequests * 100).toFixed(2) + '%' : '0%',
      uptime: Date.now() - this.metrics.lastReset
    };
  }
}

class ErrorBoundaryService {
  constructor() {
    this.circuitBreakers = new Map();
    this.errorPatterns = new Map();
    this.fallbackStrategies = new Map();
    this.healthChecks = new Map();
    
    // Initialize default circuit breakers
    this.initializeDefaultBreakers();
    
    // Start health monitoring
    this.startHealthMonitoring();
  }
  
  initializeDefaultBreakers() {
    // Database operations
    this.createCircuitBreaker('database', {
      failureThreshold: 3,
      resetTimeout: 30000,
      monitoringPeriod: 5000
    });
    
    // Email service
    this.createCircuitBreaker('email', {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 10000
    });
    
    // External APIs
    this.createCircuitBreaker('external-api', {
      failureThreshold: 3,
      resetTimeout: 45000,
      monitoringPeriod: 8000
    });
    
    // Appointments service
    this.createCircuitBreaker('appointments', {
      failureThreshold: 4,
      resetTimeout: 30000,
      monitoringPeriod: 6000
    });
  }
  
  createCircuitBreaker(name, options = {}) {
    const breaker = new CircuitBreaker(name, options);
    
    // Set up event listeners
    breaker.on('open', (data) => {
      console.warn(`🚨 ALERT: Circuit breaker ${data.name} opened at ${data.timestamp}`);
      // Could integrate with alerting system here
    });
    
    breaker.on('reset', (data) => {
      console.log(`✅ Circuit breaker ${data.name} reset at ${data.timestamp}`);
    });
    
    this.circuitBreakers.set(name, breaker);
    return breaker;
  }
  
  getCircuitBreaker(name) {
    return this.circuitBreakers.get(name);
  }
  
  // Execute operation with circuit breaker protection
  async executeWithBreaker(breakerName, operation, fallback = null) {
    const breaker = this.getCircuitBreaker(breakerName);
    if (!breaker) {
      console.warn(`⚠️  Circuit breaker ${breakerName} not found, executing without protection`);
      return await operation();
    }
    
    return await breaker.execute(operation, fallback);
  }
  
  // Register fallback strategy
  registerFallback(serviceName, fallbackFunction) {
    this.fallbackStrategies.set(serviceName, fallbackFunction);
  }
  
  // Register health check
  registerHealthCheck(serviceName, healthCheckFunction) {
    this.healthChecks.set(serviceName, healthCheckFunction);
  }
  
  // Start health monitoring
  startHealthMonitoring() {
    setInterval(async () => {
      for (const [serviceName, healthCheck] of this.healthChecks) {
        try {
          const isHealthy = await healthCheck();
          if (!isHealthy) {
            console.warn(`⚠️  Health check failed for ${serviceName}`);
          }
        } catch (error) {
          console.error(`❌ Health check error for ${serviceName}:`, error.message);
        }
      }
    }, 30000); // Check every 30 seconds
  }
  
  // Get all metrics
  getAllMetrics() {
    const metrics = {};
    for (const [name, breaker] of this.circuitBreakers) {
      metrics[name] = breaker.getMetrics();
    }
    return metrics;
  }
  
  // Graceful degradation helper
  async withGracefulDegradation(serviceName, primaryOperation, degradedOperation) {
    const breaker = this.getCircuitBreaker(serviceName);
    
    if (breaker && breaker.state === 'OPEN') {
      console.log(`🔄 Using degraded mode for ${serviceName}`);
      return await degradedOperation();
    }
    
    try {
      return await this.executeWithBreaker(serviceName, primaryOperation, degradedOperation);
    } catch (error) {
      console.log(`🔄 Falling back to degraded mode for ${serviceName}`);
      return await degradedOperation();
    }
  }
  
  // Error pattern detection
  recordError(serviceName, error) {
    const pattern = this.extractErrorPattern(error);
    const key = `${serviceName}:${pattern}`;
    
    if (!this.errorPatterns.has(key)) {
      this.errorPatterns.set(key, { count: 0, firstSeen: Date.now(), lastSeen: Date.now() });
    }
    
    const patternData = this.errorPatterns.get(key);
    patternData.count++;
    patternData.lastSeen = Date.now();
    
    // Alert on recurring patterns
    if (patternData.count >= 5) {
      console.warn(`🚨 Recurring error pattern detected in ${serviceName}: ${pattern} (${patternData.count} times)`);
    }
  }
  
  extractErrorPattern(error) {
    // Extract meaningful error patterns
    if (error.code) return error.code;
    if (error.message) {
      // Common database errors
      if (error.message.includes('connection')) return 'CONNECTION_ERROR';
      if (error.message.includes('timeout')) return 'TIMEOUT_ERROR';
      if (error.message.includes('duplicate')) return 'DUPLICATE_ERROR';
      if (error.message.includes('not found')) return 'NOT_FOUND_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }
}

// Singleton instance
const errorBoundaryService = new ErrorBoundaryService();

module.exports = errorBoundaryService;