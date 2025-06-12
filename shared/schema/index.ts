// Barrel export file for all schema domains
// This file maintains backward compatibility with existing imports

// Core domain (users, sessions, API usage)
export * from './core';

// Projects and analyses
export * from './projects';

// Keywords and competitor tracking
export * from './keywords';

// Backlink analysis
export * from './backlinks';

// SEO analysis schemas and validation
export * from './seo-analysis';

// Rival audit system
export * from './rival-audit';

// Learning management system
export * from './learning';

// Web crawling system
export * from './crawling';

// Re-export commonly used types for convenience
export type { SeoScoreCategory } from './seo-analysis';
export type { AuditStatus, SeoImportance } from './rival-audit';