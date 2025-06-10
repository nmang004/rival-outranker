import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, index, real, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// API Usage tracking table
export const apiUsage = pgTable("api_usage", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"), // in milliseconds
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  apiProvider: text("api_provider").notNull(), // e.g., 'dataforseo', 'backlinks', 'keyword', 'internal'
  requestData: jsonb("request_data"), // request parameters (sanitized)
  responseData: jsonb("response_data"), // limited response data (sanitized)
  errorMessage: text("error_message"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  estimatedCost: real("estimated_cost"), // estimated cost in USD
  usageMetrics: jsonb("usage_metrics"), // detailed usage metrics (tokens, requests, etc.)
});

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
  chatUsageCount: integer("chat_usage_count").default(0),
  chatUsageResetDate: timestamp("chat_usage_reset_date"),
  role: text("role").default("user"), // Roles: user, admin
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

// Anonymous chat usage tracking (for non-logged in users)
export const anonChatUsage = pgTable("anon_chat_usage", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  sessionId: text("session_id").notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
  resetDate: timestamp("reset_date"),
});

// Backlink tracking tables
export const backlinkProfiles = pgTable("backlink_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastScanAt: timestamp("last_scan_at"),
  scanFrequency: text("scan_frequency").default("weekly"), // daily, weekly, monthly
  emailAlerts: boolean("email_alerts").default(false),
  domainAuthority: integer("domain_authority"),
  totalBacklinks: integer("total_backlinks").default(0),
  newBacklinks: integer("new_backlinks").default(0),
  lostBacklinks: integer("lost_backlinks").default(0),
  dofollow: integer("dofollow").default(0),
  nofollow: integer("nofollow").default(0),
});

export const backlinks = pgTable("backlinks", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => backlinkProfiles.id),
  sourceUrl: text("source_url").notNull(),
  sourceDomain: text("source_domain").notNull(),
  targetUrl: text("target_url").notNull(),
  firstDiscovered: timestamp("first_discovered").defaultNow().notNull(),
  lastChecked: timestamp("last_checked").defaultNow().notNull(),
  status: text("status").default("active"), // active, lost, redirected
  anchorText: text("anchor_text"),
  isDofollow: boolean("is_dofollow").default(false),
  pageAuthority: integer("page_authority"),
  domainAuthority: integer("domain_authority"),
  linkPosition: text("link_position"), // header, body, footer, sidebar
  linkType: text("link_type"), // text, image, button
  surroundingText: text("surrounding_text"),
});

export const backlinkHistory = pgTable("backlink_history", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => backlinkProfiles.id),
  scanDate: timestamp("scan_date").defaultNow().notNull(),
  totalBacklinks: integer("total_backlinks").default(0),
  newBacklinks: integer("new_backlinks").default(0),
  lostBacklinks: integer("lost_backlinks").default(0),
  dofollow: integer("dofollow").default(0),
  nofollow: integer("nofollow").default(0),
  topReferringDomains: jsonb("top_referring_domains"),
  domainAuthority: integer("domain_authority"),
});

export const outgoingLinks = pgTable("outgoing_links", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => backlinkProfiles.id),
  sourceUrl: text("source_url").notNull(),
  targetUrl: text("target_url").notNull(),
  targetDomain: text("target_domain").notNull(),
  firstDiscovered: timestamp("first_discovered").defaultNow().notNull(),
  lastChecked: timestamp("last_checked").defaultNow().notNull(),
  status: text("status").default("active"), // active, broken, redirected
  anchorText: text("anchor_text"),
  isDofollow: boolean("is_dofollow").default(true),
  targetPageAuthority: integer("target_page_authority"),
  targetDomainAuthority: integer("target_domain_authority"),
});

// Insert schemas for backlink features
export const insertBacklinkProfileSchema = createInsertSchema(backlinkProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastScanAt: true,
  totalBacklinks: true,
  newBacklinks: true,
  lostBacklinks: true,
  dofollow: true,
  nofollow: true,
});

export const insertBacklinkSchema = createInsertSchema(backlinks).omit({
  id: true,
  firstDiscovered: true,
  lastChecked: true,
});

