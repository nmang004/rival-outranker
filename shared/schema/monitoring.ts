import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, index, real, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// System Metrics Table - stores historical system performance metrics
export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  
  // Performance Metrics
  avgResponseTime: real("avg_response_time").notNull(), // milliseconds
  errorRate: doublePrecision("error_rate").notNull(), // percentage (0-1)
  memoryUsage: real("memory_usage").notNull(), // percentage (0-100)
  cpuUsage: real("cpu_usage").notNull(), // percentage (0-100)
  diskUsage: real("disk_usage").notNull(), // percentage (0-100)
  
  // System Activity
  activeUsers: integer("active_users").notNull(),
  auditsInProgress: integer("audits_in_progress").notNull(),
  totalRequests: integer("total_requests").notNull(),
  successfulRequests: integer("successful_requests").notNull(),
  failedRequests: integer("failed_requests").notNull(),
  
  // Database Metrics
  dbConnections: integer("db_connections").notNull(),
  dbResponseTime: real("db_response_time").notNull(), // milliseconds
  dbQueryCount: integer("db_query_count").notNull(),
  
  // External API Metrics
  openaiCalls: integer("openai_calls").default(0),
  openaiSuccessRate: real("openai_success_rate").default(1.0),
  dataforseoCalls: integer("dataforseo_calls").default(0),
  dataforseoSuccessRate: real("dataforseo_success_rate").default(1.0),
  googleApiCalls: integer("google_api_calls").default(0),
  googleApiSuccessRate: real("google_api_success_rate").default(1.0),
  
  // Additional metrics as JSON for flexibility
  additionalMetrics: jsonb("additional_metrics"),
}, (table) => [
  index("idx_system_metrics_timestamp").on(table.timestamp),
  index("idx_system_metrics_error_rate").on(table.errorRate),
]);

// Business Metrics Table - stores business KPIs and analytics
export const businessMetrics = pgTable("business_metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  dateKey: varchar("date_key", { length: 10 }).notNull(), // YYYY-MM-DD for daily aggregation
  
  // Audit Metrics
  totalAudits: integer("total_audits").notNull(),
  successfulAudits: integer("successful_audits").notNull(),
  failedAudits: integer("failed_audits").notNull(),
  avgAuditTime: real("avg_audit_time").notNull(), // seconds
  
  // User Metrics
  activeUsers: integer("active_users").notNull(),
  newUsers: integer("new_users").notNull(),
  returningUsers: integer("returning_users").notNull(),
  userSatisfaction: real("user_satisfaction").default(0), // 0-5 rating
  
  // Revenue & Cost Metrics
  estimatedRevenue: real("estimated_revenue").default(0),
  apiCosts: real("api_costs").default(0),
  
  // Feature Usage
  basicAnalysisCount: integer("basic_analysis_count").default(0),
  deepAnalysisCount: integer("deep_analysis_count").default(0),
  auditCount: integer("audit_count").default(0),
  chatbotUsage: integer("chatbot_usage").default(0),
  
  // Quality Metrics
  avgPriorityAccuracy: real("avg_priority_accuracy").default(0), // 0-1
  templateIssueDetectionRate: real("template_issue_detection_rate").default(0), // 0-1
  
  // Additional business metrics as JSON
  additionalMetrics: jsonb("additional_metrics"),
}, (table) => [
  index("idx_business_metrics_date").on(table.dateKey),
  index("idx_business_metrics_timestamp").on(table.timestamp),
]);

// Alert History Table - stores all alerts for analysis and trending
export const alertHistory = pgTable("alert_history", {
  id: serial("id").primaryKey(),
  alertId: varchar("alert_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // error, warning, info
  severity: varchar("severity", { length: 20 }).notNull(), // low, medium, high, critical
  category: varchar("category", { length: 100 }).notNull(), // system, database, api, business
  source: varchar("source", { length: 100 }).notNull(), // component that generated the alert
  
  message: text("message").notNull(),
  description: text("description"),
  
  // Alert lifecycle
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: varchar("acknowledged_by"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  
  // Alert context
  affectedComponents: jsonb("affected_components"), // list of affected system components
  triggerMetrics: jsonb("trigger_metrics"), // metrics that triggered the alert
  resolutionActions: jsonb("resolution_actions"), // actions taken to resolve
  
  // Notification tracking
  notificationsSent: jsonb("notifications_sent"), // which channels were notified
  escalationLevel: integer("escalation_level").default(0),
  
  // Additional alert data
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_alert_history_created").on(table.createdAt),
  index("idx_alert_history_severity").on(table.severity),
  index("idx_alert_history_category").on(table.category),
  index("idx_alert_history_resolved").on(table.resolvedAt),
]);

// Performance Thresholds Table - configurable performance thresholds
export const performanceThresholds = pgTable("performance_thresholds", {
  id: serial("id").primaryKey(),
  metricName: varchar("metric_name", { length: 100 }).notNull().unique(),
  
  // Threshold levels
  goodThreshold: real("good_threshold").notNull(),
  warningThreshold: real("warning_threshold").notNull(),
  criticalThreshold: real("critical_threshold").notNull(),
  
  // Threshold metadata
  unit: varchar("unit", { length: 20 }).notNull(), // ms, %, count, etc.
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // system, business, quality
  
  // Configuration
  isEnabled: boolean("is_enabled").default(true),
  alertOnBreach: boolean("alert_on_breach").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Monitoring Configuration Table - system monitoring settings
export const monitoringConfig = pgTable("monitoring_config", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // string, number, boolean, json
  category: varchar("category", { length: 50 }).notNull(), // alerts, metrics, dashboards
  description: text("description"),
  
  // Configuration metadata
  isSecret: boolean("is_secret").default(false), // for sensitive config values
  requiresRestart: boolean("requires_restart").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertSystemMetricsSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertBusinessMetricsSchema = createInsertSchema(businessMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertAlertHistorySchema = createInsertSchema(alertHistory).omit({
  id: true,
  createdAt: true,
});

export const insertPerformanceThresholdSchema = createInsertSchema(performanceThresholds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonitoringConfigSchema = createInsertSchema(monitoringConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Select schemas
export const selectSystemMetricsSchema = createSelectSchema(systemMetrics);
export const selectBusinessMetricsSchema = createSelectSchema(businessMetrics);
export const selectAlertHistorySchema = createSelectSchema(alertHistory);
export const selectPerformanceThresholdSchema = createSelectSchema(performanceThresholds);
export const selectMonitoringConfigSchema = createSelectSchema(monitoringConfig);

// TypeScript types
export type SystemMetrics = z.infer<typeof selectSystemMetricsSchema>;
export type BusinessMetrics = z.infer<typeof selectBusinessMetricsSchema>;
export type AlertHistory = z.infer<typeof selectAlertHistorySchema>;
export type PerformanceThreshold = z.infer<typeof selectPerformanceThresholdSchema>;
export type MonitoringConfig = z.infer<typeof selectMonitoringConfigSchema>;

export type InsertSystemMetrics = z.infer<typeof insertSystemMetricsSchema>;
export type InsertBusinessMetrics = z.infer<typeof insertBusinessMetricsSchema>;
export type InsertAlertHistory = z.infer<typeof insertAlertHistorySchema>;
export type InsertPerformanceThreshold = z.infer<typeof insertPerformanceThresholdSchema>;
export type InsertMonitoringConfig = z.infer<typeof insertMonitoringConfigSchema>;