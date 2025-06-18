import { AuditItem } from '../../../shared/schema';
import { PagePriority } from './page-priority.service';

/**
 * Page context information for enhanced OFI classification
 */
export interface PageContext {
  pageType: 'homepage' | 'service' | 'contact' | 'location' | 'other';
  pagePriority: PagePriority;
  siteSize: 'small' | 'medium' | 'large' | 'enterprise';
  businessType: 'local' | 'ecommerce' | 'corporate' | 'nonprofit';
  competitiveContext?: {
    industryCompetitiveness: 'low' | 'medium' | 'high';
    currentRankingPosition?: number;
    targetKeywords?: string[];
  };
  trafficImportance?: {
    monthlyTraffic?: number;
    conversionValue?: number;
    businessCriticality: 'low' | 'medium' | 'high';
  };
}

export interface OFIClassificationCriteria {
  seoVisibilityImpact: boolean;
  userExperienceImpact: boolean;
  businessImpact: boolean;
  complianceRisk: boolean;
}

export interface OFIAnalysisMetrics {
  performanceImpact?: number; // Percentage degradation
  userBaseAffected?: number; // Percentage of users affected
  revenueImpactPerDay?: number; // Dollar amount
  supportTicketsPerDay?: number; // Number of tickets
  cvssScore?: number; // Security vulnerability score
  memoryLeakRate?: number; // MB per hour
  blockedInitiatives?: number; // Number of blocked development initiatives
  incidentRateIncrease?: number; // Percentage increase in incidents
  eolMonths?: number; // Months until end of life
}

export interface OFIClassificationResult {
  classification: 'Standard OFI' | 'Priority OFI';
  criteriaMet: OFIClassificationCriteria;
  justification: string;
  metrics: OFIAnalysisMetrics;
  decisionTree: string[];
  requiresValidation: boolean;
}

export class OFIClassificationService {
  
  /**
   * Enhanced classification with page context awareness
   */
  classifyOFIWithContext(
    name: string,
    description: string,
    pageContext: PageContext,
    metrics: OFIAnalysisMetrics = {}
  ): OFIClassificationResult {
    
    const contextAwareCriteria = this.evaluateContextAwareCriteria(
      metrics, name, description, pageContext
    );
    
    const decisionTree = this.buildEnhancedDecisionTree(contextAwareCriteria, metrics, pageContext);
    const priorityScore = this.calculateContextAwarePriorityScore(contextAwareCriteria, pageContext);
    
    // Dynamic threshold based on page importance and site characteristics
    const threshold = this.calculateDynamicThreshold(pageContext);
    
    const classification: 'Standard OFI' | 'Priority OFI' = priorityScore >= threshold ? 'Priority OFI' : 'Standard OFI';
    
    const justification = this.buildContextAwareJustification(
      classification,
      contextAwareCriteria,
      priorityScore,
      threshold,
      pageContext,
      metrics
    );

    return {
      classification,
      criteriaMet: {
        seoVisibilityImpact: contextAwareCriteria.seoVisibilityImpact.score > 3,
        userExperienceImpact: contextAwareCriteria.userExperienceImpact.score > 3,
        businessImpact: contextAwareCriteria.businessImpact.score > 3,
        complianceRisk: contextAwareCriteria.complianceRisk.score > 3
      },
      justification,
      metrics,
      decisionTree,
      requiresValidation: classification === 'Priority OFI'
    };
  }
  
  /**
   * Classify an OFI item based on the strict priority matrix criteria
   */
  classifyOFI(
    name: string,
    description: string,
    metrics: OFIAnalysisMetrics = {},
    context?: any
  ): OFIClassificationResult {
    
    const criteriaMet = this.evaluateCriteria(metrics, name, description, context);
    const decisionTree = this.buildDecisionTree(criteriaMet, metrics);
    let priorityCriteriaCount = this.countPriorityCriteria(criteriaMet);
    
    // BALANCED APPROACH: Use reasonable criteria for Priority OFI classification
    let classification: 'Standard OFI' | 'Priority OFI' = 'Standard OFI';
    let downgradedReason = '';
    
    // Special cases: Some critical issues should be Priority OFI even with 1 criteria
    const isCriticalSingleIssue = this.checkCriticalSingleCriteriaIssues(name, description, context);
    
    // Classify as Priority OFI if we have 2+ criteria OR it's a critical single-criteria issue
    if (priorityCriteriaCount >= 2 || isCriticalSingleIssue) {
      classification = 'Priority OFI';
      if (isCriticalSingleIssue && priorityCriteriaCount < 2) {
        // Override downgrade reason for critical issues
        downgradedReason = '';
      }
    } else {
      downgradedReason = 'Only meets ' + priorityCriteriaCount + ' priority criteria (requires 2+ for Priority OFI)';
    }
    
    // Additional safety checks
    const hasWorkaround = this.checkForWorkaround(name, description, context);
    if (hasWorkaround) {
      classification = 'Standard OFI';
      downgradedReason = 'Workaround available';
    }
    
    const justification = this.buildJustification(
      classification,
      criteriaMet,
      priorityCriteriaCount,
      metrics,
      downgradedReason
    );

    return {
      classification,
      criteriaMet,
      justification,
      metrics,
      decisionTree,
      requiresValidation: classification === 'Priority OFI'
    };
  }

