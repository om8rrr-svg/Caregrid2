const { query } = require('../config/database');
const emailService = require('./emailService');
const cron = require('node-cron');

class FeatureFlagsService {
  constructor() {
    this.flags = new Map();
    this.experiments = new Map();
    this.userAssignments = new Map();
    this.analytics = {
      flagUsage: new Map(),
      experimentResults: new Map(),
      conversionEvents: new Map()
    };
    this.initialized = false;
  }

  async initialize() {
    try {
      await this.loadFeatureFlags();
      await this.loadExperiments();
      await this.loadUserAssignments();
      this.startAnalyticsCollection();
      this.initialized = true;
      console.log('✅ Feature flags service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize feature flags service:', error);
      throw error;
    }
  }

  async loadFeatureFlags() {
    try {
      const result = await query(`
        SELECT id, name, description, enabled, rollout_percentage, 
               target_audience, conditions, created_at, updated_at
        FROM feature_flags 
        WHERE deleted_at IS NULL
      `);
      
      this.flags.clear();
      result.rows.forEach(flag => {
        this.flags.set(flag.name, {
          id: flag.id,
          name: flag.name,
          description: flag.description,
          enabled: flag.enabled,
          rolloutPercentage: flag.rollout_percentage,
          targetAudience: flag.target_audience || {},
          conditions: flag.conditions || {},
          createdAt: flag.created_at,
          updatedAt: flag.updated_at
        });
      });
      
      console.log(`📊 Loaded ${this.flags.size} feature flags`);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
      // Continue with empty flags in case of database issues
    }
  }

