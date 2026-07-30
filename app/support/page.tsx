import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { cases, supportTickets, users } from "@/db/schema";
import { MemberFooter } from "@/app/components/member-footer";
import { MemberNavigation } from "@/app/components/member-navigation";
import { isAdminEmail } from "@/lib/server/admin";
import { getAuthenticatedMember } from "@/lib/server/member";
import { SupportCenter } from "./support-center";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Support",
  description: "Support für Technik, Konto, Zahlung, Dokumente und Bedienung.",
  robots: { index: false, follow: false },
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  const { ticket } = await searchParams;
  const requestedTicket = typeof ticket === "string" ? ticket : "";
  const member = await getAuthenticatedMember();
  if (!member) {
    const target = requestedTicket ? `/support?ticket=${encodeURIComponent(requestedTicket)}` : "/support";
    redirect(`/anmelden?returnTo=${encodeURIComponent(target)}`);
  }
  const admin = isAdminEmail(member.email);
  const db = getDb();
  const selection = {
    id: supportTickets.id,
    ticketNumber: supportTickets.ticketNumber,
    ownerId: supportTickets.ownerId,
    caseId: supportTickets.caseId,
    category: supportTickets.category,
    subject: supportTickets.subject,
    status: supportTickets.status,
    lastMessageAt: supportTickets.lastMessageAt,
    createdAt: supportTickets.createdAt,
    updatedAt: supportTickets.updatedAt,
    ownerEmail: users.email,
    ownerFirstName: users.firstName,
    ownerLastName: users.lastName,
  };
  const [tickets, caseRows] = await Promise.all([
    admin
      ? db.select(selection).from(supportTickets).leftJoin(users, eq(supportTickets.ownerId, users.id))
        .orderBy(desc(supportTickets.lastMessageAt)).limit(500)
      : db.select(selection).from(supportTickets).leftJoin(users, eq(supportTickets.ownerId, users.id))
        .where(eq(supportTickets.ownerId, member.id))
        .orderBy(desc(supportTickets.lastMessageAt)).limit(100),
    admin
      ? Promise.resolve([])
      : db.select({ id: cases.id, title: cases.title }).from(cases)
        .where(eq(cases.ownerId, member.id)).orderBy(desc(cases.updatedAt)).limit(100),
  ]);
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || member.displayName;

  return <div className="member-shell">
    <MemberNavigation userName={name} userEmail={member.email} adminMode={admin} />
    <main className="support-page">
      <SupportCenter initialTickets={tickets} cases={caseRows} admin={admin} initialTicketId={requestedTicket} />
    </main>
    <MemberFooter />
  </div>;
}
