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

// Database migration runner - using setup scripts instead
// Migrations are handled by scripts/setup-render-database.js or scripts/run-performance-migration.js

async function runStartupMigrations() {
  // Skip migrations in development if explicitly disabled
  if (process.env.SKIP_MIGRATIONS === 'true') {
    console.log('⏭️  Skipping migrations (SKIP_MIGRATIONS=true)');
    return;
  }

  console.log('ℹ️  Database migrations should be run separately using setup scripts');
  console.log('   - Use: node scripts/setup-render-database.js');
  console.log('   - Or: node scripts/run-performance-migration.js');
}

// Validate environment before starting
validateEnvironment();

// Run startup checks
runStartupMigrations().then(() => {
  console.log('✅ Startup checks completed');
}).catch(error => {
  console.error('❌ Failed to complete startup checks:', error.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clinicRoutes = require('./routes/clinics');
const appointmentRoutes = require('./routes/appointments');
const contactRoutes = require('./routes/contact');
const debugRoutes = require('./routes/debug');
const { router: healthRoutes, trackRequestMetrics } = require('./routes/health');
const syntheticRoutes = require('./routes/synthetic');
const alertingRoutes = require('./routes/alerting');
const healthMonitoringRoutes = require('./routes/healthMonitoring');
const maintenanceRoutes = require('./routes/maintenance');
const featureFlagsRoutes = require('./routes/feature-flags');
const { startScheduler } = require('./services/syntheticScheduler');
const { initializeAlerting } = require('./services/alerting');
const { initializeHealthScheduler } = require('./services/healthScheduler');
const { initializeMaintenanceService, maintenanceMiddleware } = require('./services/maintenanceService');
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

// Security middleware with enhanced configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://va.vercel-scripts.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://caregrid-backend.onrender.com", "https://vitals.vercel-insights.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for Vercel analytics
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny' // X-Frame-Options: DENY
  },
  noSniff: true, // X-Content-Type-Options: nosniff
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  xssFilter: true
}));

// Additional security headers
app.use((req, res, next) => {
  // Cache control for API responses
  if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
  }
  next();
});

// CORS configuration
const allowlist = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173,http://localhost:8000,http://localhost:8080,http://127.0.0.1:8000,http://127.0.0.1:8080,https://www.caregrid.co.uk,https://caregrid.co.uk,https://caregrid-ops.vercel.app,https://caregrid2-ddk7.vercel.app,https://caregrid2.vercel.app')
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

// Return clean preflight responses with explicit 204 status
app.options('*', (req, res) => {
  // Set CORS headers
  const origin = req.headers.origin;
  if (!origin || allowlist.includes(origin) || vercelPreviewRegex.test(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    res.header('Access-Control-Max-Age', '86400');
  }
  res.status(204).end();
});

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

// Add request metrics tracking
app.use(trackRequestMetrics);

// Maintenance mode middleware (before routes)
app.use(maintenanceMiddleware);

// Legacy deployment status endpoint (redirects to new health system)
app.get('/deployment-status', (req, res) => {
  res.redirect(301, '/health/detailed');
});

// Legacy health endpoints (redirect to new health system)
app.get('/health/db', (req, res) => {
  res.redirect(301, '/health/database');
});

app.get('/health/system', (req, res) => {
  res.redirect(301, '/health/detailed');
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
app.use('/health', healthRoutes);
app.use('/api/synthetic', syntheticRoutes);
app.use('/api/alerts', alertingRoutes);
app.use('/api/health-monitoring', healthMonitoringRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/feature-flags', featureFlagsRoutes);

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
  
  // Start synthetic monitoring scheduler
  startScheduler();
  
  // Initialize alerting system
  initializeAlerting();
  
  // Initialize health monitoring scheduler
  initializeHealthScheduler();
  
  // Initialize maintenance service
  initializeMaintenanceService();
});

// Graceful shutdown
const { gracefulShutdown } = require('./services/maintenanceService');

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await gracefulShutdown({ reason: 'SIGTERM signal received' });
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  try {
    await gracefulShutdown({ reason: 'SIGINT signal received' });
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  try {
    await gracefulShutdown({ reason: 'Uncaught exception', gracePeriod: 5000 });
    process.exit(1);
  } catch (shutdownError) {
    console.error('Error during emergency shutdown:', shutdownError);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
 process.on('unhandledRejection', async (reason, promise) => {
   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
   try {
     await gracefulShutdown({ reason: 'Unhandled promise rejection', gracePeriod: 5000 });
     process.exit(1);
   } catch (shutdownError) {
     console.error('Error during emergency shutdown:', shutdownError);
     process.exit(1);
   }
 });

module.exports = app;