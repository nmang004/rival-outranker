export interface RankTrackerConfig {
  variant: 'basic' | 'simple' | 'advanced';
  requireAuth: boolean;
  enableCharts: boolean;
  enableExport: boolean;
  enableCompetitorAnalysis: boolean;
  enableKeywordSuggestions: boolean;
  demoMode: boolean;
}

export interface Keyword {
  id: number;
  text: string;
  position?: number;
  url?: string;
  volume?: number;
  difficulty?: number;
  cpc?: string;
  trend?: number[];
  competitorRankings?: CompetitorRanking[];
}

export interface CompetitorRanking {
  competitorUrl: string;
  position: number;
  url: string;
}

export interface Competitor {
  url: string;
  avgPosition?: number;
}

export interface KeywordSuggestion {
  id: number;
  text: string;
  volume?: number;
  difficulty?: number;
  cpc?: string;
  relevance?: number;
}

export interface RankTrackerData {
  id: string;
  status: 'processing' | 'completed' | 'error';
  website: string;
  keywords: Keyword[];
  competitors: Competitor[];
  avgPosition?: number;
  createdAt: string;
  updatedAt: string;
  keywordSuggestions?: KeywordSuggestion[];
  error?: string;
}

export interface RankTrackerFormData {
  website: string;
  keywords: string;
  competitors?: string;
}

export interface RankTrackerFormProps {
  config: RankTrackerConfig;
  onSubmit: (data: RankTrackerFormData) => void;
  isSubmitting: boolean;
}

export interface RankTrackerResultsProps {
  data: RankTrackerData | null;
  loading: boolean;
  error: string | null;
  config: RankTrackerConfig;
}