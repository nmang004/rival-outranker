import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { analyses, Analysis, InsertAnalysis } from '../../shared/schema';

/**
 * Repository for analysis-related database operations
 */
export class AnalysisRepository extends BaseRepository<Analysis, InsertAnalysis> {
  constructor() {
    super(analyses);
  }

  /**
   * Find analyses by URL
   */
  async findByUrl(url: string): Promise<Analysis[]> {
    return this.findMany({
      where: eq(analyses.url, url),
      orderBy: [desc(analyses.timestamp)]
    });
  }

  /**
   * Find analyses by user ID
   */
  async findByUserId(userId: string, limit?: number): Promise<Analysis[]> {
    return this.findMany({
      where: eq(analyses.userId, userId),
      orderBy: [desc(analyses.timestamp)],
      limit
    });
  }

  /**
   * Find recent analyses for a user
   */
  async findRecentByUserId(userId: string, days: number = 30): Promise<Analysis[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.findMany({
      where: and(
        eq(analyses.userId, userId),
        gte(analyses.timestamp, cutoffDate)
      ),
      orderBy: [desc(analyses.timestamp)]
    });
  }

  /**
   * Find analyses by score range
   */
  async findByScoreRange(minScore: number, maxScore: number): Promise<Analysis[]> {
    return this.findMany({
      where: and(
        gte(analyses.overallScore, minScore),
        lte(analyses.overallScore, maxScore)
      ),
      orderBy: [desc(analyses.overallScore)]
    });
  }

  /**
   * Find analyses by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Analysis[]> {
    return this.findMany({
      where: and(
        gte(analyses.timestamp, startDate),
        lte(analyses.timestamp, endDate)
      ),
      orderBy: [desc(analyses.timestamp)]
    });
  }

  /**
   * Get most recent analysis for a URL
   */
  async findLatestByUrl(url: string): Promise<Analysis | null> {
    const results = await this.findMany({
      where: eq(analyses.url, url),
      orderBy: [desc(analyses.timestamp)],
      limit: 1
    });
    return results[0] || null;
  }

  /**
   * Get all analyses ordered by most recent
   */
  async findAllOrderedByTimestamp(): Promise<Analysis[]> {
    return this.findMany({
      orderBy: [desc(analyses.timestamp)]
    });
  }

  /**
   * Get analyses with pagination and optional user filter
   */
  async findWithPagination(options: {
    page: number;
    pageSize: number;
    userId?: string;
  }): Promise<{
    data: Analysis[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const whereClause = options.userId 
      ? eq(analyses.userId, options.userId)
      : undefined;

    return this.paginate({
      page: options.page,
      pageSize: options.pageSize,
      where: whereClause,
      orderBy: [desc(analyses.timestamp)]
    });
  }

  /**
   * Count analyses for a user
   */
  async countByUserId(userId: string): Promise<number> {
    return this.count(eq(analyses.userId, userId));
  }

  /**
   * Count analyses by score category
   */
  async countByScoreCategory(): Promise<{
    excellent: number;
    good: number;
    needsWork: number;
    poor: number;
  }> {
    const [excellent, good, needsWork, poor] = await Promise.all([
      this.count(and(gte(analyses.overallScore, 80), lte(analyses.overallScore, 100))),
      this.count(and(gte(analyses.overallScore, 60), lte(analyses.overallScore, 79))),
      this.count(and(gte(analyses.overallScore, 40), lte(analyses.overallScore, 59))),
      this.count(and(gte(analyses.overallScore, 0), lte(analyses.overallScore, 39)))
    ]);

    return { excellent, good, needsWork, poor };
  }

  /**
   * Delete old analyses (older than specified days)
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.deleteWhere(lte(analyses.timestamp, cutoffDate));
  }

  /**
   * Get average score for all analyses
   */
  async getAverageScore(): Promise<number> {
    // Since we can't use AVG directly with Drizzle ORM in this pattern,
    // we'll fetch all scores and calculate manually
    const allAnalyses = await this.findMany({});
    if (allAnalyses.length === 0) return 0;

    const totalScore = allAnalyses.reduce((sum, analysis) => sum + analysis.overallScore, 0);
    return Math.round(totalScore / allAnalyses.length);
  }

  /**
   * Get score distribution
   */
  async getScoreDistribution(): Promise<{
    scoreRanges: { range: string; count: number }[];
    averageScore: number;
    totalAnalyses: number;
  }> {
    const totalAnalyses = await this.count();
    const averageScore = await this.getAverageScore();

    const scoreRanges = [
      { range: '0-20', count: await this.count(and(gte(analyses.overallScore, 0), lte(analyses.overallScore, 20))) },
      { range: '21-40', count: await this.count(and(gte(analyses.overallScore, 21), lte(analyses.overallScore, 40))) },
      { range: '41-60', count: await this.count(and(gte(analyses.overallScore, 41), lte(analyses.overallScore, 60))) },
      { range: '61-80', count: await this.count(and(gte(analyses.overallScore, 61), lte(analyses.overallScore, 80))) },
      { range: '81-100', count: await this.count(and(gte(analyses.overallScore, 81), lte(analyses.overallScore, 100))) }
    ];

    return { scoreRanges, averageScore, totalAnalyses };
  }
}

// Export singleton instance
export const analysisRepository = new AnalysisRepository();