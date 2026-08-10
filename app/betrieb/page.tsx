import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { auditEvents, authUsers, cases, documents, payments, publicEngagementMetrics, publicPageMetrics, users } from "@/db/schema";
import { requireAdmin } from "@/lib/server/admin";
import { MemberNavigation } from "@/app/components/member-navigation";
import { MemberFooter } from "@/app/components/member-footer";
import { legalAreas } from "@/lib/legal-areas";
import { getLegalSourceRegister } from "@/lib/legal-sources";
import { ReachPerformanceChart } from "./reach-performance-chart";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Betriebsübersicht", robots: { index: false, follow: false } };

const money = (cents: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
const dateTime = (value: Date) => new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(value);
const statusLabel: Record<string, string> = {
  DRAFT: "Entwurf", INTAKE: "Fallaufnahme", NEEDS_INFORMATION: "Rückfragen", ANALYZING: "Analyse läuft",
  ANALYSIS_FAILED: "Analysefehler", ESCALATED: "Eskaliert", ASSESSMENT_READY: "Prüfbericht fertig",
  READY_FOR_REVIEW: "Zur Prüfung", DELETED: "Löschung angefordert", PURGED: "Inhalte gelöscht",
  OPEN: "Checkout offen", PAID: "Bezahlt", UNPAID: "Nicht bezahlt", EXPIRED: "Abgebrochen",
  FAILED: "Fehlgeschlagen", REFUNDED: "Erstattet", PARTIALLY_REFUNDED: "Teilweise erstattet",
};

type AdminTab = "overview" | "reach" | "users" | "payments" | "cases" | "sources" | "checks" | "system";
const adminTabs: Array<{ id: AdminTab; label: string; description: string; symbol: string }> = [
  { id: "overview", label: "Übersicht", description: "Kennzahlen und Status", symbol: "⌂" },
  { id: "reach", label: "Reichweite", description: "Anonyme Seitenaufrufe", symbol: "↗" },
  { id: "users", label: "Nutzer", description: "Konten und E-Mail-Adressen", symbol: "◎" },
  { id: "payments", label: "Buchungen & Umsatz", description: "Zahlungen und Erlöse", symbol: "€" },
  { id: "cases", label: "Fallabfragen", description: "Rechtsfall-Checks und Status", symbol: "▤" },
  { id: "sources", label: "Rechtsinhalte", description: "Quellen und Freigabestatus", symbol: "§" },
  { id: "checks", label: "Systemchecks", description: "Tägliche Funktionsprüfung", symbol: "✓" },
  { id: "system", label: "System", description: "Fehler und Ereignisse", symbol: "⚙" },
];

const checkLabels: Record<string, string> = {
  DAILY_SYSTEM_CHECK_PASSED: "Alle geprüften Systeme sind erreichbar und korrekt konfiguriert.",
  DAILY_DATABASE_CHECK_FAILED: "Die Railway-Datenbank war beim Prüflauf nicht erreichbar.",
  DAILY_MALWARE_SCANNER_CHECK_FAILED: "Der Railway-Malware-Scanner war beim Prüflauf nicht erreichbar.",
  MALWARE_SCANNER_ENDPOINT_MISSING: "Die Adresse des Malware-Scanners fehlt in der Konfiguration.",
  PRODUCTION_MALWARE_FAIL_CLOSED_DISABLED: "Die zwingende Malware-Prüfung ist nicht aktiviert.",
  DAILY_SYSTEM_CHECK_AUDIT_FAILED: "Das Ergebnis des Systemchecks konnte nicht gespeichert werden.",
};

function checkDescription(eventType: string) {
  if (checkLabels[eventType]) return checkLabels[eventType];
  if (eventType.startsWith("CONFIG_") && eventType.endsWith("_MISSING")) {
    return `Die erforderliche Einstellung ${eventType.slice(7, -8)} fehlt.`;
  }
  return "Der tägliche Systemcheck hat einen technischen Prüfpunkt beanstandet.";
}

function isTechnicalErrorEvent(event: { eventType: string; metadataJson: unknown }) {
  if (event.eventType.startsWith("OPERATIONAL_ALERT_SENT_")) return false;
  const metadata = event.metadataJson as Record<string, unknown> | null;
  const severity = String(metadata?.severity || "").toLowerCase();
  return ["critical", "high", "warning"].includes(severity)
    || event.eventType.endsWith("_FAILED")
    || event.eventType.endsWith("_ERROR")
    || event.eventType.endsWith("_MISSING")
    || event.eventType.includes("_MISMATCH")
    || event.eventType === "AI_NOT_CONFIGURED"
    || event.eventType === "PRODUCTION_MALWARE_FAIL_CLOSED_DISABLED";
}

export default async function OperationsPage({ searchParams }: { searchParams: Promise<{ tab?: string; range?: string }> }) {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const parameters = await searchParams;
  const requestedTab = parameters.tab;
  const reachRange = [7, 30, 90].includes(Number(parameters.range)) ? Number(parameters.range) : 30;
  const activeTab: AdminTab = adminTabs.some(tab => tab.id === requestedTab) ? requestedTab as AdminTab : "overview";
  const db = getDb();
  const sourceRegister = getLegalSourceRegister();
  const [[failedDocuments], [failedCases], userRows, paymentRows, caseRows, recentEvents, pageMetricRows, engagementRows] = await Promise.all([
    db.select({ value: count() }).from(documents).where(eq(documents.extractionStatus, "FAILED")),
    db.select({ value: count() }).from(cases).where(eq(cases.status, "ANALYSIS_FAILED")),
    db.select({
      id: authUsers.id, email: authUsers.email, firstName: users.firstName, lastName: users.lastName,
      createdAt: authUsers.createdAt,
      deletionScheduledFor: users.deletionScheduledFor,
      emailVerified: authUsers.emailVerified, authName: authUsers.name,
    }).from(authUsers).leftJoin(users, eq(authUsers.id, users.id)).orderBy(desc(authUsers.createdAt)).limit(500),
    db.select({
      id: payments.id, ownerId: payments.ownerId, caseId: payments.caseId, email: users.email, caseTitle: cases.title,
      status: payments.status, amountCents: payments.amountCents, currency: payments.currency,
      refundedAmountCents: payments.refundedAmountCents, receiptUrl: payments.receiptUrl,
      providerPaymentId: payments.providerPaymentId, providerMode: payments.providerMode,
      invoiceNumber: payments.invoiceNumber, invoiceStatus: payments.invoiceStatus,
      invoicePdfUrl: payments.invoicePdfUrl, hostedInvoiceUrl: payments.hostedInvoiceUrl,
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
      caseId: auditEvents.caseId, metadataJson: auditEvents.metadataJson, createdAt: auditEvents.createdAt,
    }).from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(100),
    db.select().from(publicPageMetrics).orderBy(desc(publicPageMetrics.metricDate)).limit(1000),
    db.select().from(publicEngagementMetrics).orderBy(desc(publicEngagementMetrics.metricDate)).limit(5000),
  ]);

  const adminName = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.displayName;
  const latestUser = userRows[0];
  const latestCase = caseRows[0];
  const latestPayment = paymentRows[0];
  const systemCheckEvents = recentEvents.filter(event => {
    const metadata = event.metadataJson as Record<string, unknown>;
    return event.eventType.startsWith("DAILY_")
      || event.eventType.startsWith("CONFIG_")
      || event.eventType === "MALWARE_SCANNER_ENDPOINT_MISSING"
      || event.eventType === "PRODUCTION_MALWARE_FAIL_CLOSED_DISABLED"
      || metadata?.dailyCheck === true;
  });
  const technicalErrorEvents = recentEvents.filter(event =>
    !systemCheckEvents.includes(event) && isTechnicalErrorEvent(event)
  );
  const latestSystemCheck = systemCheckEvents[0];
  const latestSystemCheckPassed = latestSystemCheck?.eventType === "DAILY_SYSTEM_CHECK_PASSED";
  const latestError = technicalErrorEvents[0];
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - reachRange + 1);
  const cutoffDate = cutoff.toISOString().slice(0, 10);
  const filteredPageMetricRows = pageMetricRows.filter(row => row.metricDate >= cutoffDate);
  const filteredEngagementRows = engagementRows.filter(row => row.metricDate >= cutoffDate);
  const totalPublicViews = filteredPageMetricRows.reduce((total, row) => total + row.views, 0);
  const viewsByPage = Object.entries(filteredPageMetricRows.reduce<Record<string, number>>((totals, row) => {
    totals[row.pageGroup] = (totals[row.pageGroup] || 0) + row.views;
    return totals;
  }, {})).sort((left, right) => right[1] - left[1]);
  const engagementCount = (eventType: string, eventKey?: string, source?: string) => filteredEngagementRows
    .filter(row => row.eventType === eventType && (!eventKey || row.eventKey === eventKey) && (!source || row.source === source))
    .reduce((total, row) => total + row.count, 0);
  const sessions = engagementCount("session", "visit");
  const metaSessions = engagementCount("session", "visit", "meta");
  const pageVisits = engagementCount("page_visit", "visit");
  const readRows = filteredEngagementRows.filter(row => row.eventType === "read_time");
  const readSamples = readRows.reduce((total, row) => total + row.count, 0);
  const totalReadSeconds = readRows.reduce((total, row) => total + row.totalValue, 0);
  const averageReadSeconds = readSamples ? Math.round(totalReadSeconds / readSamples) : 0;
  const ctaRows = Object.entries(filteredEngagementRows.filter(row => row.eventType === "cta").reduce<Record<string, number>>((totals, row) => {
    totals[row.eventKey] = (totals[row.eventKey] || 0) + row.count;
    return totals;
  }, {})).sort((left, right) => right[1] - left[1]);
  const campaignRows = Object.values(filteredEngagementRows.filter(row => row.eventType === "session").reduce<Record<string, { source: string; medium: string; campaign: string; visits: number }>>((totals, row) => {
    const key = `${row.source}|${row.medium}|${row.campaign}`;
    totals[key] ||= { source: row.source, medium: row.medium, campaign: row.campaign, visits: 0 };
    totals[key].visits += row.count;
    return totals;
  }, {})).sort((left, right) => right.visits - left.visits);
  const funnelKeys = ["sign_up", "complete_registration", "begin_checkout", "purchase"];
  const dailyPoints = Array.from({ length: reachRange }, (_, index) => {
    const date = new Date(cutoff);
    date.setDate(cutoff.getDate() + index);
    const metricDate = date.toISOString().slice(0, 10);
    const dayPages = filteredPageMetricRows.filter(row => row.metricDate === metricDate);
    const dayEvents = filteredEngagementRows.filter(row => row.metricDate === metricDate);
    const sumEvent = (eventType: string, source?: string) => dayEvents
      .filter(row => row.eventType === eventType && (!source || row.source === source))
      .reduce((total, row) => total + row.count, 0);
    return {
      date: metricDate,
      views: dayPages.reduce((total, row) => total + row.views, 0),
      sessions: sumEvent("session"),
      metaSessions: sumEvent("session", "meta"),
      ctaClicks: sumEvent("cta"),
    };
  });
  const registrationStarts = engagementCount("funnel", "sign_up");
  const completedRegistrations = engagementCount("funnel", "complete_registration");
  const checkouts = engagementCount("funnel", "begin_checkout");
  const purchases = engagementCount("funnel", "purchase");
  const funnelLabels: Record<string, string> = {
    sign_up: "Registrierung gestartet",
    complete_registration: "Registrierung abgeschlossen",
    begin_checkout: "Zahlung begonnen",
    purchase: "Zahlung abgeschlossen",
  };
  const pagePerformanceRows = viewsByPage.map(([pageGroup, views]) => {
    const rows = filteredEngagementRows.filter(row => row.pageGroup === pageGroup);
    const sum = (eventType: string, eventKey?: string) => rows
      .filter(row => row.eventType === eventType && (!eventKey || row.eventKey === eventKey))
      .reduce((total, row) => total + row.count, 0);
    const reading = rows.filter(row => row.eventType === "read_time");
    const readingSamples = reading.reduce((total, row) => total + row.count, 0);
    return {
      pageGroup,
      views,
      fullScrolls: sum("scroll", "100"),
      ctaClicks: sum("cta"),
      averageReadSeconds: readingSamples
        ? Math.round(reading.reduce((total, row) => total + row.totalValue, 0) / readingSamples)
        : 0,
    };
  });

  return <div className="member-shell">
    <MemberNavigation userName={adminName} userEmail={admin.email} adminMode />
    <main className="operations-page">
      <div className="admin-content">
          <header className="operations-header">
            <div><span>BETREIBER-DASHBOARD</span><h1>Geschäft und Betrieb</h1><p>Nutzer, Fallabfragen, Buchungen, Umsatz und technische Qualität auf einen Blick.</p></div>
          </header>
      {activeTab === "overview" && <>
        <section className="admin-view-heading"><span>ÜBERSICHT</span><h2>Letzte Aktivitäten</h2><p>Die jüngsten Vorgänge aus Registrierung, Rechtsfall-Checks, Buchungen und Systembetrieb.</p></section>
        <section className="admin-activity-grid" aria-label="Letzte Aktivitäten">
          <Link href="/betrieb?tab=users"><span>LETZTE REGISTRIERUNG</span><strong>{latestUser?.authName || latestUser?.email || "Noch keine Registrierung"}</strong><small>{latestUser ? dateTime(latestUser.createdAt) : "Keine Aktivität vorhanden"}</small><i>Nutzer öffnen →</i></Link>
          <Link href="/betrieb?tab=cases"><span>LETZTER RECHTSFALL-CHECK</span><strong>{latestCase?.title || "Noch kein Rechtsfall-Check"}</strong><small>{latestCase ? `${latestCase.email || "Gelöschtes Konto"} · ${statusLabel[latestCase.status] || latestCase.status}` : "Keine Aktivität vorhanden"}</small><i>Fallabfragen öffnen →</i></Link>
          <Link href="/betrieb?tab=payments"><span>LETZTE BUCHUNG</span><strong>{latestPayment ? money(latestPayment.amountCents) : "Noch keine Buchung"}</strong><small>{latestPayment ? `${latestPayment.email || "Gelöschtes Konto"} · ${statusLabel[latestPayment.status] || latestPayment.status}` : "Keine Aktivität vorhanden"}</small><i>Buchungen öffnen →</i></Link>
          <Link href="/betrieb?tab=checks" className={latestSystemCheck && !latestSystemCheckPassed ? "warning" : ""}><span>LETZTER SYSTEMCHECK</span><strong>{!latestSystemCheck ? "Noch kein Prüflauf" : latestSystemCheckPassed ? "Alle Systeme in Ordnung" : "Handlungsbedarf erkannt"}</strong><small>{latestSystemCheck ? dateTime(latestSystemCheck.createdAt) : "Der erste automatische Lauf steht noch aus"}</small><i>Systemchecks öffnen →</i></Link>
          <Link href="/betrieb?tab=system" className={latestError ? "warning" : ""}><span>LETZTER FEHLER</span><strong>{latestError ? "Technischer Fehler erkannt" : "Keine aktuellen Fehler"}</strong><small>{latestError ? `${latestError.eventType} · ${dateTime(latestError.createdAt)}` : `${failedDocuments.value} Dokumentfehler · ${failedCases.value} Analysefehler`}</small><i>Fehlerprotokoll öffnen →</i></Link>
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
              <td><span className={`admin-status ${user.deletionScheduledFor ? "error" : ""}`}>{user.deletionScheduledFor ? `Zum ${dateTime(user.deletionScheduledFor)}` : "Nein"}</span></td>
            </tr>;
          })}</tbody>
        </table></div>
      </section>}

      {activeTab === "reach" && <section className="operations-panel">
        <header><div><span>PERFORMANCE-DASHBOARD</span><h2>Besucher, Verhalten und Conversions</h2></div><strong>{totalPublicViews}</strong></header>
        <nav className="reach-range" aria-label="Auswertungszeitraum">
          {[7, 30, 90].map(days => <Link key={days} href={`/betrieb?tab=reach&range=${days}`} className={reachRange === days ? "active" : ""}>{days} Tage</Link>)}
        </nav>
        <div className="legal-review-notice">
          <strong>Datensparsam und ohne Aufzeichnung persönlicher Inhalte</strong>
          <p>Die Basiszählung bleibt cookielos. Erweiterte Werte werden nur nach Statistik-Einwilligung als Tageswerte zusammengeführt. Es gibt kein Session-Replay, keine Mausspur und keine Speicherung von IP-Adressen, Werbe-IDs, Fall-, Konto- oder Texteingaben. „Besuche“ sind Browser-Sitzungen und keine eindeutig identifizierten Personen.</p>
        </div>
        <div className="reach-kpi-grid">
          <article><span>BASISAUFRUFE</span><strong>{totalPublicViews}</strong><small>Alle öffentlichen Aufrufe</small></article>
          <article><span>BESUCHE MIT EINWILLIGUNG</span><strong>{sessions}</strong><small>Browser-Sitzungen</small></article>
          <article className="meta"><span>DAVON META</span><strong>{metaSessions}</strong><small>{sessions ? `${Math.round((metaSessions / sessions) * 100)} % der messbaren Besuche` : "Noch keine Zuordnung"}</small></article>
          <article><span>Ø AKTIVE LESEZEIT</span><strong>{averageReadSeconds} s</strong><small>Nur sichtbare, aktive Zeit</small></article>
          <article><span>SEITENBESUCHE</span><strong>{pageVisits}</strong><small>Einmal je Seite und Sitzung</small></article>
          <article><span>CTA-KLICKS</span><strong>{ctaRows.reduce((total, row) => total + row[1], 0)}</strong><small>Freigegebene Schaltziele</small></article>
        </div>
        <div className="reach-conversion-grid">
          <article><span>AUFRUF → REGISTRIERUNGSSTART</span><strong>{totalPublicViews ? `${((registrationStarts / totalPublicViews) * 100).toFixed(1)} %` : "—"}</strong><small>{registrationStarts} Starts aus {totalPublicViews} Aufrufen</small></article>
          <article><span>START → AKTIVIERTES KONTO</span><strong>{registrationStarts ? `${((completedRegistrations / registrationStarts) * 100).toFixed(1)} %` : "—"}</strong><small>{completedRegistrations} abgeschlossene Registrierungen</small></article>
          <article><span>CHECKOUT → KAUF</span><strong>{checkouts ? `${((purchases / checkouts) * 100).toFixed(1)} %` : "—"}</strong><small>{purchases} Käufe aus {checkouts} Checkouts</small></article>
        </div>
        <h3>Performance im Zeitverlauf</h3>
        <ReachPerformanceChart points={dailyPoints} />
        <div className="reach-detail-grid">
          <section>
            <h3>Scrolltiefe</h3>
            {[25, 50, 75, 100].map(level => {
              const count = engagementCount("scroll", String(level));
              return <div className="reach-progress" key={level}><div><span>{level} % erreicht</span><strong>{count}</strong></div><i><b style={{ width: `${pageVisits ? Math.min(100, Math.round((count / pageVisits) * 100)) : 0}%` }} /></i></div>;
            })}
          </section>
          <section>
            <h3>Wichtige Klickziele</h3>
            {ctaRows.length ? ctaRows.slice(0, 8).map(([key, count]) => <div className="reach-row" key={key}><span>{key}</span><strong>{count}</strong></div>) : <p>Noch keine CTA-Klicks erfasst.</p>}
          </section>
        </div>
        <h3>Meta- und Funnel-Abgleich</h3>
        <div className="admin-table-scroll"><table className="admin-table">
          <thead><tr><th>Prozessschritt</th><th>Gesamt</th><th>Meta zugeordnet</th><th>Anteil Meta</th></tr></thead>
          <tbody>{funnelKeys.map(key => {
            const total = engagementCount("funnel", key);
            const meta = engagementCount("funnel", key, "meta");
            return <tr key={key}><td>{funnelLabels[key]}</td><td><strong>{total}</strong></td><td>{meta}</td><td>{total ? `${Math.round((meta / total) * 100)} %` : "—"}</td></tr>;
          })}</tbody>
        </table></div>
        <h3>Kampagnenzuordnung</h3>
        <div className="admin-table-scroll"><table className="admin-table">
          <thead><tr><th>Quelle</th><th>Medium</th><th>Kampagne</th><th>Besuche</th></tr></thead>
          <tbody>{campaignRows.length ? campaignRows.map(row => <tr key={`${row.source}:${row.medium}:${row.campaign}`}><td>{row.source}</td><td>{row.medium}</td><td>{row.campaign}</td><td><strong>{row.visits}</strong></td></tr>) : <tr><td colSpan={4}>Noch keine Kampagnendaten vorhanden.</td></tr>}</tbody>
        </table></div>
        <h3>Leistung der öffentlichen Seiten</h3>
        <div className="admin-table-scroll"><table className="admin-table">
          <thead><tr><th>Seitengruppe</th><th>Aufrufe</th><th>Ø aktive Lesezeit</th><th>100 % gescrollt</th><th>CTA-Klicks</th></tr></thead>
          <tbody>{pagePerformanceRows.length ? pagePerformanceRows.map(row => <tr key={row.pageGroup}><td>{row.pageGroup}</td><td><strong>{row.views}</strong></td><td>{row.averageReadSeconds} s</td><td>{row.fullScrolls}</td><td>{row.ctaClicks}</td></tr>) : <tr><td colSpan={5}>Noch keine öffentlichen Seitenaufrufe gezählt.</td></tr>}</tbody>
        </table></div>
        <h3>Tagesverlauf</h3>
        <div className="admin-table-scroll"><table className="admin-table">
          <thead><tr><th>Tag</th><th>Seitengruppe</th><th>Aufrufe</th></tr></thead>
          <tbody>{filteredPageMetricRows.length ? filteredPageMetricRows.map(row => <tr key={row.id}><td>{row.metricDate}</td><td>{row.pageGroup}</td><td>{row.views}</td></tr>) : <tr><td colSpan={3}>Noch keine Daten vorhanden.</td></tr>}</tbody>
        </table></div>
      </section>}

      {activeTab === "payments" && <section className="operations-panel">
        <header><div><span>BUCHUNGEN UND UMSATZ</span><h2>Zahlungsvorgänge</h2></div><strong>{paymentRows.length}</strong></header>
        <div className="admin-table-scroll"><table className="admin-table">
          <thead><tr><th>Datum</th><th>Nutzer</th><th>Rechtsfall-Check</th><th>Status</th><th>Betrag</th><th>Erstattung</th><th>Rechnung</th><th>Beleg</th><th>Modus</th><th>Stripe-ID</th></tr></thead>
          <tbody>{paymentRows.length ? paymentRows.map(payment => <tr key={payment.id}>
            <td>{dateTime(payment.createdAt)}</td><td>{payment.email || "Gelöschtes Konto"}</td>
            <td>{payment.caseTitle || `Fall ${payment.caseId.slice(0, 8)}`}</td>
            <td><span className={`admin-status ${payment.status === "PAID" ? "success" : "pending"}`}>{statusLabel[payment.status] || payment.status}</span></td>
            <td><strong>{money(payment.amountCents)}</strong></td>
            <td>{payment.refundedAmountCents ? money(payment.refundedAmountCents) : "—"}</td>
            <td>{payment.invoicePdfUrl || payment.hostedInvoiceUrl
              ? <a href={payment.invoicePdfUrl || payment.hostedInvoiceUrl || "#"} target="_blank" rel="noreferrer">{payment.invoiceNumber || "Öffnen"} ↗</a>
              : "—"}</td>
            <td>{payment.receiptUrl ? <a href={payment.receiptUrl} target="_blank" rel="noreferrer">Öffnen ↗</a> : "—"}</td>
            <td><span className={`admin-status ${payment.providerMode === "LIVE" ? "success" : "pending"}`}>{payment.providerMode}</span></td>
            <td><code title={payment.providerPaymentId || ""}>{payment.providerPaymentId ? `${payment.providerPaymentId.slice(0, 12)}…` : "—"}</code></td>
          </tr>) : <tr><td colSpan={10}>Noch keine Zahlungsvorgänge vorhanden.</td></tr>}</tbody>
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

      {activeTab === "sources" && <section className="operations-panel">
        <header><div><span>QUELLEN- UND FREIGABEREGISTER</span><h2>Juristische Rechtsinhalte</h2></div><strong>{sourceRegister.length}</strong></header>
        <div className="legal-source-summary">
          <article><span>ANGEBOTENE RECHTSGEBIETE</span><strong>{legalAreas.length}</strong><p>Alle Rechtsgebiete sind einem technischen Quellenpfad zugeordnet.</p></article>
          <article className="success"><span>OFFIZIELLE QUELLEN</span><strong>{sourceRegister.length}</strong><p>Verweise führen ausschließlich zum amtlichen Bundesportal.</p></article>
          <article className="pending"><span>JURISTISCHE FREIGABE</span><strong>Ausstehend</strong><p>Eine technische Hinterlegung ist keine anwaltliche Inhaltsfreigabe.</p></article>
        </div>
        <div className="legal-review-notice">
          <strong>Klare Trennung der Verantwortlichkeiten</strong>
          <p>„Offizielle Quelle hinterlegt“ bestätigt nur Herkunft und technische Zuordnung. Erst eine dokumentierte Prüfung durch eine hierzu befugte juristische Fachperson darf den Status „juristisch freigegeben“ setzen. Bis dahin bleiben Regeln und Fristen ausdrücklich freigabepflichtig.</p>
        </div>
        <div className="admin-table-scroll"><table className="admin-table">
          <thead><tr><th>Quelle</th><th>Zugeordnete Rechtsgebiete</th><th>Herkunft</th><th>Technik</th><th>Juristische Freigabe</th></tr></thead>
          <tbody>{sourceRegister.map(source => <tr key={source.id}>
            <td><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a><small className="source-id">{source.id}</small></td>
            <td>{source.legalAreas.map(area => legalAreas.find(item => item.id === area)?.shortTitle || area).join(", ")}</td>
            <td>BMJ / BfJ</td>
            <td><span className="admin-status success">Offizielle Quelle hinterlegt</span></td>
            <td><span className="admin-status pending">Freigabe erforderlich</span></td>
          </tr>)}</tbody>
        </table></div>
      </section>}

      {activeTab === "checks" && <section className="operations-panel system-check-panel">
        <header><div><span>TÄGLICHE FUNKTIONSPRÜFUNG</span><h2>Systemchecks</h2></div><strong className={`system-check-summary ${!latestSystemCheck ? "pending" : latestSystemCheckPassed ? "success" : "error"}`}>
          {!latestSystemCheck ? "Ausstehend" : latestSystemCheckPassed ? "Alles in Ordnung" : "Handlungsbedarf"}
        </strong></header>
        {!latestSystemCheck ? <div className="system-check-empty">
          <strong>Der erste automatische Systemcheck steht noch aus.</strong>
          <p>Der Prüflauf startet täglich über Vercel. Danach sehen Sie hier verständlich aufbereitet, ob Datenbank, Malware-Scanner und Sicherheitskonfiguration funktionieren.</p>
        </div> : <>
          <div className="system-check-cards">
            <article className={latestSystemCheckPassed ? "success" : "error"}>
              <span>GESAMTSTATUS</span>
              <strong>{latestSystemCheckPassed ? "Betriebsbereit" : "Prüfung erforderlich"}</strong>
              <p>{checkDescription(latestSystemCheck.eventType)}</p>
            </article>
            <article>
              <span>LETZTER DURCHLAUF</span>
              <strong>{dateTime(latestSystemCheck.createdAt)}</strong>
              <p>Der tägliche Check läuft automatisch und verändert keine Falldaten.</p>
            </article>
            <article>
              <span>DATENBANK</span>
              <strong>{latestSystemCheckPassed ? "Erreichbar" : latestSystemCheck.targetType === "database" ? "Nicht erreichbar" : "Siehe Verlauf"}</strong>
              <p>{latestSystemCheckPassed ? `${Number((latestSystemCheck.metadataJson as Record<string, unknown>)?.databaseResponseTimeMs || 0)} ms Antwortzeit` : "Railway PostgreSQL wird bei jedem Lauf geprüft."}</p>
            </article>
            <article>
              <span>MALWARE-SCANNER</span>
              <strong>{latestSystemCheckPassed ? "Erreichbar" : latestSystemCheck.targetType === "malware-scanner" ? "Nicht erreichbar" : "Siehe Verlauf"}</strong>
              <p>{latestSystemCheckPassed ? `${Number((latestSystemCheck.metadataJson as Record<string, unknown>)?.scannerResponseTimeMs || 0)} ms Antwortzeit` : "Der Railway-Scanner wird unabhängig von Uploads geprüft."}</p>
            </article>
          </div>
          <div className="system-check-history">
            <h3>Verlauf der letzten Prüfungen</h3>
            {systemCheckEvents.slice(0, 30).map(event => {
              const passed = event.eventType === "DAILY_SYSTEM_CHECK_PASSED";
              return <article key={event.id}>
                <b className={passed ? "success" : "error"} aria-hidden="true">{passed ? "✓" : "!"}</b>
                <div><strong>{passed ? "Systemcheck erfolgreich" : "Systemcheck mit Handlungsbedarf"}</strong><p>{checkDescription(event.eventType)}</p></div>
                <time>{dateTime(event.createdAt)}</time>
              </article>;
            })}
          </div>
        </>}
      </section>}

      {activeTab === "system" && <section className="operations-panel">
        <header><div><span>FEHLERPROTOKOLL</span><h2>Technische Fehler und Warnungen</h2></div><strong>{technicalErrorEvents.length}</strong></header>
        <div className="operations-table">{technicalErrorEvents.length ? technicalErrorEvents.map(event => <article key={event.id}>
          <time>{dateTime(event.createdAt)}</time><strong>{event.eventType}</strong>
          <span>{event.targetType || "System"}</span><code>{event.caseId ? `Fall ${event.caseId.slice(0, 8)}` : "—"}</code>
        </article>) : <p className="system-log-empty">Keine technischen Fehler oder Warnungen vorhanden.</p>}</div>
      </section>}
      </div>
    </main>
    <MemberFooter />
  </div>;
}
