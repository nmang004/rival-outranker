import axios from 'axios';
import * as xml2js from 'xml2js';
import { URL } from 'url';

/**
 * Sitemap Discovery Service
 * 
 * Handles all sitemap-related functionality including:
 * - Discovery of sitemap URLs from common locations and robots.txt
 * - Parsing of sitemap XML files (both regular sitemaps and sitemap indexes)
 * - Robots.txt parsing for sitemap references
 * - URL filtering and prioritization from sitemap sources
 * - Intelligent sitemap processing with fallback mechanisms
 */
export class SitemapDiscoveryService {
  private readonly USER_AGENT = 'SEO-Best-Practices-Assessment-Tool/1.0';
  private readonly MAX_PAGES = 250; // Maximum pages to consider from sitemaps
  private readonly SITEMAP_TIMEOUT = 10000; // 10 seconds timeout for sitemap requests
  private readonly ROBOTS_TIMEOUT = 5000; // 5 seconds timeout for robots.txt
  private readonly MAX_CHILD_SITEMAPS = 10; // Maximum child sitemaps to process from sitemap index

  // Track discovered sitemaps to avoid duplicates
  private discoveredSitemaps = new Set<string>();
  private sitemapProcessingEnabled = true;

  /**
   * Main entry point for discovering URLs from sitemaps
   * 
   * @param baseUrl The base URL of the website
   * @param currentSite The current site origin for same-domain filtering
   * @returns Array of discovered URLs prioritized by importance
   */
  async discoverUrlsFromSitemap(baseUrl: string, currentSite: string): Promise<string[]> {
    if (!this.sitemapProcessingEnabled) {
      return [];
    }

    this.reset(); // Reset state for new discovery session
    
    const discoveredUrls: string[] = [];
    const potentialSitemapUrls = await this.getPotentialSitemapUrls(baseUrl);
    
    try {
      console.log(`[SitemapDiscovery] Starting sitemap discovery for: ${baseUrl}`);
      console.log(`[SitemapDiscovery] Found ${potentialSitemapUrls.length} potential sitemap URLs to check`);
      
      // Process each potential sitemap URL
      for (const sitemapPath of potentialSitemapUrls) {
        try {
          const sitemapUrl = sitemapPath.startsWith('http') 
            ? sitemapPath 
            : new URL(sitemapPath, baseUrl).toString();
          
          // Skip robots.txt URLs in this loop (already processed above)
          if (sitemapUrl.endsWith('/robots.txt')) {
            continue;
          }
          
          // Skip if already processed
          if (this.discoveredSitemaps.has(sitemapUrl)) {
            continue;
          }
          
          console.log(`[SitemapDiscovery] Checking sitemap: ${sitemapUrl}`);
          
          const urls = await this.processSitemapUrl(sitemapUrl, baseUrl);
          if (urls.length > 0) {
            discoveredUrls.push(...urls);
            this.discoveredSitemaps.add(sitemapUrl);
            console.log(`[SitemapDiscovery] Found ${urls.length} URLs in sitemap: ${sitemapUrl}`);
          }
          
        } catch (error) {
          console.log(`[SitemapDiscovery] Error processing sitemap ${sitemapPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          continue;
        }
      }
      
      // Process and prioritize discovered URLs
      const processedUrls = this.processDiscoveredUrls(discoveredUrls, baseUrl, currentSite);
      
      console.log(`[SitemapDiscovery] Sitemap discovery completed. Found ${processedUrls.length} valid URLs (prioritized by importance)`);
      return processedUrls;
      
    } catch (error) {
      console.log(`[SitemapDiscovery] Sitemap discovery failed:`, error);
      return [];
    }
  }

  /**
   * Get all potential sitemap URLs including common locations and robots.txt references
   */
  private async getPotentialSitemapUrls(baseUrl: string): Promise<string[]> {
    const sitemapUrls = [
      '/sitemap.xml',
      '/sitemap_index.xml', 
      '/sitemap-index.xml',
      '/sitemap.txt',
      '/sitemaps.xml',
      '/wp-sitemap.xml', // WordPress specific
      '/sitemap/sitemap.xml',
      '/xmlsitemap.xml'
    ];
    
    // First, check robots.txt for sitemap references
    const robotsUrls = await this.checkRobotsForSitemaps(baseUrl);
    sitemapUrls.push(...robotsUrls);
    
    return sitemapUrls;
  }

  /**
   * Process a single sitemap URL and extract all URLs from it
   */
  private async processSitemapUrl(sitemapUrl: string, baseUrl: string): Promise<string[]> {
    const response = await axios.get(sitemapUrl, {
      timeout: this.SITEMAP_TIMEOUT,
      headers: { 'User-Agent': this.USER_AGENT },
      validateStatus: (status) => status === 200,
      maxContentLength: 50 * 1024 * 1024 // 50MB limit for large sitemaps
    });
    
    // Validate that response is XML content
    const contentType = response.headers['content-type'] || '';
    if (!this.isValidSitemapContentType(contentType)) {
      console.log(`[SitemapDiscovery] Skipping non-XML sitemap: ${sitemapUrl} (${contentType})`);
      return [];
    }
    
    if (response.data && typeof response.data === 'string') {
      return await this.parseSitemap(response.data, baseUrl);
    }
    
    return [];
  }

  /**
   * Check robots.txt for sitemap references
   * 
   * @param baseUrl The base URL of the website
   * @returns Array of sitemap URLs found in robots.txt
   */
  async checkRobotsForSitemaps(baseUrl: string): Promise<string[]> {
    try {
      const robotsUrl = new URL('/robots.txt', baseUrl).toString();
      console.log(`[SitemapDiscovery] Checking robots.txt: ${robotsUrl}`);
      
      const response = await axios.get(robotsUrl, { 
        timeout: this.ROBOTS_TIMEOUT,
        headers: { 'User-Agent': this.USER_AGENT },
        validateStatus: (status) => status === 200
      });
      
      // Check if response is actually text (not HTML or other format)
      const contentType = response.headers['content-type'] || '';
      if (!this.isValidRobotsContentType(contentType)) {
        console.log(`[SitemapDiscovery] Skipping robots.txt - invalid content type: ${contentType}`);
        return [];
      }
      
      const sitemapUrls = this.parseRobotsForSitemaps(String(response.data));
      
      console.log(`[SitemapDiscovery] Found ${sitemapUrls.length} sitemap references in robots.txt`);
      return sitemapUrls;
      
    } catch (error) {
      console.log(`[SitemapDiscovery] Could not read robots.txt: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Parse robots.txt content for sitemap references
   */
  private parseRobotsForSitemaps(robotsContent: string): string[] {
    const sitemapUrls: string[] = [];
    const lines = robotsContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.toLowerCase().startsWith('sitemap:')) {
        const sitemapUrl = trimmedLine.substring(8).trim();
        if (sitemapUrl && this.isValidSitemapUrl(sitemapUrl)) {
          sitemapUrls.push(sitemapUrl);
        }
      }
    }
    
    return sitemapUrls;
  }

  /**
   * Parse sitemap XML and extract URLs with support for both regular sitemaps and sitemap indexes
   * 
   * @param xmlData The XML content of the sitemap
   * @param baseUrl The base URL for resolving relative URLs
   * @returns Array of URLs found in the sitemap
   */
  async parseSitemap(xmlData: string, baseUrl: string): Promise<string[]> {
    const urls: string[] = [];
    
    try {
      // Basic validation that this looks like XML
      const trimmedData = xmlData.trim();
      if (!this.isValidXmlContent(trimmedData)) {
        console.log(`[SitemapDiscovery] Skipping non-XML content in sitemap parsing`);
        return [];
      }
      
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        ignoreAttrs: true,
        trim: true,
        normalize: true,
        mergeAttrs: false,
        explicitRoot: true
      });
      
      const result = await parser.parseStringPromise(xmlData);
      
      // Handle sitemap index (contains references to other sitemaps)
      if (result.sitemapindex && result.sitemapindex.sitemap) {
        const childUrls = await this.processSitemapIndex(result.sitemapindex, baseUrl);
        urls.push(...childUrls);
      }
      
      // Handle regular sitemap (contains actual page URLs)
      if (result.urlset && result.urlset.url) {
        const pageUrls = this.processUrlSet(result.urlset);
        urls.push(...pageUrls);
      }
      
    } catch (error) {
      console.log(`[SitemapDiscovery] Could not parse sitemap XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return urls;
  }

  /**
   * Process sitemap index and recursively fetch URLs from child sitemaps
   */
  private async processSitemapIndex(sitemapIndex: any, baseUrl: string): Promise<string[]> {
    const urls: string[] = [];
    const sitemaps = Array.isArray(sitemapIndex.sitemap)
      ? sitemapIndex.sitemap
      : [sitemapIndex.sitemap];

    console.log(`[SitemapDiscovery] Processing sitemap index with ${sitemaps.length} child sitemaps`);

    // Process child sitemaps with limit to prevent infinite recursion
    for (const sitemap of sitemaps.slice(0, this.MAX_CHILD_SITEMAPS)) {
      if (sitemap.loc && this.isValidSitemapUrl(sitemap.loc)) {
        try {
          // Skip if already processed to prevent infinite loops
          if (this.discoveredSitemaps.has(sitemap.loc)) {
            continue;
          }
          
          console.log(`[SitemapDiscovery] Fetching child sitemap: ${sitemap.loc}`);
          
          const childResponse = await axios.get(sitemap.loc, {
            timeout: this.SITEMAP_TIMEOUT,
            headers: { 'User-Agent': this.USER_AGENT },
            maxContentLength: 50 * 1024 * 1024 // 50MB limit
          });
          
          const childUrls = await this.parseSitemap(childResponse.data, baseUrl);
          urls.push(...childUrls);
          this.discoveredSitemaps.add(sitemap.loc);
          
        } catch (error) {
          console.log(`[SitemapDiscovery] Error fetching child sitemap ${sitemap.loc}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          continue;
        }
      }
    }

    return urls;
  }

