import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { projectService } from '../services/business';
import { insertProjectSchema, updateProjectSchema } from '@shared/schema';
import { ZodError } from 'zod';

/**
 * Controller for project management operations
 */
export class ProjectController extends BaseController {

  /**
   * POST /api/projects
   * Create a new project
   */
  public createProject = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      const projectData = insertProjectSchema.parse(req.body);

      this.logAction('create_project', userId, { name: projectData.name });

      const newProject = await projectService.createProject(userId, projectData);
      
      this.sendCreated(res, newProject, 'Project created successfully');

    } catch (error) {
      if (error instanceof ZodError) {
        this.sendValidationError(res, error);
      } else {
        console.error('[ProjectController] Error in createProject:', error);
        this.sendError(res, 'Failed to create project');
      }
    }
  });

  /**
   * GET /api/projects
   * Get user's projects
   */
  public getUserProjects = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      const projects = await projectService.getUserProjects(userId);
      
      this.sendSuccess(res, projects, 'Projects retrieved successfully');

    } catch (error) {
      console.error('[ProjectController] Error in getUserProjects:', error);
      this.sendError(res, 'Failed to fetch projects');
    }
  });

  /**
   * GET /api/projects/:id
   * Get project by ID
   */
  public getProjectById = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      const projectId = this.parseInteger(req.params.id);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      if (!projectId) {
        this.sendError(res, 'Invalid project ID', 400);
        return;
      }

      const project = await projectService.getProjectById(projectId, userId);
      
      if (!project) {
        this.sendNotFound(res, 'Project');
        return;
      }

      this.sendSuccess(res, project, 'Project retrieved successfully');

    } catch (error) {
      console.error('[ProjectController] Error in getProjectById:', error);
      this.sendError(res, 'Failed to fetch project');
    }
  });

  /**
   * PUT /api/projects/:id
   * Update project
   */
  public updateProject = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      const projectId = this.parseInteger(req.params.id);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      if (!projectId) {
        this.sendError(res, 'Invalid project ID', 400);
        return;
      }

      const updates = updateProjectSchema.parse(req.body);

      this.logAction('update_project', userId, { projectId, fields: Object.keys(updates) });

      const updatedProject = await projectService.updateProject(projectId, userId, updates);
      
      if (!updatedProject) {
        this.sendNotFound(res, 'Project');
        return;
      }

      this.sendSuccess(res, updatedProject, 'Project updated successfully');

    } catch (error) {
      if (error instanceof ZodError) {
        this.sendValidationError(res, error);
      } else if (error instanceof Error && error.message.includes('Access denied')) {
        this.sendForbidden(res, error.message);
      } else {
        console.error('[ProjectController] Error in updateProject:', error);
        this.sendError(res, 'Failed to update project');
      }
    }
  });

  /**
   * DELETE /api/projects/:id
   * Delete project
   */
  public deleteProject = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      const projectId = this.parseInteger(req.params.id);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      if (!projectId) {
        this.sendError(res, 'Invalid project ID', 400);
        return;
      }

      this.logAction('delete_project', userId, { projectId });

      const deleted = await projectService.deleteProject(projectId, userId);
      
      if (deleted) {
        this.sendNoContent(res);
      } else {
        this.sendError(res, 'Failed to delete project');
      }

    } catch (error) {
      if (error instanceof Error && error.message.includes('Access denied')) {
        this.sendForbidden(res, error.message);
      } else {
        console.error('[ProjectController] Error in deleteProject:', error);
        this.sendError(res, 'Failed to delete project');
      }
    }
  });

  /**
   * GET /api/projects/:id/analyses
   * Get project with all analyses
   */
  public getProjectAnalyses = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      const projectId = this.parseInteger(req.params.id);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      if (!projectId) {
        this.sendError(res, 'Invalid project ID', 400);
        return;
      }

      const projectWithAnalyses = await projectService.getProjectWithAnalyses(projectId, userId);
      
      if (!projectWithAnalyses) {
        this.sendNotFound(res, 'Project');
        return;
      }

      this.sendSuccess(res, projectWithAnalyses, 'Project analyses retrieved successfully');

    } catch (error) {
      console.error('[ProjectController] Error in getProjectAnalyses:', error);
      this.sendError(res, 'Failed to fetch project analyses');
    }
  });

  /**
   * POST /api/projects/:id/analyses
   * Add analysis to project
   */
  public addAnalysisToProject = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      const projectId = this.parseInteger(req.params.id);
      const { analysisId } = req.body;
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      if (!projectId) {
        this.sendError(res, 'Invalid project ID', 400);
        return;
      }

      if (!analysisId || !Number.isInteger(analysisId)) {
        this.sendError(res, 'Valid analysis ID is required', 400);
        return;
      }

      this.logAction('add_analysis_to_project', userId, { projectId, analysisId });

      const success = await projectService.addAnalysisToProject(projectId, analysisId, userId);
      
      if (success) {
        this.sendSuccess(res, null, 'Analysis added to project successfully');
      } else {
        this.sendError(res, 'Failed to add analysis to project');
      }

    } catch (error) {
      if (error instanceof Error && error.message.includes('Access denied')) {
        this.sendForbidden(res, error.message);
      } else if (error instanceof Error && error.message.includes('not found')) {
        this.sendNotFound(res, error.message.includes('Analysis') ? 'Analysis' : 'Project');
      } else {
        console.error('[ProjectController] Error in addAnalysisToProject:', error);
        this.sendError(res, 'Failed to add analysis to project');
      }
    }
  });

  /**
   * DELETE /api/projects/:id/analyses/:analysisId
   * Remove analysis from project
   */
  public removeAnalysisFromProject = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      const projectId = this.parseInteger(req.params.id);
      const analysisId = this.parseInteger(req.params.analysisId);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      if (!projectId || !analysisId) {
        this.sendError(res, 'Invalid project ID or analysis ID', 400);
        return;
      }

      this.logAction('remove_analysis_from_project', userId, { projectId, analysisId });

      const success = await projectService.removeAnalysisFromProject(projectId, analysisId, userId);
      
      if (success) {
        this.sendNoContent(res);
      } else {
        this.sendError(res, 'Failed to remove analysis from project');
      }

    } catch (error) {
      if (error instanceof Error && error.message.includes('Access denied')) {
        this.sendForbidden(res, error.message);
      } else {
        console.error('[ProjectController] Error in removeAnalysisFromProject:', error);
        this.sendError(res, 'Failed to remove analysis from project');
      }
    }
  });

  /**
   * GET /api/projects/:id/stats
   * Get project statistics
   */
  public getProjectStats = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      const projectId = this.parseInteger(req.params.id);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      if (!projectId) {
        this.sendError(res, 'Invalid project ID', 400);
        return;
      }

      const stats = await projectService.getProjectStats(projectId, userId);
      
      if (!stats) {
        this.sendNotFound(res, 'Project');
        return;
      }

      this.sendSuccess(res, stats, 'Project statistics retrieved successfully');

    } catch (error) {
      console.error('[ProjectController] Error in getProjectStats:', error);
      this.sendError(res, 'Failed to fetch project statistics');
    }
  });

  /**
   * GET /api/projects/stats
   * Get user's project statistics
   */
  public getUserProjectStats = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      const stats = await projectService.getUserProjectStats(userId);
      
      this.sendSuccess(res, stats, 'User project statistics retrieved successfully');

    } catch (error) {
      console.error('[ProjectController] Error in getUserProjectStats:', error);
      this.sendError(res, 'Failed to fetch user project statistics');
    }
  });

  /**
   * GET /api/projects/search
   * Search user's projects
   */
  public searchProjects = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      const query = req.query.q as string;
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      if (!query || query.trim().length === 0) {
        this.sendError(res, 'Search query is required', 400);
        return;
      }

      const projects = await projectService.searchUserProjects(userId, query.trim());
      
      this.sendSuccess(res, projects, 'Projects search completed');

    } catch (error) {
      console.error('[ProjectController] Error in searchProjects:', error);
      this.sendError(res, 'Failed to search projects');
    }
  });

  /**
   * GET /api/projects/recent
   * Get user's recent projects
   */
  public getRecentProjects = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      const limit = this.parseInteger(req.query.limit, 5);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      const projects = await projectService.getRecentProjects(userId, limit);
      
      this.sendSuccess(res, projects, 'Recent projects retrieved successfully');

    } catch (error) {
      console.error('[ProjectController] Error in getRecentProjects:', error);
      this.sendError(res, 'Failed to fetch recent projects');
    }
  });

  /**
   * POST /api/projects/:id/duplicate
   * Duplicate a project
   */
  public duplicateProject = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      const projectId = this.parseInteger(req.params.id);
      const { newName } = req.body;
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      if (!projectId) {
        this.sendError(res, 'Invalid project ID', 400);
        return;
      }

      this.logAction('duplicate_project', userId, { projectId, newName });

      const duplicatedProject = await projectService.duplicateProject(projectId, userId, newName);
      
      if (!duplicatedProject) {
        this.sendNotFound(res, 'Project');
        return;
      }

      this.sendCreated(res, duplicatedProject, 'Project duplicated successfully');

    } catch (error) {
      console.error('[ProjectController] Error in duplicateProject:', error);
      this.sendError(res, 'Failed to duplicate project');
    }
  });

  /**
   * GET /api/projects/:id/export
   * Export project data
   */
  public exportProject = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      const projectId = this.parseInteger(req.params.id);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      if (!projectId) {
        this.sendError(res, 'Invalid project ID', 400);
        return;
      }

      this.logAction('export_project', userId, { projectId });

      const exportData = await projectService.getProjectExportData(projectId, userId);
      
      if (!exportData) {
        this.sendNotFound(res, 'Project');
        return;
      }

      this.sendSuccess(res, exportData, 'Project export data retrieved successfully');

    } catch (error) {
      console.error('[ProjectController] Error in exportProject:', error);
      this.sendError(res, 'Failed to export project');
    }
  });

  /**
   * GET /api/projects/:id/analyses/:analysisId/check
   * Check if analysis is in project
   */
  public checkAnalysisInProject = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const projectId = this.parseInteger(req.params.id);
      const analysisId = this.parseInteger(req.params.analysisId);
      
      if (!projectId || !analysisId) {
        this.sendError(res, 'Invalid project ID or analysis ID', 400);
        return;
      }

      const isInProject = await projectService.isAnalysisInProject(projectId, analysisId);
      
      this.sendSuccess(res, { isInProject }, 'Analysis membership checked');

    } catch (error) {
      console.error('[ProjectController] Error in checkAnalysisInProject:', error);
      this.sendError(res, 'Failed to check analysis membership');
    }
  });
}

// Export singleton instance
export const projectController = new ProjectController();