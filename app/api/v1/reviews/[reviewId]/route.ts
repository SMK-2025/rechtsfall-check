import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, reviews } from "@/db/schema";
import { isAdminEmail } from "@/lib/server/admin";
import { apiError, requireApiMember } from "@/lib/server/member";
import { enforceSameOrigin } from "@/lib/server/request-security";
import { isReviewStatus } from "@/lib/reviews";

export async function PATCH(request: Request, context: { params: Promise<{ reviewId: string }> }) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember();
  if (!member || !isAdminEmail(member.email)) return apiError("FORBIDDEN", 403, "Keine Berechtigung.");
  const { reviewId } = await context.params;
  const body = await request.json() as { status?: unknown };
  if (!isReviewStatus(body.status) || body.status === "PENDING") return apiError("INVALID_STATUS", 400, "Bitte wählen Sie Freigeben oder Ablehnen.");
  const status = body.status;
  const now = new Date();
  const [review] = await getDb().select({ id: reviews.id }).from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  if (!review) return apiError("NOT_FOUND", 404, "Die Bewertung wurde nicht gefunden.");
  await getDb().transaction(async transaction => {
    await transaction.update(reviews).set({
      status, moderatedBy: member.id, moderatedAt: now,
      publishedAt: status === "PUBLISHED" ? now : null, updatedAt: now,
    }).where(eq(reviews.id, reviewId));
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: member.id,
      eventType: status === "PUBLISHED" ? "REVIEW_PUBLISHED" : "REVIEW_REJECTED",
      targetType: "REVIEW", targetId: reviewId, metadataJson: {},
    });
  });
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}

export async function DELETE(request: Request, context: { params: Promise<{ reviewId: string }> }) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const { reviewId } = await context.params;
  const [review] = await getDb().select({
    id: reviews.id, ownerId: reviews.ownerId, reviewType: reviews.reviewType,
  }).from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  if (!review) return apiError("NOT_FOUND", 404, "Die Bewertung wurde nicht gefunden.");
  if (review.ownerId !== member.id && !isAdminEmail(member.email)) {
    return apiError("FORBIDDEN", 403, "Keine Berechtigung.");
  }
  await getDb().transaction(async transaction => {
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: member.id, eventType: "REVIEW_DELETED",
      targetType: "REVIEW", targetId: reviewId, metadataJson: { reviewType: review.reviewType },
    });
    await transaction.delete(reviews).where(eq(reviews.id, reviewId));
  });
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
