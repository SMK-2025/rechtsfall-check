import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, lawyerProfiles, lawyerSubscriptions } from "@/db/schema";
import { getStripe } from "@/lib/payments";
import { apiError, requireApiMember } from "@/lib/server/member";
import { enforceSameOrigin } from "@/lib/server/request-security";

export async function POST(request: Request) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember({ allowIncompleteProfile: true });
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");

  const db = getDb();
  const [subscription] = await db.select().from(lawyerSubscriptions).where(and(
    eq(lawyerSubscriptions.lawyerId, member.id),
    inArray(lawyerSubscriptions.status, ["ACTIVE", "CANCELS_AT_TERM_END"]),
  )).orderBy(desc(lawyerSubscriptions.createdAt)).limit(1);
  if (!subscription) return apiError("NO_ACTIVE_SUBSCRIPTION", 404, "Es wurde kein aktiver Jahreszugang gefunden.");
  if (subscription.cancelsAtTermEnd) return Response.json({ ok: true, alreadyCancelled: true });
  if (!subscription.providerSubscriptionId) return apiError("SUBSCRIPTION_NOT_READY", 409, "Der Vertragsstatus ist noch nicht vollständig synchronisiert.");
  if (!subscription.cancellationDeadlineAt) return apiError("DEADLINE_UNAVAILABLE", 409, "Die Kündigungsfrist konnte noch nicht ermittelt werden.");
  if (new Date() > subscription.cancellationDeadlineAt) {
    return apiError("CANCELLATION_DEADLINE_PASSED", 409, "Die Kündigungsfrist für die laufende Vertragsperiode ist bereits abgelaufen. Bitte wenden Sie sich an den Support.");
  }
  const stripe = getStripe();
  if (!stripe) return apiError("PAYMENT_NOT_CONFIGURED", 503, "Die Vertragsverwaltung ist gerade nicht erreichbar.");

  await stripe.subscriptions.update(subscription.providerSubscriptionId, { cancel_at_period_end: true });
  const now = new Date();
  await db.transaction(async transaction => {
    await transaction.update(lawyerSubscriptions).set({
      status: "CANCELS_AT_TERM_END", cancelsAtTermEnd: true, cancellationRequestedAt: now, updatedAt: now,
    }).where(eq(lawyerSubscriptions.id, subscription.id));
    await transaction.update(lawyerProfiles).set({ updatedAt: now }).where(eq(lawyerProfiles.userId, member.id));
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: member.id, eventType: "LAWYER_SUBSCRIPTION_CANCELLATION_REQUESTED",
      targetType: "LAWYER_SUBSCRIPTION", targetId: subscription.id,
      metadataJson: { termEndsAt: subscription.termEndsAt?.toISOString() ?? null },
    });
  });
  return Response.json({ ok: true, termEndsAt: subscription.termEndsAt }, { headers: { "cache-control": "no-store" } });
}
