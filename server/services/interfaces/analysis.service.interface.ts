import { Analysis, InsertAnalysis, SeoAnalysisResult } from '../../../shared/schema';

/**
 * Interface for SEO analysis service operations
 */
export interface IAnalysisService {
  /**
   * Analysis Creation and Management
   */
  createAnalysis(analysisData: InsertAnalysis): Promise<Analysis>;
  updateAnalysis(analysisId: number, analysisData: Partial<InsertAnalysis>): Promise<Analysis | null>;
  deleteAnalysis(analysisId: number): Promise<boolean>;
  
  /**
   * Analysis Retrieval
   */
  getAnalysisById(analysisId: number): Promise<Analysis | null>;
  getAnalysesByUrl(url: string): Promise<Analysis[]>;
  getLatestAnalysisByUrl(url: string): Promise<Analysis | null>;
  getUserAnalyses(userId: string, options?: {
    page?: number;
    pageSize?: number;
    limit?: number;
  }): Promise<{
    analyses: Analysis[];
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  }>;
  getAllAnalyses(options?: {
    page?: number;
    pageSize?: number;
  }): Promise<{
    analyses: Analysis[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>;
  
  /**
   * Analysis Processing
   */
  performAnalysis(url: string, options?: {
    userId?: string;
    targetKeyword?: string;
    includeCompetitorAnalysis?: boolean;
    runDeepContentAnalysis?: boolean;
  }): Promise<SeoAnalysisResult>;
  
  reAnalyzeWithKeyword(analysisId: number, targetKeyword: string): Promise<Analysis>;
  
  /**
   * Analysis Statistics and Insights
   */
  getAnalysisStats(): Promise<{
    totalAnalyses: number;
    averageScore: number;
    scoreDistribution: { range: string; count: number }[];
    categoryBreakdown: {
      excellent: number;
      good: number;
      needsWork: number;
      poor: number;
    };
  }>;
  
  getUserAnalysisStats(userId: string): Promise<{
    totalAnalyses: number;
    averageScore: number;
    recentAnalyses: number;
    improvementTrend: 'improving' | 'declining' | 'stable';
  }>;
  
  /**
   * Analysis Search and Filtering
   */
  searchAnalyses(criteria: {
    query?: string;
    userId?: string;
    minScore?: number;
    maxScore?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }): Promise<{
    analyses: Analysis[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>;
  
  /**
   * Analysis Cleanup
   */
  cleanupOldAnalyses(days: number): Promise<number>;
  
  /**
   * Comparison and Trends
   */
  compareAnalyses(analysisIds: number[]): Promise<{
    analyses: Analysis[];
    comparison: {
      scoreComparison: number[];
      strengthsComparison: string[][];
      weaknessesComparison: string[][];
      recommendations: string[];
    };
  }>;
  
  getUrlTrends(url: string): Promise<{
    analyses: Analysis[];
    trend: {
      direction: 'improving' | 'declining' | 'stable';
      changePercent: number;
      timespan: string;
    };
  }>;
}