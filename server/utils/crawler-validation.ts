/**
 * Crawler Data Validation - Runtime validation schemas for crawler data transformations
 * This file provides Zod schemas to validate data compatibility between CrawlerOutput and PageCrawlResult
 */

import { z } from 'zod';

// Schema for CrawlerOutput validation
export const crawlerOutputValidationSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  statusCode: z.number(),
  status: z.enum(['success', 'error', 'skipped']).optional(),
  headers: z.record(z.any()).optional(),
  responseTime: z.number().optional(),
  timestamp: z.string().optional(),
  isDuplicate: z.boolean().optional(),
  similarUrl: z.string().optional(),
  similarity: z.number().optional(),
  meta: z.object({
    description: z.string(),
    robots: z.string().optional(),
    viewport: z.string().optional(),
    canonical: z.string().optional(),
    ogTags: z.record(z.string()),
    twitterTags: z.record(z.string())
  }),
  content: z.object({
    text: z.string(),
    wordCount: z.number(),
    paragraphs: z.array(z.string()),
    html: z.string().optional()
  }),
  headings: z.object({
    h1: z.array(z.string()),
    h2: z.array(z.string()),
    h3: z.array(z.string()),
    h4: z.array(z.string()),
    h5: z.array(z.string()),
    h6: z.array(z.string())
  }),
  links: z.object({
    internal: z.array(z.string()),
    external: z.array(z.string()),
    total: z.number().optional()
  }),
  images: z.array(z.object({
    src: z.string(),
    alt: z.string(),
    title: z.string().optional(),
    size: z.number().optional(),
    total: z.number().optional()
  })),
  schema: z.array(z.object({
    type: z.string().optional(),
    types: z.array(z.string()).optional(),
    json: z.string().optional()
  }).catchall(z.any())),
  mobileCompatible: z.boolean(),
  performance: z.object({
    loadTime: z.number(),
    resourceCount: z.number(),
    resourceSize: z.number()
  }),
  security: z.object({
    hasHttps: z.boolean(),
    hasMixedContent: z.boolean(),
    hasSecurityHeaders: z.boolean()
  }).optional(),
  accessibility: z.object({
    hasAccessibleElements: z.boolean(),
    missingAltText: z.number(),
    hasAriaAttributes: z.boolean(),
    hasProperHeadingStructure: z.boolean()
  }).optional(),
  seoIssues: z.object({
    noindex: z.boolean(),
    brokenLinks: z.number(),
    missingAltText: z.number(),
    duplicateMetaTags: z.boolean(),
    thinContent: z.boolean(),
    missingHeadings: z.boolean(),
    robots: z.string().nullable()
  }).optional(),
  html: z.string(),
  rawHtml: z.string(),
  error: z.string().optional(),
  puppeteerUsed: z.boolean().optional()
});

// Schema for PageCrawlResult validation
export const pageCrawlResultValidationSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  metaDescription: z.string(),
  bodyText: z.string(),
  rawHtml: z.string(),
  h1s: z.array(z.string()),
  h2s: z.array(z.string()),
  h3s: z.array(z.string()),
  headings: z.object({
    h1: z.array(z.string()),
    h2: z.array(z.string()),
    h3: z.array(z.string())
  }),
  links: z.object({
    internal: z.array(z.string()),
    external: z.array(z.string()),
    broken: z.array(z.string())
  }),
  hasContactForm: z.boolean(),
  hasPhoneNumber: z.boolean(),
  hasAddress: z.boolean(),
  hasNAP: z.boolean(),
  images: z.object({
    total: z.number(),
    withAlt: z.number(),
    withoutAlt: z.number(),
    largeImages: z.number(),
    altTexts: z.array(z.string())
  }),
  hasSchema: z.boolean(),
  schemaTypes: z.array(z.string()),
  mobileFriendly: z.boolean(),
  wordCount: z.number(),
  hasSocialTags: z.boolean(),
  hasCanonical: z.boolean(),
  hasRobotsMeta: z.boolean(),
  hasIcon: z.boolean(),
  hasHttps: z.boolean(),
  hasHreflang: z.boolean(),
  hasSitemap: z.boolean(),
  hasAmpVersion: z.boolean(),
  pageLoadSpeed: z.object({
    score: z.number(),
    firstContentfulPaint: z.number(),
    totalBlockingTime: z.number(),
    largestContentfulPaint: z.number()
  }),
  keywordDensity: z.record(z.number()),
  readabilityScore: z.number(),
  contentStructure: z.object({
    hasFAQs: z.boolean(),
    hasTable: z.boolean(),
    hasLists: z.boolean(),
    hasVideo: z.boolean(),
    hasEmphasis: z.boolean()
  })
});

// Type exports for use in other files
export type ValidatedCrawlerOutput = z.infer<typeof crawlerOutputValidationSchema>;
export type ValidatedPageCrawlResult = z.infer<typeof pageCrawlResultValidationSchema>;

/**
 * Validate CrawlerOutput data before transformation
 */
export function validateCrawlerOutput(data: unknown): ValidatedCrawlerOutput {
  try {
    return crawlerOutputValidationSchema.parse(data);
  } catch (error) {
    console.error('[CrawlerValidation] CrawlerOutput validation failed:', error);
    throw new Error('Invalid CrawlerOutput data structure');
  }
}

/**
 * Validate PageCrawlResult data after transformation
 */
export function validatePageCrawlResult(data: unknown): ValidatedPageCrawlResult {
  try {
    return pageCrawlResultValidationSchema.parse(data);
  } catch (error) {
    console.error('[CrawlerValidation] PageCrawlResult validation failed:', error);
    throw new Error('Invalid PageCrawlResult data structure');
  }
}

/**
 * Safe validation that returns validation result without throwing
 */
export function safeValidateCrawlerOutput(data: unknown): {
  success: boolean;
  data?: ValidatedCrawlerOutput;
  error?: string;
} {
  try {
    const validated = crawlerOutputValidationSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown validation error' 
    };
  }
}

/**
 * Safe validation for PageCrawlResult
 */
export function safeValidatePageCrawlResult(data: unknown): {
  success: boolean;
  data?: ValidatedPageCrawlResult;
  error?: string;
} {
  try {
    const validated = pageCrawlResultValidationSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown validation error' 
    };
  }
}