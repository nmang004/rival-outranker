-- DATABASE SCHEMA FOR REAL DATA INTEGRATION
-- Rival Outranker - Real Data Source Migration
-- This file contains the complete database schema extensions for storing real data

-- ============================================================================
-- DATA SOURCES MANAGEMENT
-- ============================================================================

-- Core data sources registry
CREATE TABLE IF NOT EXISTS data_sources (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(50) NOT NULL UNIQUE,
    source_type VARCHAR(30) NOT NULL, -- 'api', 'crawler', 'manual', 'hybrid'
    description TEXT,
    base_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 5, -- 1-10, higher = higher priority
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 3600,
    daily_quota INTEGER,
    monthly_quota INTEGER,
    cost_per_request DECIMAL(10,6) DEFAULT 0.00,
    api_key_required BOOLEAN DEFAULT true,
    configuration JSONB, -- Source-specific configuration
    health_check_url VARCHAR(255),
    last_health_check TIMESTAMP,
    health_status VARCHAR(20) DEFAULT 'unknown', -- 'healthy', 'degraded', 'down', 'unknown'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- API usage tracking with enhanced metrics
CREATE TABLE IF NOT EXISTS api_usage_enhanced (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    source_id INTEGER REFERENCES data_sources(id) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_params JSONB,
    response_data JSONB, -- Sanitized response sample
    status_code INTEGER,
    response_time_ms INTEGER,
    data_size_bytes INTEGER,
    actual_cost DECIMAL(10,6),
    estimated_savings DECIMAL(10,6), -- Savings from cache hits
    cache_hit BOOLEAN DEFAULT false,
    cache_source VARCHAR(50), -- 'redis', 'database', 'file'
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES data_sources(id) NOT NULL,
    time_window TIMESTAMP NOT NULL, -- Start of the time window (minute/hour/day)
    window_type VARCHAR(10) NOT NULL, -- 'minute', 'hour', 'day'
    request_count INTEGER DEFAULT 0,
    quota_limit INTEGER NOT NULL,
    is_exceeded BOOLEAN DEFAULT false,
    reset_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(source_id, time_window, window_type)
);

-- ============================================================================
-- KEYWORD RESEARCH & RANK TRACKING ENHANCEMENTS
-- ============================================================================

-- Enhanced keyword data cache with real API data
CREATE TABLE IF NOT EXISTS keyword_data_cache (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    location VARCHAR(50) DEFAULT 'US',
    language VARCHAR(10) DEFAULT 'en',
    search_volume INTEGER,
    search_volume_trend JSONB, -- 12 month trend data
    keyword_difficulty INTEGER, -- 0-100
    cpc_min DECIMAL(8,2),
    cpc_max DECIMAL(8,2),
    cpc_average DECIMAL(8,2),
    competition DECIMAL(3,2), -- 0-1
    competition_level VARCHAR(20), -- 'low', 'medium', 'high'
    seasonal_trends JSONB, -- Monthly seasonality data
    related_keywords JSONB, -- Array of related keyword objects
    questions JSONB, -- People also ask questions
    autocomplete_suggestions JSONB,
    top_competing_domains JSONB,
    serp_features JSONB, -- Featured snippets, local pack, etc.
    source_id INTEGER REFERENCES data_sources(id),
    cached_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    quality_score INTEGER DEFAULT 10, -- 1-10 data quality rating
    INDEX idx_keyword_location (keyword, location),
    INDEX idx_cached_expires (cached_at, expires_at)
);

-- Real-time SERP monitoring and rank tracking
CREATE TABLE IF NOT EXISTS serp_monitoring (
    id SERIAL PRIMARY KEY,
    keyword_id INTEGER REFERENCES keywords(id) NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    target_domain VARCHAR(255) NOT NULL,
    location VARCHAR(50) DEFAULT 'US',
    device VARCHAR(20) DEFAULT 'desktop', -- 'desktop', 'mobile', 'tablet'
    search_engine VARCHAR(20) DEFAULT 'google', -- 'google', 'bing', 'yahoo'
    current_rank INTEGER,
    previous_rank INTEGER,
    rank_change INTEGER,
    best_rank INTEGER, -- Historical best rank
    worst_rank INTEGER, -- Historical worst rank
    page_title TEXT,
    meta_description TEXT,
    displayed_url VARCHAR(500),
    featured_snippet BOOLEAN DEFAULT false,
    featured_snippet_type VARCHAR(50), -- 'paragraph', 'list', 'table', 'video'
    local_pack_position INTEGER,
    local_pack_data JSONB,
    people_also_ask JSONB,
    related_searches JSONB,
    serp_features JSONB, -- All SERP features present
    organic_results_count INTEGER,
    ads_count INTEGER,
    knowledge_panel BOOLEAN DEFAULT false,
    image_pack BOOLEAN DEFAULT false,
    video_results BOOLEAN DEFAULT false,
    news_results BOOLEAN DEFAULT false,
    checked_at TIMESTAMP DEFAULT NOW(),
    user_id TEXT REFERENCES users(id),
    source_id INTEGER REFERENCES data_sources(id),
    INDEX idx_keyword_target (keyword_id, target_url),
    INDEX idx_checked_at (checked_at),
    INDEX idx_user_keyword (user_id, keyword_id)
);

-- Competitor rank tracking with enhanced data
CREATE TABLE IF NOT EXISTS competitor_rank_tracking (
    id SERIAL PRIMARY KEY,
    serp_monitoring_id INTEGER REFERENCES serp_monitoring(id),
    competitor_domain VARCHAR(255) NOT NULL,
    competitor_url VARCHAR(500) NOT NULL,
    rank_position INTEGER,
    page_title TEXT,
    meta_description TEXT,
    displayed_url VARCHAR(500),
    has_ads BOOLEAN DEFAULT false,
    ad_position INTEGER,
    domain_authority INTEGER,
    page_authority INTEGER,
    backlink_count INTEGER,
    estimated_traffic INTEGER,
    content_length INTEGER,
    last_updated TIMESTAMP,
    checked_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_competitor_domain (competitor_domain),
    INDEX idx_serp_competitor (serp_monitoring_id, competitor_domain)
);

-- ============================================================================
-- BACKLINK ANALYSIS ENHANCEMENTS
-- ============================================================================

-- Enhanced backlink profiles with real data sources
CREATE TABLE IF NOT EXISTS backlink_profiles_enhanced (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER REFERENCES backlink_profiles(id) NOT NULL,
    ahrefs_domain_rating INTEGER, -- 0-100 Ahrefs DR
    ahrefs_url_rating INTEGER, -- 0-100 Ahrefs UR
    majestic_trust_flow INTEGER, -- 0-100 Majestic TF
    majestic_citation_flow INTEGER, -- 0-100 Majestic CF
    moz_domain_authority INTEGER, -- 0-100 Moz DA
    moz_page_authority INTEGER, -- 0-100 Moz PA
    total_referring_domains INTEGER,
    total_backlinks INTEGER,
    dofollow_referring_domains INTEGER,
    nofollow_referring_domains INTEGER,
    gov_backlinks INTEGER,
    edu_backlinks INTEGER,
    branded_backlinks INTEGER,
    anchor_text_distribution JSONB,
    top_referring_domains JSONB,
    lost_backlinks_30d INTEGER,
    new_backlinks_30d INTEGER,
    toxic_backlinks INTEGER,
    disavowed_backlinks INTEGER,
    link_velocity_trend JSONB, -- Monthly link acquisition trend
    last_crawled TIMESTAMP,
    next_crawl_scheduled TIMESTAMP,
    data_sources JSONB, -- Which sources provided data
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Detailed backlink records with quality metrics
CREATE TABLE IF NOT EXISTS backlinks_enhanced (
    id SERIAL PRIMARY KEY,
    backlink_id INTEGER REFERENCES backlinks(id) NOT NULL,
    ahrefs_dr INTEGER, -- Domain Rating of referring domain
    ahrefs_ur INTEGER, -- URL Rating of referring page
    majestic_tf INTEGER,
    majestic_cf INTEGER,
    link_quality_score INTEGER, -- 1-100 calculated quality score
    is_toxic BOOLEAN DEFAULT false,
    toxicity_reasons JSONB, -- Array of toxicity indicators
    is_disavowed BOOLEAN DEFAULT false,
    link_context TEXT, -- Surrounding text context
    link_placement VARCHAR(50), -- 'content', 'sidebar', 'footer', 'navigation'
    is_sponsored BOOLEAN DEFAULT false,
    is_ugc BOOLEAN DEFAULT false, -- User Generated Content
    referring_page_traffic INTEGER, -- Estimated monthly traffic
    referring_page_keywords INTEGER, -- Number of ranking keywords
    link_first_seen TIMESTAMP,
    link_last_seen TIMESTAMP,
    monitoring_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
    crawl_status VARCHAR(20) DEFAULT 'active', -- 'active', 'lost', 'redirected', 'error'
    last_crawled TIMESTAMP,
    source_id INTEGER REFERENCES data_sources(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CONTENT ANALYSIS ENHANCEMENTS
-- ============================================================================

-- Enhanced content analysis with AI insights
CREATE TABLE IF NOT EXISTS content_analysis_enhanced (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES analyses(id),
    url VARCHAR(500) NOT NULL,
    content_type VARCHAR(50), -- 'article', 'product', 'homepage', 'category'
    word_count INTEGER,
    character_count INTEGER,
    paragraph_count INTEGER,
    sentence_count INTEGER,
    reading_time_minutes INTEGER,
    flesch_reading_ease DECIMAL(5,2),
    flesch_kincaid_grade DECIMAL(5,2),
    gunning_fog_index DECIMAL(5,2),
    automated_readability_index DECIMAL(5,2),
    content_freshness_score INTEGER, -- 1-100
    topical_authority_score INTEGER, -- 1-100
    semantic_richness_score INTEGER, -- 1-100
    ai_content_score DECIMAL(5,2), -- 0-1 likelihood of AI-generated content
    duplicate_content_percentage DECIMAL(5,2),
    plagiarism_sources JSONB,
    content_gaps JSONB, -- Missing topics compared to competitors
    content_opportunities JSONB, -- Suggested improvements
    sentiment_analysis JSONB, -- Positive/negative/neutral sentiment
    entity_extraction JSONB, -- Named entities and their context
    topic_clusters JSONB, -- Content topic categorization
    internal_link_opportunities JSONB,
    content_optimization_score INTEGER, -- 1-100
    ai_recommendations TEXT,
    openai_analysis_cost DECIMAL(8,6),
    analyzed_at TIMESTAMP DEFAULT NOW(),
    source_id INTEGER REFERENCES data_sources(id)
);

-- Content performance tracking
CREATE TABLE IF NOT EXISTS content_performance (
    id SERIAL PRIMARY KEY,
    content_analysis_id INTEGER REFERENCES content_analysis_enhanced(id),
    url VARCHAR(500) NOT NULL,
    organic_traffic INTEGER,
    organic_keywords INTEGER,
    average_position DECIMAL(5,2),
    click_through_rate DECIMAL(5,4),
    bounce_rate DECIMAL(5,4),
    time_on_page INTEGER, -- seconds
    pages_per_session DECIMAL(4,2),
    conversion_rate DECIMAL(5,4),
    social_shares INTEGER,
    backlinks_acquired INTEGER,
    featured_snippets_count INTEGER,
    top_3_rankings INTEGER,
    top_10_rankings INTEGER,
    measurement_date DATE,
    data_source VARCHAR(50), -- 'google_analytics', 'search_console', 'estimated'
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- COMPETITOR INTELLIGENCE
-- ============================================================================

-- Enhanced competitor profiles
CREATE TABLE IF NOT EXISTS competitor_profiles (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    company_name VARCHAR(255),
    description TEXT,
    industry VARCHAR(100),
    country VARCHAR(50),
    estimated_monthly_traffic INTEGER,
    traffic_trend JSONB, -- 12 month traffic trend
    top_keywords_count INTEGER,
    total_backlinks INTEGER,
    referring_domains INTEGER,
    domain_authority INTEGER,
    organic_keywords INTEGER,
    paid_keywords INTEGER,
    estimated_ad_spend INTEGER,
    technology_stack JSONB, -- CMS, analytics, etc.
    social_media_presence JSONB,
    content_publication_frequency INTEGER, -- posts per month
    top_content_types JSONB,
    target_audience JSONB,
    pricing_strategy VARCHAR(100),
    business_model VARCHAR(100),
    competitive_strength INTEGER, -- 1-100
    threat_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    monitoring_priority INTEGER, -- 1-10
    last_analyzed TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Competitor keyword gaps and opportunities
CREATE TABLE IF NOT EXISTS competitor_keyword_gaps (
    id SERIAL PRIMARY KEY,
    user_domain VARCHAR(255) NOT NULL,
    competitor_domain VARCHAR(255) NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    our_rank INTEGER,
    competitor_rank INTEGER,
    search_volume INTEGER,
    keyword_difficulty INTEGER,
    traffic_potential INTEGER,
    content_gap_score INTEGER, -- 1-100
    opportunity_score INTEGER, -- 1-100
    priority_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    recommended_action VARCHAR(100),
    estimated_effort VARCHAR(50), -- 'low', 'medium', 'high'
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_domain_competitor (user_domain, competitor_domain),
    INDEX idx_opportunity_score (opportunity_score DESC)
);

-- ============================================================================
-- WEB CRAWLING & SITE MONITORING
-- ============================================================================

-- Website crawling sessions
CREATE TABLE IF NOT EXISTS crawl_sessions (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    target_domain VARCHAR(255) NOT NULL,
    crawl_type VARCHAR(50) NOT NULL, -- 'full_audit', 'competitor_analysis', 'content_audit'
    crawl_depth INTEGER DEFAULT 3,
    max_pages INTEGER DEFAULT 100,
    pages_crawled INTEGER DEFAULT 0,
    pages_found INTEGER DEFAULT 0,
    crawl_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'paused'
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    errors_count INTEGER DEFAULT 0,
    warnings_count INTEGER DEFAULT 0,
    robots_txt_url VARCHAR(500),
    sitemap_urls JSONB,
    crawl_settings JSONB,
    user_agent VARCHAR(255),
    respect_robots_txt BOOLEAN DEFAULT true,
    crawl_delay_ms INTEGER DEFAULT 1000,
    concurrent_requests INTEGER DEFAULT 1,
    results_summary JSONB,
    export_formats JSONB, -- Available export formats
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crawled page details
CREATE TABLE IF NOT EXISTS crawled_pages (
    id SERIAL PRIMARY KEY,
    crawl_session_id INTEGER REFERENCES crawl_sessions(id) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    parent_url VARCHAR(1000),
    page_type VARCHAR(50), -- 'homepage', 'category', 'product', 'blog', 'contact'
    http_status INTEGER,
    response_time_ms INTEGER,
    page_size_bytes INTEGER,
    content_type VARCHAR(100),
    title VARCHAR(500),
    meta_description VARCHAR(500),
    h1_text VARCHAR(500),
    canonical_url VARCHAR(1000),
    robots_directive VARCHAR(100),
    lang_attribute VARCHAR(10),
    word_count INTEGER,
    image_count INTEGER,
    internal_links_count INTEGER,
    external_links_count INTEGER,
    structured_data_types JSONB,
    page_depth INTEGER,
    is_indexable BOOLEAN,
    has_errors BOOLEAN DEFAULT false,
    errors JSONB,
    warnings JSONB,
    performance_metrics JSONB,
    content_hash VARCHAR(64), -- For detecting content changes
    last_modified TIMESTAMP,
    crawled_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_session_url (crawl_session_id, url),
    INDEX idx_page_type (page_type),
    INDEX idx_crawled_at (crawled_at)
);

-- ============================================================================
-- MACHINE LEARNING & AI INSIGHTS
-- ============================================================================

-- AI model predictions and insights
CREATE TABLE IF NOT EXISTS ai_insights (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES analyses(id),
    insight_type VARCHAR(50) NOT NULL, -- 'content_optimization', 'keyword_opportunity', 'technical_issue'
    model_name VARCHAR(100),
    model_version VARCHAR(50),
    confidence_score DECIMAL(5,4), -- 0-1
    insight_title VARCHAR(255),
    insight_description TEXT,
    recommended_actions JSONB,
    impact_estimate VARCHAR(50), -- 'low', 'medium', 'high'
    effort_estimate VARCHAR(50), -- 'low', 'medium', 'high'
    priority_score INTEGER, -- 1-100
    supporting_data JSONB,
    model_input JSONB,
    model_output JSONB,
    processing_time_ms INTEGER,
    api_cost DECIMAL(8,6),
    is_actionable BOOLEAN DEFAULT true,
    is_implemented BOOLEAN DEFAULT false,
    implementation_date TIMESTAMP,
    result_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_analysis_type (analysis_id, insight_type),
    INDEX idx_priority_score (priority_score DESC)
);

-- ============================================================================
-- DATA QUALITY & MONITORING
-- ============================================================================

-- Data quality monitoring
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES data_sources(id),
    data_type VARCHAR(50), -- 'keyword_data', 'backlink_data', 'content_data'
    metric_name VARCHAR(100),
    metric_value DECIMAL(10,4),
    threshold_min DECIMAL(10,4),
    threshold_max DECIMAL(10,4),
    is_within_threshold BOOLEAN,
    measurement_date DATE,
    sample_size INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System health monitoring
CREATE TABLE IF NOT EXISTS system_health_checks (
    id SERIAL PRIMARY KEY,
    check_type VARCHAR(50), -- 'api_endpoint', 'database', 'cache', 'crawler'
    target_identifier VARCHAR(255),
    status VARCHAR(20), -- 'healthy', 'degraded', 'down'
    response_time_ms INTEGER,
    error_message TEXT,
    success_rate DECIMAL(5,4), -- Over last hour
    last_success TIMESTAMP,
    last_failure TIMESTAMP,
    consecutive_failures INTEGER DEFAULT 0,
    alert_sent BOOLEAN DEFAULT false,
    checked_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_check_type (check_type),
    INDEX idx_status (status),
    INDEX idx_checked_at (checked_at)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- API usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON api_usage_enhanced(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_source_date ON api_usage_enhanced(source_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_cache_hit ON api_usage_enhanced(cache_hit, created_at);

-- Keyword data cache indexes
CREATE INDEX IF NOT EXISTS idx_keyword_cache_keyword ON keyword_data_cache(keyword);
CREATE INDEX IF NOT EXISTS idx_keyword_cache_expires ON keyword_data_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_keyword_cache_quality ON keyword_data_cache(quality_score DESC);

-- SERP monitoring indexes
CREATE INDEX IF NOT EXISTS idx_serp_keyword_date ON serp_monitoring(keyword, checked_at);
CREATE INDEX IF NOT EXISTS idx_serp_domain_rank ON serp_monitoring(target_domain, current_rank);
CREATE INDEX IF NOT EXISTS idx_serp_rank_change ON serp_monitoring(rank_change, checked_at);

-- Backlink indexes
CREATE INDEX IF NOT EXISTS idx_backlinks_quality ON backlinks_enhanced(link_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_backlinks_toxic ON backlinks_enhanced(is_toxic, created_at);
CREATE INDEX IF NOT EXISTS idx_backlinks_domain ON backlinks_enhanced(last_crawled);

-- Crawling indexes
CREATE INDEX IF NOT EXISTS idx_crawled_pages_status ON crawled_pages(http_status);
CREATE INDEX IF NOT EXISTS idx_crawled_pages_type ON crawled_pages(page_type, crawled_at);
CREATE INDEX IF NOT EXISTS idx_crawled_pages_errors ON crawled_pages(has_errors, crawled_at);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Data source health view
CREATE OR REPLACE VIEW data_source_health AS
SELECT 
    ds.id,
    ds.source_name,
    ds.source_type,
    ds.is_active,
    ds.health_status,
    ds.last_health_check,
    COUNT(aue.id) as total_requests_today,
    AVG(aue.response_time_ms) as avg_response_time,
    SUM(aue.actual_cost) as total_cost_today,
    COUNT(CASE WHEN aue.status_code >= 400 THEN 1 END) as error_count_today
FROM data_sources ds
LEFT JOIN api_usage_enhanced aue ON ds.id = aue.source_id 
    AND aue.created_at >= CURRENT_DATE
GROUP BY ds.id, ds.source_name, ds.source_type, ds.is_active, ds.health_status, ds.last_health_check;

-- Keyword performance view
CREATE OR REPLACE VIEW keyword_performance_summary AS
SELECT 
    k.id,
    k.keyword,
    k.target_url,
    k.user_id,
    sm.current_rank,
    sm.previous_rank,
    sm.rank_change,
    sm.best_rank,
    kdc.search_volume,
    kdc.keyword_difficulty,
    kdc.competition,
    sm.checked_at as last_rank_check
FROM keywords k
LEFT JOIN serp_monitoring sm ON k.id = sm.keyword_id
LEFT JOIN keyword_data_cache kdc ON k.keyword = kdc.keyword
WHERE k.is_active = true;

-- Competitor analysis view
CREATE OR REPLACE VIEW competitor_intelligence AS
SELECT 
    cp.domain,
    cp.company_name,
    cp.estimated_monthly_traffic,
    cp.domain_authority,
    COUNT(ckg.id) as keyword_gaps,
    AVG(ckg.opportunity_score) as avg_opportunity_score,
    cp.threat_level,
    cp.last_analyzed
FROM competitor_profiles cp
LEFT JOIN competitor_keyword_gaps ckg ON cp.domain = ckg.competitor_domain
GROUP BY cp.domain, cp.company_name, cp.estimated_monthly_traffic, 
         cp.domain_authority, cp.threat_level, cp.last_analyzed;

-- ============================================================================
-- TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Update data source health status based on API usage
CREATE OR REPLACE FUNCTION update_data_source_health()
RETURNS TRIGGER AS $$
BEGIN
    -- Update health status based on recent error rates
    UPDATE data_sources 
    SET health_status = CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM api_usage_enhanced 
            WHERE source_id = NEW.source_id 
            AND created_at >= NOW() - INTERVAL '5 minutes'
            AND status_code >= 400
        ) >= 5 THEN 'down'
        WHEN (
            SELECT AVG(response_time_ms) 
            FROM api_usage_enhanced 
            WHERE source_id = NEW.source_id 
            AND created_at >= NOW() - INTERVAL '15 minutes'
        ) > 10000 THEN 'degraded'
        ELSE 'healthy'
    END,
    last_health_check = NOW()
    WHERE id = NEW.source_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_data_source_health
AFTER INSERT ON api_usage_enhanced
FOR EACH ROW
EXECUTE FUNCTION update_data_source_health();

-- Auto-expire cached data
CREATE OR REPLACE FUNCTION auto_expire_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Set expiration based on data type and quality
    NEW.expires_at = CASE 
        WHEN NEW.quality_score >= 8 THEN NOW() + INTERVAL '7 days'
        WHEN NEW.quality_score >= 5 THEN NOW() + INTERVAL '3 days'
        ELSE NOW() + INTERVAL '1 day'
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire_cache
BEFORE INSERT ON keyword_data_cache
FOR EACH ROW
EXECUTE FUNCTION auto_expire_cache();

-- ============================================================================
-- SAMPLE DATA INSERTS
-- ============================================================================

-- Insert core data sources
INSERT INTO data_sources (source_name, source_type, description, priority, rate_limit_per_minute, daily_quota, cost_per_request) VALUES
('dataforseo', 'api', 'DataForSEO API for keyword research and SERP data', 9, 100, 10000, 0.002),
('google_search_console', 'api', 'Google Search Console API for website performance data', 10, 30, 1000, 0.000),
('ahrefs', 'api', 'Ahrefs API for backlink analysis', 8, 50, 5000, 0.005),
('majestic', 'api', 'Majestic API for backlink metrics', 7, 40, 3000, 0.003),
('openai', 'api', 'OpenAI API for content analysis', 6, 60, 2000, 0.020),
('internal_crawler', 'crawler', 'Internal web crawler for competitor analysis', 5, 120, 50000, 0.001),
('google_pagespeed', 'api', 'Google PageSpeed Insights API', 8, 25, 1000, 0.000),
('similarweb', 'api', 'SimilarWeb API for competitor intelligence', 6, 20, 500, 0.050);

-- Insert sample data quality thresholds
INSERT INTO data_quality_metrics (source_id, data_type, metric_name, threshold_min, threshold_max) VALUES
(1, 'keyword_data', 'response_time_ms', 0, 5000),
(1, 'keyword_data', 'accuracy_percentage', 95, 100),
(1, 'keyword_data', 'completeness_percentage', 90, 100),
(3, 'backlink_data', 'freshness_days', 0, 7),
(3, 'backlink_data', 'accuracy_percentage', 85, 100);

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE data_sources IS 'Registry of all external and internal data sources used by the platform';
COMMENT ON TABLE api_usage_enhanced IS 'Enhanced tracking of all API calls with cost monitoring and performance metrics';
COMMENT ON TABLE keyword_data_cache IS 'Cached keyword research data from various APIs with quality scoring';
COMMENT ON TABLE serp_monitoring IS 'Real-time search engine results monitoring for rank tracking';
COMMENT ON TABLE competitor_profiles IS 'Comprehensive competitor intelligence profiles';
COMMENT ON TABLE crawl_sessions IS 'Website crawling sessions for competitor analysis and audits';
COMMENT ON TABLE ai_insights IS 'AI-generated insights and recommendations from analysis data';
COMMENT ON TABLE data_quality_metrics IS 'Data quality monitoring and threshold management';

-- Add comments for key columns
COMMENT ON COLUMN keyword_data_cache.quality_score IS 'Data quality score (1-10) based on source reliability and data completeness';
COMMENT ON COLUMN serp_monitoring.featured_snippet IS 'Whether the target URL appears in a featured snippet for this keyword';
COMMENT ON COLUMN ai_insights.confidence_score IS 'AI model confidence in the insight (0-1)';
COMMENT ON COLUMN data_sources.priority IS 'Source priority for fallback scenarios (1-10, higher = higher priority)';

-- ============================================================================
-- GRANTS & PERMISSIONS
-- ============================================================================

-- Grant appropriate permissions (adjust role names as needed)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================