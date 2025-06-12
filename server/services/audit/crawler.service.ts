/**
 * Crawler Service - Refactored with Modular Architecture
 * 
 * This file now serves as a lightweight wrapper around the CrawlerOrchestratorService
 * and maintains backward compatibility with existing code while using the new
 * modular architecture under the hood.
 */

import { CrawlerOrchestratorService } from './crawling/crawler-orchestrator.service';

// TODO: Define CrawlerOutput type properly
type CrawlerOutput = any;

/**
 * Main Crawler class that maintains backward compatibility
 * while using the new modular architecture internally
 */
class Crawler {
  private orchestrator: CrawlerOrchestratorService;

  constructor() {
    this.orchestrator = new CrawlerOrchestratorService();
  }

  /**
   * Main crawling method - maintains backward compatibility
   */
  async crawlPage(url: string): Promise<CrawlerOutput> {
    console.log(`[Crawler] 🚀 Starting crawl for URL: ${url}`);
    
    try {
      // Use the orchestrator for single page crawling
      const result = await this.orchestrator.crawlPage(url);
      console.log(`[Crawler] ✅ Crawl completed for: ${url}`);
      return result;
    } catch (error) {
      console.error(`[Crawler] ❌ Crawl failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Enhanced website crawling with full site analysis
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
    console.log(`[Crawler] 🌐 Starting comprehensive website crawl: ${initialUrl}`);
    
    try {
      const result = await this.orchestrator.crawlWebsite(initialUrl, options);
      console.log(`[Crawler] ✅ Website crawl completed: ${initialUrl}`);
      return result;
    } catch (error) {
      console.error(`[Crawler] ❌ Website crawl failed for ${initialUrl}:`, error);
      throw error;
    }
  }

  /**
   * Get current crawler configuration
   */
  getConfiguration(): any {
    return this.orchestrator.getConfiguration();
  }

  /**
   * Reset crawler state for new session
   */
  reset(): void {
    this.orchestrator.reset();
  }

  /**
   * Legacy method support for backward compatibility
   * @deprecated Use crawlPage() instead
   */
  async crawl(url: string): Promise<CrawlerOutput> {
    console.warn('[Crawler] ⚠️ crawl() method is deprecated, use crawlPage() instead');
    return this.crawlPage(url);
  }
}

// Export singleton instance for backward compatibility
export const crawler = new Crawler();

// Export class for direct instantiation if needed
export { Crawler };

// Export types and services for advanced usage
export * from './crawling';

/**
 * MIGRATION NOTES:
 * 
 * This refactored crawler service maintains full backward compatibility while providing
 * significant improvements:
 * 
 * ✅ PRESERVED FUNCTIONALITY:
 * - All existing crawlPage() calls work unchanged
 * - Same CrawlerOutput interface and data structure
 * - Same error handling and logging patterns
 * - Existing imports continue to work
 * 
 * ✅ NEW CAPABILITIES:
 * - Modular architecture with 6 specialized services
 * - Enhanced CMS detection and optimization
 * - Intelligent content similarity detection
 * - Advanced URL management and prioritization
 * - Comprehensive sitemap discovery
 * - Smart Puppeteer usage for JS-heavy sites
 * 
 * ✅ PERFORMANCE IMPROVEMENTS:
 * - Adaptive concurrency adjustment
 * - Intelligent caching strategies
 * - Resource optimization
 * - Memory management
 * 
 * ✅ MAINTAINABILITY:
 * - Single responsibility services
 * - Clean dependency injection
 * - Comprehensive error handling
 * - Easy testing and debugging
 * 
 * USAGE EXAMPLES:
 * 
 * // Existing code continues to work:
 * const result = await crawler.crawlPage('https://example.com');
 * 
 * // New enhanced website crawling:
 * const siteAnalysis = await crawler.crawlWebsite('https://example.com', {
 *   maxPages: 50,
 *   useJavaScript: true,
 *   followSitemaps: true
 * });
 * 
 * // Access specialized services directly:
 * import { CMSDetectionService, ContentSimilarityService } from './crawling';
 */