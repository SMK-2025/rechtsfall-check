import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { lawyerLegalAreas, lawyerProfiles, lawyerSubscriptions } from "@/db/schema";
import { MemberFooter } from "@/app/components/member-footer";
import { MemberNavigation } from "@/app/components/member-navigation";
import { getAuthenticatedMember } from "@/lib/server/member";
import { LawyerProfileForm } from "./lawyer-profile-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Anwaltszugang | Rechtsfall-Check.de", robots: { index: false, follow: false } };

export default async function LawyerPage() {
  const member = await getAuthenticatedMember();
  if (!member) redirect("/anmelden?returnTo=%2Fanwalt");
  const db = getDb();
  const [profiles, areas, subscriptions] = await Promise.all([
    db.select().from(lawyerProfiles).where(eq(lawyerProfiles.userId, member.id)).limit(1),
    db.select({ legalArea: lawyerLegalAreas.legalArea }).from(lawyerLegalAreas)
      .where(eq(lawyerLegalAreas.lawyerId, member.id)),
    db.select().from(lawyerSubscriptions).where(eq(lawyerSubscriptions.lawyerId, member.id)),
  ]);
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || member.displayName;
  return <div className="member-shell">
    <MemberNavigation userName={name} userEmail={member.email}/>
    <main className="profile-page"><LawyerProfileForm initial={profiles[0] ?? null} selectedAreas={areas.map(item => item.legalArea)} subscription={subscriptions.at(-1) ?? null}/></main>
    <MemberFooter/>
  </div>;
}