export const insertOutgoingLinkSchema = createInsertSchema(outgoingLinks).omit({
  id: true,
  firstDiscovered: true,
  lastChecked: true,
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
export type AnonChatUsage = typeof anonChatUsage.$inferSelect;
export type BacklinkProfile = typeof backlinkProfiles.$inferSelect;
export type InsertBacklinkProfile = z.infer<typeof insertBacklinkProfileSchema>;
export type Backlink = typeof backlinks.$inferSelect;
export type InsertBacklink = z.infer<typeof insertBacklinkSchema>;
export type OutgoingLink = typeof outgoingLinks.$inferSelect;
export type InsertOutgoingLink = z.infer<typeof insertOutgoingLinkSchema>;
export type BacklinkHistory = typeof backlinkHistory.$inferSelect;
export type ApiUsage = typeof apiUsage.$inferSelect;
export type InsertApiUsage = typeof apiUsage.$inferInsert;

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

// SEO Learning Path Tables
export const learningModules = pgTable("learning_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  difficulty: text("difficulty").notNull().default("beginner"), // beginner, intermediate, advanced
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  prerequisiteIds: integer("prerequisite_ids").array(), // array of module IDs that should be completed first
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => users.id),
});

export const learningLessons = pgTable("learning_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => users.id),
});

export const lessonQuizzes = pgTable("lesson_quizzes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => learningLessons.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // array of options
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userLearningProgress = pgTable("user_learning_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  lessonId: integer("lesson_id").notNull().references(() => learningLessons.id),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed
  completionPercentage: integer("completion_percentage").notNull().default(0),
  quizScore: integer("quiz_score"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  notes: text("notes"),
}, (table) => {
  return {
    userModuleLessonIdx: index("user_module_lesson_idx").on(
      table.userId,
      table.moduleId,
      table.lessonId
    ),
  };
});

export const learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  targetAudience: text("target_audience"), // beginner, business owner, seo specialist, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => users.id),
});

export const learningPathModules = pgTable("learning_path_modules", {
  id: serial("id").primaryKey(),
  pathId: integer("path_id").notNull().references(() => learningPaths.id),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  sortOrder: integer("sort_order").notNull().default(0),
  isRequired: boolean("is_required").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    pathModuleIdx: unique("path_module_idx").on(table.pathId, table.moduleId),
  };
});

export const userLearningRecommendations = pgTable("user_learning_recommendations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  reasonCode: text("reason_code").notNull(), // based_on_analysis, based_on_interests, based_on_industry, etc.
  reasonText: text("reason_text").notNull(),
  priority: integer("priority").notNull().default(5), // 1-10, higher is more important
  analysisId: integer("analysis_id").references(() => analyses.id), // if recommendation is based on a specific analysis
  isCompleted: boolean("is_completed").notNull().default(false),
  isDismmised: boolean("is_dismissed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  clickedAt: timestamp("clicked_at"),
}, (table) => {
  return {
    userModuleIdx: index("user_module_recommendation_idx").on(
      table.userId,
      table.moduleId
    ),
  };
});

// Insert schemas for learning path features
export const insertLearningModuleSchema = createInsertSchema(learningModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLearningLessonSchema = createInsertSchema(learningLessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLessonQuizSchema = createInsertSchema(lessonQuizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserLearningProgressSchema = createInsertSchema(userLearningProgress).omit({
  id: true,
  startedAt: true,
  completedAt: true,
  lastAccessedAt: true,
});

export const insertLearningPathSchema = createInsertSchema(learningPaths).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLearningPathModuleSchema = createInsertSchema(learningPathModules).omit({
  id: true,
  createdAt: true,
});

export const insertUserLearningRecommendationSchema = createInsertSchema(userLearningRecommendations).omit({
  id: true,
  createdAt: true,
  clickedAt: true,
});

// Types for learning path features
export type LearningModule = typeof learningModules.$inferSelect;
export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;
export type LearningLesson = typeof learningLessons.$inferSelect;
export type InsertLearningLesson = z.infer<typeof insertLearningLessonSchema>;
export type LessonQuiz = typeof lessonQuizzes.$inferSelect;
export type InsertLessonQuiz = z.infer<typeof insertLessonQuizSchema>;
export type UserLearningProgress = typeof userLearningProgress.$inferSelect;
export type InsertUserLearningProgress = z.infer<typeof insertUserLearningProgressSchema>;
export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;
export type LearningPathModule = typeof learningPathModules.$inferSelect;
export type InsertLearningPathModule = z.infer<typeof insertLearningPathModuleSchema>;
export type UserLearningRecommendation = typeof userLearningRecommendations.$inferSelect;
export type InsertUserLearningRecommendation = z.infer<typeof insertUserLearningRecommendationSchema>;

// Crawling System Tables
export const crawlSources = pgTable("crawl_sources", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // news, seo, competitor
  url: text("url").notNull(),
  config: jsonb("config").notNull(), // selectors and other configuration
  isActive: boolean("is_active").default(true).notNull(),
  lastCrawled: timestamp("last_crawled"),
  crawlFrequency: text("crawl_frequency").default("daily").notNull(), // hourly, daily, weekly
  maxRetries: integer("max_retries").default(3).notNull(),
  timeoutMs: integer("timeout_ms").default(30000).notNull(),
  respectRobots: boolean("respect_robots").default(true).notNull(),
  userAgent: text("user_agent"),
  headers: jsonb("headers"), // custom headers
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => users.id),
});

export const crawlJobs = pgTable("crawl_jobs", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // news, seo, competitor, custom
  schedule: text("schedule").notNull(), // cron expression
  isActive: boolean("is_active").default(true).notNull(),
  config: jsonb("config").notNull(), // job-specific configuration
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  retryAttempts: integer("retry_attempts").default(0).notNull(),
  maxRetries: integer("max_retries").default(3).notNull(),
  successCount: integer("success_count").default(0).notNull(),
  errorCount: integer("error_count").default(0).notNull(),
  averageDuration: integer("average_duration").default(0).notNull(), // milliseconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => users.id),
});

