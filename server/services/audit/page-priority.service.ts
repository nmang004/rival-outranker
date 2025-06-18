import { PageCrawlResult } from './audit.service';
import { IssueGroupingService, IssueGroup } from './issue-grouping.service';
import { AuditItem } from '../../../shared/schema';

/**
 * Page Priority Tiers for OFI Scoring
 */
export enum PagePriority {
  TIER_1 = 1, // High Priority: Homepage, primary service pages, key landing pages
  TIER_2 = 2, // Medium Priority: Category pages, secondary service pages, about/contact pages
  TIER_3 = 3  // Low Priority: Blog posts, news articles, archive pages, utility pages
}

/**
 * Page Priority Weights for OFI Calculation
 */
export const PAGE_PRIORITY_WEIGHTS = {
  [PagePriority.TIER_1]: 3.0, // 3x weight
  [PagePriority.TIER_2]: 2.0, // 2x weight
  [PagePriority.TIER_3]: 1.0  // 1x weight (base)
} as const;

/**
 * Configuration for manual page classification overrides
 */
export interface PageClassificationOverride {
  url: string;
  priority: PagePriority;
  reason?: string;
}

/**
 * Enhanced service for smart priority calculation with template-aware scoring
 */
export class PagePriorityService {
  private issueGroupingService: IssueGroupingService;

  constructor() {
    this.issueGroupingService = new IssueGroupingService();
  }
  
  /**
   * Determine the priority tier of a page based on its type and characteristics
   */
  getPagePriority(page: PageCrawlResult, pageType: string, overrides?: PageClassificationOverride[]): PagePriority {
    // Check for manual overrides first
    const override = overrides?.find(o => o.url === page.url);
    if (override) {
      return override.priority;
    }

    // Auto-classify based on page type and URL patterns
    return this.classifyPagePriority(page, pageType);
  }

  /**
   * Auto-classify page priority based on type and URL analysis
   */
  private classifyPagePriority(page: PageCrawlResult, pageType: string): PagePriority {
    const url = page.url.toLowerCase();
    
    // Tier 1 (High Priority) - 3x weight
    if (this.isTier1Page(page, pageType, url)) {
      return PagePriority.TIER_1;
    }
    
    // Tier 2 (Medium Priority) - 2x weight
    if (this.isTier2Page(page, pageType, url)) {
      return PagePriority.TIER_2;
    }
    
    // Tier 3 (Low Priority) - 1x weight (default)
    return PagePriority.TIER_3;
  }

  /**
   * Determine if page qualifies for Tier 1 (High Priority)
   * Homepage, primary service pages, key landing pages
   */
  private isTier1Page(page: PageCrawlResult, pageType: string, url: string): boolean {
    // Homepage is always Tier 1
    if (pageType === 'homepage' || this.isHomepage(url)) {
      return true;
    }

    // Primary service pages (main services, not sub-services)
    if (pageType === 'service' && this.isPrimaryServicePage(url, page)) {
      return true;
    }

    // Key landing pages (high-traffic entry points)
    if (this.isKeyLandingPage(url, page)) {
      return true;
    }

    return false;
  }

  /**
   * Determine if page qualifies for Tier 2 (Medium Priority)
   * Category pages, secondary service pages, about/contact pages
   */
  private isTier2Page(page: PageCrawlResult, pageType: string, url: string): boolean {
    // Contact pages
    if (pageType === 'contact') {
      return true;
    }

    // Secondary service pages
    if (pageType === 'service' && !this.isPrimaryServicePage(url, page)) {
      return true;
    }

    // Location pages (important for local SEO)
    if (pageType === 'location') {
      return true;
    }

    // Service area pages
    if (pageType === 'serviceArea') {
      return true;
    }

    // About pages and other key informational pages
    if (this.isImportantInformationalPage(url, page)) {
      return true;
    }

    // Category/navigation pages
    if (this.isCategoryPage(url, page)) {
      return true;
    }

    return false;
  }

  /**
   * Check if URL represents the homepage
   */
  private isHomepage(url: string): boolean {
    const path = new URL(url).pathname;
    return path === '/' || path === '/index.html' || path === '/home';
  }

