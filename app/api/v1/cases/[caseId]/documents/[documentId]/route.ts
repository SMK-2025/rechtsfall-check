import { del } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { cases, documents, evidenceLinks } from "@/db/schema";
import { ownedCase } from "@/lib/server/case-access";
import { writeAudit } from "@/lib/server/audit";
import { apiError, requireApiMember } from "@/lib/server/member";

type Params = { params: Promise<{ caseId: string; documentId: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const { caseId, documentId } = await params;
  const item = await ownedCase(caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  const db = getDb();
  const [document] = await db.select().from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.caseId, caseId))).limit(1);
  if (!document) return apiError("DOCUMENT_NOT_FOUND", 404, "Unterlage nicht gefunden.");
  await del(document.objectKey);
  await db.transaction(async transaction => {
    await transaction.delete(evidenceLinks).where(eq(evidenceLinks.documentId, documentId));
    await transaction.delete(documents).where(and(eq(documents.id, documentId), eq(documents.caseId, caseId)));
    await transaction.update(cases).set({ status: "NEEDS_INFORMATION", updatedAt: new Date() }).where(eq(cases.id, caseId));
  });
  await writeAudit({ caseId, actorId: member.id, eventType: "DOCUMENT_PERMANENTLY_DELETED", targetType: "document", targetId: documentId, metadata: { sha256: document.sha256, originalName: document.originalName } });
  return new Response(null, { status: 204 });
}

export async function POST(_: Request, { params }: Params) {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const { caseId, documentId } = await params;
  const item = await ownedCase(caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  const db = getDb();
  const [document] = await db.select().from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.caseId, caseId))).limit(1);
  if (!document) return apiError("DOCUMENT_NOT_FOUND", 404, "Unterlage nicht gefunden.");
  await db.update(documents).set({ extractionStatus: "PENDING", extractionJson: {}, updatedAt: new Date() }).where(eq(documents.id, documentId));
  await db.update(cases).set({ status: "NEEDS_INFORMATION", updatedAt: new Date() }).where(eq(cases.id, caseId));
  await writeAudit({ caseId, actorId: member.id, eventType: "DOCUMENT_REPROCESSING_REQUESTED", targetType: "document", targetId: documentId });
  return Response.json({ document: { ...document, extractionStatus: "PENDING", extractionJson: {} } }, { headers: { "cache-control": "no-store" } });
}
