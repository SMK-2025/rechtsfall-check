import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { assessments, auditEvents, cases, documents, facts, payments, questions } from "@/db/schema";
import { apiError, requireApiMember } from "@/lib/server/member";

export async function GET() {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const db = getDb();
  const caseRows = await db.select().from(cases).where(eq(cases.ownerId, member.id));
  const caseIds = caseRows.map(item => item.id);
  const empty = <T,>(query: Promise<T[]>) => caseIds.length ? query : Promise.resolve([] as T[]);
  const [documentRows, factRows, questionRows, assessmentRows, paymentRows, auditRows] = await Promise.all([
    empty(db.select({
      id: documents.id, caseId: documents.caseId, originalName: documents.originalName,
      mimeType: documents.mimeType, sizeBytes: documents.sizeBytes, sha256: documents.sha256,
      scanStatus: documents.scanStatus, extractionStatus: documents.extractionStatus,
      createdAt: documents.createdAt, updatedAt: documents.updatedAt,
    }).from(documents).where(inArray(documents.caseId, caseIds))),
    empty(db.select().from(facts).where(inArray(facts.caseId, caseIds))),
    empty(db.select().from(questions).where(inArray(questions.caseId, caseIds))),
    empty(db.select().from(assessments).where(inArray(assessments.caseId, caseIds))),
    db.select({
      id: payments.id, caseId: payments.caseId, provider: payments.provider, status: payments.status,
      amountCents: payments.amountCents, currency: payments.currency, createdAt: payments.createdAt,
    }).from(payments).where(eq(payments.ownerId, member.id)),
    db.select().from(auditEvents).where(eq(auditEvents.actorId, member.id)),
  ]);
  const payload = {
    exportInfo: { createdAt: new Date().toISOString(), formatVersion: "1.0", service: "Rechtsfall-Check.de" },
    profile: member,
    cases: caseRows,
    documents: documentRows,
    facts: factRows,
    questions: questionRows,
    assessments: assessmentRows,
    payments: paymentRows,
    auditEvents: auditRows,
    notes: ["Dateiinhalte sind aus Sicherheitsgründen nicht in diesem JSON-Export enthalten.", "Zahlungsanbieter-Geheimnisse und Sitzungstoken werden niemals exportiert."],
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="rechtsfall-check-datenexport-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
