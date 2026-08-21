import { del } from "@vercel/blob";
import { eq, lte, or } from "drizzle-orm";
import { getDb } from "@/db";
import { assessments, auditEvents, cases, documents, emailDeliveryEvents, evidenceLinks, facts, questions, users } from "@/db/schema";
import { permanentlyDeleteAccount } from "@/lib/server/account-deletion";
import { reportOperationalIssue } from "@/lib/server/operational-monitor";

const DEFAULT_BATCH_SIZE = 25;
const MAX_BATCH_SIZE = 100;

function batchSize() {
  const configured = Number.parseInt(process.env.RETENTION_BATCH_SIZE || "", 10);
  return Number.isFinite(configured)
    ? Math.min(MAX_BATCH_SIZE, Math.max(1, configured))
    : DEFAULT_BATCH_SIZE;
}

async function writeSystemEvent(eventType: string, metadataJson: Record<string, unknown>, targetId?: string) {
  try {
    await getDb().insert(auditEvents).values({
      id: crypto.randomUUID(),
      eventType,
      targetType: "retention-job",
      targetId: targetId || null,
      metadataJson,
    });
  } catch {
    // The retention outcome must not be changed by a secondary observability failure.
  }
}

async function purge(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return new Response(null, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const db = getDb();
  const now = new Date();
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "true";
  const limit = batchSize();
  const dueCases = await db.select({ id: cases.id }).from(cases)
    .where(or(eq(cases.status, "DELETED"), lte(cases.retentionUntil, now)))
    .limit(limit);
  const dueAccounts = await db.select({ id: users.id, email: users.email }).from(users)
    .where(lte(users.deletionScheduledFor, now))
    .limit(limit);

  if (dryRun) {
    return Response.json({
      dryRun: true,
      dueCases: dueCases.length,
      dueAccounts: dueAccounts.length,
      batchSize: limit,
      checkedAt: now.toISOString(),
    }, { headers: { "cache-control": "no-store" } });
  }

  let casesPurged = 0;
  let caseFailures = 0;
  for (const item of dueCases) {
    try {
      const documentRows = await db.select({ id: documents.id, objectKey: documents.objectKey })
        .from(documents).where(eq(documents.caseId, item.id));
      for (const document of documentRows) await del(document.objectKey);

      await db.transaction(async transaction => {
        const factRows = await transaction.select({ id: facts.id }).from(facts).where(eq(facts.caseId, item.id));
        for (const fact of factRows) await transaction.delete(evidenceLinks).where(eq(evidenceLinks.factId, fact.id));
        for (const document of documentRows) await transaction.delete(evidenceLinks).where(eq(evidenceLinks.documentId, document.id));
        await transaction.delete(questions).where(eq(questions.caseId, item.id));
        await transaction.delete(assessments).where(eq(assessments.caseId, item.id));
        await transaction.delete(facts).where(eq(facts.caseId, item.id));
        await transaction.delete(documents).where(eq(documents.caseId, item.id));
        await transaction.delete(emailDeliveryEvents).where(eq(emailDeliveryEvents.caseId, item.id));
        await transaction.update(cases).set({
          title: "Gelöschte Fallakte",
          legalArea: "other_unsure",
          intakeJson: {},
          status: "PURGED",
          retentionUntil: null,
          updatedAt: now,
        }).where(eq(cases.id, item.id));
        await transaction.insert(auditEvents).values({
          id: crypto.randomUUID(),
          caseId: item.id,
          eventType: "CASE_CONTENT_PURGED",
          targetType: "case",
          targetId: item.id,
          metadataJson: { automatic: true, documentCount: documentRows.length },
        });
      });
      casesPurged += 1;
    } catch {
      caseFailures += 1;
      await writeSystemEvent("RETENTION_CASE_FAILED", { occurredAt: now.toISOString() }, item.id);
      await reportOperationalIssue({
        code: "RETENTION_CASE_FAILED", component: "retention", severity: "high",
        caseId: item.id, targetId: item.id,
      });
    }
  }

  let accountsPurged = 0;
  let accountFailures = 0;
  for (const account of dueAccounts) {
    try {
      await permanentlyDeleteAccount(account.id, account.email);
      accountsPurged += 1;
    } catch {
      accountFailures += 1;
      await writeSystemEvent("RETENTION_ACCOUNT_FAILED", { occurredAt: now.toISOString() }, account.id);
      await reportOperationalIssue({
        code: "RETENTION_ACCOUNT_FAILED", component: "retention", severity: "critical",
        targetId: account.id,
      });
    }
  }

  const result = {
    dryRun: false,
    casesSelected: dueCases.length,
    casesPurged,
    caseFailures,
    accountsSelected: dueAccounts.length,
    accountsPurged,
    accountFailures,
    batchSize: limit,
    completedAt: now.toISOString(),
  };
  await writeSystemEvent("RETENTION_RUN_COMPLETED", result);
  return Response.json(result, { headers: { "cache-control": "no-store" } });
}

export const GET = purge;
export const POST = purge;
