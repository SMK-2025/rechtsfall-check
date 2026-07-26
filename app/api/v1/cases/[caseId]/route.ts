import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { assessments, cases, documents, facts, questions } from "../../../../../db/schema";
import { ownedCase } from "../../../../../lib/server/case-access";
import { writeAudit } from "../../../../../lib/server/audit";
import { requireApiMember, apiError } from "../../../../../lib/server/member";

type Params = { params: Promise<{ caseId: string }> };

export async function GET(_: Request, { params }: Params) {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const { caseId } = await params;
  const item = await ownedCase(caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  const db = getDb();
  const [documentRows, factRows, questionRows, assessmentRows] = await Promise.all([
    db.select({ id: documents.id, originalName: documents.originalName, mimeType: documents.mimeType, sizeBytes: documents.sizeBytes, scanStatus: documents.scanStatus, extractionStatus: documents.extractionStatus, createdAt: documents.createdAt }).from(documents).where(eq(documents.caseId, caseId)),
    db.select().from(facts).where(eq(facts.caseId, caseId)),
    db.select().from(questions).where(eq(questions.caseId, caseId)),
    db.select().from(assessments).where(eq(assessments.caseId, caseId)),
  ]);
  return Response.json({ case: item, documents: documentRows, facts: factRows, questions: questionRows, assessments: assessmentRows }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request, { params }: Params) {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const { caseId } = await params;
  const item = await ownedCase(caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  const body = await request.json() as { title?: string; status?: string };
  const allowedStatus = ["DRAFT", "INTAKE", "NEEDS_INFORMATION", "READY_FOR_REVIEW"];
  const title = body.title?.trim() ?? item.title;
  const status = body.status ?? item.status;
  if (!title || title.length > 160 || !allowedStatus.includes(status)) return apiError("INVALID_UPDATE", 400, "Ungültige Änderung.");
  await getDb().update(cases).set({ title, status, updatedAt: new Date() }).where(and(eq(cases.id, caseId), eq(cases.ownerId, member.id)));
  await writeAudit({ caseId, actorId: member.id, eventType: "CASE_UPDATED", targetType: "case", targetId: caseId, metadata: { status } });
  return Response.json({ case: { ...item, title, status } }, { headers: { "cache-control": "no-store" } });
}

export async function DELETE(_: Request, { params }: Params) {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const { caseId } = await params;
  const item = await ownedCase(caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  await getDb().update(cases).set({ status: "DELETED", updatedAt: new Date() }).where(and(eq(cases.id, caseId), eq(cases.ownerId, member.id)));
  await writeAudit({ caseId, actorId: member.id, eventType: "CASE_DELETION_REQUESTED", targetType: "case", targetId: caseId });
  return new Response(null, { status: 204 });
}
