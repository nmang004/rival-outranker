// This file contains additional TypeScript types
// that complement our Zod schemas from shared/schema.ts

import { SeoAnalysisResult } from "@shared/schema";

// Action item for SEO improvement recommendations
export interface SeoActionItem {
  id: string;
  priority: number;
  title: string;
  description: string;
  current?: string;
  suggestion?: string;
  example?: string;
}

// Crawler output format
export interface CrawlerOutput {
  url: string;
  title?: string;
  html: string;  // Full HTML content of the page
  meta: {
    description?: string;
    robots?: string;
    viewport?: string;
    canonical?: string;
    ogTags: Record<string, string>;
    twitterTags: Record<string, string>;
  };
  content: {
    text: string;
    wordCount: number;
    paragraphs: string[];
  };
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
  };
  links: {
    internal: {
      url: string;
      text: string;
      broken: boolean;
    }[];
    external: {
      url: string;
      text: string;
    }[];
  };
  images: {
    url: string;
    alt?: string;
    size?: number;
  }[];
  schema: {
    types: string[];
    json: string;
  }[];
  performance: {
    loadTime?: number;
    resourceCount?: number;
    resourceSize?: number;
  };
  security?: {
    hasHttps: boolean;
    hasMixedContent: boolean;
    hasSecurityHeaders: boolean;
  };
  accessibility?: {
    hasAccessibleElements: boolean;
    missingAltText: number;
    hasAriaAttributes: boolean;
    hasProperHeadingStructure: boolean;
  };
  seoIssues?: {
    noindex: boolean;
    brokenLinks: number;
    missingAltText: number;
    duplicateMetaTags: boolean;
    thinContent: boolean;
    missingHeadings: boolean;
    robots: string | null;
  };
  mobileCompatible: boolean;
  statusCode: number;
  error?: string;
  rawHtml?: string;
}

// Page speed metrics with Core Web Vitals
export interface PageSpeedMetrics {
  score: number;
  lcp?: number; // Largest Contentful Paint (ms)
  fid?: number; // First Input Delay (ms)
  cls?: number; // Cumulative Layout Shift (unitless)
  ttfb?: number; // Time to First Byte (ms)
  speedIndex?: number; // Speed Index
}

// Format for visualization data
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// Comparison of analysis results over time
export interface AnalysisComparison {
  currentAnalysis: SeoAnalysisResult;
  previousAnalysis?: SeoAnalysisResult;
  changes: {
    score: number;
    improvements: string[];
    regressions: string[];
  };
  dateCompared: Date;
}

// Content annotation for deep content analysis
export interface ContentAnnotation {
  content: string;
  issue: string;
  suggestion: string;
  position: number;
  severity: 'high' | 'medium' | 'low';
  type: 'structure' | 'readability' | 'semantics' | 'engagement';
}

// Annotated content section for deep content analysis
export interface AnnotatedContentSection {
  content: string;
  annotations: ContentAnnotation[];
}

// Deep content analysis result
export interface DeepContentAnalysisResult {
  overallScore: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
  };
  structure: {
    headingStructure: {
      score: number;
      category: 'excellent' | 'good' | 'needs-work' | 'poor';
      headingsWithKeywords: number;
      totalHeadings: number;
    };
    paragraphStructure: {
      score: number;
      category: 'excellent' | 'good' | 'needs-work' | 'poor';
      avgParagraphLength: number;
      shortParagraphCount: number;
      longParagraphCount: number;
      totalParagraphs: number;
    };
    contentDistribution: {
      score: number;
      category: 'excellent' | 'good' | 'needs-work' | 'poor';
      introductionQuality: number;
      bodyContentQuality: number;
      conclusionQuality: number;
    };
  };
  readability: {
    fleschReadingEase: {
      score: number;
      category: 'excellent' | 'good' | 'needs-work' | 'poor';
      interpretation: string;
    };
    sentenceComplexity: {
      score: number;
      category: 'excellent' | 'good' | 'needs-work' | 'poor';
      avgSentenceLength: number;
      complexSentencePercentage: number;
    };
    wordChoice: {
      score: number;
      category: 'excellent' | 'good' | 'needs-work' | 'poor';
      simpleWordPercentage: number;
      complexWordPercentage: number;
      avgWordLength: number;
    };
  };
  semanticRelevance: {
    topicCoverage: {
      score: number;
      category: 'excellent' | 'good' | 'needs-work' | 'poor';
      keyTopics: string[];
      topicDepthScore: number;
    };
    keywordContext: {
      score: number;
      category: 'excellent' | 'good' | 'needs-work' | 'poor';
      keywordInContext: boolean;
      semanticRelevance: number;
    };
    entityAnalysis: {
      score: number;
      category: 'excellent' | 'good' | 'needs-work' | 'poor';
      entities: {
        type: string;
        name: string;
        frequency: number;
      }[];
    };
  };
  engagement: {
    contentFormats: {
      score: number;
      category: 'excellent' | 'good' | 'needs-work' | 'poor';
      hasLists: boolean;
      hasTables: boolean;
      hasBlockquotes: boolean;
      hasHighlightedText: boolean;
    };
    interactiveElements: {
      score: number;
      category: 'excellent' | 'good' | 'needs-work' | 'poor';
      hasVideos: boolean;
      hasEmbeds: boolean;
      hasInteractiveContent: boolean;
    };
    callsToAction: {
      score: number;
      category: 'excellent' | 'good' | 'needs-work' | 'poor';
      hasCTA: boolean;
      ctaQuality: number;
      ctaCount: number;
    };
  };
  recommendations: string[];
  annotatedContent: {
    title: string;
    introduction: AnnotatedContentSection;
    mainContent: AnnotatedContentSection[];
    conclusion: AnnotatedContentSection;
  };
}
