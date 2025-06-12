import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core";

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
  isDofollow: boolean("is_dofollow").default(false),
  pageAuthority: integer("page_authority"),
  domainAuthority: integer("domain_authority"),
});

// Insert schemas for backlink tracking
export const insertBacklinkProfileSchema = createInsertSchema(backlinkProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastScanAt: true,
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

// Backlink types
export type BacklinkProfile = typeof backlinkProfiles.$inferSelect;
export type InsertBacklinkProfile = z.infer<typeof insertBacklinkProfileSchema>;
export type Backlink = typeof backlinks.$inferSelect;
export type InsertBacklink = z.infer<typeof insertBacklinkSchema>;
export type BacklinkHistory = typeof backlinkHistory.$inferSelect;
export type OutgoingLink = typeof outgoingLinks.$inferSelect;
export type InsertOutgoingLink = z.infer<typeof insertOutgoingLinkSchema>;