import axios from 'axios';
// TODO: Define types
type PageSpeedMetrics = any;
type CrawlerOutput = any;
import { ScoreUtils } from '../../lib/utils/score.utils';
import { AnalysisFactory } from '../../lib/factories/analysis.factory';

interface DeviceMetrics {
  score: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay?: number;
  cumulativeLayoutShift: number;
  timeToFirstByte: number;
  totalBlockingTime: number;
  speedIndex: number;
  timeToInteractive?: number;
}

interface UnifiedPageSpeedMetrics {
  // Core metrics (always present)
  score: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  
  // Optional extended metrics (when available from API)
  fcp?: number;
  tbt?: number;
  speedIndex?: number;
  tti?: number;
  
  // Device-specific data (when API available)
  mobile?: DeviceMetrics;
  desktop?: DeviceMetrics;
  
  // Metadata
  source: 'api' | 'simulation';
  timestamp: string;
  overallScore: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
  };
}

/**
 * Unified PageSpeed Service
 * Attempts to use Google PageSpeed Insights API first, falls back to simulation
 */
export class UnifiedPageSpeedService {
  /**
   * Analyze page speed using API or simulation fallback
   */
  async analyze(url: string, pageData?: CrawlerOutput): Promise<UnifiedPageSpeedMetrics> {
    try {
      // Try API first if configured
      if (process.env.GOOGLE_API_KEY) {
        try {
          return await this.analyzeWithApi(url);
        } catch (error) {
          console.warn('PageSpeed API analysis failed, falling back to simulation:', error);
        }
      }
      
      // Fallback to simulation
      if (pageData) {
        return await this.analyzeWithSimulation(url, pageData);
      }
      
      // If no page data available, return basic fallback
      return this.generateFallbackMetrics();
    } catch (error) {
      console.error('PageSpeed analysis failed:', error);
      return this.generateFallbackMetrics();
    }
  }

  /**
   * Analyze using Google PageSpeed Insights API
   */
  private async analyzeWithApi(url: string): Promise<UnifiedPageSpeedMetrics> {
    const [mobileResponse, desktopResponse] = await Promise.all([
      this.fetchPageSpeedApi(url, 'mobile'),
      this.fetchPageSpeedApi(url, 'desktop')
    ]);

    const mobileMetrics = this.extractMetrics(mobileResponse.data);
    const desktopMetrics = this.extractMetrics(desktopResponse.data);

    // Use mobile score as primary (aligns with Google's mobile-first approach)
    const primaryScore = mobileMetrics.score;
    
    return {
      score: primaryScore,
      lcp: mobileMetrics.largestContentfulPaint * 1000, // Convert to ms
      fid: mobileMetrics.firstInputDelay || 100,
      cls: mobileMetrics.cumulativeLayoutShift,
      ttfb: mobileMetrics.timeToFirstByte * 1000, // Convert to ms
      fcp: mobileMetrics.firstContentfulPaint * 1000,
      tbt: mobileMetrics.totalBlockingTime,
      speedIndex: mobileMetrics.speedIndex,
      tti: desktopMetrics.timeToInteractive,
      mobile: mobileMetrics,
      desktop: desktopMetrics,
      source: 'api',
      timestamp: new Date().toISOString(),
      overallScore: {
        score: primaryScore,
        category: this.getScoreCategory(primaryScore)
      }
    };
  }

  /**
   * Analyze using simulation based on page content
   */
  private async analyzeWithSimulation(url: string, pageData: CrawlerOutput): Promise<UnifiedPageSpeedMetrics> {
    const simulatedMetrics = await this.simulatePerformanceMetrics(url, pageData);
    const overallScore = this.calculateOverallScore(simulatedMetrics);
    
    return {
      score: simulatedMetrics.score,
      lcp: simulatedMetrics.lcp || 2500,
      fid: simulatedMetrics.fid || 100,
      cls: simulatedMetrics.cls || 0.1,
      ttfb: simulatedMetrics.ttfb || 600,
      speedIndex: simulatedMetrics.speedIndex,
      source: 'simulation',
      timestamp: new Date().toISOString(),
      overallScore: {
        score: overallScore,
        category: this.getScoreCategory(overallScore)
      }
    };
  }

