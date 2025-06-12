/**
 * Repository Layer Index
 * 
 * Exports all repository classes and singleton instances for database operations.
 * Each repository provides type-safe, domain-specific database access methods
 * built on top of the BaseRepository pattern.
 */

// Base repository
export { BaseRepository, type IRepository } from './base.repository';

// User management
export { UserRepository, userRepository } from './user.repository';

// SEO analysis
export { AnalysisRepository, analysisRepository } from './analysis.repository';

// Project management
export { ProjectRepository, projectRepository } from './project.repository';

// Rival Audit management
export { RivalAuditRepository, rivalAuditRepository } from './rival-audit.repository';




// API usage tracking
export { ApiUsageRepository, apiUsageRepository } from './api-usage.repository';

// Re-import for local use
import { userRepository } from './user.repository';
import { analysisRepository } from './analysis.repository';
import { projectRepository } from './project.repository';
import { rivalAuditRepository } from './rival-audit.repository';
import { apiUsageRepository } from './api-usage.repository';

/**
 * Repository Registry
 * 
 * Centralized access to all repository instances for dependency injection
 */
export const repositories = {
  // Core entities
  user: userRepository as any,
  analysis: analysisRepository as any,
  project: projectRepository as any,
  
  // Rival Audit system
  rivalAudit: rivalAuditRepository as any,
  
  // System monitoring
  apiUsage: apiUsageRepository as any
} as const;

export type RepositoryRegistry = typeof repositories;