var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  analyses: () => analyses,
  anonChatUsage: () => anonChatUsage,
  apiUsage: () => apiUsage,
  auditItemSchema: () => auditItemSchema,
  auditStatusSchema: () => auditStatusSchema,
  backlinkHistory: () => backlinkHistory,
  backlinkProfiles: () => backlinkProfiles,
  backlinks: () => backlinks,
  competitorAnalysisResultSchema: () => competitorAnalysisResultSchema,
  competitorMetaSchema: () => competitorMetaSchema,
  competitorRankings: () => competitorRankings,
  competitorSchema: () => competitorSchema,
  competitorUrlSchema: () => competitorUrlSchema,
  contactPageAuditSchema: () => contactPageAuditSchema,
  contentAnalysisSchema: () => contentAnalysisSchema,
  contentAnnotationSchema: () => contentAnnotationSchema,
  contentSectionSchema: () => contentSectionSchema,
  crawlAlerts: () => crawlAlerts,
  crawlJobs: () => crawlJobs,
  crawlMetrics: () => crawlMetrics,
  crawlSources: () => crawlSources,
  crawledContent: () => crawledContent,
  dataQualityReports: () => dataQualityReports,
  deepContentAnalysisSchema: () => deepContentAnalysisSchema,
  eatAnalysisSchema: () => eatAnalysisSchema,
  enhancedContentAnalysisSchema: () => enhancedContentAnalysisSchema,
  imageAnalysisSchema: () => imageAnalysisSchema,
  insertAnalysisSchema: () => insertAnalysisSchema,
  insertBacklinkProfileSchema: () => insertBacklinkProfileSchema,
  insertBacklinkSchema: () => insertBacklinkSchema,
  insertCompetitorRankingSchema: () => insertCompetitorRankingSchema,
  insertCrawlAlertSchema: () => insertCrawlAlertSchema,
  insertCrawlJobSchema: () => insertCrawlJobSchema,
  insertCrawlMetricsSchema: () => insertCrawlMetricsSchema,
  insertCrawlSourceSchema: () => insertCrawlSourceSchema,
  insertCrawledContentSchema: () => insertCrawledContentSchema,
  insertKeywordMetricsSchema: () => insertKeywordMetricsSchema,
  insertKeywordRankingSchema: () => insertKeywordRankingSchema,
  insertKeywordSchema: () => insertKeywordSchema,
  insertKeywordSuggestionSchema: () => insertKeywordSuggestionSchema,
  insertLearningLessonSchema: () => insertLearningLessonSchema,
  insertLearningModuleSchema: () => insertLearningModuleSchema,
  insertLearningPathModuleSchema: () => insertLearningPathModuleSchema,
  insertLearningPathSchema: () => insertLearningPathSchema,
  insertLessonQuizSchema: () => insertLessonQuizSchema,
  insertOutgoingLinkSchema: () => insertOutgoingLinkSchema,
  insertProjectAnalysisSchema: () => insertProjectAnalysisSchema,
  insertProjectSchema: () => insertProjectSchema,
  insertUserLearningProgressSchema: () => insertUserLearningProgressSchema,
  insertUserLearningRecommendationSchema: () => insertUserLearningRecommendationSchema,
  insertUserSchema: () => insertUserSchema,
  internalLinksAnalysisSchema: () => internalLinksAnalysisSchema,
  keywordAnalysisSchema: () => keywordAnalysisSchema,
  keywordMetrics: () => keywordMetrics,
  keywordRankings: () => keywordRankings,
  keywordSuggestions: () => keywordSuggestions,
  keywords: () => keywords,
  learningLessons: () => learningLessons,
  learningModules: () => learningModules,
  learningPathModules: () => learningPathModules,
  learningPaths: () => learningPaths,
  lessonQuizzes: () => lessonQuizzes,
  locationPagesAuditSchema: () => locationPagesAuditSchema,
  loginUserSchema: () => loginUserSchema,
  metaTagsAnalysisSchema: () => metaTagsAnalysisSchema,
  mobileAnalysisSchema: () => mobileAnalysisSchema,
  onPageAuditSchema: () => onPageAuditSchema,
  outgoingLinks: () => outgoingLinks,
  pageSpeedAnalysisSchema: () => pageSpeedAnalysisSchema,
  projectAnalyses: () => projectAnalyses,
  projects: () => projects,
  rivalAuditSchema: () => rivalAuditSchema,
  schemaMarkupAnalysisSchema: () => schemaMarkupAnalysisSchema,
  seoAnalysisResultSchema: () => seoAnalysisResultSchema,
  seoImportanceSchema: () => seoImportanceSchema,
  seoScoreSchema: () => seoScoreSchema,
  serviceAreaPagesAuditSchema: () => serviceAreaPagesAuditSchema,
  servicePagesAuditSchema: () => servicePagesAuditSchema,
  sessions: () => sessions,
  structureNavigationAuditSchema: () => structureNavigationAuditSchema,
  technicalSeoAnalysisSchema: () => technicalSeoAnalysisSchema,
  updateKeywordSchema: () => updateKeywordSchema,
  updateProjectSchema: () => updateProjectSchema,
  updateUserSchema: () => updateUserSchema,
  urlFormSchema: () => urlFormSchema,
  userEngagementAnalysisSchema: () => userEngagementAnalysisSchema,
  userLearningProgress: () => userLearningProgress,
  userLearningRecommendations: () => userLearningRecommendations,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, index, real, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var apiUsage = pgTable("api_usage", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"),
  // in milliseconds
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  apiProvider: text("api_provider").notNull(),
  // e.g., 'dataforseo', 'backlinks', 'keyword', 'internal'
  requestData: jsonb("request_data"),
  // request parameters (sanitized)
  responseData: jsonb("response_data"),
  // limited response data (sanitized)
  errorMessage: text("error_message"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  estimatedCost: real("estimated_cost"),
  // estimated cost in USD
  usageMetrics: jsonb("usage_metrics")
  // detailed usage metrics (tokens, requests, etc.)
});
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  // Replit Auth uses string IDs
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
  role: text("role").default("user")
  // Roles: user, admin
});
var analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  userId: text("user_id").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  overallScore: integer("overall_score").notNull(),
  results: jsonb("results").notNull()
});
var projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var projectAnalyses = pgTable("project_analyses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  analysisId: integer("analysis_id").notNull().references(() => analyses.id),
  addedAt: timestamp("added_at").defaultNow().notNull()
});
var insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  timestamp: true
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true
});
var updateUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  password: true,
  username: true,
  email: true,
  isEmailVerified: true
});
var loginUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6)
});
var insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var updateProjectSchema = createInsertSchema(projects).omit({
  id: true,
  userId: true,
  createdAt: true
});
var insertProjectAnalysisSchema = createInsertSchema(projectAnalyses).omit({
  id: true,
  addedAt: true
});
var anonChatUsage = pgTable("anon_chat_usage", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  sessionId: text("session_id").notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
  resetDate: timestamp("reset_date")
});
var backlinkProfiles = pgTable("backlink_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastScanAt: timestamp("last_scan_at"),
  scanFrequency: text("scan_frequency").default("weekly"),
  // daily, weekly, monthly
  emailAlerts: boolean("email_alerts").default(false),
  domainAuthority: integer("domain_authority"),
  totalBacklinks: integer("total_backlinks").default(0),
  newBacklinks: integer("new_backlinks").default(0),
  lostBacklinks: integer("lost_backlinks").default(0),
  dofollow: integer("dofollow").default(0),
  nofollow: integer("nofollow").default(0)
});
var backlinks = pgTable("backlinks", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => backlinkProfiles.id),
  sourceUrl: text("source_url").notNull(),
  sourceDomain: text("source_domain").notNull(),
  targetUrl: text("target_url").notNull(),
  firstDiscovered: timestamp("first_discovered").defaultNow().notNull(),
  lastChecked: timestamp("last_checked").defaultNow().notNull(),
  status: text("status").default("active"),
  // active, lost, redirected
  anchorText: text("anchor_text"),
  isDofollow: boolean("is_dofollow").default(false),
  pageAuthority: integer("page_authority"),
  domainAuthority: integer("domain_authority"),
  linkPosition: text("link_position"),
  // header, body, footer, sidebar
  linkType: text("link_type"),
  // text, image, button
  surroundingText: text("surrounding_text")
});
var backlinkHistory = pgTable("backlink_history", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => backlinkProfiles.id),
  scanDate: timestamp("scan_date").defaultNow().notNull(),
  totalBacklinks: integer("total_backlinks").default(0),
  newBacklinks: integer("new_backlinks").default(0),
  lostBacklinks: integer("lost_backlinks").default(0),
  dofollow: integer("dofollow").default(0),
  nofollow: integer("nofollow").default(0),
  topReferringDomains: jsonb("top_referring_domains"),
  domainAuthority: integer("domain_authority")
});
var outgoingLinks = pgTable("outgoing_links", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => backlinkProfiles.id),
  sourceUrl: text("source_url").notNull(),
  targetUrl: text("target_url").notNull(),
  targetDomain: text("target_domain").notNull(),
  firstDiscovered: timestamp("first_discovered").defaultNow().notNull(),
  lastChecked: timestamp("last_checked").defaultNow().notNull(),
  status: text("status").default("active"),
  // active, broken, redirected
  anchorText: text("anchor_text"),
  isDofollow: boolean("is_dofollow").default(true),
  targetPageAuthority: integer("target_page_authority"),
  targetDomainAuthority: integer("target_domain_authority")
});
var insertBacklinkProfileSchema = createInsertSchema(backlinkProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastScanAt: true,
  totalBacklinks: true,
  newBacklinks: true,
  lostBacklinks: true,
  dofollow: true,
  nofollow: true
});
var insertBacklinkSchema = createInsertSchema(backlinks).omit({
  id: true,
  firstDiscovered: true,
  lastChecked: true
});
var insertOutgoingLinkSchema = createInsertSchema(outgoingLinks).omit({
  id: true,
  firstDiscovered: true,
  lastChecked: true
});
var urlFormSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  includeCompetitorAnalysis: z.boolean().optional().default(false)
});
var updateKeywordSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  url: z.string().url("Valid URL is required")
});
var seoScoreSchema = z.object({
  score: z.number().min(0).max(100),
  category: z.enum(["excellent", "good", "needs-work", "poor"])
});
var keywordAnalysisSchema = z.object({
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
  overallScore: seoScoreSchema
});
var metaTagsAnalysisSchema = z.object({
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
  overallScore: seoScoreSchema
});
var contentAnalysisSchema = z.object({
  wordCount: z.number(),
  paragraphCount: z.number(),
  headingStructure: z.object({
    h1Count: z.number(),
    h2Count: z.number(),
    h3Count: z.number(),
    h4Count: z.number(),
    h5Count: z.number(),
    h6Count: z.number()
  }),
  readabilityScore: z.number(),
  hasMultimedia: z.boolean(),
  overallScore: seoScoreSchema
});
var internalLinksAnalysisSchema = z.object({
  count: z.number(),
  uniqueCount: z.number(),
  hasProperAnchors: z.boolean(),
  brokenLinksCount: z.number(),
  overallScore: seoScoreSchema
});
var imageAnalysisSchema = z.object({
  count: z.number(),
  withAltCount: z.number(),
  withoutAltCount: z.number(),
  optimizedCount: z.number(),
  unoptimizedCount: z.number(),
  overallScore: seoScoreSchema
});
var schemaMarkupAnalysisSchema = z.object({
  hasSchemaMarkup: z.boolean(),
  types: z.array(z.string()).optional(),
  overallScore: seoScoreSchema
});
var mobileAnalysisSchema = z.object({
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
  overallScore: seoScoreSchema
});
var pageSpeedAnalysisSchema = z.object({
  score: z.number(),
  lcp: z.number().optional(),
  // Largest Contentful Paint
  fid: z.number().optional(),
  // First Input Delay
  cls: z.number().optional(),
  // Cumulative Layout Shift
  ttfb: z.number().optional(),
  // Time to First Byte
  overallScore: seoScoreSchema
});
var userEngagementAnalysisSchema = z.object({
  potentialBounceRate: z.number().optional(),
  estimatedReadTime: z.number().optional(),
  overallScore: seoScoreSchema
});
var eatAnalysisSchema = z.object({
  hasAuthorInfo: z.boolean().optional(),
  hasExternalCitations: z.boolean().optional(),
  hasCredentials: z.boolean().optional(),
  overallScore: seoScoreSchema
});
var contentAnnotationSchema = z.object({
  content: z.string(),
  issue: z.string(),
  suggestion: z.string(),
  position: z.number(),
  severity: z.enum(["high", "medium", "low"]),
  type: z.enum(["structure", "readability", "semantics", "engagement"])
});
var contentSectionSchema = z.object({
  title: z.string().optional(),
  content: z.string(),
  annotations: z.array(contentAnnotationSchema).optional()
});
var enhancedContentAnalysisSchema = z.object({
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
var technicalSeoAnalysisSchema = z.object({
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
var deepContentAnalysisSchema = z.object({
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
  category: z.enum(["excellent", "good", "needs-work", "poor"])
});
var seoAnalysisResultSchema = z.object({
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
  }).optional()
});
var competitorSchema = z.object({
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
var competitorUrlSchema = z.object({
  url: z.string(),
  name: z.string()
});
var auditStatusSchema = z.enum([
  "Priority OFI",
  // Critical finding, corrective action strongly recommended
  "OFI",
  // Opportunity for improvement
  "OK",
  // No issues found / Complete
  "N/A"
  // Not applicable
]);
var seoImportanceSchema = z.enum([
  "High",
  "Medium",
  "Low"
]);
var auditItemSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  status: auditStatusSchema,
  importance: seoImportanceSchema,
  notes: z.string().optional()
});
var onPageAuditSchema = z.object({
  items: z.array(auditItemSchema)
});
var structureNavigationAuditSchema = z.object({
  items: z.array(auditItemSchema)
});
var contactPageAuditSchema = z.object({
  items: z.array(auditItemSchema)
});
var servicePagesAuditSchema = z.object({
  items: z.array(auditItemSchema)
});
var locationPagesAuditSchema = z.object({
  items: z.array(auditItemSchema)
});
var serviceAreaPagesAuditSchema = z.object({
  items: z.array(auditItemSchema)
});
var rivalAuditSchema = z.object({
  url: z.string(),
  timestamp: z.date().optional().default(() => /* @__PURE__ */ new Date()),
  onPage: onPageAuditSchema,
  structureNavigation: structureNavigationAuditSchema,
  contactPage: contactPageAuditSchema,
  servicePages: servicePagesAuditSchema,
  locationPages: locationPagesAuditSchema,
  serviceAreaPages: serviceAreaPagesAuditSchema.optional(),
  reachedMaxPages: z.boolean().optional(),
  // Flag to indicate if crawler reached page limit
  summary: z.object({
    priorityOfiCount: z.number(),
    ofiCount: z.number(),
    okCount: z.number(),
    naCount: z.number(),
    total: z.number().optional()
  })
});
var competitorMetaSchema = z.object({
  totalResults: z.number(),
  analyzedResults: z.number(),
  searchQuery: z.string(),
  error: z.string().optional()
});
var competitorAnalysisResultSchema = z.object({
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
var keywords = pgTable("keywords", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  keyword: text("keyword").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  targetUrl: text("target_url").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes")
}, (table) => {
  return [
    unique().on(table.userId, table.keyword, table.targetUrl)
  ];
});
var keywordMetrics = pgTable("keyword_metrics", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id").references(() => keywords.id).notNull(),
  searchVolume: integer("search_volume"),
  // Monthly US search volume
  globalSearchVolume: integer("global_search_volume"),
  keywordDifficulty: integer("keyword_difficulty"),
  // 0-100 scale
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  cpc: real("cpc"),
  // Cost per click
  competition: real("competition"),
  // 0-1 scale
  trendsData: jsonb("trends_data"),
  // Historical search volume data
  relatedKeywords: jsonb("related_keywords")
  // Array of related keywords with metrics
});
var keywordRankings = pgTable("keyword_rankings", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id").references(() => keywords.id).notNull(),
  rank: integer("rank"),
  // Position in search results (null if not in top 100)
  rankingUrl: text("ranking_url"),
  // URL that's actually ranking
  previousRank: integer("previous_rank"),
  // Position from previous check
  rankDate: date("rank_date").defaultNow().notNull(),
  searchEngine: text("search_engine").default("google").notNull(),
  // google, bing, etc.
  device: text("device").default("desktop").notNull(),
  // desktop, mobile
  location: text("location").default("us").notNull(),
  // Country or region code
  serp: jsonb("serp"),
  // SERP features and snippets
  localRank: integer("local_rank")
  // Position in local pack if applicable
}, (table) => {
  return [
    index("idx_ranking_keyword_date").on(table.keywordId, table.rankDate)
  ];
});
var competitorRankings = pgTable("competitor_rankings", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id").references(() => keywords.id).notNull(),
  competitorUrl: text("competitor_url").notNull(),
  rank: integer("rank"),
  // Competitor position in search results
  rankDate: date("rank_date").defaultNow().notNull(),
  searchEngine: text("search_engine").default("google").notNull(),
  device: text("device").default("desktop").notNull(),
  location: text("location").default("us").notNull()
}, (table) => {
  return [
    index("idx_competitor_keyword_date").on(table.keywordId, table.competitorUrl, table.rankDate)
  ];
});
var keywordSuggestions = pgTable("keyword_suggestions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  baseKeyword: text("base_keyword").notNull(),
  suggestedKeyword: text("suggested_keyword").notNull(),
  searchVolume: integer("search_volume"),
  keywordDifficulty: integer("keyword_difficulty"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  source: text("source").default("related").notNull(),
  // related, question, autocomplete
  saved: boolean("saved").default(false).notNull()
});
var insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertKeywordMetricsSchema = createInsertSchema(keywordMetrics).omit({
  id: true,
  lastUpdated: true
});
var insertKeywordRankingSchema = createInsertSchema(keywordRankings).omit({
  id: true,
  rankDate: true
});
var insertCompetitorRankingSchema = createInsertSchema(competitorRankings).omit({
  id: true,
  rankDate: true
});
var insertKeywordSuggestionSchema = createInsertSchema(keywordSuggestions).omit({
  id: true,
  createdAt: true
});
var learningModules = pgTable("learning_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  difficulty: text("difficulty").notNull().default("beginner"),
  // beginner, intermediate, advanced
  estimatedTime: integer("estimated_time").notNull(),
  // in minutes
  prerequisiteIds: integer("prerequisite_ids").array(),
  // array of module IDs that should be completed first
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => users.id)
});
var learningLessons = pgTable("learning_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  estimatedTime: integer("estimated_time").notNull(),
  // in minutes
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => users.id)
});
var lessonQuizzes = pgTable("lesson_quizzes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => learningLessons.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull(),
  // array of options
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var userLearningProgress = pgTable("user_learning_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  lessonId: integer("lesson_id").notNull().references(() => learningLessons.id),
  status: text("status").notNull().default("not_started"),
  // not_started, in_progress, completed
  completionPercentage: integer("completion_percentage").notNull().default(0),
  quizScore: integer("quiz_score"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  notes: text("notes")
}, (table) => {
  return {
    userModuleLessonIdx: index("user_module_lesson_idx").on(
      table.userId,
      table.moduleId,
      table.lessonId
    )
  };
});
var learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  targetAudience: text("target_audience"),
  // beginner, business owner, seo specialist, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => users.id)
});
var learningPathModules = pgTable("learning_path_modules", {
  id: serial("id").primaryKey(),
  pathId: integer("path_id").notNull().references(() => learningPaths.id),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  sortOrder: integer("sort_order").notNull().default(0),
  isRequired: boolean("is_required").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => {
  return {
    pathModuleIdx: unique("path_module_idx").on(table.pathId, table.moduleId)
  };
});
var userLearningRecommendations = pgTable("user_learning_recommendations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  reasonCode: text("reason_code").notNull(),
  // based_on_analysis, based_on_interests, based_on_industry, etc.
  reasonText: text("reason_text").notNull(),
  priority: integer("priority").notNull().default(5),
  // 1-10, higher is more important
  analysisId: integer("analysis_id").references(() => analyses.id),
  // if recommendation is based on a specific analysis
  isCompleted: boolean("is_completed").notNull().default(false),
  isDismmised: boolean("is_dismissed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  clickedAt: timestamp("clicked_at")
}, (table) => {
  return {
    userModuleIdx: index("user_module_recommendation_idx").on(
      table.userId,
      table.moduleId
    )
  };
});
var insertLearningModuleSchema = createInsertSchema(learningModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertLearningLessonSchema = createInsertSchema(learningLessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertLessonQuizSchema = createInsertSchema(lessonQuizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUserLearningProgressSchema = createInsertSchema(userLearningProgress).omit({
  id: true,
  startedAt: true,
  completedAt: true,
  lastAccessedAt: true
});
var insertLearningPathSchema = createInsertSchema(learningPaths).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertLearningPathModuleSchema = createInsertSchema(learningPathModules).omit({
  id: true,
  createdAt: true
});
var insertUserLearningRecommendationSchema = createInsertSchema(userLearningRecommendations).omit({
  id: true,
  createdAt: true,
  clickedAt: true
});
var crawlSources = pgTable("crawl_sources", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // news, seo, competitor
  url: text("url").notNull(),
  config: jsonb("config").notNull(),
  // selectors and other configuration
  isActive: boolean("is_active").default(true).notNull(),
  lastCrawled: timestamp("last_crawled"),
  crawlFrequency: text("crawl_frequency").default("daily").notNull(),
  // hourly, daily, weekly
  maxRetries: integer("max_retries").default(3).notNull(),
  timeoutMs: integer("timeout_ms").default(3e4).notNull(),
  respectRobots: boolean("respect_robots").default(true).notNull(),
  userAgent: text("user_agent"),
  headers: jsonb("headers"),
  // custom headers
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => users.id)
});
var crawlJobs = pgTable("crawl_jobs", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // news, seo, competitor, custom
  schedule: text("schedule").notNull(),
  // cron expression
  isActive: boolean("is_active").default(true).notNull(),
  config: jsonb("config").notNull(),
  // job-specific configuration
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  retryAttempts: integer("retry_attempts").default(0).notNull(),
  maxRetries: integer("max_retries").default(3).notNull(),
  successCount: integer("success_count").default(0).notNull(),
  errorCount: integer("error_count").default(0).notNull(),
  averageDuration: integer("average_duration").default(0).notNull(),
  // milliseconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => users.id)
});
var crawledContent = pgTable("crawled_content", {
  id: text("id").primaryKey().notNull(),
  type: text("type").notNull(),
  // news, seo, competitor
  source: text("source").notNull(),
  // source name or identifier
  url: text("url").notNull(),
  title: text("title"),
  content: text("content"),
  // main content text
  metadata: jsonb("metadata"),
  // structured data from crawl
  qualityScore: integer("quality_score"),
  // 0-100 quality assessment
  isStale: boolean("is_stale").default(false).notNull(),
  isDuplicate: boolean("is_duplicate").default(false).notNull(),
  duplicateOf: text("duplicate_of").references(() => crawledContent.id),
  wordCount: integer("word_count"),
  readingTime: integer("reading_time"),
  // minutes
  languageCode: text("language_code").default("en"),
  sentiment: text("sentiment"),
  // positive, negative, neutral
  entities: jsonb("entities"),
  // extracted entities
  keywords: jsonb("keywords"),
  // extracted keywords
  images: jsonb("images"),
  // image metadata
  links: jsonb("links"),
  // internal/external links
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  crawledAt: timestamp("crawled_at").defaultNow().notNull()
}, (table) => {
  return [
    index("idx_content_type").on(table.type),
    index("idx_content_source").on(table.source),
    index("idx_content_url").on(table.url),
    index("idx_content_crawled_at").on(table.crawledAt),
    index("idx_content_quality").on(table.qualityScore),
    unique("unique_url_source").on(table.url, table.source)
  ];
});
var crawlMetrics = pgTable("crawl_metrics", {
  id: serial("id").primaryKey(),
  jobId: text("job_id").references(() => crawlJobs.id),
  sourceId: text("source_id").references(() => crawlSources.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  // milliseconds
  status: text("status").notNull(),
  // success, error, timeout, cancelled
  itemsProcessed: integer("items_processed").default(0).notNull(),
  itemsSuccessful: integer("items_successful").default(0).notNull(),
  itemsFailed: integer("items_failed").default(0).notNull(),
  bytesDownloaded: integer("bytes_downloaded").default(0).notNull(),
  pagesVisited: integer("pages_visited").default(0).notNull(),
  errorMessage: text("error_message"),
  errorType: text("error_type"),
  // network, timeout, parsing, validation
  resourceUsage: jsonb("resource_usage"),
  // memory, cpu metrics
  metadata: jsonb("metadata"),
  // additional metrics data
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => {
  return [
    index("idx_metrics_job_time").on(table.jobId, table.startTime),
    index("idx_metrics_status").on(table.status),
    index("idx_metrics_date").on(table.startTime)
  ];
});
var crawlAlerts = pgTable("crawl_alerts", {
  id: text("id").primaryKey().notNull(),
  ruleId: text("rule_id").notNull(),
  ruleName: text("rule_name").notNull(),
  severity: text("severity").notNull(),
  // low, medium, high, critical
  message: text("message").notNull(),
  jobId: text("job_id").references(() => crawlJobs.id),
  sourceId: text("source_id").references(() => crawlSources.id),
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolved: boolean("resolved").default(false).notNull(),
  metadata: jsonb("metadata"),
  // alert-specific data
  notificationsSent: jsonb("notifications_sent"),
  // tracking sent notifications
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => {
  return [
    index("idx_alerts_severity").on(table.severity),
    index("idx_alerts_resolved").on(table.resolved),
    index("idx_alerts_triggered").on(table.triggeredAt)
  ];
});
var dataQualityReports = pgTable("data_quality_reports", {
  id: serial("id").primaryKey(),
  totalRecords: integer("total_records").notNull(),
  validRecords: integer("valid_records").notNull(),
  invalidRecords: integer("invalid_records").notNull(),
  duplicateRecords: integer("duplicate_records").notNull(),
  staleRecords: integer("stale_records").notNull(),
  qualityScore: integer("quality_score").notNull(),
  // 0-100
  issues: jsonb("issues").notNull(),
  // array of quality issues
  recommendations: jsonb("recommendations"),
  // improvement suggestions
  contentDistribution: jsonb("content_distribution"),
  // type breakdown
  recentActivity: jsonb("recent_activity"),
  // activity metrics
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  reportType: text("report_type").default("scheduled").notNull(),
  // scheduled, manual, triggered
  triggeredBy: text("triggered_by").references(() => users.id)
}, (table) => {
  return [
    index("idx_quality_generated").on(table.generatedAt),
    index("idx_quality_score").on(table.qualityScore)
  ];
});
var insertCrawlSourceSchema = createInsertSchema(crawlSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastCrawled: true
});
var insertCrawlJobSchema = createInsertSchema(crawlJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRun: true,
  nextRun: true,
  retryAttempts: true,
  successCount: true,
  errorCount: true,
  averageDuration: true
});
var insertCrawledContentSchema = createInsertSchema(crawledContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  crawledAt: true,
  isStale: true,
  isDuplicate: true
});
var insertCrawlMetricsSchema = createInsertSchema(crawlMetrics).omit({
  id: true,
  createdAt: true
});
var insertCrawlAlertSchema = createInsertSchema(crawlAlerts).omit({
  id: true,
  createdAt: true,
  triggeredAt: true,
  resolved: true
});

// server/lib/database.ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var { Pool } = pg;
var DATABASE_CONFIG = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  // Maximum number of connections in the pool
  min: 2,
  // Minimum number of connections in the pool
  idleTimeoutMillis: 3e4,
  // Close connections after 30 seconds of inactivity
  connectionTimeoutMillis: 1e4,
  // How long to wait for a connection
  statement_timeout: 3e4,
  // 30 second statement timeout
  query_timeout: 3e4,
  // 30 second query timeout
  application_name: "rival-outranker"
};
var DatabaseManager = class _DatabaseManager {
  static instance;
  pool = null;
  db = null;
  isHealthy = false;
  lastHealthCheck = 0;
  healthCheckInterval = 3e4;
  // 30 seconds
  constructor() {
  }
  static getInstance() {
    if (!_DatabaseManager.instance) {
      _DatabaseManager.instance = new _DatabaseManager();
    }
    return _DatabaseManager.instance;
  }
  async initialize() {
    if (!process.env.DATABASE_URL) {
      console.warn(
        "\u26A0\uFE0F  DATABASE_URL not set. Database features will be disabled. Core SEO analysis will work with sample data."
      );
      console.warn("To enable full features, set DATABASE_URL in your .env file");
      this.createMockDatabase();
      return;
    }
    try {
      this.pool = new Pool(DATABASE_CONFIG);
      this.db = drizzle({ client: this.pool, schema: schema_exports });
      await this.healthCheck();
      console.log("\u2705 Database connection pool initialized successfully");
      setInterval(() => this.healthCheck(), this.healthCheckInterval);
    } catch (error) {
      console.error("\u274C Failed to initialize database:", error);
      this.createMockDatabase();
    }
  }
  createMockDatabase() {
    this.pool = {
      query: () => {
        throw new Error("Database not configured. Set DATABASE_URL environment variable.");
      },
      connect: () => {
        throw new Error("Database not configured. Set DATABASE_URL environment variable.");
      },
      end: () => Promise.resolve()
    };
    this.db = {
      select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: () => ({ offset: () => Promise.resolve([]) }) }) }) }) }),
      insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
      delete: () => ({ where: () => Promise.resolve([]) }),
      $with: () => ({ qb: { select: () => ({ from: () => Promise.resolve([]) }) } })
    };
  }
  async healthCheck() {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isHealthy;
    }
    this.lastHealthCheck = now;
    if (!this.pool || !process.env.DATABASE_URL) {
      this.isHealthy = false;
      return false;
    }
    try {
      const client = await this.pool.connect();
      await client.query("SELECT 1");
      client.release();
      this.isHealthy = true;
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      this.isHealthy = false;
      return false;
    }
  }
  getPool() {
    return this.pool;
  }
  getDb() {
    return this.db;
  }
  isConnected() {
    return this.isHealthy;
  }
  async getConnectionInfo() {
    if (!this.pool || !process.env.DATABASE_URL) {
      return { isConnected: false };
    }
    try {
      return {
        isConnected: this.isHealthy,
        poolSize: this.pool.totalCount || 0,
        idleConnections: this.pool.idleCount || 0,
        totalConnections: this.pool.totalCount || 0
      };
    } catch {
      return { isConnected: false };
    }
  }
  async close() {
    if (this.pool && typeof this.pool.end === "function") {
      try {
        await this.pool.end();
        console.log("\u2705 Database connection pool closed");
      } catch (error) {
        console.error("\u274C Error closing database pool:", error);
      }
    }
  }
};
var dbManager = DatabaseManager.getInstance();
var db = () => dbManager.getDb();

