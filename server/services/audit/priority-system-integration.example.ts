/**
 * Integration example demonstrating the new Phase 2 Priority System Overhaul
 * 
 * This example shows how to use the enhanced priority calculation system
 * with template issue detection and context-aware OFI classification.
 */

import { PagePriorityService, PagePriority } from './page-priority.service';
import { OFIClassificationService, PageContext } from './ofi-classification.service';
import { IssueGroupingService } from './issue-grouping.service';
import { enhancedAuditItemSchema } from '../../../shared/schema/rival-audit';

type EnhancedAuditItem = typeof enhancedAuditItemSchema._type;

/**
 * Example usage of the new priority system
 */
export class PrioritySystemIntegrationExample {
  private pagePriorityService: PagePriorityService;
  private ofiClassificationService: OFIClassificationService;
  private issueGroupingService: IssueGroupingService;

  constructor() {
    this.pagePriorityService = new PagePriorityService();
    this.ofiClassificationService = new OFIClassificationService();
    this.issueGroupingService = new IssueGroupingService();
  }

  /**
   * Demonstrate the new smart priority calculation system
   */
  async demonstrateSmartPriorityCalculation() {
    console.log('=== Phase 2 Priority System Overhaul Demo ===\n');

    // Sample audit items that would typically come from an enhanced audit
    const sampleAuditItems: EnhancedAuditItem[] = [
      {
        name: 'Missing Meta Title',
        description: 'Page is missing meta title tag',
        status: 'OFI',
        importance: 'High',
        category: 'Technical SEO',
        notes: 'Found on 15 service pages',
        pageUrl: 'https://example.com/services/hvac',
        pageType: 'service',
        pageTitle: 'HVAC Services'
      },
      {
        name: 'Missing Meta Title', 
        description: 'Page is missing meta title tag',
        status: 'OFI',
        importance: 'High',
        category: 'Technical SEO',
        notes: 'Found on homepage',
        pageUrl: 'https://example.com/',
        pageType: 'homepage',
        pageTitle: 'Home Page'
      },
      {
        name: 'Missing Alt Text',
        description: 'Image missing alt text attribute',
        status: 'OFI',
        importance: 'Medium',
        category: 'Content & UX',
        notes: 'Found on contact page',
        pageUrl: 'https://example.com/contact',
        pageType: 'contact',
        pageTitle: 'Contact Us'
      },
      {
        name: 'Slow Page Speed',
        description: 'Page load time exceeds 3 seconds',
        status: 'Priority OFI',
        importance: 'High',
        category: 'Technical SEO',
        notes: 'LCP: 4.2s, affects all pages',
        pageUrl: 'https://example.com/',
        pageType: 'homepage',
        pageTitle: 'Home Page'
      }
    ];

    // 1. Demonstrate Template Issue Detection
    console.log('1. TEMPLATE ISSUE DETECTION');
    console.log('============================');
    
    const issueGroups = this.issueGroupingService.groupSimilarIssues(sampleAuditItems as any);
    const groupingReport = this.issueGroupingService.generateGroupingReport(issueGroups);
    
    console.log(`Total Issue Groups: ${groupingReport.totalGroups}`);
    console.log(`Template Issues Identified: ${groupingReport.templateIssues}`);
    console.log(`Individual Issues: ${groupingReport.individualIssues}`);
    console.log(`Efficiency Gains: ${groupingReport.efficiencyGains.estimatedEffortReduction}`);
    
    console.log('\nTop Priority Groups:');
    groupingReport.topPriorityGroups.slice(0, 3).forEach((group, index) => {
      console.log(`  ${index + 1}. ${group.issueType}`);
      console.log(`     - Affects ${group.pages.length} pages`);
      console.log(`     - Template Issue: ${group.isTemplateIssue ? 'Yes' : 'No'}`);
      console.log(`     - Effort: ${group.effort}, Business Impact: ${group.businessImpact}`);
    });

    // 2. Demonstrate Smart Priority Calculation
    console.log('\n\n2. SMART PRIORITY CALCULATION');
    console.log('==============================');
    
    const smartPriorityResult = this.pagePriorityService.calculateSmartWeightedOFI(sampleAuditItems as any);
    
    console.log(`Traditional Linear OFI Score: ${smartPriorityResult.weightedOFI.toFixed(2)}`);
    console.log(`Smart Template-Adjusted Score: ${smartPriorityResult.templateAdjustedOFI.toFixed(2)}`);
    console.log(`Template Fixes Available: ${smartPriorityResult.efficiencyGains.templateFixesAvailable}`);
    console.log(`Effort Reduction: ${smartPriorityResult.efficiencyGains.estimatedEffortReduction}`);

    // 3. Demonstrate Context-Aware OFI Classification
    console.log('\n\n3. CONTEXT-AWARE OFI CLASSIFICATION');
    console.log('=====================================');
    
    const pageContext: PageContext = {
      pageType: 'homepage',
      pagePriority: PagePriority.TIER_1,
      siteSize: 'medium',
      businessType: 'local',
      competitiveContext: {
        industryCompetitiveness: 'high',
        currentRankingPosition: 8
      },
      trafficImportance: {
        monthlyTraffic: 5000,
        businessCriticality: 'high'
      }
    };

    const classificationResult = this.ofiClassificationService.classifyOFIWithContext(
      'Missing Meta Title',
      'Homepage is missing meta title tag, critical for SEO visibility',
      pageContext
    );

    console.log(`Classification: ${classificationResult.classification}`);
    console.log(`Requires Validation: ${classificationResult.requiresValidation}`);
    console.log('\nJustification:');
    console.log(classificationResult.justification);

    // 4. Demonstrate Context-Aware Priority Calculation
    console.log('\n\n4. CONTEXT-AWARE PRIORITIZATION');
    console.log('=================================');
    
    const siteContext = {
      totalPages: 25,
      siteType: 'medium' as const,
      businessType: 'local' as const
    };

    const contextAwareResult = this.pagePriorityService.calculateContextAwarePriority(
      sampleAuditItems as any, // Type compatibility - the method expects basic AuditItem but enhanced works
      siteContext
    );

    console.log('Prioritized Items (Top 3):');
    contextAwareResult.prioritizedItems.slice(0, 3).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} (Score: ${item.calculatedPriority.toFixed(2)})`);
      console.log(`     Reasoning: ${item.reasoning}`);
    });

    console.log('\nActionable Insights:');
    console.log(`- Template Issues Identified: ${contextAwareResult.insights.templateIssuesIdentified}`);
    console.log(`- Quick Wins Available: ${contextAwareResult.insights.quickWinsAvailable}`);
    console.log(`- High Impact, Low Effort Tasks: ${contextAwareResult.insights.highImpactLowEffortTasks}`);
    
    console.log('\nRecommended First Steps:');
    contextAwareResult.insights.recommendedFirstSteps.forEach(step => {
      console.log(`  - ${step}`);
    });

    // 5. Demonstrate Dynamic Threshold Calculation
    console.log('\n\n5. DYNAMIC THRESHOLD CALCULATION');
    console.log('==================================');
    
    const thresholdInfo = this.ofiClassificationService.getRecommendedThreshold(pageContext);
    
    console.log(`Recommended Threshold: ${thresholdInfo.threshold.toFixed(2)}`);
    console.log('Threshold Reasoning:');
    thresholdInfo.reasoning.forEach(reason => {
      console.log(`  - ${reason}`);
    });

    console.log('\n=== Demo Complete ===');
    console.log('\nKey Improvements in Phase 2:');
    console.log('✅ Template issues now get logarithmic scaling instead of linear accumulation');
    console.log('✅ Context-aware classification considers page type, business type, and competition');
    console.log('✅ Dynamic thresholds adjust based on site characteristics');
    console.log('✅ Effort estimation matrix provides realistic fix estimates');
    console.log('✅ Business impact assessment considers page importance and traffic value');
  }

  /**
   * Demonstrate the efficiency gains from template issue detection
   */
  demonstrateEfficiencyGains() {
    // Example showing how template detection reduces effort estimation
    const templateIssues = [
      { type: 'Missing Meta Title', pages: 15, effort: 'low', isTemplate: true },
      { type: 'Missing Alt Text', pages: 8, effort: 'medium', isTemplate: false },
      { type: 'Missing Schema', pages: 12, effort: 'medium', isTemplate: true }
    ];

    console.log('\nEFFICIENCY GAINS ANALYSIS');
    console.log('=========================');
    
    let traditionalEffort = 0;
    let smartEffort = 0;

    templateIssues.forEach(issue => {
      const effortScore = issue.effort === 'low' ? 1 : issue.effort === 'medium' ? 2 : 3;
      
      // Traditional approach: linear accumulation
      traditionalEffort += effortScore * issue.pages;
      
      // Smart approach: template-aware calculation
      if (issue.isTemplate) {
        smartEffort += effortScore; // Fix once for all pages
      } else {
        smartEffort += effortScore * issue.pages; // Still need individual fixes
      }
      
      console.log(`${issue.type}:`);
      console.log(`  - ${issue.pages} pages affected`);
      console.log(`  - Template fixable: ${issue.isTemplate ? 'Yes' : 'No'}`);
      console.log(`  - Traditional effort: ${effortScore * issue.pages} units`);
      console.log(`  - Smart effort: ${issue.isTemplate ? effortScore : effortScore * issue.pages} units`);
    });

    const effortReduction = Math.round(((traditionalEffort - smartEffort) / traditionalEffort) * 100);
    
    console.log(`\nTotal Traditional Effort: ${traditionalEffort} units`);
    console.log(`Total Smart Effort: ${smartEffort} units`);
    console.log(`Effort Reduction: ${effortReduction}% (${traditionalEffort - smartEffort} units saved)`);
  }
}

// Example usage (commented out to prevent execution during import)
/*
const example = new PrioritySystemIntegrationExample();
example.demonstrateSmartPriorityCalculation().then(() => {
  example.demonstrateEfficiencyGains();
});
*/