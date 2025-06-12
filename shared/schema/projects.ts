import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { users } from "./core";

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

// Insert and validation schemas for projects domain
export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  timestamp: true,
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