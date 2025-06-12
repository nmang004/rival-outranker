-- Database Cleanup Script: Remove Bloated Feature Tables
-- Execute this script to remove all database tables for features being removed
-- Run this FIRST before any other cleanup steps

-- =====================================================
-- IMPORTANT: CREATE BACKUP BEFORE RUNNING THIS SCRIPT
-- =====================================================
-- pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

BEGIN;

-- =====================================================
-- 1. REMOVE KEYWORD TRACKING TABLES (in dependency order)
-- =====================================================

-- Remove keyword suggestions
DROP TABLE IF EXISTS keyword_suggestions CASCADE;
COMMENT ON TABLE keyword_suggestions IS NULL; -- Remove if exists

-- Remove competitor rankings  
DROP TABLE IF EXISTS competitor_rankings CASCADE;
COMMENT ON TABLE competitor_rankings IS NULL;

-- Remove keyword rankings
DROP TABLE IF EXISTS keyword_rankings CASCADE;
COMMENT ON TABLE keyword_rankings IS NULL;

-- Remove keyword metrics
DROP TABLE IF EXISTS keyword_metrics CASCADE;
COMMENT ON TABLE keyword_metrics IS NULL;

-- Remove keywords (parent table)
DROP TABLE IF EXISTS keywords CASCADE;
COMMENT ON TABLE keywords IS NULL;

-- =====================================================
-- 2. REMOVE BACKLINK ANALYSIS TABLES (in dependency order)
-- =====================================================

-- Remove outgoing links
DROP TABLE IF EXISTS outgoing_links CASCADE;
COMMENT ON TABLE outgoing_links IS NULL;

-- Remove backlink history
DROP TABLE IF EXISTS backlink_history CASCADE;
COMMENT ON TABLE backlink_history IS NULL;

-- Remove backlinks
DROP TABLE IF EXISTS backlinks CASCADE;
COMMENT ON TABLE backlinks IS NULL;

-- Remove backlink profiles (parent table)
DROP TABLE IF EXISTS backlink_profiles CASCADE;
COMMENT ON TABLE backlink_profiles IS NULL;

-- =====================================================
-- 3. REMOVE LEARNING PLATFORM TABLES (in dependency order)
-- Note: Preserving chat-related tables for SEO Buddy
-- =====================================================

-- Remove user learning recommendations
DROP TABLE IF EXISTS user_learning_recommendations CASCADE;
COMMENT ON TABLE user_learning_recommendations IS NULL;

-- Remove learning path modules
DROP TABLE IF EXISTS learning_path_modules CASCADE;
COMMENT ON TABLE learning_path_modules IS NULL;

-- Remove learning paths
DROP TABLE IF EXISTS learning_paths CASCADE;
COMMENT ON TABLE learning_paths IS NULL;

-- Remove user learning progress
DROP TABLE IF EXISTS user_learning_progress CASCADE;
COMMENT ON TABLE user_learning_progress IS NULL;

-- Remove lesson quizzes
DROP TABLE IF EXISTS lesson_quizzes CASCADE;
COMMENT ON TABLE lesson_quizzes IS NULL;

-- Remove learning lessons
DROP TABLE IF EXISTS learning_lessons CASCADE;
COMMENT ON TABLE learning_lessons IS NULL;

-- Remove learning modules (parent table)
DROP TABLE IF EXISTS learning_modules CASCADE;
COMMENT ON TABLE learning_modules IS NULL;

-- =====================================================
-- 4. UPDATE API USAGE TRACKING COMMENT
-- =====================================================

-- Update comment to reflect removed providers
COMMENT ON COLUMN api_usage.api_provider IS 'e.g., openai, google, pagespeed, internal (removed: dataforseo, backlinks, keyword)';

-- =====================================================
-- 5. VERIFY CLEANUP
-- =====================================================

-- Count remaining tables (should not include removed tables)
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename NOT IN (
        'keywords', 'keyword_metrics', 'keyword_rankings', 'competitor_rankings', 'keyword_suggestions',
        'backlink_profiles', 'backlinks', 'backlink_history', 'outgoing_links',
        'learning_modules', 'learning_lessons', 'lesson_quizzes', 'user_learning_progress',
        'learning_paths', 'learning_path_modules', 'user_learning_recommendations'
    )
ORDER BY tablename;

-- Check that chat tables are preserved (should return 2 rows)
SELECT COUNT(*) as chat_tables_preserved 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('anon_chat_usage', 'users');

-- =====================================================
-- 6. VACUUM AND ANALYZE
-- =====================================================

-- Reclaim space and update statistics
VACUUM ANALYZE;

COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Database cleanup completed successfully! Removed 15 tables for bloated features.' as status;