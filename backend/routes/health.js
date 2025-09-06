const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { monitorHealthStatus } = require('../services/alertIntegration');

// Health status constants
const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy'
};

// Performance metrics storage
let performanceMetrics = {
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    averageResponseTime: 0,
    responseTimeHistory: []
  },
  database: {
    connectionPool: {
      active: 0,
      idle: 0,
      total: 0
    },
    queryMetrics: {
      averageQueryTime: 0,
      slowQueries: 0,
      totalQueries: 0
    }
  },
  system: {
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    uptime: 0
  }
};

// Middleware to track request metrics
function trackRequestMetrics(req, res, next) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    performanceMetrics.requests.total++;
    
    if (res.statusCode < 400) {
      performanceMetrics.requests.successful++;
    } else {
      performanceMetrics.requests.failed++;
    }
    
    // Update average response time
    const history = performanceMetrics.requests.responseTimeHistory;
    history.push(responseTime);
    
    // Keep only last 100 response times
    if (history.length > 100) {
      history.shift();
    }
    
    performanceMetrics.requests.averageResponseTime = 
      history.reduce((sum, time) => sum + time, 0) / history.length;
  });
  
  next();
}

// Database health check
async function checkDatabaseHealth() {
  const maxRetries = 3;
  const retryDelay = 1000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { testConnection } = require('../config/database');
      const startTime = Date.now();
      await testConnection();
      const responseTime = Date.now() - startTime;
      
      return {
        status: HEALTH_STATUS.HEALTHY,
        responseTime,
        connection: 'active',
        lastChecked: new Date().toISOString(),
        attempts: attempt
      };
    } catch (error) {
      if (attempt === maxRetries) {
        return {
          status: HEALTH_STATUS.UNHEALTHY,
          connection: 'failed',
          error: error.message,
          lastChecked: new Date().toISOString(),
          attempts: maxRetries
        };
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// External dependencies health check
async function checkDependenciesHealth() {
  const dependencies = {
    emailService: { status: HEALTH_STATUS.HEALTHY, responseTime: 0 },
    googleAuth: { status: HEALTH_STATUS.HEALTHY, responseTime: 0 },
    googlePlaces: { status: HEALTH_STATUS.HEALTHY, responseTime: 0 }
  };
  
  // Check email service
  try {
    const startTime = Date.now();
    // Simulate email service check (replace with actual check)
    await new Promise(resolve => setTimeout(resolve, 50));
    dependencies.emailService.responseTime = Date.now() - startTime;
  } catch (error) {
    dependencies.emailService.status = HEALTH_STATUS.UNHEALTHY;
    dependencies.emailService.error = error.message;
  }
  
  // Check Google Auth service
  try {
    const startTime = Date.now();
    // Simulate Google Auth check (replace with actual check)
    await new Promise(resolve => setTimeout(resolve, 30));
    dependencies.googleAuth.responseTime = Date.now() - startTime;
  } catch (error) {
    dependencies.googleAuth.status = HEALTH_STATUS.UNHEALTHY;
    dependencies.googleAuth.error = error.message;
  }
  
  // Check Google Places service
  try {
    const startTime = Date.now();
    // Simulate Google Places check (replace with actual check)
    await new Promise(resolve => setTimeout(resolve, 40));
    dependencies.googlePlaces.responseTime = Date.now() - startTime;
  } catch (error) {
    dependencies.googlePlaces.status = HEALTH_STATUS.UNHEALTHY;
    dependencies.googlePlaces.error = error.message;
  }
  
  return dependencies;
}

// System metrics collection
function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    uptime: process.uptime(),
    memory: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      usage: (memUsage.heapUsed / memUsage.heapTotal) * 100
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length
    }
  };
}

// API services health check
async function checkApiServicesHealth() {
  const services = {
    auth: { status: HEALTH_STATUS.HEALTHY, responseTime: 0 },
    users: { status: HEALTH_STATUS.HEALTHY, responseTime: 0 },
    clinics: { status: HEALTH_STATUS.HEALTHY, responseTime: 0 },
    appointments: { status: HEALTH_STATUS.HEALTHY, responseTime: 0 }
  };
  
  // Simulate API service health checks
  for (const [serviceName, service] of Object.entries(services)) {
    try {
      const startTime = Date.now();
      // Simulate service check (replace with actual health check logic)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      service.responseTime = Date.now() - startTime;
      
      // Randomly simulate some degraded services for demo
      if (Math.random() < 0.1) {
        service.status = HEALTH_STATUS.DEGRADED;
        service.responseTime += 200;
      }
    } catch (error) {
      service.status = HEALTH_STATUS.UNHEALTHY;
      service.error = error.message;
    }
  }
  
  return services;
}

// Calculate overall health status
function calculateOverallHealth(database, dependencies, apiServices) {
  const allChecks = [
    database.status,
    ...Object.values(dependencies).map(dep => dep.status),
    ...Object.values(apiServices).map(svc => svc.status)
  ];
  
  if (allChecks.every(status => status === HEALTH_STATUS.HEALTHY)) {
    return HEALTH_STATUS.HEALTHY;
  }
  
  if (allChecks.some(status => status === HEALTH_STATUS.UNHEALTHY)) {
    return HEALTH_STATUS.UNHEALTHY;
  }
  
  return HEALTH_STATUS.DEGRADED;
}

// Routes

