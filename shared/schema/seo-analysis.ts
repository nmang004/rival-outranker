import { z } from "zod";

// SEO Score Categories
export type SeoScoreCategory = 'excellent' | 'good' | 'needs-work' | 'poor';

// Base SEO score schema
export const seoScoreSchema = z.object({
  score: z.number().min(0).max(100),
  category: z.enum(['excellent', 'good', 'needs-work', 'poor']),
});

// Keyword Analysis Schema
export const keywordAnalysisSchema = z.object({
  primaryKeyword: z.string(),
  relatedKeywords: z.array(z.string()),
  density: z.number(),
  titlePresent: z.boolean(),
  descriptionPresent: z.boolean(),
  h1Present: z.boolean(),
  headingsPresent: z.boolean(),
  contentPresent: z.boolean(),
  urlPresent: z.boolean(),
  altTextPresent: z.boolean(),
  overallScore: seoScoreSchema,
});

// Meta Tags Analysis Schema
export const metaTagsAnalysisSchema = z.object({
  title: z.string().optional(),
  titleLength: z.number().optional(),
  titleKeywordPosition: z.number().optional(),
  description: z.string().optional(),
  descriptionLength: z.number().optional(),
  descriptionHasKeyword: z.boolean().optional(),
  hasCanonical: z.boolean().optional(),
  hasRobots: z.boolean().optional(),
  hasOpenGraph: z.boolean().optional(),
  hasTwitterCard: z.boolean().optional(),
  overallScore: seoScoreSchema,
});

// Content Analysis Schema
export const contentAnalysisSchema = z.object({
  wordCount: z.number(),
  paragraphCount: z.number(),
  headingStructure: z.object({
    h1Count: z.number(),
    h2Count: z.number(),
    h3Count: z.number(),
    h4Count: z.number(),
    h5Count: z.number(),
    h6Count: z.number(),
  }),
  readabilityScore: z.number(),
  hasMultimedia: z.boolean(),
  overallScore: seoScoreSchema,
});

// Internal Links Analysis Schema
export const internalLinksAnalysisSchema = z.object({
  count: z.number(),
  uniqueCount: z.number(),
  hasProperAnchors: z.boolean(),
  brokenLinksCount: z.number(),
  overallScore: seoScoreSchema,
});

// Image Analysis Schema
export const imageAnalysisSchema = z.object({
  count: z.number(),
  withAltCount: z.number(),
  withoutAltCount: z.number(),
  optimizedCount: z.number(),
  unoptimizedCount: z.number(),
  overallScore: seoScoreSchema,
});

// Schema Markup Analysis Schema
export const schemaMarkupAnalysisSchema = z.object({
  hasSchemaMarkup: z.boolean(),
  types: z.array(z.string()).optional(),
  overallScore: seoScoreSchema,
});

// Mobile Analysis Schema
export const mobileAnalysisSchema = z.object({
  isMobileFriendly: z.boolean(),
  viewportSet: z.boolean(),
  textSizeAppropriate: z.boolean(),
  tapTargetsAppropriate: z.boolean(),
  hasInterstitials: z.boolean().optional(),
  optimizedImages: z.boolean().optional(),
  mobileNavigation: z.boolean().optional(),
  coreWebVitals: z.object({
    firstContentfulPaint: z.string().optional(),
    largestContentfulPaint: z.string().optional(),
    cumulativeLayoutShift: z.number().optional(),
    totalBlockingTime: z.string().optional(),
    speedIndex: z.string().optional()
  }).optional(),
  overallScore: seoScoreSchema,
});

// Page Speed Analysis Schema
export const pageSpeedAnalysisSchema = z.object({
  score: z.number(),
  lcp: z.number().optional(), // Largest Contentful Paint
  fid: z.number().optional(), // First Input Delay
  cls: z.number().optional(), // Cumulative Layout Shift
  ttfb: z.number().optional(), // Time to First Byte
  overallScore: seoScoreSchema,
});

// User Engagement Analysis Schema
export const userEngagementAnalysisSchema = z.object({
  potentialBounceRate: z.number().optional(),
  estimatedReadTime: z.number().optional(),
  overallScore: seoScoreSchema,
});

// E-A-T Analysis Schema
export const eatAnalysisSchema = z.object({
  hasAuthorInfo: z.boolean().optional(),
  hasExternalCitations: z.boolean().optional(),
  hasCredentials: z.boolean().optional(),
  overallScore: seoScoreSchema,
});

