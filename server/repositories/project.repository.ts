import { eq, desc, and } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { projects, projectAnalyses, Project, InsertProject, UpdateProject, ProjectAnalysis, InsertProjectAnalysis } from '@shared/schema';
import { db } from '../db';

/**
 * Repository for project-related database operations
 */
export class ProjectRepository extends BaseRepository<Project, InsertProject> {
  constructor() {
    super(projects);
  }

  /**
   * Find projects by user ID
   */
  async findByUserId(userId: string): Promise<Project[]> {
    return this.findMany({
      where: eq(projects.userId, userId),
      orderBy: [desc(projects.updatedAt)]
    });
  }

  /**
   * Update project with new timestamp
   */
  async updateProject(projectId: number, data: UpdateProject): Promise<Project | null> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    return this.updateById(projectId, updateData);
  }

  /**
   * Delete project and all associated project-analysis relationships
   */
  async deleteProjectWithAnalyses(projectId: number): Promise<boolean> {
    // First delete all project-analysis relationships
    await db.delete(projectAnalyses).where(eq(projectAnalyses.projectId, projectId));
    
    // Then delete the project itself
    return this.deleteById(projectId);
  }

  /**
   * Add analysis to project
   */
  async addAnalysisToProject(data: InsertProjectAnalysis): Promise<ProjectAnalysis> {
    const result = await db
      .insert(projectAnalyses)
      .values(data)
      .returning();
    
    return result[0];
  }

  /**
   * Remove analysis from project
   */
  async removeAnalysisFromProject(projectId: number, analysisId: number): Promise<boolean> {
    const result = await db
      .delete(projectAnalyses)
      .where(
        and(
          eq(projectAnalyses.projectId, projectId),
          eq(projectAnalyses.analysisId, analysisId)
        )
      )
      .returning();
    
    return result.length > 0;
  }

  /**
   * Get analyses for a project
   */
  async getProjectAnalyses(projectId: number): Promise<ProjectAnalysis[]> {
    return await db
      .select()
      .from(projectAnalyses)
      .where(eq(projectAnalyses.projectId, projectId))
      .orderBy(desc(projectAnalyses.addedAt));
  }

  /**
   * Check if analysis is in project
   */
  async isAnalysisInProject(projectId: number, analysisId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(projectAnalyses)
      .where(
        and(
          eq(projectAnalyses.projectId, projectId),
          eq(projectAnalyses.analysisId, analysisId)
        )
      )
      .limit(1);
    
    return result.length > 0;
  }

  /**
   * Get project with analysis count
   */
  async getProjectWithAnalysisCount(projectId: number): Promise<Project & { analysisCount: number } | null> {
    const project = await this.findById(projectId);
    if (!project) return null;

    const analysisCount = await this.countProjectAnalyses(projectId);
    return { ...project, analysisCount };
  }

  /**
   * Count analyses in a project
   */
  async countProjectAnalyses(projectId: number): Promise<number> {
    const result = await db
      .select({ count: db.$count() })
      .from(projectAnalyses)
      .where(eq(projectAnalyses.projectId, projectId));
    
    return result[0]?.count || 0;
  }

  /**
   * Get projects with analysis counts for a user
   */
  async getProjectsWithAnalysisCounts(userId: string): Promise<Array<Project & { analysisCount: number }>> {
    const userProjects = await this.findByUserId(userId);
    
    const projectsWithCounts = await Promise.all(
      userProjects.map(async (project) => {
        const analysisCount = await this.countProjectAnalyses(project.id);
        return { ...project, analysisCount };
      })
    );

    return projectsWithCounts;
  }

  /**
   * Search projects by name
   */
  async searchByName(userId: string, searchTerm: string): Promise<Project[]> {
    // Since Drizzle doesn't have a direct LIKE operator in this context,
    // we'll fetch all user projects and filter in memory
    const userProjects = await this.findByUserId(userId);
    return userProjects.filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  /**
   * Get recent projects for a user
   */
  async getRecentProjects(userId: string, limit: number = 5): Promise<Project[]> {
    return this.findMany({
      where: eq(projects.userId, userId),
      orderBy: [desc(projects.updatedAt)],
      limit
    });
  }

  /**
   * Check if user owns project
   */
  async userOwnsProject(userId: string, projectId: number): Promise<boolean> {
    const project = await this.findById(projectId);
    return project?.userId === userId;
  }
}

// Export singleton instance
export const projectRepository = new ProjectRepository();