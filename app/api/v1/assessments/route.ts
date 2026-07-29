import { get } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { assessments, cases, documents, facts, questions } from "../../../../db/schema";
import { getLegalArea } from "../../../../lib/legal-areas";
import { ownedCase } from "../../../../lib/server/case-access";
import { writeAudit } from "../../../../lib/server/audit";
import { requireApiMember, apiError } from "../../../../lib/server/member";
import { analyzeCase, extractLegalDocument } from "../../../../lib/services/ai-intake";
import { detectDeadlineWarnings } from "../../../../lib/services/deadline-engine";
import { getOfficialSources } from "../../../../lib/legal-sources";
import { sendTransactionalEmail } from "../../../../lib/email/sendgrid";
import { isAdminEmail } from "../../../../lib/server/admin";
import { enforceRateLimit } from "../../../../lib/server/rate-limit";
import { enforceSameOrigin } from "../../../../lib/server/request-security";
import { reportOperationalIssue } from "../../../../lib/server/operational-monitor";
import { evaluateQualityGates } from "../../../../lib/services/quality-gates";

type AssessmentBody = {
  caseId?: string; topic?: string; eventDate?: string; federalState?: string;
  opposingParty?: string; description?: string; desiredOutcome?: string;
  aiConsent?: boolean; finalSubmission?: boolean;
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
      await reportOperationalIssue({
        code: "DOCUMENT_EXTRACTION_FAILED", component: "ai", severity: "warning",
        caseId, targetId: document.id,
      });
      results.push({ fileName: document.originalName, warnings: ["Der Inhalt dieser Unterlage konnte nicht zuverlässig ausgelesen werden."] });
    }
  }
  return results;
}

