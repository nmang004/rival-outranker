import { 
  Keyword, 
  InsertKeyword, 
  KeywordMetrics, 
  KeywordRanking, 
  KeywordSuggestion 
} from '@shared/schema';

/**
 * Interface for keyword service operations
 */
export interface IKeywordService {
  /**
   * Keyword Management
   */
  createKeyword(userId: string, keywordData: Omit<InsertKeyword, 'userId'>): Promise<Keyword>;
  updateKeyword(keywordId: number, userId: string, updates: Partial<InsertKeyword>): Promise<Keyword | null>;
  deleteKeyword(keywordId: number, userId: string): Promise<boolean>;
  activateKeyword(keywordId: number, userId: string): Promise<Keyword | null>;
  deactivateKeyword(keywordId: number, userId: string): Promise<Keyword | null>;
  
  /**
   * Keyword Retrieval
   */
  getKeywordById(keywordId: number, userId: string): Promise<Keyword | null>;
  getUserKeywords(userId: string, options?: { activeOnly?: boolean }): Promise<Keyword[]>;
  getProjectKeywords(projectId: number, userId: string): Promise<Keyword[]>;
  
  /**
   * Keyword Research
   */
  researchKeywords(baseKeyword: string, options?: {
    location?: string;
    includeQuestions?: boolean;
    includeAutocomplete?: boolean;
    limit?: number;
  }): Promise<KeywordSuggestion[]>;
  
  saveKeywordSuggestion(userId: string, suggestionId: number): Promise<boolean>;
  getSavedSuggestions(userId: string): Promise<KeywordSuggestion[]>;
  
  /**
   * Keyword Metrics and Analysis
   */
  updateKeywordMetrics(keywordId: number, metrics: Partial<KeywordMetrics>): Promise<KeywordMetrics | null>;
  getKeywordMetrics(keywordId: number): Promise<KeywordMetrics | null>;
  analyzeKeywordDifficulty(keyword: string): Promise<{
    difficulty: number;
    competition: number;
    searchVolume: number;
    cpc: number;
  }>;
  
  /**
   * Ranking Tracking
   */
  addRankingData(keywordId: number, rankingData: {
    rank?: number;
    previousRank?: number;
    rankingUrl?: string;
    location?: string;
    device?: string;
  }): Promise<KeywordRanking>;
  
  getKeywordRankings(keywordId: number, options?: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<KeywordRanking[]>;
  
  getRankingTrends(keywordId: number, days?: number): Promise<{
    rankings: KeywordRanking[];
    trend: 'improving' | 'declining' | 'stable';
    changePercent: number;
    bestRank: number;
    averageRank: number;
  }>;
  
  /**
   * Bulk Operations
   */
  bulkImportKeywords(userId: string, keywords: Array<{
    keyword: string;
    targetUrl: string;
    projectId?: number;
    notes?: string;
  }>): Promise<{
    successful: Keyword[];
    failed: Array<{ keyword: string; error: string }>;
  }>;
  
  bulkUpdateRankings(rankings: Array<{
    keywordId: number;
    rank?: number;
    rankingUrl?: string;
  }>): Promise<KeywordRanking[]>;
  
  /**
   * Statistics and Insights
   */
  getUserKeywordStats(userId: string): Promise<{
    totalKeywords: number;
    activeKeywords: number;
    averageRank: number;
    improvingKeywords: number;
    decliningKeywords: number;
    topKeywords: Array<{
      keyword: Keyword;
      currentRank?: number;
      previousRank?: number;
    }>;
  }>;
  
  getKeywordOpportunities(userId: string): Promise<Array<{
    keyword: string;
    searchVolume: number;
    difficulty: number;
    opportunity: 'high' | 'medium' | 'low';
    reason: string;
  }>>;
  
  /**
   * Competitor Analysis
   */
  analyzeCompetitorKeywords(targetUrl: string, competitorUrls: string[]): Promise<{
    keywordGaps: Array<{
      keyword: string;
      competitorRank: number;
      targetRank?: number;
      searchVolume: number;
      difficulty: number;
    }>;
    sharedKeywords: Array<{
      keyword: string;
      targetRank: number;
      competitorRank: number;
      rankDifference: number;
    }>;
  }>;
  
  /**
   * Validation and Authorization
   */
  userOwnsKeyword(userId: string, keywordId: number): Promise<boolean>;
  validateKeywordAccess(userId: string, keywordId: number): Promise<boolean>;
}