export const crawledContent = pgTable("crawled_content", {
  id: text("id").primaryKey().notNull(),
  type: text("type").notNull(), // news, seo, competitor
  source: text("source").notNull(), // source name or identifier
  url: text("url").notNull(),
  title: text("title"),
  content: text("content"), // main content text
  metadata: jsonb("metadata"), // structured data from crawl
  qualityScore: integer("quality_score"), // 0-100 quality assessment
  isStale: boolean("is_stale").default(false).notNull(),
  isDuplicate: boolean("is_duplicate").default(false).notNull(),
  duplicateOf: text("duplicate_of"),
  wordCount: integer("word_count"),
  readingTime: integer("reading_time"), // minutes
  languageCode: text("language_code").default("en"),
  sentiment: text("sentiment"), // positive, negative, neutral
  entities: jsonb("entities"), // extracted entities
  keywords: jsonb("keywords"), // extracted keywords
  images: jsonb("images"), // image metadata
  links: jsonb("links"), // internal/external links
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  crawledAt: timestamp("crawled_at").defaultNow().notNull(),
}, (table): Record<string, any> => {
  return {
    idxContentType: index("idx_content_type").on(table.type),
    idxContentSource: index("idx_content_source").on(table.source),
    idxContentUrl: index("idx_content_url").on(table.url),
    idxContentCrawledAt: index("idx_content_crawled_at").on(table.crawledAt),
    idxContentQuality: index("idx_content_quality").on(table.qualityScore),
    uniqueUrlSource: unique("unique_url_source").on(table.url, table.source)
  };
});

