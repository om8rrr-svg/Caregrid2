-- Feature Flags System Database Schema

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_audience JSONB DEFAULT '{}',
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- A/B experiments table
CREATE TABLE IF NOT EXISTS ab_experiments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    feature_flag_id INTEGER REFERENCES feature_flags(id),
    variants JSONB DEFAULT '[]',
    traffic_allocation INTEGER DEFAULT 100 CHECK (traffic_allocation >= 0 AND traffic_allocation <= 100),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    success_metrics JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- User experiment assignments table
CREATE TABLE IF NOT EXISTS user_experiment_assignments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    experiment_name VARCHAR(255) NOT NULL,
    variant VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, experiment_name)
);

-- Conversion events table
CREATE TABLE IF NOT EXISTS conversion_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    experiment_name VARCHAR(255),
    value DECIMAL(10,2) DEFAULT 1.0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Flag usage analytics table
CREATE TABLE IF NOT EXISTS flag_usage_analytics (
    id SERIAL PRIMARY KEY,
    flag_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'enabled' or 'disabled'
    count INTEGER DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_key DATE DEFAULT CURRENT_DATE,
    UNIQUE(flag_name, status, date_key)
);

-- Experiment analytics table
CREATE TABLE IF NOT EXISTS experiment_analytics (
    id SERIAL PRIMARY KEY,
    experiment_name VARCHAR(255) NOT NULL,
    variant VARCHAR(255) NOT NULL,
    exposures INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_key DATE DEFAULT CURRENT_DATE,
    UNIQUE(experiment_name, variant, date_key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_name ON ab_experiments(name);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON ab_experiments(status);
CREATE INDEX IF NOT EXISTS idx_user_assignments_user_id ON user_experiment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_experiment ON user_experiment_assignments(experiment_name);
CREATE INDEX IF NOT EXISTS idx_conversion_events_user_id ON conversion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_experiment ON conversion_events(experiment_name);
CREATE INDEX IF NOT EXISTS idx_conversion_events_timestamp ON conversion_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_flag_usage_analytics_flag ON flag_usage_analytics(flag_name);
CREATE INDEX IF NOT EXISTS idx_flag_usage_analytics_timestamp ON flag_usage_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_experiment_analytics_experiment ON experiment_analytics(experiment_name);
CREATE INDEX IF NOT EXISTS idx_experiment_analytics_timestamp ON experiment_analytics(timestamp);

-- Insert some sample feature flags for testing
INSERT INTO feature_flags (name, description, enabled, rollout_percentage, target_audience, conditions) VALUES
('new_dashboard_ui', 'New dashboard user interface with improved UX', false, 0, '{}', '{}'),
('enhanced_monitoring', 'Enhanced monitoring capabilities with real-time alerts', true, 25, '{"role": "admin"}', '{}'),
('beta_features', 'Access to beta features for testing', false, 10, '{"plan": "premium"}', '{"account_age_days": {"operator": "gt", "value": 30}}'),
('mobile_app_integration', 'Mobile app integration features', false, 0, '{}', '{}'),
('advanced_analytics', 'Advanced analytics and reporting features', true, 50, '{"role": "manager"}', '{}');

-- Insert sample A/B experiments
INSERT INTO ab_experiments (name, description, feature_flag_id, variants, traffic_allocation, status, start_date, end_date, success_metrics) VALUES
('dashboard_layout_test', 'Test different dashboard layouts for user engagement', 
 (SELECT id FROM feature_flags WHERE name = 'new_dashboard_ui'),
 '[{"name": "control", "weight": 50}, {"name": "variant_a", "weight": 25}, {"name": "variant_b", "weight": 25}]',
 100, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days',
 '["page_views", "time_on_page", "user_engagement"]'),
('monitoring_alerts_test', 'Test different alert notification strategies',
 (SELECT id FROM feature_flags WHERE name = 'enhanced_monitoring'),
 '[{"name": "control", "weight": 50}, {"name": "immediate_alerts", "weight": 50}]',
 50, 'active', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP + INTERVAL '23 days',
 '["alert_response_time", "issue_resolution_time", "user_satisfaction"]');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_experiments_updated_at BEFORE UPDATE ON ab_experiments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();