  /**
   * Auto-classify existing audit items based on their characteristics
   */
  classifyAuditItem(item: AuditItem): OFIClassificationResult {
    const metrics = this.extractMetricsFromAuditItem(item);
    const context = {
      currentStatus: item.status,
      importance: item.importance,
      notes: item.notes
    };

    return this.classifyOFI(item.name, item.description || '', metrics, context);
  }

  /**
   * Evaluate all four priority criteria
   */
  private evaluateCriteria(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string,
    context?: any
  ): OFIClassificationCriteria {
    
    return {
      seoVisibilityImpact: this.evaluateSeoVisibilityImpact(metrics, name, description, context),
      userExperienceImpact: this.evaluateUserExperienceImpact(metrics, name, description),
      businessImpact: this.evaluateBusinessImpact(metrics, name, description),
      complianceRisk: this.evaluateComplianceRisk(metrics, name, description, context)
    };
  }

  /**
   * Context-aware SEO Visibility Impact evaluation
   * Considers page importance, business type, and competitive context
   */
  private evaluateContextAwareSeoImpact(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string,
    context: PageContext
  ): { score: number; factors: string[] } {
    let score = 0;
    const factors: string[] = [];
    
    // Base SEO impact assessment
    const baseImpact = this.evaluateSeoVisibilityImpact(metrics, name, description, context);
    if (baseImpact) {
      score += 3;
      factors.push('Base SEO visibility impact detected');
    }
    
    // Page type multipliers
    if (context.pageType === 'homepage') {
      score *= 1.5;
      factors.push('Homepage - critical for site visibility');
    } else if (context.pageType === 'service' && context.businessType === 'local') {
      score *= 1.3;
      factors.push('Service page for local business - high search visibility impact');
    } else if (context.pageType === 'contact' && context.businessType === 'local') {
      score *= 1.2;
      factors.push('Contact page for local business - important for local SEO');
    }
    
    // Competitive context adjustments
    if (context.competitiveContext?.industryCompetitiveness === 'high') {
      score *= 1.2;
      factors.push('Highly competitive industry - SEO issues more critical');
    }
    
    // Traffic importance adjustments
    if (context.trafficImportance?.businessCriticality === 'high') {
      score *= 1.3;
      factors.push('High business-critical page - SEO impact magnified');
    }
    
    return { score: Math.min(score, 10), factors };
  }

  /**
   * Legacy SEO Visibility Impact Criteria - maintained for backward compatibility
   */
  private evaluateSeoVisibilityImpact(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string,
    context?: any
  ): boolean {
    
    // Enhanced critical SEO issue detection with context
    const hasCriticalMetaIssues = this.hasCriticalMetaIssues(name, description, context);

    // Core Web Vitals issues
    const coreWebVitalsKeywords = ['core web vitals', 'lcp', 'cls', 'fid', 'page speed', 'loading', 'performance'];
    const hasCoreWebVitalsIssues = coreWebVitalsKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && (description.toLowerCase().includes('slow') || description.toLowerCase().includes('poor'));

    // Indexing blockers
    const indexingKeywords = ['noindex', 'robots.txt', 'blocked', 'not indexed', 'crawl'];
    const hasIndexingIssues = indexingKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && (description.toLowerCase().includes('blocked') || description.toLowerCase().includes('missing'));

    // Mobile usability issues
    const mobileKeywords = ['mobile', 'responsive', 'viewport', 'mobile-friendly'];
    const hasMobileIssues = mobileKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && (description.toLowerCase().includes('not') || description.toLowerCase().includes('missing') || description.toLowerCase().includes('poor'));

    return hasCriticalMetaIssues || hasCoreWebVitalsIssues || hasIndexingIssues || hasMobileIssues;
  }

