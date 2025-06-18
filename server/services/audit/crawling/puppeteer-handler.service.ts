import { Cluster } from 'puppeteer-cluster';
import * as cheerio from 'cheerio';
import { PagePriorityService, PagePriority } from '../page-priority.service';
import { CrawlerOutput } from '../../../types/crawler';

// Re-export the CrawlerOutput interface for backward compatibility
export type { CrawlerOutput } from '../../../types/crawler';

/**
 * Puppeteer Handler Service for JavaScript-heavy site crawling
 * Manages browser automation, cluster lifecycle, and JS detection
 */
export class PuppeteerHandlerService {
  private USE_PUPPETEER_FOR_JS_SITES = true; // Enable Puppeteer for JS-heavy sites
  private PUPPETEER_CLUSTER_SIZE = 2; // Number of browser instances in cluster
  private USE_TIER_BASED_PUPPETEER = process.env.USE_TIER_BASED_PUPPETEER !== 'false'; // Enable tier-based Puppeteer usage for performance (default: true)
  private USER_AGENT = 'SEO-Best-Practices-Assessment-Tool/1.0';
  
  // Services
  private pagePriorityService = new PagePriorityService();
  
  // Puppeteer cluster for JS-heavy sites
  private puppeteerCluster: Cluster | null = null;
  
  // JavaScript detection patterns
  private jsDetectionPatterns = [
    'react', 'angular', 'vue', 'backbone', 'ember',
    'spa', 'ajax', 'xhr', 'fetch',
    'document.ready', 'window.onload',
    'ng-app', 'data-ng', 'v-if', 'v-for'
  ];

  // Content extraction methods (these would need to be passed in or implemented)
  private extractMetaTags: (($: cheerio.CheerioAPI) => any) | null = null;
  private extractContent: (($: cheerio.CheerioAPI) => any) | null = null;
  private extractHeadings: (($: cheerio.CheerioAPI) => any) | null = null;
  private extractLinks: (($: cheerio.CheerioAPI, url: string) => any) | null = null;
  private extractImages: (($: cheerio.CheerioAPI, url: string) => any) | null = null;
  private extractSchemaMarkup: (($: cheerio.CheerioAPI) => any) | null = null;
  private checkMobileCompatibility: (($: cheerio.CheerioAPI) => boolean) | null = null;
  private checkMixedContent: (($: cheerio.CheerioAPI, url: string) => boolean) | null = null;
  private checkAccessibility: (($: cheerio.CheerioAPI) => any) | null = null;
  private checkNoindex: (($: cheerio.CheerioAPI) => boolean) | null = null;
  private countMissingAltText: (($: cheerio.CheerioAPI) => number) | null = null;
  private checkDuplicateMetaTags: (($: cheerio.CheerioAPI) => boolean) | null = null;
  private checkThinContent: (($: cheerio.CheerioAPI) => boolean) | null = null;
  private checkMissingHeadings: (($: cheerio.CheerioAPI) => boolean) | null = null;

  constructor(extractionMethods?: {
    extractMetaTags?: ($: cheerio.CheerioAPI) => any;
    extractContent?: ($: cheerio.CheerioAPI) => any;
    extractHeadings?: ($: cheerio.CheerioAPI) => any;
    extractLinks?: ($: cheerio.CheerioAPI, url: string) => any;
    extractImages?: ($: cheerio.CheerioAPI, url: string) => any;
    extractSchemaMarkup?: ($: cheerio.CheerioAPI) => any;
    checkMobileCompatibility?: ($: cheerio.CheerioAPI) => boolean;
    checkMixedContent?: ($: cheerio.CheerioAPI, url: string) => boolean;
    checkAccessibility?: ($: cheerio.CheerioAPI) => any;
    checkNoindex?: ($: cheerio.CheerioAPI) => boolean;
    countMissingAltText?: ($: cheerio.CheerioAPI) => number;
    checkDuplicateMetaTags?: ($: cheerio.CheerioAPI) => boolean;
    checkThinContent?: ($: cheerio.CheerioAPI) => boolean;
    checkMissingHeadings?: ($: cheerio.CheerioAPI) => boolean;
  }) {
    if (extractionMethods) {
      this.extractMetaTags = extractionMethods.extractMetaTags || null;
      this.extractContent = extractionMethods.extractContent || null;
      this.extractHeadings = extractionMethods.extractHeadings || null;
      this.extractLinks = extractionMethods.extractLinks || null;
      this.extractImages = extractionMethods.extractImages || null;
      this.extractSchemaMarkup = extractionMethods.extractSchemaMarkup || null;
      this.checkMobileCompatibility = extractionMethods.checkMobileCompatibility || null;
      this.checkMixedContent = extractionMethods.checkMixedContent || null;
      this.checkAccessibility = extractionMethods.checkAccessibility || null;
      this.checkNoindex = extractionMethods.checkNoindex || null;
      this.countMissingAltText = extractionMethods.countMissingAltText || null;
      this.checkDuplicateMetaTags = extractionMethods.checkDuplicateMetaTags || null;
      this.checkThinContent = extractionMethods.checkThinContent || null;
      this.checkMissingHeadings = extractionMethods.checkMissingHeadings || null;
    }
  }

