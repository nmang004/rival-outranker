import { 
  Analysis, InsertAnalysis, 
  User, InsertUser, UpdateUser, 
  Project, InsertProject, UpdateProject,
  ProjectAnalysis, InsertProjectAnalysis,
  users, analyses, projects, projectAnalyses 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

// Interfaces for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: UpdateUser): Promise<User>;
  updateLastLogin(id: number): Promise<User>;
  verifyEmail(id: number): Promise<User>;
  getUserCount(): Promise<number>;
  
  // Analysis operations
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalysesByUrl(url: string): Promise<Analysis[]>;
  getAnalysesByUserId(userId: number): Promise<Analysis[]>;
  getLatestAnalyses(limit: number): Promise<Analysis[]>;
  getAllAnalyses(): Promise<Analysis[]>;
  updateAnalysisResults(id: number, results: any): Promise<Analysis>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  updateProject(id: number, projectData: UpdateProject): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Project-Analysis operations
  addAnalysisToProject(projectAnalysis: InsertProjectAnalysis): Promise<ProjectAnalysis>;
  removeAnalysisFromProject(projectId: number, analysisId: number): Promise<void>;
  getProjectAnalyses(projectId: number): Promise<Analysis[]>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: UpdateUser): Promise<User> {
    const result = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async updateLastLogin(id: number): Promise<User> {
    const result = await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async verifyEmail(id: number): Promise<User> {
    const result = await db
      .update(users)
      .set({
        isEmailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count;
  }

  // Analysis operations
  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const result = await db.insert(analyses).values(insertAnalysis).returning();
    return result[0];
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const results = await db.select().from(analyses).where(eq(analyses.id, id));
    return results[0];
  }

  async getAnalysesByUrl(url: string): Promise<Analysis[]> {
    try {
      // Attempt to normalize URL for better matching
      let normalizedUrl = url.toLowerCase();
      
      // Try to get exact match first
      const exactResults = await db
        .select()
        .from(analyses)
        .where(eq(analyses.url, url))
        .orderBy(desc(analyses.timestamp));
      
      if (exactResults.length > 0) {
        return exactResults;
      }
      
      // If no exact match, try with normalized URL
      const normalizedResults = await db
        .select()
        .from(analyses)
        .where(eq(analyses.url, normalizedUrl))
        .orderBy(desc(analyses.timestamp));
      
      return normalizedResults;
    } catch (error) {
      console.error("Error getting analyses by URL:", error);
      return [];
    }
  }

  async getLatestAnalyses(limit: number): Promise<Analysis[]> {
    return await db
      .select()
      .from(analyses)
      .orderBy(desc(analyses.timestamp))
      .limit(limit);
  }

  async getAllAnalyses(): Promise<Analysis[]> {
    return await db
      .select()
      .from(analyses)
      .orderBy(desc(analyses.timestamp));
  }
  
  async getAnalysesByUserId(userId: number): Promise<Analysis[]> {
    return await db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.timestamp));
  }
  
  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    const results = await db.select().from(projects).where(eq(projects.id, id));
    return results[0];
  }
  
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }
  
  async updateProject(id: number, projectData: UpdateProject): Promise<Project> {
    const result = await db
      .update(projects)
      .set({
        ...projectData,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }
  
  async deleteProject(id: number): Promise<void> {
    // First delete all associations with analyses
    await db
      .delete(projectAnalyses)
      .where(eq(projectAnalyses.projectId, id));
    
    // Then delete the project itself
    await db
      .delete(projects)
      .where(eq(projects.id, id));
  }
  
  // Project-Analysis operations
  async addAnalysisToProject(projectAnalysis: InsertProjectAnalysis): Promise<ProjectAnalysis> {
    const result = await db
      .insert(projectAnalyses)
      .values(projectAnalysis)
      .returning();
    return result[0];
  }
  
  async removeAnalysisFromProject(projectId: number, analysisId: number): Promise<void> {
    await db
      .delete(projectAnalyses)
      .where(
        and(
          eq(projectAnalyses.projectId, projectId),
          eq(projectAnalyses.analysisId, analysisId)
        )
      );
  }
  
  async getProjectAnalyses(projectId: number): Promise<Analysis[]> {
    const projectAnalysesResult = await db
      .select()
      .from(projectAnalyses)
      .where(eq(projectAnalyses.projectId, projectId));
    
    // Get all the analysis IDs for this project
    const analysisIds = projectAnalysesResult.map(pa => pa.analysisId);
    
    if (analysisIds.length === 0) {
      return [];
    }
    
    // Fetch the actual analyses
    return await db
      .select()
      .from(analyses)
      .where(inArray(analyses.id, analysisIds))
      .orderBy(desc(analyses.timestamp));
  }
  
  async updateAnalysisResults(id: number, results: any): Promise<Analysis> {
    // Update the analysis results
    const [updatedAnalysis] = await db
      .update(analyses)
      .set({
        results: results,
        timestamp: new Date() // Use timestamp instead of updatedAt
      })
      .where(eq(analyses.id, id))
      .returning();
    
    return updatedAnalysis;
  }
}

export const storage = new DatabaseStorage();
