declare global {
  namespace NodeJS {
    interface Global {
      rivalRankTrackerResults: {
        [key: string]: RivalRankTrackerAnalysis;
      };
    }
  }
}

export interface RivalRankTrackerAnalysis {
  id: string;
  status: "processing" | "completed" | "error";
  website: string;
  keywords: RivalRankTrackerKeyword[];
  competitors: RivalRankTrackerCompetitor[];
  avgPosition?: number;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

export interface RivalRankTrackerKeyword {
  id: number;
  text: string;
  currentRanking?: RivalRankTrackerRanking;
  competitorRankings?: RivalRankTrackerCompetitorRanking[];
  metrics?: {
    volume?: number;
    difficulty?: number;
    cpc?: string;
    trend?: number[];
    relatedKeywords?: RivalRankTrackerRelatedKeyword[];
  };
}

export interface RivalRankTrackerRanking {
  position: number;
  url: string;
  date: Date;
}

export interface RivalRankTrackerCompetitorRanking {
  competitorUrl: string;
  position: number;
  url: string;
  date: Date;
}

export interface RivalRankTrackerRelatedKeyword {
  keyword: string;
  volume?: number;
  difficulty?: number;
}

export interface RivalRankTrackerCompetitor {
  url: string;
}