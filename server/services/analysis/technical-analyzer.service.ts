// TODO: Define CrawlerOutput type
type CrawlerOutput = any;
import { ScoreUtils } from '../../lib/utils/score.utils';
import * as cheerio from 'cheerio';
import * as dns from 'dns';
import { promisify } from 'util';
import axios from 'axios';

// DNS resolver with promise support
const dnsResolve = promisify(dns.resolve);

/**
 * Technical SEO analyzer focuses on technical aspects of SEO like page speed,
 * mobile friendliness, structured data, canonicalization, indexing, etc.
 */
class TechnicalSeoAnalyzer {
  /**
   * Run a comprehensive technical SEO analysis
   */
  async analyzeTechnicalSeo(pageData: CrawlerOutput): Promise<any> {
    // Don't analyze if there was an error fetching the page
    if (pageData.error) {
      return {
        score: 0,
        message: `Cannot perform technical analysis: ${pageData.error}`,
        issues: [],
        recommendations: []
      };
    }

    // Load HTML for additional checks
    let $;
    if (pageData.rawHtml) {
      $ = cheerio.load(pageData.rawHtml);
    }
    
    // Gather issues and recommendations
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Run all technical checks
    const securityAnalysis = this.analyzeSecurityIssues(pageData, issues, recommendations);
    const indexabilityAnalysis = this.analyzeIndexability(pageData, issues, recommendations);
    const mobileAnalysis = this.analyzeMobileFriendliness(pageData, issues, recommendations);
    const structuredDataAnalysis = this.analyzeStructuredData(pageData, issues, recommendations);
    const canonicalizationAnalysis = this.analyzeCanonicalIssues(pageData, issues, recommendations);
    const performanceAnalysis = this.analyzePerformanceIssues(pageData, issues, recommendations);
    const serverAnalysis = await this.analyzeServerConfiguration(pageData, issues, recommendations);
    
    // Check for 404 pages and redirects
    if (pageData.statusCode >= 400) {
      issues.push(`Page returns HTTP error: ${pageData.statusCode} ${this.getStatusMessage(pageData.statusCode)}`);
      recommendations.push('Fix the broken page or implement a proper 301 redirect to a valid page.');
    } else if (pageData.statusCode >= 300 && pageData.statusCode < 400) {
      issues.push(`Page redirects with status code: ${pageData.statusCode}`);
      recommendations.push('Consider implementing a direct link to the destination to avoid redirect chains.');
    }
    
    // Calculate overall technical SEO score
    const score = this.calculateTechnicalScore(issues.length, pageData);
    
    // Determine technical SEO assessment
    const assessment = ScoreUtils.getAssessment(score);
    
    // Return comprehensive analysis
    return {
      score,
      assessment,
      pageStatus: {
        code: pageData.statusCode,
        message: this.getStatusMessage(pageData.statusCode)
      },
      security: securityAnalysis,
      indexability: indexabilityAnalysis,
      mobileFriendliness: mobileAnalysis,
      structuredData: structuredDataAnalysis,
      canonicalization: canonicalizationAnalysis,
      performance: performanceAnalysis,
      serverConfiguration: serverAnalysis,
      issues,
      recommendations
    };
  }
  
  /**
   * Analyze security issues (HTTPS, mixed content, etc.)
   */
  private analyzeSecurityIssues(pageData: CrawlerOutput, issues: string[], recommendations: string[]): any {
    const results = {
      usesHttps: pageData.url.startsWith('https://'),
      hasMixedContent: pageData.security?.hasMixedContent || false,
      hasSecurityHeaders: pageData.security?.hasSecurityHeaders || false,
      securityScore: 0
    };
    
    // Check HTTPS usage
    if (!results.usesHttps) {
      issues.push('Page is not served over HTTPS.');
      recommendations.push('Migrate to HTTPS to improve security and SEO ranking potential.');
    }
    
    // Check for mixed content
    if (results.hasMixedContent) {
      issues.push('Page has mixed content (HTTP resources on HTTPS page).');
      recommendations.push('Fix mixed content issues by ensuring all resources use HTTPS.');
    }
    
    // Check for security headers
    if (!results.hasSecurityHeaders) {
      issues.push('Missing important security headers.');
      recommendations.push('Implement security headers like Content-Security-Policy, X-Content-Type-Options, and Strict-Transport-Security.');
    }
    
    // Calculate security score
    results.securityScore = this.calculateSecurityScore(results);
    
    return results;
  }
  
  /**
   * Calculate security score
   */
  private calculateSecurityScore(securityData: { usesHttps: boolean, hasMixedContent: boolean, hasSecurityHeaders: boolean }): number {
    let score = 0;
    
    // HTTPS is critical for security
    if (securityData.usesHttps) {
      score += 60;
    }
    
    // No mixed content
    if (!securityData.hasMixedContent) {
      score += 20;
    }
    
    // Security headers
    if (securityData.hasSecurityHeaders) {
      score += 20;
    }
    
    return score;
  }
  
