import { del } from "@vercel/blob";
import { eq, lte, or } from "drizzle-orm";
import { getDb } from "@/db";
import { assessments, auditEvents, cases, documents, evidenceLinks, facts, questions } from "@/db/schema";

async function purge(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) return new Response(null, { status: 401 });
  const db = getDb();
  const now = new Date();
  const dueCases = await db.select({ id: cases.id }).from(cases)
    .where(or(eq(cases.status, "DELETED"), lte(cases.retentionUntil, now)));
  let purged = 0;
  for (const item of dueCases) {
    const documentRows = await db.select({ id: documents.id, objectKey: documents.objectKey }).from(documents).where(eq(documents.caseId, item.id));
    let blobFailure = false;
    for (const document of documentRows) {
      try { await del(document.objectKey); } catch { blobFailure = true; }
    }
    if (blobFailure) continue;
    await db.transaction(async transaction => {
      const factRows = await transaction.select({ id: facts.id }).from(facts).where(eq(facts.caseId, item.id));
      for (const fact of factRows) await transaction.delete(evidenceLinks).where(eq(evidenceLinks.factId, fact.id));
      for (const document of documentRows) await transaction.delete(evidenceLinks).where(eq(evidenceLinks.documentId, document.id));
      await transaction.delete(questions).where(eq(questions.caseId, item.id));
      await transaction.delete(assessments).where(eq(assessments.caseId, item.id));
      await transaction.delete(facts).where(eq(facts.caseId, item.id));
      await transaction.delete(documents).where(eq(documents.caseId, item.id));
      await transaction.update(cases).set({
        title: "Gelöschte Fallakte", legalArea: "other_unsure", intakeJson: {},
        status: "PURGED", retentionUntil: null, updatedAt: now,
      }).where(eq(cases.id, item.id));
      await transaction.insert(auditEvents).values({
        id: crypto.randomUUID(), caseId: item.id, eventType: "CASE_CONTENT_PURGED",
        targetType: "case", targetId: item.id, metadataJson: { automatic: true, documentCount: documentRows.length },
      });
    });
    purged += 1;
  }
  return Response.json({ purged, completedAt: now.toISOString() }, { headers: { "cache-control": "no-store" } });
}

export const GET = purge;
export const POST = purge;