  /**
   * Fetch data from Google PageSpeed Insights API
   */
  private async fetchPageSpeedApi(url: string, strategy: 'mobile' | 'desktop') {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`;
    const params = new URLSearchParams({
      url: encodeURIComponent(url),
      strategy,
      key: process.env.GOOGLE_API_KEY!,
      category: 'performance'
    });

    return axios.get(`${apiUrl}?${params}`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'RivalOutranker/1.0 PageSpeed Analysis'
      }
    });
  }

  /**
   * Extract metrics from PageSpeed API response
   */
  private extractMetrics(data: any): DeviceMetrics {
    const lighthouseResult = data.lighthouseResult;
    const audits = lighthouseResult.audits;
    
    // Performance score (0-100)
    const score = Math.round(lighthouseResult.categories.performance.score * 100);
    
    // Core Web Vitals and other metrics (in seconds, convert as needed)
    const fcp = audits['first-contentful-paint']?.numericValue / 1000 || 0;
    const lcp = audits['largest-contentful-paint']?.numericValue / 1000 || 0;
    const fid = audits['first-input-delay']?.numericValue || 0;
    const cls = audits['cumulative-layout-shift']?.numericValue || 0;
    const ttfb = audits['server-response-time']?.numericValue / 1000 || 0;
    const tbt = audits['total-blocking-time']?.numericValue || 0;
    const si = audits['speed-index']?.numericValue || 0;
    const tti = audits['interactive']?.numericValue / 1000 || 0;

    return {
      score,
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      firstInputDelay: fid,
      cumulativeLayoutShift: cls,
      timeToFirstByte: ttfb,
      totalBlockingTime: tbt,
      speedIndex: si,
      timeToInteractive: tti
    };
  }

  /**
   * Simulate performance metrics based on page content analysis
   */
  private async simulatePerformanceMetrics(url: string, pageData: CrawlerOutput): Promise<PageSpeedMetrics> {
    // Factors that affect performance
    const totalImages = pageData.images.length;
    const approximateResourceSize = pageData.content.text.length * 2;
    const hasPerformanceIssues = this.detectPerformanceIssues(pageData);
    const domainFactor = this.getDomainFactor(url);

    // Base performance score (starts optimistic)
    let baseScore = 85;

    // Apply penalties for performance issues
    if (totalImages > 10) baseScore -= 10;
    if (totalImages > 20) baseScore -= 10;
    if (approximateResourceSize > 100000) baseScore -= 15;
    if (hasPerformanceIssues) baseScore -= 10;

    // Apply domain factor for variation
    baseScore = Math.round(baseScore * domainFactor);
    baseScore = Math.max(10, Math.min(100, baseScore));

    // Simulate Core Web Vitals based on score
    const lcp = this.simulateLCP(baseScore, totalImages);
    const fid = this.simulateFID(baseScore);
    const cls = this.simulateCLS(baseScore, totalImages);
    const ttfb = this.simulateTTFB(baseScore, approximateResourceSize);
    const speedIndex = this.simulateSpeedIndex(baseScore, totalImages, approximateResourceSize);

    return {
      score: baseScore,
      lcp,
      fid,
      cls,
      ttfb,
      speedIndex
    };
  }

  /**
   * Detect performance issues from page content
   */
  private detectPerformanceIssues(pageData: CrawlerOutput): boolean {
    const hasLargeImages = pageData.images.length > 10;
    const hasExcessiveExternalLinks = pageData.links.external.length > 20;
    const hasLargeContent = pageData.content.wordCount > 3000;
    const hasLotsOfJavaScript = (pageData.performance?.resourceCount || 0) > 50;
    
    return hasLargeImages || hasExcessiveExternalLinks || hasLargeContent || hasLotsOfJavaScript;
  }

  /**
   * Get domain-based performance factor for realistic variation
   */
  private getDomainFactor(url: string): number {
    try {
      const domain = new URL(url).hostname;
      const domainLength = domain.length;
      
      // Create realistic variation based on domain characteristics
      let factor = 0.8 + (domainLength % 10) / 25;
      
      // Well-known fast domains get slight bonus
      const fastDomains = ['google.com', 'amazon.com', 'apple.com', 'microsoft.com'];
      if (fastDomains.some(d => domain.includes(d))) {
        factor += 0.1;
      }
      
      return Math.min(1.2, Math.max(0.7, factor));
    } catch {
      return 1.0;
    }
  }

  /**
   * Simulate Largest Contentful Paint (LCP)
   */
  private simulateLCP(score: number, imageCount: number): number {
    let baseLCP = 2500; // Good baseline
    
    // Worse score = slower LCP
    if (score < 50) baseLCP = 4000 + Math.random() * 2000;
    else if (score < 70) baseLCP = 3000 + Math.random() * 1000;
    else if (score < 90) baseLCP = 2500 + Math.random() * 500;
    else baseLCP = 1500 + Math.random() * 1000;
    
    // More images = potentially slower LCP
    baseLCP += imageCount * 50;
    
    return Math.round(baseLCP);
  }

  /**
   * Simulate First Input Delay (FID)
   */
  private simulateFID(score: number): number {
    if (score >= 90) return Math.round(50 + Math.random() * 50);
    if (score >= 70) return Math.round(100 + Math.random() * 100);
    if (score >= 50) return Math.round(200 + Math.random() * 100);
    return Math.round(300 + Math.random() * 200);
  }

  /**
   * Simulate Cumulative Layout Shift (CLS)
   */
  private simulateCLS(score: number, imageCount: number): number {
    let baseCLS = 0.1;
    
    if (score < 50) baseCLS = 0.25 + Math.random() * 0.15;
    else if (score < 70) baseCLS = 0.15 + Math.random() * 0.1;
    else if (score < 90) baseCLS = 0.1 + Math.random() * 0.05;
    else baseCLS = Math.random() * 0.1;
    
    // More images can cause layout shifts
    baseCLS += (imageCount * 0.01);
    
    return Math.round(baseCLS * 1000) / 1000; // Round to 3 decimal places
  }

  /**
   * Simulate Time to First Byte (TTFB)
   */
  private simulateTTFB(score: number, resourceSize: number): number {
    let baseTTFB = 600;
    
    if (score < 50) baseTTFB = 1200 + Math.random() * 800;
    else if (score < 70) baseTTFB = 800 + Math.random() * 400;
    else if (score < 90) baseTTFB = 600 + Math.random() * 200;
    else baseTTFB = 200 + Math.random() * 400;
    
    // Larger resources = slower TTFB
    baseTTFB += Math.min(800, resourceSize / 1000);
    
    return Math.round(baseTTFB);
  }

  /**
   * Simulate Speed Index
   */
  private simulateSpeedIndex(score: number, imageCount: number, resourceSize: number): number {
    let baseSpeedIndex = 3000;
    
    if (score < 50) baseSpeedIndex = 6000 + Math.random() * 3000;
    else if (score < 70) baseSpeedIndex = 4000 + Math.random() * 2000;
    else if (score < 90) baseSpeedIndex = 3000 + Math.random() * 1000;
    else baseSpeedIndex = 1500 + Math.random() * 1500;
    
    // Adjust for content complexity
    baseSpeedIndex += imageCount * 100;
    baseSpeedIndex += Math.min(2000, resourceSize / 100);
    
    return Math.round(baseSpeedIndex);
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallScore(metrics: PageSpeedMetrics): number {
    if (!metrics.lcp || !metrics.fid || !metrics.cls || !metrics.ttfb) {
      return metrics.score;
    }

    // Weight the different metrics
    const lcpScore = this.calculateLCPScore(metrics.lcp);
    const fidScore = this.calculateFIDScore(metrics.fid);
    const clsScore = this.calculateCLSScore(metrics.cls);
    const ttfbScore = this.calculateTTFBScore(metrics.ttfb);

    // Weighted average (LCP and FID are most important)
    const weightedScore = (
      lcpScore * 0.25 +
      fidScore * 0.25 +
      clsScore * 0.15 +
      ttfbScore * 0.15 +
      metrics.score * 0.2
    );

    return Math.round(Math.max(0, Math.min(100, weightedScore)));
  }

  /**
   * Calculate LCP score (Largest Contentful Paint)
   * @deprecated Use ScoreUtils.getPerformanceMetricScore instead
   */
  private calculateLCPScore(lcp: number): number {
    return ScoreUtils.getPerformanceMetricScore(lcp, 'lcp');
  }

  /**
   * Calculate FID score (First Input Delay)
   * @deprecated Use ScoreUtils.getPerformanceMetricScore instead
   */
  private calculateFIDScore(fid: number): number {
    return ScoreUtils.getPerformanceMetricScore(fid, 'fid');
  }

  /**
   * Calculate CLS score (Cumulative Layout Shift)
   * @deprecated Use ScoreUtils.getPerformanceMetricScore instead
   */
  private calculateCLSScore(cls: number): number {
    return ScoreUtils.getPerformanceMetricScore(cls, 'cls');
  }

  /**
   * Calculate TTFB score (Time to First Byte)
   * @deprecated Use ScoreUtils.getPerformanceMetricScore instead
   */
  private calculateTTFBScore(ttfb: number): number {
    return ScoreUtils.getPerformanceMetricScore(ttfb, 'ttfb');
  }

  /**
   * Get score category based on numeric score
   * @deprecated Use ScoreUtils.getPerformanceCategory instead
   */
  private getScoreCategory(score: number): 'excellent' | 'good' | 'needs-work' | 'poor' {
    return ScoreUtils.getPerformanceCategory(score);
  }

  /**
   * Generate fallback metrics when analysis fails
   * @deprecated Use AnalysisFactory.createFallbackPageSpeedMetrics instead
   */
  private generateFallbackMetrics(): UnifiedPageSpeedMetrics {
    return AnalysisFactory.createFallbackPageSpeedMetrics();
  }
}

// Export singleton instance
export const pageSpeedService = new UnifiedPageSpeedService();

// Export for backward compatibility
export default pageSpeedService;