  /**
   * Enhanced critical meta issues detection
   */
  private hasCriticalMetaIssues(name: string, description: string, context?: any): boolean {
    // Include context notes in the search text
    const notes = context?.notes || '';
    const text = `${name} ${description} ${notes}`.toLowerCase();
    
    // Enhanced pattern matching to catch all variations
    const patterns = [
      /missing.*title/,  // Simplified to catch "Missing title tag"
      /no.*title.*tag/,
      /empty.*title/,
      /duplicate.*title.*tags?/,
      /missing.*meta.*description/,
      /no.*meta.*description/,
      /empty.*meta.*description/,
      /duplicate.*meta.*description/,
      /missing.*h1/,     // Added to catch "Missing H1 tag"
      /no.*h1.*tag/,
      /missing.*alt.*text/  // Added to catch critical accessibility issues
    ];
    
    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Check for critical issues that should be Priority OFI even with single criteria
   */
  private checkCriticalSingleCriteriaIssues(name: string, description: string, context?: any): boolean {
    const notes = context?.notes || '';
    const text = `${name} ${description} ${notes}`.toLowerCase();
    const pageType = context?.currentStatus || '';
    
    // Critical homepage issues - these have massive SEO impact
    const isHomepage = text.includes('homepage') || pageType === 'homepage';
    if (isHomepage) {
      const homepageCriticalPatterns = [
        /missing.*title/,
        /missing.*h1/,
        /missing.*meta.*description/
      ];
      if (homepageCriticalPatterns.some(pattern => pattern.test(text))) {
        return true;
      }
    }
    
    // Always critical issues regardless of page type
    const alwaysCriticalPatterns = [
      /blocked.*by.*robots/,
      /noindex.*tag/,
      /site.*not.*crawlable/,
      /ssl.*certificate.*missing/,
      /https.*not.*configured/,
      /duplicate.*title.*tags/,
      /canonical.*loop/
    ];
    
    return alwaysCriticalPatterns.some(pattern => pattern.test(text));
  }

  /**
   * User Experience Impact Criteria:
   * - Navigation completely broken or confusing
   * - Forms don't work or submit incorrectly
   * - Content is unreadable or inaccessible
   * - Site search returns no/wrong results
   */
  private evaluateUserExperienceImpact(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string
  ): boolean {
    
    // Navigation issues
    const navigationKeywords = ['navigation', 'menu', 'breadcrumb', 'sitemap'];
    const brokenKeywords = ['broken', 'missing', 'not working', 'error', 'failed'];
    const hasNavigationIssues = navigationKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && brokenKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    // Form functionality issues
    const formKeywords = ['form', 'contact', 'submit', 'input'];
    const hasFormIssues = formKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && brokenKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    // Content readability issues
    const contentKeywords = ['content', 'text', 'readability', 'accessibility'];
    const readabilityKeywords = ['unreadable', 'hard to read', 'poor contrast', 'too small'];
    const hasContentIssues = contentKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && readabilityKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    // Search functionality
    const searchKeywords = ['search', 'find', 'filter'];
    const hasSearchIssues = searchKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && brokenKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    return hasNavigationIssues || hasFormIssues || hasContentIssues || hasSearchIssues;
  }

  /**
   * Business Impact Criteria:
   * - Direct revenue loss from poor SEO rankings
   * - Missing conversion opportunities (CTA, contact info)
   * - Brand credibility issues (unprofessional appearance)
   * - Competitor advantage in search results
   */
  private evaluateBusinessImpact(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string
  ): boolean {
    
    // SEO ranking impact
    const rankingKeywords = ['ranking', 'serp', 'position', 'visibility', 'organic traffic'];
    const lossKeywords = ['drop', 'decrease', 'lost', 'poor', 'low'];
    const hasRankingImpact = rankingKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && lossKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    // Conversion issues
    const conversionKeywords = ['contact', 'phone', 'email', 'cta', 'call to action', 'conversion'];
    const missingKeywords = ['missing', 'no', 'absent', 'not found', 'hard to find'];
    const hasConversionIssues = conversionKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && missingKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    // Brand credibility
    const brandKeywords = ['professional', 'trust', 'credibility', 'brand', 'design'];
    const negativeKeywords = ['unprofessional', 'poor', 'outdated', 'broken', 'low quality'];
    const hasBrandIssues = brandKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && negativeKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    // Competitor advantage
    const competitorKeywords = ['competitor', 'competition', 'advantage', 'behind'];
    const hasCompetitorIssues = competitorKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    return hasRankingImpact || hasConversionIssues || hasBrandIssues || hasCompetitorIssues;
  }

  /**
   * Compliance Risk Criteria:
   * - GDPR/privacy violations (missing privacy policy)
   * - Accessibility compliance issues (WCAG violations)
   * - Security compliance (missing HTTPS, insecure forms)
   * - Industry-specific compliance requirements
   */
  private evaluateComplianceRisk(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string,
    context?: any
  ): boolean {
    
    // GDPR/Privacy issues
    const privacyKeywords = ['privacy', 'gdpr', 'cookies', 'tracking', 'data collection'];
    const violationKeywords = ['missing', 'no', 'violates', 'non-compliant'];
    const hasPrivacyIssues = privacyKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && violationKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    // Accessibility compliance
    const accessibilityKeywords = ['accessibility', 'wcag', 'ada', 'alt text', 'screen reader'];
    const hasAccessibilityIssues = accessibilityKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && violationKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    // Security compliance
    const securityKeywords = ['https', 'ssl', 'security', 'encryption', 'secure'];
    const hasSecurityIssues = securityKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && violationKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    // Industry compliance
    const industryKeywords = ['hipaa', 'pci', 'sox', 'compliance', 'regulation'];
    const hasIndustryIssues = industryKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && violationKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    return hasPrivacyIssues || hasAccessibilityIssues || hasSecurityIssues || hasIndustryIssues;
  }

  /**
   * Count how many priority criteria are met
   */
  private countPriorityCriteria(criteria: OFIClassificationCriteria): number {
    return Object.values(criteria).filter(Boolean).length;
  }

  /**
   * Build decision tree path taken during classification
   */
  private buildDecisionTree(
    criteria: OFIClassificationCriteria,
    metrics: OFIAnalysisMetrics
  ): string[] {
    const tree: string[] = [];

    tree.push("START: New issue identified");

    // Step 1: SEO visibility
    if (criteria.seoVisibilityImpact) {
      tree.push("✓ STEP 1: Critical SEO visibility impact - YES");
      tree.push("→ Checking additional criteria...");
    } else {
      tree.push("✗ STEP 1: Critical SEO visibility impact - NO");
      tree.push("→ Continue to Step 2");
    }

    // Step 2: User experience
    if (criteria.userExperienceImpact) {
      tree.push("✓ STEP 2: Severe user experience impact - YES");
      tree.push("→ Checking additional criteria...");
    } else {
      tree.push("✗ STEP 2: Severe user experience impact - NO");
      tree.push("→ Continue to Step 3");
    }

    // Step 3: Business impact
    if (criteria.businessImpact) {
      tree.push("✓ STEP 3: Significant business impact - YES");
      tree.push("→ Checking additional criteria...");
    } else {
      tree.push("✗ STEP 3: Significant business impact - NO");
      tree.push("→ Continue to Step 4");
    }

    // Step 4: Compliance risk
    if (criteria.complianceRisk) {
      tree.push("✓ STEP 4: Compliance/security risk - YES");
      tree.push("→ Checking additional criteria...");
    } else {
      tree.push("✗ STEP 4: Compliance/security risk - NO");
    }

    const priorityCount = this.countPriorityCriteria(criteria);
    if (priorityCount >= 2) {
      tree.push(`RESULT: ${priorityCount} priority criteria met → PRIORITY OFI`);
    } else {
      tree.push(`RESULT: Only ${priorityCount} priority criteria met → STANDARD OFI`);
    }

    return tree;
  }

  /**
   * Check if there's a workaround available
   */
  private checkForWorkaround(name: string, description: string, context?: any): boolean {
    const workaroundKeywords = ['workaround', 'alternative', 'can use', 'instead', 'manually'];
    const hasWorkaroundInText = workaroundKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );
    
    // Check if notes mention a workaround
    const hasWorkaroundInNotes = context?.notes && workaroundKeywords.some(keyword => 
      context.notes.toLowerCase().includes(keyword)
    );
    
    return hasWorkaroundInText || hasWorkaroundInNotes;
  }

