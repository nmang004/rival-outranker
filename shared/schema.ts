import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define schema for user accounts with enhanced profile information
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImage: text("profile_image"),
  company: text("company"),
  jobTitle: text("job_title"),
  bio: text("bio"),
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
  isEmailVerified: boolean("is_email_verified").default(false),
});

// Define the schema for storing user analysis history
export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  userId: integer("user_id").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  overallScore: integer("overall_score").notNull(),
  results: jsonb("results").notNull(),
});

// User projects to organize saved analyses
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Many-to-many relationship between projects and analyses
export const projectAnalyses = pgTable("project_analyses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  analysisId: integer("analysis_id").notNull().references(() => analyses.id),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Insert schemas
export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  timestamp: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  password: true,
  username: true,
  email: true,
  isEmailVerified: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectSchema = createInsertSchema(projects).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertProjectAnalysisSchema = createInsertSchema(projectAnalyses).omit({
  id: true,
  addedAt: true,
});

// Types
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type LoginCredentials = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProjectAnalysis = z.infer<typeof insertProjectAnalysisSchema>;
export type ProjectAnalysis = typeof projectAnalyses.$inferSelect;

// Custom types for SEO analysis results
export const urlFormSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  includeCompetitorAnalysis: z.boolean().optional().default(false),
});

export type SeoScoreCategory = 'excellent' | 'good' | 'needs-work' | 'poor';

// SEO assessment schemas
export const seoScoreSchema = z.object({
  score: z.number().min(0).max(100),
  category: z.enum(['excellent', 'good', 'needs-work', 'poor']),
});

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

export const internalLinksAnalysisSchema = z.object({
  count: z.number(),
  uniqueCount: z.number(),
  hasProperAnchors: z.boolean(),
  brokenLinksCount: z.number(),
  overallScore: seoScoreSchema,
});

export const imageAnalysisSchema = z.object({
  count: z.number(),
  withAltCount: z.number(),
  withoutAltCount: z.number(),
  optimizedCount: z.number(),
  unoptimizedCount: z.number(),
  overallScore: seoScoreSchema,
});

export const schemaMarkupAnalysisSchema = z.object({
  hasSchemaMarkup: z.boolean(),
  types: z.array(z.string()).optional(),
  overallScore: seoScoreSchema,
});

export const mobileAnalysisSchema = z.object({
  isMobileFriendly: z.boolean(),
  viewportSet: z.boolean(),
  textSizeAppropriate: z.boolean(),
  tapTargetsAppropriate: z.boolean(),
  overallScore: seoScoreSchema,
});

export const pageSpeedAnalysisSchema = z.object({
  score: z.number(),
  lcp: z.number().optional(), // Largest Contentful Paint
  fid: z.number().optional(), // First Input Delay
  cls: z.number().optional(), // Cumulative Layout Shift
  ttfb: z.number().optional(), // Time to First Byte
  overallScore: seoScoreSchema,
});

export const userEngagementAnalysisSchema = z.object({
  potentialBounceRate: z.number().optional(),
  estimatedReadTime: z.number().optional(),
  overallScore: seoScoreSchema,
});

export const eatAnalysisSchema = z.object({
  hasAuthorInfo: z.boolean().optional(),
  hasExternalCitations: z.boolean().optional(),
  hasCredentials: z.boolean().optional(),
  overallScore: seoScoreSchema,
});

export const contentAnnotationSchema = z.object({
  content: z.string(),
  issue: z.string(),
  suggestion: z.string(),
  position: z.number(),
  severity: z.enum(['high', 'medium', 'low']),
  type: z.enum(['structure', 'readability', 'semantics', 'engagement'])
});

export const contentSectionSchema = z.object({
  title: z.string().optional(),
  content: z.string(),
  annotations: z.array(contentAnnotationSchema).optional(),
});

// Enhanced content analysis schema for more comprehensive content checks
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

// Technical SEO analysis schema for server-side and technical checks
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

// Competitor Analysis Types
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
  allCompetitorUrls: z.array(competitorUrlSchema),
  meta: competitorMetaSchema
});

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