  /**
   * Analyze indexability (robots, noindex, etc.)
   */
  private analyzeIndexability(pageData: CrawlerOutput, issues: string[], recommendations: string[]): any {
    const noindex = pageData.seoIssues?.noindex || false;
    const robots = pageData.seoIssues?.robots || null;
    
    const results = {
      isIndexable: !noindex,
      hasRobotsDirective: !!robots,
      robotsContent: robots
    };
    
    // Check noindex directive
    if (noindex) {
      issues.push('Page has noindex directive, preventing search engine indexing.');
      recommendations.push('If this page should be indexed, remove the noindex directive from robots meta tag or X-Robots-Tag header.');
    }
    
    // Check robots.txt blocking
    if (robots && (robots.includes('noindex') || robots.includes('none'))) {
      issues.push('Robots meta tag blocks indexing.');
      recommendations.push('Update robots meta tag if this page should be indexed.');
    }
    
    if (robots && robots.includes('nofollow')) {
      issues.push('Robots meta tag prevents link following.');
      recommendations.push('Consider allowing search engines to follow links if this page should pass authority.');
    }
    
    return results;
  }
  
  /**
   * Analyze mobile-friendliness
   */
  private analyzeMobileFriendliness(pageData: CrawlerOutput, issues: string[], recommendations: string[]): any {
    const results = {
      hasMobileViewport: pageData.mobileCompatible,
      viewportContent: pageData.meta.viewport,
      responsiveScore: 0
    };
    
    // Check viewport meta tag
    if (!results.hasMobileViewport) {
      issues.push('Missing mobile viewport meta tag.');
      recommendations.push('Add viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1.0">');
      results.responsiveScore = 0;
    } else {
      // Check viewport properties
      const viewport = results.viewportContent;
      if (viewport) {
        if (!viewport.includes('width=device-width')) {
          issues.push('Viewport meta tag doesn\'t include width=device-width.');
          recommendations.push('Update viewport meta tag to include width=device-width for better mobile rendering.');
          results.responsiveScore = 40;
        } else if (!viewport.includes('initial-scale=1')) {
          issues.push('Viewport meta tag doesn\'t include initial-scale=1.');
          recommendations.push('Add initial-scale=1 to your viewport meta tag for proper scaling.');
          results.responsiveScore = 70;
        } else {
          results.responsiveScore = 100;
        }
      }
    }
    
    return results;
  }
  
  /**
   * Analyze structured data
   */
  private analyzeStructuredData(pageData: CrawlerOutput, issues: string[], recommendations: string[]): any {
    const schemas = pageData.schema || [];
    
    const results = {
      hasStructuredData: schemas.length > 0,
      schemaTypes: schemas.map((s: any) => s.types).flat(),
      count: schemas.length
    };
    
    // Check for structured data
    if (!results.hasStructuredData) {
      issues.push('No structured data (Schema.org) found on page.');
      recommendations.push('Implement appropriate structured data to enhance search result appearance and context.');
    } else {
      // Check for common schemas
      const hasOrganization = results.schemaTypes.some((type: any) => type === 'Organization' || type === 'LocalBusiness');
      const hasBreadcrumbs = results.schemaTypes.some((type: any) => type === 'BreadcrumbList');
      
      if (!hasOrganization) {
        recommendations.push('Consider adding Organization or LocalBusiness schema to provide business information to search engines.');
      }
      
      if (!hasBreadcrumbs && pageData.url.split('/').length > 4) {
        recommendations.push('Add BreadcrumbList schema to help search engines understand your site structure.');
      }
    }
    
    return results;
  }
  
  /**
   * Analyze canonical issues
   */
  private analyzeCanonicalIssues(pageData: CrawlerOutput, issues: string[], recommendations: string[]): any {
    const canonical = pageData.meta.canonical || null;
    
    const results = {
      hasCanonical: !!canonical,
      canonicalUrl: canonical,
      isSelfCanonical: canonical === pageData.url
    };
    
    // Check canonical tag presence
    if (!results.hasCanonical) {
      issues.push('Missing canonical tag.');
      recommendations.push('Add a canonical tag to prevent duplicate content issues.');
    } else if (!results.isSelfCanonical) {
      issues.push('Page canonicalizes to a different URL.');
      recommendations.push('Ensure canonicalization is intentional and pointing to the correct URL.');
    }
    
    return results;
  }
  