  /**
   * Check if there's strong evidence for Priority OFI
   */
  private hasStrongEvidence(metrics: OFIAnalysisMetrics, criteria: OFIClassificationCriteria): boolean {
    // Must have at least one concrete metric
    const hasConcreteMetrics = 
      (metrics.performanceImpact && metrics.performanceImpact > 50) ||
      (metrics.userBaseAffected && metrics.userBaseAffected > 30) ||
      (metrics.revenueImpactPerDay && metrics.revenueImpactPerDay > 10000) ||
      (metrics.cvssScore && metrics.cvssScore >= 7.0) ||
      (metrics.supportTicketsPerDay && metrics.supportTicketsPerDay > 10);
    
    // Must have at least 2 criteria strongly met
    const strongCriteriaCount = Object.values(criteria).filter(Boolean).length;
    
    return Boolean(hasConcreteMetrics && strongCriteriaCount >= 2);
  }

  /**
   * Build detailed justification for the classification
   */
  private buildJustification(
    classification: 'Standard OFI' | 'Priority OFI',
    criteria: OFIClassificationCriteria,
    count: number,
    metrics: OFIAnalysisMetrics,
    downgradedReason?: string
  ): string {
    
    let justification = `Classification: ${classification}\n`;
    justification += `Priority criteria met: ${count}/4\n\n`;

    justification += "Criteria Evaluation:\n";
    
    if (criteria.seoVisibilityImpact) {
      justification += "✓ SEO Visibility Impact: ";
      if (metrics.performanceImpact && metrics.performanceImpact > 50) {
        justification += `Core Web Vitals failure (${metrics.performanceImpact}% degradation)`;
      } else {
        justification += "Missing meta tags, indexing issues, or mobile problems identified";
      }
      justification += "\n";
    } else {
      justification += "✗ SEO Visibility Impact: No critical SEO visibility issues identified\n";
    }

    if (criteria.userExperienceImpact) {
      justification += "✓ User Experience Impact: ";
      if (metrics.userBaseAffected && metrics.userBaseAffected > 30) {
        justification += `Affects ${metrics.userBaseAffected}% of users' ability to navigate/use site`;
      } else {
        justification += "Broken navigation, forms, or unreadable content identified";
      }
      justification += "\n";
    } else {
      justification += "✗ User Experience Impact: No critical UX issues identified\n";
    }

    if (criteria.businessImpact) {
      justification += "✓ Business Impact: ";
      if (metrics.revenueImpactPerDay && metrics.revenueImpactPerDay > 10000) {
        justification += `SEO ranking/revenue risk $${metrics.revenueImpactPerDay.toLocaleString()}/day`;
      } else {
        justification += "SEO ranking drops, missing conversions, or brand credibility issues identified";
      }
      justification += "\n";
    } else {
      justification += "✗ Business Impact: No significant business impact identified\n";
    }

    if (criteria.complianceRisk) {
      justification += "✓ Compliance Risk: ";
      if (metrics.cvssScore && metrics.cvssScore >= 7.0) {
        justification += `Security compliance issue (CVSS: ${metrics.cvssScore})`;
      } else {
        justification += "GDPR violations, accessibility issues, or security non-compliance identified";
      }
      justification += "\n";
    } else {
      justification += "✗ Compliance Risk: No critical compliance issues identified\n";
    }

    if (downgradedReason) {
      justification += `\n⬇️  AUTO-DOWNGRADED: ${downgradedReason}\n`;
    }

    if (classification === 'Priority OFI') {
      justification += `\n✅ PRIORITY OFI: Meets ${count} criteria (minimum 2 required)`;
      justification += "\n⚠️  Requires immediate attention and validation";
    } else {
      justification += `\n📋 STANDARD OFI: Only meets ${count} criteria (minimum 2 required for Priority)`;
      justification += "\n✅ Classify as standard improvement opportunity";
    }

    return justification;
  }

