import { pgTable, serial, text, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const internshipsTable = pgTable("internships", {
  id: serial("id").primaryKey(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("applied"),
  appliedDate: date("applied_date").notNull(),
  interviewDate: date("interview_date"),
  offerDeadline: date("offer_deadline"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  location: text("location"),
  remote: boolean("remote").notNull().default(false),
  payRate: text("pay_rate"),
  applicationUrl: text("application_url"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInternshipSchema = createInsertSchema(internshipsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInternship = z.infer<typeof insertInternshipSchema>;
export type Internship = typeof internshipsTable.$inferSelect;
