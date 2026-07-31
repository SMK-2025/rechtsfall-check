import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, cases } from "@/db/schema";
import { apiError, requireApiMember } from "@/lib/server/member";
import { enforceSameOrigin } from "@/lib/server/request-security";

export async function GET() {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");

  const caseRows = await getDb().select({
    id: cases.id,
    title: cases.title,
    status: cases.status,
    intakeJson: cases.intakeJson,
  }).from(cases).where(eq(cases.ownerId, member.id));

  const consentedCases = caseRows.flatMap(item => {
    const intake = item.intakeJson as Record<string, unknown>;
    if (intake.aiConsent !== true && typeof intake.aiConsentAt !== "string") return [];
    return [{
      caseId: item.id,
      title: item.title,
      status: item.status,
      consentedAt: typeof intake.aiConsentAt === "string" ? intake.aiConsentAt : null,
      revokedAt: typeof intake.aiConsentRevokedAt === "string" ? intake.aiConsentRevokedAt : null,
    }];
  });

  return Response.json({ consentedCases }, {
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

export async function DELETE(request: Request) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");

  const db = getDb();
  const caseRows = await db.select().from(cases).where(eq(cases.ownerId, member.id));
  const revokedAt = new Date();
  let changed = 0;

  await db.transaction(async transaction => {
    for (const item of caseRows) {
      const intake = item.intakeJson as Record<string, unknown>;
      const hasConsent = intake.aiConsent === true || typeof intake.aiConsentAt === "string";
      const alreadyRevoked = typeof intake.aiConsentRevokedAt === "string";
      if (!hasConsent || alreadyRevoked) continue;

      await transaction.update(cases).set({
        intakeJson: {
          ...intake,
          aiConsent: false,
          aiConsentRevokedAt: revokedAt.toISOString(),
        },
        updatedAt: revokedAt,
      }).where(eq(cases.id, item.id));
      changed += 1;
    }

    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(),
      actorId: member.id,
      eventType: "AI_CONSENT_WITHDRAWN",
      targetType: "USER",
      targetId: member.id,
      metadataJson: { affectedCaseCount: changed, futureProcessingOnly: true },
    });
  });

  return Response.json({
    revoked: true,
    affectedCaseCount: changed,
    revokedAt: revokedAt.toISOString(),
    note: "Der Widerruf gilt für zukünftige KI-Verarbeitungen. Bereits erstellte Ergebnisse bleiben bis zu ihrer Löschung Bestandteil der Fallakte.",
  }, {
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
