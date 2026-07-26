"use client";

import { useState } from "react";

type Result = { summary:string; facts:string[]; missing:string[]; sources:string[]; gate:string };

export function CaseWorkspace({userName,caseId}:{userName:string;caseId:string}) {
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState<Result|null>(null);
  const [file,setFile]=useState("");

  async function analyze(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setResult(null);
    const form=new FormData(event.currentTarget);
    const selected=(document.getElementById("document") as HTMLInputElement)?.files?.[0];
    if(selected){
      const upload=new FormData();upload.set("file",selected);
      const uploadResponse=await fetch(`/api/v1/cases/${caseId}/documents`,{method:"POST",body:upload});
      if(!uploadResponse.ok){setResult({summary:"Die Datei konnte nicht sicher in Quarantäne gespeichert werden.",facts:[],missing:["Bitte prüfen Sie Dateityp und Größe."],sources:[],gate:"Analyse gestoppt: Upload fehlgeschlagen."});setBusy(false);return;}
    }
    const response=await fetch("/api/v1/assessments",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({caseId,topic:form.get("topic"),eventDate:form.get("eventDate"),description:form.get("description"),hasDocument:Boolean(selected)})});
    setResult(await response.json()); setBusy(false);
  }

  return <div className="shell">
    <header className="topbar"><a className="brand" href="/fallraum"><div className="brand-mark">R</div>Rechtsfall KI</a><div className="secure">● <span>{userName} · geschützter Fallraum</span></div></header>
    <div className="layout">
      <aside className="sidebar"><div className="side-label">Ihre Fallanalyse</div><ol className="steps"><li className="active"><span className="step-num">1</span><span>Fall aufnehmen</span></li><li><span className="step-num">2</span><span>Unterlagen prüfen</span></li><li><span className="step-num">3</span><span>Rückfragen klären</span></li><li><span className="step-num">4</span><span>Ersteinschätzung</span></li></ol><div className="legal-mini">MVP-Testbetrieb · Startrechtsgebiet: Verbraucherrecht / Kaufvertrag. Juristische Inhalte und Quellen sind noch freizugeben.</div></aside>
      <main className="main">
        <div className="eyebrow">Fundierte Orientierung vor dem nächsten Schritt</div>
        <h1>Verstehen Sie Ihren Fall. Ohne vorschnelle Antworten.</h1>
        <p className="lead">Wir strukturieren Ihren Sachverhalt, prüfen Dokumente und zeigen offene Punkte – transparent, nachvollziehbar und mit klarer Grenze zur Rechtsberatung.</p>
        <div className="notice"><strong>Wichtiger Hinweis:</strong> Dieses MVP erstellt ausschließlich eine unverbindliche, nicht abschließende Ersteinschätzung. Es ersetzt keine anwaltliche Beratung, trifft keine finale Einzelfallentscheidung und gibt keine verbindliche Handlungsanweisung.</div>
        <form className="card" onSubmit={analyze}>
          <div className="card-head"><div><h2>Neuen Fall anlegen</h2><p>Beschreiben Sie kurz, worum es geht. Die Analyse stellt bei Bedarf Rückfragen.</p></div><span className="status">Sicherer Entwurf</span></div>
          <div className="grid">
            <div><label htmlFor="topic">Thema des Falls</label><input id="topic" name="topic" required defaultValue="Mangelhafte Ware / Kaufvertrag" /></div>
            <div><label htmlFor="eventDate">Datum des Ereignisses</label><input id="eventDate" name="eventDate" type="date" required /></div>
            <div className="full"><label htmlFor="description">Was ist passiert?</label><textarea id="description" name="description" required placeholder="Zum Beispiel: Was wurde gekauft, wann trat der Mangel auf und wie hat der Verkäufer reagiert?" /></div>
            <div className="full"><label htmlFor="document">Unterlagen (optional)</label><label className="upload" htmlFor="document"><span className="upload-icon">↑</span><span><strong>{file || "Beleg oder Schreiben auswählen"}</strong><span>PDF, JPG oder PNG · maximal 10 MB · Virenscan vor Verarbeitung</span></span></label><input className="hidden" id="document" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setFile(e.target.files?.[0]?.name||"")} /></div>
          </div>
          <div className="actions"><span className="privacy">Angaben werden Ihrem Fallkonto zugeordnet. Dateien landen zunächst in Quarantäne und werden ohne freigegebenen Malware-Scan nicht extrahiert.</span><button className="primary" disabled={busy}>{busy?"Sichere Verarbeitung läuft …":"Fall strukturiert prüfen →"}</button></div>
          {result && <section className="result" aria-live="polite">
            <div className="result-box"><h3>Erkannter Sachverhalt</h3><ul>{result.facts.map(x=><li key={x}>{x}</li>)}</ul></div>
            <div className="result-box"><h3>Offene Rückfragen</h3><ul>{result.missing.map(x=><li key={x}>{x}</li>)}</ul></div>
            <div className="result-box"><h3>Mögliche Grundlagen *</h3><ul>{result.sources.map(x=><li key={x}>{x}</li>)}</ul></div>
            <div className="result-box"><h3>Vorläufige Einordnung</h3><p>{result.summary}</p></div>
            <div className="result-box gate"><h3>Qualitätsgate</h3><p>{result.gate}</p></div>
          </section>}
        </form>
      </main>
    </div>
  </div>;
}
