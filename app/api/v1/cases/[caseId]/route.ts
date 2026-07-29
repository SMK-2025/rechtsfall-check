import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { assessments, cases, documents, facts, payments, questions } from "../../../../../db/schema";
import { isLegalAreaId, normalizeLegalAreaId } from "../../../../../lib/legal-areas";
import { ownedCase } from "../../../../../lib/server/case-access";
import { writeAudit } from "../../../../../lib/server/audit";
import { requireApiMember, apiError } from "../../../../../lib/server/member";
import { isAdminEmail } from "../../../../../lib/server/admin";
import { enforceSameOrigin } from "../../../../../lib/server/request-security";

type Params = { params: Promise<{ caseId: string }> };
type IntakePayload = {
  topic?: string;
  eventDate?: string;
  federalState?: string;
  opposingParty?: string;
  description?: string;
  desiredOutcome?: string;
  aiConsent?: boolean;
};

export async function GET(_: Request, { params }: Params) {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const { caseId } = await params;
  const item = await ownedCase(caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  const db = getDb();
  const [documentRows, factRows, questionRows, assessmentRows, paymentRows] = await Promise.all([
    db.select({ id: documents.id, originalName: documents.originalName, mimeType: documents.mimeType, sizeBytes: documents.sizeBytes, scanStatus: documents.scanStatus, extractionStatus: documents.extractionStatus, extractionJson: documents.extractionJson, createdAt: documents.createdAt }).from(documents).where(eq(documents.caseId, caseId)),
    db.select().from(facts).where(eq(facts.caseId, caseId)),
    db.select().from(questions).where(eq(questions.caseId, caseId)).orderBy(asc(questions.createdAt)),
    db.select().from(assessments).where(eq(assessments.caseId, caseId)).orderBy(asc(assessments.version)),
    db.select({
      status: payments.status,
      amountCents: payments.amountCents,
      currency: payments.currency,
      receiptUrl: payments.receiptUrl,
      invoiceNumber: payments.invoiceNumber,
      invoiceStatus: payments.invoiceStatus,
      invoicePdfUrl: payments.invoicePdfUrl,
      hostedInvoiceUrl: payments.hostedInvoiceUrl,
      refundedAmountCents: payments.refundedAmountCents,
      updatedAt: payments.updatedAt,
    }).from(payments).where(and(eq(payments.caseId, caseId), eq(payments.ownerId, member.id)))
      .orderBy(desc(payments.createdAt)).limit(1),
  ]);
  const canAnalyzeWithoutPayment = isAdminEmail(member.email);
  return Response.json({
    case: item,
    access: { canAnalyzeWithoutPayment, reason: canAnalyzeWithoutPayment ? "ADMIN_TEST_ACCESS" : null },
    documents: documentRows, facts: factRows, questions: questionRows, assessments: assessmentRows,
    payment: paymentRows[0] || null,
  }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request, { params }: Params) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const { caseId } = await params;
  const item = await ownedCase(caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  if (item.status === "ASSESSMENT_READY" || item.status === "ESCALATED") {
    return apiError("CASE_FINALIZED", 409, "Dieser Rechtsfall-Check wurde final eingereicht und kann nicht mehr bearbeitet werden.");
  }
  const body = await request.json() as { title?: string; status?: string; legalArea?: string; intake?: IntakePayload };
  const allowedStatus = ["DRAFT", "INTAKE", "NEEDS_INFORMATION", "ANALYZING", "ANALYSIS_FAILED", "ESCALATED", "ASSESSMENT_READY", "READY_FOR_REVIEW"];
  const title = body.title?.trim() ?? item.title;
  const status = body.status ?? (body.intake && item.status === "READY_FOR_REVIEW" ? "INTAKE" : item.status);
  const legalArea = normalizeLegalAreaId(body.legalArea ?? item.legalArea);
  if (!title || title.length > 160 || !allowedStatus.includes(status) || !isLegalAreaId(legalArea)) {
    return apiError("INVALID_UPDATE", 400, "Ungültige Änderung.");
  }
  const text = (value: string | undefined, max: number) => value?.trim().slice(0, max) || "";
  const existingIntake = item.intakeJson as Record<string, unknown>;
  const previousConsentAt = typeof existingIntake?.aiConsentAt === "string" ? existingIntake.aiConsentAt : undefined;
  const intake = body.intake ? {
    topic: text(body.intake.topic, 160),
    eventDate: text(body.intake.eventDate, 10),
    federalState: text(body.intake.federalState, 80),
    opposingParty: text(body.intake.opposingParty, 160),
    description: text(body.intake.description, 12_000),
    desiredOutcome: text(body.intake.desiredOutcome, 4_000),
    aiConsentAt: body.intake.aiConsent ? (previousConsentAt || new Date().toISOString()) : previousConsentAt,
  } : item.intakeJson;
  await getDb().update(cases).set({ title, status, legalArea, intakeJson: intake, updatedAt: new Date() }).where(and(eq(cases.id, caseId), eq(cases.ownerId, member.id)));
  await writeAudit({ caseId, actorId: member.id, eventType: body.intake ? "CASE_DRAFT_SAVED" : "CASE_UPDATED", targetType: "case", targetId: caseId, metadata: { status, legalArea } });
  if (body.intake?.aiConsent && !previousConsentAt) {
    await writeAudit({ caseId, actorId: member.id, eventType: "AI_CONSENT_RECORDED", targetType: "case", targetId: caseId });
  }
  return Response.json({ case: { ...item, title, status, legalArea, intakeJson: intake } }, { headers: { "cache-control": "no-store" } });
}

export async function DELETE(request: Request, { params }: Params) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const { caseId } = await params;
  const item = await ownedCase(caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  const now = new Date();
  await getDb().update(cases).set({ status: "DELETED", retentionUntil: now, updatedAt: now }).where(and(eq(cases.id, caseId), eq(cases.ownerId, member.id)));
  await writeAudit({ caseId, actorId: member.id, eventType: "CASE_DELETION_REQUESTED", targetType: "case", targetId: caseId });
  return new Response(null, { status: 204 });
}
