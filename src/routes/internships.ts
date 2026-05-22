import { Router } from "express";
import { db, internshipsTable } from "@workspace/db";
import { eq, desc, ilike, or, and } from "drizzle-orm";
import {
  ListInternshipsQueryParams,
  CreateInternshipBody,
  UpdateInternshipParams,
  UpdateInternshipBody,
  DeleteInternshipParams,
  GetInternshipParams,
  GetUpcomingDeadlinesQueryParams,
} from "@workspace/api-zod";

const router = Router();

function mapInternship(row: typeof internshipsTable.$inferSelect) {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    status: row.status,
    appliedDate: row.appliedDate,
    interviewDate: row.interviewDate ?? null,
    offerDeadline: row.offerDeadline ?? null,
    startDate: row.startDate ?? null,
    endDate: row.endDate ?? null,
    location: row.location ?? null,
    remote: row.remote,
    payRate: row.payRate ?? null,
    applicationUrl: row.applicationUrl ?? null,
    contactName: row.contactName ?? null,
    contactEmail: row.contactEmail ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function getUrgency(daysUntil: number): "critical" | "high" | "medium" | "low" {
  if (daysUntil <= 1) return "critical";
  if (daysUntil <= 3) return "high";
  if (daysUntil <= 7) return "medium";
  return "low";
}

router.get("/internships", async (req, res) => {
  try {
    const parsed = ListInternshipsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query params" });
    }
    const { status, search } = parsed.data;

    const conditions = [];
    if (status) {
      conditions.push(eq(internshipsTable.status, status));
    }
    if (search) {
      conditions.push(
        or(
          ilike(internshipsTable.company, `%${search}%`),
          ilike(internshipsTable.role, `%${search}%`)
        )
      );
    }

    const rows = await db
      .select()
      .from(internshipsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(internshipsTable.updatedAt));

    return res.json(rows.map(mapInternship));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/internships", async (req, res) => {
  try {
    const parsed = CreateInternshipBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }
    const data = parsed.data;
    const [row] = await db
      .insert(internshipsTable)
      .values({
        company: data.company,
        role: data.role,
        status: data.status,
        appliedDate: data.appliedDate,
        interviewDate: data.interviewDate ?? null,
        offerDeadline: data.offerDeadline ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        location: data.location ?? null,
        remote: data.remote ?? false,
        payRate: data.payRate ?? null,
        applicationUrl: data.applicationUrl ?? null,
        contactName: data.contactName ?? null,
        contactEmail: data.contactEmail ?? null,
        notes: data.notes ?? null,
      })
      .returning();
    return res.status(201).json(mapInternship(row));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/internships/stats", async (req, res) => {
  try {
    const all = await db.select().from(internshipsTable).orderBy(desc(internshipsTable.updatedAt));

    const byStatus = {
      applied: 0,
      interviewing: 0,
      offered: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };

    for (const row of all) {
      const s = row.status as keyof typeof byStatus;
      if (s in byStatus) byStatus[s]++;
    }

    const activeApplications = byStatus.applied + byStatus.interviewing + byStatus.offered;
    const recentActivity = all.slice(0, 5).map(mapInternship);

    return res.json({
      total: all.length,
      activeApplications,
      byStatus,
      recentActivity,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/internships/deadlines", async (req, res) => {
  try {
    const parsed = GetUpcomingDeadlinesQueryParams.safeParse(req.query);
    const windowDays = parsed.success && parsed.data.days != null ? parsed.data.days : 14;

    const all = await db.select().from(internshipsTable);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + windowDays);

    const deadlines: {
      internship: ReturnType<typeof mapInternship>;
      deadlineType: "interview" | "offer_deadline";
      deadlineDate: string;
      daysUntil: number;
      urgency: "critical" | "high" | "medium" | "low";
    }[] = [];

    for (const row of all) {
      const mapped = mapInternship(row);

      if (row.interviewDate) {
        const d = new Date(row.interviewDate);
        d.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 0 && d <= cutoff) {
          deadlines.push({
            internship: mapped,
            deadlineType: "interview",
            deadlineDate: row.interviewDate,
            daysUntil,
            urgency: getUrgency(daysUntil),
          });
        }
      }

      if (row.offerDeadline) {
        const d = new Date(row.offerDeadline);
        d.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 0 && d <= cutoff) {
          deadlines.push({
            internship: mapped,
            deadlineType: "offer_deadline",
            deadlineDate: row.offerDeadline,
            daysUntil,
            urgency: getUrgency(daysUntil),
          });
        }
      }
    }

    deadlines.sort((a, b) => a.daysUntil - b.daysUntil);
    return res.json(deadlines);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/internships/:id", async (req, res) => {
  try {
    const parsed = GetInternshipParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const [row] = await db
      .select()
      .from(internshipsTable)
      .where(eq(internshipsTable.id, parsed.data.id));
    if (!row) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json(mapInternship(row));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/internships/:id", async (req, res) => {
  try {
    const paramsParsed = UpdateInternshipParams.safeParse({ id: Number(req.params.id) });
    if (!paramsParsed.success) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const bodyParsed = UpdateInternshipBody.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const updates: Partial<typeof internshipsTable.$inferInsert> = {
      updatedAt: new Date(),
    };

    const body = bodyParsed.data;
    if (body.company !== undefined) updates.company = body.company;
    if (body.role !== undefined) updates.role = body.role;
    if (body.status !== undefined) updates.status = body.status;
    if (body.appliedDate !== undefined) updates.appliedDate = body.appliedDate;
    if (body.interviewDate !== undefined) updates.interviewDate = body.interviewDate ?? null;
    if (body.offerDeadline !== undefined) updates.offerDeadline = body.offerDeadline ?? null;
    if (body.startDate !== undefined) updates.startDate = body.startDate ?? null;
    if (body.endDate !== undefined) updates.endDate = body.endDate ?? null;
    if (body.location !== undefined) updates.location = body.location ?? null;
    if (body.remote !== undefined) updates.remote = body.remote;
    if (body.payRate !== undefined) updates.payRate = body.payRate ?? null;
    if (body.applicationUrl !== undefined) updates.applicationUrl = body.applicationUrl ?? null;
    if (body.contactName !== undefined) updates.contactName = body.contactName ?? null;
    if (body.contactEmail !== undefined) updates.contactEmail = body.contactEmail ?? null;
    if (body.notes !== undefined) updates.notes = body.notes ?? null;

    const [row] = await db
      .update(internshipsTable)
      .set(updates)
      .where(eq(internshipsTable.id, paramsParsed.data.id))
      .returning();

    if (!row) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json(mapInternship(row));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/internships/:id", async (req, res) => {
  try {
    const parsed = DeleteInternshipParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const [row] = await db
      .delete(internshipsTable)
      .where(eq(internshipsTable.id, parsed.data.id))
      .returning();
    if (!row) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
