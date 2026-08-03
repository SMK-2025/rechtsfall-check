import type { Metadata } from "next";
import { and, desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db";
import { payments, reviews, supportTickets, users } from "@/db/schema";
import { MemberFooter } from "@/app/components/member-footer";
import { MemberNavigation } from "@/app/components/member-navigation";
import { isAdminEmail } from "@/lib/server/admin";
import { getAuthenticatedMember, isMemberProfileComplete } from "@/lib/server/member";
import { ReviewsCenter } from "./reviews-center";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bewertungen", robots: { index: false, follow: false } };

export default async function ReviewsPage() {
  const member = await getAuthenticatedMember();
  if (!member) notFound();
  const admin = isAdminEmail(member.email);
  if (!admin && !isMemberProfileComplete(member)) redirect("/profil?required=1&returnTo=%2Fbewertungen");
  const db = getDb();
  const selection = {
    id: reviews.id, ownerId: reviews.ownerId, reviewType: reviews.reviewType, rating: reviews.rating,
    title: reviews.title, body: reviews.body, displayMode: reviews.displayMode, displayName: reviews.displayName,
    status: reviews.status, createdAt: reviews.createdAt, updatedAt: reviews.updatedAt,
    publishedAt: reviews.publishedAt, ownerEmail: users.email,
  };
  const [reviewRows, paidRows, ticketRows] = await Promise.all([
    admin
      ? db.select(selection).from(reviews).leftJoin(users, eq(reviews.ownerId, users.id)).orderBy(desc(reviews.createdAt)).limit(500)
      : db.select(selection).from(reviews).leftJoin(users, eq(reviews.ownerId, users.id))
        .where(eq(reviews.ownerId, member.id)).orderBy(desc(reviews.createdAt)).limit(20),
    admin ? Promise.resolve([]) : db.select({ id: payments.id }).from(payments)
      .where(and(eq(payments.ownerId, member.id), eq(payments.status, "PAID"))).limit(1),
    admin ? Promise.resolve([]) : db.select({ id: supportTickets.id }).from(supportTickets)
      .where(eq(supportTickets.ownerId, member.id)).limit(1),
  ]);
  const hasPaidCheck = admin || paidRows.length > 0;
  const hasSupport = admin || ticketRows.length > 0;
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || member.displayName;
  return <div className="member-shell">
    <MemberNavigation userName={name} userEmail={member.email} adminMode={admin} />
    <main className="reviews-page">
      <ReviewsCenter initialReviews={reviewRows} admin={admin} hasPaidCheck={hasPaidCheck} hasSupport={hasSupport} />
    </main>
    <MemberFooter />
  </div>;
}
