import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { internshipsTable } from "./internships";

export const applicationLogsTable = pgTable("application_logs", {
  id: serial("id").primaryKey(),
  internshipId: integer("internship_id").notNull().references(() => internshipsTable.id, { onDelete: "cascade" }),
  logType: text("log_type").notNull().default("note"),
  content: text("content").notNull(),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertApplicationLogSchema = createInsertSchema(applicationLogsTable).omit({ id: true, createdAt: true });
export type InsertApplicationLog = z.infer<typeof insertApplicationLogSchema>;
export type ApplicationLog = typeof applicationLogsTable.$inferSelect;
