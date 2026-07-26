import type { Metadata } from "next";
import { MemberDashboard } from "../member-dashboard";
import { redirect } from "next/navigation";
import { getAuthenticatedMember } from "../../lib/server/member";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Geschützter Fallraum | Rechtsfall Check",
  description: "Strukturieren Sie Ihren Testfall im geschützten Fallraum von Rechtsfall Check.",
  robots: { index: false, follow: false },
};

export default async function CaseRoom() {
  const user = await getAuthenticatedMember();
  if (!user) {
    redirect("/anmelden?returnTo=%2Ffallraum");
  }
  return <MemberDashboard userName={user.displayName} />;
}
