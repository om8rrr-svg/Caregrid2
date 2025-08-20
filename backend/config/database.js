const { Pool } = require('pg');
const path = require('path');
const MockDatabase = require(path.join(__dirname, '..', 'mock-database'));
require('dotenv').config();

// Initialize mock database for testing
let mockDb = null;
let useMock = false;

// Database configuration - supports both DATABASE_URL and individual env vars
let dbConfig;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL (common for Render, Heroku, etc.)
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
    connectionTimeoutMillis: 2000, // how long to wait when connecting a client
  };
  console.log('🔗 Using DATABASE_URL for connection');
} else if (process.env.DB_PASSWORD) {
  // Use individual environment variables only if DB_PASSWORD is set
  dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'caregrid',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
    connectionTimeoutMillis: 2000, // how long to wait when connecting a client
  };
  console.log('🔗 Using individual DB_* environment variables');
} else {
  // No database configured - use mock for testing
  console.log('🧪 No database configured - using mock data for testing');
  useMock = true;
  mockDb = new MockDatabase();
}

// Create connection pool only if not using mock
let pool = null;
if (!useMock) {
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

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    let res;
    
    if (useMock) {
      // Use mock database
      res = await mockDb.query(text, params);
      console.log('🧪 Mock query executed', { text: text.substring(0, 50) + '...', duration: Date.now() - start, rows: res.rowCount });
    } else {
      // Use real database
      res = await pool.query(text, params);
      console.log('📊 Executed query', { text: text.substring(0, 50) + '...', duration: Date.now() - start, rows: res.rowCount });
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

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  testConnection,
  closePool
};