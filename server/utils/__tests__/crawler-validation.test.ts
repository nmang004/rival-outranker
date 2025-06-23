/**
 * Unit tests for crawler validation utilities
 * Tests the data flow between CrawlerOutput and PageCrawlResult
 */

import { 
  validateCrawlerOutput, 
  validatePageCrawlResult,
  safeValidateCrawlerOutput,
  safeValidatePageCrawlResult
} from '../crawler-validation';

describe('Crawler Validation', () => {
  describe('validateCrawlerOutput', () => {
    it('should validate a properly formatted CrawlerOutput', () => {
      const validCrawlerOutput = {
        url: 'https://example.com',
        title: 'Example Page',
        statusCode: 200,
        meta: {
          description: 'A test page',
          ogTags: { title: 'Example' },
          twitterTags: { card: 'summary' }
        },
        content: {
          text: 'This is example content',
          wordCount: 4,
          paragraphs: ['This is example content']
        },
        headings: {
          h1: ['Main Title'],
          h2: ['Subtitle'],
          h3: [],
          h4: [],
          h5: [],
          h6: []
        },
        links: {
          internal: ['https://example.com/page1'],
          external: ['https://external.com']
        },
        images: [
          { src: 'https://example.com/image.jpg', alt: 'Test image' }
        ],
        schema: [
          { type: 'WebPage', json: '{"@type": "WebPage"}' }
        ],
        mobileCompatible: true,
        performance: {
          loadTime: 1500,
          resourceCount: 10,
          resourceSize: 50000
        },
        html: '<html><head><title>Example</title></head><body>Content</body></html>',
        rawHtml: '<html><head><title>Example</title></head><body>Content</body></html>'
      };

      expect(() => validateCrawlerOutput(validCrawlerOutput)).not.toThrow();
    });

    it('should reject invalid CrawlerOutput data', () => {
      const invalidCrawlerOutput = {
        url: 'not-a-url',
        title: null, // Should be string
        statusCode: 'error' // Should be number
      };

      expect(() => validateCrawlerOutput(invalidCrawlerOutput)).toThrow();
    });
  });

  describe('validatePageCrawlResult', () => {
    it('should validate a properly formatted PageCrawlResult', () => {
      const validPageCrawlResult = {
        url: 'https://example.com',
        title: 'Example Page',
        metaDescription: 'A test page',
        bodyText: 'This is example content',
        rawHtml: '<html><body>Content</body></html>',
        h1s: ['Main Title'],
        h2s: ['Subtitle'],
        h3s: [],
        headings: {
          h1: ['Main Title'],
          h2: ['Subtitle'],
          h3: []
        },
        links: {
          internal: ['https://example.com/page1'],
          external: ['https://external.com'],
          broken: []
        },
        hasContactForm: false,
        hasPhoneNumber: false,
        hasAddress: false,
        hasNAP: false,
        images: {
          total: 1,
          withAlt: 1,
          withoutAlt: 0,
          largeImages: 0,
          altTexts: ['Test image']
        },
        hasSchema: true,
        schemaTypes: ['WebPage'],
        mobileFriendly: true,
        wordCount: 4,
        hasSocialTags: true,
        hasCanonical: false,
        hasRobotsMeta: false,
        hasIcon: false,
        hasHttps: true,
        hasHreflang: false,
        hasSitemap: false,
        hasAmpVersion: false,
        pageLoadSpeed: {
          score: 85,
          firstContentfulPaint: 1500,
          totalBlockingTime: 0,
          largestContentfulPaint: 1500
        },
        keywordDensity: { example: 0.25 },
        readabilityScore: 75,
        contentStructure: {
          hasFAQs: false,
          hasTable: false,
          hasLists: false,
          hasVideo: false,
          hasEmphasis: false
        }
      };

      expect(() => validatePageCrawlResult(validPageCrawlResult)).not.toThrow();
    });
  });

  describe('Safe validation functions', () => {
    it('should return success for valid data', () => {
      const validData = {
        url: 'https://example.com',
        title: 'Test',
        statusCode: 200,
        meta: { description: 'Test', ogTags: {}, twitterTags: {} },
        content: { text: 'Test', wordCount: 1, paragraphs: ['Test'] },
        headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
        links: { internal: [], external: [] },
        images: [],
        schema: [],
        mobileCompatible: true,
        performance: { loadTime: 1000, resourceCount: 5, resourceSize: 10000 },
        html: '<html></html>',
        rawHtml: '<html></html>'
      };

      const result = safeValidateCrawlerOutput(validData);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid data', () => {
      const invalidData = { url: 'invalid-url' };

      const result = safeValidateCrawlerOutput(invalidData);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  describe('Schema handling', () => {
    it('should validate schema with multiple format support', () => {
      const crawlerOutputWithSchemas = {
        url: 'https://example.com',
        title: 'Test',
        statusCode: 200,
        meta: { description: 'Test', ogTags: {}, twitterTags: {} },
        content: { text: 'Test', wordCount: 1, paragraphs: ['Test'] },
        headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
        links: { internal: [], external: [] },
        images: [],
        schema: [
          { type: 'WebPage' },
          { types: ['Organization', 'LocalBusiness'] },
          { json: '{"@type": "Article"}' },
          { '@type': 'BlogPosting' } // Legacy format
        ],
        mobileCompatible: true,
        performance: { loadTime: 1000, resourceCount: 5, resourceSize: 10000 },
        html: '<html></html>',
        rawHtml: '<html></html>'
      };

      const result = safeValidateCrawlerOutput(crawlerOutputWithSchemas);
      expect(result.success).toBe(true);
    });
  });
});