// Content Annotation Schema
export const contentAnnotationSchema = z.object({
  content: z.string(),
  issue: z.string(),
  suggestion: z.string(),
  position: z.number(),
  severity: z.enum(['high', 'medium', 'low']),
  type: z.enum(['structure', 'readability', 'semantics', 'engagement'])
});

// Content Section Schema
export const contentSectionSchema = z.object({
  title: z.string().optional(),
  content: z.string(),
  annotations: z.array(contentAnnotationSchema).optional(),
});

// Enhanced Content Analysis Schema
export const enhancedContentAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  assessment: z.string(),
  wordCount: z.number(),
  readability: z.object({
    score: z.number(),
    grade: z.string(),
    averageWordsPerSentence: z.string().or(z.number()).optional(),
    complexWordPercentage: z.string().or(z.number()).optional(),
    fleschKincaidGrade: z.string().or(z.number()).optional()
  }),
  issues: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  keywordAnalysis: z.object({
    keyword: z.string().optional(),
    inTitle: z.boolean().optional(),
    inDescription: z.boolean().optional(),
    inH1: z.boolean().optional(),
    inH2: z.boolean().optional(),
    inUrl: z.boolean().optional(),
    inFirstParagraph: z.boolean().optional(),
    occurrences: z.record(z.string(), z.number()).optional(),
    density: z.string().optional(),
    totalCount: z.number().optional()
  }).optional()
});

// Technical SEO Analysis Schema
export const technicalSeoAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  assessment: z.string(),
  pageStatus: z.object({
    code: z.number(),
    message: z.string()
  }),
  security: z.object({
    usesHttps: z.boolean(),
    hasMixedContent: z.boolean(),
    hasSecurityHeaders: z.boolean(),
    securityScore: z.number()
  }).optional(),
  indexability: z.object({
    isIndexable: z.boolean(),
    hasRobotsDirective: z.boolean().optional(),
    robotsContent: z.string().nullable().optional()
  }).optional(),
  mobileFriendliness: z.object({
    hasMobileViewport: z.boolean(),
    viewportContent: z.string().optional(),
    responsiveScore: z.number().optional()
  }).optional(),
  structuredData: z.object({
    hasStructuredData: z.boolean(),
    schemaTypes: z.array(z.string()).optional(),
    count: z.number().optional()
  }).optional(),
  canonicalization: z.object({
    hasCanonical: z.boolean().optional(),
    canonicalUrl: z.string().nullable().optional(),
    isSelfCanonical: z.boolean().optional()
  }).optional(),
  performance: z.object({
    loadTime: z.number().optional(),
    resourceCount: z.number().optional(),
    resourceSize: z.number().optional(),
    performanceScore: z.number().optional()
  }).optional(),
  serverConfiguration: z.object({
    domain: z.string().optional(),
    hasCookies: z.boolean().optional(),
    hasCDN: z.boolean().optional(),
    hasCompression: z.boolean().optional(),
    serverInfo: z.string().optional()
  }).optional(),
  issues: z.array(z.string()),
  recommendations: z.array(z.string())
});

// Deep Content Analysis Schema
export const deepContentAnalysisSchema = z.object({
  url: z.string(),
  timestamp: z.date().optional(),
  title: z.string(),
  wordCount: z.number(),
  readabilityScore: z.number(),
  contentSections: z.array(contentSectionSchema),
  keyPhrases: z.array(z.string()),
  recommendations: z.array(z.string()),
  strengthsCount: z.number(),
  weaknessesCount: z.number(),
  score: z.number(),
  category: z.enum(['excellent', 'good', 'needs-work', 'poor'])
});

// Complete SEO Analysis Result Schema
export const seoAnalysisResultSchema = z.object({
  url: z.string(),
  timestamp: z.date().optional(),
  overallScore: seoScoreSchema,
  keywordAnalysis: keywordAnalysisSchema,
  metaTagsAnalysis: metaTagsAnalysisSchema,
  contentAnalysis: contentAnalysisSchema,
  // New enhanced analyzers
  enhancedContentAnalysis: enhancedContentAnalysisSchema.optional(),
  technicalSeoAnalysis: technicalSeoAnalysisSchema.optional(),
  // Original analyzers
  internalLinksAnalysis: internalLinksAnalysisSchema,
  imageAnalysis: imageAnalysisSchema,
  schemaMarkupAnalysis: schemaMarkupAnalysisSchema,
  mobileAnalysis: mobileAnalysisSchema,
  pageSpeedAnalysis: pageSpeedAnalysisSchema,
  userEngagementAnalysis: userEngagementAnalysisSchema,
  eatAnalysis: eatAnalysisSchema,
  // Results
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()),
  deepContentAnalysis: deepContentAnalysisSchema.optional(),
  // Optional competitor analysis - included only when requested
  competitorAnalysis: z.object({
    keyword: z.string(),
    location: z.string().optional(),
    competitors: z.array(z.object({
      name: z.string(),
      url: z.string(),
      score: z.number(),
      domainAuthority: z.number(),
      backlinks: z.number(),
      keywords: z.number(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string())
    })),
    keywordGap: z.array(z.object({
      term: z.string(),
      volume: z.number(),
      competition: z.string(),
      topCompetitor: z.string()
    })),
    marketPosition: z.string(),
    growthScore: z.string(),
    domainAuthority: z.number(),
    localVisibility: z.number(),
    contentQuality: z.number(),
    backlinkScore: z.number(),
    queryCount: z.number(),
    usingRealSearch: z.boolean(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    recommendations: z.array(z.string())
  }).optional(),
});

