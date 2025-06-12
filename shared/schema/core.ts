import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, index, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Forward reference for users table (will be defined below)
// This allows circular references between tables in the same file
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

// Anonymous chat usage tracking (for non-logged in users)
export const anonChatUsage = pgTable("anon_chat_usage", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  sessionId: text("session_id").notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
  resetDate: timestamp("reset_date"),
});

// Insert and validation schemas for core domain
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