"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SkipLink } from "./components/skip-link";
import { MemberFooter } from "./components/member-footer";
import { MemberNavigation } from "./components/member-navigation";
import { getLegalArea, legalAreas } from "../lib/legal-areas";

type Result = {
  stage?: "NEEDS_INFORMATION" | "READY_TO_SUBMIT" | "PRELIMINARY_ASSESSMENT" | "ESCALATE";
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
type CaseDocument = {
  id: string;
  originalName: string;
  sizeBytes: number;
  extractionStatus: string;
  extractionJson?: {
    summary?: string;
    pageCount?: number;
    isScanned?: boolean;
    ocrApplied?: boolean;
    confidence?: number;
    pipeline?: { quality?: "HIGH" | "MEDIUM" | "LOW"; requiresManualReview?: boolean };
  };
};
type CaseData = {
  id: string;
  title: string;
  legalArea: string;
  status: string;
  paymentStatus: string;
  intakeJson?: IntakeDraft;
};
type PaymentData = {
  status: string;
  amountCents: number;
  currency: string;
  receiptUrl?: string | null;
  refundedAmountCents?: number;
};

type IntakeDraft = {
  topic: string;
  eventDate: string;
  federalState: string;
  opposingParty: string;
  description: string;
  desiredOutcome: string;
  aiConsentAt?: string;
};

const federalStates = ["Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen"];

export function CaseWorkspace({ userName, userEmail, caseId }: { userName: string; userEmail: string; caseId: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [paid, setPaid] = useState(false);
  const [adminTestAccess, setAdminTestAccess] = useState(false);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState<IntakeDraft>({ topic: "", eventDate: "", federalState: "", opposingParty: "", description: "", desiredOutcome: "" });
  const [documentCount, setDocumentCount] = useState(0);
  const [questions, setQuestions] = useState<FollowUp[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionStep, setQuestionStep] = useState(0);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [purchaseConsent, setPurchaseConsent] = useState(false);
  const [aiConsentAccepted, setAiConsentAccepted] = useState(false);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [error, setError] = useState("");
  const [busyMessage, setBusyMessage] = useState("");

  useEffect(() => {
    fetch(`/api/v1/cases/${caseId}`, { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Falldaten konnten nicht geladen werden.");
        return response.json();
      })
      .then(data => {
        setCaseData(data.case);
        const testAccess = data.access?.canAnalyzeWithoutPayment === true;
        setAdminTestAccess(testAccess);
        setPaid(data.case?.paymentStatus === "PAID" || testAccess);
        setPayment(data.payment || null);
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
          aiConsentAt: saved?.aiConsentAt,
        });
        setAiConsentAccepted(Boolean(saved?.aiConsentAt));
        setDocuments(data.documents || []);
        setDocumentCount(data.documents?.length || 0);
        const openQuestions = (data.questions || []).filter((question: FollowUp) =>
          question.status === "OPEN" && !question.questionKey?.startsWith("assessment_"));
        setQuestions(openQuestions);
        setQuestionStep(0);
        const latest = data.assessments?.at(-1)?.payloadJson as Result | undefined;
        setAnalysisStarted((data.assessments?.length || 0) > 0 || ["NEEDS_INFORMATION", "READY_FOR_REVIEW", "ASSESSMENT_READY", "ESCALATED"].includes(data.case?.status));
        if (latest && (data.case?.status === "ASSESSMENT_READY" || data.case?.status === "ESCALATED")) setResult(latest);
        setReadyToSubmit(data.case?.status === "READY_FOR_REVIEW");
      })
      .catch(() => setError("Falldaten konnten nicht geladen werden."));
  }, [caseId]);

  const area = useMemo(() => getLegalArea(caseData?.legalArea), [caseData?.legalArea]);
  const finalized = caseData?.status === "ASSESSMENT_READY" || caseData?.status === "ESCALATED";
  const updateDraft = (field: keyof IntakeDraft, value: string) => {
    setReadyToSubmit(false);
    setDraft(current => ({ ...current, [field]: value }));
  };

  async function persistDraft(silent = false) {
    try {
      const response = await fetch(`/api/v1/cases/${caseId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intake: { ...draft, topic, aiConsent: aiConsentAccepted } }),
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) return true;
    } catch {
      // Network and timeout failures use the same user-facing recovery path.
    }
    {
      if (!silent) setError("Ihre Fallschilderung konnte nicht gespeichert werden. Die Zahlung wurde nicht gestartet.");
      return false;
    }
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
    setReadyToSubmit(false);
  }

  async function removeDocument(document: CaseDocument) {
    if (!window.confirm(`„${document.originalName}“ endgültig aus dieser Fallakte löschen? Eine vorhandene Analyse muss danach neu erstellt werden.`)) return;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/v1/cases/${caseId}/documents/${document.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error?.message || "Die Unterlage konnte nicht gelöscht werden.");
    } else {
      setDocuments(current => current.filter(item => item.id !== document.id));
      setDocumentCount(count => Math.max(0, count - 1));
      setResult(null);
      setReadyToSubmit(false);
    }
    setBusy(false);
  }

  async function reprocessDocument(document: CaseDocument) {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/v1/cases/${caseId}/documents/${document.id}`, { method: "POST" });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error?.message || "Die erneute Auswertung konnte nicht vorbereitet werden.");
    } else {
      setDocuments(current => current.map(item => item.id === document.id ? { ...item, extractionStatus: "PENDING" } : item));
      setResult(null);
      setReadyToSubmit(false);
    }
    setBusy(false);
  }

  async function checkout() {
    if (!purchaseConsent) {
      setError("Bitte bestätigen Sie vor der Zahlung die AGB und den gewünschten Leistungsbeginn.");
      return;
    }
    setBusy(true);
    setBusyMessage("Fallangaben und Unterlagen werden sicher gespeichert …");
    setError("");
    const [draftSaved, documentsSaved] = await Promise.all([
      persistDraft(),
      uploadSelectedDocuments(),
    ]);
    if (!draftSaved || !documentsSaved) {
      setBusy(false);
      setBusyMessage("");
      return;
    }
    setBusyMessage("Sichere Zahlung wird geöffnet …");
    try {
      const response = await fetch("/api/v1/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId }),
        signal: AbortSignal.timeout(35_000),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error?.message || "Die Zahlung konnte nicht gestartet werden.");
    } catch {
      setError("Stripe hat nicht rechtzeitig geantwortet. Ihre Fallangaben sind gespeichert. Bitte versuchen Sie den Wechsel zur Zahlung erneut.");
    }
    setBusy(false);
    setBusyMessage("");
  }

  async function uploadSelectedDocuments() {
    if (!selectedFiles.length) return true;
    setBusyMessage("Unterlagen werden geprüft und geschützt gespeichert …");
    const filesToUpload = [...selectedFiles];
    const uploadedDocuments: CaseDocument[] = [];
    const failedFiles: File[] = [];
    for (const selected of filesToUpload) {
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
      setError(`${failedFiles.length} von ${filesToUpload.length} Dateien konnten nicht gespeichert werden. Bitte prüfen Sie Dateityp und Größe. Bereits erfolgreiche Uploads sind in der Fallakte gespeichert.`);
      return false;
    }
    return true;
  }

  async function analyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paid) {
      await checkout();
      return;
    }
    setBusy(true);
    setBusyMessage(analysisStarted ? "Weiterführende Analyse wird vorbereitet …" : "Erste Analyse wird vorbereitet …");
    setError("");
    const form = new FormData(event.currentTarget);
    if (!await uploadSelectedDocuments()) {
      setBusy(false);
      setBusyMessage("");
      return;
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
        aiConsent: aiConsentAccepted,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message || "Die Analyse konnte nicht erstellt werden.");
      setBusy(false);
      setBusyMessage("");
      return;
    }
    setReadyToSubmit(data.readyToSubmit === true);
    setQuestions(data.questions || []);
    setAnalysisStarted(true);
    setQuestionStep(0);
    setBusy(false);
    setBusyMessage("");
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
    setReadyToSubmit(data.readyToSubmit === true);
    setQuestions(data.questions || []);
    setQuestionStep(0);
    setAnswers({});
    setBusy(false);
  }

  async function submitFinalCheck() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/v1/assessments", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ caseId, ...draft, topic, aiConsent: true, finalSubmission: true }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message || "Der Rechtsfall-Check konnte nicht final eingereicht werden.");
      setBusy(false);
      return;
    }
    if (data.questions?.length) {
      setQuestions(data.questions);
      setQuestionStep(0);
      setSubmitDialogOpen(false);
      setReadyToSubmit(false);
      setError("Vor der finalen Einreichung sind noch fallbezogene Angaben erforderlich.");
      setBusy(false);
      return;
    }
    setResult(data);
    setCaseData(current => current ? { ...current, status: data.stage === "ESCALATE" ? "ESCALATED" : "ASSESSMENT_READY" } : current);
    setReadyToSubmit(false);
    setSubmitDialogOpen(false);
    setBusy(false);
  }

  return <div className="app-shell">
    <SkipLink />
    <MemberNavigation userName={userName} userEmail={userEmail} caseId={caseId}/>

    <div className="app-layout">
      <main id="main-content" tabIndex={-1} className="app-content">
        <div className="case-breadcrumb"><Link href="/fallraum">Meine Fälle</Link><span>›</span><span>{area.shortTitle}</span></div>
        <div className="case-heading-row">
          <div>
            <h1>{caseData?.title || "Ihre Fallakte"}</h1>
            <p className="lead">Schildern Sie den Ablauf in Ihren Worten. Der Rechtsfall Check strukturiert Fakten, Unterlagen, offene Punkte und mögliche nächste Prüfschritte.</p>
          </div>
          <span className={`case-payment-badge ${paid ? "paid" : ""}`}>{adminTestAccess ? "✓ Betreiber-Testzugang" : paid ? "✓ Freigeschaltet" : "Noch nicht bezahlt"}</span>
        </div>

        {paid && !adminTestAccess && payment?.status === "PAID" && <section className="payment-confirmation" aria-label="Zahlungsstatus">
          <div><strong>✓ Zahlung bestätigt</strong><p>19,00 € für diesen Rechtsfall-Check. Kein Abo.</p></div>
          {payment.receiptUrl && <a className="button secondary" href={payment.receiptUrl} target="_blank" rel="noreferrer">Zahlungsbeleg öffnen ↗</a>}
        </section>}

        {error && <p className="auth-error" role="alert" aria-live="assertive">{error}</p>}

        {!finalized && <form id="fallangaben" className="app-card" onSubmit={analyze}>
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

          <div id="unterlagen" className="form-section-heading divided"><span>03</span><div><h2>Unterlagen hinzufügen</h2><p>Belege helfen dabei, Aussagen und zeitliche Abläufe nachvollziehbar zuzuordnen.</p></div></div>
          <div className="field">
            <input className="visually-hidden file-input" id="document" type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
              onChange={event => {
                const next = Array.from(event.target.files || []);
                setReadyToSubmit(false);
                setSelectedFiles(current => {
                  const bySignature = new Map(current.map(file => [`${file.name}:${file.size}:${file.lastModified}`, file]));
                  next.forEach(file => bySignature.set(`${file.name}:${file.size}:${file.lastModified}`, file));
                  return [...bySignature.values()].slice(0, 20);
                });
                event.target.value = "";
              }} />
            <label className="upload-zone" htmlFor="document"><span>↥</span><span>
              <strong>{selectedFiles.length ? "Weitere Unterlagen auswählen" : "Mehrere Unterlagen oder Korrespondenz auswählen"}</strong>
              <small aria-live="polite">{selectedFiles.length ? `${selectedFiles.length} Datei${selectedFiles.length === 1 ? "" : "en"} für den Upload vorgemerkt` : "Bis zu 20 PDF-, JPG- oder PNG-Dateien · maximal 4 MB pro Datei"}</small>
              <small>Jede Datei wird automatisch auf Schadsoftware und Viren geprüft, bevor sie geschützt gespeichert wird.</small>
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
              }</small>
              {document.extractionStatus === "COMPLETED" && document.extractionJson?.pipeline && <small>
                {document.extractionJson.ocrApplied ? "OCR-Texterkennung · " : ""}
                {document.extractionJson.pageCount || 1} Seite{document.extractionJson.pageCount === 1 ? "" : "n"} ·
                {" "}{document.extractionJson.pipeline.quality === "HIGH" ? "sehr gut lesbar" : document.extractionJson.pipeline.quality === "MEDIUM" ? "mit Prüfhinweisen" : "manuelle Prüfung empfohlen"}
              </small>}</div>
              <b className={document.extractionStatus === "COMPLETED" ? "complete" : ""}>
                {document.extractionStatus === "COMPLETED" ? "✓" : "…"}
              </b>
              <div className="document-actions">
                {document.extractionStatus === "FAILED" && <button type="button" onClick={() => void reprocessDocument(document)} disabled={busy}>Erneut auswerten</button>}
                <button type="button" onClick={() => void removeDocument(document)} disabled={busy}>Löschen</button>
              </div>
            </article>)}
          </div>}

          <label className="consent">
            <input type="checkbox" name="aiConsent" required checked={aiConsentAccepted} onChange={event => setAiConsentAccepted(event.target.checked)} />
            <span>Ich willige ausdrücklich ein, dass meine Angaben – soweit sie besondere Kategorien personenbezogener Daten enthalten – zur Erstellung der Analyse durch den konfigurierten KI-Dienstleister verarbeitet werden. Die Einwilligung ist freiwillig und jederzeit für die Zukunft widerrufbar. Details: <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link>.</span>
          </label>

          {!paid && <section className="checkout-summary" aria-labelledby="checkout-summary-title">
            <div className="checkout-summary-head">
              <div>
                <span className="paywall-kicker">RECHTSFALL CHECK</span>
                <h2 id="checkout-summary-title">Fallaufnahme speichern und Rechtsfall-Check beauftragen</h2>
                <p>Ihre Angaben und ausgewählten Unterlagen werden sicher in Ihrer Fallakte gespeichert. Anschließend wechseln Sie zur Zahlung und starten danach die erste Analyse.</p>
              </div>
              <div className="checkout-price"><strong>19 €</strong><span>einmalig · kein Abo</span></div>
            </div>
            <ul className="checkout-features" aria-label="Enthaltene Leistungen">
              <li>Strukturierte Fallaufnahme</li>
              <li>Dokumenten- und KI-Analyse</li>
              <li>Gezielte Rückfragen bei Bedarf</li>
              <li>Abschließender Rechtsfall-Check</li>
            </ul>
            <label className="purchase-consent">
              <input type="checkbox" checked={purchaseConsent} onChange={event => setPurchaseConsent(event.target.checked)}/>
              <span>Ich akzeptiere die <Link href="/agb" target="_blank">AGB</Link> und verlange ausdrücklich, dass die Leistung vor Ablauf der Widerrufsfrist beginnt. Mir ist bekannt, dass mein Widerrufsrecht bei vollständiger Vertragserfüllung erlischt.</span>
            </label>
          </section>}

          {!(paid && readyToSubmit && questions.length === 0) && <div className="app-actions">
            <small>{paid
              ? analysisStarted
                ? "Neue oder geänderte Angaben und Unterlagen werden weiterführend ausgewertet. Bereits beantwortete Punkte werden nicht erneut abgefragt."
                : "Mit der ersten Analyse prüfen wir Ihre Angaben und Unterlagen. Nur falls noch etwas Wesentliches fehlt, folgen gezielte Rückfragen."
              : "Ihre Angaben und ausgewählten Unterlagen werden vor dem Wechsel zur Zahlung sicher in Ihrer Fallakte gespeichert."}</small>
            <button className="button" disabled={busy||(!paid&&!purchaseConsent)}>{busy
              ? (busyMessage || "Bitte einen Moment …")
              : paid
                ? analysisStarted ? "Weiterführende Analyse starten →" : "Erste Analyse des Falls starten →"
                : "Zahlungspflichtig für 19 € bestellen →"}</button>
          </div>}
        </form>}

        {!finalized && questions.length > 0 && <section id="rueckfragen" className="follow-up-panel wizard" aria-live="polite">
          <header>
            <div><span className="section-label">ERGÄNZENDE RÜCKFRAGEN</span><h2>Nur noch die wirklich notwendigen Angaben</h2></div>
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
                ? questionStep === questions.length - 1 ? "Vollständigkeit wird geprüft …" : "Antwort wird gespeichert …"
                : questionStep === questions.length - 1 ? "Letzte Antwort speichern und Angaben prüfen →" : "Antwort speichern und weiter →"}
            </button>
          </div>
          <div className="wizard-final-option">
            <p>Sie möchten keine weiteren Angaben ergänzen? Dann kann der Rechtsfall-Check mit dem aktuellen Informationsstand abschließend erstellt werden. Noch offene Punkte werden im Ergebnis als Einschränkung ausgewiesen.</p>
            <button type="button" className="button secondary" onClick={() => setSubmitDialogOpen(true)} disabled={busy}>Mit bisherigen Angaben abschließend prüfen →</button>
          </div>
        </section>}

        {!finalized && readyToSubmit && questions.length === 0 && <section className="final-submit-card" aria-live="polite">
          <div><span className="section-label">ALLE ANGABEN VOLLSTÄNDIG</span><h2>Abschließenden Rechtsfall-Check einreichen</h2><p>Ihre Angaben, Unterlagen und gegebenenfalls erforderlichen Rückfragen sind vollständig. Sie können Ihren Fall jetzt verbindlich zur abschließenden Auswertung einreichen.</p></div>
          <button type="button" className="button" onClick={() => setSubmitDialogOpen(true)}>Rechtsfall-Check einreichen →</button>
        </section>}

        {submitDialogOpen && <div className="submission-dialog-backdrop" role="presentation" onMouseDown={() => !busy && setSubmitDialogOpen(false)}>
          <section className="submission-dialog" role="dialog" aria-modal="true" aria-labelledby="final-submit-title" onMouseDown={event => event.stopPropagation()}>
            <button type="button" className="submission-dialog-close" aria-label="Dialog schließen" onClick={() => setSubmitDialogOpen(false)} disabled={busy}>×</button>
            <span className="section-label">FINALER RECHTSFALL-CHECK</span>
            <h2 id="final-submit-title">Rechtsfall-Check jetzt verbindlich einreichen?</h2>
            <p>Auf Grundlage Ihrer geprüften Angaben, Antworten und Unterlagen wird jetzt genau ein abschließender Rechtsfall-Check erstellt.</p>
            <div className="submission-warning"><strong>Bitte prüfen Sie vorher, ob alles vollständig ist.</strong><span>Nach erfolgreicher Einreichung kann dieser Rechtsfall-Check nicht mehr bearbeitet, erneut eingereicht oder um weitere Unterlagen ergänzt werden.</span></div>
            <div className="submission-dialog-actions">
              <button type="button" className="button secondary" onClick={() => setSubmitDialogOpen(false)} disabled={busy}>Zurück und Angaben prüfen</button>
              <button type="button" className="button" onClick={submitFinalCheck} disabled={busy}>{busy ? "Rechtsfall-Check wird erstellt …" : "Verbindlich einreichen →"}</button>
            </div>
          </section>
        </div>}

        {result && result.stage !== "NEEDS_INFORMATION" && <section id="ergebnis" className={`assessment-result ${result.stage === "ESCALATE" ? "escalate" : ""}`} aria-live="polite">
          <header><div><span className="section-label">IHR FINALER RECHTSFALL-CHECK</span><h2>{result.stage === "ESCALATE" ? "Zeitnahe fachkundige Prüfung empfohlen" : "Ihr Rechtsfall-Check ist bereit"}</h2></div></header>
          <div className="result-summary"><h3>ZUSAMMENFASSUNG IHRES FALLS</h3><p>{result.summary}</p></div>
          <div className="final-report-action"><p>Alle Prüfpunkte, erkannten Fakten, Unterlagenhinweise, möglichen nächsten Schritte und Grenzen finden Sie in Ihrem vollständigen Rechtsfall-Check.</p><Link className="report-open-button" href={`/fallraum/${caseId}/bericht`} target="_blank">Rechtsfall-Check öffnen und speichern ↗</Link></div>
          <div className="result-boundary"><strong>Hinweis</strong><span>Der Rechtsfall-Check ist final eingereicht und kann nicht mehr bearbeitet werden. Die Ersteinschätzung ersetzt keine anwaltliche Beratung, enthält keine verbindliche Handlungsanweisung und ist keine finale Einzelfallentscheidung.</span></div>
        </section>}
      </main>
    </div>
    <MemberFooter />
  </div>;
}
