import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { auditEvents, authUsers, cases, documents, payments, users } from "@/db/schema";
import { requireAdmin } from "@/lib/server/admin";
import { MemberNavigation } from "@/app/components/member-navigation";
import { MemberFooter } from "@/app/components/member-footer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Betriebsübersicht", robots: { index: false, follow: false } };

const money = (cents: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
const dateTime = (value: Date) => new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(value);
const statusLabel: Record<string, string> = {
  DRAFT: "Entwurf", INTAKE: "Fallaufnahme", NEEDS_INFORMATION: "Rückfragen", ANALYZING: "Analyse läuft",
  ANALYSIS_FAILED: "Analysefehler", ESCALATED: "Eskaliert", ASSESSMENT_READY: "Prüfbericht fertig",
  READY_FOR_REVIEW: "Zur Prüfung", DELETED: "Löschung angefordert", PURGED: "Inhalte gelöscht",
  OPEN: "Checkout offen", PAID: "Bezahlt", UNPAID: "Nicht bezahlt", EXPIRED: "Abgebrochen",
};

type AdminTab = "overview" | "users" | "payments" | "cases" | "system";
const adminTabs: Array<{ id: AdminTab; label: string; description: string; symbol: string }> = [
  { id: "overview", label: "Übersicht", description: "Kennzahlen und Status", symbol: "⌂" },
  { id: "users", label: "Nutzer", description: "Konten und E-Mail-Adressen", symbol: "◎" },
  { id: "payments", label: "Buchungen & Umsatz", description: "Zahlungen und Erlöse", symbol: "€" },
  { id: "cases", label: "Fallabfragen", description: "Rechtsfall-Checks und Status", symbol: "▤" },
  { id: "system", label: "System", description: "Fehler und Ereignisse", symbol: "⚙" },
];

export default async function OperationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const requestedTab = (await searchParams).tab;
  const activeTab: AdminTab = adminTabs.some(tab => tab.id === requestedTab) ? requestedTab as AdminTab : "overview";
  const db = getDb();
  const [[failedDocuments], [failedCases], userRows, paymentRows, caseRows, recentEvents, deletionEvents] = await Promise.all([
    db.select({ value: count() }).from(documents).where(eq(documents.extractionStatus, "FAILED")),
    db.select({ value: count() }).from(cases).where(eq(cases.status, "ANALYSIS_FAILED")),
    db.select({
      id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName,
      phone: users.phone, createdAt: users.createdAt, updatedAt: users.updatedAt,
      emailVerified: authUsers.emailVerified, authName: authUsers.name,
    }).from(users).leftJoin(authUsers, eq(users.id, authUsers.id)).orderBy(desc(users.createdAt)).limit(500),
    db.select({
      id: payments.id, ownerId: payments.ownerId, caseId: payments.caseId, email: users.email, caseTitle: cases.title,
      status: payments.status, amountCents: payments.amountCents, currency: payments.currency,
      provider: payments.provider, createdAt: payments.createdAt, updatedAt: payments.updatedAt,
    }).from(payments)
      .leftJoin(users, eq(payments.ownerId, users.id))
      .leftJoin(cases, eq(payments.caseId, cases.id))
      .orderBy(desc(payments.createdAt)).limit(500),
    db.select({
      id: cases.id, ownerId: cases.ownerId, title: cases.title, email: users.email, legalArea: cases.legalArea,
      status: cases.status, paymentStatus: cases.paymentStatus, createdAt: cases.createdAt, updatedAt: cases.updatedAt,
    }).from(cases).leftJoin(users, eq(cases.ownerId, users.id)).orderBy(desc(cases.createdAt)).limit(500),
    db.select({
      id: auditEvents.id, actorId: auditEvents.actorId, eventType: auditEvents.eventType, targetType: auditEvents.targetType,
      caseId: auditEvents.caseId, createdAt: auditEvents.createdAt,
    }).from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(100),
    db.select({ actorId: auditEvents.actorId }).from(auditEvents)
      .where(eq(auditEvents.eventType, "ACCOUNT_DELETION_REQUESTED")),
  ]);

  const adminName = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.displayName;
  const latestUser = userRows[0];
  const latestCase = caseRows[0];
  const latestPayment = paymentRows[0];
  const latestError = recentEvents.find(event => /FAILED|ERROR|MALWARE|MISMATCH/.test(event.eventType));
  const accountDeletionIds = new Set(deletionEvents.map(event => event.actorId).filter(Boolean));

  return <div className="member-shell">
    <MemberNavigation userName={adminName} userEmail={admin.email} />
    <main className="operations-page">
      <div className="admin-console">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-title"><span>ADMINBEREICH</span><strong>Navigation</strong></div>
          <nav aria-label="Betreiberbereiche">{adminTabs.map(tab => <Link key={tab.id} href={tab.id === "overview" ? "/betrieb" : `/betrieb?tab=${tab.id}`} className={activeTab === tab.id ? "active" : ""}>
            <b aria-hidden="true">{tab.symbol}</b><span><strong>{tab.label}</strong><small>{tab.description}</small></span><i aria-hidden="true">→</i>
          </Link>)}</nav>
          <div className="admin-sidebar-account"><small>Administrator</small><strong>{admin.email}</strong></div>
        </aside>

        <div className="admin-content">
          <header className="operations-header">
            <div><span>BETREIBER-DASHBOARD</span><h1>Geschäft und Betrieb</h1><p>Nutzer, Fallabfragen, Buchungen, Umsatz und technische Qualität auf einen Blick.</p></div>
            <div className="operations-admin"><small>Angemeldet als Administrator</small><strong>{admin.email}</strong></div>
          </header>
      {activeTab === "overview" && <>
        <section className="admin-view-heading"><span>ÜBERSICHT</span><h2>Letzte Aktivitäten</h2><p>Die jüngsten Vorgänge aus Registrierung, Rechtsfall-Checks, Buchungen und Systembetrieb.</p></section>
        <section className="admin-activity-grid" aria-label="Letzte Aktivitäten">
          <Link href="/betrieb?tab=users"><span>LETZTE REGISTRIERUNG</span><strong>{latestUser?.authName || latestUser?.email || "Noch keine Registrierung"}</strong><small>{latestUser ? dateTime(latestUser.createdAt) : "Keine Aktivität vorhanden"}</small><i>Nutzer öffnen →</i></Link>
          <Link href="/betrieb?tab=cases"><span>LETZTER RECHTSFALL-CHECK</span><strong>{latestCase?.title || "Noch kein Rechtsfall-Check"}</strong><small>{latestCase ? `${latestCase.email || "Gelöschtes Konto"} · ${statusLabel[latestCase.status] || latestCase.status}` : "Keine Aktivität vorhanden"}</small><i>Fallabfragen öffnen →</i></Link>
          <Link href="/betrieb?tab=payments"><span>LETZTE BUCHUNG</span><strong>{latestPayment ? money(latestPayment.amountCents) : "Noch keine Buchung"}</strong><small>{latestPayment ? `${latestPayment.email || "Gelöschtes Konto"} · ${statusLabel[latestPayment.status] || latestPayment.status}` : "Keine Aktivität vorhanden"}</small><i>Buchungen öffnen →</i></Link>
          <Link href="/betrieb?tab=system" className={latestError ? "warning" : ""}><span>TECHNISCHER STATUS</span><strong>{latestError ? "Letzter Fehler" : "Keine aktuellen Fehler"}</strong><small>{latestError ? `${latestError.eventType} · ${dateTime(latestError.createdAt)}` : `${failedDocuments.value} Dokumentfehler · ${failedCases.value} Analysefehler`}</small><i>System öffnen →</i></Link>
        </section>
      </>}

      {activeTab === "users" && <section className="operations-panel">
        <header><div><span>NUTZER</span><h2>Registrierte Konten und E-Mail-Adressen</h2></div><strong>{userRows.length}{userRows.length === 500 ? "+" : ""}</strong></header>
        <div className="admin-table-scroll"><table className="admin-table">
          <thead><tr><th>Nachname</th><th>Vorname</th><th>E-Mail-Adresse</th><th>Konto</th><th>Fall begonnen</th><th>Checkout / Zahlung</th><th>Löschung</th></tr></thead>
          <tbody>{userRows.map(user => {
            const authParts = (user.authName || "").trim().split(/\s+/).filter(Boolean);
            const firstName = user.firstName || authParts[0] || "—";
            const lastName = user.lastName || (authParts.length > 1 ? authParts.slice(1).join(" ") : "—");
            const userCases = caseRows.filter(item => item.ownerId === user.id);
            const userPayments = paymentRows.filter(item => item.ownerId === user.id);
            const latestUserPayment = userPayments[0];
            const paid = latestUserPayment?.status === "PAID";
            const abandoned = latestUserPayment?.status === "EXPIRED";
            const open = latestUserPayment?.status === "OPEN";
            const checkout = paid ? "Abgeschlossen" : abandoned ? "Abgebrochen" : open ? "Begonnen" : "Nicht begonnen";
            return <tr key={user.id}>
              <td>{lastName}</td><td>{firstName}</td>
              <td><a href={`mailto:${user.email}`}>{user.email}</a></td>
              <td><span className={`admin-status ${user.emailVerified ? "success" : "pending"}`}>{user.emailVerified ? "Aktiviert" : "Nicht aktiviert"}</span></td>
              <td><span className={`admin-status ${userCases.length ? "success" : ""}`}>{userCases.length ? `Ja (${userCases.length})` : "Nein"}</span></td>
              <td><span className={`admin-status ${paid ? "success" : abandoned ? "error" : open ? "pending" : ""}`}>{checkout}</span></td>
              <td><span className={`admin-status ${accountDeletionIds.has(user.id) ? "error" : ""}`}>{accountDeletionIds.has(user.id) ? "Vorgemerkt" : "Nein"}</span></td>
            </tr>;
          })}</tbody>
        </table></div>
      </section>}

      {activeTab === "payments" && <section className="operations-panel">
        <header><div><span>BUCHUNGEN UND UMSATZ</span><h2>Zahlungsvorgänge</h2></div><strong>{paymentRows.length}</strong></header>
        <div className="admin-table-scroll"><table className="admin-table">
          <thead><tr><th>Datum</th><th>Nutzer</th><th>Rechtsfall-Check</th><th>Status</th><th>Betrag</th><th>Anbieter</th></tr></thead>
          <tbody>{paymentRows.length ? paymentRows.map(payment => <tr key={payment.id}>
            <td>{dateTime(payment.createdAt)}</td><td>{payment.email || "Gelöschtes Konto"}</td>
            <td>{payment.caseTitle || `Fall ${payment.caseId.slice(0, 8)}`}</td>
            <td><span className={`admin-status ${payment.status === "PAID" ? "success" : "pending"}`}>{statusLabel[payment.status] || payment.status}</span></td>
            <td><strong>{money(payment.amountCents)}</strong></td><td>{payment.provider}</td>
          </tr>) : <tr><td colSpan={6}>Noch keine Zahlungsvorgänge vorhanden.</td></tr>}</tbody>
        </table></div>
      </section>}

      {activeTab === "cases" && <section className="operations-panel">
        <header><div><span>FALLABFRAGEN</span><h2>Alle angelegten Rechtsfall-Checks</h2></div><strong>{caseRows.length}</strong></header>
        <div className="admin-table-scroll"><table className="admin-table">
          <thead><tr><th>Erstellt</th><th>Nutzer</th><th>Titel</th><th>Rechtsgebiet</th><th>Bearbeitung</th><th>Zahlung</th></tr></thead>
          <tbody>{caseRows.map(item => <tr key={item.id}>
            <td>{dateTime(item.createdAt)}</td><td>{item.email || "Gelöschtes Konto"}</td><td>{item.title}</td><td>{item.legalArea}</td>
            <td><span className={`admin-status ${item.status === "ANALYSIS_FAILED" ? "error" : ""}`}>{statusLabel[item.status] || item.status}</span></td>
            <td><span className={`admin-status ${item.paymentStatus === "PAID" ? "success" : "pending"}`}>{statusLabel[item.paymentStatus] || item.paymentStatus}</span></td>
          </tr>)}</tbody>
        </table></div>
      </section>}

      {activeTab === "system" && <section className="operations-panel">
        <header><div><span>SYSTEMPROTOKOLL</span><h2>Letzte technische Ereignisse</h2></div><strong>{recentEvents.length}</strong></header>
        <div className="operations-table">{recentEvents.map(event => <article key={event.id}>
          <time>{dateTime(event.createdAt)}</time><strong>{event.eventType}</strong>
          <span>{event.targetType || "System"}</span><code>{event.caseId ? `Fall ${event.caseId.slice(0, 8)}` : "—"}</code>
        </article>)}</div>
      </section>}
        </div>
      </div>
    </main>
    <MemberFooter />
  </div>;
}
