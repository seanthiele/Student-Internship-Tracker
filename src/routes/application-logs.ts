import { Router } from "express";
import { db, internshipsTable, applicationLogsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  ListApplicationLogsParams,
  CreateApplicationLogParams,
  CreateApplicationLogBody,
  DeleteApplicationLogParams,
} from "@workspace/api-zod";

const router = Router();

function mapLog(row: typeof applicationLogsTable.$inferSelect) {
  return {
    id: row.id,
    internshipId: row.internshipId,
    logType: row.logType,
    content: row.content,
    loggedAt: row.loggedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/internships/:id/logs", async (req, res) => {
  try {
    const parsed = ListApplicationLogsParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    const [internship] = await db
      .select({ id: internshipsTable.id })
      .from(internshipsTable)
      .where(eq(internshipsTable.id, parsed.data.id));
    if (!internship) return res.status(404).json({ error: "Internship not found" });

    const logs = await db
      .select()
      .from(applicationLogsTable)
      .where(eq(applicationLogsTable.internshipId, parsed.data.id))
      .orderBy(desc(applicationLogsTable.loggedAt));

    return res.json(logs.map(mapLog));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/internships/:id/logs", async (req, res) => {
  try {
    const paramsParsed = CreateApplicationLogParams.safeParse({ id: Number(req.params.id) });
    if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

    const bodyParsed = CreateApplicationLogBody.safeParse(req.body);
    if (!bodyParsed.success) return res.status(400).json({ error: "Invalid request body" });

    const [internship] = await db
      .select({ id: internshipsTable.id })
      .from(internshipsTable)
      .where(eq(internshipsTable.id, paramsParsed.data.id));
    if (!internship) return res.status(404).json({ error: "Internship not found" });

    const body = bodyParsed.data;
    const [row] = await db
      .insert(applicationLogsTable)
      .values({
        internshipId: paramsParsed.data.id,
        logType: body.logType ?? "note",
        content: body.content,
        loggedAt: body.loggedAt ? new Date(body.loggedAt) : new Date(),
      })
      .returning();

    return res.status(201).json(mapLog(row));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/internships/:id/logs/:logId", async (req, res) => {
  try {
    const parsed = DeleteApplicationLogParams.safeParse({
      id: Number(req.params.id),
      logId: Number(req.params.logId),
    });
    if (!parsed.success) return res.status(400).json({ error: "Invalid params" });

    const [row] = await db
      .delete(applicationLogsTable)
      .where(
        and(
          eq(applicationLogsTable.id, parsed.data.logId),
          eq(applicationLogsTable.internshipId, parsed.data.id)
        )
      )
      .returning();

    if (!row) return res.status(404).json({ error: "Log entry not found" });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
