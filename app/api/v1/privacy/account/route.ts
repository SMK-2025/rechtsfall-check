import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, users } from "@/db/schema";
import { permanentlyDeleteAccount } from "@/lib/server/account-deletion";
import { apiError, requireApiMember } from "@/lib/server/member";
import { enforceSameOrigin } from "@/lib/server/request-security";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET() {
  const member = await requireApiMember({ allowIncompleteProfile: true });
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  return Response.json({
    deletion: {
      requestedAt: member.deletionRequestedAt?.toISOString() ?? null,
      scheduledFor: member.deletionScheduledFor?.toISOString() ?? null,
    },
  }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember({ allowIncompleteProfile: true });
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const body = await request.json().catch(() => null) as { mode?: string; confirmation?: string; acknowledged?: boolean } | null;
  if (body?.confirmation !== "LÖSCHEN" || body.acknowledged !== true) {
    return apiError("DELETION_CONFIRMATION_REQUIRED", 400, "Bestätigen Sie die Folgen und geben Sie LÖSCHEN ein.");
  }
  if (body.mode === "immediate") {
    try {
      const result = await permanentlyDeleteAccount(member.id, member.email);
      return Response.json({ deleted: true, ...result }, { headers: { "cache-control": "no-store" } });
    } catch {
      return apiError("ACCOUNT_DELETION_FAILED", 503, "Die vollständige Löschung konnte nicht abgeschlossen werden. Der Vorgang wird sicher wiederholt; bitte versuchen Sie es erneut oder kontaktieren Sie den Support.");
    }
  }
  if (body.mode !== "scheduled") return apiError("INVALID_DELETION_MODE", 400, "Ungültige Löschoption.");

  const now = new Date();
  const scheduledFor = new Date(now.getTime() + THIRTY_DAYS_MS);
  const db = getDb();
  await db.transaction(async transaction => {
    await transaction.update(users).set({ deletionRequestedAt: now, deletionScheduledFor: scheduledFor, updatedAt: now }).where(eq(users.id, member.id));
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: member.id, eventType: "ACCOUNT_DELETION_REQUESTED",
      targetType: "USER", targetId: member.id,
      metadataJson: { scheduledFor: scheduledFor.toISOString(), gracePeriodDays: 30 },
    });
  });
  return Response.json({ deleted: false, scheduledFor: scheduledFor.toISOString() }, { headers: { "cache-control": "no-store" } });
}

export async function DELETE(request: Request) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember({ allowIncompleteProfile: true });
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  if (!member.deletionScheduledFor) return apiError("NO_DELETION_REQUEST", 409, "Für dieses Konto ist keine Löschung vorgemerkt.");
  const now = new Date();
  const db = getDb();
  await db.transaction(async transaction => {
    await transaction.update(users).set({ deletionRequestedAt: null, deletionScheduledFor: null, updatedAt: now }).where(eq(users.id, member.id));
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: member.id, eventType: "ACCOUNT_DELETION_CANCELLED",
      targetType: "USER", targetId: member.id, metadataJson: {},
    });
  });
  return Response.json({ cancelled: true }, { headers: { "cache-control": "no-store" } });
}
