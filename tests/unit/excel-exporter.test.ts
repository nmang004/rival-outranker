import { describe, it, expect } from 'vitest';
import { generateEnhancedRivalAuditExcel, generateRivalAuditExcel } from '../../server/services/common/excel-exporter.service';
import type { EnhancedRivalAudit, RivalAudit } from '../../shared/schema';

describe('Excel Exporter Service', () => {
  // Mock enhanced audit data
  const mockEnhancedAudit: EnhancedRivalAudit = {
    url: 'https://test-website.com',
    timestamp: new Date('2025-01-15'),
    onPage: {
      items: [
        {
          name: 'Page Title Optimization',
          description: 'Ensure page titles are optimized for target keywords',
          status: 'OK',
          importance: 'High',
          notes: 'Page titles are well optimized',
          category: 'On-Page SEO'
        },
        {
          name: 'Meta Description',
          description: 'Meta descriptions should be compelling and within character limits',
          status: 'Priority OFI',
          importance: 'High',
          notes: 'Meta descriptions are missing on several pages',
          category: 'On-Page SEO'
        }
      ]
    },
    structureNavigation: { items: [] },
    contactPage: { items: [] },
    servicePages: { items: [] },
    locationPages: { items: [] },
    contentQuality: {
      items: [
        {
          name: 'Content Readability Score',
          description: 'Content should be easily readable by target audience',
          status: 'OFI',
          importance: 'Medium',
          notes: 'Some content has readability issues',
          category: 'Content Quality',
          pageUrl: 'https://test-website.com/about',
          pageType: 'about'
        }
      ]
    },
    technicalSEO: {
      items: [
        {
          name: 'Site Speed Optimization',
          description: 'Page loading speed affects user experience and rankings',
          status: 'Priority OFI',
          importance: 'High',
          notes: 'Site loads slowly on mobile devices',
          category: 'Technical SEO'
        }
      ]
    },
    localSEO: {
      items: [
        {
          name: 'Google My Business Optimization',
          description: 'GMB profile should be complete and optimized',
          status: 'OK',
          importance: 'High',
          notes: 'GMB profile is well optimized',
          category: 'Local SEO'
        }
      ]
    },
    uxPerformance: {
      items: [
        {
          name: 'Mobile Responsiveness',
          description: 'Website should work well on all device sizes',
          status: 'OK',
          importance: 'High',
          notes: 'Site is fully responsive',
          category: 'UX & Performance'
        }
      ]
    },
    summary: {
      totalFactors: 150,
      priorityOfiCount: 2,
      ofiCount: 1,
      okCount: 3,
      naCount: 0,
      overallScore: 75,
      weightedOverallScore: 78
    },
    analysisMetadata: {
      analysisVersion: '3.0',
      factorCount: 150,
      crawlerStats: {
        pagesCrawled: 25
      },
      analysisTime: 45000
    }
  };

  // Mock legacy audit data
  const mockLegacyAudit: RivalAudit = {
    url: 'https://test-website.com',
    timestamp: new Date('2025-01-15'),
    onPage: {
      items: [
        {
          name: 'Page Title Optimization',
          description: 'Page titles should be optimized',
          status: 'OK',
          importance: 'High',
          notes: 'Page titles are good'
        },
        {
          name: 'Meta Description',
          description: 'Meta descriptions are important',
          status: 'Priority OFI',
          importance: 'High',
          notes: 'Missing meta descriptions'
        }
      ]
    },
    structureNavigation: { items: [] },
    contactPage: { items: [] },
    servicePages: { items: [] },
    locationPages: { items: [] },
    summary: {
      priorityOfiCount: 1,
      ofiCount: 0,
      okCount: 1,
      naCount: 0,
      total: 2
    }
  };

  describe('Enhanced Audit Excel Generation', () => {
    it('should generate Excel buffer for enhanced audit', async () => {
      const buffer = await generateEnhancedRivalAuditExcel(mockEnhancedAudit);
      
      expect(buffer).toBeDefined();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle audit with no critical issues', async () => {
      const auditWithNoCriticalIssues: EnhancedRivalAudit = {
        ...mockEnhancedAudit,
        summary: {
          ...mockEnhancedAudit.summary,
          priorityOfiCount: 0
        },
        contentQuality: {
          items: [
            {
              name: 'Content Quality Check',
              description: 'Content quality is good',
              status: 'OK',
              importance: 'Medium',
              notes: 'All content passes quality checks',
              category: 'Content Quality'
            }
          ]
        },
        technicalSEO: {
          items: [
            {
              name: 'Technical SEO Check',
              description: 'Technical SEO is optimized',
              status: 'OK',
              importance: 'High',
              notes: 'All technical aspects are optimized',
              category: 'Technical SEO'
            }
          ]
        }
      };

      const buffer = await generateEnhancedRivalAuditExcel(auditWithNoCriticalIssues);
      
      expect(buffer).toBeDefined();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle audit with page-level data', async () => {
      const auditWithPageData: EnhancedRivalAudit = {
        ...mockEnhancedAudit,
        contentQuality: {
          items: [
            {
              name: 'Page-Specific Content Issue',
              description: 'Content issue on specific page',
              status: 'Priority OFI',
              importance: 'High',
              notes: 'Page needs content optimization',
              category: 'Content Quality',
              pageUrl: 'https://test-website.com/services',
              pageType: 'service',
              pageTitle: 'Our Services'
            }
          ]
        }
      };

      const buffer = await generateEnhancedRivalAuditExcel(auditWithPageData);
      
      expect(buffer).toBeDefined();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('Legacy Audit Excel Generation', () => {
    it('should generate Excel buffer for legacy audit', async () => {
      const buffer = await generateRivalAuditExcel(mockLegacyAudit);
      
      expect(buffer).toBeDefined();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle legacy audit with service area pages', async () => {
      const auditWithServiceAreas: RivalAudit = {
        ...mockLegacyAudit,
        serviceAreaPages: {
          items: [
            {
              name: 'Service Area Coverage',
              description: 'Service area pages should cover target locations',
              status: 'OFI',
              importance: 'Medium',
              notes: 'Consider adding more service area pages'
            }
          ]
        }
      };

      const buffer = await generateRivalAuditExcel(auditWithServiceAreas);
      
      expect(buffer).toBeDefined();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('Excel Content Validation', () => {
    it('should handle special characters in URLs and content', async () => {
      const auditWithSpecialChars: EnhancedRivalAudit = {
        ...mockEnhancedAudit,
        url: 'https://test-café.com/résumé',
        contentQuality: {
          items: [
            {
              name: 'Special Characters Test',
              description: 'Testing special characters: café, résumé, naïve',
              status: 'OK',
              importance: 'Low',
              notes: 'Content with émojis: 🎯 and symbols: © ® ™',
              category: 'Content Quality'
            }
          ]
        }
      };

      const buffer = await generateEnhancedRivalAuditExcel(auditWithSpecialChars);
      
      expect(buffer).toBeDefined();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle very long descriptions and notes', async () => {
      const longText = 'This is a very long description that should test how the Excel exporter handles content that exceeds normal length limits. '.repeat(10);
      
      const auditWithLongContent: EnhancedRivalAudit = {
        ...mockEnhancedAudit,
        contentQuality: {
          items: [
            {
              name: 'Long Content Test',
              description: longText,
              status: 'OFI',
              importance: 'Medium',
              notes: longText,
              category: 'Content Quality'
            }
          ]
        }
      };

      const buffer = await generateEnhancedRivalAuditExcel(auditWithLongContent);
      
      expect(buffer).toBeDefined();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle audit with minimal data', async () => {
      const minimalAudit: EnhancedRivalAudit = {
        url: 'https://minimal.com',
        timestamp: new Date(),
        onPage: { items: [] },
        structureNavigation: { items: [] },
        contactPage: { items: [] },
        servicePages: { items: [] },
        locationPages: { items: [] },
        summary: {
          totalFactors: 0,
          priorityOfiCount: 0,
          ofiCount: 0,
          okCount: 0,
          naCount: 0
        }
      };

      const buffer = await generateEnhancedRivalAuditExcel(minimalAudit);
      
      expect(buffer).toBeDefined();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle audit without enhanced categories', async () => {
      const auditWithoutEnhanced: EnhancedRivalAudit = {
        ...mockEnhancedAudit,
        contentQuality: undefined,
        technicalSEO: undefined,
        localSEO: undefined,
        uxPerformance: undefined
      };

      const buffer = await generateEnhancedRivalAuditExcel(auditWithoutEnhanced);
      
      expect(buffer).toBeDefined();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});