  async loadExperiments() {
    try {
      const result = await query(`
        SELECT id, name, description, feature_flag_id, variants, 
               traffic_allocation, status, start_date, end_date,
               success_metrics, created_at, updated_at
        FROM ab_experiments 
        WHERE deleted_at IS NULL
      `);
      
      this.experiments.clear();
      result.rows.forEach(experiment => {
        this.experiments.set(experiment.name, {
          id: experiment.id,
          name: experiment.name,
          description: experiment.description,
          featureFlagId: experiment.feature_flag_id,
          variants: experiment.variants || [],
          trafficAllocation: experiment.traffic_allocation || 100,
          status: experiment.status,
          startDate: experiment.start_date,
          endDate: experiment.end_date,
          successMetrics: experiment.success_metrics || [],
          createdAt: experiment.created_at,
          updatedAt: experiment.updated_at
        });
      });
      
      console.log(`🧪 Loaded ${this.experiments.size} A/B experiments`);
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  }

  async loadUserAssignments() {
    try {
      const result = await query(`
        SELECT user_id, experiment_name, variant, assigned_at
        FROM user_experiment_assignments
      `);
      
      this.userAssignments.clear();
      result.rows.forEach(assignment => {
        const key = `${assignment.user_id}:${assignment.experiment_name}`;
        this.userAssignments.set(key, {
          userId: assignment.user_id,
          experimentName: assignment.experiment_name,
          variant: assignment.variant,
          assignedAt: assignment.assigned_at
        });
      });
      
      console.log(`👥 Loaded ${this.userAssignments.size} user assignments`);
    } catch (error) {
      console.error('Failed to load user assignments:', error);
    }
  }

  // Check if a feature flag is enabled for a user
  async isFeatureEnabled(flagName, userId, userContext = {}) {
    try {
      const flag = this.flags.get(flagName);
      if (!flag) {
        console.warn(`Feature flag '${flagName}' not found`);
        return false;
      }

      if (!flag.enabled) {
        return false;
      }

      // Check rollout percentage
      const userHash = this.hashUserId(userId, flagName);
      if (userHash > flag.rolloutPercentage) {
        return false;
      }

      // Check target audience conditions
      if (!this.matchesTargetAudience(flag.targetAudience, userContext)) {
        return false;
      }

      // Check additional conditions
      if (!this.evaluateConditions(flag.conditions, userContext)) {
        return false;
      }

      // Track usage
      this.trackFlagUsage(flagName, userId, true);
      return true;
    } catch (error) {
      console.error(`Error checking feature flag '${flagName}':`, error);
      return false;
    }
  }

  // Get experiment variant for a user
  async getExperimentVariant(experimentName, userId, userContext = {}) {
    try {
      const experiment = this.experiments.get(experimentName);
      if (!experiment || experiment.status !== 'active') {
        return null;
      }

      // Check if experiment is within date range
      const now = new Date();
      if (experiment.startDate && now < new Date(experiment.startDate)) {
        return null;
      }
      if (experiment.endDate && now > new Date(experiment.endDate)) {
        return null;
      }

      // Check existing assignment
      const assignmentKey = `${userId}:${experimentName}`;
      const existingAssignment = this.userAssignments.get(assignmentKey);
      if (existingAssignment) {
        this.trackExperimentExposure(experimentName, userId, existingAssignment.variant);
        return existingAssignment.variant;
      }

      // Check traffic allocation
      const userHash = this.hashUserId(userId, experimentName);
      if (userHash > experiment.trafficAllocation) {
        return null;
      }

      // Assign variant
      const variant = this.assignVariant(experiment, userId);
      if (variant) {
        await this.saveUserAssignment(userId, experimentName, variant);
        this.trackExperimentExposure(experimentName, userId, variant);
      }

      return variant;
    } catch (error) {
      console.error(`Error getting experiment variant for '${experimentName}':`, error);
      return null;
    }
  }

  // Create or update a feature flag
  async createFeatureFlag(flagData) {
    try {
      const {
        name,
        description,
        enabled = false,
        rolloutPercentage = 0,
        targetAudience = {},
        conditions = {}
      } = flagData;

      const result = await query(`
        INSERT INTO feature_flags (name, description, enabled, rollout_percentage, target_audience, conditions)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name) DO UPDATE SET
          description = EXCLUDED.description,
          enabled = EXCLUDED.enabled,
          rollout_percentage = EXCLUDED.rollout_percentage,
          target_audience = EXCLUDED.target_audience,
          conditions = EXCLUDED.conditions,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [name, description, enabled, rolloutPercentage, JSON.stringify(targetAudience), JSON.stringify(conditions)]);

      await this.loadFeatureFlags();
      return result.rows[0];
    } catch (error) {
      console.error('Error creating feature flag:', error);
      throw error;
    }
  }

  // Create A/B experiment
  async createExperiment(experimentData) {
    try {
      const {
        name,
        description,
        featureFlagId,
        variants,
        trafficAllocation = 100,
        startDate,
        endDate,
        successMetrics = []
      } = experimentData;

      const result = await query(`
        INSERT INTO ab_experiments (name, description, feature_flag_id, variants, 
                                   traffic_allocation, status, start_date, end_date, success_metrics)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [name, description, featureFlagId, JSON.stringify(variants), trafficAllocation, 
          'draft', startDate, endDate, JSON.stringify(successMetrics)]);

      await this.loadExperiments();
      return result.rows[0];
    } catch (error) {
      console.error('Error creating experiment:', error);
      throw error;
    }
  }

  // Track conversion event
  async trackConversion(userId, eventName, experimentName = null, value = 1) {
    try {
      const timestamp = new Date();
      
      // Store in database
      await query(`
        INSERT INTO conversion_events (user_id, event_name, experiment_name, value, timestamp)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, eventName, experimentName, value, timestamp]);

      // Update in-memory analytics
      const key = experimentName ? `${experimentName}:${eventName}` : eventName;
      if (!this.analytics.conversionEvents.has(key)) {
        this.analytics.conversionEvents.set(key, { count: 0, totalValue: 0 });
      }
      const event = this.analytics.conversionEvents.get(key);
      event.count += 1;
      event.totalValue += value;

      console.log(`📈 Conversion tracked: ${eventName} for user ${userId}`);
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  // Get analytics data
  getAnalytics(experimentName = null) {
    const analytics = {
      flagUsage: Object.fromEntries(this.analytics.flagUsage),
      experimentResults: Object.fromEntries(this.analytics.experimentResults),
      conversionEvents: Object.fromEntries(this.analytics.conversionEvents)
    };

    if (experimentName) {
      // Filter for specific experiment
      const filteredConversions = {};
      for (const [key, value] of this.analytics.conversionEvents.entries()) {
        if (key.startsWith(`${experimentName}:`)) {
          filteredConversions[key] = value;
        }
      }
      analytics.conversionEvents = filteredConversions;
    }

    return analytics;
  }

  // Helper methods
  hashUserId(userId, salt) {
    // Simple hash function for consistent user bucketing
    let hash = 0;
    const str = `${userId}:${salt}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  matchesTargetAudience(targetAudience, userContext) {
    if (!targetAudience || Object.keys(targetAudience).length === 0) {
      return true;
    }

    for (const [key, expectedValue] of Object.entries(targetAudience)) {
      if (userContext[key] !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  evaluateConditions(conditions, userContext) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true;
    }

    // Simple condition evaluation - can be extended
    for (const [key, condition] of Object.entries(conditions)) {
      const userValue = userContext[key];
      if (!this.evaluateCondition(userValue, condition)) {
        return false;
      }
    }
    return true;
  }

  evaluateCondition(userValue, condition) {
    if (typeof condition === 'string' || typeof condition === 'number') {
      return userValue === condition;
    }

    if (condition.operator === 'gt') {
      return userValue > condition.value;
    }
    if (condition.operator === 'lt') {
      return userValue < condition.value;
    }
    if (condition.operator === 'in') {
      return condition.value.includes(userValue);
    }

    return false;
  }

  assignVariant(experiment, userId) {
    if (!experiment.variants || experiment.variants.length === 0) {
      return null;
    }

    const hash = this.hashUserId(userId, experiment.name);
    let cumulativeWeight = 0;
    
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight || (100 / experiment.variants.length);
      if (hash < cumulativeWeight) {
        return variant.name;
      }
    }

    return experiment.variants[0].name; // Fallback
  }

  async saveUserAssignment(userId, experimentName, variant) {
    try {
      await query(`
        INSERT INTO user_experiment_assignments (user_id, experiment_name, variant, assigned_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, experiment_name) DO UPDATE SET
          variant = EXCLUDED.variant,
          assigned_at = EXCLUDED.assigned_at
      `, [userId, experimentName, variant]);

      // Update in-memory cache
      const key = `${userId}:${experimentName}`;
      this.userAssignments.set(key, {
        userId,
        experimentName,
        variant,
        assignedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving user assignment:', error);
    }
  }

  trackFlagUsage(flagName, userId, enabled) {
    const key = `${flagName}:${enabled ? 'enabled' : 'disabled'}`;
    if (!this.analytics.flagUsage.has(key)) {
      this.analytics.flagUsage.set(key, 0);
    }
    this.analytics.flagUsage.set(key, this.analytics.flagUsage.get(key) + 1);
  }

  trackExperimentExposure(experimentName, userId, variant) {
    const key = `${experimentName}:${variant}`;
    if (!this.analytics.experimentResults.has(key)) {
      this.analytics.experimentResults.set(key, { exposures: 0, conversions: 0 });
    }
    const result = this.analytics.experimentResults.get(key);
    result.exposures += 1;
  }

  startAnalyticsCollection() {
    // Aggregate and persist analytics data every hour
    cron.schedule('0 * * * *', async () => {
      try {
        await this.persistAnalytics();
        console.log('📊 Analytics data persisted');
      } catch (error) {
        console.error('Error persisting analytics:', error);
      }
    });
  }

  async persistAnalytics() {
    try {
      const timestamp = new Date();
      
      // Persist flag usage analytics
      for (const [key, count] of this.analytics.flagUsage.entries()) {
        const [flagName, status] = key.split(':');
        await query(`
          INSERT INTO flag_usage_analytics (flag_name, status, count, timestamp)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (flag_name, status, DATE(timestamp)) DO UPDATE SET
            count = flag_usage_analytics.count + EXCLUDED.count
        `, [flagName, status, count, timestamp]);
      }

      // Persist experiment analytics
      for (const [key, data] of this.analytics.experimentResults.entries()) {
        const [experimentName, variant] = key.split(':');
        await query(`
          INSERT INTO experiment_analytics (experiment_name, variant, exposures, conversions, timestamp)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (experiment_name, variant, DATE(timestamp)) DO UPDATE SET
            exposures = experiment_analytics.exposures + EXCLUDED.exposures,
            conversions = experiment_analytics.conversions + EXCLUDED.conversions
        `, [experimentName, variant, data.exposures, data.conversions, timestamp]);
      }

      // Clear in-memory counters after persisting
      this.analytics.flagUsage.clear();
      this.analytics.experimentResults.clear();
    } catch (error) {
      console.error('Error persisting analytics:', error);
    }
  }

  // Get feature flags list
  getFeatureFlags() {
    return Array.from(this.flags.values());
  }

  // Get experiments list
  getExperiments() {
    return Array.from(this.experiments.values());
  }

  // Update feature flag
  async updateFeatureFlag(name, updates) {
    try {
      const flag = this.flags.get(name);
      if (!flag) {
        throw new Error(`Feature flag '${name}' not found`);
      }

      const result = await query(`
        UPDATE feature_flags 
        SET enabled = $2, rollout_percentage = $3, target_audience = $4, 
            conditions = $5, updated_at = CURRENT_TIMESTAMP
        WHERE name = $1
        RETURNING *
      `, [name, updates.enabled ?? flag.enabled, 
          updates.rolloutPercentage ?? flag.rolloutPercentage,
          JSON.stringify(updates.targetAudience ?? flag.targetAudience),
          JSON.stringify(updates.conditions ?? flag.conditions)]);

      await this.loadFeatureFlags();
      return result.rows[0];
    } catch (error) {
      console.error('Error updating feature flag:', error);
      throw error;
    }
  }

  // Update experiment status
  async updateExperimentStatus(name, status) {
    try {
      const result = await query(`
        UPDATE ab_experiments 
        SET status = $2, updated_at = CURRENT_TIMESTAMP
        WHERE name = $1
        RETURNING *
      `, [name, status]);

      await this.loadExperiments();
      return result.rows[0];
    } catch (error) {
      console.error('Error updating experiment status:', error);
      throw error;
    }
  }
}

// Create singleton instance
const featureFlagsService = new FeatureFlagsService();

module.exports = featureFlagsService;