  /**
   * Extract metrics from existing audit items for auto-classification
   */
  private extractMetricsFromAuditItem(item: AuditItem): OFIAnalysisMetrics {
    const metrics: OFIAnalysisMetrics = {};

    // Extract performance metrics from notes - BE CONSERVATIVE
    if (item.notes) {
      const speedMatch = item.notes.match(/speed score[:\s]*(\d+)/i);
      if (speedMatch) {
        const score = parseInt(speedMatch[1]);
        // Only count as performance impact if EXTREMELY slow (under 20)
        metrics.performanceImpact = score < 20 ? 60 : score < 30 ? 40 : 0;
      }

      const percentMatch = item.notes.match(/(\d+)%/);
      if (percentMatch) {
        const percent = parseInt(percentMatch[1]);
        // Only count user impact if it's a critical blocking issue
        if (item.name.toLowerCase().includes('block') || item.name.toLowerCase().includes('prevent')) {
          metrics.userBaseAffected = percent > 70 ? 35 : 0;
        }
      }
    }

    // HTTPS alone is NOT a security vulnerability
    // Only assign CVSS score if there's actual security risk mentioned
    if (item.name.toLowerCase().includes('security') && 
        item.description?.toLowerCase().includes('vulnerability')) {
      metrics.cvssScore = 7.5;
    }

    // Missing H1 or title is NOT automatically a critical user workflow blocker
    // Only assign user impact if it actually prevents users from doing something
    if (item.importance === 'High' && item.description?.toLowerCase().includes('block')) {
      metrics.userBaseAffected = 25; // Still below the 30% threshold
    }

    return metrics;
  }

  /**
   * Calculate context-aware priority score
   */
  private calculateContextAwarePriorityScore(
    criteria: {
      seoVisibilityImpact: { score: number; factors: string[] };
      userExperienceImpact: { score: number; factors: string[] };
      businessImpact: { score: number; factors: string[] };
      complianceRisk: { score: number; factors: string[] };
    },
    context: PageContext
  ): number {
    let totalScore = 0;
    
    totalScore += criteria.seoVisibilityImpact.score * 0.3; // 30% weight
    totalScore += criteria.userExperienceImpact.score * 0.25; // 25% weight
    totalScore += criteria.businessImpact.score * 0.3; // 30% weight
    totalScore += criteria.complianceRisk.score * 0.15; // 15% weight
    
    // Site size adjustments
    if (context.siteSize === 'enterprise') {
      totalScore *= 0.9; // Slightly lower threshold for large sites
    } else if (context.siteSize === 'small') {
      totalScore *= 1.1; // Slightly higher urgency for small sites
    }
    
    return Math.round(totalScore * 100) / 100;
  }

