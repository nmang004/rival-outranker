import { Analysis, InsertAnalysis, User, InsertUser, users, analyses } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interfaces for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Analysis operations
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalysesByUrl(url: string): Promise<Analysis[]>;
  getLatestAnalyses(limit: number): Promise<Analysis[]>;
  getAllAnalyses(): Promise<Analysis[]>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
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
}

export const storage = new DatabaseStorage();
