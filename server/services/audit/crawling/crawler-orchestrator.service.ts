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
import { CrawlerOutput, PageCrawlResult } from '../../../types/crawler';

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
    
    // Pre-initialize Puppeteer cluster for potential use
    try {
      await this.puppeteerHandlerService.initializePuppeteerCluster();
    } catch (error) {
      console.log(`[CrawlerOrchestrator] ⚠️ Puppeteer initialization failed, will use standard crawling only:`, error);
    }
    
    try {
      // Step 1: Crawl homepage and detect CMS
      const homepage = await this.crawlPage(initialUrl);
      if (!homepage || homepage.status !== 'success') {
        throw new Error(`Failed to crawl homepage: ${initialUrl}`);
      }

      // Step 2: Detect CMS and fingerprint site
      const siteFingerprint = this.cmsDetectionService.detectCMSAndFingerprint(
        homepage.html || '', 
        homepage.headers || {}, 
        initialUrl
      );

      // Step 3: Discover URLs through sitemaps if enabled
      let discoveredUrls: string[] = [];
      if (options.followSitemaps !== false) {
        try {
          discoveredUrls = await this.sitemapDiscoveryService.discoverUrlsFromSitemap(
            initialUrl,
            this.currentSite
          );
        } catch (error) {
          console.log(`[CrawlerOrchestrator] WARN: Sitemap discovery failed, continuing with crawl: ${error instanceof Error ? error.message : 'Unknown error'}`);
          discoveredUrls = [];
        }
      }

      // Step 4: Extract internal links from homepage
      const internalLinks = this.extractInternalLinks(homepage.html || '', initialUrl);
      
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
      if (this.urlManagementService.shouldSkipUrl(url, this.crawledUrls)) {
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

      // Perform lightweight JS detection first
      let isJsHeavy = false;
      try {
        // Quick HTTP request to analyze content for JS patterns
        const response = await axios.get(normalizedUrl, {
          headers: { "User-Agent": this.USER_AGENT },
          timeout: 10000,
          maxContentLength: 1024 * 1024, // 1MB for detection only
          httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
        isJsHeavy = this.puppeteerHandlerService.detectJavaScriptHeavySite(response.data, normalizedUrl);
      } catch (error) {
        // If detection fails, assume not JS-heavy and continue with standard crawl
        console.log(`[CrawlerOrchestrator] JS detection failed for ${normalizedUrl}, using standard crawl`);
      }

      // Determine if we should use Puppeteer for this page
      const shouldUsePuppeteer = this.puppeteerHandlerService.shouldUsePuppeteerForPage(normalizedUrl, isJsHeavy);
      
      let crawlResult: CrawlerOutput;
      if (shouldUsePuppeteer) {
        console.log(`[CrawlerOrchestrator] 🤖 Using Puppeteer for Tier 1 JS-heavy page: ${normalizedUrl}`);
        crawlResult = await this.puppeteerHandlerService.crawlPageWithPuppeteer(normalizedUrl);
      } else {
        console.log(`[CrawlerOrchestrator] 🌐 Using standard HTTP crawl: ${normalizedUrl} (JS-heavy: ${isJsHeavy})`);
        crawlResult = await this.standardCrawlPage(normalizedUrl);
      }

      // Check for content similarity
      if (crawlResult.status === 'success' && crawlResult.html) {
        const similarityCheck = this.contentSimilarityService.checkContentSimilarity(
          crawlResult.html, 
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
      return this.createErrorOutput(url, "Crawl Error", -1, error instanceof Error ? error.message : String(error));
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
      title: $('title').text() || '',
      status: 'success',
      statusCode: response.status,
      headers: response.headers,
      responseTime,
      timestamp: new Date().toISOString(),
      content: this.extractPageContent($, response.data, url),
      meta: this.extractMetaTags($),
      headings: this.extractHeadings($),
      links: this.extractLinks($, url),
      images: this.extractImages($),
      schema: this.extractSchemaMarkup($),
      mobileCompatible: this.checkMobileCompatibility($),
      performance: {
        loadTime: responseTime,
        resourceCount: 0, // Would need deeper analysis
        resourceSize: response.data.length
      },
      security: {
        hasHttps: url.startsWith('https://'),
        hasMixedContent: false, // Would need deeper analysis
        hasSecurityHeaders: Object.keys(response.headers).some(h => 
          h.toLowerCase().includes('security') || 
          h.toLowerCase().includes('strict-transport-security') ||
          h.toLowerCase().includes('content-security-policy')
        )
      },
      accessibility: {
        hasAccessibleElements: $('[alt], [aria-label], [aria-describedby]').length > 0,
        missingAltText: $('img:not([alt])').length,
        hasAriaAttributes: $('*').filter((_, el) => {
          if (el.type === 'tag' && el.attribs) {
            const attributes = Object.keys(el.attribs);
            return attributes.some(attr => attr.startsWith('aria-'));
          }
          return false;
        }).length > 0,
        hasProperHeadingStructure: $('h1').length === 1
      },
      seoIssues: {
        noindex: $('meta[name="robots"]').attr('content')?.includes('noindex') || false,
        brokenLinks: 0, // Would need link checking
        missingAltText: $('img:not([alt])').length,
        duplicateMetaTags: false, // Would need deeper analysis
        thinContent: ($('body').text().split(/\s+/).length < 300),
        missingHeadings: $('h1, h2, h3').length === 0,
        robots: $('meta[name="robots"]').attr('content') || null
      },
      html: response.data,
      rawHtml: response.data
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
    const prefiltered = await this.urlManagementService.prefilterUrls(urls, {
      prefilterContentTypes: true,
      concurrentRequests: this.adaptiveConcurrency,
      userAgent: this.USER_AGENT,
      axios: axios
    });
    
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
  private extractImages($: cheerio.CheerioAPI): Array<{src: string, alt: string, title?: string}> {
    const images: Array<{src: string, alt: string, title?: string}> = [];
    
    $('img').each((_, element) => {
      const $img = $(element);
      const src = $img.attr('src');
      const alt = $img.attr('alt');
      const title = $img.attr('title');
      
      if (src) {
        images.push({
          src,
          alt: alt || '',
          title: title || undefined
        });
      }
    });

    return images;
  }

  /**
   * Extract heading structure from page
   */
  private extractHeadings($: cheerio.CheerioAPI): {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
  } {
    return {
      h1: $('h1').map((_, el) => $(el).text().trim()).get(),
      h2: $('h2').map((_, el) => $(el).text().trim()).get(),
      h3: $('h3').map((_, el) => $(el).text().trim()).get(),
      h4: $('h4').map((_, el) => $(el).text().trim()).get(),
      h5: $('h5').map((_, el) => $(el).text().trim()).get(),
      h6: $('h6').map((_, el) => $(el).text().trim()).get()
    };
  }

  /**
   * Extract schema markup from page
   */
  private extractSchemaMarkup($: cheerio.CheerioAPI): any[] {
    const schemas: any[] = [];
    
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const content = $(element).html();
        if (content) {
          const parsed = JSON.parse(content);
          schemas.push(parsed);
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    });

    return schemas;
  }

  /**
   * Check mobile compatibility
   */
  private checkMobileCompatibility($: cheerio.CheerioAPI): boolean {
    const viewport = $('meta[name="viewport"]').attr('content');
    return !!viewport && viewport.includes('width=device-width');
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
      return { available: false, error: error instanceof Error ? error.message : String(error) };
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
        this.puppeteerHandlerService.detectJavaScriptHeavySite(page.html || '', page.url)
      ),
      averagePageSize: successfulPages.reduce((sum, page) => 
        sum + (page.html?.length || 0), 0) / successfulPages.length,
      totalWords: successfulPages.reduce((sum, page) => 
        sum + (page.content?.wordCount || 0), 0),
      uniqueImages: new Set(
        successfulPages.flatMap(page => 
          page.images?.map((img: any) => img.src) || []
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
      title: '',
      status: 'error',
      statusCode,
      error: `${errorType}: ${message}`,
      timestamp: new Date().toISOString(),
      content: {
        text: '',
        wordCount: 0,
        paragraphs: []
      },
      meta: {
        description: '',
        ogTags: {},
        twitterTags: {}
      },
      headings: {
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: []
      },
      links: {
        internal: [],
        external: []
      },
      images: [],
      schema: [],
      mobileCompatible: false,
      performance: {
        loadTime: 0,
        resourceCount: 0,
        resourceSize: 0
      },
      security: {
        hasHttps: false,
        hasMixedContent: false,
        hasSecurityHeaders: false
      },
      accessibility: {
        hasAccessibleElements: false,
        missingAltText: 0,
        hasAriaAttributes: false,
        hasProperHeadingStructure: false
      },
      seoIssues: {
        noindex: false,
        brokenLinks: 0,
        missingAltText: 0,
        duplicateMetaTags: false,
        thinContent: false,
        missingHeadings: false,
        robots: null
      },
      html: '',
      rawHtml: ''
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
   * Transform CrawlerOutput to PageCrawlResult format
   * This method resolves the data format mismatch between Puppeteer output and analyzer expectations
   */
  transformCrawlerOutputToPageResult(crawlerOutput: CrawlerOutput): PageCrawlResult {
    return {
      url: crawlerOutput.url,
      title: crawlerOutput.title || '',
      metaDescription: crawlerOutput.meta?.description || '',
      bodyText: crawlerOutput.content?.text || '',
      rawHtml: crawlerOutput.rawHtml || crawlerOutput.html || '',
      wordCount: crawlerOutput.content?.wordCount || 0,
      h1s: crawlerOutput.headings?.h1 || [],
      h2s: crawlerOutput.headings?.h2 || [],
      h3s: crawlerOutput.headings?.h3 || [],
      headings: {
        h1: crawlerOutput.headings?.h1 || [],
        h2: crawlerOutput.headings?.h2 || [],
        h3: crawlerOutput.headings?.h3 || []
      },
      links: {
        internal: crawlerOutput.links?.internal || [],
        external: crawlerOutput.links?.external || [],
        broken: [] // Will be populated by link checking
      },
      hasContactForm: this.detectContactForm(crawlerOutput),
      hasPhoneNumber: this.detectPhoneNumber(crawlerOutput),
      hasAddress: this.detectAddress(crawlerOutput),
      hasNAP: this.detectNAP(crawlerOutput),
      images: this.transformImageData(crawlerOutput.images),
      hasSchema: (crawlerOutput.schema?.length || 0) > 0,
      schemaTypes: crawlerOutput.schema?.map(s => s.type) || [],
      mobileFriendly: crawlerOutput.mobileCompatible || false,
      hasSocialTags: this.detectSocialTags(crawlerOutput),
      hasCanonical: this.detectCanonical(crawlerOutput),
      hasRobotsMeta: this.detectRobotsMeta(crawlerOutput),
      hasIcon: this.detectIcon(crawlerOutput),
      hasHttps: crawlerOutput.security?.hasHttps || false,
      hasHreflang: this.detectHreflang(crawlerOutput),
      hasSitemap: false, // Will be determined at site level
      hasAmpVersion: this.detectAMP(crawlerOutput),
      pageLoadSpeed: this.transformPerformanceData(crawlerOutput.performance),
      keywordDensity: this.calculateKeywordDensity(crawlerOutput.content?.text || ''),
      readabilityScore: this.calculateReadabilityScore(crawlerOutput.content?.text || ''),
      contentStructure: this.analyzeContentStructure(crawlerOutput)
    };
  }

  /**
   * Helper method: Detect contact form presence
   */
  private detectContactForm(crawlerOutput: CrawlerOutput): boolean {
    const html = crawlerOutput.html || crawlerOutput.rawHtml || '';
    const contactFormIndicators = [
      /contact.*form/i,
      /form.*contact/i,
      /<form[^>]*>[\s\S]*?<input[^>]*type=['"](email|tel|text)['"]/i,
      /name=['"](email|phone|message|subject)['"]/i
    ];
    return contactFormIndicators.some(pattern => pattern.test(html));
  }

  /**
   * Helper method: Detect phone number presence
   */
  private detectPhoneNumber(crawlerOutput: CrawlerOutput): boolean {
    const text = crawlerOutput.content?.text || '';
    const phonePatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
      /\(\d{3}\)\s?\d{3}[-.]?\d{4}/,
      /\b\d{10}\b/,
      /tel:/i
    ];
    return phonePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Helper method: Detect address presence
   */
  private detectAddress(crawlerOutput: CrawlerOutput): boolean {
    const text = crawlerOutput.content?.text || '';
    const addressPatterns = [
      /\d+\s+[A-Za-z\s]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)/i,
      /\b\d{5}(-\d{4})?\b/, // ZIP codes
      /\b[A-Z]{2}\s+\d{5}\b/ // State + ZIP
    ];
    return addressPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Helper method: Detect NAP (Name, Address, Phone) presence
   */
  private detectNAP(crawlerOutput: CrawlerOutput): boolean {
    return this.detectPhoneNumber(crawlerOutput) && this.detectAddress(crawlerOutput);
  }

  /**
   * Helper method: Transform image data format
   */
  private transformImageData(images: Array<{src: string, alt: string, title?: string}> = []): {
    total: number;
    withAlt: number;
    withoutAlt: number;
    largeImages: number;
    altTexts: string[];
  } {
    const withAlt = images.filter(img => img.alt && img.alt.trim().length > 0);
    return {
      total: images.length,
      withAlt: withAlt.length,
      withoutAlt: images.length - withAlt.length,
      largeImages: 0, // Would need image size analysis
      altTexts: withAlt.map(img => img.alt)
    };
  }

  /**
   * Helper method: Detect social media tags
   */
  private detectSocialTags(crawlerOutput: CrawlerOutput): boolean {
    return Object.keys(crawlerOutput.meta?.ogTags || {}).length > 0 || 
           Object.keys(crawlerOutput.meta?.twitterTags || {}).length > 0;
  }

  /**
   * Helper method: Detect canonical tag
   */
  private detectCanonical(crawlerOutput: CrawlerOutput): boolean {
    const html = crawlerOutput.html || crawlerOutput.rawHtml || '';
    return /<link[^>]*rel=['"](canonical|prev|next)['"]/i.test(html);
  }

  /**
   * Helper method: Detect robots meta tag
   */
  private detectRobotsMeta(crawlerOutput: CrawlerOutput): boolean {
    const html = crawlerOutput.html || crawlerOutput.rawHtml || '';
    return /<meta[^>]*name=['"](robots|googlebot)['"]/i.test(html);
  }

  /**
   * Helper method: Detect favicon
   */
  private detectIcon(crawlerOutput: CrawlerOutput): boolean {
    const html = crawlerOutput.html || crawlerOutput.rawHtml || '';
    return /<link[^>]*rel=['"](icon|shortcut icon|apple-touch-icon)['"]/i.test(html);
  }

  /**
   * Helper method: Detect hreflang tags
   */
  private detectHreflang(crawlerOutput: CrawlerOutput): boolean {
    const html = crawlerOutput.html || crawlerOutput.rawHtml || '';
    return /<link[^>]*hreflang=/i.test(html);
  }

  /**
   * Helper method: Detect AMP version
   */
  private detectAMP(crawlerOutput: CrawlerOutput): boolean {
    const html = crawlerOutput.html || crawlerOutput.rawHtml || '';
    return /<link[^>]*rel=['"](amphtml|amp)['"]/i.test(html) || 
           /⚡/i.test(html) || 
           /amp-/i.test(html);
  }

  /**
   * Helper method: Transform performance data
   */
  private transformPerformanceData(performance: any): {
    score: number;
    firstContentfulPaint: number;
    totalBlockingTime: number;
    largestContentfulPaint: number;
  } {
    return {
      score: 85, // Default score, would need PageSpeed analysis
      firstContentfulPaint: performance?.loadTime || 0,
      totalBlockingTime: 0,
      largestContentfulPaint: performance?.loadTime || 0
    };
  }

  /**
   * Helper method: Calculate keyword density
   */
  private calculateKeywordDensity(text: string): Record<string, number> {
    if (!text) return {};
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordCount = words.length;
    const frequency: Record<string, number> = {};
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Convert to density (percentage)
    const density: Record<string, number> = {};
    for (const [word, count] of Object.entries(frequency)) {
      if (count > 1) { // Only include words that appear more than once
        density[word] = (count / wordCount) * 100;
      }
    }
    
    return density;
  }

  /**
   * Helper method: Calculate readability score (simplified Flesch Reading Ease)
   */
  private calculateReadabilityScore(text: string): number {
    if (!text) return 0;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((total, word) => total + this.countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const averageWordsPerSentence = words.length / sentences.length;
    const averageSyllablesPerWord = syllables / words.length;
    
    // Simplified Flesch Reading Ease score
    const score = 206.835 - (1.015 * averageWordsPerSentence) - (84.6 * averageSyllablesPerWord);
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Helper method: Count syllables in a word (simplified)
   */
  private countSyllables(word: string): number {
    if (!word) return 0;
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = word.match(/[aeiouy]+/g);
    let syllableCount = vowels ? vowels.length : 1;
    
    // Adjust for silent 'e'
    if (word.endsWith('e')) syllableCount--;
    
    return Math.max(1, syllableCount);
  }

  /**
   * Helper method: Analyze content structure
   */
  private analyzeContentStructure(crawlerOutput: CrawlerOutput): {
    hasFAQs: boolean;
    hasTable: boolean;
    hasLists: boolean;
    hasVideo: boolean;
    hasEmphasis: boolean;
  } {
    const html = crawlerOutput.html || crawlerOutput.rawHtml || '';
    
    return {
      hasFAQs: /faq|frequently.*asked/i.test(html) || /<dt>/i.test(html),
      hasTable: /<table/i.test(html),
      hasLists: /<[ou]l/i.test(html),
      hasVideo: /<video|youtube|vimeo|embed/i.test(html),
      hasEmphasis: /<(strong|b|em|i)/i.test(html)
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