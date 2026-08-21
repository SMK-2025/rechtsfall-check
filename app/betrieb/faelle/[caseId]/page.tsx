import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { assessments, auditEvents, cases, documents, emailDeliveryEvents, facts, payments, questions, users } from "@/db/schema";
import { MemberFooter } from "@/app/components/member-footer";
import { MemberNavigation } from "@/app/components/member-navigation";
import { requireAdmin } from "@/lib/server/admin";
import { getLegalArea } from "@/lib/legal-areas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Fallrevision", robots: { index: false, follow: false } };

const dateTime = (value: Date | null | undefined) => value ? new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(value) : "—";
const money = (value: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value / 100);
const caseStatus: Record<string, string> = {
  DRAFT: "Entwurf", INTAKE: "Fallaufnahme", NEEDS_INFORMATION: "Rückfragen offen", ANALYZING: "Analyse läuft",
  ANALYSIS_FAILED: "Technische Prüfung erforderlich", ESCALATED: "Fachkundige Prüfung empfohlen",
  ASSESSMENT_READY: "Rechtsfall-Check fertig", READY_FOR_REVIEW: "Bereit zur Abschlussprüfung",
};
const mailStatus: Record<string, string> = {
  processed: "Vom Maildienst verarbeitet", delivered: "Zugestellt", open: "Technisch geöffnet", click: "Link angeklickt",
  deferred: "Zustellung verzögert", bounce: "Nicht zustellbar", dropped: "Nicht versendet", spamreport: "Als Spam gemeldet",
  unsubscribe: "Abgemeldet", group_unsubscribe: "Abgemeldet", group_resubscribe: "Wieder angemeldet",
};

function textValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

