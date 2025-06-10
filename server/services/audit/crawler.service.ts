import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
// TODO: Define CrawlerOutput type
type CrawlerOutput = any;
import * as https from 'https';
import * as dns from 'dns';
import { promisify } from 'util';
import * as xml2js from 'xml2js';
import { Cluster } from 'puppeteer-cluster';

// DNS lookup with promise support
const dnsLookup = promisify(dns.lookup);
const dnsResolve = promisify(dns.resolve);

class Crawler {
  private MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB limit for HTML content
  private REQUEST_TIMEOUT = 45000; // 45 seconds timeout
  private USER_AGENT = 'SEO-Best-Practices-Assessment-Tool/1.0';
  private MAX_REDIRECTS = 10; // Maximum number of redirects to follow
  private CRAWL_DELAY = 500; // Delay between requests in milliseconds
  private MAX_PAGES = 250; // Maximum pages to crawl per site
  private CONCURRENT_REQUESTS = 5; // Maximum concurrent requests for parallel processing
  private USE_SITEMAP_DISCOVERY = true; // Enable sitemap-based page discovery
  private PREFILTER_CONTENT_TYPES = true; // Enable content-type pre-filtering
  private USE_PUPPETEER_FOR_JS_SITES = true; // Enable Puppeteer for JS-heavy sites
  private PUPPETEER_CLUSTER_SIZE = 2; // Number of browser instances in cluster
  
  // Map to cache DNS resolutions
  private dnsCache = new Map<string, string>();
  
  // Map to cache HTTP responses (to avoid crawling the same URL twice)
  private responseCache = new Map<string, any>();
  
  // Set to track broken links for verification
  private brokenLinks = new Set<string>();
  
  // Sitemap discovery cache
  private sitemapUrls = new Set<string>();
  private sitemapDiscovered = false;
  
