import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { CrawlerOutput } from '@/lib/types';
import * as https from 'https';
import * as dns from 'dns';
import { promisify } from 'util';

// DNS lookup with promise support
const dnsLookup = promisify(dns.lookup);
const dnsResolve = promisify(dns.resolve);

class Crawler {
  private MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB limit for HTML content
  private REQUEST_TIMEOUT = 45000; // 45 seconds timeout
  private USER_AGENT = 'SEO-Best-Practices-Assessment-Tool/1.0';
  private MAX_REDIRECTS = 10; // Maximum number of redirects to follow
  private CRAWL_DELAY = 500; // Delay between requests in milliseconds
  
  // Map to cache DNS resolutions
  private dnsCache = new Map<string, string>();
  
  // Map to cache HTTP responses (to avoid crawling the same URL twice)
  private responseCache = new Map<string, any>();
  
  // Set to track broken links for verification
  private brokenLinks = new Set<string>();

  /**
   * Crawl a webpage and extract its data
   */
  async crawlPage(url: string): Promise<CrawlerOutput> {
    try {
      // Validate and normalize the URL
      const normalizedUrl = this.normalizeUrl(url);
      
      // Check cache first
      if (this.responseCache.has(normalizedUrl)) {
        console.log(`Using cached response for: ${normalizedUrl}`);
        return this.responseCache.get(normalizedUrl);
      }
      
      console.log(`Crawling page: ${normalizedUrl}`);
      
      // Perform DNS resolution first to check domain availability and cache results
      const dnsResult = await this.checkDomainAvailability(normalizedUrl);
      if (!dnsResult.available) {
        const errorOutput = this.createErrorOutput(
          normalizedUrl, 
          "DNS Error", 
          -1, 
          `Domain not available: ${dnsResult.error}`
        );
        this.responseCache.set(normalizedUrl, errorOutput);
        return errorOutput;
      }
      
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
        console.error(`Error fetching page ${normalizedUrl}:`, 
          fetchError instanceof Error ? fetchError.message : String(fetchError));
        
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
      console.error('Error crawling page:', error);
      
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
}

export const crawler = new Crawler();
