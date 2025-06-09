import { Project, InsertProject, UpdateProject, Analysis } from '@shared/schema';

/**
 * Interface for project service operations
 */
export interface IProjectService {
  /**
   * Project Management
   */
  createProject(userId: string, projectData: Omit<InsertProject, 'userId'>): Promise<Project>;
  updateProject(projectId: number, userId: string, updates: UpdateProject): Promise<Project | null>;
  deleteProject(projectId: number, userId: string): Promise<boolean>;
  
  /**
   * Project Retrieval
   */
  getProjectById(projectId: number, userId: string): Promise<Project | null>;
  getUserProjects(userId: string): Promise<Array<Project & { analysisCount: number }>>;
  getProjectWithAnalyses(projectId: number, userId: string): Promise<{
    project: Project;
    analyses: Analysis[];
  } | null>;
  
  /**
   * Project-Analysis Association
   */
  addAnalysisToProject(projectId: number, analysisId: number, userId: string): Promise<boolean>;
  removeAnalysisFromProject(projectId: number, analysisId: number, userId: string): Promise<boolean>;
  isAnalysisInProject(projectId: number, analysisId: number): Promise<boolean>;
  
  /**
   * Project Search and Organization
   */
  searchUserProjects(userId: string, searchTerm: string): Promise<Project[]>;
  getRecentProjects(userId: string, limit?: number): Promise<Project[]>;
  
  /**
   * Project Statistics
   */
  getProjectStats(projectId: number, userId: string): Promise<{
    analysisCount: number;
    averageScore: number;
    lastUpdated: Date;
    createdAt: Date;
  } | null>;
  
  getUserProjectStats(userId: string): Promise<{
    totalProjects: number;
    totalAnalyses: number;
    averageAnalysesPerProject: number;
    recentActivity: {
      projectsCreatedThisMonth: number;
      analysesAddedThisMonth: number;
    };
  }>;
  
  /**
   * Validation and Authorization
   */
  userOwnsProject(userId: string, projectId: number): Promise<boolean>;
  validateProjectAccess(userId: string, projectId: number): Promise<boolean>;
}