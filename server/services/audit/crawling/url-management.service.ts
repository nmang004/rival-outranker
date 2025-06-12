/**
 * URL Management Service
 * 
 * Handles all URL-related operations for the audit crawler including:
 * - URL normalization and validation
 * - URL filtering and skipping logic
 * - URL prioritization by importance
 * - CMS-specific URL filtering
 * - Early termination checks
 */

export interface UrlProcessingResult {
  url: string;
  valid: boolean;
  reason?: string;
}

export interface UrlWithScore {
  url: string;
  score: number;
}

export interface EarlyTerminationResult {
  shouldTerminate: boolean;
  reason?: string;
}

export class URLManagementService {
  // Domain blacklist for spam/malicious domains
  private domainBlacklist = new Set([
    'spam-domain.com',
    'malicious-site.net',
    // Add more as needed
  ]);

  // Detected CMS type for filtering
  private detectedCMS: string = 'unknown';

  /**
   * Set the detected CMS type for filtering
   */
  setDetectedCMS(cms: string): void {
    this.detectedCMS = cms;
  }

  /**
   * Normalize URL by cleaning and validating format
   */
  normalizeUrl(url: string): string {
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
   * Check if URL should be skipped due to blacklist or duplicate patterns
   */
  shouldSkipUrl(url: string, crawledUrls: Set<string>): boolean {
    try {
      const domain = new URL(url).hostname;
      
      // Check if domain is blacklisted
      if (this.domainBlacklist.has(domain)) {
        console.log(`[UrlManager] ⚡ Skipping blacklisted domain: ${url}`);
        return true;
      }
      
      // Early duplicate pattern detection for common CMS structures
      const pathname = new URL(url).pathname;
      
      // Skip if we've already found this exact URL pattern
      if (crawledUrls.has(url)) {
        return true;
      }
      
      // Skip obvious duplicate patterns for service areas
      const duplicatePatterns = [
        /\/service-area\/[^\/]+\/[^\/]+\//,  // service area pages
        /\/faqs\/[^\/]+\//,                  // FAQ pages  
        /\/blog\/\d{4}\/\d{2}\//,           // dated blog posts
        /\/category\/[^\/]+\/page\/\d+/      // paginated categories
      ];
      
      for (const pattern of duplicatePatterns) {
        if (pattern.test(pathname)) {
          // Check if we already have a similar URL crawled
          const similarExists = Array.from(crawledUrls).some(crawledUrl => {
            try {
              const crawledPath = new URL(crawledUrl).pathname;
              return pattern.test(crawledPath);
            } catch {
              return false;
            }
          });
          
          if (similarExists) {
            console.log(`[UrlManager] Skipping duplicate pattern: ${url}`);
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.log(`[UrlManager] Error checking URL skip: ${url}`, error);
      return true; // Skip if error parsing URL
    }
  }

  /**
   * Pre-filter URLs by content type and early termination checks
   */
  async prefilterUrls(urls: string[], options: {
    prefilterContentTypes: boolean;
    concurrentRequests: number;
    userAgent: string;
    axios: any;
  }): Promise<string[]> {
    if (!options.prefilterContentTypes || urls.length === 0) {
      return urls;
    }
    
    console.log(`[UrlManager] Pre-filtering ${urls.length} URLs by content type and early termination checks...`);
    const validUrls: string[] = [];
    let terminatedEarly = 0;
    
    // Process URLs in batches for HEAD requests
    const batchSize = Math.min(options.concurrentRequests * 2, 10); // More concurrent HEAD requests
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      const headPromises = batch.map(async (url): Promise<UrlProcessingResult> => {
        // First, check for early termination
        const earlyCheck = this.shouldTerminateEarly(url);
        if (earlyCheck.shouldTerminate) {
          console.log(`[UrlManager] Early termination: ${url} (${earlyCheck.reason})`);
          terminatedEarly++;
          return { url, valid: false, reason: earlyCheck.reason };
        }
        
        try {
          const response = await options.axios.head(url, {
            timeout: 3000, // Shorter timeout for HEAD requests
            headers: { 'User-Agent': options.userAgent },
            maxRedirects: 3,
            validateStatus: (status: number) => status < 500, // Accept 4xx to check content type
          });
          
          // Check for redirect loops or too many redirects
          if (response.status >= 300 && response.status < 400) {
            console.log(`[UrlManager] Skipping redirect: ${url} (${response.status})`);
            return { url, valid: false, reason: 'Redirect detected' };
          }
          
          const contentType = response.headers['content-type'] || '';
          const contentLength = parseInt(response.headers['content-length'] || '0', 10);
          
          // Skip non-HTML content
          if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
            return { url, valid: false, reason: `Non-HTML content: ${contentType}` };
          }
          
          // Skip very large files (> 5MB)
          if (contentLength > 5 * 1024 * 1024) {
            return { url, valid: false, reason: `File too large: ${contentLength} bytes` };
          }
          
          return { url, valid: true };
          
        } catch (error: any) {
          // Allow through if we can't check (might be JS-rendered)
          console.log(`[UrlManager] HEAD request failed for ${url}, allowing through: ${error.message}`);
          return { url, valid: true, reason: 'HEAD request failed - allowing through' };
        }
      });
      
      const batchResults = await Promise.allSettled(headPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value.valid) {
          validUrls.push(result.value.url);
        }
      }
      
      // Add delay between batches to be respectful
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`[UrlManager] Pre-filtering completed: ${urls.length} → ${validUrls.length} valid URLs (${terminatedEarly} terminated early)`);
    return validUrls;
  }

  /**
   * Prioritize URLs by importance score
   */
  prioritizeUrlsByImportance(urls: string[], baseUrl: string): string[] {
    const urlsWithScores = urls.map(url => ({
      url,
      score: this.calculatePageImportanceScore(url, baseUrl)
    }));
    
    // Sort by score descending, then by URL length ascending (shorter URLs often more important)
    urlsWithScores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.url.length - b.url.length;
    });
    