  /**
   * Initialize Puppeteer cluster for JavaScript-heavy sites
   */
  async initializePuppeteerCluster(): Promise<void> {
    if (!this.USE_PUPPETEER_FOR_JS_SITES || this.puppeteerCluster) {
      return;
    }
    
    try {
      console.log(`[PuppeteerHandler] Initializing Puppeteer cluster with ${this.PUPPETEER_CLUSTER_SIZE} instances`);
      
      this.puppeteerCluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: this.PUPPETEER_CLUSTER_SIZE,
        puppeteerOptions: {
          headless: true,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_EXECUTABLE_PATH || undefined,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--window-size=1920x1080'
          ]
        },
        timeout: 30000,
        retryLimit: 1,
        retryDelay: 1000,
      });
      
      // Set up task handler for crawling
      await this.puppeteerCluster.task(async ({ page, data: url }) => {
        console.log(`[PuppeteerHandler] Puppeteer crawling: ${url}`);
        
        // Set viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent(this.USER_AGENT);
        
        // Enhanced aggressive resource blocking for maximum speed
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const resourceType = req.resourceType();
          const url = req.url();
          
          // Block resource types that aren't needed for SEO analysis
          const blockedResourceTypes = [
            'image', 'font', 'media', 'websocket', 'manifest', 'other'
          ];
          
          if (blockedResourceTypes.includes(resourceType)) {
            req.abort();
            return;
          }
          
          // Block third-party analytics, ads, and tracking scripts by URL patterns
          const blockedUrlPatterns = [
            // Analytics & Tracking
            /google-analytics\.com/,
            /googletagmanager\.com/,
            /facebook\.net/,
            /facebook\.com\/tr/,
            /doubleclick\.net/,
            /googlesyndication\.com/,
            /amazon-adsystem\.com/,
            /adsystem\.amazon/,
            
            // Social Media Widgets
            /twitter\.com\/widgets/,
            /platform\.twitter\.com/,
            /connect\.facebook\.net/,
            /instagram\.com\/embed/,
            /youtube\.com\/embed/,
            /linkedin\.com\/widgets/,
            
            // Chat/Support Widgets
            /zendesk\.com/,
            /intercom\.io/,
            /crisp\.chat/,
            /tawk\.to/,
            /zopim\.com/,
            /livechatinc\.com/,
            
            // Performance & Monitoring
            /newrelic\.com/,
            /hotjar\.com/,
            /fullstory\.com/,
            /mouseflow\.com/,
            /crazyegg\.com/,
            
            // CDN unnecessary resources
            /\.woff2?$/,
            /\.ttf$/,
            /\.eot$/,
            /\.svg$/,
            /\.png$/,
            /\.jpg$/,
            /\.jpeg$/,
            /\.gif$/,
            /\.webp$/,
            /\.ico$/,
            
            // Common ad networks
            /adsense\.google\.com/,
            /amazon\.com\/gp\/ads/,
            /media\.net/,
            /outbrain\.com/,
            /taboola\.com/,
            /revcontent\.com/
          ];
          
          if (blockedUrlPatterns.some(pattern => pattern.test(url))) {
            req.abort();
            return;
          }
          
          // Block non-essential stylesheets (keep only main/critical CSS)
          if (resourceType === 'stylesheet') {
            // Allow main CSS files, block third-party and optional CSS
            const nonEssentialCssPatterns = [
              /font-awesome/,
              /bootstrap\.min\.css/,
              /jquery/,
              /slick/,
              /owl\.carousel/,
              /animate\.css/
            ];
            
            if (nonEssentialCssPatterns.some(pattern => pattern.test(url))) {
              req.abort();
              return;
            }
          }
          
          // Allow essential resources for SEO analysis
          req.continue();
        });
        
        try {
          // Navigate to page with optimized wait conditions
          console.log(`[PuppeteerHandler] Navigating to: ${url}`);
          await page.goto(url, { 
            waitUntil: 'domcontentloaded', // Faster than networkidle2
            timeout: 60000 // Extended timeout for slower-loading sites (60 seconds)
          });
          console.log(`[PuppeteerHandler] Navigation completed for: ${url}`);
          
          // Minimal wait for critical dynamic content only
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Extract page data
          console.log(`[PuppeteerHandler] Extracting page data for: ${url}`);
          const data = await page.evaluate(() => {
            return {
              title: document.title,
              html: document.documentElement.outerHTML,
              url: window.location.href
            };
          });
          console.log(`[PuppeteerHandler] Data extraction completed for: ${url}`);
          
          return data;
        } catch (taskError) {
          console.error(`[PuppeteerHandler] Task execution failed for ${url}:`, taskError);
          console.error(`[PuppeteerHandler] Task error name:`, taskError instanceof Error ? taskError.name : 'Unknown');
          console.error(`[PuppeteerHandler] Task error message:`, taskError instanceof Error ? taskError.message : String(taskError));
          throw taskError;
        }
      });
      
      console.log(`[PuppeteerHandler] Puppeteer cluster initialized successfully`);
    } catch (error) {
      console.error(`[PuppeteerHandler] Failed to initialize Puppeteer cluster:`, error);
      console.log(`[PuppeteerHandler] Disabling Puppeteer for this session - will use regular crawling for all pages`);
      this.puppeteerCluster = null;
      this.USE_PUPPETEER_FOR_JS_SITES = false; // Disable for this session
    }
  }
  
  /**
   * Clean up Puppeteer cluster
   */
  async closePuppeteerCluster(): Promise<void> {
    if (this.puppeteerCluster) {
      try {
        console.log(`[PuppeteerHandler] Closing Puppeteer cluster`);
        await this.puppeteerCluster.idle();
        await this.puppeteerCluster.close();
        this.puppeteerCluster = null;
      } catch (error) {
        console.error(`[PuppeteerHandler] Error closing Puppeteer cluster:`, error);
      }
    }
  }
  
  /**
   * Determine if we should use Puppeteer for this page based on priority and JS detection
   */
  shouldUsePuppeteerForPage(url: string, isJsHeavy: boolean): boolean {
    if (!this.USE_TIER_BASED_PUPPETEER) {
      // If tier-based optimization is disabled, use original logic
      return isJsHeavy;
    }

    // Get page priority based on URL analysis
    const pagePriority = this.determinePagePriority(url);
    
    // Only use Puppeteer for Tier 1 pages that are JS-heavy
    if (pagePriority === PagePriority.TIER_1 && isJsHeavy) {
      console.log(`[PuppeteerHandler] Using Puppeteer for Tier 1 JS-heavy page: ${url}`);
      return true;
    }
    
    // For Tier 2 and Tier 3 pages, skip Puppeteer even if JS-heavy
    if (pagePriority !== PagePriority.TIER_1 && isJsHeavy) {
      console.log(`[PuppeteerHandler] Skipping Puppeteer for Tier ${pagePriority} JS-heavy page (performance optimization): ${url}`);
      return false;
    }
    
    // Not JS-heavy, use regular crawling
    return false;
  }

  /**
   * Determine page priority based on URL analysis
   */
  private determinePagePriority(url: string): PagePriority {
    // Create a mock page object for priority classification
    const mockPage = {
      url,
      title: '',
      metaDescription: '',
      bodyText: '',
      rawHtml: '',
      h1s: [],
      h2s: [],
      h3s: [],
      headings: { h1: [], h2: [], h3: [] },
      links: { internal: [], external: [], broken: [] },
      hasContactForm: false,
      hasPhoneNumber: false,
      hasAddress: false,
      hasNAP: false,
      images: { total: 0, withAlt: 0, withoutAlt: 0, largeImages: 0, altTexts: [] },
      hasSchema: false,
      schemaTypes: [],
      mobileFriendly: false,
      wordCount: 0,
      hasSocialTags: false,
      hasCanonical: false,
      hasRobotsMeta: false,
      hasIcon: false,
      hasHttps: false,
      hasHreflang: false,
      hasSitemap: false,
      hasAmpVersion: false,
      pageLoadSpeed: { score: 0, firstContentfulPaint: 0, totalBlockingTime: 0, largestContentfulPaint: 0 },
      keywordDensity: {},
      readabilityScore: 0,
      contentStructure: { hasFAQs: false, hasTable: false, hasLists: false, hasVideo: false, hasEmphasis: false }
    };

    // Determine page type based on URL patterns
    const pageType = this.classifyPageType(url);
    
    // Get priority from the service
    return this.pagePriorityService.getPagePriority(mockPage, pageType);
  }

  /**
   * Classify page type based on URL patterns
   */
  private classifyPageType(url: string): string {
    const path = new URL(url).pathname.toLowerCase();
    
    // Homepage detection
    if (path === '/' || path === '/index.html' || path === '/home') {
      return 'homepage';
    }
    
    // Contact page detection
    if (path.includes('/contact')) {
      return 'contact';
    }
    
    // Service page detection
    if (path.includes('/service') || path.includes('/hvac') || path.includes('/plumbing') || 
        path.includes('/electrical') || path.includes('/repair') || path.includes('/installation')) {
      return 'service';
    }
    
    // Location page detection
    if (path.includes('/location') || path.includes('/area') || path.includes('/city')) {
      return 'location';
    }
    
    // Service area detection
    if (path.includes('/service-area') || path.includes('/coverage')) {
      return 'serviceArea';
    }
    
    // Default to other
    return 'other';
  }

  /**
   * Detect if a site is JavaScript-heavy
   */
  detectJavaScriptHeavySite(html: string, url: string): boolean {
    if (!this.USE_PUPPETEER_FOR_JS_SITES) {
      return false;
    }
    
    const htmlLower = html.toLowerCase();
    const urlLower = url.toLowerCase();
    
    // Check for JS framework patterns in HTML
    const jsPatternCount = this.jsDetectionPatterns.filter(pattern => 
      htmlLower.includes(pattern)
    ).length;
    
    // Check for minimal HTML content (indicates SPA)
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    const hasMinimalContent = textContent.length < 500;
    
    // Check for heavy script usage
    const scriptTags = (html.match(/<script[^>]*>/gi) || []).length;
    const hasHeavyScripts = scriptTags > 5;
    
    // Determine if it's JS-heavy
    const isJsHeavy = jsPatternCount >= 2 || hasMinimalContent || hasHeavyScripts;
    
    if (isJsHeavy) {
      console.log(`[PuppeteerHandler] Detected JS-heavy site: ${url} (patterns: ${jsPatternCount}, minimal content: ${hasMinimalContent}, scripts: ${scriptTags})`);
    }
    
    return isJsHeavy;
  }
  
  /**
   * Crawl page using Puppeteer for JavaScript-heavy sites
   */
  async crawlPageWithPuppeteer(url: string): Promise<CrawlerOutput> {
    // Auto-initialize cluster if not already initialized
    if (!this.puppeteerCluster) {
      console.log(`[PuppeteerHandler] Auto-initializing Puppeteer cluster for: ${url}`);
      await this.initializePuppeteerCluster();
      
      // Double-check initialization succeeded
      if (!this.puppeteerCluster) {
        throw new Error('Failed to initialize Puppeteer cluster');
      }
    }
    
    try {
      const startTime = Date.now();
      
      // Execute crawling task in cluster
      const result = await this.puppeteerCluster.execute(url);
      
      const loadTime = Date.now() - startTime;
      
      // Parse the HTML with Cheerio for consistent data extraction
      const $ = cheerio.load(result.html);
      
      // Extract all the same data as regular crawling
      const crawlResult: CrawlerOutput = {
        url: result.url,
        statusCode: 200, // Puppeteer successful navigation
        title: result.title || $('title').text().trim(),
        meta: this.extractMetaTags ? this.extractMetaTags($) : { description: '', ogTags: {}, twitterTags: {} },
        content: this.extractContent ? this.extractContent($) : { text: '', wordCount: 0, paragraphs: [] },
        headings: this.extractHeadings ? this.extractHeadings($) : { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
        links: this.extractLinks ? this.extractLinks($, result.url) : { internal: [], external: [] },
        images: this.extractImages ? this.extractImages($, result.url) : [],
        schema: this.extractSchemaMarkup ? this.extractSchemaMarkup($) : [],
        mobileCompatible: this.checkMobileCompatibility ? this.checkMobileCompatibility($) : false,
        performance: {
          loadTime,
          resourceCount: $('img, script, link[rel="stylesheet"], source, iframe').length,
          resourceSize: result.html.length
        },
        security: {
          hasHttps: result.url.startsWith('https://'),
          hasMixedContent: this.checkMixedContent ? this.checkMixedContent($, result.url) : false,
          hasSecurityHeaders: false // Can't check headers with Puppeteer easily
        },
        accessibility: this.checkAccessibility ? this.checkAccessibility($) : {
          hasAccessibleElements: false,
          missingAltText: 0,
          hasAriaAttributes: false,
          hasProperHeadingStructure: false
        },
        seoIssues: {
          noindex: this.checkNoindex ? this.checkNoindex($) : false,
          brokenLinks: 0, // Will be checked separately
          missingAltText: this.countMissingAltText ? this.countMissingAltText($) : 0,
          duplicateMetaTags: this.checkDuplicateMetaTags ? this.checkDuplicateMetaTags($) : false,
          thinContent: this.checkThinContent ? this.checkThinContent($) : false,
          missingHeadings: this.checkMissingHeadings ? this.checkMissingHeadings($) : false,
          robots: $('meta[name="robots"]').attr('content') || null
        },
        html: result.html,
        rawHtml: result.html,
        puppeteerUsed: true // Flag to indicate Puppeteer was used
      };
      
      console.log(`[PuppeteerHandler] Puppeteer crawl completed for ${url} in ${loadTime}ms`);
      return crawlResult;
      
    } catch (error) {
      console.error(`[PuppeteerHandler] Detailed Crawl Error for ${url}:`, error);
      console.error(`[PuppeteerHandler] Error name:`, error instanceof Error ? error.name : 'Unknown');
      console.error(`[PuppeteerHandler] Error message:`, error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error(`[PuppeteerHandler] Error stack:`, error.stack);
      }
      
      // If Puppeteer fails, disable it for the session to prevent repeated failures
      if (error instanceof Error && error.message.includes('cluster')) {
        console.log(`[PuppeteerHandler] Disabling Puppeteer due to cluster error`);
        this.USE_PUPPETEER_FOR_JS_SITES = false;
        await this.closePuppeteerCluster();
      }
      
      throw error;
    }
  }

  /**
   * Check if Puppeteer is available and initialized
   */
  isPuppeteerAvailable(): boolean {
    return this.USE_PUPPETEER_FOR_JS_SITES && this.puppeteerCluster !== null;
  }

  /**
   * Enable or disable Puppeteer for this session
   */
  setPuppeteerEnabled(enabled: boolean): void {
    this.USE_PUPPETEER_FOR_JS_SITES = enabled;
  }

  /**
   * Enable or disable tier-based Puppeteer optimization
   */
  setTierBasedPuppeteerEnabled(enabled: boolean): void {
    this.USE_TIER_BASED_PUPPETEER = enabled;
  }

  /**
   * Get current configuration
   */
  getConfiguration(): {
    isPuppeteerEnabled: boolean;
    isTierBasedEnabled: boolean;
    clusterSize: number;
    isClusterInitialized: boolean;
    jsDetectionPatterns: string[];
  } {
    return {
      isPuppeteerEnabled: this.USE_PUPPETEER_FOR_JS_SITES,
      isTierBasedEnabled: this.USE_TIER_BASED_PUPPETEER,
      clusterSize: this.PUPPETEER_CLUSTER_SIZE,
      isClusterInitialized: this.puppeteerCluster !== null,
      jsDetectionPatterns: [...this.jsDetectionPatterns]
    };
  }

  /**
   * Add custom JS detection patterns
   */
  addJSDetectionPatterns(patterns: string[]): void {
    this.jsDetectionPatterns.push(...patterns);
  }

  /**
   * Reset JS detection patterns to default
   */
  resetJSDetectionPatterns(): void {
    this.jsDetectionPatterns = [
      'react', 'angular', 'vue', 'backbone', 'ember',
      'spa', 'ajax', 'xhr', 'fetch',
      'document.ready', 'window.onload',
      'ng-app', 'data-ng', 'v-if', 'v-for'
    ];
  }

  /**
   * Update cluster size (requires reinitialization)
   */
  setClusterSize(size: number): void {
    if (size > 0 && size <= 10) { // Reasonable limits
      this.PUPPETEER_CLUSTER_SIZE = size;
      console.log(`[PuppeteerHandler] Cluster size updated to ${size}. Reinitialization required.`);
    } else {
      throw new Error('Cluster size must be between 1 and 10');
    }
  }
}