  // Puppeteer cluster for JS-heavy sites
  private puppeteerCluster: Cluster | null = null;
  private jsDetectionPatterns = [
    'react', 'angular', 'vue', 'backbone', 'ember',
    'spa', 'ajax', 'xhr', 'fetch',
    'document.ready', 'window.onload',
    'ng-app', 'data-ng', 'v-if', 'v-for'
  ];
  
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
   * Pre-filter URLs by content type using HEAD requests
   */
  private async prefilterUrls(urls: string[]): Promise<string[]> {
    if (!this.PREFILTER_CONTENT_TYPES || urls.length === 0) {
      return urls;
    }
    
    console.log(`[Crawler] Pre-filtering ${urls.length} URLs by content type...`);
    const validUrls: string[] = [];
    
    // Process URLs in batches for HEAD requests
    const batchSize = Math.min(this.CONCURRENT_REQUESTS * 2, 10); // More concurrent HEAD requests
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      const headPromises = batch.map(async (url) => {
        try {
          const response = await axios.head(url, {
            timeout: 3000, // Shorter timeout for HEAD requests
            headers: { 'User-Agent': this.USER_AGENT },
            maxRedirects: 3,
            validateStatus: (status) => status < 500, // Accept 4xx to check content type
          });
          
          const contentType = response.headers['content-type'] || '';
          
          // Check if it's HTML content
          if (response.status === 200 && 
              (contentType.includes('text/html') || 
               contentType.includes('application/xhtml+xml') ||
               contentType === '')) { // Some servers don't return content-type for HEAD
            return { url, valid: true };
          }
          
          console.log(`[Crawler] Skipping non-HTML content: ${url} (${contentType})`);
          return { url, valid: false };
          
        } catch (error) {
          // If HEAD request fails, include URL anyway (might be server issue)
          return { url, valid: true };
        }
      });
      
      const batchResults = await Promise.allSettled(headPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.valid) {
          validUrls.push(result.value.url);
        }
      });
      
      // Small delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`[Crawler] Pre-filtering complete: ${validUrls.length}/${urls.length} URLs passed filter`);
    return validUrls;
  }
  
  /**
   * Process URLs in parallel batches with concurrency limiting
   */
  private async crawlUrlsInParallel(urls: string[], batchSize: number = this.CONCURRENT_REQUESTS): Promise<{ url: string; result: any; error?: string }[]> {
    const results: { url: string; result: any; error?: string }[] = [];
    
    // Process URLs in batches to limit concurrent requests
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      console.log(`[Crawler] Processing parallel batch ${Math.floor(i / batchSize) + 1} with ${batch.length} URLs`);
      
      // Process batch in parallel with Promise.allSettled to handle individual failures
      const batchPromises = batch.map(async (url) => {
        try {
          // Add small random delay to avoid overwhelming the server
          const randomDelay = Math.random() * 1000; // 0-1 second random delay
          await new Promise(resolve => setTimeout(resolve, randomDelay));
          
          const pageData = await this.crawlPage(url);
          this.crawledUrls.add(url);
          
          return { url, result: pageData };
        } catch (error) {
          console.error(`[Crawler] Error in parallel crawl for ${url}:`, error);
          this.stats.errorsEncountered++;
          return { url, result: null, error: error instanceof Error ? error.message : String(error) };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results and extract successful ones
      batchResults.forEach((promiseResult, index) => {
        if (promiseResult.status === 'fulfilled') {
          results.push(promiseResult.value);
        } else {
          console.error(`[Crawler] Promise rejected for URL ${batch[index]}:`, promiseResult.reason);
          results.push({ 
            url: batch[index], 
            result: null, 
            error: promiseResult.reason instanceof Error ? promiseResult.reason.message : String(promiseResult.reason)
          });
        }
      });
      
      // Add delay between batches to be respectful to the target server
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, this.CRAWL_DELAY));
      }
    }
    
    return results;
  }

  /**
   * Crawl a webpage and extract its data
   */
  async crawlPage(url: string): Promise<CrawlerOutput> {
    try {
      console.log(`[Crawler] Starting crawl for URL: ${url}`);
      
      // Validate and normalize the URL
      const normalizedUrl = this.normalizeUrl(url);
      console.log(`[Crawler] Normalized URL: ${normalizedUrl}`);
      
      // Check cache first
      if (this.responseCache.has(normalizedUrl)) {
        console.log(`[Crawler] Using cached response for: ${normalizedUrl}`);
        return this.responseCache.get(normalizedUrl);
      }
      
      // Initialize Puppeteer cluster if needed
      if (this.USE_PUPPETEER_FOR_JS_SITES && !this.puppeteerCluster) {
        await this.initializePuppeteerCluster();
      }
      
      console.log(`[Crawler] Crawling page: ${normalizedUrl}`);
      
      // Perform DNS resolution first to check domain availability and cache results
      console.log(`[Crawler] Checking DNS availability for domain...`);
      const dnsResult = await this.checkDomainAvailability(normalizedUrl);
      if (!dnsResult.available) {
        console.error(`[Crawler] DNS resolution failed:`, dnsResult.error);
        const errorOutput = this.createErrorOutput(
          normalizedUrl, 
          "DNS Error", 
          -1, 
          `Domain not available: ${dnsResult.error}`
        );
        this.responseCache.set(normalizedUrl, errorOutput);
        return errorOutput;
      }
      console.log(`[Crawler] DNS resolution successful`);
      
      // Start timer for performance measurement
      const startTime = Date.now();
      
      // Prepare the HTTP request
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false, // Allow self-signed certificates
        timeout: this.REQUEST_TIMEOUT
      });
      
      // Perform main page request with full settings
      let response;
      try {
        console.log(`[Crawler] Making HTTP request to ${normalizedUrl}...`);
        response = await axios.get(normalizedUrl, {
          headers: {
            'User-Agent': this.USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout: this.REQUEST_TIMEOUT,
          maxContentLength: this.MAX_CONTENT_SIZE,
          maxRedirects: this.MAX_REDIRECTS,
          validateStatus: (status) => status < 500, // Accept 4xx errors to analyze them
          httpsAgent,
          decompress: true, // Handle gzip/deflate automatically
        });
      } catch (error) {
        const fetchError = error as any;
        console.error(`[Crawler] ERROR fetching page ${normalizedUrl}:`, 
          fetchError instanceof Error ? fetchError.message : String(fetchError));
        console.error(`[Crawler] Error details:`, {
          code: fetchError.code,
          syscall: fetchError.syscall,
          hostname: fetchError.hostname,
          response: fetchError.response?.status,
          responseHeaders: fetchError.response?.headers,
          responseData: fetchError.response?.data?.substring ? fetchError.response.data.substring(0, 200) : fetchError.response?.data
        });
        
        // Determine if it's a 404 or other error
        const status = fetchError.response?.status || 0;
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Network error occurred';
        
        // Return a standardized error output for the analyzer
        const errorOutput = this.createErrorOutput(
          normalizedUrl, 
          status === 404 ? "Not Found" : "Error Page", 
          status, 
          errorMessage
        );
        
        this.responseCache.set(normalizedUrl, errorOutput);
        return errorOutput;
      }
      
      // Calculate page load time
      const loadTime = Date.now() - startTime;
      console.log(`[Crawler] HTTP response received - Status: ${response.status}, Content-Type: ${response.headers['content-type']}, Load time: ${loadTime}ms, Size: ${response.data.length} bytes`);
      
      // Check for common HTTP error status codes
      if (!response || response.status !== 200) {
        const errorMessage = this.getStatusCodeDescription(response?.status);
        const errorOutput = this.createErrorOutput(
          normalizedUrl,
          response?.statusText || "Error Page",
          response?.status || 0,
          errorMessage
        );
        
        this.responseCache.set(normalizedUrl, errorOutput);
        return errorOutput;
      }
      
      // Check content type to ensure we're dealing with HTML
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        const errorOutput = this.createErrorOutput(
          normalizedUrl,
          "Non-HTML Content",
          response.status,
          `Content type is ${contentType}, not HTML`
        );
        
        this.responseCache.set(normalizedUrl, errorOutput);
        return errorOutput;
      }
      
      // Capture response headers for analysis
      const responseHeaders = response.headers;
      
      // Parse the HTML
      const $ = cheerio.load(response.data);
      
      // Check if this is a JavaScript-heavy site that needs Puppeteer
      const isJsHeavy = this.detectJavaScriptHeavySite(response.data, normalizedUrl);
      
      if (isJsHeavy && this.puppeteerCluster && this.USE_PUPPETEER_FOR_JS_SITES) {
        console.log(`[Crawler] Switching to Puppeteer for JS-heavy site: ${normalizedUrl}`);
        try {
          const puppeteerResult = await this.crawlPageWithPuppeteer(normalizedUrl);
          this.responseCache.set(normalizedUrl, puppeteerResult);
          return puppeteerResult;
        } catch (puppeteerError) {
          console.log(`[Crawler] Puppeteer failed for ${normalizedUrl}, falling back to regular crawling:`, puppeteerError instanceof Error ? puppeteerError.message : 'Unknown error');
          // Continue with regular crawling as fallback
        }
      } else if (isJsHeavy && !this.puppeteerCluster) {
        console.log(`[Crawler] JS-heavy site detected but Puppeteer unavailable, using regular crawling: ${normalizedUrl}`);
      }
      
      // Check for noindex directive
      const noindex = this.checkNoindex($);
      
      // Extract links first to identify broken links
      const links = this.extractLinks($, normalizedUrl);
      
      // Perform a sample check of internal links to verify if they're broken
      await this.verifyInternalLinks(links.internal, normalizedUrl);
      
      // Get resource size information
      const resourceSize = Buffer.from(response.data).length;
      const totalResourceCount = $('img, script, link[rel="stylesheet"], source, iframe').length;
      
      // Calculate additional performance metrics
      const contentLength = parseInt(responseHeaders['content-length'] || '0', 10) || resourceSize;
      
      // Extract all other data
      const result = {
        url: normalizedUrl,
        statusCode: response.status,
        title: $('title').text().trim(),
        meta: this.extractMetaTags($),
        content: this.extractContent($),
        headings: this.extractHeadings($),
        links: links,
        images: this.extractImages($, normalizedUrl),
        schema: this.extractSchemaMarkup($),
        mobileCompatible: this.checkMobileCompatibility($),
        performance: {
          loadTime,
          resourceCount: totalResourceCount,
          resourceSize: contentLength
        },
        security: {
          hasHttps: normalizedUrl.startsWith('https://'),
          hasMixedContent: this.checkMixedContent($, normalizedUrl),
          hasSecurityHeaders: this.checkSecurityHeaders(responseHeaders)
        },
        accessibility: this.checkAccessibility($),
        seoIssues: {
          noindex,
          brokenLinks: links.internal.filter((link: {url: string, text: string, broken: boolean}) => link.broken).length,
          missingAltText: this.countMissingAltText($),
          duplicateMetaTags: this.checkDuplicateMetaTags($),
          thinContent: this.checkThinContent($),
          missingHeadings: this.checkMissingHeadings($),
          robots: responseHeaders['x-robots-tag'] || $('meta[name="robots"]').attr('content')
        },
        html: response.data, // Add html field for the analyzer
        rawHtml: response.data // Store raw HTML for deep content analysis
      };
      
      // Cache the result
      this.responseCache.set(normalizedUrl, result);
      
      // Apply crawl delay to be respectful
      await new Promise(resolve => setTimeout(resolve, this.CRAWL_DELAY));
      
      return result;
    } catch (error) {
      console.error('[Crawler] CRITICAL ERROR crawling page:', error);
      console.error('[Crawler] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Create a minimal but valid structure for analysis
      const errorResponse = error as any;
      const errorOutput = this.createErrorOutput(
        typeof url === 'string' ? url : 'unknown-url',
        "Error Page",
        errorResponse?.response?.status || 0,
        errorResponse?.message || 'Unknown error occurred while crawling'
      );
      
      return errorOutput;
    }
  }
  
  /**
   * Create standardized error output
   */
  private createErrorOutput(url: string, title: string, statusCode: number, errorMessage: string): CrawlerOutput {
    return {
      url,
      title,
      statusCode,
      meta: { 
        description: "Error accessing page content", 
        ogTags: {}, 
        twitterTags: {} 
      },
      content: { 
        text: `Error: ${errorMessage}`, 
        wordCount: errorMessage.split(/\s+/).length, 
        paragraphs: [`Error: ${errorMessage}`] 
      },
      headings: { 
        h1: [title], 
        h2: [], h3: [], h4: [], h5: [], h6: [] 
      },
      links: { internal: [], external: [] },
      images: [],
      schema: [],
      mobileCompatible: false,
      performance: { loadTime: 0, resourceCount: 0, resourceSize: 0 },
      security: {
        hasHttps: url.startsWith('https://'),
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
        thinContent: true,
        missingHeadings: true,
        robots: null
      },
      error: errorMessage,
      html: `<html><body><h1>${title}</h1><p>${errorMessage}</p></body></html>`,
      rawHtml: `<html><body><h1>${title}</h1><p>${errorMessage}</p></body></html>`
    };
  }

  /**
   * Check domain availability using DNS lookup
   */
  private async checkDomainAvailability(url: string): Promise<{available: boolean, error?: string}> {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      
      // Check cache first
      if (this.dnsCache.has(hostname)) {
        return { available: true };
      }
      
      // Try DNS lookup
      const dnsResult = await dnsLookup(hostname).catch(err => {
        return { error: err.message };
      });
      
      if ('error' in dnsResult) {
        return { available: false, error: dnsResult.error };
      }
      
      // Cache the successful result
      this.dnsCache.set(hostname, dnsResult.address);
      return { available: true };
    } catch (error) {
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown DNS error' 
      };
    }
  }
  
  /**
   * Verify internal links to check if they're broken
   */
  private async verifyInternalLinks(
    links: Array<{ url: string, text: string, broken: boolean }>,
    baseUrl: string
  ): Promise<void> {
    // Only check a sample of internal links (up to 5) to avoid overloading the server
    const linksToCheck = links.slice(0, 5);
    
    const baseDomain = new URL(baseUrl).hostname;
    
    for (const link of linksToCheck) {
      // Skip if already known to be broken
      if (link.broken) continue;
      
      // Skip if already checked
      if (this.brokenLinks.has(link.url)) {
        link.broken = true;
        continue;
      }
      
      try {
        const parsedUrl = new URL(link.url);
        
        // Only check links on the same domain
        if (parsedUrl.hostname !== baseDomain) continue;
        
        // Use a HEAD request with shorter timeout for efficiency
        const headResponse = await axios.head(link.url, {
          timeout: 5000,
          maxRedirects: 3,
          validateStatus: () => true, // Accept all status codes
        }).catch(err => {
          // Mark as broken on network errors
          return { status: 0 };
        });
        
        // Consider 4xx and 5xx as broken
        if (headResponse.status >= 400) {
          link.broken = true;
          this.brokenLinks.add(link.url);
        }
      } catch (error) {
        // Mark as broken on any error
        link.broken = true;
        this.brokenLinks.add(link.url);
      }
      
      // Small delay between checks to be respectful
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  /**
   * Check for mixed content issues (HTTP resources on HTTPS page)
   */
  private checkMixedContent($: cheerio.CheerioAPI, baseUrl: string): boolean {
    if (!baseUrl.startsWith('https://')) return false;
    
    // Check for HTTP resources on HTTPS page
    const mixedContentSelectors = [
      'img[src^="http:"]',
      'script[src^="http:"]',
      'link[href^="http:"]',
      'iframe[src^="http:"]',
      'object[data^="http:"]',
      'form[action^="http:"]'
    ];
    
    for (const selector of mixedContentSelectors) {
      if ($(selector).length > 0) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check for important security headers
   */
  private checkSecurityHeaders(headers: any): boolean {
    const securityHeaders = [
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'strict-transport-security',
      'x-xss-protection'
    ];
    
    // Convert all header names to lowercase for case-insensitive comparison
    const normalizedHeaders = Object.keys(headers).map(h => h.toLowerCase());
    
    // Check if at least 2 security headers are present
    return securityHeaders.filter(h => normalizedHeaders.includes(h)).length >= 2;
  }
  
  /**
   * Check for accessibility features
   */
  private checkAccessibility($: cheerio.CheerioAPI): {
    hasAccessibleElements: boolean,
    missingAltText: number,
    hasAriaAttributes: boolean,
    hasProperHeadingStructure: boolean
  } {
    // Count images without alt text
    const missingAltText = this.countMissingAltText($);
    
    // Check for ARIA attributes
    const hasAriaAttributes = $('[aria-label], [aria-describedby], [aria-labelledby], [role]').length > 0;
    
    // Check for proper heading structure (h1 followed by h2, etc.)
    const hasH1 = $('h1').length > 0;
    const hasH2AfterH1 = hasH1 && $('h1 ~ h2').length > 0;
    
    return {
      hasAccessibleElements: hasAriaAttributes || missingAltText === 0,
      missingAltText,
      hasAriaAttributes,
      hasProperHeadingStructure: hasH1 && hasH2AfterH1
    };
  }
  
  /**
   * Count images missing alt text
   */
  private countMissingAltText($: cheerio.CheerioAPI): number {
    let count = 0;
    $('img').each((_, el) => {
      const alt = $(el).attr('alt');
      // Count as missing if alt attribute is absent or empty
      if (alt === undefined || alt.trim() === '') {
        count++;
      }
    });
    return count;
  }
  
  /**
   * Check for noindex directive in meta tags or headers
   */
  private checkNoindex($: cheerio.CheerioAPI): boolean {
    // Check in robots meta tag
    const robotsContent = $('meta[name="robots"]').attr('content') || '';
    if (robotsContent.includes('noindex')) {
      return true;
    }
    
    // Check in googlebot meta tag
    const googlebotContent = $('meta[name="googlebot"]').attr('content') || '';
    if (googlebotContent.includes('noindex')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check for duplicate meta tags
   */
  private checkDuplicateMetaTags($: cheerio.CheerioAPI): boolean {
    const titleCount = $('title').length;
    const descriptionCount = $('meta[name="description"]').length;
    
    return titleCount > 1 || descriptionCount > 1;
  }
  
  /**
   * Check for thin content (low word count)
   */
  private checkThinContent($: cheerio.CheerioAPI): boolean {
    const text = $('body').text().trim().replace(/\s+/g, ' ');
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    
    return wordCount < 300; // Generally, content with fewer than 300 words is considered thin
  }
  
  /**
   * Check for missing h1 or heading structure issues
   */
  private checkMissingHeadings($: cheerio.CheerioAPI): boolean {
    return $('h1').length === 0;
  }
  
  /**
   * Get descriptive message for HTTP status codes
   */
  private getStatusCodeDescription(statusCode: number | undefined): string {
    if (!statusCode) return 'Unknown error: No status code returned';
    
    const statusMessages: Record<number, string> = {
      400: 'Bad Request - The server could not understand the request',
      401: 'Unauthorized - Authentication is required to access this resource',
      403: 'Forbidden - The server refuses to fulfill the request',
      404: 'Not Found - The requested resource could not be found',
      405: 'Method Not Allowed - The request method is not supported',
      406: 'Not Acceptable - The server cannot produce a response matching the list of acceptable values',
      407: 'Proxy Authentication Required - Authentication with the proxy is required',
      408: 'Request Timeout - The server timed out waiting for the request',
      409: 'Conflict - The request could not be completed due to a conflict',
      410: 'Gone - The requested resource is no longer available',
      429: 'Too Many Requests - The user has sent too many requests in a given amount of time',
      500: 'Internal Server Error - The server encountered an unexpected condition',
      501: 'Not Implemented - The server does not support the functionality required',
      502: 'Bad Gateway - The server received an invalid response from an upstream server',
      503: 'Service Unavailable - The server is currently unable to handle the request',
      504: 'Gateway Timeout - The server did not receive a timely response from an upstream server',
    };
    
    return statusMessages[statusCode] || `HTTP error ${statusCode}`;
  }

  /**
   * Validate and normalize the URL
   */
  private normalizeUrl(url: string): string {
    // Clean up URL string - remove extra spaces
    url = url.trim();
    
    // Handle double protocol issues (e.g., https://https://)
    url = url.replace(/^(https?:\/\/)+/i, '$1');
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.toString();
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  /**
   * Extract meta tags from the HTML
   */
  private extractMetaTags($: cheerio.CheerioAPI): any {
    const meta = {
      description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content'),
      robots: $('meta[name="robots"]').attr('content'),
      viewport: $('meta[name="viewport"]').attr('content'),
      canonical: $('link[rel="canonical"]').attr('href'),
      ogTags: {} as Record<string, string>,
      twitterTags: {} as Record<string, string>,
    };
    
    // Extract Open Graph meta tags
    $('meta[property^="og:"]').each((_, el) => {
      const property = $(el).attr('property');
      const content = $(el).attr('content');
      if (property && content) {
        meta.ogTags[property.replace('og:', '')] = content;
      }
    });
    
    // Extract Twitter Card meta tags
    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr('name');
      const content = $(el).attr('content');
      if (name && content) {
        meta.twitterTags[name.replace('twitter:', '')] = content;
      }
    });
    
    return meta;
  }

  /**
   * Extract content from the HTML
   */
  private extractContent($: cheerio.CheerioAPI): any {
    // Remove script and style elements
    $('script, style, noscript, iframe, object, embed').remove();
    
    const paragraphs: string[] = [];
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text) paragraphs.push(text);
    });
    
    // Get all text from the body
    const text = $('body').text().trim()
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    return {
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      paragraphs,
    };
  }

  /**
   * Extract headings from the HTML
   */
  private extractHeadings($: cheerio.CheerioAPI): any {
    const headings = {
      h1: [] as string[],
      h2: [] as string[],
      h3: [] as string[],
      h4: [] as string[],
      h5: [] as string[],
      h6: [] as string[],
    };
    
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
      $(tag).each((_, el) => {
        const text = $(el).text().trim();
        if (text) headings[tag as keyof typeof headings].push(text);
      });
    });
    
    return headings;
  }

  /**
   * Extract links from the HTML
   */
  private extractLinks($: cheerio.CheerioAPI, baseUrl: string): any {
    const parsedBaseUrl = new URL(baseUrl);
    const baseDomain = parsedBaseUrl.hostname;
    
    const internal: Array<{ url: string, text: string, broken: boolean }> = [];
    const external: Array<{ url: string, text: string }> = [];
    
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      
      // Skip empty links, anchors, javascript, and mailto
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
        return;
      }
      
      try {
        // Try to resolve relative URLs
        const resolvedUrl = new URL(href, baseUrl).toString();
        const parsedUrl = new URL(resolvedUrl);
        
        if (parsedUrl.hostname === baseDomain) {
          internal.push({ url: resolvedUrl, text, broken: false });
        } else {
          external.push({ url: resolvedUrl, text });
        }
      } catch (error) {
        // If URL parsing fails, assume it's an internal broken link
        internal.push({ url: href, text, broken: true });
      }
    });
    
    return { internal, external };
  }

  /**
   * Extract images from the HTML
   */
  private extractImages($: cheerio.CheerioAPI, baseUrl: string): Array<{ url: string, alt?: string, size?: number }> {
    const images: Array<{ url: string, alt?: string, size?: number }> = [];
    
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      const alt = $(el).attr('alt');
      
      if (src) {
        try {
          // Try to resolve relative URLs
          const resolvedUrl = new URL(src, baseUrl).toString();
          images.push({ url: resolvedUrl, alt });
        } catch (error) {
          // If URL parsing fails, use the original src
          images.push({ url: src, alt });
        }
      }
    });
    
    return images;
  }

  /**
   * Extract schema markup from the HTML
   */
  private extractSchemaMarkup($: cheerio.CheerioAPI): Array<{ types: string[], json: string }> {
    const schema: Array<{ types: string[], json: string }> = [];
    
    // Look for JSON-LD script tags
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = $(el).html();
        if (!json) return;
        
        const data = JSON.parse(json);
        let types: string[] = [];
        
        // Handle different schema formats
        if (data['@type']) {
          types = Array.isArray(data['@type']) ? data['@type'] : [data['@type']];
        } else if (data['@graph'] && Array.isArray(data['@graph'])) {
          // Extract types from graph items
          data['@graph'].forEach((item: any) => {
            if (item['@type']) {
              const itemTypes = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
              types = [...types, ...itemTypes];
            }
          });
        }
        
        // Check for microdata schema
        if (types.length === 0) {
          // Find itemscope elements and get their itemtype
          $('[itemscope]').each((_, el) => {
            const itemtype = $(el).attr('itemtype');
            if (itemtype) {
              types.push(itemtype.split('/').pop() || itemtype);
            }
          });
        }
        
        // Cleanup and de-duplicate types
        types = Array.from(new Set(types.filter(t => t)));
        
        schema.push({ types, json });
      } catch (error) {
        console.error('Error parsing JSON-LD schema:', error);
        // Continue to the next schema
      }
    });
    
    // Also check for RDFa schemas
    $('[property], [typeof]').each((_, el) => {
      try {
        const typeValue = $(el).attr('typeof');
        const property = $(el).attr('property');
        
        if (typeValue || property) {
          const types = typeValue ? [typeValue] : [];
          if (property && property.includes('schema.org')) {
            types.push(property.split('/').pop() || property);
          }
          
          if (types.length > 0) {
            const content = $(el).text().trim();
            schema.push({ 
              types, 
              json: JSON.stringify({ '@type': types[0], content })
            });
          }
        }
      } catch (error) {
        console.error('Error extracting RDFa schema:', error);
      }
    });
    
    return schema;
  }

  /**
   * Check if the page is optimized for mobile
   */
  private checkMobileCompatibility($: cheerio.CheerioAPI): boolean {
    // Check for viewport meta tag
    const viewport = $('meta[name="viewport"]').attr('content');
    if (!viewport) return false;
    
    // Check if viewport contains width=device-width
    return viewport.includes('width=device-width');
  }

  /**
   * Initialize Puppeteer cluster for JavaScript-heavy sites
   */
  private async initializePuppeteerCluster(): Promise<void> {
    if (!this.USE_PUPPETEER_FOR_JS_SITES || this.puppeteerCluster) {
      return;
    }
    
    try {
      console.log(`[Crawler] Initializing Puppeteer cluster with ${this.PUPPETEER_CLUSTER_SIZE} instances`);
      
      this.puppeteerCluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: this.PUPPETEER_CLUSTER_SIZE,
        puppeteerOptions: {
          headless: true,
          executablePath: process.env.CHROME_EXECUTABLE_PATH || undefined,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--window-size=1920x1080'
          ]
        },
        timeout: 30000,
        retryLimit: 1,
        retryDelay: 1000,
      });
      
      // Set up task handler for crawling
      await this.puppeteerCluster.task(async ({ page, data: url }) => {
        console.log(`[Crawler] Puppeteer crawling: ${url}`);
        
        // Set viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent(this.USER_AGENT);
        
        // Block unnecessary resources to speed up loading
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const resourceType = req.resourceType();
          if (['image', 'font', 'media'].includes(resourceType)) {
            req.abort();
          } else {
            req.continue();
          }
        });
        
        // Navigate to page and wait for content
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 25000 
        });
        
        // Wait a bit for dynamic content to load
        await page.waitForTimeout(2000);
        
        // Extract page data
        const data = await page.evaluate(() => {
          return {
            title: document.title,
            html: document.documentElement.outerHTML,
            url: window.location.href
          };
        });
        
        return data;
      });
      
      console.log(`[Crawler] Puppeteer cluster initialized successfully`);
    } catch (error) {
      console.error(`[Crawler] Failed to initialize Puppeteer cluster:`, error);
      console.log(`[Crawler] Disabling Puppeteer for this session - will use regular crawling for all pages`);
      this.puppeteerCluster = null;
      this.USE_PUPPETEER_FOR_JS_SITES = false; // Disable for this session
    }
  }
  
  /**
   * Clean up Puppeteer cluster
   */
  private async closePuppeteerCluster(): Promise<void> {
    if (this.puppeteerCluster) {
      try {
        console.log(`[Crawler] Closing Puppeteer cluster`);
        await this.puppeteerCluster.idle();
        await this.puppeteerCluster.close();
        this.puppeteerCluster = null;
      } catch (error) {
        console.error(`[Crawler] Error closing Puppeteer cluster:`, error);
      }
    }
  }
  
  /**
   * Detect if a site is JavaScript-heavy
   */
  private detectJavaScriptHeavySite(html: string, url: string): boolean {
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
      console.log(`[Crawler] Detected JS-heavy site: ${url} (patterns: ${jsPatternCount}, minimal content: ${hasMinimalContent}, scripts: ${scriptTags})`);
    }
    
    return isJsHeavy;
  }
  
  /**
   * Crawl page using Puppeteer for JavaScript-heavy sites
   */
  private async crawlPageWithPuppeteer(url: string): Promise<CrawlerOutput> {
    if (!this.puppeteerCluster) {
      throw new Error('Puppeteer cluster not initialized');
    }
    
    try {
      const startTime = Date.now();
      
      // Execute crawling task in cluster
      const result = await this.puppeteerCluster.execute(url);
      
      const loadTime = Date.now() - startTime;
      
      // Parse the HTML with Cheerio for consistent data extraction
      const $ = cheerio.load(result.html);
      
      // Extract all the same data as regular crawling
      const crawlResult = {
        url: result.url,
        statusCode: 200, // Puppeteer successful navigation
        title: result.title || $('title').text().trim(),
        meta: this.extractMetaTags($),
        content: this.extractContent($),
        headings: this.extractHeadings($),
        links: this.extractLinks($, result.url),
        images: this.extractImages($, result.url),
        schema: this.extractSchemaMarkup($),
        mobileCompatible: this.checkMobileCompatibility($),
        performance: {
          loadTime,
          resourceCount: $('img, script, link[rel="stylesheet"], source, iframe').length,
          resourceSize: result.html.length
        },
        security: {
          hasHttps: result.url.startsWith('https://'),
          hasMixedContent: this.checkMixedContent($, result.url),
          hasSecurityHeaders: false // Can't check headers with Puppeteer easily
        },
        accessibility: this.checkAccessibility($),
        seoIssues: {
          noindex: this.checkNoindex($),
          brokenLinks: 0, // Will be checked separately
          missingAltText: this.countMissingAltText($),
          duplicateMetaTags: this.checkDuplicateMetaTags($),
          thinContent: this.checkThinContent($),
          missingHeadings: this.checkMissingHeadings($),
          robots: $('meta[name="robots"]').attr('content')
        },
        html: result.html,
        rawHtml: result.html,
        puppeteerUsed: true // Flag to indicate Puppeteer was used
      };
      
      console.log(`[Crawler] Puppeteer crawl completed for ${url} in ${loadTime}ms`);
      return crawlResult;
      
    } catch (error) {
      console.error(`[Crawler] Puppeteer crawl failed for ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Reset crawler state for a new site crawl
   */
  reset(): void {
    this.crawledUrls.clear();
    this.pendingUrls = [];
    this.currentSite = '';
    this.stats = {
      pagesCrawled: 0,
      pagesSkipped: 0,
      errorsEncountered: 0,
      startTime: 0,
      endTime: 0
    };
    
    // Reset sitemap discovery
    this.sitemapUrls.clear();
    this.sitemapDiscovered = false;
  }

  /**
   * Get crawler statistics
   */
  getStats() {
    return {
      ...this.stats,
      crawlTime: this.stats.endTime ? this.stats.endTime - this.stats.startTime : 0,
      cacheSize: this.responseCache.size,
      dnsCache: this.dnsCache.size
    };
  }

  /**
   * Crawl an entire site starting from the homepage
   */
  async crawlSite(url: string): Promise<any> {
    console.log(`[Crawler] Starting site crawl for: ${url}`);
    
    this.reset();
    this.stats.startTime = Date.now();
    this.currentSite = new URL(url).origin;
    
    try {
      // Initialize Puppeteer cluster for potential JS-heavy sites
      if (this.USE_PUPPETEER_FOR_JS_SITES) {
        await this.initializePuppeteerCluster();
      }
      // Crawl the homepage first
      const homepage = await this.crawlPage(url);
      this.stats.pagesCrawled++;
      
      if (homepage.error) {
        console.error(`[Crawler] Failed to crawl homepage: ${homepage.error}`);
        this.stats.errorsEncountered++;
        this.stats.endTime = Date.now();
        
        return {
          homepage,
          otherPages: [],
          contactPage: undefined,
          servicePages: [],
          locationPages: [],
          serviceAreaPages: [],
          hasSitemapXml: false,
          reachedMaxPages: false
        };
      }

      // Convert homepage data to PageCrawlResult format
      const homepageResult = this.convertToPageCrawlResult(homepage);
      
      // Intelligent page discovery: Try sitemap first, fallback to link crawling
      let discoveredUrls: string[] = [];
      
      // Phase 1: Sitemap-based discovery
      const sitemapUrls = await this.discoverUrlsFromSitemap(url);
      if (sitemapUrls.length > 0) {
        console.log(`[Crawler] Using sitemap-based discovery: ${sitemapUrls.length} URLs found`);
        discoveredUrls = sitemapUrls.slice(0, this.MAX_PAGES - 1);
      } else {
        console.log(`[Crawler] Sitemap discovery failed, falling back to link crawling`);
        // Phase 2: Link crawling fallback
        if (homepage.links && homepage.links.internal) {
          discoveredUrls = homepage.links.internal
            .map((link: any) => typeof link === 'string' ? link : link.url)
            .filter((link: string) => this.shouldCrawlUrl(link))
            .slice(0, this.MAX_PAGES - 1); // Reserve space for homepage
        }
      }
      
      // Pre-filter URLs by content type
      const validUrls = await this.prefilterUrls(discoveredUrls);
      this.pendingUrls = validUrls;

      // Crawl additional pages using parallel processing
      const otherPages: any[] = [];
      let crawledCount = 1; // Already crawled homepage
      let discoveredNewLinks = true;

      while (this.pendingUrls.length > 0 && crawledCount < this.MAX_PAGES && discoveredNewLinks) {
        // Get batch of URLs to process in parallel
        const urlsToProcess = this.pendingUrls
          .filter(url => !this.crawledUrls.has(url))
          .slice(0, Math.min(this.MAX_PAGES - crawledCount, this.CONCURRENT_REQUESTS * 2)) // Process up to 2 batches worth
          .slice(0, this.MAX_PAGES - crawledCount); // Don't exceed max pages
        
        if (urlsToProcess.length === 0) break;
        
        // Remove processed URLs from pending list
        urlsToProcess.forEach(url => {
          const index = this.pendingUrls.indexOf(url);
          if (index > -1) this.pendingUrls.splice(index, 1);
        });
        
        console.log(`[Crawler] Processing ${urlsToProcess.length} pages in parallel (${crawledCount + 1}-${crawledCount + urlsToProcess.length}/${this.MAX_PAGES})`);
        
        // Process URLs in parallel
        const parallelResults = await this.crawlUrlsInParallel(urlsToProcess);
        
        // Process results and collect new links
        const newLinksThisRound: string[] = [];
        
        for (const { url, result, error } of parallelResults) {
          if (error || (result && result.error)) {
            this.stats.errorsEncountered++;
            console.log(`[Crawler] Error crawling ${url}: ${error || result.error}`);
          } else if (result) {
            // Only increment crawledCount for successful crawls
            crawledCount++;
            const pageResult = this.convertToPageCrawlResult(result);
            otherPages.push(pageResult);
            this.stats.pagesCrawled++;
            
            // Collect new internal links from this page
            if (result.links && result.links.internal && crawledCount < this.MAX_PAGES * 0.8) {
              const newLinks = result.links.internal
                .map((link: any) => typeof link === 'string' ? link : link.url)
                .filter((link: string) => this.shouldCrawlUrl(link) && !this.crawledUrls.has(link))
                .slice(0, 5); // Reduced from 10 to 5 to prevent exponential growth
              
              newLinksThisRound.push(...newLinks);
            }
          }
        }
        
        // Add new discovered links to pending queue (deduplicated)
        const uniqueNewLinks = Array.from(new Set(newLinksThisRound))
          .filter(link => !this.crawledUrls.has(link) && !this.pendingUrls.includes(link));
        
        this.pendingUrls.push(...uniqueNewLinks);
        discoveredNewLinks = uniqueNewLinks.length > 0;
        
        console.log(`[Crawler] Found ${uniqueNewLinks.length} new links, ${this.pendingUrls.length} URLs remaining in queue`);
        console.log(`[Crawler] Loop status: crawledCount=${crawledCount}, MAX_PAGES=${this.MAX_PAGES}, pendingUrls=${this.pendingUrls.length}, discoveredNewLinks=${discoveredNewLinks}`);
        
        // Add explicit loop termination debugging
        if (crawledCount >= this.MAX_PAGES) {
          console.log(`[Crawler] Stopping crawl: reached MAX_PAGES limit (${this.MAX_PAGES})`);
          break;
        }
        if (this.pendingUrls.length === 0) {
          console.log(`[Crawler] Stopping crawl: no more URLs in queue`);
          break;
        }
        if (!discoveredNewLinks) {
          console.log(`[Crawler] Stopping crawl: no new links discovered in this round`);
          break;
        }
      }

      // Check for sitemap.xml
      const hasSitemapXml = await this.checkSitemap(url);

      this.stats.endTime = Date.now();
      
      // Clean up Puppeteer cluster
      await this.closePuppeteerCluster();
      
      const result = {
        homepage: homepageResult,
        otherPages,
        contactPage: undefined, // Will be classified later
        servicePages: [],
        locationPages: [],
        serviceAreaPages: [],
        hasSitemapXml,
        reachedMaxPages: crawledCount >= this.MAX_PAGES
      };

      console.log(`[Crawler] Site crawl completed. Pages crawled: ${this.stats.pagesCrawled}, Errors: ${this.stats.errorsEncountered}, URLs remaining: ${this.pendingUrls.length}`);
      return result;

    } catch (error) {
      console.error(`[Crawler] Site crawl failed for ${url}:`, error);
      this.stats.errorsEncountered++;
      this.stats.endTime = Date.now();
      
      // Clean up Puppeteer cluster on error
      await this.closePuppeteerCluster();
      
      throw error;
    }
  }

  /**
   * Continue crawling from where we left off
   */
  async continueCrawl(url: string): Promise<any> {
    console.log(`[Crawler] Continuing site crawl for: ${url}`);
    
    // If no previous crawl state, start fresh
    if (!this.currentSite || this.stats.pagesCrawled === 0) {
      return this.crawlSite(url);
    }

    // Continue with remaining URLs using parallel processing
    const otherPages: any[] = [];
    let crawledCount = this.stats.pagesCrawled;

    while (this.pendingUrls.length > 0 && crawledCount < this.MAX_PAGES) {
      // Get batch of URLs to process in parallel
      const urlsToProcess = this.pendingUrls
        .filter(url => !this.crawledUrls.has(url))
        .slice(0, Math.min(this.MAX_PAGES - crawledCount, this.CONCURRENT_REQUESTS * 2))
        .slice(0, this.MAX_PAGES - crawledCount);
      
      if (urlsToProcess.length === 0) break;
      
      // Remove processed URLs from pending list
      urlsToProcess.forEach(url => {
        const index = this.pendingUrls.indexOf(url);
        if (index > -1) this.pendingUrls.splice(index, 1);
      });
      
      console.log(`[Crawler] Continuing crawl with ${urlsToProcess.length} pages in parallel (${crawledCount + 1}-${crawledCount + urlsToProcess.length}/${this.MAX_PAGES})`);
      
      // Process URLs in parallel
      const parallelResults = await this.crawlUrlsInParallel(urlsToProcess);
      
      // Process results
      for (const { url, result, error } of parallelResults) {
        if (error || (result && result.error)) {
          this.stats.errorsEncountered++;
          console.log(`[Crawler] Error in continued crawl ${url}: ${error || result.error}`);
        } else if (result) {
          // Only increment crawledCount for successful crawls
          crawledCount++;
          const pageResult = this.convertToPageCrawlResult(result);
          otherPages.push(pageResult);
          this.stats.pagesCrawled++;
        }
      }
      
      console.log(`[Crawler] Continue crawl status: crawledCount=${crawledCount}, MAX_PAGES=${this.MAX_PAGES}, pendingUrls=${this.pendingUrls.length}`);
      
      // Add explicit termination condition check
      if (crawledCount >= this.MAX_PAGES) {
        console.log(`[Crawler] Stopping continued crawl: reached MAX_PAGES limit (${this.MAX_PAGES})`);
        break;
      }
    }

    this.stats.endTime = Date.now();
    
    return {
      homepage: null, // Already crawled in initial crawl
      otherPages,
      contactPage: undefined,
      servicePages: [],
      locationPages: [],
      serviceAreaPages: [],
      hasSitemapXml: false,
      reachedMaxPages: crawledCount >= this.MAX_PAGES
    };
  }

  /**
   * Convert crawler output to PageCrawlResult format
   */
  private convertToPageCrawlResult(crawlerOutput: any): any {
    return {
      url: crawlerOutput.url,
      title: crawlerOutput.title,
      metaDescription: crawlerOutput.meta?.description || '',
      bodyText: crawlerOutput.content?.text || '',
      rawHtml: crawlerOutput.rawHtml || crawlerOutput.html || '',
      h1s: crawlerOutput.headings?.h1 || [],
      h2s: crawlerOutput.headings?.h2 || [],
      h3s: crawlerOutput.headings?.h3 || [],
      headings: {
        h1: crawlerOutput.headings?.h1 || [],
        h2: crawlerOutput.headings?.h2 || [],
        h3: crawlerOutput.headings?.h3 || []
      },
      links: {
        internal: (crawlerOutput.links?.internal || []).map((link: any) => 
          typeof link === 'string' ? link : link.url
        ),
        external: (crawlerOutput.links?.external || []).map((link: any) => 
          typeof link === 'string' ? link : link.url
        ),
        broken: (crawlerOutput.links?.internal || [])
          .filter((link: any) => typeof link === 'object' && link.broken)
          .map((link: any) => link.url)
      },
      hasContactForm: this.hasContactForm(crawlerOutput.rawHtml || crawlerOutput.html || ''),
      hasPhoneNumber: this.hasPhoneNumber(crawlerOutput.content?.text || ''),
      hasAddress: this.hasAddress(crawlerOutput.content?.text || ''),
      hasNAP: this.hasNAP(crawlerOutput.content?.text || ''),
      images: {
        total: crawlerOutput.images?.length || 0,
        withAlt: (crawlerOutput.images || []).filter((img: any) => img.alt).length,
        withoutAlt: (crawlerOutput.images || []).filter((img: any) => !img.alt).length,
        largeImages: 0, // Could be enhanced
        altTexts: (crawlerOutput.images || []).map((img: any) => img.alt).filter(Boolean)
      },
      hasSchema: (crawlerOutput.schema || []).length > 0,
      schemaTypes: (crawlerOutput.schema || []).flatMap((s: any) => s.types || []),
      mobileFriendly: crawlerOutput.mobileCompatible || false,
      wordCount: crawlerOutput.content?.wordCount || 0,
      hasSocialTags: Object.keys(crawlerOutput.meta?.ogTags || {}).length > 0 || 
                     Object.keys(crawlerOutput.meta?.twitterTags || {}).length > 0,
      hasCanonical: !!crawlerOutput.meta?.canonical,
      hasRobotsMeta: !!crawlerOutput.meta?.robots,
      hasIcon: false, // Could be enhanced
      hasHttps: crawlerOutput.security?.hasHttps || false,
      hasHreflang: false, // Could be enhanced
      hasSitemap: false, // Determined separately
      hasAmpVersion: false, // Could be enhanced
      pageLoadSpeed: {
        score: this.calculateSpeedScore(crawlerOutput.performance),
        firstContentfulPaint: 0,
        totalBlockingTime: 0,
        largestContentfulPaint: 0
      },
      keywordDensity: {},
      readabilityScore: 0,
      contentStructure: {
        hasFAQs: this.hasFAQs(crawlerOutput.content?.text || ''),
        hasTable: this.hasTable(crawlerOutput.rawHtml || crawlerOutput.html || ''),
        hasLists: this.hasLists(crawlerOutput.rawHtml || crawlerOutput.html || ''),
        hasVideo: this.hasVideo(crawlerOutput.rawHtml || crawlerOutput.html || ''),
        hasEmphasis: this.hasEmphasis(crawlerOutput.rawHtml || crawlerOutput.html || '')
      }
    };
  }

  /**
   * Check if URL should be crawled
   */
  private shouldCrawlUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const baseDomain = new URL(this.currentSite).hostname;
      
      // Only crawl same domain
      if (parsedUrl.hostname !== baseDomain) return false;
      
      // Skip certain file types
      const skipExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.css', '.js', '.zip', '.doc', '.docx'];
      if (skipExtensions.some(ext => parsedUrl.pathname.toLowerCase().endsWith(ext))) return false;
      
      // Skip admin/system paths, CMS content, and blog directories
      const skipPaths = [
        // Admin and system paths
        '/admin', '/wp-admin', '/login', '/register', '/cart', '/checkout',
        // WordPress content and uploads
        '/wp-content', '/wp-includes', '/wp-json', '/wp-admin',
        // Blog and content paths that are often not core pages
        '/blog/', '/blogs/', '/news/', '/articles/', '/posts/',
        // CMS and technical paths
        '/api/', '/ajax/', '/feed/', '/feeds/', '/rss/', '/sitemap',
        // User-generated content
        '/user/', '/users/', '/profile/', '/profiles/',
        // Search and filtering
        '/search/', '/filter/', '/tag/', '/tags/', '/category/', '/categories/',
        // Pagination and sorting
        '/page/', '/sort/', '/order/', '/orderby/',
        // Common file directories
        '/images/', '/img/', '/assets/', '/static/', '/media/', '/files/',
        // Development and testing
        '/test/', '/testing/', '/dev/', '/development/', '/staging/'
      ];
      if (skipPaths.some(path => parsedUrl.pathname.toLowerCase().includes(path))) return false;
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Discover URLs from sitemap.xml with intelligent parsing
   */
  private async discoverUrlsFromSitemap(baseUrl: string): Promise<string[]> {
    if (!this.USE_SITEMAP_DISCOVERY || this.sitemapDiscovered) {
      return [];
    }
    
    const discoveredUrls: string[] = [];
    const sitemapUrls = [
      '/sitemap.xml',
      '/sitemap_index.xml', 
      '/sitemap-index.xml',
      '/robots.txt' // Check robots.txt for sitemap references
    ];
    
    try {
      console.log(`[Crawler] Starting sitemap discovery for: ${baseUrl}`);
      
      // First, check robots.txt for sitemap references
      const robotsUrls = await this.checkRobotsForSitemaps(baseUrl);
      sitemapUrls.push(...robotsUrls);
      
      // Try each potential sitemap URL
      for (const sitemapPath of sitemapUrls) {
        try {
          const sitemapUrl = sitemapPath.startsWith('http') ? sitemapPath : new URL(sitemapPath, baseUrl).toString();
          
          // Skip robots.txt URLs in this loop (already processed above)
          if (sitemapUrl.endsWith('/robots.txt')) {
            continue;
          }
          
          console.log(`[Crawler] Checking sitemap: ${sitemapUrl}`);
          
          const response = await axios.get(sitemapUrl, {
            timeout: 10000,
            headers: { 'User-Agent': this.USER_AGENT },
            validateStatus: (status) => status === 200
          });
          
          // Validate that response is XML content
          const contentType = response.headers['content-type'] || '';
          if (!contentType.includes('xml') && !contentType.includes('text/') && contentType !== '') {
            console.log(`[Crawler] Skipping non-XML sitemap: ${sitemapUrl} (${contentType})`);
            continue;
          }
          
          if (response.data && typeof response.data === 'string') {
            const urls = await this.parseSitemap(response.data, baseUrl);
            discoveredUrls.push(...urls);
            console.log(`[Crawler] Found ${urls.length} URLs in sitemap: ${sitemapUrl}`);
            
            // If we found a valid sitemap, mark as discovered
            if (urls.length > 0) {
              this.sitemapDiscovered = true;
              this.sitemapUrls.add(sitemapUrl);
            }
          }
        } catch (error) {
          console.log(`[Crawler] Error processing sitemap ${sitemapPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          continue;
        }
      }
      
      // Remove duplicates and filter valid URLs
      const uniqueUrls = Array.from(new Set(discoveredUrls))
        .filter(url => this.shouldCrawlUrl(url))
        .slice(0, this.MAX_PAGES * 2); // Get more URLs than MAX_PAGES to account for filtering
      
      console.log(`[Crawler] Sitemap discovery completed. Found ${uniqueUrls.length} valid URLs`);
      return uniqueUrls;
      
    } catch (error) {
      console.log(`[Crawler] Sitemap discovery failed:`, error);
      return [];
    }
  }
  
  /**
   * Check robots.txt for sitemap references
   */
  private async checkRobotsForSitemaps(baseUrl: string): Promise<string[]> {
    try {
      const robotsUrl = new URL('/robots.txt', baseUrl).toString();
      const response = await axios.get(robotsUrl, { 
        timeout: 5000,
        headers: { 'User-Agent': this.USER_AGENT },
        validateStatus: (status) => status === 200
      });
      
      // Check if response is actually text (not HTML or other format)
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('text/plain') && !contentType.includes('text/') && contentType !== '') {
        console.log(`[Crawler] Skipping robots.txt - invalid content type: ${contentType}`);
        return [];
      }
      
      const sitemapUrls: string[] = [];
      const lines = String(response.data).split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.toLowerCase().startsWith('sitemap:')) {
          const sitemapUrl = trimmedLine.substring(8).trim();
          if (sitemapUrl && sitemapUrl.startsWith('http')) {
            sitemapUrls.push(sitemapUrl);
          }
        }
      }
      
      console.log(`[Crawler] Found ${sitemapUrls.length} sitemap references in robots.txt`);
      return sitemapUrls;
    } catch (error) {
      console.log(`[Crawler] Could not read robots.txt: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }
  
  /**
   * Parse sitemap XML and extract URLs
   */
  private async parseSitemap(xmlData: string, baseUrl: string): Promise<string[]> {
    const urls: string[] = [];
    
    try {
      // Basic validation that this looks like XML
      const trimmedData = xmlData.trim();
      if (!trimmedData.startsWith('<?xml') && !trimmedData.startsWith('<urlset') && !trimmedData.startsWith('<sitemapindex')) {
        console.log(`[Crawler] Skipping non-XML content in sitemap parsing`);
        return [];
      }
      
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        ignoreAttrs: true,
        trim: true,
        normalize: true
      });
      const result = await parser.parseStringPromise(xmlData);
      
      // Handle sitemap index (contains references to other sitemaps)
      if (result.sitemapindex && result.sitemapindex.sitemap) {
        const sitemaps = Array.isArray(result.sitemapindex.sitemap) 
          ? result.sitemapindex.sitemap 
          : [result.sitemapindex.sitemap];
        
        // Recursively fetch URLs from child sitemaps
        for (const sitemap of sitemaps.slice(0, 10)) { // Limit to 10 child sitemaps
          if (sitemap.loc) {
            try {
              const childResponse = await axios.get(sitemap.loc, {
                timeout: 10000,
                headers: { 'User-Agent': this.USER_AGENT }
              });
              const childUrls = await this.parseSitemap(childResponse.data, baseUrl);
              urls.push(...childUrls);
            } catch {
              // Continue to next sitemap on error
              continue;
            }
          }
        }
      }
      
      // Handle regular sitemap (contains actual page URLs)
      if (result.urlset && result.urlset.url) {
        const urlEntries = Array.isArray(result.urlset.url) 
          ? result.urlset.url 
          : [result.urlset.url];
        
        for (const urlEntry of urlEntries) {
          if (urlEntry.loc) {
            urls.push(urlEntry.loc);
          }
        }
      }
      
    } catch (error) {
      console.log(`[Crawler] Could not parse sitemap XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return urls;
  }
  
  /**
   * Check if site has sitemap.xml (updated for compatibility)
   */
  private async checkSitemap(baseUrl: string): Promise<boolean> {
    return this.sitemapUrls.size > 0 || this.sitemapDiscovered;
  }

  /**
   * Helper methods for content analysis
   */
  private hasContactForm(html: string): boolean {
    return /<form[^>]*>/i.test(html) && /type=['"]?email['"]?/i.test(html);
  }

  private hasPhoneNumber(text: string): boolean {
    const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;
    return phoneRegex.test(text);
  }

  private hasAddress(text: string): boolean {
    const addressKeywords = ['street', 'avenue', 'road', 'blvd', 'drive', 'lane', 'way', 'suite', 'apt'];
    return addressKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  private hasNAP(text: string): boolean {
    return this.hasPhoneNumber(text) && this.hasAddress(text);
  }

  private hasFAQs(text: string): boolean {
    const faqKeywords = ['frequently asked questions', 'faq', 'questions and answers'];
    return faqKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  private hasTable(html: string): boolean {
    return /<table[^>]*>/i.test(html);
  }

  private hasLists(html: string): boolean {
    return /<[uo]l[^>]*>/i.test(html);
  }

  private hasVideo(html: string): boolean {
    return /<video[^>]*>/i.test(html) || /youtube\.com|vimeo\.com/i.test(html);
  }

  private hasEmphasis(html: string): boolean {
    return /<(strong|b|em|i)[^>]*>/i.test(html);
  }

  private calculateSpeedScore(performance: any): number {
    if (!performance) return 50;
    const loadTime = performance.loadTime || 3000;
    // Simple scoring: faster = better score
    if (loadTime < 1000) return 90;
    if (loadTime < 2000) return 75;
    if (loadTime < 3000) return 60;
    if (loadTime < 5000) return 40;
    return 20;
  }
}

export const crawler = new Crawler();
