// API Configuration for CareGrid Ops

export const API_CONFIG = {
  // Production CareGrid Backend
  CAREGRID_API_URL: process.env.NEXT_PUBLIC_CAREGRID_API_URL || 'https://caregrid-backend-production.onrender.com',
  
  // CareGrid Ops Backend (for ops-specific features)
  OPS_API_URL: process.env.NEXT_PUBLIC_OPS_API_URL || 'http://localhost:3001',
  
  // API Timeouts
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  HEALTH_CHECK_TIMEOUT: 5000, // 5 seconds
  
  // Retry Configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Health Check Intervals
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  METRICS_COLLECTION_INTERVAL: 60000, // 1 minute
  
  // Authentication
  TOKEN_STORAGE_KEY: 'caregrid_ops_token',
  REFRESH_TOKEN_STORAGE_KEY: 'caregrid_ops_refresh_token',
  TOKEN_EXPIRY_BUFFER: 300000, // 5 minutes before expiry
};

// Environment-specific configurations
export const getApiConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const customEnv = process.env.NEXT_PUBLIC_APP_ENV;
  
  // Check for custom staging environment
  if (customEnv === 'staging') {
    return {
      ...API_CONFIG,
      CAREGRID_API_URL: process.env.NEXT_PUBLIC_CAREGRID_API_URL || 'https://caregrid-backend-staging.onrender.com',
      OPS_API_URL: process.env.NEXT_PUBLIC_OPS_API_URL || 'https://caregrid-ops-api-staging.onrender.com',
    };
  }
  
  switch (env) {
    case 'production':
      return {
        ...API_CONFIG,
        CAREGRID_API_URL: process.env.NEXT_PUBLIC_CAREGRID_API_URL || 'https://caregrid-backend-production.onrender.com',
        OPS_API_URL: process.env.NEXT_PUBLIC_OPS_API_URL || 'https://caregrid-ops-api.onrender.com',
      };
    default: // development
      return {
        ...API_CONFIG,
        CAREGRID_API_URL: process.env.NEXT_PUBLIC_CAREGRID_API_URL || 'http://localhost:3000',
        OPS_API_URL: process.env.NEXT_PUBLIC_OPS_API_URL || 'http://localhost:3001',
      };
  }
};

// API Endpoints
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
  },
  
  // Health Checks
  HEALTH: {
    OVERALL: '/api/health',
    DATABASE: '/api/health/database',
    SERVICES: '/api/health/services',
    EXTERNAL: '/api/health/external',
  },
  
  // CareGrid Production API Health
  CAREGRID: {
    HEALTH: '/api/health',
    CLINICS: '/api/clinics',
    APPOINTMENTS: '/api/appointments',
    USERS: '/api/users',
  },
  
  // Metrics
  METRICS: {
    SYSTEM: '/api/metrics/system',
    BUSINESS: '/api/metrics/business',
    PERFORMANCE: '/api/metrics/performance',
    CUSTOM: '/api/metrics/custom',
  },
  
  // Alerts
  ALERTS: {
    LIST: '/api/alerts',
    CREATE: '/api/alerts',
    UPDATE: '/api/alerts/:id',
    DELETE: '/api/alerts/:id',
    ACKNOWLEDGE: '/api/alerts/:id/acknowledge',
  },
  
  // Incidents
  INCIDENTS: {
    LIST: '/api/incidents',
    CREATE: '/api/incidents',
    UPDATE: '/api/incidents/:id',
    DELETE: '/api/incidents/:id',
    TIMELINE: '/api/incidents/:id/timeline',
  },
  
  // Feature Flags
  FEATURE_FLAGS: {
    LIST: '/api/feature-flags',
    CREATE: '/api/feature-flags',
    UPDATE: '/api/feature-flags/:id',
    DELETE: '/api/feature-flags/:id',
    TOGGLE: '/api/feature-flags/:id/toggle',
  },
  
  // Maintenance
  MAINTENANCE: {
    STATUS: '/api/maintenance/status',
    ENABLE: '/api/maintenance/enable',
    DISABLE: '/api/maintenance/disable',
    SCHEDULE: '/api/maintenance/schedule',
  },
  
  // Synthetic Transactions
  SYNTHETIC: {
    TESTS: '/api/synthetic/tests',
    RESULTS: '/api/synthetic/results',
    RUN: '/api/synthetic/run',
  },
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;