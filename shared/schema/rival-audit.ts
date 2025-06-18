import { z } from "zod";
import { pgTable, text, serial, integer, boolean, jsonb, timestamp, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { users, crawlJobs } from "../schema";

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
  notes: z.string().optional(),
  category: z.string().optional() // For enhanced categorization
});

// Enhanced audit item with scoring and analysis details
export const enhancedAuditItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  status: auditStatusSchema,
  importance: seoImportanceSchema,
  notes: z.string(),
  category: z.string(),
  score: z.number().min(0).max(100).optional(), // Numeric score for the factor
  pageUrl: z.string().optional(), // URL of the specific page where this issue was found
  pageTitle: z.string().optional(), // Title of the specific page for better identification
  pageType: z.string().optional(), // Type of page (homepage, contact, service, location, etc.)
  analysisDetails: z.object({
    actual: z.union([z.string(), z.number(), z.boolean()]).optional(),
    expected: z.union([z.string(), z.number(), z.boolean()]).optional(),
    metrics: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
  }).optional()
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

// Enhanced audit schemas with 140+ factors support
export const enhancedOnPageAuditSchema = z.object({
  items: z.array(enhancedAuditItemSchema),
  score: z.number().min(0).max(100).optional(),
  completionRate: z.number().min(0).max(100).optional()
});

export const enhancedStructureNavigationAuditSchema = z.object({
  items: z.array(enhancedAuditItemSchema),
  score: z.number().min(0).max(100).optional(),
  completionRate: z.number().min(0).max(100).optional()
});

export const enhancedContactPageAuditSchema = z.object({
  items: z.array(enhancedAuditItemSchema),
  score: z.number().min(0).max(100).optional(),
  completionRate: z.number().min(0).max(100).optional()
});

export const enhancedServicePagesAuditSchema = z.object({
  items: z.array(enhancedAuditItemSchema),
  score: z.number().min(0).max(100).optional(),
  completionRate: z.number().min(0).max(100).optional()
});

export const enhancedLocationPagesAuditSchema = z.object({
  items: z.array(enhancedAuditItemSchema),
  score: z.number().min(0).max(100).optional(),
  completionRate: z.number().min(0).max(100).optional()
});

export const enhancedServiceAreaPagesAuditSchema = z.object({
  items: z.array(enhancedAuditItemSchema),
  score: z.number().min(0).max(100).optional(),
  completionRate: z.number().min(0).max(100).optional()
});

// Page priority tiers for OFI scoring
export const pagePrioritySchema = z.enum(['1', '2', '3']).transform(val => parseInt(val));

