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
    // Check all clinics and their is_active status
    const allClinics = await query(`
      SELECT id, name, is_active, created_at
      FROM clinics 
      ORDER BY created_at DESC
    `);
    
    // Count by status
    const statusCount = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_true,
        COUNT(CASE WHEN is_active = false THEN 1 END) as active_false,
        COUNT(CASE WHEN is_active IS NULL THEN 1 END) as active_null
      FROM clinics
    `);
    
    // Test the current query condition
    const currentQuery = await query(`
      SELECT COUNT(*) as matching_count
      FROM clinics c
      WHERE (c.is_active = true OR c.is_active IS NULL)
    `);
    
    res.json({
      success: true,
      allClinics: allClinics.rows,
      statusCounts: statusCount.rows[0],
      currentQueryMatches: currentQuery.rows[0].matching_count
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

module.exports = router;