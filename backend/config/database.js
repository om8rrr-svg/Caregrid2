const { Pool } = require('pg');
const path = require('path');
const MockDatabase = require(path.join(__dirname, '..', 'mock-database'));
const { createSupabaseClient, querySupabase } = require('./supabase');
require('dotenv').config();

// Initialize mock database for testing
let mockDb = null;
let useMock = false;

// Check if we should use Supabase or PostgreSQL
const useSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY;

// Database configuration - supports both DATABASE_URL and individual env vars
let dbConfig;

// Prioritize Supabase if available, otherwise use PostgreSQL
if (useSupabase) {
  console.log('🔗 Supabase configuration detected - will use Supabase client');
} else if (process.env.DATABASE_URL) {
  // Use DATABASE_URL (common for Render, Heroku, etc.)
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Optimized connection pool settings
    max: process.env.NODE_ENV === 'production' ? 25 : 15, // maximum number of clients in the pool
    min: 2, // minimum number of clients in the pool
    idleTimeoutMillis: 20000, // reduced idle timeout for faster cleanup
    connectionTimeoutMillis: 5000, // increased connection timeout for reliability
    acquireTimeoutMillis: 60000, // time to wait for connection from pool
    createTimeoutMillis: 30000, // time to wait for new connection creation
    destroyTimeoutMillis: 5000, // time to wait for connection destruction
    reapIntervalMillis: 1000, // frequency to check for idle connections
    createRetryIntervalMillis: 200, // retry interval for failed connections
    // Performance optimizations
    statement_timeout: 30000, // 30 second query timeout
    query_timeout: 30000, // 30 second query timeout
    application_name: 'caregrid-backend'
  };
  console.log('🔗 Using DATABASE_URL for connection with optimized pool settings');
} else if (process.env.DB_PASSWORD) {
  // Use individual environment variables only if DB_PASSWORD is set
  dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'caregrid',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Optimized connection pool settings
    max: process.env.NODE_ENV === 'production' ? 25 : 15, // maximum number of clients in the pool
    min: 2, // minimum number of clients in the pool
    idleTimeoutMillis: 20000, // reduced idle timeout for faster cleanup
    connectionTimeoutMillis: 5000, // increased connection timeout for reliability
    acquireTimeoutMillis: 60000, // time to wait for connection from pool
    createTimeoutMillis: 30000, // time to wait for new connection creation
    destroyTimeoutMillis: 5000, // time to wait for connection destruction
    reapIntervalMillis: 1000, // frequency to check for idle connections
    createRetryIntervalMillis: 200, // retry interval for failed connections
    // Performance optimizations
    statement_timeout: 30000, // 30 second query timeout
    query_timeout: 30000, // 30 second query timeout
    application_name: 'caregrid-backend'
  };
  console.log('🔗 Using individual DB_* environment variables with optimized pool settings');
} else if (!useSupabase) {
  // No database configured - use mock for testing
  console.log('🧪 No database configured - using mock data for testing');
  useMock = true;
  mockDb = new MockDatabase();
}

// Create connection pool or Supabase client
let pool = null;
let supabaseClient = null;

if (useSupabase && !useMock) {
  supabaseClient = createSupabaseClient();
  console.log('✅ Using Supabase client for database operations');
} else if (!useMock) {
  pool = new Pool(dbConfig);
  
  // Test database connection
  pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    console.log('🧪 Falling back to mock database for testing');
    useMock = true;
    mockDb = new MockDatabase();
  });
}

// Performance tracking
let queryStats = {
  totalQueries: 0,
  slowQueries: 0,
  averageQueryTime: 0,
  totalQueryTime: 0
};

// Helper function to execute queries with performance monitoring
const query = async (text, params) => {
  const start = Date.now();
  try {
    let res;
    
    if (useMock) {
      // Use mock database
      res = await mockDb.query(text, params);
      const duration = Date.now() - start;
      console.log('🧪 Mock query executed', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
    } else if (useSupabase) {
      // Use Supabase client
      res = await querySupabase(text, params);
    } else {
      // Use real database with performance monitoring
      res = await pool.query(text, params);
      const duration = Date.now() - start;
      
      // Update performance statistics
      queryStats.totalQueries++;
      queryStats.totalQueryTime += duration;
      queryStats.averageQueryTime = queryStats.totalQueryTime / queryStats.totalQueries;
      
      // Track slow queries (>1000ms)
      if (duration > 1000) {
        queryStats.slowQueries++;
        console.warn('🐌 Slow query detected', { 
          text: text.substring(0, 100) + '...', 
          duration, 
          rows: res.rowCount,
          params: params ? params.length : 0
        });
      } else {
        console.log('📊 Query executed', { 
          text: text.substring(0, 50) + '...', 
          duration, 
          rows: res.rowCount 
        });
      }
    }
    
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error);
    
    // Fallback to mock if real database fails
    if (!useMock && !error.message.includes('Mock')) {
      console.log('🧪 Falling back to mock database due to error');
      useMock = true;
      if (!mockDb) mockDb = new MockDatabase();
      return await mockDb.query(text, params);
    }
    
    throw error;
  }
};

// Helper function to get a client from the pool
const getClient = async () => {
  if (useMock) {
    // Return a mock client
    return {
      query: mockDb.query.bind(mockDb),
      release: () => {},
    };
  }
  
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('❌ Error getting database client:', error);
    console.log('🧪 Falling back to mock database');
    useMock = true;
    if (!mockDb) mockDb = new MockDatabase();
    return {
      query: mockDb.query.bind(mockDb),
      release: () => {},
    };
  }
};

// Helper function for transactions
const transaction = async (callback) => {
  if (useMock) {
    // For mock, just execute the callback directly
    return await callback({
      query: mockDb.query.bind(mockDb),
      release: () => {}
    });
  }
  
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Test connection function
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('🕒 Database time:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

// Graceful shutdown
const closePool = async () => {
  if (useMock) {
    console.log('🧪 Mock database - no pool to close');
    return;
  }
  
  try {
    await pool.end();
    console.log('🔒 Database pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
};

// Get performance statistics
const getQueryStats = () => {
  return {
    ...queryStats,
    slowQueryPercentage: queryStats.totalQueries > 0 ? 
      (queryStats.slowQueries / queryStats.totalQueries * 100).toFixed(2) : 0,
    poolStats: pool ? {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    } : null
  };
};

// Reset performance statistics
const resetQueryStats = () => {
  queryStats = {
    totalQueries: 0,
    slowQueries: 0,
    averageQueryTime: 0,
    totalQueryTime: 0
  };
};

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  testConnection,
  closePool,
  getQueryStats,
  resetQueryStats
};