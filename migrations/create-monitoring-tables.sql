-- Migration: Create monitoring and metrics tables
-- Created: 2025-06-18
-- Description: Add comprehensive monitoring infrastructure for system metrics, business metrics, alerts, and configuration

-- System Metrics Table - stores historical system performance metrics
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Performance Metrics
    avg_response_time REAL NOT NULL,
    error_rate DOUBLE PRECISION NOT NULL,
    memory_usage REAL NOT NULL,
    cpu_usage REAL NOT NULL,
    disk_usage REAL NOT NULL,
    
    -- System Activity
    active_users INTEGER NOT NULL,
    audits_in_progress INTEGER NOT NULL,
    total_requests INTEGER NOT NULL,
    successful_requests INTEGER NOT NULL,
    failed_requests INTEGER NOT NULL,
    
    -- Database Metrics
    db_connections INTEGER NOT NULL,
    db_response_time REAL NOT NULL,
    db_query_count INTEGER NOT NULL,
    
    -- External API Metrics
    openai_calls INTEGER DEFAULT 0,
    openai_success_rate REAL DEFAULT 1.0,
    dataforseo_calls INTEGER DEFAULT 0,
    dataforseo_success_rate REAL DEFAULT 1.0,
    google_api_calls INTEGER DEFAULT 0,
    google_api_success_rate REAL DEFAULT 1.0,
    
    -- Additional metrics as JSON for flexibility
    additional_metrics JSONB
);

-- Business Metrics Table - stores business KPIs and analytics
CREATE TABLE IF NOT EXISTS business_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    date_key VARCHAR(10) NOT NULL, -- YYYY-MM-DD for daily aggregation
    
    -- Audit Metrics
    total_audits INTEGER NOT NULL,
    successful_audits INTEGER NOT NULL,
    failed_audits INTEGER NOT NULL,
    avg_audit_time REAL NOT NULL, -- seconds
    
    -- User Metrics
    active_users INTEGER NOT NULL,
    new_users INTEGER NOT NULL,
    returning_users INTEGER NOT NULL,
    user_satisfaction REAL DEFAULT 0, -- 0-5 rating
    
    -- Revenue & Cost Metrics
    estimated_revenue REAL DEFAULT 0,
    api_costs REAL DEFAULT 0,
    
    -- Feature Usage
    basic_analysis_count INTEGER DEFAULT 0,
    deep_analysis_count INTEGER DEFAULT 0,
    audit_count INTEGER DEFAULT 0,
    chatbot_usage INTEGER DEFAULT 0,
    
    -- Quality Metrics
    avg_priority_accuracy REAL DEFAULT 0, -- 0-1
    template_issue_detection_rate REAL DEFAULT 0, -- 0-1
    
    -- Additional business metrics as JSON
    additional_metrics JSONB
);

-- Alert History Table - stores all alerts for analysis and trending
CREATE TABLE IF NOT EXISTS alert_history (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- error, warning, info
    severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
    category VARCHAR(100) NOT NULL, -- system, database, api, business
    source VARCHAR(100) NOT NULL, -- component that generated the alert
    
    message TEXT NOT NULL,
    description TEXT,
    
    -- Alert lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    
    -- Alert context
    affected_components JSONB, -- list of affected system components
    trigger_metrics JSONB, -- metrics that triggered the alert
    resolution_actions JSONB, -- actions taken to resolve
    
    -- Notification tracking
    notifications_sent JSONB, -- which channels were notified
    escalation_level INTEGER DEFAULT 0,
    
    -- Additional alert data
    metadata JSONB
);

