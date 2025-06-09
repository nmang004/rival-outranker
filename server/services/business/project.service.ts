import { IProjectService } from '../interfaces/project.service.interface';
import { Project, InsertProject, UpdateProject, Analysis } from '@shared/schema';
import { projectRepository, analysisRepository } from '../../repositories';
import { eq } from 'drizzle-orm';
import { db } from '../../db';

/**
 * Project business logic service
 * 
 * Manages project lifecycle, project-analysis associations,
 * and provides project insights and statistics.
 */
export class ProjectService implements IProjectService {

  /**
   * Create a new project for a user
   */
  async createProject(userId: string, projectData: Omit<InsertProject, 'userId'>): Promise<Project> {
    const fullProjectData: InsertProject = {
      ...projectData,
      userId
    };

    return await projectRepository.create(fullProjectData);
  }

  /**
   * Update an existing project
   */
  async updateProject(projectId: number, userId: string, updates: UpdateProject): Promise<Project | null> {
    // Verify user owns the project
    const hasAccess = await this.userOwnsProject(userId, projectId);
    if (!hasAccess) {
      throw new Error('Access denied: User does not own this project');
    }

    return await projectRepository.updateProject(projectId, updates);
  }

  /**
   * Delete a project and all its associations
   */
  async deleteProject(projectId: number, userId: string): Promise<boolean> {
    // Verify user owns the project
    const hasAccess = await this.userOwnsProject(userId, projectId);
    if (!hasAccess) {
      throw new Error('Access denied: User does not own this project');
    }

    return await projectRepository.deleteProjectWithAnalyses(projectId);
  }

  /**
   * Get project by ID with access control
   */
  async getProjectById(projectId: number, userId: string): Promise<Project | null> {
    const project = await projectRepository.findById(projectId);
    
    if (!project || project.userId !== userId) {
      return null;
    }

    return project;
  }

  /**
   * Get all projects for a user with analysis counts
   */
  async getUserProjects(userId: string): Promise<Array<Project & { analysisCount: number }>> {
    return await projectRepository.getProjectsWithAnalysisCounts(userId);
  }

  /**
   * Get project with all associated analyses
   */
  async getProjectWithAnalyses(projectId: number, userId: string): Promise<{
    project: Project;
    analyses: Analysis[];
  } | null> {
    const project = await this.getProjectById(projectId, userId);
    if (!project) {
      return null;
    }

    // Get project analyses associations
    const projectAnalyses = await projectRepository.getProjectAnalyses(projectId);
    
    // Get the actual analysis records
    const analysisPromises = projectAnalyses.map(pa => 
      analysisRepository.findById(pa.analysisId)
    );
    
    const analysisResults = await Promise.all(analysisPromises);
    const analyses = analysisResults.filter(Boolean) as Analysis[];

    return {
      project,
      analyses: analyses.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    };
  }

  /**
   * Add an analysis to a project
   */
  async addAnalysisToProject(projectId: number, analysisId: number, userId: string): Promise<boolean> {
    // Verify user owns the project
    const hasAccess = await this.userOwnsProject(userId, projectId);
    if (!hasAccess) {
      throw new Error('Access denied: User does not own this project');
    }

    // Verify the analysis exists and user has access to it
    const analysis = await analysisRepository.findById(analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }

    // For user analyses, check ownership; for public analyses, allow
    if (analysis.userId && analysis.userId !== userId) {
      throw new Error('Access denied: User does not own this analysis');
    }

    // Check if already associated
    const isAlreadyAssociated = await projectRepository.isAnalysisInProject(projectId, analysisId);
    if (isAlreadyAssociated) {
      return true; // Already associated, no error
    }

    try {
      await projectRepository.addAnalysisToProject({
        projectId,
        analysisId
      });
      return true;
    } catch (error) {
      console.error('Error adding analysis to project:', error);
      return false;
    }
  }

  /**
   * Remove an analysis from a project
   */
  async removeAnalysisFromProject(projectId: number, analysisId: number, userId: string): Promise<boolean> {
    // Verify user owns the project
    const hasAccess = await this.userOwnsProject(userId, projectId);
    if (!hasAccess) {
      throw new Error('Access denied: User does not own this project');
    }

    return await projectRepository.removeAnalysisFromProject(projectId, analysisId);
  }

  /**
   * Check if an analysis is associated with a project
   */
  async isAnalysisInProject(projectId: number, analysisId: number): Promise<boolean> {
    return await projectRepository.isAnalysisInProject(projectId, analysisId);
  }

  /**
   * Search user's projects by name or description
   */
  async searchUserProjects(userId: string, searchTerm: string): Promise<Project[]> {
    return await projectRepository.searchByName(userId, searchTerm);
  }

