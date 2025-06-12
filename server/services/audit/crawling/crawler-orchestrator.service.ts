/**
 * Crawler Orchestrator Service
 * Main coordination service that orchestrates all crawling operations using specialized services
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import * as https from 'https';
import * as dns from 'dns';
import { promisify } from 'util';
import { PagePriorityService, PagePriority } from '../page-priority.service';
import { CMSDetectionService } from './cms-detection.service';
import { ContentSimilarityService } from './content-similarity.service';
import { URLManagementService } from './url-management.service';
import { SitemapDiscoveryService } from './sitemap-discovery.service';
import { PuppeteerHandlerService } from './puppeteer-handler.service';

// TODO: Define CrawlerOutput type properly
type CrawlerOutput = any;

// DNS lookup with promise support
const dnsLookup = promisify(dns.lookup);
const dnsResolve = promisify(dns.resolve);

export class CrawlerOrchestratorService {
  // Configuration constants
  private MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB limit for HTML content
  private REQUEST_TIMEOUT = 45000; // 45 seconds timeout (will be dynamically adjusted)
  private adaptiveTimeout = 45000; // Current adaptive timeout
  private MIN_TIMEOUT = 8000; // Minimum timeout (8 seconds)
  private MAX_TIMEOUT = 45000; // Maximum timeout
  private USER_AGENT = 'SEO-Best-Practices-Assessment-Tool/1.0';
  private MAX_REDIRECTS = 10; // Maximum number of redirects to follow
  private CRAWL_DELAY = 500; // Delay between requests in milliseconds
  private MAX_PAGES = 250; // Maximum pages to crawl per site
  private CONCURRENT_REQUESTS = 5; // Base concurrent requests (will be dynamically adjusted)
  private MAX_CONCURRENT_REQUESTS = 25; // Maximum allowed concurrent requests
  private MIN_CONCURRENT_REQUESTS = 3; // Minimum concurrent requests
  private adaptiveConcurrency = 5; // Current adaptive concurrency level

  // Specialized services
  private pagePriorityService = new PagePriorityService();
  private cmsDetectionService = new CMSDetectionService();
  private contentSimilarityService = new ContentSimilarityService();
  private urlManagementService = new URLManagementService();
  private sitemapDiscoveryService = new SitemapDiscoveryService();
  private puppeteerHandlerService = new PuppeteerHandlerService();

  // Caching and state management
  private dnsCache = new Map<string, string>();
  private responseCache = new Map<string, any>();
  private brokenLinks = new Set<string>();
  
  // Circuit breaker for problematic domains
  private timeoutCounts = new Map<string, number>();
  private domainBlacklist = new Set<string>();
  private MAX_TIMEOUT_FAILURES = 3; // Max timeouts before blacklisting domain patterns

  // Performance tracking for adaptive concurrency
  private performanceWindow: Array<{timestamp: number, responseTime: number}> = [];
  private lastConcurrencyAdjustment = 0;

  // Crawling state
  private crawledUrls = new Set<string>();
  private pendingUrls: string[] = [];
  private currentSite: string = '';
  private stats = {
    pagesCrawled: 0,
    pagesSkipped: 0,
    errorsEncountered: 0,
    startTime: 0,
    endTime: 0
  };

  /**
   * Main crawling orchestration method
   */
  async crawlWebsite(initialUrl: string, options: {
    maxPages?: number;
    useJavaScript?: boolean;
    maxDepth?: number;
    followSitemaps?: boolean;
  } = {}): Promise<{
    homepage: CrawlerOutput;
    additionalPages: CrawlerOutput[];
    siteStructure: any;
    stats: any;
  }> {
    console.log(`[CrawlerOrchestrator] 🚀 Starting website crawl: ${initialUrl}`);
    
    // Initialize crawl session
    this.initializeCrawlSession(initialUrl, options);
    
    try {
      // Step 1: Crawl homepage and detect CMS
      const homepage = await this.crawlPage(initialUrl);
      if (!homepage || homepage.status !== 'success') {
        throw new Error(`Failed to crawl homepage: ${initialUrl}`);
      }

      // Step 2: Detect CMS and fingerprint site
      const siteFingerprint = this.cmsDetectionService.detectCMSAndFingerprint(
        homepage.content?.html || '', 
        homepage.headers || {}, 
        initialUrl
      );

      // Step 3: Discover URLs through sitemaps if enabled
      let discoveredUrls: string[] = [];
      if (options.followSitemaps !== false) {
        discoveredUrls = await this.sitemapDiscoveryService.discoverUrlsFromSitemap(
          initialUrl,
          this.adaptiveTimeout
        );
      }

      // Step 4: Extract internal links from homepage
      const internalLinks = this.extractInternalLinks(homepage.content?.html || '', initialUrl);
      
      // Step 5: Combine and prioritize all discovered URLs
      const allUrls = [...new Set([...discoveredUrls, ...internalLinks])];
      const prioritizedUrls = this.urlManagementService.prioritizeUrlsByImportance(allUrls, initialUrl);
      
      // Step 6: Apply filtering and preprocessing
      const filteredUrls = await this.preprocessUrls(prioritizedUrls);
      
      // Step 7: Crawl additional pages
      const additionalPages = await this.crawlAdditionalPages(filteredUrls, options);

      // Step 8: Build site structure analysis
      const siteStructure = this.analyzeSiteStructure(homepage, additionalPages, siteFingerprint);

      // Step 9: Finalize crawl session
      this.finalizeCrawlSession();

      return {
        homepage,
        additionalPages,
        siteStructure,
        stats: this.getCrawlStats()
      };

    } catch (error) {
      console.error('[CrawlerOrchestrator] ❌ Crawl failed:', error);
      this.finalizeCrawlSession();
      throw error;
    }
  }

  /**
   * Crawl a single page with full error handling and caching
   */
  async crawlPage(url: string): Promise<CrawlerOutput> {
    try {
      console.log(`[CrawlerOrchestrator] 📄 Crawling page: ${url}`);
      
      // Check if URL should be skipped
      if (this.urlManagementService.shouldSkipUrl(url)) {
        return this.createErrorOutput(url, "Skipped Page", 0, "Skipped due to blacklist or duplicate pattern");
      }

      // Normalize URL
      const normalizedUrl = this.urlManagementService.normalizeUrl(url);
      
      // Check cache first
      if (this.responseCache.has(normalizedUrl)) {
        console.log(`[CrawlerOrchestrator] 💾 Using cached response for: ${normalizedUrl}`);
        return this.responseCache.get(normalizedUrl);
      }

      // Check DNS availability
      const dnsResult = await this.checkDomainAvailability(normalizedUrl);
      if (!dnsResult.available) {
        const errorOutput = this.createErrorOutput(normalizedUrl, "DNS Error", -1, `Domain not available: ${dnsResult.error}`);
        this.responseCache.set(normalizedUrl, errorOutput);
        return errorOutput;
      }

      // Determine if we should use Puppeteer for this page
      const shouldUsePuppeteer = this.puppeteerHandlerService.shouldUsePuppeteerForPage(normalizedUrl);
      
      let crawlResult: CrawlerOutput;
      if (shouldUsePuppeteer) {
        console.log(`[CrawlerOrchestrator] 🤖 Using Puppeteer for JS-heavy page: ${normalizedUrl}`);
        crawlResult = await this.puppeteerHandlerService.crawlPageWithPuppeteer(normalizedUrl);
      } else {
        console.log(`[CrawlerOrchestrator] 🌐 Using standard HTTP crawl: ${normalizedUrl}`);
        crawlResult = await this.standardCrawlPage(normalizedUrl);
      }

      // Check for content similarity
      if (crawlResult.status === 'success' && crawlResult.content?.html) {
        const similarityCheck = this.contentSimilarityService.checkContentSimilarity(
          crawlResult.content.html, 
          normalizedUrl
        );
        
        if (similarityCheck.isDuplicate) {
          console.log(`[CrawlerOrchestrator] 🔄 Duplicate content detected: ${normalizedUrl} (similar to ${similarityCheck.similarUrl})`);
          crawlResult.isDuplicate = true;
          crawlResult.similarUrl = similarityCheck.similarUrl;
          crawlResult.similarity = similarityCheck.similarity;
        }
      }

      // Cache successful results
      if (crawlResult.status === 'success') {
        this.responseCache.set(normalizedUrl, crawlResult);
      }

      this.stats.pagesCrawled++;
      return crawlResult;

    } catch (error) {
      console.error(`[CrawlerOrchestrator] ❌ Error crawling ${url}:`, error);
      this.stats.errorsEncountered++;
      return this.createErrorOutput(url, "Crawl Error", -1, error.message);
    }
  }

  /**
   * Standard HTTP-based crawling (non-Puppeteer)
   */
  private async standardCrawlPage(url: string): Promise<CrawlerOutput> {
    const startTime = Date.now();
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      timeout: this.adaptiveTimeout
    });

    const response = await axios.get(url, {
      headers: {
        "User-Agent": this.USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml",
        "Accept-Language": "en-US,en;q=0.9"
      },
      timeout: this.adaptiveTimeout,
      maxContentLength: this.MAX_CONTENT_SIZE,
      maxRedirects: this.MAX_REDIRECTS,
      httpsAgent,
      validateStatus: function (status) {
        return status < 600; // Accept all status codes under 600
      }
    });

    const responseTime = Date.now() - startTime;
    this.trackPerformanceAndAdjustConcurrency(responseTime);

    // Process response with cheerio
    const $ = cheerio.load(response.data);
    
    return {
      url,
      status: 'success',
      statusCode: response.status,
      headers: response.headers,
      responseTime,
      content: this.extractPageContent($, response.data, url),
      meta: this.extractMetaTags($),
      links: this.extractLinks($, url),
      images: this.extractImages($),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Initialize crawl session
   */
  private initializeCrawlSession(initialUrl: string, options: any): void {
    this.currentSite = new URL(initialUrl).hostname;
    this.stats = {
      pagesCrawled: 0,
      pagesSkipped: 0,
      errorsEncountered: 0,
      startTime: Date.now(),
      endTime: 0
    };

    // Reset service states
    this.cmsDetectionService.reset();
    this.contentSimilarityService.clearContentHashes();
    this.urlManagementService.reset();
    this.sitemapDiscoveryService.reset();

    // Apply options
    if (options.maxPages) {
      this.MAX_PAGES = options.maxPages;
    }

    console.log(`[CrawlerOrchestrator] 🎯 Crawl session initialized for ${this.currentSite}`);
  }

  /**
   * Preprocess URLs with filtering and validation
   */
  private async preprocessUrls(urls: string[]): Promise<string[]> {
    console.log(`[CrawlerOrchestrator] 🔧 Preprocessing ${urls.length} URLs...`);
    
    // Apply URL management filtering
    const prefiltered = await this.urlManagementService.prefilterUrls(urls, this.adaptiveTimeout);
    
    // Apply CMS-specific filtering
    const cmsFiltered = this.cmsDetectionService.applyCMSFiltering(prefiltered);
    
    // Limit to max pages
    const limited = cmsFiltered.slice(0, this.MAX_PAGES - 1); // Reserve space for homepage
    
    console.log(`[CrawlerOrchestrator] ✅ Preprocessing complete: ${urls.length} → ${limited.length} URLs`);
    
    return limited;
  }

  /**
   * Crawl additional pages in parallel batches
   */
  private async crawlAdditionalPages(urls: string[], options: any): Promise<CrawlerOutput[]> {
    const results: CrawlerOutput[] = [];
    let crawledCount = 0;

    console.log(`[CrawlerOrchestrator] 📚 Crawling ${urls.length} additional pages...`);

    // Process URLs in batches
    for (let i = 0; i < urls.length && crawledCount < this.MAX_PAGES - 1; i += this.adaptiveConcurrency) {
      const batch = urls.slice(i, i + this.adaptiveConcurrency);
      
      const batchPromises = batch.map(async (url) => {
        if (crawledCount >= this.MAX_PAGES - 1) return null;
        
        await this.delay(this.CRAWL_DELAY); // Rate limiting
        const result = await this.crawlPage(url);
        crawledCount++;
        return result;
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      }
    }

    console.log(`[CrawlerOrchestrator] ✅ Additional page crawling complete: ${results.length} pages`);
    return results;
  }

  /**
   * Extract internal links from HTML content
   */
  private extractInternalLinks(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const links: string[] = [];
    const baseHostname = new URL(baseUrl).hostname;

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        try {
          const absoluteUrl = new URL(href, baseUrl).toString();
          const linkHostname = new URL(absoluteUrl).hostname;
          
          if (linkHostname === baseHostname) {
            links.push(absoluteUrl);
          }
        } catch (error) {
          // Invalid URL, skip
        }
      }
    });

    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Extract page content using cheerio
   */
  private extractPageContent($: cheerio.CheerioAPI, html: string, url: string): any {
    return {
      title: $('title').text()?.trim() || '',
      html: html,
      text: $('body').text()?.replace(/\s+/g, ' ').trim() || '',
      headings: {
        h1: $('h1').map((_, el) => $(el).text().trim()).get(),
        h2: $('h2').map((_, el) => $(el).text().trim()).get(),
        h3: $('h3').map((_, el) => $(el).text().trim()).get(),
        h4: $('h4').map((_, el) => $(el).text().trim()).get(),
        h5: $('h5').map((_, el) => $(el).text().trim()).get(),
        h6: $('h6').map((_, el) => $(el).text().trim()).get(),
      },
      paragraphs: $('p').map((_, el) => $(el).text().trim()).get().filter(p => p.length > 0),
      wordCount: $('body').text().split(/\s+/).length,
      hasContent: $('body').text().trim().length > 100
    };
  }

  /**
   * Extract meta tags from HTML
   */
  private extractMetaTags($: cheerio.CheerioAPI): any {
    return {
      description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content'),
      robots: $('meta[name="robots"]').attr('content'),
      viewport: $('meta[name="viewport"]').attr('content'),
      canonical: $('link[rel="canonical"]').attr('href'),
      ogTags: this.extractOGTags($),
      twitterTags: this.extractTwitterTags($)
    };
  }

  /**
   * Extract Open Graph tags
   */
  private extractOGTags($: cheerio.CheerioAPI): Record<string, string> {
    const ogTags: Record<string, string> = {};
    $('meta[property^="og:"]').each((_, el) => {
      const property = $(el).attr('property');
      const content = $(el).attr('content');
      if (property && content) {
        ogTags[property.replace('og:', '')] = content;
      }
    });
    return ogTags;
  }

  /**
   * Extract Twitter Card tags
   */
  private extractTwitterTags($: cheerio.CheerioAPI): Record<string, string> {
    const twitterTags: Record<string, string> = {};
    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr('name');
      const content = $(el).attr('content');
      if (name && content) {
        twitterTags[name.replace('twitter:', '')] = content;
      }
    });
    return twitterTags;
  }

  /**
   * Extract links from HTML
   */
  private extractLinks($: cheerio.CheerioAPI, baseUrl: string): any {
    const links = {
      internal: [] as string[],
      external: [] as string[],
      total: 0
    };

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        try {
          const absoluteUrl = new URL(href, baseUrl).toString();
          const isExternal = this.urlManagementService.isExternalUrl(absoluteUrl, baseUrl);
          
          if (isExternal) {
            links.external.push(absoluteUrl);
          } else {
            links.internal.push(absoluteUrl);
          }
          links.total++;
        } catch (error) {
          // Invalid URL, skip
        }
      }
    });

    return links;
  }

  /**
   * Extract images from HTML
   */
  private extractImages($: cheerio.CheerioAPI): any {
    const images: any[] = [];
    
    $('img').each((_, element) => {
      const $img = $(element);
      const src = $img.attr('src');
      const alt = $img.attr('alt');
      const title = $img.attr('title');
      
      if (src) {
        images.push({
          src,
          alt: alt || '',
          title: title || '',
          hasAlt: !!alt,
          width: $img.attr('width'),
          height: $img.attr('height')
        });
      }
    });

    return {
      total: images.length,
      withAlt: images.filter(img => img.hasAlt).length,
      withoutAlt: images.filter(img => !img.hasAlt).length,
      images: images
    };
  }

  /**
   * Check domain availability via DNS
   */
  private async checkDomainAvailability(url: string): Promise<{ available: boolean; error?: string }> {
    try {
      const hostname = new URL(url).hostname;
      
      if (this.dnsCache.has(hostname)) {
        return { available: true };
      }

      await dnsLookup(hostname);
      this.dnsCache.set(hostname, hostname);
      return { available: true };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Track performance and adjust concurrency
   */
  private trackPerformanceAndAdjustConcurrency(responseTime: number): void {
    const now = Date.now();
    this.performanceWindow.push({ timestamp: now, responseTime });
    
    // Keep only recent performance data (last 30 seconds)
    this.performanceWindow = this.performanceWindow.filter(
      entry => now - entry.timestamp < 30000
    );

    // Adjust concurrency based on performance (every 10 seconds)
    if (now - this.lastConcurrencyAdjustment > 10000 && this.performanceWindow.length > 5) {
      const avgResponseTime = this.performanceWindow.reduce((sum, entry) => sum + entry.responseTime, 0) / this.performanceWindow.length;
      
      if (avgResponseTime > 5000 && this.adaptiveConcurrency > this.MIN_CONCURRENT_REQUESTS) {
        this.adaptiveConcurrency = Math.max(this.MIN_CONCURRENT_REQUESTS, this.adaptiveConcurrency - 1);
        console.log(`[CrawlerOrchestrator] 🐌 Reducing concurrency to ${this.adaptiveConcurrency} (avg response: ${Math.round(avgResponseTime)}ms)`);
      } else if (avgResponseTime < 2000 && this.adaptiveConcurrency < this.MAX_CONCURRENT_REQUESTS) {
        this.adaptiveConcurrency = Math.min(this.MAX_CONCURRENT_REQUESTS, this.adaptiveConcurrency + 1);
        console.log(`[CrawlerOrchestrator] 🚀 Increasing concurrency to ${this.adaptiveConcurrency} (avg response: ${Math.round(avgResponseTime)}ms)`);
      }
      
      this.lastConcurrencyAdjustment = now;
    }
  }

  /**
   * Analyze site structure from crawled pages
   */
  private analyzeSiteStructure(homepage: CrawlerOutput, additionalPages: CrawlerOutput[], fingerprint: any): any {
    const allPages = [homepage, ...additionalPages];
    const successfulPages = allPages.filter(page => page.status === 'success');
    
    return {
      totalPages: allPages.length,
      successfulPages: successfulPages.length,
      failedPages: allPages.length - successfulPages.length,
      cmsDetected: this.cmsDetectionService.getDetectedCMS(),
      siteFingerprint: fingerprint,
      hasJavaScript: successfulPages.some(page => 
        this.puppeteerHandlerService.detectJavaScriptHeavySite(page.content?.html || '', page.url)
      ),
      averagePageSize: successfulPages.reduce((sum, page) => 
        sum + (page.content?.html?.length || 0), 0) / successfulPages.length,
      totalWords: successfulPages.reduce((sum, page) => 
        sum + (page.content?.wordCount || 0), 0),
      uniqueImages: new Set(
        successfulPages.flatMap(page => 
          page.images?.images?.map((img: any) => img.src) || []
        )
      ).size,
      sitemapsFound: this.sitemapDiscoveryService.hasSitemap(),
      duplicateContent: successfulPages.filter(page => page.isDuplicate).length
    };
  }

  /**
   * Create error output for failed crawls
   */
  private createErrorOutput(url: string, errorType: string, statusCode: number, message: string): CrawlerOutput {
    return {
      url,
      status: 'error',
      statusCode,
      errorType,
      errorMessage: message,
      timestamp: new Date().toISOString(),
      content: null,
      meta: {},
      links: { internal: [], external: [], total: 0 },
      images: { total: 0, withAlt: 0, withoutAlt: 0, images: [] }
    };
  }

  /**
   * Finalize crawl session
   */
  private finalizeCrawlSession(): void {
    this.stats.endTime = Date.now();
    console.log(`[CrawlerOrchestrator] 🏁 Crawl session completed for ${this.currentSite}`);
    console.log(`[CrawlerOrchestrator] 📊 Stats:`, this.getCrawlStats());
    
    // Cleanup services
    this.puppeteerHandlerService.closePuppeteerCluster();
    this.contentSimilarityService.cleanupOldHashes();
  }

  /**
   * Get crawl statistics
   */
  private getCrawlStats(): any {
    const duration = this.stats.endTime > 0 ? this.stats.endTime - this.stats.startTime : Date.now() - this.stats.startTime;
    
    return {
      ...this.stats,
      duration,
      averagePageTime: this.stats.pagesCrawled > 0 ? duration / this.stats.pagesCrawled : 0,
      successRate: this.stats.pagesCrawled / (this.stats.pagesCrawled + this.stats.errorsEncountered),
      contentSimilarityStats: this.contentSimilarityService.getDebugStats(),
      sitemapStats: this.sitemapDiscoveryService.getStats()
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current configuration
   */
  getConfiguration(): any {
    return {
      maxPages: this.MAX_PAGES,
      concurrentRequests: this.adaptiveConcurrency,
      crawlDelay: this.CRAWL_DELAY,
      timeout: this.adaptiveTimeout,
      userAgent: this.USER_AGENT,
      cmsDetected: this.cmsDetectionService.getDetectedCMS(),
      puppeteerEnabled: this.puppeteerHandlerService.isPuppeteerAvailable()
    };
  }

  /**
   * Reset crawler state for new session
   */
  reset(): void {
    this.crawledUrls.clear();
    this.pendingUrls = [];
    this.responseCache.clear();
    this.brokenLinks.clear();
    this.dnsCache.clear();
    this.performanceWindow = [];
    
    // Reset all services
    this.cmsDetectionService.reset();
    this.contentSimilarityService.clearContentHashes();
    this.urlManagementService.reset();
    this.sitemapDiscoveryService.reset();
    
    console.log('[CrawlerOrchestrator] 🔄 Crawler state reset');
  }
}