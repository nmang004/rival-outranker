import { Cluster } from 'puppeteer-cluster';
import * as cheerio from 'cheerio';
import { PagePriorityService, PagePriority } from '../page-priority.service';
import { CrawlerOutput } from '../../../types/crawler';
import { CircuitBreaker, CircuitBreakerFactory, CircuitBreakerError } from '../../../utils/circuit-breaker';

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
  private instanceId = `puppeteer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  private isRegisteredForCleanup = false;
  
  // Static singleton cluster management
  private static globalCluster: Cluster | null = null;
  private static initializationPromise: Promise<void> | null = null;
  private static instanceCount = 0;
  private static isShuttingDown = false;
  private static isClusterInitialized = false;
  private static initializationLock = false;
  
  // Circuit breaker for browser operations
  private static circuitBreaker: CircuitBreaker = CircuitBreakerFactory.createBrowserCircuitBreaker();
  private static retryDelays = [1000, 2000, 5000]; // Exponential backoff: 1s, 2s, 5s
  
  // Health monitoring
  private static lastHealthCheck = 0;
  private static healthCheckInterval = 30000; // 30 seconds
  
  // Services
  private pagePriorityService = new PagePriorityService();
  
  // Puppeteer cluster for JS-heavy sites (reference to singleton)
  private get puppeteerCluster(): Cluster | null {
    return PuppeteerHandlerService.globalCluster;
  }
  
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
    // Increment static instance counter
    PuppeteerHandlerService.instanceCount++;
    console.log(`[PuppeteerHandler] Created instance ${this.instanceId} (total: ${PuppeteerHandlerService.instanceCount})`);
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
   * Initialize Puppeteer cluster for JavaScript-heavy sites (singleton pattern)
   * @deprecated Use getCluster() method instead for safer initialization
   */
  async initializePuppeteerCluster(): Promise<void> {
    try {
      await this.initializeCluster();
      await this.registerForCleanup();
    } catch (error) {
      console.error(`[PuppeteerHandler-${this.instanceId}] Failed to initialize cluster:`, error);
      // Don't re-throw to maintain backward compatibility
    }
  }
  
  /**
   * Private method to initialize the Puppeteer cluster (thread-safe with circuit breaker)
   */
  private async initializeCluster(): Promise<void> {
    if (!this.USE_PUPPETEER_FOR_JS_SITES) {
      console.log(`[PuppeteerHandler-${this.instanceId}] Puppeteer disabled, skipping initialization`);
      return;
    }
    
    // Reset shutdown flag when explicitly initializing (recovery scenario)
    if (PuppeteerHandlerService.isShuttingDown) {
      console.log(`[PuppeteerHandler-${this.instanceId}] Resetting shutdown state for new initialization`);
      PuppeteerHandlerService.isShuttingDown = false;
    }
    
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      const healthStatus = PuppeteerHandlerService.circuitBreaker.getHealthStatus();
      const resetTimeLeft = healthStatus.timeToReset ? Math.ceil(healthStatus.timeToReset / 1000) : 0;
      throw new Error(`Circuit breaker is ${healthStatus.state}. Too many initialization failures. Retry in ${resetTimeLeft} seconds.`);
    }
    
    // If cluster exists, validate its health before returning
    if (PuppeteerHandlerService.globalCluster && PuppeteerHandlerService.isClusterInitialized) {
      if (await this.isClusterHealthy()) {
        console.log(`[PuppeteerHandler-${this.instanceId}] Using existing healthy cluster`);
        return;
      } else {
        console.log(`[PuppeteerHandler-${this.instanceId}] Existing cluster is unhealthy, reinitializing...`);
        await this.forceClusterCleanup();
      }
    }
    
    // Atomic locking mechanism to prevent concurrent initializations
    if (PuppeteerHandlerService.initializationLock) {
      console.log(`[PuppeteerHandler-${this.instanceId}] Initialization lock active, waiting...`);
      // Poll until lock is released or timeout
      const maxWait = 30000; // 30 seconds
      const startTime = Date.now();
      while (PuppeteerHandlerService.initializationLock && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      // Check if cluster is now available after waiting
      if (PuppeteerHandlerService.globalCluster && PuppeteerHandlerService.isClusterInitialized) {
        console.log(`[PuppeteerHandler-${this.instanceId}] Cluster available after lock wait`);
        return;
      }
    }
    
    // If initialization is already in progress, wait for it
    if (PuppeteerHandlerService.initializationPromise) {
      console.log(`[PuppeteerHandler-${this.instanceId}] Cluster initialization in progress, waiting...`);
      try {
        await PuppeteerHandlerService.initializationPromise;
        // Verify cluster is actually available after promise resolution
        if (!PuppeteerHandlerService.globalCluster || !PuppeteerHandlerService.isClusterInitialized) {
          throw new Error('Initialization promise resolved but cluster is not available');
        }
        return;
      } catch (error) {
        // If the concurrent initialization failed, we'll try again below
        console.log(`[PuppeteerHandler-${this.instanceId}] Concurrent initialization failed, will retry`);
        PuppeteerHandlerService.initializationPromise = null;
      }
    }
    
    // Acquire lock before starting initialization
    PuppeteerHandlerService.initializationLock = true;
    
    try {
      // Start new initialization with retry logic
      PuppeteerHandlerService.initializationPromise = this.doInitializeClusterWithRetry();
      await PuppeteerHandlerService.initializationPromise;
      
      // Verify cluster is available before marking as successful
      if (!PuppeteerHandlerService.globalCluster || !PuppeteerHandlerService.isClusterInitialized) {
        throw new Error('Cluster initialization completed but cluster is not available');
      }
    } finally {
      // Always release the lock
      PuppeteerHandlerService.initializationLock = false;
    }
  }

  /**
   * Perform cluster initialization with retry logic and exponential backoff
   */
  private async doInitializeClusterWithRetry(): Promise<void> {
    const maxRetries = PuppeteerHandlerService.retryDelays.length;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[PuppeteerHandler-${this.instanceId}] Initializing Puppeteer cluster (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        await this.doInitializeCluster();
        
        // Success - circuit breaker will automatically track this
        console.log(`[PuppeteerHandler-${this.instanceId}] Cluster initialization successful on attempt ${attempt + 1}`);
        
        // Clear initialization promise only on successful completion
        PuppeteerHandlerService.initializationPromise = null;
        return;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[PuppeteerHandler-${this.instanceId}] Cluster initialization failed (attempt ${attempt + 1}):`, lastError.message);
        
        // If this isn't the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = PuppeteerHandlerService.retryDelays[attempt];
          console.log(`[PuppeteerHandler-${this.instanceId}] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Clean up any partial initialization
          await this.forceClusterCleanup();
        }
      }
    }
    
    // All retries failed - circuit breaker failure will be tracked automatically when error is thrown
    
    const errorMessage = `Failed to initialize Puppeteer cluster after ${maxRetries + 1} attempts. Last error: ${lastError?.message || 'Unknown error'}`;
    console.error(`[PuppeteerHandler-${this.instanceId}] ${errorMessage}`);
    
    throw new Error(errorMessage);
  }
  
  /**
   * Perform the actual cluster initialization (private method)
   */
  private async doInitializeCluster(): Promise<void> {
    console.log(`[PuppeteerHandler-${this.instanceId}] Launching Puppeteer cluster with ${this.PUPPETEER_CLUSTER_SIZE} instances`);
    
    // Enhanced timeout for cold start environments
    const clusterTimeout = process.env.NODE_ENV === 'production' ? 60000 : 45000;
    
    PuppeteerHandlerService.globalCluster = await Cluster.launch({
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
          '--window-size=1920x1080',
          // Additional cold start optimizations
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps',
          '--no-first-run',
          '--no-default-browser-check'
        ]
      },
      timeout: clusterTimeout,
      retryLimit: 0, // We handle retries at a higher level
      retryDelay: 0,
    });
      
      // Set up task handler for crawling
      await PuppeteerHandlerService.globalCluster!.task(async ({ page, data: url }) => {
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
      
    // Verify cluster is actually functional before marking as initialized
    if (!PuppeteerHandlerService.globalCluster) {
      throw new Error('Cluster launch completed but cluster instance is null');
    }
    
    console.log(`[PuppeteerHandler-${this.instanceId}] Puppeteer cluster launched successfully`);
    PuppeteerHandlerService.isClusterInitialized = true;
    PuppeteerHandlerService.lastHealthCheck = Date.now();
    
    // Ensure shutdown flag is false after successful initialization
    PuppeteerHandlerService.isShuttingDown = false;
  }
  
  /**
   * Public method to safely get the Puppeteer cluster (initializes if needed)
   */
  async getCluster(): Promise<Cluster> {
    try {
      // Initialize cluster if not ready (includes health checks and retry logic)
      await this.initializeCluster();
      
      // Double-check that initialization succeeded
      if (!PuppeteerHandlerService.globalCluster || !PuppeteerHandlerService.isClusterInitialized) {
        throw new Error('Cluster initialization completed but cluster is not available');
      }
      
      return PuppeteerHandlerService.globalCluster;
      
    } catch (error) {
      // Enhance error context for debugging
      const circuitBreakerHealth = PuppeteerHandlerService.circuitBreaker.getHealthStatus();
      const errorDetails = {
        instanceId: this.instanceId,
        clusterExists: !!PuppeteerHandlerService.globalCluster,
        isInitialized: PuppeteerHandlerService.isClusterInitialized,
        isShuttingDown: PuppeteerHandlerService.isShuttingDown,
        initializationInProgress: !!PuppeteerHandlerService.initializationPromise,
        initializationLock: PuppeteerHandlerService.initializationLock,
        circuitBreakerState: circuitBreakerHealth.state,
        circuitBreakerFailureRate: circuitBreakerHealth.failureRate,
        originalError: error instanceof Error ? error.message : String(error)
      };
      
      console.error(`[PuppeteerHandler-${this.instanceId}] getCluster failed with context:`, errorDetails);
      
      // If circuit breaker is open, disable Puppeteer for this session
      if (!circuitBreakerHealth.isHealthy) {
        console.log(`[PuppeteerHandler-${this.instanceId}] Circuit breaker unhealthy, disabling Puppeteer for this session`);
        this.USE_PUPPETEER_FOR_JS_SITES = false;
      }
      
      // Clear initialization promise on failure to allow retry
      PuppeteerHandlerService.initializationPromise = null;
      
      throw error;
    }
  }
  
  /**
   * Check if circuit breaker allows requests
   */
  private isCircuitBreakerOpen(): boolean {
    return !PuppeteerHandlerService.circuitBreaker.isRequestAllowed();
  }
  
  /**
   * Check if the current cluster is healthy
   */
  private async isClusterHealthy(): Promise<boolean> {
    if (!PuppeteerHandlerService.globalCluster || !PuppeteerHandlerService.isClusterInitialized) {
      return false;
    }
    
    // Skip frequent health checks for performance
    const timeSinceLastCheck = Date.now() - PuppeteerHandlerService.lastHealthCheck;
    if (timeSinceLastCheck < PuppeteerHandlerService.healthCheckInterval) {
      return true; // Assume healthy if recently checked
    }
    
    try {
      // Quick health check - ensure cluster can accept tasks
      const healthCheckPromise = PuppeteerHandlerService.globalCluster.execute(async ({ page }: any) => {
        // Minimal health check - just verify page is accessible
        return page ? 'healthy' : 'unhealthy';
      });
      
      // Race against timeout
      const result = await Promise.race([
        healthCheckPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        )
      ]);
      
      PuppeteerHandlerService.lastHealthCheck = Date.now();
      return result === 'healthy';
      
    } catch (error) {
      console.warn(`[PuppeteerHandler-${this.instanceId}] Cluster health check failed:`, error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  
  /**
   * Force cleanup of cluster state (for recovery scenarios)
   */
  private async forceClusterCleanup(): Promise<void> {
    try {
      if (PuppeteerHandlerService.globalCluster) {
        console.log(`[PuppeteerHandler-${this.instanceId}] Force cleaning up unhealthy cluster...`);
        
        // Attempt graceful close with short timeout
        await Promise.race([
          PuppeteerHandlerService.globalCluster.close(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Force cleanup timeout')), 3000)
          )
        ]);
      }
    } catch (error) {
      console.warn(`[PuppeteerHandler-${this.instanceId}] Force cleanup failed:`, error instanceof Error ? error.message : String(error));
    } finally {
      // Always reset state
      PuppeteerHandlerService.globalCluster = null;
      PuppeteerHandlerService.isClusterInitialized = false;
      PuppeteerHandlerService.lastHealthCheck = 0;
    }
  }

  /**
   * Clean up Puppeteer cluster
   */
  async closePuppeteerCluster(): Promise<void> {
    // Acquire lock to prevent concurrent operations during shutdown
    while (PuppeteerHandlerService.initializationLock) {
      console.log(`[PuppeteerHandler-${this.instanceId}] Waiting for initialization to complete before shutdown...`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Mark system as shutting down to prevent new initializations
    PuppeteerHandlerService.isShuttingDown = true;
    PuppeteerHandlerService.isClusterInitialized = false;
    
    if (PuppeteerHandlerService.globalCluster) {
      try {
        console.log(`[PuppeteerHandler-${this.instanceId}] Closing Puppeteer cluster gracefully...`);
        
        // Wait for all tasks to complete, but with a timeout
        await Promise.race([
          PuppeteerHandlerService.globalCluster.idle(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Cluster idle timeout')), 3000)
          )
        ]);
        
        // Close the cluster
        await Promise.race([
          PuppeteerHandlerService.globalCluster.close(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Cluster close timeout')), 2000)
          )
        ]);
        
        PuppeteerHandlerService.globalCluster = null;
        PuppeteerHandlerService.isClusterInitialized = false;
        
        // Reset circuit breaker state on clean shutdown
        PuppeteerHandlerService.circuitBreaker.reset();
        PuppeteerHandlerService.lastHealthCheck = 0;
        
        // Clear initialization promise to allow fresh start
        PuppeteerHandlerService.initializationPromise = null;
        
        console.log(`[PuppeteerHandler-${this.instanceId}] Singleton Puppeteer cluster closed successfully`);
      } catch (error) {
        console.error(`[PuppeteerHandler-${this.instanceId}] Error closing Puppeteer cluster:`, error);
        
        // Force close if graceful shutdown fails
        try {
          if (PuppeteerHandlerService.globalCluster) {
            await PuppeteerHandlerService.globalCluster.close();
            PuppeteerHandlerService.globalCluster = null;
            console.log(`[PuppeteerHandler-${this.instanceId}] Puppeteer cluster force-closed`);
          }
        } catch (forceError) {
          console.error(`[PuppeteerHandler-${this.instanceId}] Failed to force-close cluster:`, forceError);
          PuppeteerHandlerService.globalCluster = null; // Mark as null to prevent further attempts
          PuppeteerHandlerService.isClusterInitialized = false;
          
          // Reset circuit breaker state on forced shutdown
          PuppeteerHandlerService.circuitBreaker.reset();
          PuppeteerHandlerService.lastHealthCheck = 0;
          
          // Clear initialization promise to allow fresh start
          PuppeteerHandlerService.initializationPromise = null;
        }
      }
    } else {
      console.log(`[PuppeteerHandler-${this.instanceId}] No active Puppeteer cluster to close`);
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
    
    // Use Puppeteer for ALL Tier 1 pages (not just JS-heavy ones)
    if (pagePriority === PagePriority.TIER_1) {
      console.log(`[PuppeteerHandler] Using Puppeteer for Tier 1 page: ${url}`);
      return true;
    }
    
    // Use Puppeteer for JS-heavy Tier 2 pages  
    if (pagePriority === PagePriority.TIER_2 && isJsHeavy) {
      console.log(`[PuppeteerHandler] Using Puppeteer for Tier 2 JS-heavy page: ${url}`);
      return true;
    }
    
    // Skip Puppeteer for Tier 3 pages even if JS-heavy
    if (pagePriority === PagePriority.TIER_3 && isJsHeavy) {
      console.log(`[PuppeteerHandler] Skipping Puppeteer for Tier 3 JS-heavy page (performance optimization): ${url}`);
    }
    
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
   * Detect if a site is JavaScript-heavy using enhanced framework detection
   */
  detectJavaScriptHeavySite(html: string, url: string): boolean {
    if (!this.USE_PUPPETEER_FOR_JS_SITES) {
      return false;
    }
    
    const htmlLower = html.toLowerCase();
    
    // Enhanced framework footprint detection with weighted scoring
    let jsScore = 0;
    const detectionResults = {
      frameworkFootprints: 0,
      scriptCount: 0,
      minimalContent: false,
      ajaxPatterns: 0,
      dynamicContent: 0,
      spaIndicators: 0
    };
    
    // 1. Framework-specific footprint detection (High weight: 3 points each)
    const frameworkFootprints = [
      { pattern: /id=["'](root|app)["']/i, name: 'React root div' },
      { pattern: /data-v-|v-if|v-for|v-model/i, name: 'Vue.js directives' },
      { pattern: /ng-app|ng-controller|\[ng-/i, name: 'Angular directives' },
      { pattern: /data-ember|ember-application/i, name: 'Ember.js' },
      { pattern: /data-backbone|backbone\.js/i, name: 'Backbone.js' },
      { pattern: /__INITIAL_STATE__|window\.__/i, name: 'SSR hydration patterns' },
      { pattern: /next\.js|nuxt|gatsby/i, name: 'Modern framework indicators' }
    ];
    
    frameworkFootprints.forEach(({ pattern, name }) => {
      if (pattern.test(html)) {
        jsScore += 3;
        detectionResults.frameworkFootprints++;
        console.log(`[PuppeteerHandler] Detected ${name} in ${url}`);
      }
    });
    
    // 2. Script tag analysis (Medium weight: 2 points for heavy usage)
    const scriptTags = (html.match(/<script[^>]*>/gi) || []).length;
    detectionResults.scriptCount = scriptTags;
    if (scriptTags > 5) {
      jsScore += 2;
      console.log(`[PuppeteerHandler] Heavy script usage detected: ${scriptTags} script tags in ${url}`);
    } else if (scriptTags > 10) {
      jsScore += 3; // Very heavy script usage
    }
    
    // 3. Minimal content analysis (Medium weight: 2 points)
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    const contentLength = textContent.length;
    detectionResults.minimalContent = contentLength < 500;
    if (detectionResults.minimalContent) {
      jsScore += 2;
      console.log(`[PuppeteerHandler] Minimal content detected (${contentLength} chars) in ${url}`);
    }
    
    // 4. AJAX/Dynamic loading patterns (Medium weight: 2 points)
    const ajaxPatterns = [
      /ajax|xhr|fetch\(/i,
      /axios\.|\.get|\.post/i,
      /async.*await/i,
      /json.*parse|json.*stringify/i
    ];
    
    ajaxPatterns.forEach(pattern => {
      if (pattern.test(html)) {
        jsScore += 1;
        detectionResults.ajaxPatterns++;
      }
    });
    
    // 5. Dynamic content indicators (Low weight: 1 point each)
    const dynamicContentPatterns = [
      /loading\.\.\.|spinner|skeleton/i,
      /data-lazy|lazy-load/i,
      /infinite.*scroll/i,
      /dynamic.*import/i
    ];
    
    dynamicContentPatterns.forEach(pattern => {
      if (pattern.test(html)) {
        jsScore += 1;
        detectionResults.dynamicContent++;
      }
    });
    
    // 6. SPA routing indicators (High weight: 3 points)
    const spaPatterns = [
      /history\.push|router\.push/i,
      /route.*path|path.*route/i,
      /single.*page.*app|spa/i,
      /#\/|#!/i // Hash routing
    ];
    
    spaPatterns.forEach(pattern => {
      if (pattern.test(html)) {
        jsScore += 2;
        detectionResults.spaIndicators++;
      }
    });
    
    // 7. Legacy pattern matching (for backward compatibility)
    const legacyPatternCount = this.jsDetectionPatterns.filter(pattern => 
      htmlLower.includes(pattern)
    ).length;
    
    if (legacyPatternCount >= 2) {
      jsScore += 1; // Lower weight for legacy detection
    }
    
    // Decision threshold: 4+ points indicates JS-heavy site
    const isJsHeavy = jsScore >= 4;
    
    if (isJsHeavy) {
      console.log(`[PuppeteerHandler] 🎯 JS-heavy site detected: ${url}`);
      console.log(`[PuppeteerHandler]   Score: ${jsScore}/20`);
      console.log(`[PuppeteerHandler]   Framework footprints: ${detectionResults.frameworkFootprints}`);
      console.log(`[PuppeteerHandler]   Script tags: ${detectionResults.scriptCount}`);
      console.log(`[PuppeteerHandler]   Minimal content: ${detectionResults.minimalContent}`);
      console.log(`[PuppeteerHandler]   AJAX patterns: ${detectionResults.ajaxPatterns}`);
      console.log(`[PuppeteerHandler]   Dynamic content: ${detectionResults.dynamicContent}`);
      console.log(`[PuppeteerHandler]   SPA indicators: ${detectionResults.spaIndicators}`);
    } else {
      console.log(`[PuppeteerHandler] ✋ Standard site detected: ${url} (score: ${jsScore}/20)`);
    }
    
    return isJsHeavy;
  }
  
  /**
   * Crawl page using Puppeteer for JavaScript-heavy sites
   */
  async crawlPageWithPuppeteer(url: string): Promise<CrawlerOutput> {
    try {
      // Check circuit breaker before attempting operation
      if (this.isCircuitBreakerOpen()) {
        const stats = PuppeteerHandlerService.circuitBreaker.getHealthStatus();
        throw new CircuitBreakerError(
          `Puppeteer circuit breaker is ${stats.state}. ${stats.timeToReset ? `Retry in ${stats.timeToReset}ms` : 'Service unavailable'}`
        );
      }

      const startTime = Date.now();
      
      // Execute crawling with circuit breaker protection
      const result = await PuppeteerHandlerService.circuitBreaker.execute(async () => {
        // Get the cluster safely (initializes if needed)
        const cluster = await this.getCluster();
        
        // Execute crawling task in cluster
        return await cluster.execute(url);
      });
      
      const loadTime = Date.now() - startTime;
      
      // Parse the HTML with Cheerio for consistent data extraction
      const $ = cheerio.load(result.html);
      
      // Extract all the same data as regular crawling
      const crawlResult: CrawlerOutput = {
        url: result.url,
        status: 'success', // Mark successful Puppeteer crawl
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
    return this.USE_PUPPETEER_FOR_JS_SITES && PuppeteerHandlerService.isClusterInitialized;
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
   * Get circuit breaker statistics for monitoring
   */
  getCircuitBreakerStats() {
    return PuppeteerHandlerService.circuitBreaker.getStats();
  }

  /**
   * Get circuit breaker health status
   */
  getCircuitBreakerHealth() {
    return PuppeteerHandlerService.circuitBreaker.getHealthStatus();
  }

  /**
   * Reset circuit breaker (for manual intervention)
   */
  resetCircuitBreaker(): void {
    PuppeteerHandlerService.circuitBreaker.reset();
    console.log('[PuppeteerHandler] Circuit breaker manually reset');
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
    instanceId: string;
    registeredForCleanup: boolean;
    totalInstances: number;
  } {
    return {
      isPuppeteerEnabled: this.USE_PUPPETEER_FOR_JS_SITES,
      isTierBasedEnabled: this.USE_TIER_BASED_PUPPETEER,
      clusterSize: this.PUPPETEER_CLUSTER_SIZE,
      isClusterInitialized: PuppeteerHandlerService.isClusterInitialized,
      jsDetectionPatterns: [...this.jsDetectionPatterns],
      instanceId: this.instanceId,
      registeredForCleanup: this.isRegisteredForCleanup,
      totalInstances: PuppeteerHandlerService.instanceCount
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
      'ng-app', 'data-ng', 'v-if', 'v-for',
      // Additional modern patterns
      'next.js', 'nuxt', 'gatsby', 'svelte',
      'webpack', 'vite', 'parcel',
      'typescript', 'babel'
    ];
  }
  
  /**
   * Get detailed JavaScript detection analysis for debugging
   */
  getJSDetectionAnalysis(html: string, url: string): {
    isJsHeavy: boolean;
    score: number;
    maxScore: number;
    breakdown: {
      frameworkFootprints: number;
      scriptCount: number;
      minimalContent: boolean;
      ajaxPatterns: number;
      dynamicContent: number;
      spaIndicators: number;
      legacyPatterns: number;
    };
    recommendations: string[];
  } {
    if (!this.USE_PUPPETEER_FOR_JS_SITES) {
      return {
        isJsHeavy: false,
        score: 0,
        maxScore: 20,
        breakdown: {
          frameworkFootprints: 0,
          scriptCount: 0,
          minimalContent: false,
          ajaxPatterns: 0,
          dynamicContent: 0,
          spaIndicators: 0,
          legacyPatterns: 0
        },
        recommendations: ['Puppeteer is disabled for this service instance']
      };
    }
    
    // Perform the same analysis as detectJavaScriptHeavySite but return detailed results
    let jsScore = 0;
    const breakdown = {
      frameworkFootprints: 0,
      scriptCount: 0,
      minimalContent: false,
      ajaxPatterns: 0,
      dynamicContent: 0,
      spaIndicators: 0,
      legacyPatterns: 0
    };
    const recommendations: string[] = [];
    
    // Run the same detection logic
    const htmlLower = html.toLowerCase();
    
    // Framework footprints
    const frameworkFootprints = [
      { pattern: /id=["'](root|app)["']/i, name: 'React root div' },
      { pattern: /data-v-|v-if|v-for|v-model/i, name: 'Vue.js directives' },
      { pattern: /ng-app|ng-controller|\[ng-/i, name: 'Angular directives' },
      { pattern: /data-ember|ember-application/i, name: 'Ember.js' },
      { pattern: /data-backbone|backbone\.js/i, name: 'Backbone.js' },
      { pattern: /__INITIAL_STATE__|window\.__/i, name: 'SSR hydration patterns' },
      { pattern: /next\.js|nuxt|gatsby/i, name: 'Modern framework indicators' }
    ];
    
    frameworkFootprints.forEach(({ pattern }) => {
      if (pattern.test(html)) {
        jsScore += 3;
        breakdown.frameworkFootprints++;
      }
    });
    
    // Script count
    const scriptTags = (html.match(/<script[^>]*>/gi) || []).length;
    breakdown.scriptCount = scriptTags;
    if (scriptTags > 5) jsScore += 2;
    if (scriptTags > 10) jsScore += 1; // Additional point for very heavy usage
    
    // Minimal content
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    breakdown.minimalContent = textContent.length < 500;
    if (breakdown.minimalContent) jsScore += 2;
    
    // AJAX patterns
    const ajaxPatterns = [
      /ajax|xhr|fetch\(/i,
      /axios\.|\.get|\.post/i,
      /async.*await/i,
      /json.*parse|json.*stringify/i
    ];
    
    ajaxPatterns.forEach(pattern => {
      if (pattern.test(html)) {
        jsScore += 1;
        breakdown.ajaxPatterns++;
      }
    });
    
    // Dynamic content
    const dynamicContentPatterns = [
      /loading\.\.\.|spinner|skeleton/i,
      /data-lazy|lazy-load/i,
      /infinite.*scroll/i,
      /dynamic.*import/i
    ];
    
    dynamicContentPatterns.forEach(pattern => {
      if (pattern.test(html)) {
        jsScore += 1;
        breakdown.dynamicContent++;
      }
    });
    
    // SPA indicators
    const spaPatterns = [
      /history\.push|router\.push/i,
      /route.*path|path.*route/i,
      /single.*page.*app|spa/i,
      /#\/|#!/i
    ];
    
    spaPatterns.forEach(pattern => {
      if (pattern.test(html)) {
        jsScore += 2;
        breakdown.spaIndicators++;
      }
    });
    
    // Legacy patterns
    breakdown.legacyPatterns = this.jsDetectionPatterns.filter(pattern => 
      htmlLower.includes(pattern)
    ).length;
    
    if (breakdown.legacyPatterns >= 2) {
      jsScore += 1;
    }
    
    // Generate recommendations
    const isJsHeavy = jsScore >= 4;
    
    if (isJsHeavy) {
      recommendations.push('Site requires Puppeteer for accurate crawling');
      if (breakdown.frameworkFootprints > 0) {
        recommendations.push('Modern JavaScript framework detected - content likely rendered client-side');
      }
      if (breakdown.minimalContent) {
        recommendations.push('Minimal server-rendered content - likely Single Page Application');
      }
      if (breakdown.spaIndicators > 0) {
        recommendations.push('SPA routing detected - navigation may not trigger page reloads');
      }
    } else {
      recommendations.push('Standard HTTP crawling should be sufficient');
      if (jsScore > 0) {
        recommendations.push('Some JavaScript detected but not heavy enough to require browser rendering');
      }
    }
    
    return {
      isJsHeavy,
      score: jsScore,
      maxScore: 20,
      breakdown,
      recommendations
    };
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

  /**
   * Manually register this instance for cleanup (useful for testing or special cases)
   */
  async registerForCleanup(): Promise<void> {
    if (!this.isRegisteredForCleanup) {
      try {
        const { registerServiceForCleanup } = await import('../../../index');
        registerServiceForCleanup(
          `PuppeteerHandler-${this.instanceId}`,
          async () => {
            await this.closePuppeteerCluster();
          }
        );
        this.isRegisteredForCleanup = true;
        console.log(`[PuppeteerHandler] Manually registered instance ${this.instanceId} for graceful shutdown`);
      } catch (error) {
        console.warn(`[PuppeteerHandler] Could not register for cleanup:`, error);
        throw error;
      }
    }
  }

  /**
   * Get the instance ID for this Puppeteer handler
   */
  getInstanceId(): string {
    return this.instanceId;
  }

  /**
   * Check if this instance is registered for cleanup
   */
  isRegisteredForGracefulShutdown(): boolean {
    return this.isRegisteredForCleanup;
  }
  
  /**
   * Get static information about the singleton cluster
   */
  static getClusterInfo(): {
    isInitialized: boolean;
    instanceCount: number;
    isShuttingDown: boolean;
    initializationInProgress: boolean;
    circuitBreaker: {
      state: string;
      isHealthy: boolean;
      failureRate: number;
      timeToReset?: number;
    };
    healthStatus: {
      lastHealthCheck: number;
      timeSinceLastCheck: number;
    };
  } {
    const now = Date.now();
    const circuitBreakerHealth = PuppeteerHandlerService.circuitBreaker.getHealthStatus();
    
    return {
      isInitialized: PuppeteerHandlerService.isClusterInitialized,
      instanceCount: PuppeteerHandlerService.instanceCount,
      isShuttingDown: PuppeteerHandlerService.isShuttingDown,
      initializationInProgress: PuppeteerHandlerService.initializationPromise !== null,
      initializationLock: PuppeteerHandlerService.initializationLock,
      circuitBreaker: {
        state: circuitBreakerHealth.state,
        isHealthy: circuitBreakerHealth.isHealthy,
        failureRate: circuitBreakerHealth.failureRate,
        timeToReset: circuitBreakerHealth.timeToReset
      },
      healthStatus: {
        lastHealthCheck: PuppeteerHandlerService.lastHealthCheck,
        timeSinceLastCheck: now - PuppeteerHandlerService.lastHealthCheck
      }
    };
  }
}