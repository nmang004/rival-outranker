/**
 * Controllers Index
 * 
 * Exports all HTTP request controllers that handle routing logic,
 * input validation, authentication, and response formatting.
 */

// Base controller
export { BaseController } from './base.controller';

// Controller implementations
export { AnalysisController, analysisController } from './analysis.controller';
export { UserController, userController } from './user.controller';
export { ProjectController, projectController } from './project.controller';

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