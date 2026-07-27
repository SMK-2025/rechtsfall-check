"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Brand } from "./components/site-chrome";
import { SkipLink } from "./components/skip-link";
import { MemberFooter } from "./components/member-footer";
import { getLegalArea, legalAreas } from "../lib/legal-areas";

type Result = {
  summary: string;
  facts: string[];
  missing: string[];
  sources: string[];
  gate: string;
  decision?: string;
};

type CaseData = {
  id: string;
  title: string;
  legalArea: string;
  status: string;
  paymentStatus: string;
};

const federalStates = ["Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen"];

export function CaseWorkspace({ userName, caseId }: { userName: string; caseId: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [file, setFile] = useState("");
  const [paid, setPaid] = useState(false);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [topic, setTopic] = useState("");
  const [documentCount, setDocumentCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/v1/cases/${caseId}`, { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Falldaten konnten nicht geladen werden.");
        return response.json();
      })
      .then(data => {
        setCaseData(data.case);
        setPaid(data.case?.paymentStatus === "PAID");
        const area = getLegalArea(data.case?.legalArea);
        setTopic(area.topics[0] || "");
        setDocumentCount(data.documents?.length || 0);
        setQuestionCount(data.questions?.filter((question: { status: string }) => question.status === "OPEN").length || 0);
        const latest = data.assessments?.at(-1)?.payloadJson as Result | undefined;
        if (latest) setResult(latest);
      })
      .catch(() => setError("Falldaten konnten nicht geladen werden."));
  }, [caseId]);

  const area = useMemo(() => getLegalArea(caseData?.legalArea), [caseData?.legalArea]);
  const progress = result ? 100 : documentCount ? 55 : 25;

  async function changeLegalArea(legalArea: string) {
    setError("");
    const response = await fetch(`/api/v1/cases/${caseId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ legalArea }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message || "Das Rechtsgebiet konnte nicht geändert werden.");
      return;
    }
    setCaseData(current => current ? { ...current, legalArea } : current);
    const nextArea = getLegalArea(legalArea);
    setTopic(nextArea.topics[0] || "");
    setResult(null);
  }

  async function checkout() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/v1/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caseId }),
    });
    const data = await response.json();
    if (response.ok && data.url) {
      window.location.href = data.url;
      return;
    }
    setError(data.error?.message || "Die Zahlung konnte nicht gestartet werden.");
    setBusy(false);
  }

  async function analyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paid) {
      await checkout();
      return;
    }
    setBusy(true);
    setResult(null);
    setError("");
    const form = new FormData(event.currentTarget);
    const selected = (document.getElementById("document") as HTMLInputElement)?.files?.[0];
    if (selected) {
      const upload = new FormData();
      upload.set("file", selected);
      const uploadResponse = await fetch(`/api/v1/cases/${caseId}/documents`, { method: "POST", body: upload });
      if (!uploadResponse.ok) {
        setError("Die Datei konnte nicht sicher gespeichert werden. Bitte prüfen Sie Dateityp und Größe.");
        setBusy(false);
        return;
      }
      setDocumentCount(count => count + 1);
    }
    const response = await fetch("/api/v1/assessments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        caseId,
        legalArea: area.id,
        topic: form.get("topic"),
        eventDate: form.get("eventDate"),
        federalState: form.get("federalState"),
        description: form.get("description"),
        desiredOutcome: form.get("desiredOutcome"),
        opposingParty: form.get("opposingParty"),
        hasDocument: Boolean(selected || documentCount),
        aiConsent: form.get("aiConsent") === "on",
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message || "Die Analyse konnte nicht erstellt werden.");
      setBusy(false);
      return;
    }
    setResult(data);
    setQuestionCount(data.missing?.length || 0);
    setBusy(false);
  }

  return <div className="app-shell">
    <SkipLink />
    <header className="member-nav">
      <Brand />
      <nav aria-label="Fallraum">
        <Link href="/fallraum">Übersicht</Link>
        <Link className="active" href={`/fallraum/${caseId}`}>Fallakte</Link>
        <Link href="/profil">Profil</Link>
      </nav>
      <div><Link className="profile-link" href="/profil">{userName}</Link></div>
    </header>

    <div className="app-layout">
      <aside className="app-sidebar">
        <Link href="/fallraum">← Zur Fallübersicht</Link>
        <div className="sidebar-case">
          <span>{area.icon}</span>
          <strong>{area.shortTitle}</strong>
          <small>{caseData?.title || "Ihre Fallakte"}</small>
        </div>
        <div className="case-progress">
          <div><span>Bearbeitungsstand</span><strong>{progress} %</strong></div>
          <i><b style={{ width: `${progress}%` }} /></i>
        </div>
        <ol className="app-steps">
          <li className={!result ? "active" : "done"}><b>1</b><span>Fall beschreiben<small>Sachverhalt und Ziel</small></span></li>
          <li className={documentCount ? "done" : ""}><b>2</b><span>Unterlagen<small>{documentCount} hochgeladen</small></span></li>
          <li className={questionCount ? "attention" : ""}><b>3</b><span>Rückfragen<small>{questionCount ? `${questionCount} offen` : "werden ermittelt"}</small></span></li>
          <li className={result ? "active done" : ""}><b>4</b><span>Ersteinschätzung<small>{result ? "Ergebnis vorhanden" : "nach der Analyse"}</small></span></li>
        </ol>
        <div className="sidebar-security"><b>✓ Geschützter Fallraum</b><span>Ihre Angaben sind nur Ihrem Konto und dieser Fallakte zugeordnet.</span></div>
      </aside>

      <main id="main-content" tabIndex={-1} className="app-content">
        <div className="case-breadcrumb"><Link href="/fallraum">Meine Fälle</Link><span>›</span><span>{area.shortTitle}</span></div>
        <div className="case-heading-row">
          <div>
            <h1>{caseData?.title || "Ihre Fallakte"}</h1>
            <p className="lead">Schildern Sie den Ablauf in Ihren Worten. Der Rechtsfall Check strukturiert Fakten, Unterlagen, offene Punkte und mögliche nächste Prüfschritte.</p>
          </div>
          <span className={`case-payment-badge ${paid ? "paid" : ""}`}>{paid ? "✓ Freigeschaltet" : "Noch nicht bezahlt"}</span>
        </div>

        {!paid && <section className="paywall">
          <div><span className="paywall-kicker">RECHTSFALL CHECK</span><strong>Vollständige Fallprüfung freischalten</strong><p>Strukturierte Fallanalyse, Dokumenteneinbeziehung, Rückfragen und nicht abschließende Ersteinschätzung – einmalig 39 €, kein Abo.</p></div>
          <button className="button" onClick={checkout} disabled={busy}>{busy ? "Zahlung wird geöffnet …" : "Für 39 € freischalten →"}</button>
        </section>}

        {error && <p className="auth-error" role="alert" aria-live="assertive">{error}</p>}

        <form className="app-card" onSubmit={analyze}>
          <div className="form-section-heading">
            <span>01</span>
            <div><h2>Ihr Anliegen einordnen</h2><p>Die Angaben bestimmen die passenden Rückfragen und Informationsgrundlagen.</p></div>
            {caseData && <div
              className={`area-info-popover ${infoOpen ? "open" : ""}`}
              onMouseEnter={() => setInfoOpen(true)}
              onMouseLeave={() => setInfoOpen(false)}
            >
              <button
                type="button"
                className="area-info-trigger"
                aria-label={`Hinweise zu ${area.title} anzeigen`}
                aria-expanded={infoOpen}
                aria-controls="area-information"
                onClick={() => setInfoOpen(open => !open)}
                onFocus={() => setInfoOpen(true)}
                onKeyDown={event => { if (event.key === "Escape") setInfoOpen(false); }}
              >i</button>
              <div id="area-information" className="area-info-card" role="note">
                <div className="area-info-head">
                  <div><span className="section-label">HINWEISE ZUM RECHTSGEBIET</span><h3>{area.title}</h3></div>
                  <button type="button" aria-label="Hinweise schließen" onClick={() => setInfoOpen(false)}>×</button>
                </div>
                {area.risk !== "standard" && <div className={`area-info-risk ${area.risk}`}>
                  <strong>{area.risk === "urgent" ? "Sofortige fachkundige Hilfe kann erforderlich sein." : "Bitte besonders auf laufende Fristen achten."}</strong>
                  <span>{area.guidance[area.guidance.length - 1]}</span>
                </div>}
                <div className="area-info-columns">
                  <section><h4>Erste Orientierung</h4><ul>{area.guidance.map(item => <li key={item}>{item}</li>)}</ul></section>
                  <section><h4>Sinnvolle Unterlagen</h4><ul>{area.documents.map(item => <li key={item}>{item}</li>)}</ul></section>
                </div>
                <section className="area-info-sources"><h4>Mögliche Regelungsbereiche</h4><p>{area.sourceLabels.join(" · ")}</p></section>
                <small>Die konkrete Anwendbarkeit, Ausnahmen und Fristen hängen von den vollständigen Fallangaben ab.</small>
              </div>
            </div>}
          </div>
          <div className="app-grid">
            <div className="field">
              <label htmlFor="caseLegalArea">Rechtsgebiet</label>
              <select id="caseLegalArea" value={area.id} onChange={event => void changeLegalArea(event.target.value)}>
                {legalAreas.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="topic">Worum geht es konkret?</label>
              <select id="topic" name="topic" value={topic} onChange={event => setTopic(event.target.value)}>
                {area.topics.map(item => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="eventDate">Wann ist es passiert?</label>
              <input id="eventDate" name="eventDate" type="date" required />
            </div>
            <div className="field">
              <label htmlFor="federalState">In welchem Bundesland?</label>
              <select id="federalState" name="federalState" defaultValue="">
                <option value="" disabled>Bitte auswählen</option>
                {federalStates.map(state => <option key={state}>{state}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="opposingParty">Wer ist die andere Seite?</label>
              <input id="opposingParty" name="opposingParty" placeholder="z. B. Nachbar, Arbeitgeber, Händler" />
            </div>
          </div>

          <div className="form-section-heading divided"><span>02</span><div><h2>Was ist passiert?</h2><p>Beschreiben Sie Ereignisse möglichst chronologisch. Juristische Begriffe sind nicht erforderlich.</p></div></div>
          <div className="app-grid">
            <div className="field full">
              <label htmlFor="description">Ihre Fallschilderung</label>
              <textarea id="description" name="description" required minLength={40} placeholder="Was ist wann passiert? Wer war beteiligt? Was wurde vereinbart oder mitgeteilt? Welche Reaktion gab es bisher?" />
              <small className="field-help">Tipp: Nennen Sie konkrete Daten, Beträge, Schreiben und bisherige Reaktionen.</small>
            </div>
            <div className="field full">
              <label htmlFor="desiredOutcome">Was möchten Sie erreichen?</label>
              <textarea className="compact-textarea" id="desiredOutcome" name="desiredOutcome" required placeholder="z. B. Störung beenden, Zahlung erhalten, Bescheid prüfen oder Vertrag beenden" />
            </div>
          </div>

          <div className="form-section-heading divided"><span>03</span><div><h2>Unterlagen hinzufügen</h2><p>Belege helfen dabei, Aussagen und zeitliche Abläufe nachvollziehbar zuzuordnen.</p></div></div>
          <div className="field">
            <input className="visually-hidden file-input" id="document" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={event => setFile(event.target.files?.[0]?.name || "")} />
            <label className="upload-zone" htmlFor="document"><span>↥</span><span><strong>{file || "PDF, Foto oder Schreiben auswählen"}</strong><small aria-live="polite">{file ? `Ausgewählt: ${file}` : "PDF, JPG oder PNG · maximal 10 MB pro Datei"}</small></span></label>
          </div>

          <label className="consent">
            <input type="checkbox" name="aiConsent" required />
            <span>Ich willige ausdrücklich ein, dass meine Angaben – soweit sie besondere Kategorien personenbezogener Daten enthalten – zur Erstellung der Analyse durch den konfigurierten KI-Dienstleister verarbeitet werden. Die Einwilligung ist freiwillig und jederzeit für die Zukunft widerrufbar. Details: <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link>.</span>
          </label>

          <div className="app-actions">
            <small>Ihre Angaben werden verschlüsselt übertragen und ausschließlich Ihrer Fallakte zugeordnet.</small>
            <button className="button" disabled={busy}>{busy ? "Fall wird verarbeitet …" : paid ? "Rechtsfall Check starten →" : "Fallprüfung freischalten →"}</button>
          </div>
        </form>

        {result && <section className="assessment-result" aria-live="polite">
          <header><div><span className="section-label">IHRE ERSTEINSCHÄTZUNG</span><h2>Struktur und nächste Prüfschritte</h2></div><span className="result-version">Aktueller Stand</span></header>
          <div className="result-summary"><h3>Vorläufige Einordnung</h3><p>{result.summary}</p></div>
          <div className="result-grid">
            <div className="result-box"><h3>ERKANNTE FAKTEN</h3><ul>{result.facts.map(item => <li key={item}>{item}</li>)}</ul></div>
            <div className="result-box"><h3>OFFENE FRAGEN</h3><ul>{result.missing.map(item => <li key={item}>{item}</li>)}</ul></div>
            <div className="result-box"><h3>MÖGLICHE RECHTSGRUNDLAGEN</h3><ul>{result.sources.map(item => <li key={item}>{item}</li>)}</ul></div>
            <div className="result-box"><h3>QUALITÄTS- UND RISIKOPRÜFUNG</h3><p>{result.gate}</p></div>
          </div>
          <div className="result-boundary"><strong>Wichtiger Hinweis</strong><span>Diese strukturierte Ersteinschätzung ersetzt keine anwaltliche Beratung, enthält keine verbindliche Handlungsanweisung und ist keine finale Einzelfallentscheidung.</span></div>
        </section>}
      </main>
    </div>
    <MemberFooter />
  </div>;
}