// server/storage.ts
import { eq, desc, and, inArray, sql, asc, gte, lte } from "drizzle-orm";
var db2 = db();
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    try {
      const results = await db2.select().from(users).where(eq(users.id, id));
      return results[0];
    } catch (error) {
      console.error("Error fetching user:", error);
      if (error.message && error.message.includes('column "role" does not exist')) {
        const results = await db2.select({
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        }).from(users).where(eq(users.id, id));
        if (results[0]) {
          return {
            ...results[0],
            role: "user",
            // Default role
            password: void 0,
            company: null,
            jobTitle: null,
            bio: null,
            websiteUrl: null,
            lastLoginAt: null,
            isEmailVerified: false,
            chatUsageCount: 0,
            chatUsageResetDate: null
          };
        }
      }
      return void 0;
    }
  }
  async getUserByUsername(username) {
    const results = await db2.select().from(users).where(eq(users.username, username));
    return results[0];
  }
  async getUserByEmail(email) {
    const results = await db2.select().from(users).where(eq(users.email, email));
    return results[0];
  }
  async createUser(insertUser) {
    const [user] = await db2.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, userData) {
    const [user] = await db2.update(users).set({
      ...userData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return user;
  }
  async updateLastLogin(id) {
    const [user] = await db2.update(users).set({
      lastLoginAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return user;
  }
  async verifyEmail(id) {
    const [user] = await db2.update(users).set({
      isEmailVerified: true,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return user;
  }
  async updateUserRole(id, role) {
    try {
      const [user] = await db2.update(users).set({
        role,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, id)).returning();
      return user;
    } catch (error) {
      console.error("Error updating user role:", error);
      if (error.message && error.message.includes('column "role" does not exist')) {
        const existingUser = await this.getUser(id);
        if (existingUser) {
          return {
            ...existingUser,
            role,
            // Set the requested role in the response
            updatedAt: /* @__PURE__ */ new Date()
          };
        }
      }
      throw error;
    }
  }
  async getUserCount() {
    const result = await db2.select({ count: sql`count(*)` }).from(users);
    return result[0].count;
  }
  async upsertUser(userData) {
    const existingUser = await this.getUser(userData.id);
    if (existingUser) {
      const [user] = await db2.update(users).set({
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, userData.id)).returning();
      return user;
    } else {
      const [user] = await db2.insert(users).values({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      return user;
    }
  }
  // Analysis operations
  async createAnalysis(analysis) {
    const [result] = await db2.insert(analyses).values({
      ...analysis,
      timestamp: /* @__PURE__ */ new Date()
    }).returning();
    return result;
  }
  async getAnalysis(id) {
    const results = await db2.select().from(analyses).where(eq(analyses.id, id));
    return results[0];
  }
  async getAnalysesByUrl(url) {
    return await db2.select().from(analyses).where(eq(analyses.url, url)).orderBy(desc(analyses.timestamp));
  }
  async getAnalysesByUserId(userId) {
    return await db2.select().from(analyses).where(eq(analyses.userId, userId)).orderBy(desc(analyses.timestamp));
  }
  async getLatestAnalyses(limit) {
    return await db2.select().from(analyses).orderBy(desc(analyses.timestamp)).limit(limit);
  }
  async getAllAnalyses() {
    return await db2.select().from(analyses).orderBy(desc(analyses.timestamp));
  }
  async updateAnalysisResults(id, results) {
    const [updatedAnalysis] = await db2.update(analyses).set({ results }).where(eq(analyses.id, id)).returning();
    return updatedAnalysis;
  }
  async updateAnalysis(id, analysisData) {
    const [updatedAnalysis] = await db2.update(analyses).set(analysisData).where(eq(analyses.id, id)).returning();
    return updatedAnalysis;
  }
  // Project operations
  async createProject(project) {
    const [result] = await db2.insert(projects).values({
      ...project,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return result;
  }
  async getProject(id) {
    const results = await db2.select().from(projects).where(eq(projects.id, id));
    return results[0];
  }
  async getProjectsByUserId(userId) {
    return await db2.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
  }
  async updateProject(id, projectData) {
    const [result] = await db2.update(projects).set({
      ...projectData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(projects.id, id)).returning();
    return result;
  }
  async deleteProject(id) {
    await db2.delete(projects).where(eq(projects.id, id));
  }
  // Project-Analysis operations
  async addAnalysisToProject(projectAnalysis) {
    const [result] = await db2.insert(projectAnalyses).values({
      ...projectAnalysis,
      addedAt: /* @__PURE__ */ new Date()
    }).returning();
    return result;
  }
  async removeAnalysisFromProject(projectId, analysisId) {
    await db2.delete(projectAnalyses).where(
      and(
        eq(projectAnalyses.projectId, projectId),
        eq(projectAnalyses.analysisId, analysisId)
      )
    );
  }
  async getProjectAnalyses(projectId) {
    const projectAnalysesResults = await db2.select().from(projectAnalyses).where(eq(projectAnalyses.projectId, projectId));
    if (projectAnalysesResults.length === 0) {
      return [];
    }
    const analysisIds = projectAnalysesResults.map((pa) => pa.analysisId);
    return await db2.select().from(analyses).where(inArray(analyses.id, analysisIds)).orderBy(desc(analyses.timestamp));
  }
  // Keyword operations
  async createKeyword(keyword) {
    const [result] = await db2.insert(keywords).values(keyword).returning();
    return result;
  }
  async getKeyword(id) {
    const [result] = await db2.select().from(keywords).where(eq(keywords.id, id));
    return result;
  }
  async getKeywordsByUserId(userId) {
    return await db2.select().from(keywords).where(eq(keywords.userId, userId)).orderBy(desc(keywords.createdAt));
  }
  async getKeywordsByProjectId(projectId) {
    return await db2.select().from(keywords).where(eq(keywords.projectId, projectId)).orderBy(desc(keywords.createdAt));
  }
  async getKeywordsByKeywordText(keyword) {
    return await db2.select().from(keywords).where(eq(keywords.keyword, keyword)).orderBy(desc(keywords.createdAt));
  }
  async updateKeyword(id, keywordData) {
    const [result] = await db2.update(keywords).set({
      ...keywordData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(keywords.id, id)).returning();
    return result;
  }
  async deleteKeyword(id) {
    await db2.delete(keywords).where(eq(keywords.id, id));
  }
  // Keyword Metrics operations
  async createKeywordMetrics(metrics) {
    const [result] = await db2.insert(keywordMetrics).values(metrics).returning();
    return result;
  }
  async getKeywordMetrics(keywordId) {
    const [result] = await db2.select().from(keywordMetrics).where(eq(keywordMetrics.keywordId, keywordId));
    return result;
  }
  async updateKeywordMetrics(keywordId, metricsData) {
    const [result] = await db2.update(keywordMetrics).set({
      ...metricsData,
      lastUpdated: /* @__PURE__ */ new Date()
    }).where(eq(keywordMetrics.keywordId, keywordId)).returning();
    return result;
  }
  // Keyword Rankings operations
  async createKeywordRanking(ranking) {
    const [result] = await db2.insert(keywordRankings).values(ranking).returning();
    return result;
  }
  async getKeywordRankings(keywordId, limit) {
    if (limit) {
      return await db2.select().from(keywordRankings).where(eq(keywordRankings.keywordId, keywordId)).orderBy(desc(keywordRankings.rankDate)).limit(limit);
    } else {
      return await db2.select().from(keywordRankings).where(eq(keywordRankings.keywordId, keywordId)).orderBy(desc(keywordRankings.rankDate));
    }
  }
  async getLatestKeywordRanking(keywordId) {
    const [result] = await db2.select().from(keywordRankings).where(eq(keywordRankings.keywordId, keywordId)).orderBy(desc(keywordRankings.rankDate)).limit(1);
    return result;
  }
  async getRankingHistory(keywordId, startDate, endDate) {
    if (startDate && endDate) {
      return await db2.select().from(keywordRankings).where(
        and(
          eq(keywordRankings.keywordId, keywordId),
          gte(keywordRankings.rankDate, startDate.toISOString().split("T")[0]),
          lte(keywordRankings.rankDate, endDate.toISOString().split("T")[0])
        )
      ).orderBy(asc(keywordRankings.rankDate));
    } else if (startDate) {
      return await db2.select().from(keywordRankings).where(
        and(
          eq(keywordRankings.keywordId, keywordId),
          gte(keywordRankings.rankDate, startDate.toISOString().split("T")[0])
        )
      ).orderBy(asc(keywordRankings.rankDate));
    } else if (endDate) {
      return await db2.select().from(keywordRankings).where(
        and(
          eq(keywordRankings.keywordId, keywordId),
          lte(keywordRankings.rankDate, endDate.toISOString().split("T")[0])
        )
      ).orderBy(asc(keywordRankings.rankDate));
    } else {
      return await db2.select().from(keywordRankings).where(eq(keywordRankings.keywordId, keywordId)).orderBy(asc(keywordRankings.rankDate));
    }
  }
  // Competitor Rankings operations
  async createCompetitorRanking(ranking) {
    const [result] = await db2.insert(competitorRankings).values(ranking).returning();
    return result;
  }
  async getCompetitorRankings(keywordId, competitorUrl, limit) {
    if (limit) {
      return await db2.select().from(competitorRankings).where(
        and(
          eq(competitorRankings.keywordId, keywordId),
          eq(competitorRankings.competitorUrl, competitorUrl)
        )
      ).orderBy(desc(competitorRankings.rankDate)).limit(limit);
    } else {
      return await db2.select().from(competitorRankings).where(
        and(
          eq(competitorRankings.keywordId, keywordId),
          eq(competitorRankings.competitorUrl, competitorUrl)
        )
      ).orderBy(desc(competitorRankings.rankDate));
    }
  }
  async getCompetitorRankingsByKeyword(keywordId) {
    return await db2.select().from(competitorRankings).where(eq(competitorRankings.keywordId, keywordId)).orderBy(desc(competitorRankings.rankDate));
  }
  async getLatestCompetitorRanking(keywordId, competitorUrl) {
    const [result] = await db2.select().from(competitorRankings).where(
      and(
        eq(competitorRankings.keywordId, keywordId),
        eq(competitorRankings.competitorUrl, competitorUrl)
      )
    ).orderBy(desc(competitorRankings.rankDate)).limit(1);
    return result;
  }
  // Keyword Suggestions operations
  async createKeywordSuggestion(suggestion) {
    const [result] = await db2.insert(keywordSuggestions).values(suggestion).returning();
    return result;
  }
  async getKeywordSuggestions(userId, baseKeyword) {
    return await db2.select().from(keywordSuggestions).where(
      and(
        eq(keywordSuggestions.userId, userId),
        eq(keywordSuggestions.baseKeyword, baseKeyword)
      )
    ).orderBy(desc(keywordSuggestions.createdAt));
  }
  async saveKeywordSuggestion(id) {
    const [result] = await db2.update(keywordSuggestions).set({ saved: true }).where(eq(keywordSuggestions.id, id)).returning();
    return result;
  }
  async deleteKeywordSuggestion(id) {
    await db2.delete(keywordSuggestions).where(eq(keywordSuggestions.id, id));
  }
  // Chat usage tracking methods
  async incrementUserChatCount(userId) {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const now = /* @__PURE__ */ new Date();
    const resetDate = user.chatUsageResetDate;
    let newCount = 1;
    if (resetDate && resetDate > now) {
      newCount = (user.chatUsageCount || 0) + 1;
    } else {
      const nextMonth = /* @__PURE__ */ new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
    }
    const [updated] = await db2.update(users).set({
      chatUsageCount: newCount,
      chatUsageResetDate: resetDate && resetDate > now ? resetDate : new Date((/* @__PURE__ */ new Date()).setMonth((/* @__PURE__ */ new Date()).getMonth() + 1)),
      updatedAt: now
    }).where(eq(users.id, userId)).returning();
    return updated.chatUsageCount || 0;
  }
  async getUserChatCount(userId) {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const now = /* @__PURE__ */ new Date();
    const resetDate = user.chatUsageResetDate;
    if (resetDate && resetDate < now) {
      await db2.update(users).set({
        chatUsageCount: 0,
        chatUsageResetDate: new Date((/* @__PURE__ */ new Date()).setMonth((/* @__PURE__ */ new Date()).getMonth() + 1)),
        updatedAt: now
      }).where(eq(users.id, userId));
      return 0;
    }
    return user.chatUsageCount || 0;
  }
  async resetUserChatCount(userId) {
    await db2.update(users).set({
      chatUsageCount: 0,
      chatUsageResetDate: new Date((/* @__PURE__ */ new Date()).setMonth((/* @__PURE__ */ new Date()).getMonth() + 1)),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId));
  }
  async getAnonChatUsage(sessionId, ipAddress) {
    const [usage] = await db2.select().from(anonChatUsage).where(
      and(
        eq(anonChatUsage.sessionId, sessionId),
        eq(anonChatUsage.ipAddress, ipAddress)
      )
    );
    if (usage && usage.resetDate && usage.resetDate < /* @__PURE__ */ new Date()) {
      await this.resetAnonChatCount(sessionId, ipAddress);
      const [refreshed] = await db2.select().from(anonChatUsage).where(
        and(
          eq(anonChatUsage.sessionId, sessionId),
          eq(anonChatUsage.ipAddress, ipAddress)
        )
      );
      return refreshed;
    }
    return usage;
  }
  async incrementAnonChatCount(sessionId, ipAddress) {
    let usage = await this.getAnonChatUsage(sessionId, ipAddress);
    const now = /* @__PURE__ */ new Date();
    if (!usage) {
      const nextMonth = /* @__PURE__ */ new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const [newUsage] = await db2.insert(anonChatUsage).values({
        sessionId,
        ipAddress,
        usageCount: 1,
        lastUsed: now,
        resetDate: nextMonth
      }).returning();
      return newUsage.usageCount;
    } else {
      const [updated] = await db2.update(anonChatUsage).set({
        usageCount: usage.usageCount + 1,
        lastUsed: now
      }).where(
        and(
          eq(anonChatUsage.sessionId, sessionId),
          eq(anonChatUsage.ipAddress, ipAddress)
        )
      ).returning();
      return updated.usageCount;
    }
  }
  async resetAnonChatCount(sessionId, ipAddress) {
    const nextMonth = /* @__PURE__ */ new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    await db2.update(anonChatUsage).set({
      usageCount: 0,
      lastUsed: /* @__PURE__ */ new Date(),
      resetDate: nextMonth
    }).where(
      and(
        eq(anonChatUsage.sessionId, sessionId),
        eq(anonChatUsage.ipAddress, ipAddress)
      )
    );
  }
};
var storage = new DatabaseStorage();

// server/services/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_for_development";
var JWT_EXPIRES_IN = "7d";
var AuthService = class {
  /**
   * Register a new user
   */
  async register(userData) {
    if (!userData.username) {
      throw new Error("Username is required");
    }
    const existingUserByUsername = await storage.getUserByUsername(userData.username);
    if (existingUserByUsername) {
      throw new Error("Username already exists");
    }
    if (userData.email) {
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        throw new Error("Email already exists");
      }
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password || "", salt);
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword
    });
    const token = this.generateToken(user);
    return { user, token };
  }
  /**
   * Login a user
   */
  async login(username, password) {
    const user = await storage.getUserByUsername(username);
    if (!user) {
      throw new Error("Invalid credentials");
    }
    if (!user.password) {
      throw new Error("Invalid credentials");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }
    await storage.updateLastLogin(user.id);
    const token = this.generateToken(user);
    return { user, token };
  }
  /**
   * Generate JWT token for a user
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      username: user.username
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }
  /**
   * Verify and decode JWT token
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }
  /**
   * Get authenticated user from token
   */
  async getUserFromToken(token) {
    const decoded = this.verifyToken(token);
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }
};
var authService = new AuthService();

// server/middleware/auth.ts
var authenticate = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const user = await authService.getUserFromToken(token);
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Invalid authentication" });
  }
};

// netlify/functions/auth-user.ts
var handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
      },
      body: ""
    };
  }
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ message: "Method not allowed" })
    };
  }
  try {
    const mockReq = {
      headers: event.headers,
      user: null
    };
    const mockRes = {
      status: (code) => ({
        json: (data) => ({ statusCode: code, body: JSON.stringify(data) })
      }),
      json: (data) => ({ statusCode: 200, body: JSON.stringify(data) })
    };
    return new Promise((resolve) => {
      authenticate(mockReq, mockRes, async () => {
        try {
          if (!mockReq.user?.userId) {
            resolve({
              statusCode: 401,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              },
              body: JSON.stringify({ message: "Unauthorized" })
            });
            return;
          }
          const userId = mockReq.user.userId;
          const user = await storage.getUser(userId);
          resolve({
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(user)
          });
        } catch (error) {
          console.error("Error fetching user:", error);
          resolve({
            statusCode: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ message: "Failed to fetch user" })
          });
        }
      });
    });
  } catch (error) {
    console.error("Auth error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        message: "Authentication failed",
        error: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
};
export {
  handler
};
