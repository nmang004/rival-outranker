import { pgTable, text, serial, integer, boolean, timestamp, real, date, index, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core";
import { projects } from "./projects";

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

export const updateKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  userId: true,
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