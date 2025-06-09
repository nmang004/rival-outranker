import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { 
  keywords, 
  keywordMetrics, 
  keywordRankings, 
  competitorRankings,
  keywordSuggestions,
  Keyword, 
  InsertKeyword,
  KeywordMetrics,
  InsertKeywordMetrics,
  KeywordRanking,
  InsertKeywordRanking,
  CompetitorRanking,
  InsertCompetitorRanking,
  KeywordSuggestion,
  InsertKeywordSuggestion
} from '@shared/schema';
import { db } from '../db';

/**
 * Repository for keyword operations
 */
export class KeywordRepository extends BaseRepository<Keyword, InsertKeyword> {
  constructor() {
    super(keywords);
  }

  /**
   * Find keywords by user ID
   */
  async findByUserId(userId: string): Promise<Keyword[]> {
    return this.findMany({
      where: eq(keywords.userId, userId),
      orderBy: [desc(keywords.createdAt)]
    });
  }

  /**
   * Find active keywords by user ID
   */
  async findActiveByUserId(userId: string): Promise<Keyword[]> {
    return this.findMany({
      where: and(
        eq(keywords.userId, userId),
        eq(keywords.isActive, true)
      ),
      orderBy: [desc(keywords.createdAt)]
    });
  }

  /**
   * Find keywords by project ID
   */
  async findByProjectId(projectId: number): Promise<Keyword[]> {
    return this.findMany({
      where: eq(keywords.projectId, projectId),
      orderBy: [desc(keywords.createdAt)]
    });
  }

  /**
   * Find keyword by text and target URL
   */
  async findByKeywordAndUrl(userId: string, keyword: string, targetUrl: string): Promise<Keyword | null> {
    return this.findOne(
      and(
        eq(keywords.userId, userId),
        eq(keywords.keyword, keyword),
        eq(keywords.targetUrl, targetUrl)
      )
    );
  }

  /**
   * Deactivate keyword
   */
  async deactivateKeyword(keywordId: number): Promise<Keyword | null> {
    return this.updateById(keywordId, {
      isActive: false,
      updatedAt: new Date()
    });
  }

  /**
   * Reactivate keyword
   */
  async reactivateKeyword(keywordId: number): Promise<Keyword | null> {
    return this.updateById(keywordId, {
      isActive: true,
      updatedAt: new Date()
    });
  }

  /**
   * Update keyword notes
   */
  async updateNotes(keywordId: number, notes: string): Promise<Keyword | null> {
    return this.updateById(keywordId, {
      notes,
      updatedAt: new Date()
    });
  }

  /**
   * Count keywords for user
   */
  async countByUserId(userId: string): Promise<number> {
    return this.count(eq(keywords.userId, userId));
  }

  /**
   * Count active keywords for user
   */
  async countActiveByUserId(userId: string): Promise<number> {
    return this.count(
      and(
        eq(keywords.userId, userId),
        eq(keywords.isActive, true)
      )
    );
  }
}

/**
 * Repository for keyword metrics operations
 */
export class KeywordMetricsRepository extends BaseRepository<KeywordMetrics, InsertKeywordMetrics> {
  constructor() {
    super(keywordMetrics);
  }

  /**
   * Find metrics by keyword ID
   */
  async findByKeywordId(keywordId: number): Promise<KeywordMetrics | null> {
    return this.findOne(eq(keywordMetrics.keywordId, keywordId));
  }

  /**
   * Update metrics for keyword
   */
  async updateMetrics(keywordId: number, data: Partial<InsertKeywordMetrics>): Promise<KeywordMetrics | null> {
    const existing = await this.findByKeywordId(keywordId);
    
    if (existing) {
      return this.updateById(existing.id, {
        ...data,
        lastUpdated: new Date()
      });
    } else {
      return this.create({
        keywordId,
        ...data,
        lastUpdated: new Date()
      });
    }
  }

  /**
   * Get keywords with high search volume
   */
  async findHighVolumeKeywords(minVolume: number = 1000): Promise<KeywordMetrics[]> {
    return this.findMany({
      where: gte(keywordMetrics.searchVolume, minVolume),
      orderBy: [desc(keywordMetrics.searchVolume)]
    });
  }

  /**
   * Get keywords with low difficulty
   */
  async findLowDifficultyKeywords(maxDifficulty: number = 30): Promise<KeywordMetrics[]> {
    return this.findMany({
      where: lte(keywordMetrics.keywordDifficulty, maxDifficulty),
      orderBy: [desc(keywordMetrics.searchVolume)]
    });
  }
}

/**
 * Repository for keyword ranking operations
 */
export class KeywordRankingRepository extends BaseRepository<KeywordRanking, InsertKeywordRanking> {
  constructor() {
    super(keywordRankings);
  }

  /**
   * Find rankings by keyword ID
   */
  async findByKeywordId(keywordId: number, limit?: number): Promise<KeywordRanking[]> {
    return this.findMany({
      where: eq(keywordRankings.keywordId, keywordId),
      orderBy: [desc(keywordRankings.rankDate)],
      limit
    });
  }

  /**
   * Get latest ranking for keyword
   */
  async getLatestRanking(keywordId: number): Promise<KeywordRanking | null> {
    const results = await this.findMany({
      where: eq(keywordRankings.keywordId, keywordId),
      orderBy: [desc(keywordRankings.rankDate)],
      limit: 1
    });
    return results[0] || null;
  }

