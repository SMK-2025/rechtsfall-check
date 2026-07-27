"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Brand } from "./components/site-chrome";
import { SkipLink } from "./components/skip-link";
import { authClient } from "../lib/auth-client";
import { getLegalArea, legalAreas } from "../lib/legal-areas";

type CaseItem = {
  id: string;
  title: string;
  legalArea: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
};

const statusCopy: Record<string, string> = {
  DRAFT: "Angaben ergänzen",
  INTAKE: "Fallaufnahme läuft",
  NEEDS_INFORMATION: "Rückfragen offen",
  READY_FOR_REVIEW: "Bereit zur Prüfung",
};

export function MemberDashboard({ userName }: { userName: string }) {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [title, setTitle] = useState("");
  const [legalArea, setLegalArea] = useState("other_unsure");
  const [busy, setBusy] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setBusy(true);
    const response = await fetch("/api/v1/cases", { cache: "no-store" });
    if (!response.ok) {
      setError("Ihre Fälle konnten nicht geladen werden.");
      setBusy(false);
      return;
    }
    setItems((await response.json()).cases);
    setBusy(false);
  }

  useEffect(() => { void load(); }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError("");
    const response = await fetch("/api/v1/cases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, legalArea }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error?.message || "Der Fall konnte nicht angelegt werden.");
      setCreating(false);
      return;
    }
    const data = await response.json();
    window.location.href = `/fallraum/${data.case.id}`;
  }

  async function signOut() {
    await authClient.signOut();
    window.location.href = "/";
  }

  const paidCount = useMemo(() => items.filter(item => item.paymentStatus === "PAID").length, [items]);
  const openCount = useMemo(() => items.filter(item => item.status !== "READY_FOR_REVIEW").length, [items]);
  const latest = items[0];

  return <div className="member-shell">
    <SkipLink />
    <header className="member-nav">
      <Brand />
      <nav aria-label="Nutzerbereich">
        <Link className="active" href="/fallraum">Übersicht</Link>
        <Link href="/profil">Profil</Link>
      </nav>
      <div>
        <Link className="profile-link" href="/profil">{userName}</Link>
        <button className="link-button" onClick={signOut}>Logout</button>
      </div>
    </header>

    <main id="main-content" tabIndex={-1} className="member-main">
      <div className="member-heading">
        <div>
          <span className="section-label">MEIN RECHTSBEREICH</span>
          <h1>Guten Tag, {userName.split(" ")[0]}.</h1>
          <p>Alle Fallakten, Unterlagen, offenen Aufgaben und Ergebnisse an einem geschützten Ort.</p>
        </div>
        <Link href="/profil" className="member-text-link">Profil &amp; Kontodaten →</Link>
      </div>

      <section className="member-overview" aria-label="Übersicht">
        <article><span>Fallakten</span><strong>{items.length}</strong><small>insgesamt angelegt</small></article>
        <article><span>Offene Schritte</span><strong>{openCount}</strong><small>Angaben oder Rückfragen</small></article>
        <article><span>Freigeschaltet</span><strong>{paidCount}</strong><small>bezahlte Fallprüfungen</small></article>
        <article className="member-security"><span>Geschützter Fallraum</span><strong>✓</strong><small>kontogebundener Zugriff</small></article>
      </section>

      {latest && <section className="continue-case">
        <div>
          <span className="section-label">ZULETZT BEARBEITET</span>
          <h2>{latest.title}</h2>
          <p>{getLegalArea(latest.legalArea).title} · {statusCopy[latest.status] || "Fallakte geöffnet"}</p>
        </div>
        <Link className="button" href={`/fallraum/${latest.id}`}>Fall weiterbearbeiten →</Link>
      </section>}

      <section className="new-case-panel">
        <div>
          <span className="member-kicker">NEUER RECHTSFALL CHECK</span>
          <h2>Worum geht es bei Ihnen?</h2>
          <p>Legen Sie kostenlos eine geschützte Fallakte an. Sie wählen zunächst das Rechtsgebiet und schildern den Fall anschließend in Ihren Worten.</p>
          <ul>
            <li>Fallaufnahme kostenlos starten</li>
            <li>Unterlagen sicher zuordnen</li>
            <li>Fallprüfung einmalig 39 €, kein Abo</li>
          </ul>
        </div>
        <form onSubmit={create}>
          <div className="dashboard-field">
            <label htmlFor="legal-area">Passendes Rechtsgebiet</label>
            <select id="legal-area" value={legalArea} onChange={event => setLegalArea(event.target.value)}>
              {legalAreas.map(area => <option value={area.id} key={area.id}>{area.title}</option>)}
            </select>
            <small>{getLegalArea(legalArea).examples}</small>
          </div>
          <div className="dashboard-field">
            <label htmlFor="case-title">Kurzer Titel für Ihren Fall</label>
            <input id="case-title" value={title} onChange={event => setTitle(event.target.value)} maxLength={160} required placeholder="z. B. Lärmbelästigung durch Nachbarn" />
          </div>
          <button className="button member-create-button" disabled={creating}>{creating ? "Fallakte wird angelegt …" : "Kostenlose Fallakte anlegen →"}</button>
        </form>
      </section>

      {error && <p className="member-error" role="alert" aria-live="assertive">{error}</p>}

      <section className="case-list-section">
        <div className="list-head">
          <div><span className="section-label">IHRE VORGÄNGE</span><h2>Fallakten</h2></div>
          <span>{items.length} {items.length === 1 ? "Fall" : "Fälle"}</span>
        </div>
        {busy
          ? <div className="empty-state">Ihre Fallakten werden geladen …</div>
          : items.length === 0
            ? <div className="empty-state"><strong>Noch keine Fallakte</strong><p>Wählen Sie oben ein Rechtsgebiet und starten Sie mit Ihrem ersten Rechtsfall Check.</p></div>
            : <div className="case-list">{items.map(item => {
              const area = getLegalArea(item.legalArea);
              return <Link href={`/fallraum/${item.id}`} className="case-list-item" key={item.id}>
                <span className="case-area-icon" aria-hidden="true">{area.icon}</span>
                <div className="case-list-copy">
                  <span className={`case-status ${item.paymentStatus === "PAID" ? "paid" : ""}`}>
                    {item.paymentStatus === "PAID" ? "FALLPRÜFUNG FREIGESCHALTET" : statusCopy[item.status] || "ENTWURF"}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{area.title} · zuletzt aktualisiert {new Intl.DateTimeFormat("de-DE").format(new Date(item.updatedAt))}</p>
                </div>
                <span className="case-arrow">→</span>
              </Link>;
            })}</div>}
      </section>

      <section className="member-help-grid">
        <article><span>?</span><div><h3>Nicht sicher beim Rechtsgebiet?</h3><p>Wählen Sie „Anderes Thema / noch unsicher“. Die Fallaufnahme hilft bei der Einordnung.</p></div></article>
        <article><span>!</span><div><h3>Frist oder akute Situation?</h3><p>Bei Gerichtspost, Kündigung, Haft, Durchsuchung oder Gefahr sollten Sie sofort fachkundige Hilfe suchen.</p></div></article>
        <article><span>⌁</span><div><h3>Datenschutz &amp; Sicherheit</h3><p>Dokumente und Angaben sind ausschließlich Ihrer kontogebundenen Fallakte zugeordnet.</p></div></article>
      </section>
    </main>
  </div>;
}