  /**
   * Analyze performance issues
   */
  private analyzePerformanceIssues(pageData: CrawlerOutput, issues: string[], recommendations: string[]): any {
    const results = {
      loadTime: pageData.performance?.loadTime || 0,
      resourceCount: pageData.performance?.resourceCount || 0,
      resourceSize: pageData.performance?.resourceSize || 0,
      performanceScore: 0
    };
    
    // Convert to more readable formats
    const sizeMB = results.resourceSize / (1024 * 1024);
    const sizeReadable = sizeMB.toFixed(2) + ' MB';
    
    // Check page size
    if (sizeMB > 2) {
      issues.push(`Page is too large (${sizeReadable}).`);
      recommendations.push('Reduce page size by optimizing images, minifying CSS/JS, and removing unnecessary resources.');
    }
    
    // Check resource count
    if (results.resourceCount > 80) {
      issues.push(`Page has too many resources (${results.resourceCount}).`);
      recommendations.push('Reduce the number of resource requests by combining CSS/JS files and using image sprites.');
    }
    
    // Check load time (if available)
    if (results.loadTime > 0) {
      const loadTimeSeconds = results.loadTime / 1000;
      if (loadTimeSeconds > 3) {
        issues.push(`Slow page load time (${loadTimeSeconds.toFixed(2)} seconds).`);
        recommendations.push('Improve page load speed by optimizing resources, enabling compression, and using browser caching.');
      }
    }
    
    // Calculate performance score
    results.performanceScore = this.calculatePerformanceScore(results);
    
    return results;
  }
  
  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(performanceData: { loadTime: number, resourceCount: number, resourceSize: number }): number {
    let score = 100;
    
    // Deduct for large page size (max deduction: 40 points)
    const sizeMB = performanceData.resourceSize / (1024 * 1024);
    if (sizeMB > 0.5) {
      score -= Math.min(40, Math.floor(sizeMB * 20));
    }
    
    // Deduct for high resource count (max deduction: 30 points)
    if (performanceData.resourceCount > 30) {
      score -= Math.min(30, Math.floor((performanceData.resourceCount - 30) / 2));
    }
    
    // Deduct for slow load time if available (max deduction: 30 points)
    if (performanceData.loadTime > 0) {
      const loadTimeSeconds = performanceData.loadTime / 1000;
      if (loadTimeSeconds > 1) {
        score -= Math.min(30, Math.floor(loadTimeSeconds * 10));
      }
    }
    
    return Math.max(0, score);
  }
  
  /**
   * Analyze server configuration
   */
  private async analyzeServerConfiguration(pageData: CrawlerOutput, issues: string[], recommendations: string[]): Promise<any> {
    const urlObj = new URL(pageData.url);
    const domain = urlObj.hostname;
    
    const results = {
      domain,
      hasCookies: false,
      hasCDN: false,
      hasCompression: false,
      serverInfo: ''
    };
    
    try {
      // Check for DNS configuration
      await dnsResolve(domain, 'A').catch(() => {
        issues.push('Domain has DNS resolution issues.');
        recommendations.push('Check your DNS configuration to ensure proper domain resolution.');
      });
      
      // Look for server info in headers (if available)
      if (pageData.rawHtml) {
        // This is simplified - in a real implementation, headers would be analyzed more thoroughly
        results.hasCDN = pageData.rawHtml.toLowerCase().includes('cloudflare') || 
                        pageData.rawHtml.toLowerCase().includes('fastly') ||
                        pageData.rawHtml.toLowerCase().includes('akamai');
        
        results.hasCompression = pageData.rawHtml.toLowerCase().includes('gzip') || 
                                pageData.rawHtml.toLowerCase().includes('deflate') ||
                                pageData.rawHtml.toLowerCase().includes('br');
      }
      
      // Add recommendations based on findings
      if (!results.hasCDN) {
        recommendations.push('Consider using a CDN to improve page load speed globally.');
      }
      
      if (!results.hasCompression) {
        recommendations.push('Enable GZIP or Brotli compression to reduce page size and improve load times.');
      }
    } catch (error) {
      console.error('Error checking server configuration:', error);
    }
    
    return results;
  }
  
  /**
   * Calculate overall technical SEO score
   */
  private calculateTechnicalScore(issueCount: number, pageData: CrawlerOutput): number {
    // Start with base score of 100
    let score = 100;
    
    // Deduct points for each issue (more issues = more deductions)
    score -= Math.min(60, issueCount * 5);
    
    // Major deductions for critical issues
    
    // HTTP instead of HTTPS
    if (!pageData.url.startsWith('https://')) {
      score -= 20;
    }
    
    // Non-indexable page (if it should be indexed)
    if (pageData.seoIssues?.noindex) {
      score -= 15;
    }
    
    // Missing mobile viewport
    if (!pageData.mobileCompatible) {
      score -= 15;
    }
    
    // 4xx or 5xx status code
    if (pageData.statusCode >= 400) {
      score -= 50;
    }
    
    // 3xx redirect
    if (pageData.statusCode >= 300 && pageData.statusCode < 400) {
      score -= 10;
    }
    
    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  /**
   * Get HTTP status message
   */
  private getStatusMessage(statusCode: number): string {
    const statusMessages: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      301: 'Moved Permanently',
      302: 'Found (Temporary Redirect)',
      304: 'Not Modified',
      307: 'Temporary Redirect',
      308: 'Permanent Redirect',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      410: 'Gone',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };
    
    return statusMessages[statusCode] || 'Unknown Status';
  }
}

export const technicalSeoAnalyzer = new TechnicalSeoAnalyzer();