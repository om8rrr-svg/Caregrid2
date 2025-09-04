const express = require('express');
const router = express.Router();
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  executeSyntheticTransaction,
  runAllSyntheticTransactions,
  getSyntheticResults,
  getSyntheticSummary
} = require('../services/synthetic');
const { monitorSyntheticResults, monitorTransactionFailure } = require('../services/alertIntegration');

/**
 * GET /synthetic
 * Get synthetic monitoring overview
 */
router.get('/', async (req, res) => {
  try {
    const summary = getSyntheticSummary();
    const results = getSyntheticResults();
    
    const overviewData = {
      status: 'active',
      timestamp: new Date().toISOString(),
      ...summary
    };
    
    // Monitor synthetic results for alerting
    monitorSyntheticResults({
      summary,
      transactionTypes: Object.values(TRANSACTION_TYPES).map(type => {
        const typeResults = results.history.filter(r => r.type === type);
        const successful = typeResults.filter(r => r.status === TRANSACTION_STATUS.SUCCESS).length;
        const total = typeResults.length;
        return {
          type,
          total,
          successful,
          failed: total - successful,
          successRate: total > 0 ? (successful / total) * 100 : 0
        };
      }),
      recentFailures: results.history.filter(r => r.status !== TRANSACTION_STATUS.SUCCESS && 
        Date.now() - new Date(r.startTime).getTime() < 3600000) // Last hour
    });
    
    res.json(overviewData);
  } catch (error) {
    console.error('Error getting synthetic overview:', error);
    res.status(500).json({
      error: 'Failed to get synthetic monitoring overview',
      message: error.message
    });
  }
});

/**
 * GET /synthetic/results
 * Get detailed synthetic transaction results
 */