  /**
   * Process URL set from regular sitemap
   */
  private processUrlSet(urlset: any): string[] {
    const urls: string[] = [];
    const urlEntries = Array.isArray(urlset.url)
      ? urlset.url
      : [urlset.url];

    for (const urlEntry of urlEntries) {
      if (urlEntry.loc && this.isValidPageUrl(urlEntry.loc)) {
        urls.push(urlEntry.loc);
      }
    }

    return urls;
  }

  /**
   * Process and prioritize discovered URLs
   */
  private processDiscoveredUrls(discoveredUrls: string[], baseUrl: string, currentSite: string): string[] {
    // Remove duplicates and filter valid URLs
    const uniqueUrls = Array.from(new Set(discoveredUrls))
      .filter(url => this.shouldIncludeUrl(url, currentSite))
      .slice(0, this.MAX_PAGES * 2); // Get more URLs than MAX_PAGES to account for filtering
    
    // Prioritize URLs by importance scoring
    const prioritizedUrls = this.prioritizeUrlsByImportance(uniqueUrls, baseUrl);
    
    return prioritizedUrls.slice(0, this.MAX_PAGES);
  }

  /**
   * Check if a URL should be included in the crawl
   */
  private shouldIncludeUrl(url: string, currentSite: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const baseDomain = new URL(currentSite).hostname;
      
      // Only include same domain
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
   * Check for early termination conditions
   */
  private shouldTerminateEarly(url: string): { shouldTerminate: boolean; reason?: string } {
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
        return { shouldTerminate: true, reason: 'Non-HTML file extension' };
      }
      
      // Check for problematic URL patterns
      const problematicPatterns = [
        /\/wp-content\/uploads\//,
        /\/wp-includes\//,
        /\/node_modules\//,
        /\/\.well-known\//,
        /\/admin\//,
        /\/api\/.*\/.*\//,  // Deeply nested API endpoints
        /\/search\?.*q=/,   // Search result pages
        /\?.*page=\d+/,     // Pagination
        /\?.*p=\d+/,        // More pagination
        /\/page\/\d+/,      // Page numbers
        /\/\d{4}\/\d{2}\/\d{2}\//, // Date-based URLs (often archives)
        /\/tag\//,          // Tag pages
        /\/category\//,     // Category pages that are too deep
        /\/author\//,       // Author pages
        /login|register|checkout|cart|account/i // User-specific pages
      ];
      
      const hasProblematicPattern = problematicPatterns.some(pattern => 
        pattern.test(url)
      );
      
      if (hasProblematicPattern) {
        return { shouldTerminate: true, reason: 'Problematic URL pattern' };
      }
      
      // Check URL depth (too many slashes might indicate deep nesting)
      const pathDepth = parsedUrl.pathname.split('/').filter(segment => segment.length > 0).length;
      if (pathDepth > 5) {
        return { shouldTerminate: true, reason: 'URL too deep (depth: ' + pathDepth + ')' };
      }
      
      return { shouldTerminate: false };
      
    } catch (error) {
      return { shouldTerminate: true, reason: 'Invalid URL format' };
    }
  }

  /**
   * Calculate page importance score based on URL characteristics
   */
  private calculatePageImportanceScore(url: string, baseUrl: string): number {
    let score = 50; // Base score
    
    try {
      const parsedUrl = new URL(url);
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
        { pattern: /\/cookie/, score: -10 }
      ];
      
      for (const { pattern, score: patternScore } of lowValuePatterns) {
        if (pattern.test(path)) {
          score += patternScore; // These are negative values
          break;
        }
      }
      
      // URL depth penalty (deeper = less important)
      const pathSegments = path.split('/').filter(segment => segment.length > 0);
      const depthPenalty = Math.max(0, (pathSegments.length - 2) * 5);
      score -= depthPenalty;
      
      // URL length penalty (very long URLs are often less important)
      if (path.length > 100) {
        score -= 10;
      } else if (path.length > 50) {
        score -= 5;
      }
      
      // Query parameter penalty (dynamic content often less important)
      if (parsedUrl.search.length > 0) {
        score -= 8;
      }
      
      // Business-specific scoring
      const businessKeywords = [
        'hvac', 'plumbing', 'electrical', 'repair', 'installation',
        'heating', 'cooling', 'ac', 'furnace', 'water', 'sewer',
        'residential', 'commercial', 'licensed', 'certified'
      ];
      
      const businessMatches = businessKeywords.filter(keyword => 
        path.includes(keyword)
      ).length;
      
      score += businessMatches * 8;
      
      // Ensure score stays within reasonable bounds
      return Math.max(0, Math.min(100, score));
      
    } catch (error) {
      return 30; // Default low score for invalid URLs
    }
  }

  /**
   * Sort URLs by importance score
   */
  private prioritizeUrlsByImportance(urls: string[], baseUrl: string): string[] {
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
    
    console.log(`[SitemapDiscovery] 🧠 Prioritized ${urls.length} URLs by importance (top 5 scores: ${urlsWithScores.slice(0, 5).map(u => Math.round(u.score)).join(', ')})`);
    
    return prioritizedUrls;
  }

  /**
   * Validation methods
   */
  private isValidSitemapContentType(contentType: string): boolean {
    return contentType.includes('xml') || 
           contentType.includes('text/') || 
           contentType === '' ||
           contentType.includes('application/xml') ||
           contentType.includes('text/xml');
  }

  private isValidRobotsContentType(contentType: string): boolean {
    return contentType.includes('text/plain') || 
           contentType.includes('text/') || 
           contentType === '';
  }

  private isValidSitemapUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http') && 
             (url.includes('sitemap') || url.endsWith('.xml'));
    } catch {
      return false;
    }
  }

  private isValidPageUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http');
    } catch {
      return false;
    }
  }

  private isValidXmlContent(content: string): boolean {
    return content.startsWith('<?xml') || 
           content.startsWith('<urlset') || 
           content.startsWith('<sitemapindex');
  }

  /**
   * Public utility methods
   */

  /**
   * Check if a site has sitemap.xml
   */
  hasSitemap(): boolean {
    return this.discoveredSitemaps.size > 0;
  }

  /**
   * Get discovered sitemap URLs
   */
  getDiscoveredSitemaps(): string[] {
    return Array.from(this.discoveredSitemaps);
  }

  /**
   * Reset discovery state
   */
  reset(): void {
    this.discoveredSitemaps.clear();
  }

  /**
   * Enable/disable sitemap processing
   */
  setSitemapProcessingEnabled(enabled: boolean): void {
    this.sitemapProcessingEnabled = enabled;
  }

  /**
   * Get discovery statistics
   */
  getStats() {
    return {
      discoveredSitemaps: this.discoveredSitemaps.size,
      sitemapUrls: Array.from(this.discoveredSitemaps),
      processingEnabled: this.sitemapProcessingEnabled
    };
  }
}

// Create and export singleton instance
export const sitemapDiscoveryService = new SitemapDiscoveryService();