"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SkipLink } from "./components/skip-link";
import { MemberFooter } from "./components/member-footer";
import { MemberNavigation } from "./components/member-navigation";
import { getLegalArea, legalAreas } from "../lib/legal-areas";

type Result = {
  stage?: "NEEDS_INFORMATION" | "PRELIMINARY_ASSESSMENT" | "ESCALATE";
  summary: string;
  facts: string[];
  uncertainFacts?: string[];
  chronology?: string[];
  documentFindings?: string[];
  legalIssues?: string[];
  deadlineWarnings?: string[];
  contradictions?: string[];
  sources: string[];
  limitations?: string[];
  options?: Array<{ title: string; explanation: string; urgency: string }>;
  nextStep?: { title: string; explanation: string; urgency: string };
  decision?: string;
  version?: number;
};
type FollowUp = { id: string; questionKey?: string; prompt: string; reason?: string; required?: boolean; answer?: string | null; status: string };
type CaseDocument = { id: string; originalName: string; sizeBytes: number; extractionStatus: string; extractionJson?: { summary?: string } };

type CaseData = {
  id: string;
  title: string;
  legalArea: string;
  status: string;
  paymentStatus: string;
  intakeJson?: IntakeDraft;
};

type IntakeDraft = {
  topic: string;
  eventDate: string;
  federalState: string;
  opposingParty: string;
  description: string;
  desiredOutcome: string;
};

const federalStates = ["Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen"];