export const crawlMetrics = pgTable("crawl_metrics", {
  id: serial("id").primaryKey(),
  jobId: text("job_id").references(() => crawlJobs.id),
  sourceId: text("source_id").references(() => crawlSources.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // milliseconds
  status: text("status").notNull(), // success, error, timeout, cancelled
  itemsProcessed: integer("items_processed").default(0).notNull(),
  itemsSuccessful: integer("items_successful").default(0).notNull(),
  itemsFailed: integer("items_failed").default(0).notNull(),
  bytesDownloaded: integer("bytes_downloaded").default(0).notNull(),
  pagesVisited: integer("pages_visited").default(0).notNull(),
  errorMessage: text("error_message"),
  errorType: text("error_type"), // network, timeout, parsing, validation
  resourceUsage: jsonb("resource_usage"), // memory, cpu metrics
  metadata: jsonb("metadata"), // additional metrics data
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return [
    index("idx_metrics_job_time").on(table.jobId, table.startTime),
    index("idx_metrics_status").on(table.status),
    index("idx_metrics_date").on(table.startTime)
  ];
});

export const crawlAlerts = pgTable("crawl_alerts", {
  id: text("id").primaryKey().notNull(),
  ruleId: text("rule_id").notNull(),
  ruleName: text("rule_name").notNull(),
  severity: text("severity").notNull(), // low, medium, high, critical
  message: text("message").notNull(),
  jobId: text("job_id").references(() => crawlJobs.id),
  sourceId: text("source_id").references(() => crawlSources.id),
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolved: boolean("resolved").default(false).notNull(),
  metadata: jsonb("metadata"), // alert-specific data
  notificationsSent: jsonb("notifications_sent"), // tracking sent notifications
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return [
    index("idx_alerts_severity").on(table.severity),
    index("idx_alerts_resolved").on(table.resolved),
    index("idx_alerts_triggered").on(table.triggeredAt)
  ];
});

export const dataQualityReports = pgTable("data_quality_reports", {
  id: serial("id").primaryKey(),
  totalRecords: integer("total_records").notNull(),
  validRecords: integer("valid_records").notNull(),
  invalidRecords: integer("invalid_records").notNull(),
  duplicateRecords: integer("duplicate_records").notNull(),
  staleRecords: integer("stale_records").notNull(),
  qualityScore: integer("quality_score").notNull(), // 0-100
  issues: jsonb("issues").notNull(), // array of quality issues
  recommendations: jsonb("recommendations"), // improvement suggestions
  contentDistribution: jsonb("content_distribution"), // type breakdown
  recentActivity: jsonb("recent_activity"), // activity metrics
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  reportType: text("report_type").default("scheduled").notNull(), // scheduled, manual, triggered
  triggeredBy: text("triggered_by").references(() => users.id),
}, (table) => {
  return [
    index("idx_quality_generated").on(table.generatedAt),
    index("idx_quality_score").on(table.qualityScore)
  ];
});

// Rival Audits table - stores SEO audit results with automatic cleanup
export const rivalAudits = pgTable("rival_audits", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  url: text("url").notNull(),
  status: text("status").notNull(), // pending, processing, completed, failed
  results: jsonb("results"), // complete audit results
  summary: jsonb("summary"), // summary counts and metrics
  crawlJobId: text("crawl_job_id").references(() => crawlJobs.id),
  pagesAnalyzed: integer("pages_analyzed").default(0).notNull(),
  reachedMaxPages: boolean("reached_max_pages").default(false).notNull(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // additional audit metadata
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at").notNull(), // for automatic cleanup
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return [
    index("idx_rival_audits_user").on(table.userId),
    index("idx_rival_audits_url").on(table.url),
    index("idx_rival_audits_status").on(table.status),
    index("idx_rival_audits_expires").on(table.expiresAt),
    index("idx_rival_audits_created").on(table.createdAt),
    unique("unique_user_url_active").on(table.userId, table.url, table.status)
  ];
});

// Insert schemas for crawling system
export const insertCrawlSourceSchema = createInsertSchema(crawlSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastCrawled: true,
});

export const insertCrawlJobSchema = createInsertSchema(crawlJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRun: true,
  nextRun: true,
  retryAttempts: true,
  successCount: true,
  errorCount: true,
  averageDuration: true,
});

export const insertCrawledContentSchema = createInsertSchema(crawledContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  crawledAt: true,
  isStale: true,
  isDuplicate: true,
});

export const insertCrawlMetricsSchema = createInsertSchema(crawlMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertCrawlAlertSchema = createInsertSchema(crawlAlerts).omit({
  id: true,
  createdAt: true,
  triggeredAt: true,
  resolved: true,
});

export const insertRivalAuditSchema = createInsertSchema(rivalAudits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  startedAt: true,
});

// Crawling system types
export type CrawlSource = typeof crawlSources.$inferSelect;
export type InsertCrawlSource = z.infer<typeof insertCrawlSourceSchema>;
export type CrawlJob = typeof crawlJobs.$inferSelect;
export type InsertCrawlJob = z.infer<typeof insertCrawlJobSchema>;
export type CrawledContent = typeof crawledContent.$inferSelect;
export type InsertCrawledContent = z.infer<typeof insertCrawledContentSchema>;
export type CrawlMetrics = typeof crawlMetrics.$inferSelect;
export type InsertCrawlMetrics = z.infer<typeof insertCrawlMetricsSchema>;
export type CrawlAlert = typeof crawlAlerts.$inferSelect;
export type InsertCrawlAlert = z.infer<typeof insertCrawlAlertSchema>;
export type DataQualityReport = typeof dataQualityReports.$inferSelect;
export type RivalAuditRecord = typeof rivalAudits.$inferSelect;
export type InsertRivalAuditRecord = z.infer<typeof insertRivalAuditSchema>;
