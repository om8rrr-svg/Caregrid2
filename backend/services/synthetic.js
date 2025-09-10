const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Synthetic transaction types
const TRANSACTION_TYPES = {
  API_HEALTH: 'api_health',
  USER_LOGIN: 'user_login',
  CLINIC_SEARCH: 'clinic_search',
  APPOINTMENT_BOOKING: 'appointment_booking',
  USER_REGISTRATION: 'user_registration',
  CONTACT_FORM: 'contact_form'
};

// Transaction status
const TRANSACTION_STATUS = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  TIMEOUT: 'timeout',
  ERROR: 'error'
};

// Storage for synthetic transaction results
let transactionResults = {
  history: [],
  summary: {
    total: 0,
    successful: 0,
    failed: 0,
    averageResponseTime: 0,
    lastRun: null
  }
};

// Configuration for synthetic transactions
const config = {
  baseUrl: null, // No longer needed - using Supabase directly
  timeout: 30000, // 30 seconds
  retries: 3,
  interval: 300000, // 5 minutes
  maxHistorySize: 1000
};

/**
 * Execute a synthetic transaction
 * @param {string} type - Transaction type
 * @param {Object} options - Transaction options
 * @returns {Object} Transaction result
 */
async function executeSyntheticTransaction(type, options = {}) {
  const startTime = Date.now();
  const transactionId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const transaction = {
    id: transactionId,
    type,
    startTime,
    endTime: null,
    duration: null,
    status: TRANSACTION_STATUS.ERROR,
    steps: [],
    error: null,
    metadata: options.metadata || {}
  };

  try {
    switch (type) {
      case TRANSACTION_TYPES.API_HEALTH:
        await executeApiHealthCheck(transaction);
        break;
      case TRANSACTION_TYPES.USER_LOGIN:
        await executeUserLogin(transaction, options);
        break;
      case TRANSACTION_TYPES.CLINIC_SEARCH:
        await executeClinicSearch(transaction, options);
        break;
      case TRANSACTION_TYPES.APPOINTMENT_BOOKING:
        await executeAppointmentBooking(transaction, options);
        break;
      case TRANSACTION_TYPES.USER_REGISTRATION:
        await executeUserRegistration(transaction, options);
        break;
      case TRANSACTION_TYPES.CONTACT_FORM:
        await executeContactForm(transaction, options);
        break;
      default:
        throw new Error(`Unknown transaction type: ${type}`);
    }

    transaction.status = TRANSACTION_STATUS.SUCCESS;
  } catch (error) {
    transaction.status = TRANSACTION_STATUS.FAILURE;
    transaction.error = {
      message: error.message,
      stack: error.stack,
      code: error.code || 'UNKNOWN'
    };
  }

  transaction.endTime = Date.now();
  transaction.duration = transaction.endTime - transaction.startTime;

  // Store transaction result
  storeTransactionResult(transaction);

  return transaction;
}

/**
 * Execute API health check transaction
 */
async function executeApiHealthCheck(transaction) {
  const steps = [
    { name: 'health_check', url: '/health' },
    { name: 'detailed_health', url: '/health/detailed' },
    { name: 'database_health', url: '/health/database' },
    { name: 'dependencies_health', url: '/health/dependencies' }
  ];

  for (const step of steps) {
    const stepStart = Date.now();
    try {
      const response = await axios.get(`${config.baseUrl}${step.url}`, {
        timeout: config.timeout,
        validateStatus: (status) => status < 500
      });

      transaction.steps.push({
        name: step.name,
        status: 'success',
        duration: Date.now() - stepStart,
        statusCode: response.status,
        responseSize: JSON.stringify(response.data).length
      });
    } catch (error) {
      transaction.steps.push({
        name: step.name,
        status: 'failure',
        duration: Date.now() - stepStart,
        error: error.message
      });
      throw error;
    }
  }
}

/**
 * Execute user login transaction
 */