  /**
   * Determine if a service page is a primary (Tier 1) service
   */
  private isPrimaryServicePage(url: string, page: PageCrawlResult): boolean {
    const title = page.title.toLowerCase();
    const bodyText = page.bodyText.toLowerCase();
    
    // Check for primary service indicators in URL structure
    const primaryServiceUrlPatterns = [
      /\/services?\/$/, // Main services page
      /\/service$/, // Main service page
      /\/what-we-do\/$/, // Main offerings page
    ];

    if (primaryServiceUrlPatterns.some(pattern => pattern.test(url))) {
      return true;
    }

    // Check URL depth (primary services are usually at top level)
    const pathSegments = new URL(url).pathname.split('/').filter(s => s.length > 0);
    if (pathSegments.length <= 2) { // e.g., /services/hvac vs /services/hvac/repair
      return true;
    }

    // Check for primary service keywords in title
    const primaryServiceKeywords = [
      'main service', 'primary service', 'our services', 'what we do',
      'hvac services', 'plumbing services', 'electrical services'
    ];

    if (primaryServiceKeywords.some(keyword => title.includes(keyword))) {
      return true;
    }

    // Check for comprehensive service descriptions (primary pages tend to be longer)
    if (bodyText.length > 2000 && this.hasServiceOverviewContent(bodyText)) {
      return true;
    }

    return false;
  }

