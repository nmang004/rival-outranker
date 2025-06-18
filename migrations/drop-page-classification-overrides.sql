-- Migration: Drop page_classification_overrides table
-- Description: Remove manual override system as part of Phase 3 cleanup
-- Date: 2025-06-18
-- Priority: Medium

-- Drop the page_classification_overrides table and its indexes
DROP TABLE IF EXISTS page_classification_overrides;

-- Note: Since this table was defined with cascading constraints,
-- this migration will also remove all associated indexes and constraints:
-- - Primary key constraint on id
-- - Foreign key constraint on user_id -> users(id)
-- - Foreign key constraint on audit_id -> rival_audits(id)
-- - Unique constraint on (audit_id, page_url)
-- - Index idx_page_overrides_user on user_id
-- - Index idx_page_overrides_audit on audit_id