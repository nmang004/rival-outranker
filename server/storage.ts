import { 
  Analysis, InsertAnalysis, 
  User, InsertUser, UpdateUser, 
  Project, InsertProject, UpdateProject,
  ProjectAnalysis, InsertProjectAnalysis,
  Keyword, InsertKeyword,
  KeywordMetrics, InsertKeywordMetrics,
  KeywordRanking, InsertKeywordRanking,
  CompetitorRanking, InsertCompetitorRanking,
  KeywordSuggestion, InsertKeywordSuggestion,
  users, analyses, projects, projectAnalyses,
  keywords, keywordMetrics, keywordRankings, competitorRankings, keywordSuggestions
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, sql, asc, gte, lte } from "drizzle-orm";

// Interfaces for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, userData: UpdateUser): Promise<User>;
  updateLastLogin(id: string): Promise<User>;
  verifyEmail(id: string): Promise<User>;
  getUserCount(): Promise<number>;
  upsertUser(userData: { id: string, email?: string | null, firstName?: string | null, lastName?: string | null, profileImageUrl?: string | null }): Promise<User>;
  
  // Analysis operations
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalysesByUrl(url: string): Promise<Analysis[]>;
  getAnalysesByUserId(userId: string): Promise<Analysis[]>;
  getLatestAnalyses(limit: number): Promise<Analysis[]>;
  getAllAnalyses(): Promise<Analysis[]>;
  updateAnalysisResults(id: number, results: any): Promise<Analysis>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUserId(userId: string): Promise<Project[]>;
  updateProject(id: number, projectData: UpdateProject): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Project-Analysis operations
  addAnalysisToProject(projectAnalysis: InsertProjectAnalysis): Promise<ProjectAnalysis>;
  removeAnalysisFromProject(projectId: number, analysisId: number): Promise<void>;
  getProjectAnalyses(projectId: number): Promise<Analysis[]>;
  
  // Keyword operations
  createKeyword(keyword: InsertKeyword): Promise<Keyword>;
  getKeyword(id: number): Promise<Keyword | undefined>;
  getKeywordsByUserId(userId: string): Promise<Keyword[]>;
  getKeywordsByProjectId(projectId: number): Promise<Keyword[]>;
  getKeywordsByKeywordText(keyword: string): Promise<Keyword[]>;
  updateKeyword(id: number, keywordData: Partial<InsertKeyword>): Promise<Keyword>;
  deleteKeyword(id: number): Promise<void>;
  
  // Keyword Metrics operations
  createKeywordMetrics(metrics: InsertKeywordMetrics): Promise<KeywordMetrics>;
  getKeywordMetrics(keywordId: number): Promise<KeywordMetrics | undefined>;
  updateKeywordMetrics(keywordId: number, metricsData: Partial<InsertKeywordMetrics>): Promise<KeywordMetrics>;
  
  // Keyword Rankings operations
  createKeywordRanking(ranking: InsertKeywordRanking): Promise<KeywordRanking>;
  getKeywordRankings(keywordId: number, limit?: number): Promise<KeywordRanking[]>;
  getLatestKeywordRanking(keywordId: number): Promise<KeywordRanking | undefined>;
  getRankingHistory(keywordId: number, startDate?: Date, endDate?: Date): Promise<KeywordRanking[]>;
  
  // Competitor Rankings operations
  createCompetitorRanking(ranking: InsertCompetitorRanking): Promise<CompetitorRanking>;
  getCompetitorRankings(keywordId: number, competitorUrl: string, limit?: number): Promise<CompetitorRanking[]>;
  getCompetitorRankingsByKeyword(keywordId: number): Promise<CompetitorRanking[]>;
  getLatestCompetitorRanking(keywordId: number, competitorUrl: string): Promise<CompetitorRanking | undefined>;
  
  // Keyword Suggestions operations
  createKeywordSuggestion(suggestion: InsertKeywordSuggestion): Promise<KeywordSuggestion>;
  getKeywordSuggestions(userId: string, baseKeyword: string): Promise<KeywordSuggestion[]>;
  saveKeywordSuggestion(id: number): Promise<KeywordSuggestion>;
  deleteKeywordSuggestion(id: number): Promise<void>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
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
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, userData: UpdateUser): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateLastLogin(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async verifyEmail(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isEmailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count;
  }

  async upsertUser(userData: { id: string, email?: string | null, firstName?: string | null, lastName?: string | null, profileImageUrl?: string | null }): Promise<User> {
    // Check if user exists
    const existingUser = await this.getUser(userData.id);
    
    if (existingUser) {
      // Update existing user
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(users.id, userData.id))
        .returning();
      return user;
    } else {
      // Create new user
      const [user] = await db
        .insert(users)
        .values({
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return user;
    }
  }

  // Analysis operations
  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const [result] = await db
      .insert(analyses)
      .values({
        ...analysis,
        timestamp: new Date()
      })
      .returning();
    return result;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const results = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, id));
    return results[0];
  }

  async getAnalysesByUrl(url: string): Promise<Analysis[]> {
    return await db
      .select()
      .from(analyses)
      .where(eq(analyses.url, url))
      .orderBy(desc(analyses.timestamp));
  }

  async getAnalysesByUserId(userId: string): Promise<Analysis[]> {
    return await db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.timestamp));
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

  async updateAnalysisResults(id: number, results: any): Promise<Analysis> {
    // Update just the results field of an analysis
    const [updatedAnalysis] = await db
      .update(analyses)
      .set({ results })
      .where(eq(analyses.id, id))
      .returning();
    
    return updatedAnalysis;
  }

  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const [result] = await db
      .insert(projects)
      .values({
        ...project,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const results = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return results[0];
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async updateProject(id: number, projectData: UpdateProject): Promise<Project> {
    const [result] = await db
      .update(projects)
      .set({
        ...projectData,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    return result;
  }

  async deleteProject(id: number): Promise<void> {
    await db
      .delete(projects)
      .where(eq(projects.id, id));
  }

  // Project-Analysis operations
  async addAnalysisToProject(projectAnalysis: InsertProjectAnalysis): Promise<ProjectAnalysis> {
    const [result] = await db
      .insert(projectAnalyses)
      .values({
        ...projectAnalysis,
        addedAt: new Date(),
      })
      .returning();
    return result;
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
    // Get all analyses for a project
    const projectAnalysesResults = await db
      .select()
      .from(projectAnalyses)
      .where(eq(projectAnalyses.projectId, projectId));
    
    if (projectAnalysesResults.length === 0) {
      return [];
    }
    
    // Get analysis IDs
    const analysisIds = projectAnalysesResults.map(pa => pa.analysisId);
    
    // Get analysis details
    return await db
      .select()
      .from(analyses)
      .where(inArray(analyses.id, analysisIds))
      .orderBy(desc(analyses.timestamp));
  }

  // Keyword operations
  async createKeyword(keyword: InsertKeyword): Promise<Keyword> {
    const [result] = await db
      .insert(keywords)
      .values(keyword)
      .returning();
    return result;
  }

  async getKeyword(id: number): Promise<Keyword | undefined> {
    const [result] = await db
      .select()
      .from(keywords)
      .where(eq(keywords.id, id));
    return result;
  }

  async getKeywordsByUserId(userId: string): Promise<Keyword[]> {
    return await db
      .select()
      .from(keywords)
      .where(eq(keywords.userId, userId))
      .orderBy(desc(keywords.createdAt));
  }

  async getKeywordsByProjectId(projectId: number): Promise<Keyword[]> {
    return await db
      .select()
      .from(keywords)
      .where(eq(keywords.projectId, projectId))
      .orderBy(desc(keywords.createdAt));
  }
  
  async getKeywordsByKeywordText(keyword: string): Promise<Keyword[]> {
    return await db
      .select()
      .from(keywords)
      .where(eq(keywords.keyword, keyword))
      .orderBy(desc(keywords.createdAt));
  }

  async updateKeyword(id: number, keywordData: Partial<InsertKeyword>): Promise<Keyword> {
    const [result] = await db
      .update(keywords)
      .set({
        ...keywordData,
        updatedAt: new Date()
      })
      .where(eq(keywords.id, id))
      .returning();
    return result;
  }

  async deleteKeyword(id: number): Promise<void> {
    await db
      .delete(keywords)
      .where(eq(keywords.id, id));
  }

  // Keyword Metrics operations
  async createKeywordMetrics(metrics: InsertKeywordMetrics): Promise<KeywordMetrics> {
    const [result] = await db
      .insert(keywordMetrics)
      .values(metrics)
      .returning();
    return result;
  }

  async getKeywordMetrics(keywordId: number): Promise<KeywordMetrics | undefined> {
    const [result] = await db
      .select()
      .from(keywordMetrics)
      .where(eq(keywordMetrics.keywordId, keywordId));
    return result;
  }

  async updateKeywordMetrics(keywordId: number, metricsData: Partial<InsertKeywordMetrics>): Promise<KeywordMetrics> {
    const [result] = await db
      .update(keywordMetrics)
      .set({
        ...metricsData,
        lastUpdated: new Date()
      })
      .where(eq(keywordMetrics.keywordId, keywordId))
      .returning();
    return result;
  }

  // Keyword Rankings operations
  async createKeywordRanking(ranking: InsertKeywordRanking): Promise<KeywordRanking> {
    const [result] = await db
      .insert(keywordRankings)
      .values(ranking)
      .returning();
    return result;
  }

  async getKeywordRankings(keywordId: number, limit?: number): Promise<KeywordRanking[]> {
    if (limit) {
      return await db
        .select()
        .from(keywordRankings)
        .where(eq(keywordRankings.keywordId, keywordId))
        .orderBy(desc(keywordRankings.rankDate))
        .limit(limit);
    } else {
      return await db
        .select()
        .from(keywordRankings)
        .where(eq(keywordRankings.keywordId, keywordId))
        .orderBy(desc(keywordRankings.rankDate));
    }
  }

  async getLatestKeywordRanking(keywordId: number): Promise<KeywordRanking | undefined> {
    const [result] = await db
      .select()
      .from(keywordRankings)
      .where(eq(keywordRankings.keywordId, keywordId))
      .orderBy(desc(keywordRankings.rankDate))
      .limit(1);
    return result;
  }

  async getRankingHistory(keywordId: number, startDate?: Date, endDate?: Date): Promise<KeywordRanking[]> {
    // Handle different date filter combinations with separate query constructions
    if (startDate && endDate) {
      return await db
        .select()
        .from(keywordRankings)
        .where(
          and(
            eq(keywordRankings.keywordId, keywordId),
            gte(keywordRankings.rankDate, startDate),
            lte(keywordRankings.rankDate, endDate)
          )
        )
        .orderBy(asc(keywordRankings.rankDate));
    } else if (startDate) {
      return await db
        .select()
        .from(keywordRankings)
        .where(
          and(
            eq(keywordRankings.keywordId, keywordId),
            gte(keywordRankings.rankDate, startDate)
          )
        )
        .orderBy(asc(keywordRankings.rankDate));
    } else if (endDate) {
      return await db
        .select()
        .from(keywordRankings)
        .where(
          and(
            eq(keywordRankings.keywordId, keywordId),
            lte(keywordRankings.rankDate, endDate)
          )
        )
        .orderBy(asc(keywordRankings.rankDate));
    } else {
      return await db
        .select()
        .from(keywordRankings)
        .where(eq(keywordRankings.keywordId, keywordId))
        .orderBy(asc(keywordRankings.rankDate));
    }
  }

  // Competitor Rankings operations
  async createCompetitorRanking(ranking: InsertCompetitorRanking): Promise<CompetitorRanking> {
    const [result] = await db
      .insert(competitorRankings)
      .values(ranking)
      .returning();
    return result;
  }

  async getCompetitorRankings(keywordId: number, competitorUrl: string, limit?: number): Promise<CompetitorRanking[]> {
    if (limit) {
      return await db
        .select()
        .from(competitorRankings)
        .where(
          and(
            eq(competitorRankings.keywordId, keywordId),
            eq(competitorRankings.competitorUrl, competitorUrl)
          )
        )
        .orderBy(desc(competitorRankings.rankDate))
        .limit(limit);
    } else {
      return await db
        .select()
        .from(competitorRankings)
        .where(
          and(
            eq(competitorRankings.keywordId, keywordId),
            eq(competitorRankings.competitorUrl, competitorUrl)
          )
        )
        .orderBy(desc(competitorRankings.rankDate));
    }
  }

  async getCompetitorRankingsByKeyword(keywordId: number): Promise<CompetitorRanking[]> {
    return await db
      .select()
      .from(competitorRankings)
      .where(eq(competitorRankings.keywordId, keywordId))
      .orderBy(desc(competitorRankings.rankDate));
  }

  async getLatestCompetitorRanking(keywordId: number, competitorUrl: string): Promise<CompetitorRanking | undefined> {
    const [result] = await db
      .select()
      .from(competitorRankings)
      .where(
        and(
          eq(competitorRankings.keywordId, keywordId),
          eq(competitorRankings.competitorUrl, competitorUrl)
        )
      )
      .orderBy(desc(competitorRankings.rankDate))
      .limit(1);
    return result;
  }

  // Keyword Suggestions operations
  async createKeywordSuggestion(suggestion: InsertKeywordSuggestion): Promise<KeywordSuggestion> {
    const [result] = await db
      .insert(keywordSuggestions)
      .values(suggestion)
      .returning();
    return result;
  }

  async getKeywordSuggestions(userId: string, baseKeyword: string): Promise<KeywordSuggestion[]> {
    return await db
      .select()
      .from(keywordSuggestions)
      .where(
        and(
          eq(keywordSuggestions.userId, userId),
          eq(keywordSuggestions.baseKeyword, baseKeyword)
        )
      )
      .orderBy(desc(keywordSuggestions.createdAt));
  }

  async saveKeywordSuggestion(id: number): Promise<KeywordSuggestion> {
    const [result] = await db
      .update(keywordSuggestions)
      .set({ saved: true })
      .where(eq(keywordSuggestions.id, id))
      .returning();
    return result;
  }

  async deleteKeywordSuggestion(id: number): Promise<void> {
    await db
      .delete(keywordSuggestions)
      .where(eq(keywordSuggestions.id, id));
  }
}

export const storage = new DatabaseStorage();