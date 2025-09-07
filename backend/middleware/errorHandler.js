// Error handling middleware

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // PostgreSQL errors
  if (err.code === '23505') {
    // Duplicate key error
    const field = err.detail.match(/Key \((.+)\)=/)?.[1] || 'field';
    error = new AppError(`${field} already exists`, 400, 'DUPLICATE_ENTRY');
  }

  if (err.code === '23503') {
    // Foreign key constraint error
    error = new AppError('Referenced record not found', 400, 'INVALID_REFERENCE');
  }

  if (err.code === '23502') {
    // Not null constraint error
    const field = err.column || 'field';
    error = new AppError(`${field} is required`, 400, 'MISSING_REQUIRED_FIELD');
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    error = new AppError('Invalid ID format', 400, 'INVALID_ID');
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Internal server error';
  const code = error.code || 'INTERNAL_ERROR';

  // Response format
  const response = {
    success: false,
    error: message,
    code: code,
    timestamp: new Date().toISOString()
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = {
      originalError: err.message,
      url: req.originalUrl,
      method: req.method
    };
  }

  res.status(statusCode).json(response);
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

// Success response helper
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Pagination helper
const paginatedResponse = (res, data, pagination, message = 'Success') => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit)
    },
    timestamp: new Date().toISOString()
  };
  
  // Include debug information if provided
  if (pagination.debug) {
    response.debug = pagination.debug;
  }
  
  res.status(200).json(response);
};

module.exports = {
  AppError,
  asyncHandler,
  errorHandler,
  notFound,
  successResponse,
  paginatedResponse
};