  /**
   * Check if page is a key landing page (high-traffic entry point)
   */
  private isKeyLandingPage(url: string, page: PageCrawlResult): boolean {
    const landingPagePatterns = [
      /\/free-estimate/, /\/get-quote/, /\/contact-us/,
      /\/emergency/, /\/24-7/, /\/book-now/,
      /\/special-offer/, /\/promotion/, /\/deal/
    ];

    return landingPagePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Check if page is an important informational page
   */
  private isImportantInformationalPage(url: string, page: PageCrawlResult): boolean {
    const importantPages = [
      /\/about/, /\/about-us/, /\/our-story/, /\/our-team/,
      /\/testimonials/, /\/reviews/, /\/portfolio/,
      /\/guarantees?/, /\/warranty/, /\/insurance/,
      /\/process/, /\/how-it-works/, /\/methodology/
    ];

    return importantPages.some(pattern => pattern.test(url));
  }

  /**
   * Check if page is a category/navigation page
   */
  private isCategoryPage(url: string, page: PageCrawlResult): boolean {
    const categoryPatterns = [
      /\/category/, /\/categories/, /\/solutions/,
      /\/industries/, /\/residential/, /\/commercial/
    ];

    return categoryPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Check if content indicates a service overview page
   */
  private hasServiceOverviewContent(bodyText: string): boolean {
    const overviewIndicators = [
      'we offer', 'we provide', 'our services include',
      'comprehensive', 'full-service', 'complete solution',
      'years of experience', 'licensed', 'certified', 'insured'
    ];

    const indicatorCount = overviewIndicators.filter(indicator => 
      bodyText.includes(indicator)
    ).length;

    return indicatorCount >= 3;
  }

  /**
   * Calculate smart weighted OFI score with template-aware prioritization
   */
  calculateSmartWeightedOFI(auditItems: AuditItem[]): {
    weightedOFI: number;
    templateAdjustedOFI: number;
    issueGroups: IssueGroup[];
    priorityBreakdown: {
      templateIssues: number;
      individualIssues: number;
      highPriorityGroups: number;
    };
    efficiencyGains: {
      templateFixesAvailable: number;
      estimatedEffortReduction: string;
    };
  } {
    // Group similar issues and detect template problems
    const issueGroups = this.issueGroupingService.groupSimilarIssues(auditItems);
    
    // Calculate smart priority scores for each group
    let totalScore = 0;
    let templateAdjustedScore = 0;
    
    issueGroups.forEach(group => {
      const baseScore = this.calculateGroupBaseScore(group);
      const templateMultiplier = this.calculateTemplateMultiplier(group);
      
      totalScore += baseScore * group.pages.length; // Old linear approach
      templateAdjustedScore += baseScore * templateMultiplier; // New smart approach
    });
    
    const report = this.issueGroupingService.generateGroupingReport(issueGroups);
    
    return {
      weightedOFI: totalScore,
      templateAdjustedOFI: templateAdjustedScore,
      issueGroups,
      priorityBreakdown: {
        templateIssues: report.templateIssues,
        individualIssues: report.individualIssues,
        highPriorityGroups: report.highPriorityGroups
      },
      efficiencyGains: {
        templateFixesAvailable: report.efficiencyGains.templateFixesAvailable,
        estimatedEffortReduction: report.efficiencyGains.estimatedEffortReduction
      }
    };
  }

  /**
   * Legacy method maintained for backward compatibility
   */
  calculateWeightedOFI(pageResults: Array<{
    priority: PagePriority;
    priorityOfiCount: number;
    ofiCount: number;
    okCount: number;
    naCount: number;
  }>): {
    weightedOFI: number;
    totalWeight: number;
    normalizedOFI: number;
    sizeAdjustedOFI: number;
    breakdown: {
      tier1: { pages: number; weight: number; ofi: number };
      tier2: { pages: number; weight: number; ofi: number };
      tier3: { pages: number; weight: number; ofi: number };
    };
    normalizationFactors: {
      sizeNormalization: number;
      distributionBalance: number;
      tierRepresentation: number;
    };
  } {
    let totalWeightedOFI = 0;
    let totalWeight = 0;
    
    const breakdown = {
      tier1: { pages: 0, weight: 0, ofi: 0 },
      tier2: { pages: 0, weight: 0, ofi: 0 },
      tier3: { pages: 0, weight: 0, ofi: 0 }
    };

    for (const page of pageResults) {
      const weight = PAGE_PRIORITY_WEIGHTS[page.priority];
      const pageOFI = page.priorityOfiCount + page.ofiCount;
      const weightedPageOFI = pageOFI * weight;
      
      totalWeightedOFI += weightedPageOFI;
      totalWeight += weight;

      // Update breakdown
      const tierKey = `tier${page.priority}` as keyof typeof breakdown;
      breakdown[tierKey].pages++;
      breakdown[tierKey].weight += weight;
      breakdown[tierKey].ofi += pageOFI;
    }

    // Basic normalization
    const normalizedOFI = totalWeight > 0 ? totalWeightedOFI / totalWeight : 0;

    // Advanced normalization factors for varying site sizes
    const normalizationFactors = this.calculateNormalizationFactors(pageResults, breakdown);
    
    // Apply size-based normalization to prevent large sites from being penalized
    const sizeAdjustedOFI = normalizedOFI * normalizationFactors.sizeNormalization 
                          * normalizationFactors.distributionBalance 
                          * normalizationFactors.tierRepresentation;

    return {
      weightedOFI: totalWeightedOFI,
      totalWeight,
      normalizedOFI,
      sizeAdjustedOFI,
      breakdown,
      normalizationFactors
    };
  }

  /**
   * Calculate normalization factors to handle varying site sizes and distributions
   */
  private calculateNormalizationFactors(
    pageResults: Array<{ priority: PagePriority }>,
    breakdown: {
      tier1: { pages: number; weight: number; ofi: number };
      tier2: { pages: number; weight: number; ofi: number };
      tier3: { pages: number; weight: number; ofi: number };
    }
  ): {
    sizeNormalization: number;
    distributionBalance: number;
    tierRepresentation: number;
  } {
    const totalPages = pageResults.length;
    
    // 1. Site Size Normalization
    // Prevents large sites from being unfairly penalized due to more low-priority pages
    const sizeNormalization = this.calculateSizeNormalization(totalPages);
    
    // 2. Distribution Balance Factor
    // Ensures balanced representation across priority tiers
    const distributionBalance = this.calculateDistributionBalance(breakdown, totalPages);
    
    // 3. Tier Representation Factor
    // Boosts confidence when high-priority pages are well represented
    const tierRepresentation = this.calculateTierRepresentation(breakdown, totalPages);

    return {
      sizeNormalization,
      distributionBalance,
      tierRepresentation
    };
  }

  /**
   * Calculate size normalization factor
   * Larger sites get slight boost to prevent low-priority page penalty
   */
  private calculateSizeNormalization(totalPages: number): number {
    if (totalPages <= 5) return 1.0;    // Small sites: no adjustment
    if (totalPages <= 15) return 1.05;  // Medium sites: slight boost
    if (totalPages <= 30) return 1.1;   // Large sites: moderate boost
    return 1.15;                        // Very large sites: maximum boost
  }

  /**
   * Calculate distribution balance factor
   * Rewards sites with good priority distribution
   */
  private calculateDistributionBalance(
    breakdown: {
      tier1: { pages: number };
      tier2: { pages: number };
      tier3: { pages: number };
    },
    totalPages: number
  ): number {
    if (totalPages === 0) return 1.0;

    const tier1Ratio = breakdown.tier1.pages / totalPages;
    const tier2Ratio = breakdown.tier2.pages / totalPages;
    const tier3Ratio = breakdown.tier3.pages / totalPages;

    // Ideal distribution: ~20% tier 1, ~40% tier 2, ~40% tier 3
    const idealTier1 = 0.2;
    const idealTier2 = 0.4;
    const idealTier3 = 0.4;

    // Calculate deviation from ideal
    const tier1Deviation = Math.abs(tier1Ratio - idealTier1);
    const tier2Deviation = Math.abs(tier2Ratio - idealTier2);
    const tier3Deviation = Math.abs(tier3Ratio - idealTier3);

    const avgDeviation = (tier1Deviation + tier2Deviation + tier3Deviation) / 3;
    
    // Convert deviation to balance factor (lower deviation = higher factor)
    return Math.max(0.85, 1.0 - (avgDeviation * 0.5));
  }

  /**
   * Calculate tier representation factor
   * Boosts confidence when tier 1 pages are present and not overwhelming
   */
  private calculateTierRepresentation(
    breakdown: {
      tier1: { pages: number };
      tier2: { pages: number };
      tier3: { pages: number };
    },
    totalPages: number
  ): number {
    if (totalPages === 0) return 1.0;

    const tier1Count = breakdown.tier1.pages;
    const tier1Ratio = tier1Count / totalPages;

    // No tier 1 pages - reduce confidence
    if (tier1Count === 0) return 0.9;

    // Good tier 1 representation (10-30%) - boost confidence
    if (tier1Ratio >= 0.1 && tier1Ratio <= 0.3) return 1.1;

    // Too many tier 1 pages (>50%) - penalize
    if (tier1Ratio > 0.5) return 0.85;

    // Acceptable representation
    return 1.0;
  }

  /**
   * Calculate overall audit score with priority weighting
   */
  calculatePriorityWeightedScore(pageResults: Array<{
    priority: PagePriority;
    score: number;
  }>): {
    weightedScore: number;
    confidence: number; // How confident we are in this score (based on tier 1 representation)
  } {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let tier1Pages = 0;
    let totalPages = pageResults.length;

    for (const page of pageResults) {
      const weight = PAGE_PRIORITY_WEIGHTS[page.priority];
      totalWeightedScore += page.score * weight;
      totalWeight += weight;
      
      if (page.priority === PagePriority.TIER_1) {
        tier1Pages++;
      }
    }

    const weightedScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    
    // Confidence based on representation of high-priority pages
    // Higher confidence when we have more Tier 1 pages
    const tier1Ratio = totalPages > 0 ? tier1Pages / totalPages : 0;
    const confidence = Math.min(0.5 + (tier1Ratio * 0.5), 1.0); // 50-100% confidence

    return {
      weightedScore: Math.round(weightedScore * 100) / 100,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  /**
   * Get human-readable priority description
   */
  getPriorityDescription(priority: PagePriority): string {
    switch (priority) {
      case PagePriority.TIER_1:
        return 'High Priority (3x weight) - Homepage, primary services, key landing pages';
      case PagePriority.TIER_2:
        return 'Medium Priority (2x weight) - Category pages, secondary services, about/contact';
      case PagePriority.TIER_3:
        return 'Low Priority (1x weight) - Blog posts, news articles, archive pages';
      default:
        return 'Unknown Priority';
    }
  }

  /**
   * Get priority weight multiplier
   */
  getPriorityWeight(priority: PagePriority): number {
    return PAGE_PRIORITY_WEIGHTS[priority];
  }

  /**
   * Calculate base score for an issue group
   */
  private calculateGroupBaseScore(group: IssueGroup): number {
    const severityScore = group.severity === 'high' ? 10 : group.severity === 'medium' ? 6 : 3;
    const businessScore = group.businessImpact === 'high' ? 3 : group.businessImpact === 'medium' ? 2 : 1;
    const effortMultiplier = group.effort === 'low' ? 1.5 : group.effort === 'medium' ? 1.0 : 0.7;
    
    return severityScore * businessScore * effortMultiplier;
  }

  /**
   * Calculate template-aware multiplier for issue groups
   */
  private calculateTemplateMultiplier(group: IssueGroup): number {
    if (group.isTemplateIssue) {
      // Logarithmic scaling for template issues - diminishing returns after first few pages
      return Math.log(group.pages.length + 1) * 2;
    } else {
      // Linear scaling for individual issues, but capped to prevent huge penalties
      return Math.min(group.pages.length, 5);
    }
  }

  /**
   * Calculate context-aware priority score for audit items
   */
  calculateContextAwarePriority(
    auditItems: AuditItem[],
    siteContext: {
      totalPages: number;
      siteType: 'small' | 'medium' | 'large' | 'enterprise';
      businessType: 'local' | 'ecommerce' | 'corporate' | 'nonprofit';
    }
  ): {
    prioritizedItems: Array<AuditItem & { calculatedPriority: number; reasoning: string }>;
    insights: {
      templateIssuesIdentified: number;
      quickWinsAvailable: number;
      highImpactLowEffortTasks: number;
      recommendedFirstSteps: string[];
    };
  } {
    const issueGroups = this.issueGroupingService.groupSimilarIssues(auditItems);
    
    const prioritizedItems = auditItems.map(item => {
      const relevantGroup = issueGroups.find(group => 
        group.pages.includes(this.extractPageUrl(item))
      );
      
      const basePriority = this.calculateItemBasePriority(item);
      const contextMultiplier = this.calculateContextMultiplier(item, siteContext);
      const groupMultiplier = relevantGroup ? this.calculateGroupMultiplier(relevantGroup) : 1;
      
      const calculatedPriority = basePriority * contextMultiplier * groupMultiplier;
      const reasoning = this.generatePriorityReasoning(item, relevantGroup, siteContext);
      
      return {
        ...item,
        calculatedPriority,
        reasoning
      };
    });
    
    // Sort by calculated priority
    prioritizedItems.sort((a, b) => b.calculatedPriority - a.calculatedPriority);
    
    const insights = this.generateInsights(issueGroups, prioritizedItems, siteContext);
    
    return {
      prioritizedItems,
      insights
    };
  }

  /**
   * Calculate base priority score for individual items
   */
  private calculateItemBasePriority(item: AuditItem): number {
    let score = 0;
    
    // Status-based scoring
    if (item.status === 'Priority OFI') score += 10;
    else if (item.status === 'OFI') score += 5;
    else if (item.status === 'OK') score += 1;
    else score += 0; // N/A
    
    // Importance-based scoring
    if (item.importance === 'High') score += 5;
    else if (item.importance === 'Medium') score += 3;
    else score += 1;
    
    return score;
  }

  /**
   * Calculate context multiplier based on site characteristics
   */
  private calculateContextMultiplier(
    item: AuditItem,
    context: { totalPages: number; siteType: string; businessType: string }
  ): number {
    let multiplier = 1.0;
    
    // Site size adjustments
    if (context.siteType === 'enterprise' && this.isTemplateFixableIssue(item)) {
      multiplier *= 1.3; // Template fixes have higher impact on large sites
    } else if (context.siteType === 'small' && this.isContentSpecificIssue(item)) {
      multiplier *= 1.2; // Content issues more critical for small sites
    }
    
    // Business type adjustments
    if (context.businessType === 'local' && this.isLocalSEOIssue(item)) {
      multiplier *= 1.4;
    } else if (context.businessType === 'ecommerce' && this.isConversionIssue(item)) {
      multiplier *= 1.3;
    }
    
    return multiplier;
  }

  /**
   * Calculate group-based multiplier
   */
  private calculateGroupMultiplier(group: IssueGroup): number {
    let multiplier = 1.0;
    
    if (group.isTemplateIssue && group.effort === 'low') {
      multiplier *= 1.2; // Quick template fixes get priority boost
    }
    
    if (group.pages.length >= 10) {
      multiplier *= 1.1; // Widespread issues get slight boost
    }
    
    return multiplier;
  }

  /**
   * Generate human-readable reasoning for priority calculation
   */
  private generatePriorityReasoning(
    item: AuditItem,
    group: IssueGroup | undefined,
    context: { siteType: string; businessType: string }
  ): string {
    const reasons = [];
    
    if (item.status === 'Priority OFI') {
      reasons.push('Classified as Priority OFI');
    }
    
    if (group?.isTemplateIssue) {
      reasons.push(`Template issue affecting ${group.pages.length} pages`);
    }
    
    if (group?.effort === 'low' && group?.businessImpact === 'high') {
      reasons.push('High impact, low effort (quick win)');
    }
    
    if (context.businessType === 'local' && this.isLocalSEOIssue(item)) {
      reasons.push('Critical for local business visibility');
    }
    
    if (reasons.length === 0) {
      reasons.push('Standard priority based on importance and status');
    }
    
    return reasons.join('; ');
  }

  /**
   * Generate actionable insights from priority analysis
   */
  private generateInsights(
    groups: IssueGroup[],
    items: Array<AuditItem & { calculatedPriority: number }>,
    context: { siteType: string; businessType: string }
  ): {
    templateIssuesIdentified: number;
    quickWinsAvailable: number;
    highImpactLowEffortTasks: number;
    recommendedFirstSteps: string[];
  } {
    const templateIssues = groups.filter(g => g.isTemplateIssue).length;
    const quickWins = groups.filter(g => g.effort === 'low' && g.businessImpact === 'high').length;
    const highImpactLowEffort = groups.filter(g => 
      g.businessImpact === 'high' && (g.effort === 'low' || g.effort === 'medium')
    ).length;
    
    const topItems = items.slice(0, 5);
    const recommendedFirstSteps = topItems.map((item, index) => 
      `${index + 1}. ${item.name} (Priority: ${Math.round(item.calculatedPriority)})`
    );
    
    return {
      templateIssuesIdentified: templateIssues,
      quickWinsAvailable: quickWins,
      highImpactLowEffortTasks: highImpactLowEffort,
      recommendedFirstSteps
    };
  }

  /**
   * Helper methods for issue classification
   */
  private isTemplateFixableIssue(item: AuditItem): boolean {
    const text = `${item.name} ${item.description || ''}`.toLowerCase();
    return text.includes('meta') || text.includes('title') || text.includes('h1') || text.includes('schema');
  }

  private isContentSpecificIssue(item: AuditItem): boolean {
    const text = `${item.name} ${item.description || ''}`.toLowerCase();
    return text.includes('content') || text.includes('alt text') || text.includes('description');
  }

  private isLocalSEOIssue(item: AuditItem): boolean {
    const text = `${item.name} ${item.description || ''}`.toLowerCase();
    return text.includes('contact') || text.includes('address') || text.includes('phone') || text.includes('location');
  }

  private isConversionIssue(item: AuditItem): boolean {
    const text = `${item.name} ${item.description || ''}`.toLowerCase();
    return text.includes('cta') || text.includes('form') || text.includes('checkout') || text.includes('cart');
  }

  /**
   * Extract page URL from audit item (duplicated from IssueGroupingService for independence)
   */
  private extractPageUrl(item: AuditItem): string {
    if ('pageUrl' in item && typeof item.pageUrl === 'string') {
      return item.pageUrl;
    }
    
    const text = `${item.description || ''} ${item.notes || ''}`;
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      return urlMatch[0];
    }
    
    return 'unknown';
  }
}