export function CaseWorkspace({ userName, userEmail, caseId }: { userName: string; userEmail: string; caseId: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [paid, setPaid] = useState(false);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState<IntakeDraft>({ topic: "", eventDate: "", federalState: "", opposingParty: "", description: "", desiredOutcome: "" });
  const [documentCount, setDocumentCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [questions, setQuestions] = useState<FollowUp[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionStep, setQuestionStep] = useState(0);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const [purchaseConsent, setPurchaseConsent] = useState(false);
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
        const saved = data.case?.intakeJson as Partial<IntakeDraft> | undefined;
        const savedTopic = saved?.topic && area.topics.includes(saved.topic) ? saved.topic : area.topics[0] || "";
        setTopic(savedTopic);
        setDraft({
          topic: savedTopic,
          eventDate: saved?.eventDate || "",
          federalState: saved?.federalState || "",
          opposingParty: saved?.opposingParty || "",
          description: saved?.description || "",
          desiredOutcome: saved?.desiredOutcome || "",
        });
        setDocuments(data.documents || []);
        setDocumentCount(data.documents?.length || 0);
        const openQuestions = (data.questions || []).filter((question: FollowUp) =>
          question.status === "OPEN" && !question.questionKey?.startsWith("assessment_"));
        setQuestions(openQuestions);
        setQuestionCount(openQuestions.length);
        setQuestionStep(0);
        const latest = data.assessments?.at(-1)?.payloadJson as Result | undefined;
        if (latest) setResult(latest);
      })
      .catch(() => setError("Falldaten konnten nicht geladen werden."));
  }, [caseId]);

  const area = useMemo(() => getLegalArea(caseData?.legalArea), [caseData?.legalArea]);
  const progress = result?.stage === "PRELIMINARY_ASSESSMENT" || result?.stage === "ESCALATE"
    ? 100 : questions.length ? 75 : documentCount ? 55 : 25;
  const updateDraft = (field: keyof IntakeDraft, value: string) => setDraft(current => ({ ...current, [field]: value }));

  async function persistDraft(silent = false) {
    const response = await fetch(`/api/v1/cases/${caseId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intake: { ...draft, topic } }),
    });
    if (!response.ok) {
      if (!silent) setError("Ihre Fallschilderung konnte nicht gespeichert werden. Die Zahlung wurde nicht gestartet.");
      return false;
    }
    return true;
  }

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
    setDraft(current => ({ ...current, topic: nextArea.topics[0] || "" }));
    setResult(null);
  }

  async function checkout() {
    if (!purchaseConsent) {
      setError("Bitte bestätigen Sie vor der Zahlung die AGB und den gewünschten Leistungsbeginn.");
      return;
    }
    setBusy(true);
    setError("");
    if (!await persistDraft()) {
      setBusy(false);
      return;
    }
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
    setError("");
    const form = new FormData(event.currentTarget);
    if (selectedFiles.length) {
      const uploadedDocuments: CaseDocument[] = [];
      const failedFiles: File[] = [];
      for (const selected of selectedFiles) {
        const upload = new FormData();
        upload.set("file", selected);
        const uploadResponse = await fetch(`/api/v1/cases/${caseId}/documents`, { method: "POST", body: upload });
        if (!uploadResponse.ok) {
          failedFiles.push(selected);
          continue;
        }
        const uploaded = await uploadResponse.json() as { document: CaseDocument };
        uploadedDocuments.push(uploaded.document);
      }
      if (uploadedDocuments.length) {
        setDocuments(current => {
          const byId = new Map(current.map(document => [document.id, document]));
          uploadedDocuments.forEach(document => byId.set(document.id, document));
          return [...byId.values()];
        });
        const newCount = uploadedDocuments.filter(document => !documents.some(existing => existing.id === document.id)).length;
        setDocumentCount(count => count + newCount);
      }
      setSelectedFiles(failedFiles);
      if (failedFiles.length) {
        setError(`${failedFiles.length} von ${selectedFiles.length} Dateien konnten nicht gespeichert werden. Bitte prüfen Sie Dateityp und Größe. Bereits erfolgreiche Uploads sind in der Fallakte gespeichert.`);
        setBusy(false);
        return;
      }
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
        hasDocument: Boolean(selectedFiles.length || documentCount),
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
    setQuestions(data.questions || []);
    setQuestionCount(data.questions?.length || 0);
    setQuestionStep(0);
    setBusy(false);
  }

  async function advanceQuestion() {
    const question = questions[questionStep];
    if (!question) return;
    const answer = answers[question.id]?.trim() || "";
    if (question.required && !answer) {
      setError("Bitte beantworten Sie diese Frage, bevor Sie fortfahren.");
      return;
    }
    setBusy(true);
    setError("");
    if (answer) {
      const saved = await fetch(`/api/v1/cases/${caseId}/questions`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers: [{ id: question.id, answer }] }),
      });
      if (!saved.ok) {
        const data = await saved.json();
        setError(data.error?.message || "Ihre Antwort konnte nicht gespeichert werden.");
        setBusy(false);
        return;
      }
    }
    if (questionStep < questions.length - 1) {
      setQuestionStep(step => step + 1);
      setBusy(false);
      return;
    }

    const response = await fetch("/api/v1/assessments", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ caseId, ...draft, topic, aiConsent: true }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message || "Die vertiefte Analyse konnte nicht abgeschlossen werden.");
      setBusy(false);
      return;
    }
    setResult(data);
    setQuestions(data.questions || []);
    setQuestionCount(data.questions?.length || 0);
    setQuestionStep(0);
    setAnswers({});
    setBusy(false);
  }

  return <div className="app-shell">
    <SkipLink />
    <MemberNavigation userName={userName} userEmail={userEmail} caseId={caseId}/>

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
          <div><span className="paywall-kicker">RECHTSFALL CHECK</span><strong>Rechtsfall Check verbindlich einreichen</strong><p>Strukturierte Fallanalyse, Dokumenteneinbeziehung, Rückfragen und nicht abschließende Ersteinschätzung – 19 € für diesen Fall, kein Abo.</p>
            <label className="purchase-consent"><input type="checkbox" checked={purchaseConsent} onChange={event => setPurchaseConsent(event.target.checked)}/><span>Ich akzeptiere die <Link href="/agb" target="_blank">AGB</Link> und verlange ausdrücklich, dass die Leistung vor Ablauf der Widerrufsfrist beginnt. Mir ist bekannt, dass mein Widerrufsrecht bei vollständiger Vertragserfüllung erlischt.</span></label>
          </div>
          <button className="button" onClick={checkout} disabled={busy||!purchaseConsent}>{busy ? "Zahlung wird geöffnet …" : "Zahlungspflichtig für 19 € bestellen →"}</button>
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
              <select id="topic" name="topic" value={topic} onChange={event => {setTopic(event.target.value);updateDraft("topic",event.target.value);}} onBlur={() => void persistDraft(true)}>
                {area.topics.map(item => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="eventDate">Wann ist es passiert?</label>
              <input id="eventDate" name="eventDate" type="date" value={draft.eventDate} onChange={event => updateDraft("eventDate",event.target.value)} onBlur={() => void persistDraft(true)} required />
            </div>
            <div className="field">
              <label htmlFor="federalState">In welchem Bundesland?</label>
              <select id="federalState" name="federalState" value={draft.federalState} onChange={event => updateDraft("federalState",event.target.value)} onBlur={() => void persistDraft(true)}>
                <option value="" disabled>Bitte auswählen</option>
                {federalStates.map(state => <option key={state}>{state}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="opposingParty">Wer ist die andere Seite?</label>
              <input id="opposingParty" name="opposingParty" value={draft.opposingParty} onChange={event => updateDraft("opposingParty",event.target.value)} onBlur={() => void persistDraft(true)} placeholder="z. B. Nachbar, Arbeitgeber, Händler" />
            </div>
          </div>

          <div className="form-section-heading divided"><span>02</span><div><h2>Was ist passiert?</h2><p>Beschreiben Sie Ereignisse möglichst chronologisch. Juristische Begriffe sind nicht erforderlich.</p></div></div>
          <div className="app-grid">
            <div className="field full">
              <label htmlFor="description">Ihre Fallschilderung</label>
              <textarea id="description" name="description" value={draft.description} onChange={event => updateDraft("description",event.target.value)} onBlur={() => void persistDraft(true)} required minLength={40} placeholder="Was ist wann passiert? Wer war beteiligt? Was wurde vereinbart oder mitgeteilt? Welche Reaktion gab es bisher?" />
              <small className="field-help">Tipp: Nennen Sie konkrete Daten, Beträge, Schreiben und bisherige Reaktionen.</small>
            </div>
            <div className="field full">
              <label htmlFor="desiredOutcome">Was möchten Sie erreichen?</label>
              <textarea className="compact-textarea" id="desiredOutcome" name="desiredOutcome" value={draft.desiredOutcome} onChange={event => updateDraft("desiredOutcome",event.target.value)} onBlur={() => void persistDraft(true)} required placeholder="z. B. Störung beenden, Zahlung erhalten, Bescheid prüfen oder Vertrag beenden" />
            </div>
          </div>

          <div className="form-section-heading divided"><span>03</span><div><h2>Unterlagen hinzufügen</h2><p>Belege helfen dabei, Aussagen und zeitliche Abläufe nachvollziehbar zuzuordnen.</p></div></div>
          <div className="field">
            <input className="visually-hidden file-input" id="document" type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
              onChange={event => {
                const next = Array.from(event.target.files || []);
                setSelectedFiles(current => {
                  const bySignature = new Map(current.map(file => [`${file.name}:${file.size}:${file.lastModified}`, file]));
                  next.forEach(file => bySignature.set(`${file.name}:${file.size}:${file.lastModified}`, file));
                  return [...bySignature.values()].slice(0, 20);
                });
                event.target.value = "";
              }} />
            <label className="upload-zone" htmlFor="document"><span>↥</span><span>
              <strong>{selectedFiles.length ? "Weitere Unterlagen auswählen" : "Mehrere Unterlagen oder Korrespondenz auswählen"}</strong>
              <small aria-live="polite">{selectedFiles.length ? `${selectedFiles.length} Datei${selectedFiles.length === 1 ? "" : "en"} für den Upload vorgemerkt` : "Bis zu 20 PDF-, JPG- oder PNG-Dateien · maximal 10 MB pro Datei"}</small>
            </span></label>
          </div>
          {selectedFiles.length > 0 && <div className="selected-file-list" aria-label="Für den Upload ausgewählte Dateien">
            {selectedFiles.map((selected, index) => <article key={`${selected.name}:${selected.lastModified}`}>
              <div><strong>{selected.name}</strong><small>{Math.max(1, Math.round(selected.size / 1024))} KB</small></div>
              <button type="button" onClick={() => setSelectedFiles(current => current.filter((_, fileIndex) => fileIndex !== index))} aria-label={`${selected.name} aus der Auswahl entfernen`}>×</button>
            </article>)}
          </div>}
          {documents.length > 0 && <div className="document-list" aria-label="Unterlagen in dieser Fallakte">
            {documents.map(document => <article key={document.id}>
              <span aria-hidden="true">▤</span>
              <div><strong>{document.originalName}</strong><small>{Math.max(1, Math.round(document.sizeBytes / 1024))} KB · {
                document.extractionStatus === "COMPLETED" ? "Inhalt ausgewertet"
                  : document.extractionStatus === "FAILED" ? "Auswertung erneut erforderlich"
                    : "Wird bei der Analyse ausgewertet"
              }</small></div>
              <b className={document.extractionStatus === "COMPLETED" ? "complete" : ""}>
                {document.extractionStatus === "COMPLETED" ? "✓" : "…"}
              </b>
            </article>)}
          </div>}

          <label className="consent">
            <input type="checkbox" name="aiConsent" required />
            <span>Ich willige ausdrücklich ein, dass meine Angaben – soweit sie besondere Kategorien personenbezogener Daten enthalten – zur Erstellung der Analyse durch den konfigurierten KI-Dienstleister verarbeitet werden. Die Einwilligung ist freiwillig und jederzeit für die Zukunft widerrufbar. Details: <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link>.</span>
          </label>

          <div className="app-actions">
            <small>Ihre Angaben werden verschlüsselt übertragen, als Entwurf in Ihrer Fallakte gespeichert und nach der Zahlung wiederhergestellt.</small>
            <button className="button" disabled={busy||(!paid&&!purchaseConsent)}>{busy ? "Fall wird verarbeitet …" : paid ? "Rechtsfall Check starten →" : "Zahlungspflichtig für 19 € bestellen →"}</button>
          </div>
        </form>

        {questions.length > 0 && <section className="follow-up-panel wizard" aria-live="polite">
          <header>
            <div><span className="section-label">ANALYSE 2 · VERTIEFENDE RÜCKFRAGEN</span><h2>Schritt für Schritt zum genaueren Ergebnis</h2></div>
            <span>Frage {questionStep + 1} von {questions.length}</span>
          </header>
          <p>Ihre Fallaufnahme und die vorliegenden Unterlagen wurden erstmals analysiert. Die folgenden Fragen ergeben sich aus dieser Prüfung und Ihrem gewählten Rechtsgebiet.</p>
          <div className="wizard-progress" aria-label={`Frage ${questionStep + 1} von ${questions.length}`}>
            <div><span>Rückfragen</span><strong>{Math.round(((questionStep + 1) / questions.length) * 100)} %</strong></div>
            <i><b style={{ width: `${((questionStep + 1) / questions.length) * 100}%` }} /></i>
          </div>
          <div className="follow-up-list">
            {questions[questionStep] && <div className="follow-up-question wizard-question" key={questions[questionStep].id}>
              <div className="question-number">{String(questionStep + 1).padStart(2, "0")}</div>
              <div className="field">
                <label htmlFor={`answer-${questions[questionStep].id}`}>{questions[questionStep].prompt}{questions[questionStep].required && <b> erforderlich</b>}</label>
                {questions[questionStep].reason && <small>{questions[questionStep].reason}</small>}
                <textarea autoFocus id={`answer-${questions[questionStep].id}`} className="compact-textarea"
                  value={answers[questions[questionStep].id] || ""}
                  onChange={event => setAnswers(current => ({ ...current, [questions[questionStep].id]: event.target.value }))}
                  onKeyDown={event => {
                    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") void advanceQuestion();
                  }}
                  placeholder="Ihre Antwort in eigenen Worten …" />
              </div>
            </div>}
          </div>
          <div className="wizard-actions">
            <button type="button" className="wizard-back" onClick={() => { setError(""); setQuestionStep(step => Math.max(0, step - 1)); }} disabled={busy || questionStep === 0}>← Zurück</button>
            <small>Ihre Antwort wird beim Fortfahren sicher in Ihrer Fallakte gespeichert.</small>
            <button type="button" className="button" onClick={advanceQuestion} disabled={busy}>
              {busy
                ? questionStep === questions.length - 1 ? "Analyse 2 wird erstellt …" : "Antwort wird gespeichert …"
                : questionStep === questions.length - 1 ? "Letzte Antwort speichern und Ergebnis erstellen →" : "Antwort speichern und weiter →"}
            </button>
          </div>
        </section>}

        {result && result.stage !== "NEEDS_INFORMATION" && <section className={`assessment-result ${result.stage === "ESCALATE" ? "escalate" : ""}`} aria-live="polite">
          <header><div><span className="section-label">IHR RECHTSFALL-CHECK</span><h2>{result.stage === "ESCALATE" ? "Zeitnahe fachkundige Prüfung empfohlen" : "Ihr Ergebnis ist bereit"}</h2></div>
            <div className="result-head-actions"><span className="result-version">KI-Analyse · Version {result.version || "aktuell"}</span><Link className="report-open-button" href={`/fallraum/${caseId}/bericht`} target="_blank">Persönlichen Prüfbericht öffnen ↗</Link></div>
          </header>
          <div className="result-summary"><h3>ZUSAMMENFASSUNG IHRES FALLS</h3><p>{result.summary}</p></div>
          {result.nextStep && <div className={`next-step-card urgency-${result.nextStep.urgency.toLowerCase()}`}>
            <span>NÄCHSTER SINNVOLLER SCHRITT</span><h3>{result.nextStep.title}</h3><p>{result.nextStep.explanation}</p>
          </div>}
          {!!result.deadlineWarnings?.length && <section className="result-deadline"><span>FRISTEN UND DRINGLICHKEIT</span><ul>{result.deadlineWarnings.map(item => <li key={item}>{item}</li>)}</ul></section>}
          {!!result.options?.length && <section className="action-options">
            <span className="section-label">IHRE MÖGLICHKEITEN</span>
            <div>{result.options.map(option => <article key={option.title}><b>{option.urgency === "NOW" ? "Jetzt" : option.urgency === "SOON" ? "Zeitnah" : "Prüfschritt"}</b><h3>{option.title}</h3><p>{option.explanation}</p></article>)}</div>
          </section>}
          <details className="result-details">
            <summary><span>Vollständige Prüfdaten anzeigen</span><small>Zeitlicher Ablauf, Fakten, Unterlagen und rechtliche Prüffragen</small></summary>
            <div className="result-grid">
              {!!result.chronology?.length && <div className="result-box"><h3>ZEITLICHER ABLAUF</h3><ol>{result.chronology.map(item => <li key={item}>{item}</li>)}</ol></div>}
              <div className="result-box"><h3>ERKANNTE FAKTEN</h3><ul>{result.facts.map(item => <li key={item}>{item}</li>)}</ul></div>
              {!!result.documentFindings?.length && <div className="result-box"><h3>AUS IHREN UNTERLAGEN</h3><ul>{result.documentFindings.map(item => <li key={item}>{item}</li>)}</ul></div>}
              {!!result.legalIssues?.length && <div className="result-box"><h3>WAS RECHTLICH ZU PRÜFEN IST</h3><ul>{result.legalIssues.map(item => <li key={item}>{item}</li>)}</ul></div>}
              {!!result.sources?.length && <div className="result-box"><h3>MÖGLICHE REGELUNGSBEREICHE</h3><ul>{result.sources.map(item => <li key={item}>{item}</li>)}</ul></div>}
              {!!result.uncertainFacts?.length && <div className="result-box"><h3>NOCH NICHT SICHER BELEGT</h3><ul>{result.uncertainFacts.map(item => <li key={item}>{item}</li>)}</ul></div>}
            </div>
          </details>
          {!!result.limitations?.length && <details className="result-limitations"><summary>Grenzen und noch offene Unsicherheiten</summary><ul>{result.limitations.map(item => <li key={item}>{item}</li>)}</ul></details>}
          <div className="result-boundary"><strong>Wichtiger Hinweis</strong><span>Diese strukturierte Ersteinschätzung ersetzt keine anwaltliche Beratung, enthält keine verbindliche Handlungsanweisung und ist keine finale Einzelfallentscheidung. Bei laufenden Fristen oder erheblichen Folgen sollte eine befugte fachkundige Stelle den Einzelfall prüfen.</span></div>
        </section>}
      </main>
    </div>
    <MemberFooter />
  </div>;
}
