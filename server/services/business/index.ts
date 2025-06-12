/**
 * Business Services Index
 * 
 * Exports all business logic services that coordinate between repositories
 * and implement domain-specific business rules and workflows.
 */

// Service interfaces
export type { IUserService } from '../interfaces/user.service.interface';
export type { IAnalysisService } from '../interfaces/analysis.service.interface';
export type { IProjectService } from '../interfaces/project.service.interface';
// Removed: export type { IKeywordService } from '../interfaces/keyword.service.interface';

// Service implementations
export { UserService, userService } from './user.service';
export { AnalysisService, analysisService } from './analysis.service';
export { ProjectService, projectService } from './project.service';

// Import the service instances for the registry
import { userService } from './user.service';
import { analysisService } from './analysis.service';
import { projectService } from './project.service';

/**
 * Business Services Registry
 * 
 * Centralized access to all business service instances
 */
export const businessServices = {
  user: userService,
  analysis: analysisService,
  project: projectService
} as const;

export type BusinessServicesRegistry = typeof businessServices;