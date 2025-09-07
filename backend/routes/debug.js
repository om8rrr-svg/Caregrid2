const express = require('express');
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Debug endpoint to test the exact query that's failing
router.get('/clinics-query', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Testing clinics query...');
    
    // Test the exact query from clinics.js
    const result = await query(`
      SELECT 
        c.id, c.name, c.type, c.description, c.address, c.city, c.postcode,
        c.phone, c.email, c.website, c.rating, c.review_count, c.is_premium,
        c.logo_url, c.created_at, c.updated_at, c.frontend_id
       FROM clinics c
       WHERE c.is_active = true OR c.is_active IS NULL
       ORDER BY c.is_premium DESC, c.rating DESC, c.name ASC
       LIMIT 3
    `);
    
    console.log('✅ Query successful! Returned', result.rows.length, 'rows');
    
    res.json({
      success: true,
      message: 'Query test successful',
      data: result.rows,
      rowCount: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Query failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Query test failed',
      error: {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      }
    });
  }
}));

// Test count query
router.get('/clinics-count', asyncHandler(async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) FROM clinics');
    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Test all clinics without is_active filter
router.get('/clinics-all', asyncHandler(async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.id, c.name, c.type, c.is_active, c.rating, c.is_premium
       FROM clinics c
       ORDER BY c.name ASC
    `);
    
    res.json({
      success: true,
      message: 'All clinics query successful',
      data: result.rows,
      rowCount: result.rows.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Debug endpoint to check database connection
router.get('/db-test', asyncHandler(async (req, res) => {
  const result = await query('SELECT NOW() as current_time, version() as db_version');
  res.json({
    success: true,
    timestamp: result.rows[0].current_time,
    database: result.rows[0].db_version
  });
}));

// Debug endpoint to check clinic active status
router.get('/clinic-active-status', asyncHandler(async (req, res) => {
  try {
    // Check clinic is_active statuses
    const statusQuery = `
      SELECT 
        is_active,
        COUNT(*) as count
      FROM clinics 
      GROUP BY is_active
      ORDER BY is_active;
    `;
    
    const statusResult = await query(statusQuery);
    
    // Test the current query condition
    const testQuery = `
      SELECT 
        id, name, is_active
      FROM clinics 
      WHERE (is_active = true OR is_active IS NULL)
      ORDER BY name;
    `;
    
    const testResult = await query(testQuery);
    
    res.json({
      success: true,
      statusBreakdown: statusResult.rows,
      matchingClinics: testResult.rows,
      totalMatching: testResult.rows.length
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Debug endpoint to test the exact clinics query
router.get('/clinic-query-debug', asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Simulate the exact same query logic as the main clinics endpoint
    const whereConditions = [];
    const queryParams = [];
    let paramCount = 1;
    
    // Always filter for active clinics (or null for backwards compatibility)
    whereConditions.push('(c.is_active = true OR c.is_active IS NULL)');
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Test the exact query
    const testQuery = `SELECT 
      c.id, c.name, c.type, c.description, c.address, c.city, c.postcode,
      c.phone, c.email, c.website, c.rating, c.review_count, c.is_premium,
      c.logo_url, c.created_at, c.updated_at, c.frontend_id, c.is_active
     FROM clinics c
     ${whereClause}
     ORDER BY c.is_premium DESC, c.rating DESC, c.name ASC
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    
    const result = await query(testQuery, [...queryParams, limit, offset]);
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM clinics c ${whereClause}`,
      queryParams
    );
    
    res.json({
      success: true,
      debug: {
        whereClause,
        queryParams,
        paramCount,
        limit,
        offset,
        fullQuery: testQuery
      },
      results: result.rows,
      totalCount: parseInt(countResult.rows[0].count),
      resultCount: result.rows.length
    });
    
  } catch (error) {
    console.error('Debug query endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}));

module.exports = router;