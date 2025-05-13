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
