// Types for the Rival Rank Tracker feature

// Ranking for a specific keyword
export interface KeywordRanking {
  position: number;
  url: string;
  date: Date;
}

// Competitor ranking for a specific keyword
export interface CompetitorRanking {
  competitorUrl: string;
  position: number;
  url: string;
  date: Date;
}

// Related keyword for a specific primary keyword
export interface RelatedKeyword {
  keyword: string;
  volume: number;
  difficulty: number;
}

// Keyword metrics data
export interface KeywordMetrics {
  volume: number;
  difficulty: number;
  cpc: string | number;
  trend: number[]; // Monthly search volume trend
  relatedKeywords: RelatedKeyword[];
}

// Keyword with tracking data
export interface TrackedKeyword {
  id: number;
  text: string;
  currentRanking?: KeywordRanking;
  competitorRankings?: CompetitorRanking[];
  metrics?: KeywordMetrics;
}

// Competitor data
export interface Competitor {
  url: string;
}

// Rival Rank Tracker analysis
export interface RivalRankTrackerAnalysis {
  id: string;
  status: "processing" | "completed" | "error";
  website: string;
  keywords: TrackedKeyword[];
  competitors: Competitor[];
  avgPosition?: number;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}