const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Environment validation for critical variables
function validateEnvironment() {
  const warnings = [];
  const errors = [];
  
  // Critical environment variables
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      errors.push('JWT_SECRET is required in production');
    } else {
      warnings.push('JWT_SECRET not set - using fallback (not secure for production)');
      process.env.JWT_SECRET = 'fallback-jwt-secret-for-development-only';
    }
  }
  
  // Database configuration
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasDbVars = process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER;
  
  if (!hasDatabaseUrl && !hasDbVars) {
    if (process.env.NODE_ENV === 'production') {
      errors.push('Database configuration missing: need DATABASE_URL or DB_* variables');
    } else {
      warnings.push('Database not configured - some features may not work');
    }
  }
  
  // Log warnings and errors
  if (warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    warnings.forEach(warning => console.warn(`   • ${warning}`));
  }
  
  if (errors.length > 0) {
    console.error('❌ Environment errors:');
    errors.forEach(error => console.error(`   • ${error}`));
    console.error('🛑 Server cannot start with these configuration errors');
    process.exit(1);
  }
  
  if (warnings.length === 0 && errors.length === 0) {
    console.log('✅ Environment configuration validated');
  }
}

// Validate environment before starting
validateEnvironment();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clinicRoutes = require('./routes/clinics');
const appointmentRoutes = require('./routes/appointments');
const contactRoutes = require('./routes/contact');
const debugRoutes = require('./routes/debug');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Compression middleware - enable gzip compression
app.use(compression({
  level: 6, // Compression level (1-9, 6 is optimal)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Don't compress images, videos, or already compressed files
    const contentType = res.getHeader('content-type');
    if (contentType && (
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('application/zip') ||
      contentType.includes('application/gzip')
    )) {
      return false;
    }
    // Use compression for all other requests
    return compression.filter(req, res);
  }
}));

// Security middleware
app.use(helmet());

// CORS configuration
const allowlist = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173,http://localhost:8000,http://localhost:8080,http://127.0.0.1:8000,http://127.0.0.1:8080,https://caregrid2-ddk7.vercel.app,https://caregrid2.vercel.app')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const vercelPreviewRegex = /^https:\/\/caregrid2-[a-z0-9-]+\.vercel\.app$/i;

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow curl/postman
    if (allowlist.includes(origin) || vercelPreviewRegex.test(origin)) {
      return cb(null, true);
    }
    return cb(new Error('CORS blocked: ' + origin));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  credentials: false, // set true only if we use cookies
  maxAge: 86400
};

app.use(cors(corsOptions));

// Return clean preflight responses
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (increased for development/testing)
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 auth requests per windowMs (increased for development/testing)
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Simple health check endpoint (accessible via /health)
app.get('/health', (req, res) => res.json({ ok: true }));

// Deployment status endpoint
app.get('/deployment-status', async (req, res) => {
  const fs = require('fs');
  let dbSetupStatus = 'unknown';
  let lastSetupAttempt = null;
  
  try {
    if (fs.existsSync('/tmp/db-setup-failed')) {
      dbSetupStatus = 'failed';
      const stats = fs.statSync('/tmp/db-setup-failed');
      lastSetupAttempt = stats.mtime;
    } else {
      dbSetupStatus = 'ok';
    }
  } catch (error) {
    // Ignore file system errors
  }
  
  // Try to test database connection
  let dbConnection = 'unknown';
  try {
    const { testConnection } = require('./config/database');
    await testConnection();
    dbConnection = 'connected';
  } catch (error) {
    dbConnection = 'failed';
  }
  
  const status = {
    timestamp: new Date().toISOString(),
    service: 'CareGrid API',
    version: require('./package.json').version,
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    database: {
      setup_status: dbSetupStatus,
      connection_status: dbConnection,
      last_setup_attempt: lastSetupAttempt
    },
    environment_check: {
      has_jwt_secret: !!process.env.JWT_SECRET,
      has_database_config: !!(process.env.DATABASE_URL || (process.env.DB_HOST && process.env.DB_NAME)),
      has_cors_config: !!process.env.CORS_ORIGIN,
      has_email_config: !!(process.env.EMAIL_SERVICE && process.env.EMAIL_USER)
    }
  };
  
  const overallHealthy = dbConnection === 'connected' && 
                        (dbSetupStatus === 'ok' || dbSetupStatus === 'unknown');
  
  res.status(overallHealthy ? 200 : 503).json(status);

});

// Database health check endpoint with retry logic
app.get('/health/db', async (req, res) => {
  const maxRetries = 3;
  const retryDelay = 1000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { testConnection } = require('./config/database');
      await testConnection();
      res.status(200).json({
        status: 'OK',
        database: 'Connected',
        timestamp: new Date().toISOString(),
        attempt: attempt
      });
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        res.status(503).json({
          status: 'ERROR',
          database: 'Disconnected',
          error: error.message,
          timestamp: new Date().toISOString(),
          attempts: maxRetries
        });
        return;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
});

// Comprehensive system health endpoint
app.get('/health/system', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    memory: process.memoryUsage(),
    database: 'Unknown'
  };
  
  try {
    const { testConnection } = require('./config/database');
    await testConnection();
    health.database = 'Connected';
  } catch (error) {
    health.database = 'Disconnected';
    health.status = 'DEGRADED';
    health.databaseError = error.message;
  }
  
  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API freshness - no stale data for JSON endpoints
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/debug', debugRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CareGrid API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;