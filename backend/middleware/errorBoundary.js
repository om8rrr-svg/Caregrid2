const errorBoundaryService = require('../services/errorBoundaryService');
const { AppError } = require('./errorHandler');

// Error boundary middleware for route-level protection
const createErrorBoundary = (serviceName, options = {}) => {
  return (req, res, next) => {
    // Store original res.json to intercept responses
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Track request start time
    req.startTime = Date.now();
    req.serviceName = serviceName;
    
    // Override response methods to catch errors
    res.json = function(data) {
      // If we get here, the request was successful
      const responseTime = Date.now() - req.startTime;
      
      // Log successful request
      console.log(`✅ ${serviceName} request completed in ${responseTime}ms`);
      
      return originalJson.call(this, data);
    };
    
    res.send = function(data) {
      const responseTime = Date.now() - req.startTime;
      
      if (res.statusCode >= 400) {
        // This is an error response
        const error = new Error(`HTTP ${res.statusCode} response`);
        error.statusCode = res.statusCode;
        errorBoundaryService.recordError(serviceName, error);
        
        console.warn(`⚠️  ${serviceName} error response (${res.statusCode}) in ${responseTime}ms`);
      } else {
        console.log(`✅ ${serviceName} request completed in ${responseTime}ms`);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Global error boundary middleware
const globalErrorBoundary = (error, req, res, next) => {
  const serviceName = req.serviceName || 'unknown';
  const responseTime = req.startTime ? Date.now() - req.startTime : 0;
  
  // Record error in boundary service
  errorBoundaryService.recordError(serviceName, error);
  
  console.error(`❌ Error in ${serviceName} after ${responseTime}ms:`, {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Determine if we should provide a fallback response
  const shouldFallback = shouldProvideFallback(error, req);
  
  if (shouldFallback && !res.headersSent) {
    return provideFallbackResponse(error, req, res, serviceName);
  }
  
  // Standard error handling
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      },
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    });
  }
  
  // Unexpected errors
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: 'INTERNAL_ERROR',
      statusCode
    },
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  });
};

// Determine if we should provide a fallback response
function shouldProvideFallback(error, req) {
  // Provide fallbacks for certain types of requests
  const fallbackRoutes = [
    '/api/appointments',
    '/api/clinics',
    '/api/users/profile'
  ];
  
  return fallbackRoutes.some(route => req.originalUrl.startsWith(route)) &&
         (error.code === 'CONNECTION_ERROR' || 
          error.code === 'TIMEOUT_ERROR' ||
          error.statusCode >= 500);
}

// Provide fallback responses for critical endpoints
function provideFallbackResponse(error, req, res, serviceName) {
  console.log(`🔄 Providing fallback response for ${serviceName}`);
  
  const baseResponse = {
    success: false,
    fallback: true,
    message: 'Service temporarily unavailable, showing cached/fallback data',
    timestamp: new Date().toISOString()
  };
  
  // Route-specific fallbacks
  if (req.originalUrl.startsWith('/api/appointments')) {
    return res.status(503).json({
      ...baseResponse,
      data: {
        appointments: [],
        message: 'Appointments service is temporarily unavailable. Please try again later.',
        canRetry: true,
        retryAfter: 30
      }
    });
  }
  
  if (req.originalUrl.startsWith('/api/clinics')) {
    return res.status(503).json({
      ...baseResponse,
      data: {
        clinics: [],
        message: 'Clinic search is temporarily unavailable. Please try again later.',
        canRetry: true,
        retryAfter: 30
      }
    });
  }
  
  if (req.originalUrl.startsWith('/api/users/profile')) {
    return res.status(503).json({
      ...baseResponse,
      data: {
        profile: null,
        message: 'Profile service is temporarily unavailable. Please try again later.',
        canRetry: true,
        retryAfter: 30
      }
    });
  }
  
  // Generic fallback
  return res.status(503).json({
    ...baseResponse,
    data: null,
    message: 'Service temporarily unavailable. Please try again later.',
    canRetry: true,
    retryAfter: 30
  });
}

// Async error wrapper with circuit breaker
const withErrorBoundary = (serviceName, asyncFn) => {
  return async (req, res, next) => {
    try {
      req.serviceName = serviceName;
      req.startTime = Date.now();
      
      // Execute with circuit breaker protection
      await errorBoundaryService.executeWithBreaker(
        serviceName,
        () => asyncFn(req, res, next),
        // Fallback function
        async (error) => {
          console.log(`🔄 Circuit breaker fallback triggered for ${serviceName}`);
          return provideFallbackResponse(error, req, res, serviceName);
        }
      );
    } catch (error) {
      next(error);
    }
  };
};

// Health check middleware
const healthCheckBoundary = (req, res, next) => {
  // Add circuit breaker metrics to health check
  const originalJson = res.json;
  
  res.json = function(data) {
    if (req.originalUrl === '/health' || req.originalUrl === '/api/health') {
      const metrics = errorBoundaryService.getAllMetrics();
      
      // Enhance health data with circuit breaker status
      const enhancedData = {
        ...data,
        circuitBreakers: metrics,
        errorBoundaries: {
          status: 'active',
          protectedServices: Object.keys(metrics),
          timestamp: new Date().toISOString()
        }
      };
      
      return originalJson.call(this, enhancedData);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  createErrorBoundary,
  globalErrorBoundary,
  withErrorBoundary,
  healthCheckBoundary,
  errorBoundaryService
};