// Basic health check
router.get('/', async (req, res) => {
  try {
    const database = await checkDatabaseHealth();
    const systemMetrics = getSystemMetrics();
    const overallStatus = database.status === HEALTH_STATUS.HEALTHY ? 
      HEALTH_STATUS.HEALTHY : HEALTH_STATUS.DEGRADED;
    
    const health = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: systemMetrics.uptime,
      database: database.status,
      memory: {
        usage: systemMetrics.memory.usage,
        used: Math.round(systemMetrics.memory.used / 1024 / 1024),
        total: Math.round(systemMetrics.memory.total / 1024 / 1024)
      }
    };
    
    const statusCode = overallStatus === HEALTH_STATUS.HEALTHY ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: HEALTH_STATUS.UNHEALTHY,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const [database, dependencies, apiServices] = await Promise.all([
      checkDatabaseHealth(),
      checkDependenciesHealth(),
      checkApiServicesHealth()
    ]);
    
    const systemMetrics = getSystemMetrics();
    const overallStatus = calculateOverallHealth(database, dependencies, apiServices);
    
    const detailedHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database,
        dependencies,
        apiServices
      },
      system: systemMetrics,
      performance: performanceMetrics
    };
    
    // Monitor health status for alerting
    monitorHealthStatus(detailedHealth);
    
    const statusCode = overallStatus === HEALTH_STATUS.HEALTHY ? 200 : 503;
    res.status(statusCode).json(detailedHealth);
  } catch (error) {
    res.status(503).json({
      status: HEALTH_STATUS.UNHEALTHY,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database-specific health check
router.get('/database', async (req, res) => {
  try {
    const database = await checkDatabaseHealth();
    const statusCode = database.status === HEALTH_STATUS.HEALTHY ? 200 : 503;
    res.status(statusCode).json({
      ...database,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: HEALTH_STATUS.UNHEALTHY,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Dependencies health check
router.get('/dependencies', async (req, res) => {
  try {
    const dependencies = await checkDependenciesHealth();
    const allHealthy = Object.values(dependencies)
      .every(dep => dep.status === HEALTH_STATUS.HEALTHY);
    
    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json({
      status: allHealthy ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.DEGRADED,
      dependencies,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: HEALTH_STATUS.UNHEALTHY,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API services health check
router.get('/services', async (req, res) => {
  try {
    const apiServices = await checkApiServicesHealth();
    const allHealthy = Object.values(apiServices)
      .every(svc => svc.status === HEALTH_STATUS.HEALTHY);
    
    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json({
      status: allHealthy ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.DEGRADED,
      services: apiServices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: HEALTH_STATUS.UNHEALTHY,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Performance metrics endpoint
router.get('/metrics', (req, res) => {
  const systemMetrics = getSystemMetrics();
  
  res.json({
    timestamp: new Date().toISOString(),
    performance: performanceMetrics,
    system: systemMetrics,
    uptime: systemMetrics.uptime
  });
});

// Database performance metrics endpoint
router.get('/metrics/database', async (req, res) => {
  try {
    const { getQueryStats } = require('../config/database');
    const queryStats = getQueryStats();
    
    res.json({
      success: true,
      data: {
        queryPerformance: {
          totalQueries: queryStats.totalQueries,
          slowQueries: queryStats.slowQueries,
          averageQueryTime: Math.round(queryStats.averageQueryTime * 100) / 100,
          slowQueryPercentage: queryStats.slowQueryPercentage,
          totalQueryTime: Math.round(queryStats.totalQueryTime)
        },
        connectionPool: queryStats.poolStats || {
          totalCount: 0,
          idleCount: 0,
          waitingCount: 0
        },
        recommendations: generatePerformanceRecommendations(queryStats)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve database metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Generate performance recommendations based on metrics
function generatePerformanceRecommendations(stats) {
  const recommendations = [];
  
  if (stats.slowQueryPercentage > 10) {
    recommendations.push({
      type: 'warning',
      message: `High percentage of slow queries (${stats.slowQueryPercentage}%). Consider query optimization or adding indexes.`,
      priority: 'high'
    });
  }
  
  if (stats.averageQueryTime > 500) {
    recommendations.push({
      type: 'warning', 
      message: `Average query time is high (${Math.round(stats.averageQueryTime)}ms). Review query patterns and database indexes.`,
      priority: 'medium'
    });
  }
  
  if (stats.poolStats && stats.poolStats.waitingCount > 0) {
    recommendations.push({
      type: 'info',
      message: `${stats.poolStats.waitingCount} connections waiting. Consider increasing pool size if this persists.`,
      priority: 'medium'
    });
  }
  
  if (stats.totalQueries > 1000 && stats.slowQueryPercentage < 5) {
    recommendations.push({
      type: 'success',
      message: 'Database performance is good. Query optimization is working well.',
      priority: 'low'
    });
  }
  
  return recommendations;
}

// Reset metrics (for testing/debugging)
router.post('/metrics/reset', (req, res) => {
  try {
    const { resetQueryStats } = require('../config/database');
    
    // Reset database query statistics
    resetQueryStats();
  } catch (error) {
    console.warn('Could not reset database query stats:', error.message);
  }
  
  performanceMetrics = {
    requests: {
      total: 0,
      successful: 0,
      failed: 0,
      averageResponseTime: 0,
      responseTimeHistory: []
    },
    database: {
      connectionPool: {
        active: 0,
        idle: 0,
        total: 0
      },
      queryMetrics: {
        averageQueryTime: 0,
        slowQueries: 0,
        totalQueries: 0
      }
    },
    system: {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      uptime: 0
    }
  };
  
  res.json({
    message: 'Performance metrics reset successfully',
    timestamp: new Date().toISOString()
  });
});

module.exports = { router, trackRequestMetrics };