import { RivalAudit } from '@shared/schema';
import { crawler } from './crawler.service';
import { AuditAnalyzerService } from './analyzer.service';
import { PageClassificationService } from './page-classification.service';

// Interface for site structure
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

// Interface for page crawl results
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

/**
 * Main Audit Service that orchestrates the rival audit process
 */
export class AuditService {
  private crawler: typeof crawler;
  private analyzer: AuditAnalyzerService;
  private classifier: PageClassificationService;

  constructor() {
    this.crawler = crawler;
    this.analyzer = new AuditAnalyzerService();
    this.classifier = new PageClassificationService();
  }

  /**
   * Crawl a website and perform a rival audit
   */
  async crawlAndAudit(url: string): Promise<RivalAudit> {
    try {
      console.log(`Starting rival audit for: ${url}`);
      
      // Reset state for new audit
      (this.crawler as any).reset?.();
      
      // Step 1: Crawl the website
      const siteStructure = await (this.crawler as any).crawlSite?.(url);
      
      // Step 2: Classify pages by type
      const classifiedStructure = await this.classifier.classifyPages(siteStructure);
      
      // Step 3: Generate audit based on crawled structure
      const audit = this.analyzer.generateAudit(classifiedStructure);
      
      console.log(`Completed rival audit for: ${url}`);
      return audit;
      
    } catch (error) {
      console.error(`Error during rival audit for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Continue an existing crawl (for large sites)
   */
  async continueCrawl(url: string): Promise<RivalAudit> {
    try {
      console.log(`Continuing rival audit for: ${url}`);
      
      // Continue crawling from where we left off
      const siteStructure = await (this.crawler as any).continueCrawl?.(url);
      
      // Classify and analyze the expanded structure
      const classifiedStructure = await this.classifier.classifyPages(siteStructure);
      const audit = this.analyzer.generateAudit(classifiedStructure);
      
      console.log(`Completed continued rival audit for: ${url}`);
      return audit;
      
    } catch (error) {
      console.error(`Error during continued rival audit for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get crawler statistics
   */
  getCrawlerStats() {
    return (this.crawler as any).getStats?.() || {};
  }
}

// Create and export singleton instance
export const auditService = new AuditService();