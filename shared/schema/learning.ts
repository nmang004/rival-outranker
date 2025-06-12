import { pgTable, text, serial, integer, boolean, jsonb, timestamp, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, analyses } from "../schema";

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