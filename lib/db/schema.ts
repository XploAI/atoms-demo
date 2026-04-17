import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

/** Anonymous identity per browser. The cookie value is this row's id. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** A user's app project. `files` is the current file map: { "App.tsx": "...", ... }. */
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  prompt: text("prompt"),
  files: jsonb("files").$type<Record<string, string>>().default({}).notNull(),
  status: text("status").default("idle").notNull(), // 'idle' | 'generating' | 'ready' | 'error'
  model: text("model").default("claude-sonnet-4-6").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Each agent turn or user message. `filesDiff` snapshots files written this turn. */
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role").notNull(), // 'user' | 'planner' | 'engineer' | 'qa' | 'system'
  content: text("content").notNull(),
  filesDiff: jsonb("files_diff").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Public, read-only frozen snapshot of a project's files at share time. */
export const shares = pgTable("shares", {
  id: text("id").primaryKey(), // nanoid(8)
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  files: jsonb("files").$type<Record<string, string>>().notNull(),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Share = typeof shares.$inferSelect;
