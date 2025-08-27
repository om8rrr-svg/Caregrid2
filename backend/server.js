const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clinicRoutes = require('./routes/clinics');
const appointmentRoutes = require('./routes/appointments');
const contactRoutes = require('./routes/contact');
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
const allowed = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:8000,https://caregrid2-ddk7.vercel.app,https://caregrid2.vercel.app')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? function(origin, cb) {
    if (!origin) return cb(null, true); // allow curl/postman
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  } : true, // Allow all origins in development
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  credentials: false
}));

// Handle preflight for all routes
app.options('*', cors());

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'CareGrid API'
  });
});

// Database health check endpoint
app.get('/health/db', async (req, res) => {
  try {
    const { testConnection } = require('./config/database');
    await testConnection();
    res.status(200).json({
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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