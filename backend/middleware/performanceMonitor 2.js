const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Override res.json to capture response time
  const originalJson = res.json;
  res.json = function(data) {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const responseTime = endTime - startTime;
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

    // Log performance metrics
    console.log(`🚀 Performance Metrics:`, {
      method: req.method,
      url: req.originalUrl,
      responseTime: `${responseTime}ms`,
      memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString()
    });

    // Add performance headers
    res.set({
      'X-Response-Time': `${responseTime}ms`,
      'X-Memory-Delta': `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`
    });

    return originalJson.call(this, data);
  };

  next();
};

module.exports = performanceMonitor;