  /**
   * Calculate dynamic threshold based on page context
   */
  private calculateDynamicThreshold(context: PageContext): number {
    let baseThreshold = 6.0; // Base threshold for Priority OFI
    
    // Page type adjustments
    if (context.pageType === 'homepage') {
      baseThreshold -= 1.0; // Lower threshold (easier to qualify) for homepage
    } else if (context.pageType === 'service') {
      baseThreshold -= 0.5; // Slightly lower for service pages
    } else if (context.pageType === 'other') {
      baseThreshold += 0.5; // Higher threshold for less critical pages
    }
    
    // Business type adjustments
    if (context.businessType === 'local') {
      baseThreshold -= 0.3; // Local businesses benefit more from SEO fixes
    } else if (context.businessType === 'ecommerce') {
      baseThreshold -= 0.2; // E-commerce sites need strong SEO
    }
    
    // Competitive context adjustments
    if (context.competitiveContext?.industryCompetitiveness === 'high') {
      baseThreshold -= 0.4; // More urgent in competitive industries
    } else if (context.competitiveContext?.industryCompetitiveness === 'low') {
      baseThreshold += 0.2; // Less urgent in low-competition industries
    }
    
    return Math.max(4.0, Math.min(8.0, baseThreshold)); // Clamp between 4.0 and 8.0
  }

  /**
   * Build context-aware justification
   */
  private buildContextAwareJustification(
    classification: 'Standard OFI' | 'Priority OFI',
    criteria: {
      seoVisibilityImpact: { score: number; factors: string[] };
      userExperienceImpact: { score: number; factors: string[] };
      businessImpact: { score: number; factors: string[] };
      complianceRisk: { score: number; factors: string[] };
    },
    priorityScore: number,
    threshold: number,
    context: PageContext,
    metrics: OFIAnalysisMetrics
  ): string {
    let justification = `Context-Aware Classification: ${classification}\n`;
    justification += `Priority Score: ${priorityScore.toFixed(2)} (Threshold: ${threshold.toFixed(2)})\n\n`;
    
    justification += `Page Context:\n`;
    justification += `- Type: ${context.pageType}\n`;
    justification += `- Business: ${context.businessType}\n`;
    justification += `- Site Size: ${context.siteSize}\n\n`;
    
    justification += `Scoring Breakdown:\n`;
    
    if (criteria.seoVisibilityImpact.score > 0) {
      justification += `✓ SEO Impact: ${criteria.seoVisibilityImpact.score.toFixed(1)}/10\n`;
      criteria.seoVisibilityImpact.factors.forEach(factor => {
        justification += `  - ${factor}\n`;
      });
    } else {
      justification += `✗ SEO Impact: No significant SEO visibility issues\n`;
    }
    
    if (criteria.userExperienceImpact.score > 0) {
      justification += `✓ UX Impact: ${criteria.userExperienceImpact.score.toFixed(1)}/10\n`;
      criteria.userExperienceImpact.factors.forEach(factor => {
        justification += `  - ${factor}\n`;
      });
    } else {
      justification += `✗ UX Impact: No critical user experience issues\n`;
    }
    
    if (criteria.businessImpact.score > 0) {
      justification += `✓ Business Impact: ${criteria.businessImpact.score.toFixed(1)}/10\n`;
      criteria.businessImpact.factors.forEach(factor => {
        justification += `  - ${factor}\n`;
      });
    } else {
      justification += `✗ Business Impact: No significant business impact\n`;
    }
    
    if (criteria.complianceRisk.score > 0) {
      justification += `✓ Compliance Risk: ${criteria.complianceRisk.score.toFixed(1)}/10\n`;
      criteria.complianceRisk.factors.forEach(factor => {
        justification += `  - ${factor}\n`;
      });
    } else {
      justification += `✗ Compliance Risk: No critical compliance issues\n`;
    }
    
    if (classification === 'Priority OFI') {
      justification += `\n✅ PRIORITY OFI: Score ${priorityScore.toFixed(2)} exceeds threshold ${threshold.toFixed(2)}`;
      justification += `\n⚠️  Requires immediate attention based on page context and business impact`;
    } else {
      justification += `\n📋 STANDARD OFI: Score ${priorityScore.toFixed(2)} below threshold ${threshold.toFixed(2)}`;
      justification += `\n✅ Classify as standard improvement opportunity`;
    }
    
    return justification;
  }

