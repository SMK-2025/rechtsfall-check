import { assessLegalIntake, type AssessmentInput } from "../../../../lib/domain/assessment";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { assessments, cases, facts, questions } from "../../../../db/schema";
import { ownedCase } from "../../../../lib/server/case-access";
import { writeAudit } from "../../../../lib/server/audit";
import { requireApiMember, apiError } from "../../../../lib/server/member";
import { analyzeIntake } from "../../../../lib/services/ai-intake";

type AssessmentBody = AssessmentInput & { caseId?: string; aiConsent?: boolean };

export async function POST(request: Request) {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return apiError("UNSUPPORTED_MEDIA_TYPE", 415, "JSON erwartet.");
  const body = await request.json() as AssessmentBody;
  if (!body.caseId) return apiError("CASE_ID_REQUIRED", 400, "Fall-ID fehlt.");
  const item = await ownedCase(body.caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  if (item.paymentStatus !== "PAID" && process.env.ALLOW_UNPAID_ANALYSIS !== "true") {
    return apiError("PAYMENT_REQUIRED", 402, "Bitte schalten Sie die Fallprüfung zuerst frei.");
  }

  const input: AssessmentInput = { ...body, legalArea: item.legalArea };
  const result = assessLegalIntake(input);
  let ai = null;
  if (body.aiConsent) {
    try {
      ai = await analyzeIntake(input, member.id);
    } catch {
      await writeAudit({ caseId: item.id, actorId: member.id, eventType: "AI_INTAKE_FAILED", targetType: "case", targetId: item.id });
    }
  }
  if (ai) {
    result.facts = [...new Set([...result.facts, ...ai.facts])];
    result.missing = [...new Set([...result.missing, ...ai.missingQuestions])];
    if (ai.plainLanguageSummary) result.summary = ai.plainLanguageSummary;
  }

  const db = getDb();
  const now = new Date();
  const factRows = [
    { id: crypto.randomUUID(), caseId: item.id, predicate: "topic", value: body.topic?.trim() || "", status: "USER_ASSERTED", confidence: 100, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), caseId: item.id, predicate: "user_description", value: body.description?.trim() || "", status: "USER_ASSERTED", confidence: 100, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), caseId: item.id, predicate: "desired_outcome", value: body.desiredOutcome?.trim() || "", status: "USER_ASSERTED", confidence: 100, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), caseId: item.id, predicate: "event_date", value: body.eventDate || "", status: "USER_ASSERTED", confidence: 100, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), caseId: item.id, predicate: "federal_state", value: body.federalState || "", status: "USER_ASSERTED", confidence: 100, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), caseId: item.id, predicate: "opposing_party", value: body.opposingParty?.trim() || "", status: "USER_ASSERTED", confidence: 100, createdAt: now, updatedAt: now },
  ].filter(row => row.value);
  if (factRows.length) await db.insert(facts).values(factRows);

  const questionRows = result.missing.map((prompt, index) => ({
    id: crypto.randomUUID(),
    caseId: item.id,
    questionKey: `assessment_${Date.now()}_${index}`,
    prompt,
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  }));
  if (questionRows.length) await db.insert(questions).values(questionRows);

  const [latest] = await db.select({ version: assessments.version }).from(assessments).where(eq(assessments.caseId, item.id)).orderBy(desc(assessments.version)).limit(1);
  const version = (latest?.version || 0) + 1;
  const assessmentId = crypto.randomUUID();
  const legalContentVersion = process.env.LEGAL_CONTENT_VERSION || "DE-GENERAL-2026-07";
  await db.insert(assessments).values({
    id: assessmentId,
    caseId: item.id,
    version,
    decision: result.decision,
    payloadJson: { ...result, aiAssisted: Boolean(ai), contradictions: ai?.contradictions || [], legalArea: item.legalArea },
    legalContentVersion,
    createdAt: now,
    updatedAt: now,
  });
  const status = result.decision === "NEEDS_INFORMATION" ? "NEEDS_INFORMATION" : "READY_FOR_REVIEW";
  await db.update(cases).set({ status, updatedAt: now }).where(eq(cases.id, item.id));
  await writeAudit({ caseId: item.id, actorId: member.id, eventType: "ASSESSMENT_CREATED", targetType: "assessment", targetId: assessmentId, metadata: { version, decision: result.decision, legalContentVersion } });
  return Response.json({ ...result, assessmentId, version }, { status: 200, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}
