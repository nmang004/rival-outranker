import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { auditService, AuditService } from '../../server/services/audit/audit.service';
import { EnhancedRivalAudit } from '../../shared/schema';

// Mock HTML content with known SEO issues for testing
const MOCK_HTML_WITH_ISSUES = `
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Missing title tag -->
    <!-- Missing meta description -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <!-- Missing H1 tag -->
    <h2>Welcome to our website</h2>
    <p>This is a test page with several SEO issues for testing purposes.</p>
    
    <!-- Image without alt text -->
    <img src="/test-image.jpg">
    
    <p>Contact us for more information about our services.</p>
    
    <!-- Content without proper heading structure -->
    <h3>Our Services</h3>
    <p>We provide various services to help your business grow.</p>
    
    <h3>Contact Information</h3>
    <p>Phone: (555) 123-4567</p>
    <p>Email: info@example.com</p>
</body>
</html>
`;

// Mock HTML content with good SEO structure for comparison
const MOCK_HTML_GOOD_SEO = `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Professional Business Services | Your Company Name</title>
    <meta name="description" content="We provide professional business services to help your company grow. Contact us today for a consultation.">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <h1>Professional Business Services</h1>
    <p>Welcome to our professional services website.</p>
    
    <img src="/hero-image.jpg" alt="Professional team providing business services">
    
    <h2>Our Services</h2>
    <p>We provide various services to help your business grow.</p>
    
    <h3>Consulting</h3>
    <p>Expert business consulting services.</p>
    
    <h3>Implementation</h3>
    <p>Full implementation support for your projects.</p>
    
    <h2>Contact Information</h2>
    <p>Phone: (555) 123-4567</p>
    <p>Email: info@example.com</p>
</body>
</html>
`;

// Mock the Puppeteer response data
const mockPuppeteerResponse = {
  url: 'https://test-site.com',
  title: '',
  metaDescription: '',
  headingStructure: {
    h1: 0, // Missing H1
    h2: 1,
    h3: 2,
    h4: 0,
    h5: 0,
    h6: 0
  },
  images: [
    {
      src: '/test-image.jpg',
      alt: '', // Missing alt text
      hasAlt: false
    }
  ],
  links: [
    { href: '/about', text: 'About Us', isInternal: true },
    { href: '/contact', text: 'Contact', isInternal: true }
  ],
  content: 'Welcome to our website This is a test page with several SEO issues for testing purposes.',
  wordCount: 50,
  hasContactInfo: true,
  phoneNumbers: ['(555) 123-4567'],
  emailAddresses: ['info@example.com'],
  performanceMetrics: {
    loadTime: 2500,
    firstContentfulPaint: 1200,
    largestContentfulPaint: 2000,
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 100
  },
  technicalSEO: {
    hasRobotsTxt: false,
    hasSitemap: false,
    hasSSL: false, // Missing SSL
    isResponsive: true,
    hasStructuredData: false
  },
  socialMedia: {
    hasOpenGraph: false,
    hasTwitterCard: false,
    hasFacebookPixel: false
  },
  accessibility: {
    hasAltText: false,
    hasAriaLabels: false,
    hasSkipLinks: false,
    colorContrast: 'good'
  }
};

