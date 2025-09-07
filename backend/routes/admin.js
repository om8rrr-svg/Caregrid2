const express = require('express');
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Admin endpoint to fix clinic active status
router.post('/fix-clinic-status', asyncHandler(async (req, res) => {
  try {
    console.log('🔧 Admin: Fixing clinic active status...');
    
    // Check current status
    const statusCheck = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive,
        COUNT(CASE WHEN is_active IS NULL THEN 1 END) as null_status
      FROM clinics
    `);
    
    const beforeStats = statusCheck.rows[0];
    console.log(`📊 Before: ${beforeStats.total} total, ${beforeStats.active} active, ${beforeStats.inactive} inactive, ${beforeStats.null_status} null`);
    
    // Update all clinics to be active
    const updateResult = await query(`
      UPDATE clinics 
      SET is_active = true 
      WHERE is_active IS NULL OR is_active = false
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} clinics to active status`);
    
    // Verify the fix
    const afterCheck = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active
      FROM clinics
    `);
    
    const afterStats = afterCheck.rows[0];
    
    // Test the query that was failing
    const testResult = await query(`
      SELECT COUNT(*) as count
      FROM clinics c
      WHERE c.is_active = true OR c.is_active IS NULL
    `);
    
    res.json({
      success: true,
      message: 'Clinic active status fixed successfully',
      before: {
        total: parseInt(beforeStats.total),
        active: parseInt(beforeStats.active),
        inactive: parseInt(beforeStats.inactive),
        null_status: parseInt(beforeStats.null_status)
      },
      after: {
        total: parseInt(afterStats.total),
        active: parseInt(afterStats.active)
      },
      updated: updateResult.rowCount,
      queryTest: {
        clinicsReturned: parseInt(testResult.rows[0].count)
      }
    });
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
}));

// Admin endpoint to check clinic status
router.get('/clinic-status', asyncHandler(async (req, res) => {
  try {
    const statusCheck = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive,
        COUNT(CASE WHEN is_active IS NULL THEN 1 END) as null_status
      FROM clinics
    `);
    
    const stats = statusCheck.rows[0];
    
    // Test the main query
    const queryTest = await query(`
      SELECT COUNT(*) as count
      FROM clinics c
      WHERE c.is_active = true OR c.is_active IS NULL
    `);
    
    res.json({
      success: true,
      stats: {
        total: parseInt(stats.total),
        active: parseInt(stats.active),
        inactive: parseInt(stats.inactive),
        null_status: parseInt(stats.null_status)
      },
      queryTest: {
        clinicsReturned: parseInt(queryTest.rows[0].count)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

module.exports = router;