import { pgTable, text, serial, integer, boolean, jsonb, timestamp, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../schema";

// Crawling System Tables

// Crawl sources table - defines sources to crawl
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

// Crawl jobs table - defines scheduled crawling jobs
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

// Crawled content table - stores crawled content
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

// Crawl metrics table - tracks crawl performance metrics
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

// Crawl alerts table - stores crawling alerts and notifications
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

// Data quality reports table - stores data quality assessment reports
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