describe('End-to-End Audit Flow Integration Test', () => {
  let mockCrawler: any;
  let mockEnhancedAnalyzer: any;
  let originalCrawler: any;
  let originalEnhancedAnalyzer: any;

  beforeEach(() => {
    // Mock the crawler service
    mockCrawler = {
      reset: vi.fn(),
      crawlWebsite: vi.fn().mockResolvedValue({
        homepage: mockPuppeteerResponse,
        additionalPages: [
          {
            ...mockPuppeteerResponse,
            url: 'https://test-site.com/about',
            title: 'About Us',
            content: 'Learn more about our company and our mission.'
          },
          {
            ...mockPuppeteerResponse,
            url: 'https://test-site.com/contact',
            title: 'Contact Us',
            content: 'Get in touch with our team for any questions.'
          }
        ],
        siteStructure: {
          hasSitemapXml: false,
          reachedMaxPages: false
        },
        stats: {
          pagesCrawled: 3,
          pagesSkipped: 0,
          errorsEncountered: 0,
          crawlTime: 5000
        }
      }),
      getCrawlStats: vi.fn().mockReturnValue({
        pagesCrawled: 3,
        pagesSkipped: 0,
        errorsEncountered: 0,
        crawlTime: 5000
      })
    };

    // Store original services
    originalCrawler = (auditService as any).crawler;
    originalEnhancedAnalyzer = (auditService as any).enhancedAnalyzer;

    // Replace with mocks
    (auditService as any).crawler = mockCrawler;
  });

  afterEach(() => {
    // Restore original services
    (auditService as any).crawler = originalCrawler;
    (auditService as any).enhancedAnalyzer = originalEnhancedAnalyzer;
    vi.clearAllMocks();
  });

  describe('Main Audit Workflow', () => {
    it('should complete the full enhanced audit workflow', async () => {
      const testUrl = 'https://test-site.com';
      const progressUpdates: Array<{ stage: string; progress: number }> = [];

      // Mock progress callback to track workflow stages
      const progressCallback = (stage: string, progress: number) => {
        progressUpdates.push({ stage, progress });
      };

      // Execute the main audit workflow
      const result = await auditService.crawlAndAuditEnhanced(testUrl, progressCallback);

      // Verify the workflow completed successfully
      expect(result).toBeDefined();
      expect(result.url).toBe(testUrl);
      expect(result.timestamp).toBeInstanceOf(Date);

      // Verify progress tracking through all stages
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].stage).toBe('Initializing crawl');
      expect(progressUpdates[0].progress).toBe(0);
      
      const finalUpdate = progressUpdates[progressUpdates.length - 1];
      expect(finalUpdate.stage).toBe('Completed');
      expect(finalUpdate.progress).toBe(100);

      // Verify crawler was called correctly
      expect(mockCrawler.reset).toHaveBeenCalled();
      expect(mockCrawler.crawlWebsite).toHaveBeenCalledWith(testUrl);
    }, 15000); // Extended timeout for integration test

    it('should verify Puppeteer crawler was used for main page', async () => {
      const testUrl = 'https://test-site.com';

      const result = await auditService.crawlAndAuditEnhanced(testUrl);

      // Verify crawler was called with correct URL
      expect(mockCrawler.crawlWebsite).toHaveBeenCalledWith(testUrl);
      expect(mockCrawler.crawlWebsite).toHaveBeenCalledTimes(1);

      // Verify crawler reset was called to start fresh
      expect(mockCrawler.reset).toHaveBeenCalled();

      // Verify the result contains data from the mocked Puppeteer response
      expect(result).toBeDefined();
      expect(result.url).toBe(testUrl);
    });

    it('should identify and classify Priority OFI issues', async () => {
      const testUrl = 'https://test-site.com';

      const result = await auditService.crawlAndAuditEnhanced(testUrl);

      // Verify the audit result structure
      expect(result).toBeDefined();
      expect(result.contentQuality).toBeDefined();
      expect(result.technicalSEO).toBeDefined();
      expect(result.localSEO).toBeDefined();
      expect(result.uxPerformance).toBeDefined();

      // Check for Priority OFI issues in the results
      let foundPriorityOFI = false;
      let foundMissingH1 = false;
      let foundMissingMetaDescription = false;
      let foundSSLIssue = false;

      // Check all audit sections for Priority OFI classifications
      const allSections = [
        result.contentQuality,
        result.technicalSEO,
        result.localSEO,
        result.uxPerformance
      ];

      for (const section of allSections) {
        if (section?.items) {
          for (const item of section.items) {
            if (item.status === 'Priority OFI') {
              foundPriorityOFI = true;
              
              // Check for specific critical issues we expect
              if (item.name.toLowerCase().includes('h1') || item.name.toLowerCase().includes('heading')) {
                foundMissingH1 = true;
              }
              if (item.name.toLowerCase().includes('meta description')) {
                foundMissingMetaDescription = true;
              }
              if (item.name.toLowerCase().includes('ssl') || item.name.toLowerCase().includes('https')) {
                foundSSLIssue = true;
              }
            }
          }
        }
      }

      // Verify at least one Priority OFI was found
      expect(foundPriorityOFI).toBe(true);
      
      // We should find at least one of our critical issues (H1, meta description, or SSL)
      expect(foundMissingH1 || foundMissingMetaDescription || foundSSLIssue).toBe(true);
    });

    it('should calculate and include weighted overall score', async () => {
      const testUrl = 'https://test-site.com';

      const result = await auditService.crawlAndAuditEnhanced(testUrl);

      // Verify summary contains scoring information
      expect(result.summary).toBeDefined();
      expect(result.summary.overallScore).toBeDefined();
      expect(typeof result.summary.overallScore).toBe('number');
      expect(result.summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.summary.overallScore).toBeLessThanOrEqual(100);

      // Verify factor count is meaningful
      expect(result.summary.totalFactors).toBeDefined();
      expect(result.summary.totalFactors).toBeGreaterThan(0);

      // Verify analysis metadata is present
      expect(result.analysisMetadata).toBeDefined();
      expect(result.analysisMetadata.factorCount).toBe(result.summary.totalFactors);
      expect(result.analysisMetadata.analysisVersion).toBeDefined();
      expect(result.analysisMetadata.analysisTime).toBeDefined();
    });

    it('should handle site structure classification correctly', async () => {
      const testUrl = 'https://test-site.com';

      const result = await auditService.crawlAndAuditEnhanced(testUrl);

      // Verify the audit analyzed the site structure
      expect(result).toBeDefined();
      
      // Verify that pages were crawled and analyzed
      expect(result.analysisMetadata.crawlerStats).toBeDefined();
      expect(result.analysisMetadata.crawlerStats.pagesCrawled).toBeGreaterThan(0);

      // Verify sitemap information is captured
      expect(result.reachedMaxPages).toBeDefined();
      expect(typeof result.reachedMaxPages).toBe('boolean');
    });
  });

  describe('Audit Result Structure Validation', () => {
    it('should return properly structured EnhancedRivalAudit result', async () => {
      const testUrl = 'https://test-site.com';

      const result = await auditService.crawlAndAuditEnhanced(testUrl);

      // Verify top-level structure matches EnhancedRivalAudit schema
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('contentQuality');
      expect(result).toHaveProperty('technicalSEO');
      expect(result).toHaveProperty('localSEO');
      expect(result).toHaveProperty('uxPerformance');
      expect(result).toHaveProperty('analysisMetadata');
      expect(result).toHaveProperty('reachedMaxPages');

      // Verify summary structure
      expect(result.summary).toHaveProperty('overallScore');
      expect(result.summary).toHaveProperty('totalFactors');

      // Verify each audit section has the expected structure
      const sections = [result.contentQuality, result.technicalSEO, result.localSEO, result.uxPerformance];
      
      for (const section of sections) {
        if (section) {
          expect(section).toHaveProperty('items');
          expect(Array.isArray(section.items)).toBe(true);
          
          // If there are items, verify their structure
          if (section.items.length > 0) {
            const item = section.items[0];
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('description');
            expect(item).toHaveProperty('status');
            expect(item).toHaveProperty('importance');
            expect(item).toHaveProperty('notes');
            expect(item).toHaveProperty('category');
          }
        }
      }
    });

    it('should handle errors gracefully', async () => {
      const testUrl = 'https://invalid-url-that-should-fail.com';

      // Mock crawler to throw an error
      mockCrawler.crawlWebsite.mockRejectedValue(new Error('Network error'));

      // Verify error is properly thrown
      await expect(auditService.crawlAndAuditEnhanced(testUrl)).rejects.toThrow('Network error');
    });
  });

  describe('Progress Tracking and Reporting', () => {
    it('should provide meaningful progress updates throughout the workflow', async () => {
      const testUrl = 'https://test-site.com';
      const progressUpdates: Array<{ stage: string; progress: number }> = [];

      const progressCallback = (stage: string, progress: number) => {
        progressUpdates.push({ stage, progress });
      };

      await auditService.crawlAndAuditEnhanced(testUrl, progressCallback);

      // Verify we got multiple progress updates
      expect(progressUpdates.length).toBeGreaterThan(3);

      // Verify progress is sequential and logical
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i].progress).toBeGreaterThanOrEqual(progressUpdates[i - 1].progress);
      }

      // Verify we have expected stages
      const stages = progressUpdates.map(update => update.stage);
      expect(stages).toContain('Initializing crawl');
      expect(stages).toContain('Crawling website');
      expect(stages).toContain('Processing crawl data');
      expect(stages).toContain('Classifying pages');
      expect(stages).toContain('Analyzing SEO factors');
      expect(stages).toContain('Completed');
    });
  });

  describe('Data Quality and Consistency', () => {
    it('should produce consistent results for the same input', async () => {
      const testUrl = 'https://test-site.com';

      // Run the audit twice with the same input
      const result1 = await auditService.crawlAndAuditEnhanced(testUrl);
      const result2 = await auditService.crawlAndAuditEnhanced(testUrl);

      // Results should have consistent structure
      expect(result1.summary.totalFactors).toBe(result2.summary.totalFactors);
      expect(result1.url).toBe(result2.url);
      
      // Both should have analysis metadata
      expect(result1.analysisMetadata).toBeDefined();
      expect(result2.analysisMetadata).toBeDefined();
      
      // Both should have the same analysis version
      expect(result1.analysisMetadata.analysisVersion).toBe(result2.analysisMetadata.analysisVersion);
    });

    it('should handle large site structures appropriately', async () => {
      const testUrl = 'https://large-site.com';

      // Mock a larger site structure
      const largeAdditionalPages = Array.from({ length: 50 }, (_, i) => ({
        ...mockPuppeteerResponse,
        url: `https://large-site.com/page-${i + 1}`,
        title: `Page ${i + 1}`,
        content: `Content for page ${i + 1}`
      }));

      mockCrawler.crawlWebsite.mockResolvedValue({
        homepage: mockPuppeteerResponse,
        additionalPages: largeAdditionalPages,
        siteStructure: {
          hasSitemapXml: true,
          reachedMaxPages: true
        },
        stats: {
          pagesCrawled: 51,
          pagesSkipped: 10,
          errorsEncountered: 2,
          crawlTime: 15000
        }
      });

      const result = await auditService.crawlAndAuditEnhanced(testUrl);

      // Verify the audit handled the large site appropriately
      expect(result).toBeDefined();
      expect(result.reachedMaxPages).toBe(true);
      expect(result.analysisMetadata.crawlerStats.pagesCrawled).toBe(51);
      expect(result.analysisMetadata.crawlerStats.pagesSkipped).toBe(10);
    });
  });
});