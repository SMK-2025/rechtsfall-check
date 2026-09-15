import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, cases, lawyerMatches } from "@/db/schema";
import { apiError, requireApiMember } from "@/lib/server/member";
import { enforceSameOrigin } from "@/lib/server/request-security";

export async function POST(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const body = await request.json().catch(() => null) as { consent?: boolean } | null;
  if (body?.consent !== true) return apiError("DISCLOSURE_CONSENT_REQUIRED", 400, "Bitte bestätigen Sie die Datenfreigabe ausdrücklich.");
  const { matchId } = await params;
  const db = getDb();
  const [row] = await db.select({ match: lawyerMatches, case: cases }).from(lawyerMatches)
    .innerJoin(cases, eq(lawyerMatches.caseId, cases.id))
    .where(and(eq(lawyerMatches.id, matchId), eq(cases.ownerId, member.id))).limit(1);
  if (!row || row.case.paymentStatus !== "PAID") return apiError("MATCH_NOT_AVAILABLE", 404, "Dieser Vorschlag ist nicht verfügbar.");
  if (!['SUGGESTED', 'CONTACT_RELEASED'].includes(row.match.status)) return apiError("MATCH_NOT_AVAILABLE", 409, "Dieser Vorschlag kann nicht mehr ausgewählt werden.");
  const now = new Date();
  await db.transaction(async transaction => {
    await transaction.update(lawyerMatches).set({
      status: "CONTACT_RELEASED", selectedByUserAt: now, userConsentAt: now,
      consentVersion: "lawyer-disclosure-v1", consentedDataJson: ["contact", "case_report"], disclosedAt: now, updatedAt: now,
    }).where(eq(lawyerMatches.id, matchId));
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(), caseId: row.case.id, actorId: member.id,
      eventType: "LAWYER_MATCH_CONTACT_RELEASED", targetType: "LAWYER_MATCH", targetId: matchId,
      metadataJson: { consentVersion: "lawyer-disclosure-v1", data: ["contact", "case_report"] },
    });
  });
  return Response.json({ ok: true, chatEnabled: true }, { headers: { "cache-control": "no-store" } });
}

