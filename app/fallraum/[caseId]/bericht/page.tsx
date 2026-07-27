import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { assessments, documents } from "../../../../db/schema";
import { getLegalArea } from "../../../../lib/legal-areas";
import { ownedCase } from "../../../../lib/server/case-access";
import { getAuthenticatedMember } from "../../../../lib/server/member";
import { PrintActions } from "./print-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Persönlicher Prüfbericht | Rechtsfall-Check.de", robots: { index: false, follow: false } };

type ReportPayload = {
  stage?: string; summary?: string; chronology?: string[]; facts?: string[];
  uncertainFacts?: string[]; documentFindings?: string[]; legalIssues?: string[];
  sources?: string[]; deadlineWarnings?: string[]; limitations?: string[];
  options?: Array<{ title: string; explanation: string; urgency: string }>;
  nextStep?: { title: string; explanation: string; urgency: string };
  generatedAt?: string;
  officialSources?: Array<{ id: string; title: string; url: string; authority: string; reviewStatus: string }>;
  deadlineCandidates?: Array<{ id: string; headline: string; explanation: string; source: { title: string; url: string } }>;
};

function ReportSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return <section className="report-section">
    <header><span>{number}</span><h2>{title}</h2></header>
    {children}
  </section>;
}

function List({ items, ordered = false }: { items?: string[]; ordered?: boolean }) {
  if (!items?.length) return <p className="report-empty">Hierzu liegen derzeit keine gesonderten Feststellungen vor.</p>;
  return ordered
    ? <ol className="report-list">{items.map(item => <li key={item}>{item}</li>)}</ol>
    : <ul className="report-list">{items.map(item => <li key={item}>{item}</li>)}</ul>;
}

