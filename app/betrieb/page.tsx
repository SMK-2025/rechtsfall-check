import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { assessments, auditEvents, authUsers, cases, documents, payments, users } from "@/db/schema";
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
  OPEN: "Offen", PAID: "Bezahlt", UNPAID: "Nicht bezahlt",
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
  const [[userCount], [verifiedCount], [caseCount], [assessmentCount], [failedDocuments], [failedCases], userRows, paymentRows, caseRows, recentEvents] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(authUsers).where(eq(authUsers.emailVerified, true)),
    db.select({ value: count() }).from(cases),
    db.select({ value: count() }).from(assessments),
    db.select({ value: count() }).from(documents).where(eq(documents.extractionStatus, "FAILED")),
    db.select({ value: count() }).from(cases).where(eq(cases.status, "ANALYSIS_FAILED")),
    db.select({
      id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName,
      phone: users.phone, createdAt: users.createdAt, updatedAt: users.updatedAt,
      emailVerified: authUsers.emailVerified,
    }).from(users).leftJoin(authUsers, eq(users.id, authUsers.id)).orderBy(desc(users.createdAt)).limit(500),
    db.select({
      id: payments.id, caseId: payments.caseId, email: users.email, caseTitle: cases.title,
      status: payments.status, amountCents: payments.amountCents, currency: payments.currency,
      provider: payments.provider, createdAt: payments.createdAt, updatedAt: payments.updatedAt,
    }).from(payments)
      .leftJoin(users, eq(payments.ownerId, users.id))
      .leftJoin(cases, eq(payments.caseId, cases.id))
      .orderBy(desc(payments.createdAt)).limit(500),
    db.select({
      id: cases.id, title: cases.title, email: users.email, legalArea: cases.legalArea,
      status: cases.status, paymentStatus: cases.paymentStatus, createdAt: cases.createdAt, updatedAt: cases.updatedAt,
    }).from(cases).leftJoin(users, eq(cases.ownerId, users.id)).orderBy(desc(cases.createdAt)).limit(500),
    db.select({
      id: auditEvents.id, eventType: auditEvents.eventType, targetType: auditEvents.targetType,
      caseId: auditEvents.caseId, createdAt: auditEvents.createdAt,
    }).from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(100),
  ]);

  const paidBookings = paymentRows.filter(payment => payment.status === "PAID");
  const openBookings = paymentRows.filter(payment => payment.status === "OPEN");
  const revenueCents = paidBookings.reduce((total, payment) => total + payment.amountCents, 0);
  const conversion = caseCount.value ? Math.round((paidBookings.length / caseCount.value) * 100) : 0;
  const adminName = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.displayName;

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
        <section className="admin-view-heading"><span>ÜBERSICHT</span><h2>Die wichtigsten Kennzahlen</h2><p>Aktueller Stand von Nutzung, Umsatz und technischer Qualität.</p></section>
        <section className="operations-grid" aria-label="Kennzahlen">
          <article><strong>{userCount.value}</strong><span>Nutzerkonten</span><small>{verifiedCount.value} E-Mails bestätigt</small></article>
          <article><strong>{caseCount.value}</strong><span>Fallabfragen</span><small>{assessmentCount.value} Analysen erstellt</small></article>
          <article><strong>{paidBookings.length}</strong><span>Bezahlte Buchungen</span><small>{openBookings.length} offene Checkouts</small></article>
          <article className="revenue"><strong>{money(revenueCents)}</strong><span>Umsatz gesamt</span><small>Nur bestätigte Zahlungen</small></article>
          <article><strong>{conversion} %</strong><span>Fall-zu-Kauf-Quote</span><small>Bezahlte Buchungen / Fallakten</small></article>
          <article className={failedDocuments.value + failedCases.value ? "warning" : ""}><strong>{failedDocuments.value + failedCases.value}</strong><span>Technische Fehler</span><small>{failedDocuments.value} Dokumente · {failedCases.value} Analysen</small></article>
        </section>
        <section className="admin-overview-links">
          {adminTabs.slice(1).map(tab => <Link key={tab.id} href={`/betrieb?tab=${tab.id}`}><b>{tab.symbol}</b><span><strong>{tab.label}</strong><small>{tab.description}</small></span><i>Öffnen →</i></Link>)}
        </section>
      </>}

      {activeTab === "users" && <section className="operations-panel">
        <header><div><span>NUTZER</span><h2>Registrierte Konten und E-Mail-Adressen</h2></div><strong>{userRows.length}{userRows.length === 500 ? "+" : ""}</strong></header>
        <div className="admin-table-scroll"><table className="admin-table">
          <thead><tr><th>Name</th><th>E-Mail-Adresse</th><th>Status</th><th>Telefon</th><th>Registriert</th><th>Letzte Änderung</th></tr></thead>
          <tbody>{userRows.map(user => <tr key={user.id}>
            <td>{[user.firstName, user.lastName].filter(Boolean).join(" ") || "Noch nicht ergänzt"}</td>
            <td><a href={`mailto:${user.email}`}>{user.email}</a></td>
            <td><span className={`admin-status ${user.emailVerified ? "success" : "pending"}`}>{user.emailVerified ? "Bestätigt" : "Nicht bestätigt"}</span></td>
            <td>{user.phone || "—"}</td><td>{dateTime(user.createdAt)}</td><td>{dateTime(user.updatedAt)}</td>
          </tr>)}</tbody>
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