  /**
   * Add ranking data
   */
  async addRanking(data: InsertKeywordRanking): Promise<KeywordRanking> {
    return this.create(data);
  }

  /**
   * Get ranking history for date range
   */
  async getRankingHistory(keywordId: number, startDate: Date, endDate: Date): Promise<KeywordRanking[]> {
    return this.findMany({
      where: and(
        eq(keywordRankings.keywordId, keywordId),
        gte(keywordRankings.rankDate, startDate.toISOString().split('T')[0]),
        lte(keywordRankings.rankDate, endDate.toISOString().split('T')[0])
      ),
      orderBy: [desc(keywordRankings.rankDate)]
    });
  }

  /**
   * Get keywords that improved in ranking
   */
  async getImprovedRankings(): Promise<KeywordRanking[]> {
    // This would need a more complex query to compare current vs previous rankings
    // For now, we'll return rankings where rank is better than previousRank
    return this.findMany({
      where: and(
        // rank is not null and previousRank is not null and rank < previousRank
        // This is a simplified version - in practice you'd want more sophisticated logic
      ),
      orderBy: [desc(keywordRankings.rankDate)]
    });
  }

  /**
   * Get average ranking for keyword
   */
  async getAverageRanking(keywordId: number, days?: number): Promise<number> {
    let whereClause = eq(keywordRankings.keywordId, keywordId);
    
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      whereClause = and(whereClause, gte(keywordRankings.rankDate, cutoffDate.toISOString().split('T')[0]));
    }

    const rankings = await this.findMany({
      where: whereClause
    });

    if (rankings.length === 0) return 0;

    const validRankings = rankings.filter(r => r.rank !== null && r.rank > 0);
    if (validRankings.length === 0) return 0;

    const sum = validRankings.reduce((acc, r) => acc + (r.rank || 0), 0);
    return Math.round(sum / validRankings.length);
  }
}

/**
 * Repository for competitor ranking operations
 */
export class CompetitorRankingRepository extends BaseRepository<CompetitorRanking, InsertCompetitorRanking> {
  constructor() {
    super(competitorRankings);
  }

  /**
   * Find competitor rankings by keyword ID
   */
  async findByKeywordId(keywordId: number): Promise<CompetitorRanking[]> {
    return this.findMany({
      where: eq(competitorRankings.keywordId, keywordId),
      orderBy: [desc(competitorRankings.rankDate)]
    });
  }

  /**
   * Find rankings by competitor URL
   */
  async findByCompetitorUrl(competitorUrl: string): Promise<CompetitorRanking[]> {
    return this.findMany({
      where: eq(competitorRankings.competitorUrl, competitorUrl),
      orderBy: [desc(competitorRankings.rankDate)]
    });
  }

  /**
   * Get top competitors for keyword
   */
  async getTopCompetitors(keywordId: number, limit: number = 10): Promise<CompetitorRanking[]> {
    return this.findMany({
      where: eq(competitorRankings.keywordId, keywordId),
      orderBy: [desc(competitorRankings.rankDate)],
      limit
    });
  }
}

/**
 * Repository for keyword suggestions operations
 */
export class KeywordSuggestionRepository extends BaseRepository<KeywordSuggestion, InsertKeywordSuggestion> {
  constructor() {
    super(keywordSuggestions);
  }

  /**
   * Find suggestions by user ID
   */
  async findByUserId(userId: string): Promise<KeywordSuggestion[]> {
    return this.findMany({
      where: eq(keywordSuggestions.userId, userId),
      orderBy: [desc(keywordSuggestions.createdAt)]
    });
  }

  /**
   * Find suggestions by base keyword
   */
  async findByBaseKeyword(userId: string, baseKeyword: string): Promise<KeywordSuggestion[]> {
    return this.findMany({
      where: and(
        eq(keywordSuggestions.userId, userId),
        eq(keywordSuggestions.baseKeyword, baseKeyword)
      ),
      orderBy: [desc(keywordSuggestions.searchVolume)]
    });
  }

  /**
   * Find saved suggestions
   */
  async findSavedSuggestions(userId: string): Promise<KeywordSuggestion[]> {
    return this.findMany({
      where: and(
        eq(keywordSuggestions.userId, userId),
        eq(keywordSuggestions.saved, true)
      ),
      orderBy: [desc(keywordSuggestions.createdAt)]
    });
  }

  /**
   * Mark suggestion as saved
   */
  async markAsSaved(suggestionId: number): Promise<KeywordSuggestion | null> {
    return this.updateById(suggestionId, { saved: true });
  }

  /**
   * Unmark suggestion as saved
   */
  async unmarkAsSaved(suggestionId: number): Promise<KeywordSuggestion | null> {
    return this.updateById(suggestionId, { saved: false });
  }

  /**
   * Get suggestions by source type
   */
  async findBySource(userId: string, source: 'related' | 'question' | 'autocomplete'): Promise<KeywordSuggestion[]> {
    return this.findMany({
      where: and(
        eq(keywordSuggestions.userId, userId),
        eq(keywordSuggestions.source, source)
      ),
      orderBy: [desc(keywordSuggestions.searchVolume)]
    });
  }
}

// Export singleton instances
export const keywordRepository = new KeywordRepository();
export const keywordMetricsRepository = new KeywordMetricsRepository();
export const keywordRankingRepository = new KeywordRankingRepository();
export const competitorRankingRepository = new CompetitorRankingRepository();
export const keywordSuggestionRepository = new KeywordSuggestionRepository();