export default async function ReportPage({ params, searchParams }: { params: Promise<{ caseId: string }>; searchParams: Promise<{ version?: string }> }) {
  const member = await getAuthenticatedMember();
  if (!member) redirect("/anmelden");
  const { caseId } = await params;
  const requestedVersion = Number.parseInt((await searchParams).version || "", 10);
  const item = await ownedCase(caseId, member.id);
  if (!item || item.status === "DELETED") redirect("/fallraum");
  const db = getDb();
  const [[latest], documentRows] = await Promise.all([
    db.select().from(assessments).where(Number.isFinite(requestedVersion)
      ? and(eq(assessments.caseId, caseId), eq(assessments.version, requestedVersion))
      : eq(assessments.caseId, caseId)).orderBy(desc(assessments.version)).limit(1),
    db.select({ id: documents.id, originalName: documents.originalName, extractionStatus: documents.extractionStatus })
      .from(documents).where(eq(documents.caseId, caseId)),
  ]);
  if (!latest) redirect(`/fallraum/${caseId}`);

  const result = latest.payloadJson as ReportPayload;
  const area = getLegalArea(item.legalArea);
  const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ") || member.displayName;
  const reportDate = new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(latest.createdAt);
  const reference = `RFC-${caseId.slice(0, 8).toUpperCase()}-V${latest.version}`;
  const salutation = `Guten Tag ${fullName},`;

  return <main className="report-page">
    <PrintActions caseId={caseId} />
    <article className="report-paper">
      <header className="report-letterhead">
        <Image src="/rechtsfall-check-logo.png" alt="Rechtsfall-Check.de – Ein Fall für KI" width={8000} height={2000} priority />
        <div><span>Persönlicher Prüfbericht</span><strong>Nicht abschließende Ersteinschätzung</strong></div>
      </header>

      <div className="report-address-row">
        <address>
          <span>Persönlich und vertraulich</span>
          <strong>{fullName}</strong>
          {member.street && <span>{member.street}</span>}
          {(member.postalCode || member.city) && <span>{[member.postalCode, member.city].filter(Boolean).join(" ")}</span>}
          <span>{member.email}</span>
        </address>
        <dl>
          <div><dt>Datum</dt><dd>{reportDate}</dd></div>
          <div><dt>Fallnummer</dt><dd>{reference}</dd></div>
          <div><dt>Rechtsgebiet</dt><dd>{area.title}</dd></div>
          <div><dt>Unterlagen</dt><dd>{documentRows.length}</dd></div>
        </dl>
      </div>

      <section className="report-intro">
        <span>ERGEBNIS IHRES RECHTSFALL-CHECKS</span>
        <h1>{item.title}</h1>
        <p className="report-salutation">{salutation}</p>
        <p>auf Grundlage Ihrer Fallschilderung, Ihrer Antworten und der eingereichten Unterlagen haben wir Ihren Rechtsfall strukturiert vorgeprüft. Nachfolgend erhalten Sie die persönliche Zusammenfassung des aktuellen Prüfstands.</p>
      </section>

      <section className="report-executive">
        <span>ERGEBNIS IN KÜRZE</span>
        <p>{result.summary}</p>
      </section>

      {result.nextStep && <section className={`report-next urgency-${result.nextStep.urgency?.toLowerCase() || "normal"}`}>
        <span>NÄCHSTER SINNVOLLER SCHRITT</span>
        <h2>{result.nextStep.title}</h2>
        <p>{result.nextStep.explanation}</p>
      </section>}

      <ReportSection number="01" title="Ihr Fall und der zeitliche Ablauf"><List items={result.chronology} ordered /></ReportSection>
      <ReportSection number="02" title="Festgestellte Tatsachen"><List items={result.facts} /></ReportSection>
      <ReportSection number="03" title="Auswertung der eingereichten Unterlagen">
        <List items={result.documentFindings} />
        {!!documentRows.length && <div className="report-document-index"><strong>Berücksichtigte Dateien</strong>{documentRows.map(document => <span key={document.id}>{document.originalName} · {document.extractionStatus === "COMPLETED" ? "ausgewertet" : "ohne vollständige Extraktion"}</span>)}</div>}
      </ReportSection>
      <ReportSection number="04" title="Rechtliche Prüffragen"><List items={result.legalIssues} /></ReportSection>
      <ReportSection number="05" title="Mögliche Regelungsbereiche"><List items={result.sources} /></ReportSection>
      {!!result.officialSources?.length && <section className="report-source-index">
        <h3>Amtliche Informationsgrundlagen</h3>
        <p>Diese Links führen zu den amtlichen Gesetzestexten. Ihre Zuordnung zum Einzelfall ist redaktionell freizugeben.</p>
        <ul>{result.officialSources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
      </section>}
      {!!result.deadlineWarnings?.length && <ReportSection number="06" title="Fristen und Dringlichkeit"><div className="report-warning"><List items={result.deadlineWarnings} /></div></ReportSection>}

      {!!result.options?.length && <ReportSection number="07" title="Mögliche nächste Schritte">
        <div className="report-options">{result.options.map((option, index) => <article key={option.title}>
          <span>{String(index + 1).padStart(2, "0")} · {option.urgency === "NOW" ? "Jetzt" : option.urgency === "SOON" ? "Zeitnah" : "Prüfschritt"}</span>
          <h3>{option.title}</h3><p>{option.explanation}</p>
        </article>)}</div>
      </ReportSection>}

      <ReportSection number="08" title="Noch nicht sicher belegt und Grenzen der Prüfung">
        <List items={[...(result.uncertainFacts || []), ...(result.limitations || [])]} />
      </ReportSection>

      <section className="report-closing">
        <p>Dieser Prüfbericht soll Ihnen helfen, den Sachverhalt, die Unterlagen und die nächsten Prüfschritte nachvollziehbar einzuordnen.</p>
        <p>Mit freundlichen Grüßen<br/><strong>Ihr Rechtsfall-Check</strong><br/><em>Ein Fall für KI</em></p>
      </section>

      <footer className="report-footer">
        <strong>Wichtiger Hinweis</strong>
        <p>Dieser persönliche Prüfbericht ist eine KI-gestützte, nicht abschließende Ersteinschätzung. Er ersetzt keine anwaltliche Rechtsberatung, enthält keine verbindliche Handlungsanweisung und ist keine finale Einzelfallentscheidung.</p>
        <span>Rechtsfall-Check.de · Media Online Innovations Group · Referenz {reference}</span>
      </footer>
    </article>
  </main>;
}