// Page-specific issue summary for enhanced audits
export const pageIssueSummarySchema = z.object({
  pageUrl: z.string(),
  pageTitle: z.string(),
  pageType: z.string(), // homepage, contact, service, location, serviceArea
  priority: pagePrioritySchema.optional(), // Priority tier (1=high, 2=medium, 3=low)
  priorityWeight: z.number().optional(), // Weight multiplier for OFI calculation
  priorityOfiCount: z.number(),
  ofiCount: z.number(),
  okCount: z.number(),
  naCount: z.number(),
  totalIssues: z.number(),
  score: z.number().min(0).max(100).optional(),
  weightedScore: z.number().min(0).max(100).optional(), // Score after priority weighting
  topIssues: z.array(z.object({
    name: z.string(),
    status: auditStatusSchema,
    importance: seoImportanceSchema,
    category: z.string()
  })).optional() // Top 3 most critical issues for quick reference
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

// Enhanced rival audit schema with 140+ factors
export const enhancedRivalAuditSchema = z.object({
  url: z.string(),
  timestamp: z.date().optional().default(() => new Date()),
  onPage: enhancedOnPageAuditSchema,
  structureNavigation: enhancedStructureNavigationAuditSchema,
  contactPage: enhancedContactPageAuditSchema,
  servicePages: enhancedServicePagesAuditSchema,
  locationPages: enhancedLocationPagesAuditSchema,
  serviceAreaPages: enhancedServiceAreaPagesAuditSchema.optional(),
  // Enhanced audit categories
  contentQuality: z.object({
    items: z.array(enhancedAuditItemSchema)
  }).optional(),
  technicalSEO: z.object({
    items: z.array(enhancedAuditItemSchema)
  }).optional(),
  localSEO: z.object({
    items: z.array(enhancedAuditItemSchema)
  }).optional(),
  uxPerformance: z.object({
    items: z.array(enhancedAuditItemSchema)
  }).optional(),
  reachedMaxPages: z.boolean().optional(),
  summary: z.object({
    totalFactors: z.number(),
    priorityOfiCount: z.number(),
    ofiCount: z.number(),
    okCount: z.number(),
    naCount: z.number(),
    overallScore: z.number().min(0).max(100).optional(),
    weightedOverallScore: z.number().min(0).max(100).optional(), // Priority-weighted overall score
    categoryScores: z.record(z.string(), z.number()).optional(),
    priorityBreakdown: z.object({
      tier1: z.object({
        pages: z.number(),
        weight: z.number(),
        ofi: z.number()
      }),
      tier2: z.object({
        pages: z.number(),
        weight: z.number(),
        ofi: z.number()
      }),
      tier3: z.object({
        pages: z.number(),
        weight: z.number(),
        ofi: z.number()
      }),
      totalWeightedOFI: z.number(),
      normalizedOFI: z.number(),
      sizeAdjustedOFI: z.number(), // OFI after site size normalization
      confidence: z.number(), // Confidence level based on tier 1 representation
      normalizationFactors: z.object({
        sizeNormalization: z.number(),
        distributionBalance: z.number(),
        tierRepresentation: z.number()
      })
    }).optional()
  }),
  pageIssues: z.array(pageIssueSummarySchema).optional(), // Page-specific issue summaries
  analysisMetadata: z.object({
    analysisVersion: z.string().default("2.0"),
    factorCount: z.number(),
    analysisTime: z.number().optional(), // milliseconds
    crawlerStats: z.object({
      pagesCrawled: z.number(),
      pagesSkipped: z.number(),
      errorsEncountered: z.number(),
      crawlTime: z.number()
    }).optional()
  }).optional()
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


// Insert schemas for rival audit features
export const insertRivalAuditSchema = createInsertSchema(rivalAudits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  startedAt: true,
});


// Rival Audit Types
export type AuditStatus = z.infer<typeof auditStatusSchema>;
export type SeoImportance = z.infer<typeof seoImportanceSchema>;
export type AuditItem = z.infer<typeof auditItemSchema>;
export type EnhancedAuditItem = z.infer<typeof enhancedAuditItemSchema>;
export type PagePriority = z.infer<typeof pagePrioritySchema>;
export type PageIssueSummary = z.infer<typeof pageIssueSummarySchema>;
export type OnPageAudit = z.infer<typeof onPageAuditSchema>;
export type StructureNavigationAudit = z.infer<typeof structureNavigationAuditSchema>;
export type ContactPageAudit = z.infer<typeof contactPageAuditSchema>;
export type ServicePagesAudit = z.infer<typeof servicePagesAuditSchema>;
export type LocationPagesAudit = z.infer<typeof locationPagesAuditSchema>;
export type ServiceAreaPagesAudit = z.infer<typeof serviceAreaPagesAuditSchema>;
export type RivalAudit = z.infer<typeof rivalAuditSchema>;
export type EnhancedRivalAudit = z.infer<typeof enhancedRivalAuditSchema>;
export type EnhancedOnPageAudit = z.infer<typeof enhancedOnPageAuditSchema>;
export type EnhancedStructureNavigationAudit = z.infer<typeof enhancedStructureNavigationAuditSchema>;
export type EnhancedContactPageAudit = z.infer<typeof enhancedContactPageAuditSchema>;
export type EnhancedServicePagesAudit = z.infer<typeof enhancedServicePagesAuditSchema>;
export type EnhancedLocationPagesAudit = z.infer<typeof enhancedLocationPagesAuditSchema>;
export type EnhancedServiceAreaPagesAudit = z.infer<typeof enhancedServiceAreaPagesAuditSchema>;
export type RivalAuditRecord = typeof rivalAudits.$inferSelect;
export type InsertRivalAuditRecord = z.infer<typeof insertRivalAuditSchema>;