// URL Form Schema
export const urlFormSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  includeCompetitorAnalysis: z.boolean().optional().default(false),
});

// Competitor Analysis Schemas
export const competitorSchema = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string(),
  keywordDensity: z.number(),
  contentLength: z.number(),
  h1Count: z.number(),
  h2Count: z.number(),
  h3Count: z.number(),
  internalLinksCount: z.number(),
  externalLinksCount: z.number(),
  imageCount: z.number(),
  imagesWithAlt: z.number(),
  loadTime: z.number().optional(),
  pageSize: z.number().optional(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string())
});

// Schema for simplified competitor url listing (for pagination)
export const competitorUrlSchema = z.object({
  url: z.string(),
  name: z.string()
});

// Meta information about the competitor search
export const competitorMetaSchema = z.object({
  totalResults: z.number(),
  analyzedResults: z.number(),
  searchQuery: z.string(),
  error: z.string().optional()
});

export const competitorAnalysisResultSchema = z.object({
  keyword: z.string(),
  location: z.string(),
  competitors: z.array(competitorSchema),
  comparisonMetrics: z.object({
    avgKeywordDensity: z.number(),
    avgContentLength: z.number(),
    avgH1Count: z.number(),
    avgH2Count: z.number(),
    avgImagesWithAlt: z.number(),
    topKeywords: z.array(z.string())
  }),
  // New fields for advanced competitor analysis with pagination
  allCompetitorUrls: z.array(competitorUrlSchema).optional(),
  meta: competitorMetaSchema.optional(),
  queryCount: z.number().optional(),
  usingRealSearch: z.boolean().optional(),
  keywordGap: z.array(z.object({
    term: z.string(),
    volume: z.number().optional(),
    competition: z.string().optional(),
    topCompetitor: z.string().optional()
  })).optional()
});

// Type exports
export type SeoScore = z.infer<typeof seoScoreSchema>;
export type KeywordAnalysis = z.infer<typeof keywordAnalysisSchema>;
export type MetaTagsAnalysis = z.infer<typeof metaTagsAnalysisSchema>;
export type ContentAnalysis = z.infer<typeof contentAnalysisSchema>;
export type InternalLinksAnalysis = z.infer<typeof internalLinksAnalysisSchema>;
export type ImageAnalysis = z.infer<typeof imageAnalysisSchema>;
export type SchemaMarkupAnalysis = z.infer<typeof schemaMarkupAnalysisSchema>;
export type MobileAnalysis = z.infer<typeof mobileAnalysisSchema>;
export type PageSpeedAnalysis = z.infer<typeof pageSpeedAnalysisSchema>;
export type UserEngagementAnalysis = z.infer<typeof userEngagementAnalysisSchema>;
export type EatAnalysis = z.infer<typeof eatAnalysisSchema>;
export type ContentAnnotation = z.infer<typeof contentAnnotationSchema>;
export type ContentSection = z.infer<typeof contentSectionSchema>;
export type EnhancedContentAnalysis = z.infer<typeof enhancedContentAnalysisSchema>;
export type TechnicalSeoAnalysis = z.infer<typeof technicalSeoAnalysisSchema>;
export type DeepContentAnalysis = z.infer<typeof deepContentAnalysisSchema>;
export type SeoAnalysisResult = z.infer<typeof seoAnalysisResultSchema>;
export type Competitor = z.infer<typeof competitorSchema>;
export type CompetitorUrl = z.infer<typeof competitorUrlSchema>;
export type CompetitorMeta = z.infer<typeof competitorMetaSchema>;
export type CompetitorAnalysisResult = z.infer<typeof competitorAnalysisResultSchema>;