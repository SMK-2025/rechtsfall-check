import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, payments, reviews, supportTickets, users } from "@/db/schema";
import { isAdminEmail } from "@/lib/server/admin";
import { apiError, requireApiMember } from "@/lib/server/member";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOrigin } from "@/lib/server/request-security";
import { cleanReviewText, isReviewDisplayMode, isReviewType, publicReviewerName } from "@/lib/reviews";

export async function GET() {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const rows = isAdminEmail(member.email)
    ? await getDb().select({
      id: reviews.id, ownerId: reviews.ownerId, reviewType: reviews.reviewType,
      rating: reviews.rating, title: reviews.title, body: reviews.body,
      displayMode: reviews.displayMode, displayName: reviews.displayName,
      status: reviews.status, createdAt: reviews.createdAt, updatedAt: reviews.updatedAt,
      publishedAt: reviews.publishedAt, ownerEmail: users.email,
    }).from(reviews).leftJoin(users, eq(reviews.ownerId, users.id))
      .orderBy(desc(reviews.createdAt)).limit(500)
    : await getDb().select().from(reviews).where(eq(reviews.ownerId, member.id)).orderBy(desc(reviews.createdAt)).limit(20);
  return Response.json({ reviews: rows }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const limited = await enforceRateLimit({ namespace: "review-submit", identifier: member.id, limit: 10, windowSeconds: 3600 });
  if (limited) return limited;
  const body = await request.json() as {
    reviewType?: unknown; rating?: unknown; title?: unknown; body?: unknown;
    displayMode?: unknown; publicationConsent?: unknown;
  };
  if (!isReviewType(body.reviewType)) return apiError("INVALID_TYPE", 400, "Bitte wählen Sie einen Bewertungsbereich.");
  if (!isReviewDisplayMode(body.displayMode)) return apiError("INVALID_DISPLAY", 400, "Bitte wählen Sie die gewünschte Namensanzeige.");
  if (body.publicationConsent !== true) return apiError("CONSENT_REQUIRED", 400, "Die Veröffentlichung muss ausdrücklich bestätigt werden.");
  const reviewType = body.reviewType;
  const displayMode = body.displayMode;
  const rating = Number(body.rating);
  const title = cleanReviewText(body.title, 100);
  const reviewBody = cleanReviewText(body.body, 1200);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return apiError("INVALID_RATING", 400, "Bitte vergeben Sie 1 bis 5 Sterne.");
  if (title.length < 4 || reviewBody.length < 20) return apiError("INVALID_REVIEW", 400, "Bitte beschreiben Sie Ihre Erfahrung etwas genauer.");

  if (reviewType === "CHECK") {
    const [paid] = await getDb().select({ id: payments.id }).from(payments)
      .where(and(eq(payments.ownerId, member.id), eq(payments.status, "PAID"))).limit(1);
    if (!paid) return apiError("NOT_ELIGIBLE", 403, "Eine Bewertung des Rechtsfall-Checks ist nach einer bezahlten Fallprüfung möglich.");
  }
  if (reviewType === "SUPPORT") {
    const [ticket] = await getDb().select({ id: supportTickets.id }).from(supportTickets)
      .where(eq(supportTickets.ownerId, member.id)).limit(1);
    if (!ticket) return apiError("NOT_ELIGIBLE", 403, "Eine Supportbewertung ist nach einem eröffneten Support-Ticket möglich.");
  }
  const now = new Date();
  const displayName = publicReviewerName(displayMode, member.firstName, member.lastName);
  const [existing] = await getDb().select({ id: reviews.id, status: reviews.status }).from(reviews)
    .where(and(eq(reviews.ownerId, member.id), eq(reviews.reviewType, reviewType))).limit(1);
  if (existing?.status === "PUBLISHED") return apiError("ALREADY_PUBLISHED", 409, "Diese veröffentlichte Bewertung kann nicht mehr überschrieben werden.");
  const id = existing?.id || crypto.randomUUID();
  await getDb().transaction(async transaction => {
    if (existing) {
      await transaction.update(reviews).set({
        rating, title, body: reviewBody, displayMode, displayName, status: "PENDING",
        publicationConsentAt: now, moderatedBy: null, moderatedAt: null, publishedAt: null, updatedAt: now,
      }).where(eq(reviews.id, id));
    } else {
      await transaction.insert(reviews).values({
        id, ownerId: member.id, reviewType, rating, title, body: reviewBody,
        displayMode, displayName, status: "PENDING", publicationConsentAt: now,
        createdAt: now, updatedAt: now,
      });
    }
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: member.id, eventType: "REVIEW_SUBMITTED",
      targetType: "REVIEW", targetId: id, metadataJson: { reviewType, rating },
    });
  });
  return Response.json({ review: { id, status: "PENDING" } }, { status: existing ? 200 : 201 });
}