-- Performance Thresholds Table - configurable performance thresholds
CREATE TABLE IF NOT EXISTS performance_thresholds (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL UNIQUE,
    
    -- Threshold levels
    good_threshold REAL NOT NULL,
    warning_threshold REAL NOT NULL,
    critical_threshold REAL NOT NULL,
    
    -- Threshold metadata
    unit VARCHAR(20) NOT NULL, -- ms, %, count, etc.
    description TEXT,
    category VARCHAR(50) NOT NULL, -- system, business, quality
    
    -- Configuration
    is_enabled BOOLEAN DEFAULT TRUE,
    alert_on_breach BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Monitoring Configuration Table - system monitoring settings
CREATE TABLE IF NOT EXISTS monitoring_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- string, number, boolean, json
    category VARCHAR(50) NOT NULL, -- alerts, metrics, dashboards
    description TEXT,
    
    -- Configuration metadata
    is_secret BOOLEAN DEFAULT FALSE, -- for sensitive config values
    requires_restart BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_metrics_error_rate ON system_metrics(error_rate);

CREATE INDEX IF NOT EXISTS idx_business_metrics_date ON business_metrics(date_key);
CREATE INDEX IF NOT EXISTS idx_business_metrics_timestamp ON business_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_alert_history_created ON alert_history(created_at);
CREATE INDEX IF NOT EXISTS idx_alert_history_severity ON alert_history(severity);
CREATE INDEX IF NOT EXISTS idx_alert_history_category ON alert_history(category);
CREATE INDEX IF NOT EXISTS idx_alert_history_resolved ON alert_history(resolved_at);

-- Insert default performance thresholds
INSERT INTO performance_thresholds (metric_name, good_threshold, warning_threshold, critical_threshold, unit, category, description) 
VALUES 
    ('response_time', 200, 500, 1000, 'ms', 'system', 'Average API response time'),
    ('error_rate', 0.01, 0.05, 0.1, '%', 'system', 'Request error rate'),
    ('memory_usage', 70, 85, 95, '%', 'system', 'System memory utilization'),
    ('cpu_usage', 70, 85, 95, '%', 'system', 'CPU utilization'),
    ('disk_usage', 80, 90, 95, '%', 'system', 'Disk space utilization'),
    ('audit_success_rate', 0.95, 0.90, 0.80, '%', 'business', 'Audit completion success rate'),
    ('user_satisfaction', 4.0, 3.5, 3.0, 'rating', 'business', 'Average user satisfaction rating'),
    ('db_response_time', 50, 100, 200, 'ms', 'system', 'Database query response time')
ON CONFLICT (metric_name) DO NOTHING;

-- Insert default monitoring configuration
INSERT INTO monitoring_config (key, value, type, category, description)
VALUES 
    ('metrics_collection_interval', '60000', 'number', 'metrics', 'Metrics collection interval in milliseconds'),
    ('alert_notification_enabled', 'true', 'boolean', 'alerts', 'Enable alert notifications'),
    ('alert_email_recipients', '[]', 'json', 'alerts', 'List of email recipients for alerts'),
    ('dashboard_refresh_interval', '30000', 'number', 'dashboards', 'Dashboard auto-refresh interval in milliseconds'),
    ('system_metrics_retention_days', '30', 'number', 'metrics', 'System metrics retention period in days'),
    ('business_metrics_retention_days', '365', 'number', 'metrics', 'Business metrics retention period in days'),
    ('alert_history_retention_days', '90', 'number', 'alerts', 'Alert history retention period in days'),
    ('enable_performance_monitoring', 'true', 'boolean', 'monitoring', 'Enable performance monitoring'),
    ('enable_business_analytics', 'true', 'boolean', 'monitoring', 'Enable business analytics collection')
ON CONFLICT (key) DO NOTHING;

-- Add comments to tables
COMMENT ON TABLE system_metrics IS 'Historical system performance and resource utilization metrics';
COMMENT ON TABLE business_metrics IS 'Daily business KPIs and operational analytics';
COMMENT ON TABLE alert_history IS 'Complete history of system alerts and their resolution';
COMMENT ON TABLE performance_thresholds IS 'Configurable thresholds for performance monitoring';
COMMENT ON TABLE monitoring_config IS 'System monitoring configuration and settings';