router.get('/results', async (req, res) => {
  try {
    const { limit = 50, type, status } = req.query;
    const results = getSyntheticResults();
    
    let filteredHistory = results.history;
    
    // Filter by transaction type
    if (type && Object.values(TRANSACTION_TYPES).includes(type)) {
      filteredHistory = filteredHistory.filter(t => t.type === type);
    }
    
    // Filter by status
    if (status && Object.values(TRANSACTION_STATUS).includes(status)) {
      filteredHistory = filteredHistory.filter(t => t.status === status);
    }
    
    // Limit results
    filteredHistory = filteredHistory.slice(0, parseInt(limit));
    
    res.json({
      timestamp: new Date().toISOString(),
      summary: results.summary,
      config: results.config,
      history: filteredHistory,
      filters: {
        type: type || 'all',
        status: status || 'all',
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting synthetic results:', error);
    res.status(500).json({
      error: 'Failed to get synthetic transaction results',
      message: error.message
    });
  }
});

/**
 * POST /synthetic/run
 * Execute a specific synthetic transaction
 */
router.post('/run', async (req, res) => {
  try {
    const { type, options = {} } = req.body;
    
    if (!type || !Object.values(TRANSACTION_TYPES).includes(type)) {
      return res.status(400).json({
        error: 'Invalid transaction type',
        validTypes: Object.values(TRANSACTION_TYPES)
      });
    }
    
    const result = await executeSyntheticTransaction(type, options);
    
    // Monitor individual transaction result for alerting
    monitorTransactionFailure(result);
    
    res.json({
      message: 'Synthetic transaction executed',
      transaction: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing synthetic transaction:', error);
    res.status(500).json({
      error: 'Failed to execute synthetic transaction',
      message: error.message
    });
  }
});

/**
 * POST /synthetic/run-all
 * Execute all synthetic transactions
 */
router.post('/run-all', async (req, res) => {
  try {
    const results = await runAllSyntheticTransactions();
    
    // Monitor each transaction result for alerting
    results.forEach(result => {
      monitorTransactionFailure(result);
    });
    
    const summary = {
      total: results.length,
      successful: results.filter(r => r.status === TRANSACTION_STATUS.SUCCESS).length,
      failed: results.filter(r => r.status !== TRANSACTION_STATUS.SUCCESS).length,
      averageResponseTime: Math.round(
        results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length
      )
    };
    
    res.json({
      message: 'All synthetic transactions executed',
      summary,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing all synthetic transactions:', error);
    res.status(500).json({
      error: 'Failed to execute all synthetic transactions',
      message: error.message
    });
  }
});

/**
 * GET /synthetic/types
 * Get available transaction types
 */
router.get('/types', (req, res) => {
  try {
    const types = Object.entries(TRANSACTION_TYPES).map(([key, value]) => ({
      key,
      value,
      description: getTransactionDescription(value)
    }));
    
    res.json({
      timestamp: new Date().toISOString(),
      transactionTypes: types,
      statuses: Object.values(TRANSACTION_STATUS)
    });
  } catch (error) {
    console.error('Error getting transaction types:', error);
    res.status(500).json({
      error: 'Failed to get transaction types',
      message: error.message
    });
  }
});

/**
 * GET /synthetic/health
 * Get synthetic monitoring health status
 */
router.get('/health', async (req, res) => {
  try {
    const summary = getSyntheticSummary();
    const recentResults = getSyntheticResults().history.slice(0, 10);
    
    // Determine health status based on recent results
    const recentFailures = recentResults.filter(r => r.status !== TRANSACTION_STATUS.SUCCESS).length;
    const failureRate = recentResults.length > 0 ? (recentFailures / recentResults.length) * 100 : 0;
    
    let healthStatus = 'healthy';
    if (failureRate > 50) {
      healthStatus = 'unhealthy';
    } else if (failureRate > 20) {
      healthStatus = 'degraded';
    }
    
    res.json({
      status: healthStatus,
      timestamp: new Date().toISOString(),
      metrics: {
        totalTransactions: summary.summary.total,
        successRate: summary.summary.successRate,
        averageResponseTime: summary.summary.averageResponseTime,
        recentFailureRate: Math.round(failureRate),
        lastRun: summary.summary.lastRun
      },
      recentResults: recentResults.map(r => ({
        id: r.id,
        type: r.type,
        status: r.status,
        duration: r.duration,
        timestamp: new Date(r.startTime).toISOString()
      }))
    });
  } catch (error) {
    console.error('Error getting synthetic health:', error);
    res.status(500).json({
      error: 'Failed to get synthetic monitoring health',
      message: error.message
    });
  }
});

/**
 * GET /synthetic/transaction/:id
 * Get details of a specific transaction
 */
router.get('/transaction/:id', (req, res) => {
  try {
    const { id } = req.params;
    const results = getSyntheticResults();
    
    const transaction = results.history.find(t => t.id === id);
    
    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
        transactionId: id
      });
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      transaction
    });
  } catch (error) {
    console.error('Error getting transaction details:', error);
    res.status(500).json({
      error: 'Failed to get transaction details',
      message: error.message
    });
  }
});

/**
 * DELETE /synthetic/results
 * Clear synthetic transaction history
 */
router.delete('/results', (req, res) => {
  try {
    const results = getSyntheticResults();
    
    // Clear history but keep summary structure
    results.history.length = 0;
    results.summary = {
      total: 0,
      successful: 0,
      failed: 0,
      averageResponseTime: 0,
      lastRun: null
    };
    
    res.json({
      message: 'Synthetic transaction history cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing synthetic results:', error);
    res.status(500).json({
      error: 'Failed to clear synthetic transaction history',
      message: error.message
    });
  }
});

/**
 * Helper function to get transaction description
 */
function getTransactionDescription(type) {
  const descriptions = {
    [TRANSACTION_TYPES.API_HEALTH]: 'Tests API health endpoints and system status',
    [TRANSACTION_TYPES.USER_LOGIN]: 'Simulates user login flow and authentication',
    [TRANSACTION_TYPES.CLINIC_SEARCH]: 'Tests clinic search functionality and results',
    [TRANSACTION_TYPES.APPOINTMENT_BOOKING]: 'Simulates appointment booking process',
    [TRANSACTION_TYPES.USER_REGISTRATION]: 'Tests user registration and account creation',
    [TRANSACTION_TYPES.CONTACT_FORM]: 'Tests contact form submission and processing'
  };
  
  return descriptions[type] || 'Unknown transaction type';
}

module.exports = router;