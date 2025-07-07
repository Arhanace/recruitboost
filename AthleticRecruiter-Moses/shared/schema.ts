import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  json,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  gmailAccessToken: text("gmail_access_token"),
  gmailRefreshToken: text("gmail_refresh_token"),
  gmailTokenExpiry: timestamp("gmail_token_expiry"),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  gender: text("gender"),
  sport: text("sport"),
  graduationYear: integer("graduation_year"),
  position: text("position"),
  height: text("height"),
  keyStats: text("key_stats"),
  highlights: text("highlights"),
  stats: json("stats").$type<Record<string, string>>(),
  bio: text("bio"),
  avatar: text("avatar"),
  // Academic stats
  gpa: text("gpa"),
  testScores: text("test_scores"),
  academicHonors: text("academic_honors"),
  intendedMajor: text("intended_major"),
  // Additional athlete preferences
  location: text("location"),
  schoolSize: text("school_size"),
  programLevel: text("program_level"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  firebaseUid: true,
  email: true,
  // gmailAccessToken: true,
  username: true,
  firstName: true,
  lastName: true,
  gender: true,
  sport: true,
  graduationYear: true,
  position: true,
  height: true,
  keyStats: true,
  highlights: true,
  stats: true,
  bio: true,
  avatar: true,
  gpa: true,
  testScores: true,
  academicHonors: true,
  intendedMajor: true,
  location: true,
  schoolSize: true,
  programLevel: true,
});

// Coaches schema
export const coaches = pgTable("coaches", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  school: text("school").notNull(),
  sport: text("sport").notNull(),
  division: text("division"),
  conference: text("conference"),
  position: text("position"),
  state: text("state"),
  region: text("region"),
  // city and notes columns removed
  // status and favorite removed - now stored in savedCoaches
});

// Saved Coaches (relationship table between users and coaches)
export const savedCoaches = pgTable(
  "saved_coaches",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    coachId: integer("coach_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    notes: text("notes"),
    // User-specific coach properties moved from the coaches table
    status: text("status").default("Not Contacted"),
    favorite: boolean("favorite").default(false),
  },
  (table) => {
    return {
      userCoachUnique: unique().on(table.userId, table.coachId),
    };
  },
);

export const insertSavedCoachSchema = createInsertSchema(savedCoaches).pick({
  userId: true,
  coachId: true,
  notes: true,
  status: true,
  favorite: true,
});

// Foreign key relationships are handled implicitly

export const insertCoachSchema = createInsertSchema(coaches).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  school: true,
  sport: true,
  division: true,
  conference: true,
  position: true,
  state: true,
  region: true,
  // city and notes removed
  // status and favorite removed - now in savedCoaches
});

// Email Templates schema
export const emailTemplates = pgTable(
  "email_templates",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    name: text("name").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    isDefault: boolean("is_default").default(false),
  },
  (table) => {
    return {
      userNameUnique: unique().on(table.userId, table.name),
    };
  },
);

export const insertEmailTemplateSchema = createInsertSchema(
  emailTemplates,
).pick({
  userId: true,
  name: true,
  subject: true,
  body: true,
  isDefault: true,
});

// Emails schema
export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  coachId: integer("coach_id").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at").notNull(),
  status: text("status").notNull().default("sent"), // 'sent', 'draft', 'scheduled'
  templateId: integer("template_id"),
  isFollowUp: boolean("is_follow_up").default(false),
  direction: text("direction").default("outbound"), // 'outbound' or 'inbound'
  receivedAt: timestamp("received_at"),
  scheduledFor: timestamp("scheduled_for"), // When a follow-up is scheduled to be sent
  parentEmailId: integer("parent_email_id"), // Original email that this follows up
  // ← new column for Gmail message ID
  gmailMessageId: text("gmail_message_id"),
  gmailThreadId: text("gmail_thread_id"),
  hasResponded: boolean("has_responded").default(false), // Whether a response has been received
});

export const insertEmailSchema = createInsertSchema(emails).pick({
  userId: true,
  coachId: true,
  subject: true,
  body: true,
  sentAt: true,
  status: true,
  templateId: true,
  isFollowUp: true,
  direction: true,
  receivedAt: true,
  scheduledFor: true,
  parentEmailId: true,
});

// Tasks schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  coachId: integer("coach_id"), // Allowed to be null
  title: text("title").notNull(),
  dueDate: timestamp("due_date").notNull(),
  completed: boolean("completed").default(false),
  type: text("type").notNull(),
  metaData: json("meta_data").$type<Record<string, any>>(),
});

export const insertTaskSchema = createInsertSchema(tasks)
  .pick({
    userId: true,
    coachId: true,
    title: true,
    dueDate: true,
    completed: true,
    type: true,
    metaData: true,
  })
  .transform((data) => {
    // If dueDate is a string, convert it to Date
    if (data.dueDate && typeof data.dueDate === "string") {
      return {
        ...data,
        dueDate: new Date(data.dueDate),
      };
    }
    return data;
  });

// Activities schema
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  coachId: integer("coach_id"),
  type: text("type").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metaData: json("meta_data").$type<Record<string, any>>(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  coachId: true,
  type: true,
  description: true,
  timestamp: true,
  metaData: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Coach = typeof coaches.$inferSelect;
export type InsertCoach = z.infer<typeof insertCoachSchema>;
export type SavedCoach = typeof savedCoaches.$inferSelect;
export type InsertSavedCoach = z.infer<typeof insertSavedCoachSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type Email = typeof emails.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