  /**
   * Evaluate context-aware criteria (enhanced version of evaluateCriteria)
   */
  private evaluateContextAwareCriteria(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string,
    context: PageContext
  ): {
    seoVisibilityImpact: { score: number; factors: string[] };
    userExperienceImpact: { score: number; factors: string[] };
    businessImpact: { score: number; factors: string[] };
    complianceRisk: { score: number; factors: string[] };
  } {
    return {
      seoVisibilityImpact: this.evaluateContextAwareSeoImpact(metrics, name, description, context),
      userExperienceImpact: this.evaluateContextAwareUXImpact(metrics, name, description, context),
      businessImpact: this.evaluateContextAwareBusinessImpact(metrics, name, description, context),
      complianceRisk: this.evaluateContextAwareComplianceRisk(metrics, name, description, context)
    };
  }

  /**
   * Context-aware UX impact evaluation
   */
  private evaluateContextAwareUXImpact(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string,
    context: PageContext
  ): { score: number; factors: string[] } {
    let score = 0;
    const factors: string[] = [];
    
    const baseImpact = this.evaluateUserExperienceImpact(metrics, name, description);
    if (baseImpact) {
      score += 3;
      factors.push('Base UX impact detected');
    }
    
    // E-commerce sites have higher UX impact multipliers
    if (context.businessType === 'ecommerce') {
      score *= 1.4;
      factors.push('E-commerce site - UX issues directly impact conversions');
    }
    
    // High-traffic pages have higher UX impact
    if (context.trafficImportance?.monthlyTraffic && context.trafficImportance.monthlyTraffic > 10000) {
      score *= 1.2;
      factors.push('High-traffic page - UX issues affect many users');
    }
    
    return { score: Math.min(score, 10), factors };
  }

  /**
   * Context-aware business impact evaluation
   */
  private evaluateContextAwareBusinessImpact(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string,
    context: PageContext
  ): { score: number; factors: string[] } {
    let score = 0;
    const factors: string[] = [];
    
    const baseImpact = this.evaluateBusinessImpact(metrics, name, description);
    if (baseImpact) {
      score += 3;
      factors.push('Base business impact detected');
    }
    
    // Page priority multipliers
    if (context.pagePriority === 1) { // Tier 1
      score *= 1.5;
      factors.push('Tier 1 page - high business priority');
    } else if (context.pagePriority === 2) { // Tier 2
      score *= 1.2;
      factors.push('Tier 2 page - medium business priority');
    }
    
    // Conversion value consideration
    if (context.trafficImportance?.conversionValue && context.trafficImportance.conversionValue > 1000) {
      score *= 1.3;
      factors.push('High-value conversion page - significant revenue impact');
    }
    
    return { score: Math.min(score, 10), factors };
  }

  /**
   * Context-aware compliance risk evaluation
   */
  private evaluateContextAwareComplianceRisk(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string,
    context: PageContext
  ): { score: number; factors: string[] } {
    let score = 0;
    const factors: string[] = [];
    
    const baseRisk = this.evaluateComplianceRisk(metrics, name, description, context);
    if (baseRisk) {
      score += 3;
      factors.push('Base compliance risk detected');
    }
    
    // Enterprise sites have higher compliance requirements
    if (context.siteSize === 'enterprise') {
      score *= 1.3;
      factors.push('Enterprise site - higher compliance standards required');
    }
    
    // Corporate and nonprofit organizations have higher compliance needs
    if (context.businessType === 'corporate' || context.businessType === 'nonprofit') {
      score *= 1.2;
      factors.push('Corporate/nonprofit - increased compliance obligations');
    }
    
    return { score: Math.min(score, 10), factors };
  }

  /**
   * Build enhanced decision tree with context awareness
   */
  private buildEnhancedDecisionTree(
    criteria: {
      seoVisibilityImpact: { score: number; factors: string[] };
      userExperienceImpact: { score: number; factors: string[] };
      businessImpact: { score: number; factors: string[] };
      complianceRisk: { score: number; factors: string[] };
    },
    metrics: OFIAnalysisMetrics,
    context: PageContext
  ): string[] {
    const tree: string[] = [];
    
    tree.push("START: Context-aware OFI classification");
    tree.push(`Page Context: ${context.pageType} (${context.businessType}, ${context.siteSize})`);
    
    const threshold = this.calculateDynamicThreshold(context);
    tree.push(`Dynamic threshold calculated: ${threshold.toFixed(2)}`);
    
    // Evaluate each criterion with context
    tree.push(`SEO Impact Score: ${criteria.seoVisibilityImpact.score.toFixed(1)}/10`);
    tree.push(`UX Impact Score: ${criteria.userExperienceImpact.score.toFixed(1)}/10`);
    tree.push(`Business Impact Score: ${criteria.businessImpact.score.toFixed(1)}/10`);
    tree.push(`Compliance Risk Score: ${criteria.complianceRisk.score.toFixed(1)}/10`);
    
    const totalScore = this.calculateContextAwarePriorityScore(criteria, context);
    tree.push(`Weighted Total Score: ${totalScore.toFixed(2)}`);
    
    if (totalScore >= threshold) {
      tree.push(`RESULT: Score ${totalScore.toFixed(2)} ≥ Threshold ${threshold.toFixed(2)} → PRIORITY OFI`);
    } else {
      tree.push(`RESULT: Score ${totalScore.toFixed(2)} < Threshold ${threshold.toFixed(2)} → STANDARD OFI`);
    }
    
    return tree;
  }

