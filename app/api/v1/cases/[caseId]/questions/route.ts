import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { questions } from "../../../../../../db/schema";
import { ownedCase } from "../../../../../../lib/server/case-access";
import { writeAudit } from "../../../../../../lib/server/audit";
import { apiError, requireApiMember } from "../../../../../../lib/server/member";

type Params = { params: Promise<{ caseId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const { caseId } = await params;
  const item = await ownedCase(caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  if (item.status === "ASSESSMENT_READY" || item.status === "ESCALATED") return apiError("CASE_FINALIZED", 409, "Der final eingereichte Rechtsfall-Check kann nicht mehr bearbeitet werden.");
  const body = await request.json() as { answers?: Array<{ id: string; answer: string }> };
  const answers = (body.answers || [])
    .map(item => ({ id: item.id, answer: item.answer?.trim().slice(0, 4000) }))
    .filter(item => item.id && item.answer);
  if (!answers.length) return apiError("ANSWERS_REQUIRED", 400, "Bitte beantworten Sie mindestens eine Rückfrage.");
  const ids = answers.map(item => item.id);
  const owned = await getDb().select({ id: questions.id }).from(questions)
    .where(and(eq(questions.caseId, caseId), inArray(questions.id, ids)));
  if (owned.length !== ids.length) return apiError("INVALID_QUESTION", 400, "Mindestens eine Rückfrage gehört nicht zu dieser Fallakte.");
  const now = new Date();
  await Promise.all(answers.map(item => getDb().update(questions)
    .set({ answer: item.answer, status: "ANSWERED", updatedAt: now })
    .where(and(eq(questions.id, item.id), eq(questions.caseId, caseId)))));
  await writeAudit({ caseId, actorId: member.id, eventType: "FOLLOW_UP_ANSWERS_SAVED", targetType: "case", targetId: caseId, metadata: { count: answers.length } });
  return Response.json({ saved: answers.length }, { headers: { "cache-control": "no-store" } });
}
