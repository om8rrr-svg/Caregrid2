const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');



// Get all feature flags
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM feature_flags ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature flags'
    });
  }
});

// Create new feature flag
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, enabled, rollout_percentage, target_audience, conditions } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Name and description are required'
      });
    }

    const result = await query(
      `INSERT INTO feature_flags (name, description, enabled, rollout_percentage, target_audience, conditions)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, enabled || false, rollout_percentage || 0, target_audience || {}, conditions || {}]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating feature flag:', error);
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        error: 'Feature flag with this name already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create feature flag'
      });
    }
  }
});

// Update feature flag
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, enabled, rollout_percentage, target_audience, conditions } = req.body;

    const result = await query(
      `UPDATE feature_flags 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           enabled = COALESCE($3, enabled),
           rollout_percentage = COALESCE($4, rollout_percentage),
           target_audience = COALESCE($5, target_audience),
           conditions = COALESCE($6, conditions),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [name, description, enabled, rollout_percentage, target_audience, conditions, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Feature flag not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feature flag'
    });
  }
});

// Delete feature flag
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM feature_flags WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Feature flag not found'
      });
    }

    res.json({
      success: true,
      message: 'Feature flag deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete feature flag'
    });
  }
});

// Get all A/B experiments
router.get('/experiments', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM ab_experiments ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch experiments'
    });
  }
});

// Create new A/B experiment
router.post('/experiments', authenticateToken, async (req, res) => {
  try {
    const { name, description, variants, traffic_allocation, start_date, end_date, success_metrics } = req.body;
    
    if (!name || !description || !variants) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, and variants are required'
      });
    }

    const result = await query(
      `INSERT INTO ab_experiments (name, description, variants, traffic_allocation, start_date, end_date, success_metrics)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, variants, traffic_allocation || {}, start_date, end_date, success_metrics || {}]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating experiment:', error);
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        error: 'Experiment with this name already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create experiment'
      });
    }
  }
});

// Get analytics data
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Calculate date range based on timeframe
    let dateFilter = "timestamp >= NOW() - INTERVAL '7 days'";
    if (timeframe === '1d') dateFilter = "timestamp >= NOW() - INTERVAL '1 day'";
    else if (timeframe === '30d') dateFilter = "timestamp >= NOW() - INTERVAL '30 days'";
    else if (timeframe === '90d') dateFilter = "timestamp >= NOW() - INTERVAL '90 days'";

    // Get flag usage analytics
    const flagUsageResult = await query(`
      SELECT 
        flag_name,
        COUNT(*) as usage_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM flag_usage_analytics 
      WHERE ${dateFilter}
      GROUP BY flag_name
      ORDER BY usage_count DESC
    `);

    // Get experiment analytics
    const experimentResult = await query(`
      SELECT 
        experiment_name,
        variant,
        COUNT(*) as participant_count,
        AVG(conversion_rate) as avg_conversion_rate
      FROM experiment_analytics 
      WHERE ${dateFilter}
      GROUP BY experiment_name, variant
      ORDER BY experiment_name, participant_count DESC
    `);

    res.json({
      success: true,
      data: {
        timeframe,
        flag_usage: flagUsageResult.rows,
        experiments: experimentResult.rows,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// Record flag usage (for analytics)
router.post('/usage', async (req, res) => {
  try {
    const { flag_name, user_id, user_properties } = req.body;
    
    if (!flag_name) {
      return res.status(400).json({
        success: false,
        error: 'Flag name is required'
      });
    }

    await pool.query(
      `INSERT INTO flag_usage_analytics (flag_name, user_id, user_properties)
       VALUES ($1, $2, $3)`,
      [flag_name, user_id, user_properties || {}]
    );

    res.json({
      success: true,
      message: 'Usage recorded successfully'
    });
  } catch (error) {
    console.error('Error recording flag usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record usage'
    });
  }
});

module.exports = router;