export async function POST(request: Request) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const limited = await enforceRateLimit({ namespace: "assessment", identifier: member.id, limit: 12, windowSeconds: 600 });
  if (limited) return limited;
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return apiError("UNSUPPORTED_MEDIA_TYPE", 415, "JSON erwartet.");
  }
  const body = await request.json() as AssessmentBody;
  if (!body.caseId) return apiError("CASE_ID_REQUIRED", 400, "Fall-ID fehlt.");
  const item = await ownedCase(body.caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  if (item.status === "ASSESSMENT_READY" || item.status === "ESCALATED") {
    return apiError("CASE_ALREADY_FINALIZED", 409, "Dieser Rechtsfall-Check wurde bereits final eingereicht und kann nicht erneut erstellt werden.");
  }
  const adminTestAccess = isAdminEmail(member.email);
  if (item.paymentStatus !== "PAID" && !adminTestAccess && process.env.ALLOW_UNPAID_ANALYSIS !== "true") {
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
    aiConsentAt: typeof (item.intakeJson as Record<string, unknown>)?.aiConsentAt === "string"
      ? (item.intakeJson as Record<string, string>).aiConsentAt
      : new Date().toISOString(),
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
      answers: questionRows.filter(question =>
        question.status === "ANSWERED" && question.answer && !question.questionKey.startsWith("assessment_"))
        .map(question => ({ key: question.questionKey, prompt: question.prompt, answer: question.answer! })),
      documents: documentExtractions,
      allowedSources: area.sourceLabels,
      risk: area.risk,
    }, member.id);

    const now = new Date();
    const deterministicWarnings = detectDeadlineWarnings({
      legalArea: item.legalArea,
      topic: intake.topic,
      description: intake.description,
      documentText: documentExtractions.map(document => JSON.stringify(document)).join(" ").slice(0, 50_000),
    });
    const extractionFailureCount = documentExtractions.filter(document => {
      const pipeline = document.pipeline as { requiresManualReview?: boolean } | undefined;
      return pipeline?.requiresManualReview === true
        || (Array.isArray(document.warnings)
          && (document.warnings as unknown[]).some(warning =>
            String(warning).includes("nicht zuverlässig ausgelesen")
          ));
    }).length;
    const qualityGate = evaluateQualityGates({
      aiStage: analysis.stage,
      narrativeLength: intake.description.length,
      factCount: analysis.facts.length,
      evidenceCount: documentExtractions.length - extractionFailureCount,
      openRequiredQuestionCount: 0,
      unresolvedContradictions: analysis.contradictions.length,
      urgentDeadlineCount: deterministicWarnings.filter(warning => warning.urgency === "URGENT").length,
      deadlineStartKnown: Boolean(intake.eventDate),
      extractionFailureCount,
      legalSourcesApproved: process.env.LEGAL_CONTENT_APPROVED === "true",
    });
    await db.delete(questions).where(and(eq(questions.caseId, item.id), eq(questions.status, "OPEN")));
    const normalizePrompt = (prompt: string) => prompt.trim().toLocaleLowerCase("de-DE")
      .replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ");
    const seenQuestionKeys = new Set(questionRows
      .filter(question => question.status === "ANSWERED" && !question.questionKey.startsWith("assessment_"))
      .map(question => question.questionKey.trim().toLocaleLowerCase("de-DE")));
    const seenQuestionPrompts = new Set(questionRows
      .filter(question => question.status === "ANSWERED" && !question.questionKey.startsWith("assessment_"))
      .map(question => normalizePrompt(question.prompt)));
    const answeredQuestionCount = questionRows.filter(question =>
      question.status === "ANSWERED" && !question.questionKey.startsWith("assessment_")).length;
    const remainingQuestionSlots = Math.max(0, 10 - answeredQuestionCount);
    const gateQuestions = [];
    if (qualityGate.blockers.includes("INSUFFICIENT_NARRATIVE") || qualityGate.blockers.includes("INSUFFICIENT_FACTS")) {
      gateQuestions.push({
        key: "quality_missing_core_facts",
        prompt: "Bitte ergänzen Sie den Ablauf mit den wichtigsten konkreten Eckdaten: Wer hat wann was getan oder erklärt, und welche unmittelbare Folge hatte das für Sie?",
        reason: "Ohne diese Eckdaten lässt sich der geschilderte Rechtsfall nicht nachvollziehbar einordnen.",
        required: true,
      });
    }
    if (qualityGate.blockers.includes("UNRESOLVED_CONTRADICTIONS")) {
      gateQuestions.push({
        key: "quality_unresolved_contradiction",
        prompt: `Welche Darstellung trifft zu? Bitte klären Sie diesen noch widersprüchlichen Punkt: ${analysis.contradictions[0]?.slice(0, 600) || "abweichende Angaben im Sachverhalt"}`,
        reason: "Eine widersprüchliche Tatsachengrundlage darf nicht ungeklärt in den finalen Rechtsfall-Check übernommen werden.",
        required: true,
      });
    }
    if (qualityGate.blockers.includes("DEADLINE_START_UNCLEAR")) {
      gateQuestions.push({
        key: "quality_deadline_start_date",
        prompt: "An welchem genauen Datum haben Sie das betreffende Schreiben, den Bescheid oder die Kündigung erhalten?",
        reason: "Das Zugangsdatum kann für die Einschätzung einer möglicherweise laufenden Frist entscheidend sein.",
        required: true,
      });
    }
    const questionCandidates = [...analysis.questions, ...gateQuestions];
    const relevantQuestions = (!body.finalSubmission && qualityGate.decision === "NEEDS_INFORMATION" ? questionCandidates : []).filter(question => {
      const key = question.key.trim().toLocaleLowerCase("de-DE");
      const prompt = normalizePrompt(question.prompt);
      if (!key || !prompt || seenQuestionKeys.has(key) || seenQuestionPrompts.has(prompt)) return false;
      seenQuestionKeys.add(key);
      seenQuestionPrompts.add(prompt);
      return true;
    }).slice(0, remainingQuestionSlots);
    const newQuestions = relevantQuestions.map((question, index) => ({
      id: crypto.randomUUID(), caseId: item.id,
      questionKey: question.key?.slice(0, 100) || `follow_up_${Date.now()}_${index}`,
      prompt: question.prompt.slice(0, 1000), reason: question.reason.slice(0, 1000),
      required: question.required, status: "OPEN", createdAt: now, updatedAt: now,
    }));
    const informationPathExhausted = qualityGate.decision === "NEEDS_INFORMATION"
      && (remainingQuestionSlots === 0 || body.finalSubmission === true);
    const effectiveStage = qualityGate.decision === "ESCALATE" || informationPathExhausted
      ? "ESCALATE"
      : qualityGate.decision === "READY" ? "PRELIMINARY_ASSESSMENT" : "NEEDS_INFORMATION";
    if (effectiveStage === "NEEDS_INFORMATION" && !newQuestions.length) {
      return apiError("AI_INCOMPLETE_QUESTIONS", 502, "Die Analyse benötigt weitere Angaben, konnte aber keine fallbezogenen Rückfragen erzeugen. Bitte versuchen Sie es erneut.");
    }
    if (newQuestions.length) await db.insert(questions).values(newQuestions);

    await db.delete(facts).where(eq(facts.caseId, item.id));
    const factRows = analysis.facts.map(value => ({
      id: crypto.randomUUID(), caseId: item.id, predicate: "ai_extracted_fact",
      value: value.slice(0, 4000), status: "AI_EXTRACTED", confidence: 70, createdAt: now, updatedAt: now,
    }));
    if (factRows.length) await db.insert(facts).values(factRows);

    if (newQuestions.length) {
      await db.update(cases).set({ status: "NEEDS_INFORMATION", updatedAt: now }).where(eq(cases.id, item.id));
      await writeAudit({
        caseId: item.id, actorId: member.id, eventType: "FOLLOW_UP_QUESTIONS_CREATED",
        targetType: "case", targetId: item.id,
        metadata: { questionCount: newQuestions.length, documentCount: documentExtractions.length },
      });
      try {
        await sendTransactionalEmail({
          kind: "questionsReady", to: member.email, name: member.firstName || member.displayName,
          caseTitle: item.title,
          actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://rechtsfall-check.de"}/fallraum/${item.id}`,
        });
      } catch {
        await writeAudit({ caseId: item.id, actorId: member.id, eventType: "CASE_STATUS_EMAIL_FAILED", targetType: "case", targetId: item.id, metadata: { stage: "NEEDS_INFORMATION" } });
        await reportOperationalIssue({
          code: "CASE_STATUS_EMAIL_FAILED", component: "email", severity: "warning",
          caseId: item.id, targetId: item.id, metadata: { stage: "NEEDS_INFORMATION" },
        });
      }
      return Response.json({
        stage: "NEEDS_INFORMATION", readyToSubmit: false, questions: newQuestions, qualityGate,
      }, { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
    }

    if (!body.finalSubmission) {
      await db.update(cases).set({ status: "READY_FOR_REVIEW", updatedAt: now }).where(eq(cases.id, item.id));
      await writeAudit({
        caseId: item.id, actorId: member.id, eventType: "CASE_READY_FOR_FINAL_SUBMISSION",
        targetType: "case", targetId: item.id,
        metadata: { documentCount: documentExtractions.length },
      });
      return Response.json({
        stage: "READY_TO_SUBMIT", readyToSubmit: true, questions: [], qualityGate,
      }, { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
    }

    const version = 1;
    const assessmentId = crypto.randomUUID();
    const decision = effectiveStage === "ESCALATE" ? "ESCALATE" : "FINAL_FIRST_ASSESSMENT";
    const officialSources = getOfficialSources(item.legalArea);
    const payload = {
      ...analysis, stage: effectiveStage, decision, aiAssisted: true, documentCount: documentExtractions.length,
      qualityGate,
      deadlineWarnings: [...new Set([
        ...deterministicWarnings.map(warning => `${warning.headline}: ${warning.explanation}`),
        ...analysis.deadlineWarnings,
      ])],
      officialSources,
      deadlineCandidates: deterministicWarnings,
      legalArea: item.legalArea, generatedAt: now.toISOString(),
    };
    const status = effectiveStage === "ESCALATE" ? "ESCALATED" : "ASSESSMENT_READY";
    await db.transaction(async transaction => {
      await transaction.delete(assessments).where(eq(assessments.caseId, item.id));
      await transaction.insert(assessments).values({
        id: assessmentId, caseId: item.id, version, decision, payloadJson: payload,
        legalContentVersion: process.env.LEGAL_CONTENT_VERSION || "LEGAL_REVIEW_REQUIRED-unapproved-0",
        createdAt: now, updatedAt: now,
      });
      await transaction.update(cases).set({ status, updatedAt: now }).where(eq(cases.id, item.id));
    });
    await writeAudit({
      caseId: item.id, actorId: member.id, eventType: "FINAL_ASSESSMENT_CREATED",
      targetType: "assessment", targetId: assessmentId,
      metadata: {
        version, stage: effectiveStage, questionCount: newQuestions.length,
        documentCount: documentExtractions.length, qualityDecision: qualityGate.decision,
        qualityBlockers: qualityGate.blockers.join(","), qualityWarnings: qualityGate.warnings.join(","),
        accessMode: adminTestAccess && item.paymentStatus !== "PAID" ? "ADMIN_TEST" : "PAID",
      },
    });
    try {
      await sendTransactionalEmail({
        kind: "reportReady",
        to: member.email,
        name: member.firstName || member.displayName,
        caseTitle: item.title,
        actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://rechtsfall-check.de"}/fallraum/${item.id}/bericht`,
      });
      await writeAudit({ caseId: item.id, actorId: member.id, eventType: "CASE_STATUS_EMAIL_SENT", targetType: "assessment", targetId: assessmentId, metadata: { stage: effectiveStage } });
    } catch {
      await writeAudit({ caseId: item.id, actorId: member.id, eventType: "CASE_STATUS_EMAIL_FAILED", targetType: "assessment", targetId: assessmentId, metadata: { stage: effectiveStage } });
      await reportOperationalIssue({
        code: "CASE_STATUS_EMAIL_FAILED", component: "email", severity: "warning",
        caseId: item.id, targetId: assessmentId, metadata: { stage: effectiveStage },
      });
    }
    return Response.json({ ...payload, assessmentId, version, questions: newQuestions }, {
      headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
    });
  } catch {
    await db.update(cases).set({ status: "ANALYSIS_FAILED", updatedAt: new Date() }).where(eq(cases.id, item.id));
    await writeAudit({ caseId: item.id, actorId: member.id, eventType: "AI_ANALYSIS_FAILED", targetType: "case", targetId: item.id });
    await reportOperationalIssue({
      code: "AI_ANALYSIS_FAILED", component: "ai", severity: "high",
      caseId: item.id, targetId: item.id,
    });
    return apiError("AI_ANALYSIS_FAILED", 502, "Die KI-Analyse konnte nicht zuverlässig abgeschlossen werden. Ihre Angaben und Unterlagen bleiben gespeichert; bitte starten Sie die Analyse erneut.");
  }
}
