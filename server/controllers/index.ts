/**
 * Controllers Index
 * 
 * Exports all HTTP request controllers that handle routing logic,
 * input validation, authentication, and response formatting.
 */

// Base controller
export { BaseController } from './base.controller';

// Controller implementations
export { AnalysisController } from './analysis.controller';
export { analysisController } from './analysis.controller';
export { UserController } from './user.controller';
export { userController } from './user.controller';
export { ProjectController } from './project.controller';
export { projectController } from './project.controller';

// Re-import for local use
import { analysisController } from './analysis.controller';
import { userController } from './user.controller';
import { projectController } from './project.controller';

/**
 * Controllers Registry
 * 
 * Centralized access to all controller instances
 */
export const controllers = {
  analysis: analysisController as any,
  user: userController as any,
  project: projectController as any
} as const;

export type ControllersRegistry = typeof controllers;