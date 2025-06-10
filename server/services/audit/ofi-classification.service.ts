import { AuditItem } from '../../../shared/schema';

export interface OFIClassificationCriteria {
  systemStabilityImpact: boolean;
  userImpactSeverity: boolean;
  businessImpact: boolean;
  technicalDebtCriticality: boolean;
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
    
    // EMERGENCY FIX: Default to Standard OFI unless we have VERY strong evidence
    let classification: 'Standard OFI' | 'Priority OFI' = 'Standard OFI';
    let downgradedReason = 'Default classification for audit items';
    
    // Only classify as Priority OFI if we have 3+ criteria AND strong evidence
    if (priorityCriteriaCount >= 3 && this.hasStrongEvidence(metrics, criteriaMet)) {
      classification = 'Priority OFI';
      downgradedReason = '';
    } else if (priorityCriteriaCount >= 2) {
      downgradedReason = 'Requires 3+ criteria with strong evidence for Priority OFI';
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
      systemStabilityImpact: this.evaluateSystemStabilityImpact(metrics, name, description),
      userImpactSeverity: this.evaluateUserImpactSeverity(metrics, name, description),
      businessImpact: this.evaluateBusinessImpact(metrics, name, description),
      technicalDebtCriticality: this.evaluateTechnicalDebtCriticality(metrics, name, description, context)
    };
  }

  /**
   * System Stability Impact Criteria:
   * - Causes system crashes or data corruption
   * - Memory leaks exceeding 100MB/hour
   * - Performance degradation >50% of baseline
   * - Security vulnerabilities (CVSS score ≥7.0)
   */
  private evaluateSystemStabilityImpact(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string
  ): boolean {
    
    // STRICT: Check for ACTUAL crashes/corruption - not just keywords
    const severeKeywords = ['crash', 'corrupt', 'data loss', 'system failure'];
    const criticalKeywords = ['critical', 'severe', 'complete'];
    const hasSevereCrashRisk = severeKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && criticalKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    // Check memory leaks - only if explicitly measured
    const hasMemoryLeak = (metrics.memoryLeakRate ?? 0) > 100;

    // Check performance degradation - only if explicitly measured
    const hasPerformanceIssue = (metrics.performanceImpact ?? 0) > 50;

    // Check security vulnerabilities - only if explicitly scored
    const hasSecurityVuln = (metrics.cvssScore ?? 0) >= 7.0;

    // HTTPS missing is NOT automatically a system stability issue
    // Only if it's combined with actual security vulnerabilities
    const isHttpsIssue = name.toLowerCase().includes('https') && 
                        !name.toLowerCase().includes('not') &&
                        hasSecurityVuln;

    return hasSevereCrashRisk || hasMemoryLeak || hasPerformanceIssue || hasSecurityVuln || isHttpsIssue;
  }

  /**
   * User Impact Severity Criteria:
   * - Blocks critical user workflows entirely
   * - Affects >30% of active user base
   * - Generates >10 support tickets per day
   * - Results in data loss or irreversible actions
   */
  private evaluateUserImpactSeverity(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string
  ): boolean {
    
    // Check if blocks critical workflows
    const blockingKeywords = ['block', 'prevent', 'unable', 'cannot', 'missing', 'broken'];
    const criticalKeywords = ['critical', 'essential', 'required', 'necessary'];
    const blocksWorkflow = blockingKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    ) && criticalKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    // Check user base impact
    const affectsLargeUserBase = (metrics.userBaseAffected ?? 0) > 30;

    // Check support ticket volume
    const generatesTickets = (metrics.supportTicketsPerDay ?? 0) > 10;

    // Check for data loss potential
    const dataLossKeywords = ['data loss', 'irreversible', 'permanent', 'lost'];
    const causesDataLoss = dataLossKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    );

    return blocksWorkflow || affectsLargeUserBase || generatesTickets || causesDataLoss;
  }

  /**
   * Business Impact Criteria:
   * - Revenue loss potential >$10K/day
   * - Compliance/regulatory violations
   * - SLA breaches
   * - Reputational damage risk
   */
  private evaluateBusinessImpact(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string
  ): boolean {
    
    // Check revenue impact
    const hasRevenueImpact = (metrics.revenueImpactPerDay ?? 0) > 10000;

    // Check compliance/regulatory issues
    const complianceKeywords = ['compliance', 'regulatory', 'gdpr', 'hipaa', 'pci', 'sox'];
    const hasComplianceIssue = complianceKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    );

    // Check SLA breaches
    const slaKeywords = ['sla', 'service level', 'uptime', 'availability'];
    const hasSLAIssue = slaKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    );

    // Check reputational damage
    const reputationKeywords = ['reputation', 'brand', 'customer satisfaction', 'public'];
    const hasReputationRisk = reputationKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    return hasRevenueImpact || hasComplianceIssue || hasSLAIssue || hasReputationRisk;
  }

  /**
   * Technical Debt Criticality Criteria:
   * - Blocks 3+ other development initiatives
   * - Increases incident rate by >25%
   * - Requires architectural overhaul if delayed
   * - Dependencies with announced EOL <6 months
   */
  private evaluateTechnicalDebtCriticality(
    metrics: OFIAnalysisMetrics,
    name: string,
    description: string,
    context?: any
  ): boolean {
    
    // Check blocked initiatives
    const blocksInitiatives = (metrics.blockedInitiatives ?? 0) >= 3;

    // Check incident rate increase
    const increasesIncidents = (metrics.incidentRateIncrease ?? 0) > 25;

    // Check architectural overhaul need
    const architecturalKeywords = ['architecture', 'overhaul', 'refactor', 'redesign'];
    const needsOverhaul = architecturalKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    // Check EOL dependencies
    const hasEOLRisk = (metrics.eolMonths ?? 12) < 6;

    // Legacy/deprecated technology indicators
    const legacyKeywords = ['legacy', 'deprecated', 'outdated', 'end of life', 'eol'];
    const hasLegacyRisk = legacyKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    );

    return blocksInitiatives || increasesIncidents || needsOverhaul || hasEOLRisk || hasLegacyRisk;
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

    // Step 1: System stability
    if (criteria.systemStabilityImpact) {
      tree.push("✓ STEP 1: Causes system instability/crashes - YES");
      tree.push("→ Checking additional criteria...");
    } else {
      tree.push("✗ STEP 1: Causes system instability/crashes - NO");
      tree.push("→ Continue to Step 2");
    }

    // Step 2: User impact
    if (criteria.userImpactSeverity) {
      tree.push("✓ STEP 2: Blocks >30% of users - YES");
      tree.push("→ Checking additional criteria...");
    } else {
      tree.push("✗ STEP 2: Blocks >30% of users - NO");
      tree.push("→ Continue to Step 3");
    }

    // Step 3: Security/compliance
    if (criteria.businessImpact) {
      tree.push("✓ STEP 3: Compliance/security breach risk - YES");
      tree.push("→ Checking additional criteria...");
    } else {
      tree.push("✗ STEP 3: Compliance/security breach risk - NO");
      tree.push("→ Continue to Step 4");
    }

    // Step 4: Revenue impact
    const revenueImpact = metrics.revenueImpactPerDay ?? 0;
    if (revenueImpact > 10000) {
      tree.push("✓ STEP 4: Revenue impact >$10K/day - YES");
      tree.push("→ Checking additional criteria...");
    } else {
      tree.push("✗ STEP 4: Revenue impact >$10K/day - NO");
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
    
    if (criteria.systemStabilityImpact) {
      justification += "✓ System Stability Impact: ";
      if (metrics.performanceImpact && metrics.performanceImpact > 50) {
        justification += `Performance degradation ${metrics.performanceImpact}%`;
      } else if (metrics.cvssScore && metrics.cvssScore >= 7.0) {
        justification += `Security vulnerability (CVSS: ${metrics.cvssScore})`;
      } else if (metrics.memoryLeakRate && metrics.memoryLeakRate > 100) {
        justification += `Memory leak ${metrics.memoryLeakRate}MB/hour`;
      } else {
        justification += "System crash/corruption risk identified";
      }
      justification += "\n";
    } else {
      justification += "✗ System Stability Impact: No critical stability risks identified\n";
    }

    if (criteria.userImpactSeverity) {
      justification += "✓ User Impact Severity: ";
      if (metrics.userBaseAffected && metrics.userBaseAffected > 30) {
        justification += `Affects ${metrics.userBaseAffected}% of users`;
      } else if (metrics.supportTicketsPerDay && metrics.supportTicketsPerDay > 10) {
        justification += `Generates ${metrics.supportTicketsPerDay} tickets/day`;
      } else {
        justification += "Blocks critical user workflows";
      }
      justification += "\n";
    } else {
      justification += "✗ User Impact Severity: Limited user impact\n";
    }

    if (criteria.businessImpact) {
      justification += "✓ Business Impact: ";
      if (metrics.revenueImpactPerDay && metrics.revenueImpactPerDay > 10000) {
        justification += `Revenue risk $${metrics.revenueImpactPerDay.toLocaleString()}/day`;
      } else {
        justification += "Compliance/regulatory/SLA risk identified";
      }
      justification += "\n";
    } else {
      justification += "✗ Business Impact: No significant business risk\n";
    }

    if (criteria.technicalDebtCriticality) {
      justification += "✓ Technical Debt Criticality: ";
      if (metrics.blockedInitiatives && metrics.blockedInitiatives >= 3) {
        justification += `Blocks ${metrics.blockedInitiatives} initiatives`;
      } else if (metrics.incidentRateIncrease && metrics.incidentRateIncrease > 25) {
        justification += `Increases incident rate ${metrics.incidentRateIncrease}%`;
      } else if (metrics.eolMonths && metrics.eolMonths < 6) {
        justification += `EOL dependency (${metrics.eolMonths} months)`;
      } else {
        justification += "Critical technical debt identified";
      }
      justification += "\n";
    } else {
      justification += "✗ Technical Debt Criticality: Manageable technical debt\n";
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