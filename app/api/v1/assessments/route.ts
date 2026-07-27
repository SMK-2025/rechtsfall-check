import { get } from "@vercel/blob";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { assessments, cases, documents, facts, questions } from "../../../../db/schema";
import { getLegalArea } from "../../../../lib/legal-areas";
import { ownedCase } from "../../../../lib/server/case-access";
import { writeAudit } from "../../../../lib/server/audit";
import { requireApiMember, apiError } from "../../../../lib/server/member";
import { analyzeCase, extractLegalDocument } from "../../../../lib/services/ai-intake";

type AssessmentBody = {
  caseId?: string; topic?: string; eventDate?: string; federalState?: string;
  opposingParty?: string; description?: string; desiredOutcome?: string;
  aiConsent?: boolean;
};
export const maxDuration = 60;

async function extractPendingDocuments(caseId: string, memberId: string) {
  const db = getDb();
  const rows = await db.select().from(documents).where(eq(documents.caseId, caseId));
  const results: Array<Record<string, unknown>> = [];
  for (const document of rows) {
    const existing = document.extractionJson as Record<string, unknown>;
    if (document.extractionStatus === "COMPLETED" && Object.keys(existing || {}).length) {
      results.push({ fileName: document.originalName, ...existing });
      continue;
    }
    try {
      await db.update(documents).set({ extractionStatus: "PROCESSING", updatedAt: new Date() }).where(eq(documents.id, document.id));
      const blob = await get(document.objectKey, { access: "private" });
      if (!blob || blob.statusCode !== 200 || !blob.stream) throw new Error("BLOB_NOT_AVAILABLE");
      const bytes = await new Response(blob.stream).arrayBuffer();
      const extraction = await extractLegalDocument(bytes, document.mimeType, document.originalName, memberId);
      await db.update(documents).set({
        extractionStatus: "COMPLETED", extractionJson: extraction, updatedAt: new Date(),
      }).where(eq(documents.id, document.id));
      await writeAudit({ caseId, actorId: memberId, eventType: "DOCUMENT_AI_EXTRACTED", targetType: "document", targetId: document.id });
      results.push({ fileName: document.originalName, ...extraction });
    } catch {
      await db.update(documents).set({ extractionStatus: "FAILED", updatedAt: new Date() }).where(eq(documents.id, document.id));
      await writeAudit({ caseId, actorId: memberId, eventType: "DOCUMENT_EXTRACTION_FAILED", targetType: "document", targetId: document.id });
      results.push({ fileName: document.originalName, warnings: ["Der Inhalt dieser Unterlage konnte nicht zuverlässig ausgelesen werden."] });
    }
  }
  return results;
}

