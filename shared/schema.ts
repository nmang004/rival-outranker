import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, index, real, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Define schema for user accounts with enhanced profile information
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // Replit Auth uses string IDs
  username: text("username").unique(),
  email: text("email").unique(),
  password: text("password"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
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
  userId: text("user_id").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  overallScore: integer("overall_score").notNull(),
  results: jsonb("results").notNull(),
});

// User projects to organize saved analyses
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
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

export const updateKeywordSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  url: z.string().url("Valid URL is required")
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

// Schemas for Rival Audit

// Issue status enumeration
export const auditStatusSchema = z.enum([
  'Priority OFI',  // Critical finding, corrective action strongly recommended
  'OFI',           // Opportunity for improvement
  'OK',            // No issues found / Complete
  'N/A'            // Not applicable
]);

// SEO importance enumeration
export const seoImportanceSchema = z.enum([
  'High',
  'Medium',
  'Low'
]);

// Generic audit item schema
export const auditItemSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  status: auditStatusSchema,
  importance: seoImportanceSchema,
  notes: z.string().optional()
});

// Schemas for specific audit sections
export const onPageAuditSchema = z.object({
  items: z.array(auditItemSchema)
});

export const structureNavigationAuditSchema = z.object({
  items: z.array(auditItemSchema)
});

export const contactPageAuditSchema = z.object({
  items: z.array(auditItemSchema)
});

export const servicePagesAuditSchema = z.object({
  items: z.array(auditItemSchema)
});

export const locationPagesAuditSchema = z.object({
  items: z.array(auditItemSchema)
});

export const serviceAreaPagesAuditSchema = z.object({
  items: z.array(auditItemSchema)
});

// Complete audit schema
export const rivalAuditSchema = z.object({
  url: z.string(),
  timestamp: z.date().optional().default(() => new Date()),
  onPage: onPageAuditSchema,
  structureNavigation: structureNavigationAuditSchema,
  contactPage: contactPageAuditSchema,
  servicePages: servicePagesAuditSchema,
  locationPages: locationPagesAuditSchema,
  serviceAreaPages: serviceAreaPagesAuditSchema.optional(),
  reachedMaxPages: z.boolean().optional(), // Flag to indicate if crawler reached page limit
  summary: z.object({
    priorityOfiCount: z.number(),
    ofiCount: z.number(),
    okCount: z.number(),
    naCount: z.number(),
    total: z.number().optional()
  })
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

// Rival Audit Types
export type AuditStatus = z.infer<typeof auditStatusSchema>;
export type SeoImportance = z.infer<typeof seoImportanceSchema>;
export type AuditItem = z.infer<typeof auditItemSchema>;
export type OnPageAudit = z.infer<typeof onPageAuditSchema>;
export type StructureNavigationAudit = z.infer<typeof structureNavigationAuditSchema>;
export type ContactPageAudit = z.infer<typeof contactPageAuditSchema>;
export type ServicePagesAudit = z.infer<typeof servicePagesAuditSchema>;
export type LocationPagesAudit = z.infer<typeof locationPagesAuditSchema>;
export type ServiceAreaPagesAudit = z.infer<typeof serviceAreaPagesAuditSchema>;
export type RivalAudit = z.infer<typeof rivalAuditSchema>;

// Keyword Tracking Tables
export const keywords = pgTable("keywords", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  keyword: text("keyword").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  targetUrl: text("target_url").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
}, (table) => {
  return [
    unique().on(table.userId, table.keyword, table.targetUrl)
  ];
});

export const keywordMetrics = pgTable("keyword_metrics", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id").references(() => keywords.id).notNull(),
  searchVolume: integer("search_volume"), // Monthly US search volume
  globalSearchVolume: integer("global_search_volume"), 
  keywordDifficulty: integer("keyword_difficulty"), // 0-100 scale
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  cpc: real("cpc"), // Cost per click
  competition: real("competition"), // 0-1 scale
  trendsData: jsonb("trends_data"), // Historical search volume data
  relatedKeywords: jsonb("related_keywords"), // Array of related keywords with metrics
});

export const keywordRankings = pgTable("keyword_rankings", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id").references(() => keywords.id).notNull(),
  rank: integer("rank"), // Position in search results (null if not in top 100)
  rankingUrl: text("ranking_url"), // URL that's actually ranking
  previousRank: integer("previous_rank"), // Position from previous check
  rankDate: date("rank_date").defaultNow().notNull(),
  searchEngine: text("search_engine").default("google").notNull(), // google, bing, etc.
  device: text("device").default("desktop").notNull(), // desktop, mobile
  location: text("location").default("us").notNull(), // Country or region code
  serp: jsonb("serp"), // SERP features and snippets
  localRank: integer("local_rank"), // Position in local pack if applicable
}, (table) => {
  return [
    index("idx_ranking_keyword_date").on(table.keywordId, table.rankDate)
  ];
});

export const competitorRankings = pgTable("competitor_rankings", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id").references(() => keywords.id).notNull(),
  competitorUrl: text("competitor_url").notNull(),
  rank: integer("rank"), // Competitor position in search results
  rankDate: date("rank_date").defaultNow().notNull(),
  searchEngine: text("search_engine").default("google").notNull(),
  device: text("device").default("desktop").notNull(),
  location: text("location").default("us").notNull(),
}, (table) => {
  return [
    index("idx_competitor_keyword_date").on(table.keywordId, table.competitorUrl, table.rankDate)
  ];
});

export const keywordSuggestions = pgTable("keyword_suggestions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  baseKeyword: text("base_keyword").notNull(),
  suggestedKeyword: text("suggested_keyword").notNull(),
  searchVolume: integer("search_volume"),
  keywordDifficulty: integer("keyword_difficulty"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  source: text("source").default("related").notNull(), // related, question, autocomplete
  saved: boolean("saved").default(false).notNull(),
});

// Insert schemas for keyword tracking
export const insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKeywordMetricsSchema = createInsertSchema(keywordMetrics).omit({
  id: true,
  lastUpdated: true,
});

export const insertKeywordRankingSchema = createInsertSchema(keywordRankings).omit({
  id: true,
  rankDate: true,
});

export const insertCompetitorRankingSchema = createInsertSchema(competitorRankings).omit({
  id: true,
  rankDate: true,
});

export const insertKeywordSuggestionSchema = createInsertSchema(keywordSuggestions).omit({
  id: true,
  createdAt: true,
});

// Keyword tracking types
export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type KeywordMetrics = typeof keywordMetrics.$inferSelect;
export type InsertKeywordMetrics = z.infer<typeof insertKeywordMetricsSchema>;
export type KeywordRanking = typeof keywordRankings.$inferSelect;
export type InsertKeywordRanking = z.infer<typeof insertKeywordRankingSchema>;
export type CompetitorRanking = typeof competitorRankings.$inferSelect;
export type InsertCompetitorRanking = z.infer<typeof insertCompetitorRankingSchema>;
export type KeywordSuggestion = typeof keywordSuggestions.$inferSelect;
export type InsertKeywordSuggestion = z.infer<typeof insertKeywordSuggestionSchema>;