  /**
   * Get user's recent projects
   */
  async getRecentProjects(userId: string, limit: number = 5): Promise<Project[]> {
    return await projectRepository.getRecentProjects(userId, limit);
  }

  /**
   * Get comprehensive project statistics
   */
  async getProjectStats(projectId: number, userId: string): Promise<{
    analysisCount: number;
    averageScore: number;
    lastUpdated: Date;
    createdAt: Date;
  } | null> {
    const project = await this.getProjectById(projectId, userId);
    if (!project) {
      return null;
    }

    const projectWithAnalyses = await this.getProjectWithAnalyses(projectId, userId);
    if (!projectWithAnalyses) {
      return null;
    }

    const analyses = projectWithAnalyses.analyses;
    const analysisCount = analyses.length;
    
    const averageScore = analysisCount > 0
      ? Math.round(analyses.reduce((sum, analysis) => sum + analysis.overallScore, 0) / analysisCount)
      : 0;

    return {
      analysisCount,
      averageScore,
      lastUpdated: project.updatedAt,
      createdAt: project.createdAt
    };
  }

  /**
   * Get user's overall project statistics
   */
  async getUserProjectStats(userId: string): Promise<{
    totalProjects: number;
    totalAnalyses: number;
    averageAnalysesPerProject: number;
    recentActivity: {
      projectsCreatedThisMonth: number;
      analysesAddedThisMonth: number;
    };
  }> {
    const userProjects = await projectRepository.getProjectsWithAnalysisCounts(userId);
    
    const totalProjects = userProjects.length;
    const totalAnalyses = userProjects.reduce((sum, project) => sum + project.analysisCount, 0);
    const averageAnalysesPerProject = totalProjects > 0 
      ? Math.round(totalAnalyses / totalProjects * 100) / 100 
      : 0;

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentProjects = userProjects.filter(project => 
      new Date(project.createdAt) >= thirtyDaysAgo
    );

    // For analyses added this month, we'd need to check project_analyses table
    // This is a simplified version
    const projectsCreatedThisMonth = recentProjects.length;
    
    // Get recent analyses count (this is an approximation)
    const recentAnalyses = await analysisRepository.findRecentByUserId(userId, 30);
    const analysesAddedThisMonth = recentAnalyses.length;

    return {
      totalProjects,
      totalAnalyses,
      averageAnalysesPerProject,
      recentActivity: {
        projectsCreatedThisMonth,
        analysesAddedThisMonth
      }
    };
  }

  /**
   * Check if user owns a specific project
   */
  async userOwnsProject(userId: string, projectId: number): Promise<boolean> {
    return await projectRepository.userOwnsProject(userId, projectId);
  }

  /**
   * Validate user has access to a project
   */
  async validateProjectAccess(userId: string, projectId: number): Promise<boolean> {
    return await this.userOwnsProject(userId, projectId);
  }

  /**
   * Duplicate a project with all its analyses
   */
  async duplicateProject(projectId: number, userId: string, newName?: string): Promise<Project | null> {
    const originalProject = await this.getProjectById(projectId, userId);
    if (!originalProject) {
      return null;
    }

    const projectWithAnalyses = await this.getProjectWithAnalyses(projectId, userId);
    if (!projectWithAnalyses) {
      return null;
    }

    // Create new project
    const newProject = await this.createProject(userId, {
      name: newName || `${originalProject.name} (Copy)`,
      description: originalProject.description
    });

    // Add all analyses to the new project
    for (const analysis of projectWithAnalyses.analyses) {
      await this.addAnalysisToProject(newProject.id, analysis.id, userId);
    }

    return newProject;
  }

  /**
   * Get project export data
   */
  async getProjectExportData(projectId: number, userId: string): Promise<{
    project: Project;
    analyses: Analysis[];
    summary: {
      totalAnalyses: number;
      averageScore: number;
      scoreRange: { min: number; max: number };
      createdAt: Date;
      lastUpdated: Date;
    };
  } | null> {
    const projectWithAnalyses = await this.getProjectWithAnalyses(projectId, userId);
    if (!projectWithAnalyses) {
      return null;
    }

    const { project, analyses } = projectWithAnalyses;
    
    const scores = analyses.map(a => a.overallScore);
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

    const summary = {
      totalAnalyses: analyses.length,
      averageScore,
      scoreRange: {
        min: scores.length > 0 ? Math.min(...scores) : 0,
        max: scores.length > 0 ? Math.max(...scores) : 0
      },
      createdAt: project.createdAt,
      lastUpdated: project.updatedAt
    };

    return {
      project,
      analyses,
      summary
    };
  }
}

// Export singleton instance
export const projectService = new ProjectService();