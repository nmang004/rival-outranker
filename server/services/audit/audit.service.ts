import { RivalAudit, EnhancedRivalAudit } from '../../../shared/schema';
import { crawler } from './crawler.service';
import { AuditAnalyzerService } from './analyzer.service';
import { PageClassificationService } from './page-classification.service';
import { EnhancedAuditAnalyzer } from './enhanced-analyzer.service';
import { SiteStructure, PageCrawlResult } from '../../types/crawler';
import { CrawlerOrchestratorService } from './crawling/crawler-orchestrator.service';

// Re-export for backward compatibility
export type { SiteStructure, PageCrawlResult } from '../../types/crawler';

/**
 * Main Audit Service that orchestrates the rival audit process
 */
export class AuditService {
  private crawler: typeof crawler;
  private analyzer: AuditAnalyzerService;
  private enhancedAnalyzer: EnhancedAuditAnalyzer;
  private classifier: PageClassificationService;
  private orchestrator: CrawlerOrchestratorService;

  constructor() {
    this.crawler = crawler;
    this.analyzer = new AuditAnalyzerService();
    this.enhancedAnalyzer = new EnhancedAuditAnalyzer();
    this.classifier = new PageClassificationService();
    this.orchestrator = new CrawlerOrchestratorService();
  }

  /**
   * Crawl a website and perform a rival audit
   */
  async crawlAndAudit(url: string, progressCallback?: (stage: string, progress: number) => void): Promise<RivalAudit> {
    try {
      console.log(`Starting rival audit for: ${url}`);
      progressCallback?.('Initializing crawl', 0);
      
      // Reset state for new audit
      this.crawler.reset();
      
      // Step 1: Crawl the website
      progressCallback?.('Crawling website', 20);
      const crawlResult = await this.crawler.crawlWebsite(url);
      
      // Step 2: Transform crawler output to the expected format
      progressCallback?.('Processing crawl data', 50);
      const siteStructure = this.transformCrawlResultToSiteStructure(crawlResult);
      
      // Step 3: Classify pages by type
      progressCallback?.('Classifying pages', 70);
      const classifiedStructure = await this.classifier.classifyPages(siteStructure);
      
      // Step 3: Generate audit based on crawled structure
      progressCallback?.('Analyzing SEO factors', 85);
      const audit = this.analyzer.generateAudit(classifiedStructure);
      
      progressCallback?.('Completed', 100);
      console.log(`Completed rival audit for: ${url}`);
      return audit;
      
    } catch (error) {
      console.error(`Error during rival audit for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Crawl a website and perform enhanced 140+ factor audit
   */
  async crawlAndAuditEnhanced(url: string, progressCallback?: (stage: string, progress: number) => void): Promise<EnhancedRivalAudit> {
    try {
      console.log(`Starting enhanced rival audit (140+ factors) for: ${url}`);
      progressCallback?.('Initializing crawl', 0);
      
      // Reset state for new audit
      this.crawler.reset();
      
      // Step 1: Crawl the website
      progressCallback?.('Crawling website', 10);
      const crawlResult = await this.crawler.crawlWebsite(url);
      
      // Step 2: Transform crawler output to the expected format
      progressCallback?.('Processing crawl data', 30);
      const siteStructure = this.transformCrawlResultToSiteStructure(crawlResult);
      
      // Step 3: Classify pages by type
      progressCallback?.('Classifying pages', 40);
      const classifiedStructure = await this.classifier.classifyPages(siteStructure);
      console.log(`[AuditService] Classified site structure - Homepage: ${!!classifiedStructure.homepage}, Contact: ${!!classifiedStructure.contactPage}, Service pages: ${classifiedStructure.servicePages.length}, Location pages: ${classifiedStructure.locationPages.length}, Service area pages: ${classifiedStructure.serviceAreaPages.length}`);
      
      // Step 3: Generate enhanced audit with 140+ factors
      progressCallback?.('Analyzing SEO factors', 50);
      console.log(`[AuditService] Starting enhanced analysis with classified structure`);
      const enhancedAudit = await this.enhancedAnalyzer.analyzeWebsite(classifiedStructure);
      progressCallback?.('Finalizing results', 90);
      console.log(`[AuditService] Enhanced analysis completed - Total factors: ${enhancedAudit.summary.totalFactors}`);
      console.log(`[AuditService] Enhanced categories populated: Content Quality (${enhancedAudit.contentQuality?.items.length || 0}), Technical SEO (${enhancedAudit.technicalSEO?.items.length || 0}), Local SEO (${enhancedAudit.localSEO?.items.length || 0}), UX Performance (${enhancedAudit.uxPerformance?.items.length || 0})`);
      
      progressCallback?.('Completed', 100);
      console.log(`Completed enhanced rival audit for: ${url} - analyzed ${enhancedAudit.summary.totalFactors} factors`);
      return {
        url,
        timestamp: new Date(),
        ...enhancedAudit,
        reachedMaxPages: siteStructure.reachedMaxPages || false,
        analysisMetadata: {
          analysisVersion: "2.0",
          factorCount: enhancedAudit.summary.totalFactors,
          analysisTime: Date.now(),
          crawlerStats: this.getCrawlerStats()
        }
      };
      
    } catch (error) {
      console.error(`Error during enhanced rival audit for ${url}:`, error);
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
      const crawlResult = await (this.crawler as any).continueCrawling?.(url) || { homepage: null, additionalPages: [], siteStructure: {}, stats: {} };
      
      // Transform crawler output to the expected format
      const siteStructure = this.transformCrawlResultToSiteStructure(crawlResult);
      
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
   * Transform crawler output format to SiteStructure format
   * This resolves the data format mismatch between crawler output and analyzer expectations
   */
  private transformCrawlResultToSiteStructure(crawlResult: {
    homepage: any;
    additionalPages: any[];
    siteStructure: any;
    stats: any;
  }): SiteStructure {
    // Transform homepage if it exists
    const homepage = crawlResult.homepage 
      ? this.orchestrator.transformCrawlerOutputToPageResult(crawlResult.homepage)
      : null;

    if (!homepage) {
      throw new Error('No homepage found in crawl result');
    }

    // Transform additional pages
    const additionalPages = (crawlResult.additionalPages || [])
      .map(page => this.orchestrator.transformCrawlerOutputToPageResult(page));

    return {
      homepage,
      contactPage: undefined, // Will be classified in next step
      servicePages: [],
      locationPages: [],
      serviceAreaPages: [],
      otherPages: additionalPages,
      hasSitemapXml: crawlResult.siteStructure?.hasSitemapXml || false,
      reachedMaxPages: crawlResult.siteStructure?.reachedMaxPages || false
    };
  }

  /**
   * Get crawler statistics
   */
  getCrawlerStats() {
    return (this.crawler as any).getCrawlStats?.() || { pagesCrawled: 0, pagesSkipped: 0, errorsEncountered: 0, crawlTime: 0 };
  }
}

// Create and export singleton instance
export const auditService = new AuditService();