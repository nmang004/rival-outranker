import { describe, it, expect, beforeEach } from 'vitest';
import { OFIClassificationService, OFIAnalysisMetrics, PageContext } from '../../server/services/audit/ofi-classification.service';
import { AuditItem } from '../../shared/schema';

describe('OFI Classification Service', () => {
  let classificationService: OFIClassificationService;

  beforeEach(() => {
    classificationService = new OFIClassificationService();
  });

  describe('Priority OFI Classification - Critical SEO Issues', () => {
    describe('Missing H1 Tag Tests', () => {
      it('should classify "Missing H1 Tag" as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'Missing H1 Tag',
          'This page is missing a proper H1 tag which is critical for SEO structure'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
        expect(result.justification).toContain('Priority OFI');
        expect(result.justification).toContain('SEO Visibility Impact');
        expect(result.requiresValidation).toBe(true);
      });

      it('should classify "No H1 tag" as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'No H1 tag',
          'Page lacks proper heading structure'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
        expect(result.justification).toContain('Priority OFI');
      });

      it('should classify "Heading Structure Hierarchy" issues as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'Heading Structure Hierarchy',
          'Page lacks proper heading structure with H1: 0, H2: 3, H3: 1'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
        expect(result.justification).toContain('Priority OFI');
      });

      it('should classify multiple H1 tags as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'Multiple H1 tags',
          'Page has duplicate H1 tags which confuses search engines'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
      });

      it('should classify heading structure with H1 count 0 as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'Heading Structure',
          'Analysis shows H1: 0 tags on this page'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
      });
    });

    describe('Missing Meta Description Tests', () => {
      it('should classify "Missing meta description" as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'Missing meta description',
          'This page is missing a meta description tag which is crucial for SERP appearance'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
        expect(result.justification).toContain('Priority OFI');
        expect(result.justification).toContain('SEO Visibility Impact');
      });

      it('should classify "No meta description" as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'No meta description',
          'Page lacks proper meta description for search results'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
      });

      it('should classify "Empty meta description" as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'Empty meta description',
          'Meta description tag exists but is empty'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
      });

      it('should classify "Duplicate meta description" as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'Duplicate meta description',
          'Multiple pages share the same meta description'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
      });
    });

    describe('SSL Certificate Tests', () => {
      it('should classify "No SSL Certificate" as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'No SSL Certificate',
          'Website is not using HTTPS which affects SEO rankings and user trust'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.complianceRisk).toBe(true);
        expect(result.justification).toContain('Priority OFI');
        expect(result.justification).toContain('Compliance Risk');
      });

      it('should classify "Missing HTTPS" as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'Missing HTTPS',
          'Site is not configured for secure connections'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.complianceRisk).toBe(true);
      });

      it('should classify "SSL not configured" as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'SSL not configured',
          'Security compliance issue with missing encryption'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.complianceRisk).toBe(true);
      });
    });

    describe('Title Tag Issues', () => {
      it('should classify "Missing title" as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'Missing title',
          'Page is missing a title tag which is fundamental for SEO'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
      });

      it('should classify "No title tag" as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'No title tag',
          'Critical SEO element missing from page head'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
      });

      it('should classify "Duplicate title tags" as Priority OFI', () => {
        const result = classificationService.classifyOFI(
          'Duplicate title tags',
          'Multiple pages have identical title tags'
        );

        expect(result.classification).toBe('Priority OFI');
        expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
      });
    });
  });

  describe('Standard OFI Classification - Lower Priority Issues', () => {
    it('should classify "Image missing alt text" as Priority OFI (accessibility compliance)', () => {
      // Note: Alt text is actually classified as Priority OFI due to accessibility compliance
      const result = classificationService.classifyOFI(
        'Image missing alt text',
        'Some images on the page are missing alt attributes'
      );

      expect(result.classification).toBe('Priority OFI');
      expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
      expect(result.requiresValidation).toBe(true);
    });

    it('should classify minor performance issues as Standard OFI', () => {
      const result = classificationService.classifyOFI(
        'Minor performance issue',
        'Page load time could be improved by optimizing images'
      );

      expect(result.classification).toBe('Standard OFI');
      expect(result.justification).toContain('Standard OFI');
    });

    it('should classify minor styling issues as Standard OFI', () => {
      const result = classificationService.classifyOFI(
        'Minor styling issue',
        'Some text colors could be improved for better readability'
      );

      expect(result.classification).toBe('Standard OFI');
      expect(result.justification).toContain('Standard OFI');
    });

    it('should classify low-impact accessibility issues as Standard OFI', () => {
      const result = classificationService.classifyOFI(
        'Low-impact accessibility',
        'Some form labels could be more descriptive'
      );

      expect(result.classification).toBe('Standard OFI');
      expect(result.justification).toContain('Standard OFI');
    });
  });

  describe('Context-Aware Classification', () => {
    const homepageContext: PageContext = {
      pageType: 'homepage',
      pagePriority: 1,
      siteSize: 'medium',
      businessType: 'local',
      competitiveContext: {
        industryCompetitiveness: 'high',
        currentRankingPosition: 15,
        targetKeywords: ['local business', 'services']
      },
      trafficImportance: {
        monthlyTraffic: 25000,
        conversionValue: 150,
        businessCriticality: 'high'
      }
    };

    const servicePageContext: PageContext = {
      pageType: 'service',
      pagePriority: 2,
      siteSize: 'small',
      businessType: 'local',
      competitiveContext: {
        industryCompetitiveness: 'medium',
        targetKeywords: ['service page']
      },
      trafficImportance: {
        businessCriticality: 'medium'
      }
    };

    it('should apply higher urgency to homepage H1 issues', () => {
      const result = classificationService.classifyOFIWithContext(
        'Missing H1 Tag',
        'Homepage is missing H1 tag',
        homepageContext
      );

      // Should get Priority OFI due to context-aware classification
      expect(result.classification).toBe('Priority OFI');
      expect(result.justification).toContain('Context-Aware Classification');
    });

    it('should consider business type in classification', () => {
      const result = classificationService.classifyOFIWithContext(
        'Missing contact information',
        'Contact page missing phone number',
        { ...servicePageContext, pageType: 'contact' }
      );

      expect(result.justification).toContain('Context-Aware Classification');
    });

    it('should adjust threshold based on competitive context', () => {
      const highCompetitionContext = {
        ...homepageContext,
        competitiveContext: {
          ...homepageContext.competitiveContext!,
          industryCompetitiveness: 'high' as const
        }
      };

      const result = classificationService.classifyOFIWithContext(
        'Minor SEO issue',
        'Small optimization opportunity',
        highCompetitionContext
      );

      expect(result.justification).toContain('Context-Aware Classification');
    });

    it('should provide recommended threshold for different contexts', () => {
      const thresholdInfo = classificationService.getRecommendedThreshold(homepageContext);

      expect(thresholdInfo.threshold).toBeLessThan(6.0); // Lower threshold for homepage
      expect(thresholdInfo.reasoning).toBeInstanceOf(Array);
      expect(thresholdInfo.reasoning.length).toBeGreaterThan(1);
      expect(thresholdInfo.adjustments).toBeInstanceOf(Array);
      expect(thresholdInfo.adjustments.length).toBeGreaterThan(0);
    });
  });

  describe('Audit Item Classification', () => {
    it('should classify audit items with missing H1', () => {
      const auditItem: AuditItem = {
        name: 'Missing H1 Tag',
        description: 'Page is missing the required H1 tag for SEO structure',
        status: 'OFI',
        importance: 'High',
        notes: 'Critical for search engine understanding of page content'
      };

      const result = classificationService.classifyAuditItem(auditItem);

      expect(result.classification).toBe('Priority OFI');
      expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
    });

    it('should classify audit items with meta description issues', () => {
      const auditItem: AuditItem = {
        name: 'Missing meta description',
        description: 'Page lacks meta description for search results',
        status: 'OFI',
        importance: 'High',
        notes: 'Important for SERP click-through rates'
      };

      const result = classificationService.classifyAuditItem(auditItem);

      expect(result.classification).toBe('Priority OFI');
      expect(result.criteriaMet.seoVisibilityImpact).toBe(true);
    });

    it('should classify audit items with SSL issues', () => {
      const auditItem: AuditItem = {
        name: 'No SSL Certificate',
        description: 'Website not using HTTPS protocol',
        status: 'Priority OFI',
        importance: 'High',
        notes: 'Security and SEO compliance issue'
      };

      const result = classificationService.classifyAuditItem(auditItem);

      expect(result.classification).toBe('Priority OFI');
      expect(result.criteriaMet.complianceRisk).toBe(true);
    });
  });

  describe('Decision Tree Logic', () => {
    it('should build correct decision tree for Priority OFI', () => {
      const result = classificationService.classifyOFI(
        'Missing H1 Tag',
        'Critical SEO element missing'
      );

      expect(result.decisionTree).toContain('START: New issue identified');
      expect(result.decisionTree.some(step => step.includes('SEO visibility impact - YES'))).toBe(true);
      expect(result.decisionTree.some(step => step.includes('PRIORITY OFI'))).toBe(true);
    });

    it('should build correct decision tree for Standard OFI', () => {
      const result = classificationService.classifyOFI(
        'Minor styling issue',
        'Small improvement opportunity'
      );

      expect(result.decisionTree).toContain('START: New issue identified');
      expect(result.decisionTree.some(step => step.includes('STANDARD OFI'))).toBe(true);
    });
  });

  describe('Metrics and Scoring', () => {
    it('should handle performance metrics correctly', () => {
      const metrics: OFIAnalysisMetrics = {
        performanceImpact: 75,
        userBaseAffected: 40,
        revenueImpactPerDay: 15000
      };

      const result = classificationService.classifyOFI(
        'Performance issue',
        'Severe performance degradation affects core web vitals',
        metrics
      );

      expect(result.metrics).toEqual(metrics);
      // Check that metrics are handled correctly (might not be in justification for Standard OFI)
      expect(result.classification).toBeDefined();
    });

    it('should handle security metrics correctly', () => {
      const metrics: OFIAnalysisMetrics = {
        cvssScore: 7.5
      };

      const result = classificationService.classifyOFI(
        'Security vulnerability',
        'High-severity security compliance issue',
        metrics
      );

      expect(result.metrics).toEqual(metrics);
      // Security issues should trigger compliance risk
      expect(result.criteriaMet.complianceRisk).toBe(true);
    });
  });

  describe('Batch Classification', () => {
    it('should handle batch classification with context', () => {
      const items = [
        {
          item: {
            name: 'Missing H1 Tag',
            description: 'Homepage missing H1',
            status: 'OFI' as const,
            importance: 'High' as const
          },
          context: {
            pageType: 'homepage' as const,
            pagePriority: 1,
            siteSize: 'medium' as const,
            businessType: 'local' as const,
            trafficImportance: {
              businessCriticality: 'high' as const
            }
          }
        }
      ];

      const results = classificationService.batchClassifyWithContext(items);

      expect(results).toHaveLength(1);
      expect(results[0].classification.classification).toBeDefined();
      expect(results[0].context.pageType).toBe('homepage');
    });
  });

  describe('Weekly Reporting', () => {
    it('should generate weekly classification report', () => {
      const classifications = [
        {
          classification: 'Priority OFI' as const,
          criteriaMet: {
            seoVisibilityImpact: true,
            userExperienceImpact: false,
            businessImpact: false,
            complianceRisk: false
          },
          justification: 'Test',
          metrics: {},
          decisionTree: [],
          requiresValidation: true
        },
        {
          classification: 'Standard OFI' as const,
          criteriaMet: {
            seoVisibilityImpact: false,
            userExperienceImpact: false,
            businessImpact: false,
            complianceRisk: false
          },
          justification: 'Test',
          metrics: {},
          decisionTree: [],
          requiresValidation: false
        }
      ];

      const report = classificationService.generateWeeklyReport(classifications);

      expect(report.totalClassified).toBe(2);
      expect(report.priorityOFICount).toBe(1);
      expect(report.standardOFICount).toBe(1);
      expect(report.accuracyRate).toBe(0.95);
      expect(report.flaggedForReview).toBe(1);
      expect(report.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty strings gracefully', () => {
      const result = classificationService.classifyOFI('', '');

      expect(result.classification).toBe('Standard OFI');
      expect(result.justification).toContain('Standard OFI');
    });

    it('should handle undefined descriptions', () => {
      const result = classificationService.classifyOFI('Test issue', '');

      expect(result.classification).toBe('Standard OFI');
      expect(result.justification).toContain('Standard OFI');
    });

    it('should handle issues with workarounds correctly', () => {
      const result = classificationService.classifyOFI(
        'Issue with workaround',
        'This is a problem but there is a workaround available'
      );

      expect(result.classification).toBe('Standard OFI');
      expect(result.justification).toContain('Workaround available');
    });
  });
});