    const prioritizedUrls = urlsWithScores.map(item => item.url);
    
    console.log(`[UrlManager] 🧠 Prioritized ${urls.length} URLs by importance (top 5 scores: ${urlsWithScores.slice(0, 5).map(u => Math.round(u.score)).join(', ')})`);
    
    return prioritizedUrls;
  }

  /**
   * Calculate importance score for a page URL
   */
  calculatePageImportanceScore(url: string, baseUrl: string): number {
    let score = 50; // Base score
    
    try {
      const parsedUrl = new URL(url);
      const baseParsed = new URL(baseUrl);
      const path = parsedUrl.pathname.toLowerCase();
      
      // Homepage gets highest priority
      if (path === '/' || path === '/index.html') {
        return 100;
      }
      
      // High-value page indicators
      const highValuePatterns = [
        { pattern: /\/contact/, score: 25 },
        { pattern: /\/about/, score: 20 },
        { pattern: /\/service/, score: 20 },
        { pattern: /\/product/, score: 18 },
        { pattern: /\/pricing/, score: 18 },
        { pattern: /\/quote/, score: 22 },
        { pattern: /\/estimate/, score: 22 },
        { pattern: /\/emergency/, score: 25 },
        { pattern: /\/location/, score: 15 },
        { pattern: /\/testimonial/, score: 12 },
        { pattern: /\/review/, score: 12 },
        { pattern: /\/portfolio/, score: 12 },
        { pattern: /\/gallery/, score: 10 }
      ];
      
      for (const { pattern, score: patternScore } of highValuePatterns) {
        if (pattern.test(path)) {
          score += patternScore;
          break; // Only apply the first match
        }
      }
      
      // Low-value page indicators (reduce score)
      const lowValuePatterns = [
        { pattern: /\/blog\/\d{4}\//, score: -15 }, // Dated blog posts
        { pattern: /\/tag\//, score: -20 },
        { pattern: /\/category\//, score: -10 },
        { pattern: /\/author\//, score: -15 },
        { pattern: /\/page\/\d+/, score: -25 }, // Pagination
        { pattern: /\?page=/, score: -25 },
        { pattern: /\/search/, score: -30 },
        { pattern: /\/archive/, score: -20 },
        { pattern: /\/feed/, score: -35 },
        { pattern: /\/sitemap/, score: -35 },
        { pattern: /\/privacy/, score: -5 },
        { pattern: /\/terms/, score: -5 },
        { pattern: /\/cookie/, score: -5 }
      ];
      
      for (const { pattern, score: patternScore } of lowValuePatterns) {
        if (pattern.test(path)) {
          score += patternScore;
          break; // Only apply the first match
        }
      }
      
      // Adjust based on URL depth (deeper = less important)
      const pathSegments = path.split('/').filter(segment => segment.length > 0);
      if (pathSegments.length > 3) {
        score -= (pathSegments.length - 3) * 5;
      }
      
      // Boost score for pages with keywords in URL
      const businessKeywords = ['hvac', 'plumbing', 'electrical', 'roofing', 'contractor', 'repair', 'install'];
      const hasBusinessKeyword = businessKeywords.some(keyword => path.includes(keyword));
      if (hasBusinessKeyword) {
        score += 10;
      }
      
      // Ensure score doesn't go negative
      return Math.max(score, 1);
      
    } catch (error) {
      console.log(`[UrlManager] Error calculating importance score for ${url}:`, error);
      return 10; // Default low score for problematic URLs
    }
  }

  /**
   * Check if URL should terminate early (problematic extensions, patterns)
   */
  shouldTerminateEarly(url: string): EarlyTerminationResult {
    try {
      const parsedUrl = new URL(url);
      
      // Check for problematic file extensions
      const problematicExtensions = [
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.zip', '.rar', '.tar', '.gz', '.exe', '.dmg', '.pkg',
        '.mp4', '.avi', '.mov', '.wmv', '.mp3', '.wav', '.jpg', 
        '.jpeg', '.png', '.gif', '.svg', '.bmp', '.ico'
      ];
      
      const hasProblematicExtension = problematicExtensions.some(ext => 
        parsedUrl.pathname.toLowerCase().endsWith(ext)
      );
      
      if (hasProblematicExtension) {
        return { 
          shouldTerminate: true, 
          reason: 'Problematic file extension' 
        };
      }
      
      // Check for problematic query parameters
      const searchParams = parsedUrl.searchParams;
      const problematicParams = ['download', 'export', 'print', 'pdf'];
      
      for (const param of problematicParams) {
        if (searchParams.has(param)) {
          return { 
            shouldTerminate: true, 
            reason: `Problematic query parameter: ${param}` 
          };
        }
      }
      
      // Check for very long URLs (likely generated/spam)
      if (url.length > 500) {
        return { 
          shouldTerminate: true, 
          reason: 'URL too long (likely generated)' 
        };
      }
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /\/wp-json\//, // WordPress API endpoints
        /\/api\//, // General API endpoints
        /\/ajax\//, // AJAX endpoints
        /\/admin\//, // Admin interfaces
        /\/login/, // Login pages
        /\/register/, // Registration pages
        /\/cart/, // Shopping cart
        /\/checkout/, // Checkout pages
        /\?.*&.*&.*&/ // URLs with many query parameters
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
          return { 
            shouldTerminate: true, 
            reason: 'Suspicious URL pattern' 
          };
        }
      }
      
      return { shouldTerminate: false };
      
    } catch (error) {
      return { 
        shouldTerminate: true, 
        reason: 'Invalid URL format' 
      };
    }
  }

  /**
   * Apply CMS-specific filtering to remove irrelevant URLs
   */
  applyCMSFiltering(urls: string[]): string[] {
    const optimizations = this.getCMSOptimizations();
    
    // Filter out CMS-specific skip patterns
    const filteredUrls = urls.filter(url => {
      const urlLower = url.toLowerCase();
      return !optimizations.skipPatterns.some(pattern => 
        urlLower.includes(pattern.toLowerCase())
      );
    });
    
    console.log(`[UrlManager] 🎯 CMS filtering (${this.detectedCMS}): ${urls.length} → ${filteredUrls.length} URLs (removed ${urls.length - filteredUrls.length} CMS-specific URLs)`);
    
    return filteredUrls;
  }

  /**
   * Check if URL should be crawled based on domain and filtering rules
   */
  shouldCrawlUrl(url: string, currentSite: string, crawledUrls: Set<string>): boolean {
    try {
      const parsedUrl = new URL(url);
      const baseDomain = new URL(currentSite).hostname;
      
      // Only crawl same domain
      if (parsedUrl.hostname !== baseDomain) return false;
      
      // Check early termination conditions
      const earlyCheck = this.shouldTerminateEarly(url);
      if (earlyCheck.shouldTerminate) {
        return false;
      }
      
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
        '/tag/', '/category/', '/author/', '/archive/', '/feed/',
        // Common CMS and system directories
        '/assets/', '/static/', '/media/', '/uploads/', '/files/',
        // Development and staging indicators
        '/test/', '/staging/', '/dev/', '/beta/'
      ];
      
      const pathname = parsedUrl.pathname.toLowerCase();
      if (skipPaths.some(path => pathname.includes(path))) return false;
      
      // Check skip logic
      if (this.shouldSkipUrl(url, crawledUrls)) return false;
      
      return true;
    } catch (error) {
      console.log(`[UrlManager] Error checking if should crawl URL: ${url}`, error);
      return false;
    }
  }

  /**
   * Extract and validate internal links from HTML
   */
  extractInternalLinks(links: Array<{ url: string; text: string }>, baseUrl: string): string[] {
    const parsedBaseUrl = new URL(baseUrl);
    const baseDomain = parsedBaseUrl.hostname;
    const internalUrls: string[] = [];
    
    for (const link of links) {
      try {
        // Skip empty links, anchors, javascript, and mailto
        if (!link.url || link.url.startsWith('#') || 
            link.url.startsWith('javascript:') || 
            link.url.startsWith('mailto:') ||
            link.url.startsWith('tel:')) {
          continue;
        }
        
        // Resolve relative URLs
        const absoluteUrl = new URL(link.url, baseUrl).toString();
        const linkDomain = new URL(absoluteUrl).hostname;
        
        // Only include internal links
        if (linkDomain === baseDomain) {
          internalUrls.push(absoluteUrl);
        }
      } catch (error) {
        // Skip invalid URLs
        continue;
      }
    }
    
    // Remove duplicates
    return Array.from(new Set(internalUrls));
  }

  /**
   * Get domain from URL
   */
  getDomainFromUrl(url: string): string | null {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  /**
   * Check if URL is external (different domain)
   */
  isExternalUrl(url: string, baseUrl: string): boolean {
    try {
      const urlDomain = new URL(url).hostname;
      const baseDomain = new URL(baseUrl).hostname;
      return urlDomain !== baseDomain;
    } catch {
      return true; // Treat invalid URLs as external
    }
  }

  /**
   * Clean URL by removing query parameters and fragments
   */
  cleanUrl(url: string, removeQuery: boolean = false, removeFragment: boolean = true): string {
    try {
      const parsedUrl = new URL(url);
      
      if (removeQuery) {
        parsedUrl.search = '';
      }
      
      if (removeFragment) {
        parsedUrl.hash = '';
      }
      
      return parsedUrl.toString();
    } catch {
      return url; // Return original if parsing fails
    }
  }

  /**
   * Get CMS-specific optimization patterns
   */
  private getCMSOptimizations(): { skipPatterns: string[] } {
    const optimizations = {
      wordpress: {
        skipPatterns: [
          '/wp-content/uploads/', '/wp-includes/', '/wp-admin/', 
          '/wp-json/', '?rest_route=', '/feed/', '/trackback/',
          '/xmlrpc.php', '/wp-login.php', '/wp-register.php'
        ]
      },
      drupal: {
        skipPatterns: [
          '/sites/default/files/', '/admin/', '/user/', '/node/add',
          '?q=admin', '/batch', '/cron.php', '/install.php'
        ]
      },
      joomla: {
        skipPatterns: [
          '/administrator/', '/cache/', '/logs/', '/tmp/',
          '/media/', '/images/', '/templates/', '/plugins/'
        ]
      },
      shopify: {
        skipPatterns: [
          '/admin/', '/cart/', '/checkout/', '/account/',
          '/collections/*/products.json', '/products.json',
          '/search.json', '?format=json'
        ]
      },
      squarespace: {
        skipPatterns: [
          '/config/', '/assets/', '/universal/',
          '?format=json', '?format=json-pretty'
        ]
      },
      wix: {
        skipPatterns: [
          '/_partials/', '/corvid/', '/wix-code/',
          '?instance=', '?compId='
        ]
      },
      unknown: {
        skipPatterns: [
          '/admin/', '/api/', '/wp-', '/assets/', '/static/',
          '/media/', '/uploads/', '/files/', '/cache/'
        ]
      }
    };
    
    return optimizations[this.detectedCMS as keyof typeof optimizations] || optimizations.unknown;
  }

  /**
   * Validate URL format
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get URL without protocol for comparison
   */
  getUrlWithoutProtocol(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return `${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    } catch {
      return url;
    }
  }

  /**
   * Check if two URLs are equivalent (ignoring protocol differences)
   */
  areUrlsEquivalent(url1: string, url2: string): boolean {
    try {
      const clean1 = this.getUrlWithoutProtocol(url1);
      const clean2 = this.getUrlWithoutProtocol(url2);
      return clean1 === clean2;
    } catch {
      return false;
    }
  }
}

// Create and export singleton instance
export const urlManagementService = new URLManagementService();