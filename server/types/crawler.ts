/**
 * Crawler Types - Data structures for web crawling and analysis
 * This file defines the proper type interfaces for crawler output and related data structures
 */

// Main CrawlerOutput interface - output from Puppeteer and standard crawling
export interface CrawlerOutput {
  url: string;
  title: string;
  statusCode: number;
  status?: string; // 'success' | 'error' | 'skipped'
  headers?: Record<string, any>;
  responseTime?: number;
  timestamp?: string;
  isDuplicate?: boolean;
  similarUrl?: string;
  similarity?: number;
  meta: {
    description: string;
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
    html?: string; // Additional HTML content property
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
    internal: string[];
    external: string[];
    total?: number; // Additional property for total link count
  };
  images: Array<{
    src: string;
    alt: string;
    title?: string;
    size?: number;
    total?: number; // Additional property for backward compatibility
  }>;
  schema: Array<{
    type?: string;
    types?: string[];
    json?: string;
    [key: string]: any; // For backward compatibility with any[]
  }>;
  mobileCompatible: boolean;
  performance: {
    loadTime: number;
    resourceCount: number;
    resourceSize: number;
  };
  security: {
    hasHttps: boolean;
    hasMixedContent: boolean;
    hasSecurityHeaders: boolean;
  };
  accessibility: {
    hasAccessibleElements: boolean;
    missingAltText: number;
    hasAriaAttributes: boolean;
    hasProperHeadingStructure: boolean;
  };
  seoIssues: {
    noindex: boolean;
    brokenLinks: number;
    missingAltText: number;
    duplicateMetaTags: boolean;
    thinContent: boolean;
    missingHeadings: boolean;
    robots: string | null;
  };
  html: string;
  rawHtml: string;
  error?: string;
  puppeteerUsed?: boolean;
}

// PageCrawlResult interface - expected format for analyzers
export interface PageCrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  bodyText: string;
  rawHtml: string;
  h1s: string[];
  h2s: string[];
  h3s: string[];
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  links: {
    internal: string[];
    external: string[];
    broken: string[];
  };
  hasContactForm: boolean;
  hasPhoneNumber: boolean;
  hasAddress: boolean;
  hasNAP: boolean;
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
    largeImages: number;
    altTexts: string[];
  };
  hasSchema: boolean;
  schemaTypes: string[];
  mobileFriendly: boolean;
  wordCount: number;
  hasSocialTags: boolean;
  hasCanonical: boolean;
  hasRobotsMeta: boolean;
  hasIcon: boolean;
  hasHttps: boolean;
  hasHreflang: boolean;
  hasSitemap: boolean;
  hasAmpVersion: boolean;
  pageLoadSpeed: {
    score: number;
    firstContentfulPaint: number;
    totalBlockingTime: number;
    largestContentfulPaint: number;
  };
  keywordDensity: Record<string, number>;
  readabilityScore: number;
  contentStructure: {
    hasFAQs: boolean;
    hasTable: boolean;
    hasLists: boolean;
    hasVideo: boolean;
    hasEmphasis: boolean;
  };
}

// Site structure interface
export interface SiteStructure {
  homepage: PageCrawlResult;
  contactPage?: PageCrawlResult;
  servicePages: PageCrawlResult[];
  locationPages: PageCrawlResult[];
  serviceAreaPages: PageCrawlResult[];
  otherPages: PageCrawlResult[];
  hasSitemapXml: boolean;
  reachedMaxPages?: boolean;
}

// Crawl options interface
export interface CrawlOptions {
  maxPages?: number;
  useJavaScript?: boolean;
  maxDepth?: number;
  followSitemaps?: boolean;
}

// Crawl result with statistics
export interface CrawlResult {
  homepage: CrawlerOutput;
  additionalPages: CrawlerOutput[];
  siteStructure: any;
  stats: {
    pagesCrawled: number;
    pagesSkipped: number;
    errorsEncountered: number;
    startTime: number;
    endTime: number;
  };
}