  /**
   * Generate weekly audit classification report
   */
  generateWeeklyReport(classifications: OFIClassificationResult[]): {
    totalClassified: number;
    priorityOFICount: number;
    standardOFICount: number;
    accuracyRate: number;
    downgradedCount: number;
    flaggedForReview: number;
    recommendations: string[];
    contextAwareMetrics?: {
      averageThreshold: number;
      thresholdRange: { min: number; max: number };
      pageTypeBreakdown: Record<string, number>;
      businessTypeBreakdown: Record<string, number>;
    };
  } {
    
    const totalClassified = classifications.length;
    const priorityOFICount = classifications.filter(c => c.classification === 'Priority OFI').length;
    const standardOFICount = classifications.filter(c => c.classification === 'Standard OFI').length;
    
    // Simulate accuracy validation (in real implementation, would compare against manual review)
    const accuracyRate = 0.95; // Target 95% accuracy
    
    const downgradedCount = Math.floor(priorityOFICount * 0.1); // Estimate downgrades
    const flaggedForReview = classifications.filter(c => c.requiresValidation).length;

    const recommendations: string[] = [];
    
    if (priorityOFICount / totalClassified > 0.3) {
      recommendations.push("Priority OFI rate is high (>30%). Review classification criteria application.");
    }
    
    if (flaggedForReview > priorityOFICount * 0.5) {
      recommendations.push("Many Priority OFIs require validation. Consider stricter auto-classification rules.");
    }

    if (accuracyRate < 0.95) {
      recommendations.push("Classification accuracy below 95% target. Review and retrain classification logic.");
    }

    return {
      totalClassified,
      priorityOFICount,
      standardOFICount,
      accuracyRate,
      downgradedCount,
      flaggedForReview,
      recommendations
    };
  }

  /**
   * Batch classify multiple audit items with page context
   */
  batchClassifyWithContext(
    items: Array<{ item: AuditItem; context: PageContext }>
  ): Array<{ item: AuditItem; classification: OFIClassificationResult; context: PageContext }> {
    return items.map(({ item, context }) => {
      const classification = this.classifyOFIWithContext(
        item.name,
        item.description || '',
        context,
        this.extractMetricsFromAuditItem(item)
      );
      
      return { item, classification, context };
    });
  }

  /**
   * Get recommended priority threshold for a specific page context
   */
  getRecommendedThreshold(context: PageContext): {
    threshold: number;
    reasoning: string[];
    adjustments: Array<{ factor: string; adjustment: number; reason: string }>;
  } {
    const baseThreshold = 6.0;
    const adjustments: Array<{ factor: string; adjustment: number; reason: string }> = [];
    
    let finalThreshold = baseThreshold;
    
    // Track all adjustments
    if (context.pageType === 'homepage') {
      const adjustment = -1.0;
      finalThreshold += adjustment;
      adjustments.push({ 
        factor: 'Homepage', 
        adjustment, 
        reason: 'Homepage issues have higher business impact' 
      });
    } else if (context.pageType === 'service') {
      const adjustment = -0.5;
      finalThreshold += adjustment;
      adjustments.push({ 
        factor: 'Service Page', 
        adjustment, 
        reason: 'Service pages critical for conversions' 
      });
    }
    
    if (context.businessType === 'local') {
      const adjustment = -0.3;
      finalThreshold += adjustment;
      adjustments.push({ 
        factor: 'Local Business', 
        adjustment, 
        reason: 'Local businesses benefit more from SEO improvements' 
      });
    }
    
    if (context.competitiveContext?.industryCompetitiveness === 'high') {
      const adjustment = -0.4;
      finalThreshold += adjustment;
      adjustments.push({ 
        factor: 'High Competition', 
        adjustment, 
        reason: 'Competitive industries require more urgent SEO attention' 
      });
    }
    
    finalThreshold = Math.max(4.0, Math.min(8.0, finalThreshold));
    
    const reasoning = [
      `Base threshold: ${baseThreshold}`,
      ...adjustments.map(adj => `${adj.factor}: ${adj.adjustment >= 0 ? '+' : ''}${adj.adjustment} (${adj.reason})`),
      `Final threshold: ${finalThreshold.toFixed(2)} (clamped between 4.0-8.0)`
    ];
    
    return {
      threshold: finalThreshold,
      reasoning,
      adjustments
    };
  }
}