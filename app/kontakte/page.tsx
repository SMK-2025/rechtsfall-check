import type { Metadata } from "next";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { cases, lawyerLegalAreas, lawyerMatches, lawyerProfiles, lawyerSubscriptions, users } from "@/db/schema";
import { MemberFooter } from "@/app/components/member-footer";
import { MemberNavigation } from "@/app/components/member-navigation";
import { getAuthenticatedMember } from "@/lib/server/member";
import { LawyerContacts } from "./lawyer-contacts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Anwaltskontakte | Rechtsfall-Check.de", robots: { index: false, follow: false } };

export default async function ContactsPage() {
  const member = await getAuthenticatedMember();
  if (!member) redirect("/anmelden?returnTo=%2Fkontakte");
  const db = getDb();
  const lawyerView = member.accountRole === "LAWYER";
  const rows = await db.select({
    matchId: lawyerMatches.id, matchStatus: lawyerMatches.status, distanceKm: lawyerMatches.distanceKm,
    legalArea: lawyerMatches.matchedLegalArea, caseId: cases.id, caseTitle: cases.title, paymentStatus: cases.paymentStatus,
    caseOwnerId: cases.ownerId, lawyerId: lawyerMatches.lawyerId, firmName: lawyerProfiles.firmName,
    city: lawyerProfiles.city, biography: lawyerProfiles.biography, websiteUrl: lawyerProfiles.websiteUrl,
    publicEmail: lawyerProfiles.publicEmail, publicPhone: lawyerProfiles.publicPhone,
    lawyerName: users.displayName, userConsentAt: lawyerMatches.userConsentAt,
  }).from(lawyerMatches)
    .innerJoin(cases, eq(lawyerMatches.caseId, cases.id))
    .innerJoin(lawyerProfiles, eq(lawyerMatches.lawyerId, lawyerProfiles.userId))
    .innerJoin(users, eq(lawyerProfiles.userId, users.id))
    .where(lawyerView
      ? and(eq(lawyerMatches.lawyerId, member.id), inArray(lawyerMatches.status, ["CONTACT_RELEASED", "ACCEPTED"]))
      : and(eq(cases.ownerId, member.id), eq(cases.paymentStatus, "PAID"), inArray(lawyerMatches.status, ["SUGGESTED", "CONTACT_RELEASED", "ACCEPTED"])))
    .orderBy(desc(lawyerMatches.updatedAt));
  const ids = [...new Set(rows.map(row => row.lawyerId))];
  const areaRows = ids.length ? await db.select().from(lawyerLegalAreas).where(inArray(lawyerLegalAreas.lawyerId, ids)) : [];
  const activeSubscriptions = ids.length ? await db.select({ lawyerId: lawyerSubscriptions.lawyerId }).from(lawyerSubscriptions).where(and(
    inArray(lawyerSubscriptions.lawyerId, ids), inArray(lawyerSubscriptions.status, ["ACTIVE", "CANCELS_AT_TERM_END"]),
  )) : [];
  const activeIds = new Set(activeSubscriptions.map(item => item.lawyerId));
  const contacts = rows.filter(row => activeIds.has(row.lawyerId)).map(row => ({
    ...row,
    areas: areaRows.filter(area => area.lawyerId === row.lawyerId).map(area => area.legalArea),
    userConsentAt: row.userConsentAt?.toISOString() ?? null,
  }));
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || member.displayName;
  const eligibleCases = lawyerView ? [] : await db.select({ id: cases.id, title: cases.title }).from(cases).where(and(
    eq(cases.ownerId, member.id), eq(cases.paymentStatus, "PAID"), inArray(cases.status, ["ASSESSMENT_READY", "ESCALATED"]),
  )).orderBy(desc(cases.updatedAt));
  return <div className="member-shell">
    <MemberNavigation userName={name} userEmail={member.email}/>
    <main className="profile-page"><LawyerContacts initialContacts={contacts} lawyerView={lawyerView} eligibleCases={eligibleCases}/></main>
    <MemberFooter/>
  </div>;
}