export default async function CaseRevisionPage({ params }: { params: Promise<{ caseId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const { caseId } = await params;
  const db = getDb();
  const [item] = await db.select({ case: cases, owner: users }).from(cases).leftJoin(users, eq(cases.ownerId, users.id)).where(eq(cases.id, caseId)).limit(1);
  if (!item) notFound();

  const [documentRows, factRows, questionRows, assessmentRows, auditRows, deliveryRows, paymentRows] = await Promise.all([
    db.select().from(documents).where(eq(documents.caseId, caseId)).orderBy(desc(documents.createdAt)),
    db.select().from(facts).where(eq(facts.caseId, caseId)).orderBy(facts.createdAt),
    db.select().from(questions).where(eq(questions.caseId, caseId)).orderBy(questions.createdAt),
    db.select().from(assessments).where(eq(assessments.caseId, caseId)).orderBy(desc(assessments.version)),
    db.select().from(auditEvents).where(eq(auditEvents.caseId, caseId)).orderBy(desc(auditEvents.createdAt)).limit(200),
    db.select().from(emailDeliveryEvents).where(eq(emailDeliveryEvents.caseId, caseId)).orderBy(desc(emailDeliveryEvents.eventAt)).limit(200),
    db.select().from(payments).where(eq(payments.caseId, caseId)).orderBy(desc(payments.createdAt)),
  ]);
  const latest = assessmentRows[0];
  const ownerName = [item.owner?.firstName, item.owner?.lastName].filter(Boolean).join(" ") || item.owner?.displayName || "Nicht ergänzt";
  const intake = (item.case.intakeJson || {}) as Record<string, unknown>;
  const emailTimeline = [
    ...deliveryRows.map(event => ({
      id: `provider-${event.id}`,
      at: event.eventAt,
      status: mailStatus[event.eventType] || event.eventType,
      kind: event.emailKind || "Transaktionsmail",
      subject: null as string | null,
      detail: event.reason || event.response || null,
    })),
    ...auditRows.filter(event => event.eventType === "CASE_STATUS_EMAIL_SENT" || event.eventType === "CASE_STATUS_EMAIL_FAILED").map(event => {
      const metadata = (event.metadataJson || {}) as Record<string, unknown>;
      return {
        id: `audit-${event.id}`,
        at: event.createdAt,
        status: event.eventType === "CASE_STATUS_EMAIL_SENT" ? "Versand angestoßen" : "Versand fehlgeschlagen",
        kind: typeof metadata.emailKind === "string" ? metadata.emailKind : "Statusmail",
        subject: typeof metadata.subject === "string" && metadata.subject ? metadata.subject : null,
        detail: null as string | null,
      };
    }),
  ].sort((left, right) => right.at.getTime() - left.at.getTime());
  const latestMail = emailTimeline[0];
  const finalAvailable = Boolean(latest && ["ASSESSMENT_READY", "ESCALATED"].includes(item.case.status));

  return <div className="member-shell">
    <MemberNavigation userName={admin.displayName || admin.email} userEmail={admin.email} adminMode />
    <main className="member-main operations-page case-revision-page">
      <div className="case-revision-content">
        <div className="case-revision-back"><Link href="/betrieb?tab=cases">← Zurück zu allen Rechtsfall-Checks</Link></div>
        <header className="case-revision-header">
          <div><span>QUALITÄTS- UND FALLREVISION</span><h1>{item.case.title}</h1><p>{getLegalArea(item.case.legalArea).title} · Fallnummer RFC-{caseId.slice(0, 8).toUpperCase()}</p></div>
          <div className="case-revision-actions">
            <span className="admin-status success">{caseStatus[item.case.status] || item.case.status}</span>
            {finalAvailable && <Link className="button" href={`/fallraum/${caseId}/bericht`}>Rechtsfall-Check / PDF öffnen</Link>}
          </div>
        </header>

        <section className="revision-summary-grid">
          <article><span>NUTZER</span><strong>{ownerName}</strong><p>{item.owner?.email || "Konto nicht mehr vorhanden"}</p></article>
          <article><span>ZAHLUNG</span><strong>{item.case.paymentStatus === "PAID" ? "Bezahlt" : item.case.paymentStatus}</strong><p>{paymentRows[0] ? `${money(paymentRows[0].amountCents)} · ${dateTime(paymentRows[0].createdAt)}` : "Kein Zahlungsvorgang"}</p></article>
          <article><span>LETZTE E-MAIL</span><strong>{latestMail ? latestMail.status : "Keine Statusmail"}</strong><p>{latestMail ? `${latestMail.subject || latestMail.kind} · ${dateTime(latestMail.at)}` : "Noch keine Versanddaten"}</p></article>
          <article><span>PRÜFSTAND</span><strong>{assessmentRows.length ? `${assessmentRows.length} Analyse${assessmentRows.length === 1 ? "" : "n"}` : "Noch keine Analyse"}</strong><p>Letzte Änderung {dateTime(item.case.updatedAt)}</p></article>
        </section>

        <section className="operations-panel revision-panel"><header><div><span>FALLAUFNAHME</span><h2>Angaben des Nutzers</h2></div></header>
          <dl className="revision-definition-list">{Object.entries(intake).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{textValue(value)}</dd></div>)}</dl>
        </section>

        <section className="operations-panel revision-panel"><header><div><span>RÜCKFRAGEN</span><h2>Fragen und Antworten</h2></div><strong>{questionRows.length}</strong></header>
          <div className="revision-question-list">{questionRows.length ? questionRows.map((question, index) => <article key={question.id}><b>{String(index + 1).padStart(2, "0")}</b><div><strong>{question.prompt}</strong>{question.reason && <small>Prüfgrund: {question.reason}</small>}<p>{question.answer || "Noch nicht beantwortet"}</p></div></article>) : <p>Es waren keine zusätzlichen Rückfragen erforderlich.</p>}</div>
        </section>

        <section className="operations-panel revision-panel"><header><div><span>UNTERLAGEN</span><h2>Dokumente und Extraktionsstatus</h2></div><strong>{documentRows.length}</strong></header>
          <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Datei und Extrakt</th><th>Größe</th><th>Malwareprüfung</th><th>Auswertung</th><th>Zugriff</th></tr></thead><tbody>{documentRows.length ? documentRows.map(document => <tr key={document.id}><td><strong>{document.originalName}</strong>{Boolean(document.extractionJson && Object.keys(document.extractionJson as object).length > 0) && <details className="revision-inline-details"><summary>Extrahierten Inhalt prüfen</summary><pre className="revision-json">{JSON.stringify(document.extractionJson, null, 2)}</pre></details>}</td><td>{Math.ceil(document.sizeBytes / 1024)} KB</td><td>{document.scanStatus}</td><td>{document.extractionStatus}</td><td><a href={`/api/internal/cases/${caseId}/documents/${document.id}`} target="_blank" rel="noreferrer">Geschützt öffnen ↗</a></td></tr>) : <tr><td colSpan={5}>Keine Dokumente eingereicht.</td></tr>}</tbody></table></div>
        </section>

        <section className="operations-panel revision-panel"><header><div><span>FAKTENMODELL</span><h2>Erkannte Fakten</h2></div><strong>{factRows.length}</strong></header>
          <div className="revision-facts">{factRows.length ? factRows.map(fact => <article key={fact.id}><strong>{fact.predicate}</strong><p>{fact.value}</p><small>{fact.status} · Konfidenz {fact.confidence}%</small></article>) : <p>Noch keine strukturierten Fakten gespeichert.</p>}</div>
        </section>

        <section className="operations-panel revision-panel"><header><div><span>ERGEBNISREVISION</span><h2>Analyse und vollständiger Rechtsfall-Check</h2></div><strong>{assessmentRows.length}</strong></header>
          {assessmentRows.length ? <>{assessmentRows.map((assessment, index) => <details className="revision-assessment-version" key={assessment.id} open={index === 0}><summary><span>Version {assessment.version}</span><span>{assessment.decision}</span><span>{dateTime(assessment.createdAt)}</span></summary><pre className="revision-json">{JSON.stringify(assessment.payloadJson, null, 2)}</pre></details>)}{finalAvailable && <Link className="button" href={`/fallraum/${caseId}/bericht`}>Gestalteten Rechtsfall-Check öffnen</Link>}</> : <p>Noch kein Analyseergebnis vorhanden.</p>}
        </section>

        <section className="operations-panel revision-panel"><header><div><span>E-MAIL-STATUS</span><h2>Versand, Zustellung und Interaktion</h2></div><strong>{emailTimeline.length}</strong></header>
          <p className="reach-measurement-note">„Geöffnet“ und „Link angeklickt“ sind technische Signale des Mailanbieters. Sie beweisen nicht sicher, dass die Nachricht persönlich gelesen wurde.</p>
          <div className="revision-timeline">{emailTimeline.length ? emailTimeline.map(event => <article key={event.id}><time>{dateTime(event.at)}</time><strong>{event.status}</strong><span>{event.subject || event.kind}</span>{event.detail && <small>{event.detail}</small>}</article>) : <p>Noch keine Versand- oder SendGrid-Ereignisse zu diesem Fall gespeichert. Ältere Zustellereignisse können nicht rückwirkend rekonstruiert werden.</p>}</div>
        </section>

        <section className="operations-panel revision-panel"><header><div><span>AUDIT-PROTOKOLL</span><h2>Bearbeitungs- und Systemverlauf</h2></div><strong>{auditRows.length}</strong></header>
          <div className="revision-timeline">{auditRows.map(event => <article key={event.id}><time>{dateTime(event.createdAt)}</time><strong>{event.eventType}</strong><span>{event.targetType || "Fall"}</span></article>)}</div>
        </section>
      </div>
    </main>
    <MemberFooter />
  </div>;
}
