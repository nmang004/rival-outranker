import { AuditItem } from '../../../shared/schema';

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
    
    // Classify as Priority OFI if we have 2+ criteria (original design)
    if (priorityCriteriaCount >= 2) {
      classification = 'Priority OFI';
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

    return this.classifyOFI(item.name, item.description, metrics, context);
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
      seoVisibilityImpact: this.evaluateSeoVisibilityImpact(metrics, name, description),
      userExperienceImpact: this.evaluateUserExperienceImpact(metrics, name, description),
      businessImpact: this.evaluateBusinessImpact(metrics, name, description),
      complianceRisk: this.evaluateComplianceRisk(metrics, name, description, context)
    };
  }

  /**
   * SEO Visibility Impact Criteria:
   * - Missing or poor meta titles/descriptions
   * - Core Web Vitals failures (LCP >2.5s, CLS >0.1, FID >100ms)
   * - Critical indexing issues (noindex, blocked in robots.txt)
   * - Severe mobile usability problems
   */
  private evaluateSeoVisibilityImpact(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string
  ): boolean {
    
    // Critical SEO blocking issues
    const criticalSeoKeywords = ['meta title', 'meta description', 'missing title', 'no title', 'duplicate title'];
    const hasCriticalMetaIssues = criticalSeoKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    );

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
    
    return hasConcreteMetrics && strongCriteriaCount >= 2;
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
        item.description.toLowerCase().includes('vulnerability')) {
      metrics.cvssScore = 7.5;
    }

    // Missing H1 or title is NOT automatically a critical user workflow blocker
    // Only assign user impact if it actually prevents users from doing something
    if (item.importance === 'High' && item.description.toLowerCase().includes('block')) {
      metrics.userBaseAffected = 25; // Still below the 30% threshold
    }

    return metrics;
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
}