async function executeUserLogin(transaction, options) {
  const testUser = options.testUser || {
    email: 'test@caregrid.com',
    password: 'TestPassword123!'
  };

  // Step 1: Get login page
  const step1Start = Date.now();
  try {
    const loginPageResponse = await axios.get(`${config.baseUrl}/auth/login`, {
      timeout: config.timeout
    });

    transaction.steps.push({
      name: 'get_login_page',
      status: 'success',
      duration: Date.now() - step1Start,
      statusCode: loginPageResponse.status
    });
  } catch (error) {
    transaction.steps.push({
      name: 'get_login_page',
      status: 'failure',
      duration: Date.now() - step1Start,
      error: error.message
    });
    throw error;
  }

  // Step 2: Attempt login
  const step2Start = Date.now();
  try {
    const loginResponse = await axios.post(`${config.baseUrl}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    }, {
      timeout: config.timeout,
      validateStatus: (status) => status < 500
    });

    transaction.steps.push({
      name: 'login_attempt',
      status: loginResponse.status === 200 ? 'success' : 'failure',
      duration: Date.now() - step2Start,
      statusCode: loginResponse.status,
      hasToken: !!(loginResponse.data && loginResponse.data.token)
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }
  } catch (error) {
    transaction.steps.push({
      name: 'login_attempt',
      status: 'failure',
      duration: Date.now() - step2Start,
      error: error.message
    });
    throw error;
  }
}

/**
 * Execute clinic search transaction
 */
async function executeClinicSearch(transaction, options) {
  const searchQuery = options.searchQuery || 'dental';
  const location = options.location || 'London';

  // Step 1: Search clinics
  const step1Start = Date.now();
  try {
    const searchResponse = await axios.get(`${config.baseUrl}/api/clinics/search`, {
      params: {
        q: searchQuery,
        location: location,
        limit: 10
      },
      timeout: config.timeout
    });

    transaction.steps.push({
      name: 'clinic_search',
      status: 'success',
      duration: Date.now() - step1Start,
      statusCode: searchResponse.status,
      resultCount: searchResponse.data?.clinics?.length || 0
    });

    if (!searchResponse.data?.clinics?.length) {
      throw new Error('No clinics found in search results');
    }
  } catch (error) {
    transaction.steps.push({
      name: 'clinic_search',
      status: 'failure',
      duration: Date.now() - step1Start,
      error: error.message
    });
    throw error;
  }
}

/**
 * Execute appointment booking transaction
 */
async function executeAppointmentBooking(transaction, options) {
  const bookingData = options.bookingData || {
    clinicId: 'test-clinic-id',
    serviceType: 'consultation',
    preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    patientName: 'Test Patient',
    patientEmail: 'test.patient@example.com',
    patientPhone: '+44123456789'
  };

  // Step 1: Get available slots
  const step1Start = Date.now();
  try {
    const slotsResponse = await axios.get(`${config.baseUrl}/api/appointments/slots`, {
      params: {
        clinicId: bookingData.clinicId,
        date: bookingData.preferredDate
      },
      timeout: config.timeout
    });

    transaction.steps.push({
      name: 'get_available_slots',
      status: 'success',
      duration: Date.now() - step1Start,
      statusCode: slotsResponse.status,
      availableSlots: slotsResponse.data?.slots?.length || 0
    });
  } catch (error) {
    transaction.steps.push({
      name: 'get_available_slots',
      status: 'failure',
      duration: Date.now() - step1Start,
      error: error.message
    });
    throw error;
  }

  // Step 2: Create booking (simulation)
  const step2Start = Date.now();
  try {
    const bookingResponse = await axios.post(`${config.baseUrl}/api/appointments/book`, bookingData, {
      timeout: config.timeout,
      validateStatus: (status) => status < 500
    });

    transaction.steps.push({
      name: 'create_booking',
      status: bookingResponse.status === 201 ? 'success' : 'failure',
      duration: Date.now() - step2Start,
      statusCode: bookingResponse.status,
      bookingId: bookingResponse.data?.bookingId
    });
  } catch (error) {
    transaction.steps.push({
      name: 'create_booking',
      status: 'failure',
      duration: Date.now() - step2Start,
      error: error.message
    });
    throw error;
  }
}

/**
 * Execute user registration transaction
 */
async function executeUserRegistration(transaction, options) {
  const userData = options.userData || {
    email: `test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: '+44123456789'
  };

  const step1Start = Date.now();
  try {
    const registrationResponse = await axios.post(`${config.baseUrl}/api/auth/register`, userData, {
      timeout: config.timeout,
      validateStatus: (status) => status < 500
    });

    transaction.steps.push({
      name: 'user_registration',
      status: registrationResponse.status === 201 ? 'success' : 'failure',
      duration: Date.now() - step1Start,
      statusCode: registrationResponse.status,
      userId: registrationResponse.data?.user?.id
    });

    if (registrationResponse.status !== 201) {
      throw new Error(`Registration failed with status ${registrationResponse.status}`);
    }
  } catch (error) {
    transaction.steps.push({
      name: 'user_registration',
      status: 'failure',
      duration: Date.now() - step1Start,
      error: error.message
    });
    throw error;
  }
}

/**
 * Execute contact form transaction
 */
async function executeContactForm(transaction, options) {
  const contactData = options.contactData || {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Synthetic Test',
    message: 'This is a synthetic transaction test message.'
  };

  const step1Start = Date.now();
  try {
    const contactResponse = await axios.post(`${config.baseUrl}/api/contact`, contactData, {
      timeout: config.timeout,
      validateStatus: (status) => status < 500
    });

    transaction.steps.push({
      name: 'contact_form_submission',
      status: contactResponse.status === 200 ? 'success' : 'failure',
      duration: Date.now() - step1Start,
      statusCode: contactResponse.status,
      messageId: contactResponse.data?.messageId
    });

    if (contactResponse.status !== 200) {
      throw new Error(`Contact form submission failed with status ${contactResponse.status}`);
    }
  } catch (error) {
    transaction.steps.push({
      name: 'contact_form_submission',
      status: 'failure',
      duration: Date.now() - step1Start,
      error: error.message
    });
    throw error;
  }
}

/**
 * Store transaction result
 */
function storeTransactionResult(transaction) {
  // Add to history
  transactionResults.history.unshift(transaction);

  // Limit history size
  if (transactionResults.history.length > config.maxHistorySize) {
    transactionResults.history = transactionResults.history.slice(0, config.maxHistorySize);
  }

  // Update summary
  transactionResults.summary.total++;
  if (transaction.status === TRANSACTION_STATUS.SUCCESS) {
    transactionResults.summary.successful++;
  } else {
    transactionResults.summary.failed++;
  }

  // Calculate average response time
  const totalDuration = transactionResults.history.reduce((sum, t) => sum + (t.duration || 0), 0);
  transactionResults.summary.averageResponseTime = Math.round(totalDuration / transactionResults.history.length);
  transactionResults.summary.lastRun = new Date().toISOString();
}

/**
 * Run all synthetic transactions
 */
async function runAllSyntheticTransactions() {
  const results = [];

  for (const type of Object.values(TRANSACTION_TYPES)) {
    try {
      const result = await executeSyntheticTransaction(type);
      results.push(result);
    } catch (error) {
      console.error(`Failed to execute synthetic transaction ${type}:`, error.message);
      results.push({
        type,
        status: TRANSACTION_STATUS.ERROR,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  return results;
}

/**
 * Get synthetic transaction results
 */
function getSyntheticResults() {
  return {
    ...transactionResults,
    config: {
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      interval: config.interval
    }
  };
}

/**
 * Get synthetic transaction summary
 */
function getSyntheticSummary() {
  const recentResults = transactionResults.history.slice(0, 50);
  const successRate = transactionResults.summary.total > 0
    ? Math.round((transactionResults.summary.successful / transactionResults.summary.total) * 100)
    : 0;

  return {
    summary: {
      ...transactionResults.summary,
      successRate
    },
    recentFailures: recentResults.filter(t => t.status !== TRANSACTION_STATUS.SUCCESS).slice(0, 10),
    transactionTypes: Object.values(TRANSACTION_TYPES).map(type => {
      const typeResults = recentResults.filter(t => t.type === type);
      const typeSuccessful = typeResults.filter(t => t.status === TRANSACTION_STATUS.SUCCESS).length;
      return {
        type,
        total: typeResults.length,
        successful: typeSuccessful,
        successRate: typeResults.length > 0 ? Math.round((typeSuccessful / typeResults.length) * 100) : 0,
        averageResponseTime: typeResults.length > 0
          ? Math.round(typeResults.reduce((sum, t) => sum + (t.duration || 0), 0) / typeResults.length)
          : 0
      };
    })
  };
}

module.exports = {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  executeSyntheticTransaction,
  runAllSyntheticTransactions,
  getSyntheticResults,
  getSyntheticSummary,
  config
};