export async function POST(request: Request) {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return apiError("UNSUPPORTED_MEDIA_TYPE", 415, "JSON erwartet.");
  }
  const body = await request.json() as AssessmentBody;
  if (!body.caseId) return apiError("CASE_ID_REQUIRED", 400, "Fall-ID fehlt.");
  const item = await ownedCase(body.caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  if (item.paymentStatus !== "PAID" && process.env.ALLOW_UNPAID_ANALYSIS !== "true") {
    return apiError("PAYMENT_REQUIRED", 402, "Bitte schalten Sie den Rechtsfall-Check zuerst frei.");
  }
  if (!body.aiConsent) return apiError("AI_CONSENT_REQUIRED", 400, "Für die KI-gestützte Analyse ist Ihre ausdrückliche Einwilligung erforderlich.");
  if (!process.env.OPENAI_API_KEY) {
    await writeAudit({ caseId: item.id, actorId: member.id, eventType: "AI_NOT_CONFIGURED", targetType: "case", targetId: item.id });
    return apiError("AI_NOT_CONFIGURED", 503, "Die KI-Analyse ist derzeit noch nicht freigeschaltet. Ihre Angaben bleiben gespeichert.");
  }

  const db = getDb();
  const intake = {
    topic: body.topic?.trim().slice(0, 160) || "",
    eventDate: body.eventDate?.slice(0, 10) || "",
    federalState: body.federalState?.trim().slice(0, 80) || "",
    opposingParty: body.opposingParty?.trim().slice(0, 160) || "",
    description: body.description?.trim().slice(0, 12_000) || "",
    desiredOutcome: body.desiredOutcome?.trim().slice(0, 4_000) || "",
  };
  await db.update(cases).set({ intakeJson: intake, status: "ANALYZING", updatedAt: new Date() }).where(eq(cases.id, item.id));

  const [questionRows, documentExtractions] = await Promise.all([
    db.select().from(questions).where(eq(questions.caseId, item.id)),
    extractPendingDocuments(item.id, member.id),
  ]);
  const area = getLegalArea(item.legalArea);
  try {
    const analysis = await analyzeCase({
      legalArea: area.title, ...intake,
      answers: questionRows.filter(question => question.status === "ANSWERED" && question.answer)
        .map(question => ({ prompt: question.prompt, answer: question.answer! })),
      documents: documentExtractions,
      allowedSources: area.sourceLabels,
      risk: area.risk,
    }, member.id);

    const now = new Date();
    await db.delete(questions).where(and(eq(questions.caseId, item.id), eq(questions.status, "OPEN")));
    const newQuestions = analysis.questions.slice(0, 5).map((question, index) => ({
      id: crypto.randomUUID(), caseId: item.id,
      questionKey: question.key?.slice(0, 100) || `follow_up_${Date.now()}_${index}`,
      prompt: question.prompt.slice(0, 1000), reason: question.reason.slice(0, 1000),
      required: question.required, status: "OPEN", createdAt: now, updatedAt: now,
    }));
    if (analysis.stage === "NEEDS_INFORMATION" && !newQuestions.length) {
      return apiError("AI_INCOMPLETE_QUESTIONS", 502, "Die Analyse benötigt weitere Angaben, konnte aber keine verlässlichen Rückfragen erzeugen. Bitte versuchen Sie es erneut.");
    }
    if (newQuestions.length) await db.insert(questions).values(newQuestions);

    await db.delete(facts).where(eq(facts.caseId, item.id));
    const factRows = analysis.facts.map(value => ({
      id: crypto.randomUUID(), caseId: item.id, predicate: "ai_extracted_fact",
      value: value.slice(0, 4000), status: "AI_EXTRACTED", confidence: 70, createdAt: now, updatedAt: now,
    }));
    if (factRows.length) await db.insert(facts).values(factRows);

    const [latest] = await db.select({ version: assessments.version }).from(assessments)
      .where(eq(assessments.caseId, item.id)).orderBy(desc(assessments.version)).limit(1);
    const version = (latest?.version || 0) + 1;
    const assessmentId = crypto.randomUUID();
    const decision = analysis.stage === "NEEDS_INFORMATION" ? "NEEDS_INFORMATION"
      : analysis.stage === "ESCALATE" ? "ESCALATE" : "PRELIMINARY_ONLY";
    const payload = {
      ...analysis, decision, aiAssisted: true, documentCount: documentExtractions.length,
      legalArea: item.legalArea, generatedAt: now.toISOString(),
    };
    await db.insert(assessments).values({
      id: assessmentId, caseId: item.id, version, decision, payloadJson: payload,
      legalContentVersion: process.env.LEGAL_CONTENT_VERSION || "LEGAL_REVIEW_REQUIRED-unapproved-0",
      createdAt: now, updatedAt: now,
    });
    const status = analysis.stage === "NEEDS_INFORMATION" ? "NEEDS_INFORMATION"
      : analysis.stage === "ESCALATE" ? "ESCALATED" : "ASSESSMENT_READY";
    await db.update(cases).set({ status, updatedAt: now }).where(eq(cases.id, item.id));
    await writeAudit({
      caseId: item.id, actorId: member.id, eventType: "INTERACTIVE_ASSESSMENT_CREATED",
      targetType: "assessment", targetId: assessmentId,
      metadata: { version, stage: analysis.stage, questionCount: newQuestions.length, documentCount: documentExtractions.length },
    });
    return Response.json({ ...payload, assessmentId, version, questions: newQuestions }, {
      headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
    });
  } catch {
    await db.update(cases).set({ status: "ANALYSIS_FAILED", updatedAt: new Date() }).where(eq(cases.id, item.id));
    await writeAudit({ caseId: item.id, actorId: member.id, eventType: "AI_ANALYSIS_FAILED", targetType: "case", targetId: item.id });
    return apiError("AI_ANALYSIS_FAILED", 502, "Die KI-Analyse konnte nicht zuverlässig abgeschlossen werden. Ihre Angaben und Unterlagen bleiben gespeichert; bitte starten Sie die Analyse erneut.");
  }
}
