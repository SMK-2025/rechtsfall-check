"use client";

import { FormEvent, useState } from "react";
import {
  reviewDisplayModes, reviewStatuses, reviewTypes, type ReviewStatus,
} from "@/lib/reviews";
import { trackAnalyticsEvent } from "@/lib/analytics";

type Review = {
  id: string; ownerId: string; reviewType: string; rating: number; title: string; body: string;
  displayMode: string; displayName: string; status: string; createdAt: Date | string;
  updatedAt: Date | string; publishedAt: Date | string | null; ownerEmail: string | null;
};

const date = (value: Date | string) => new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(value));

export function ReviewsCenter({
  initialReviews, admin, hasPaidCheck, hasSupport,
}: {
  initialReviews: Review[]; admin: boolean; hasPaidCheck: boolean; hasSupport: boolean;
}) {
  const [items, setItems] = useState(initialReviews);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const response = await fetch("/api/v1/reviews", { cache: "no-store" });
    if (!response.ok) throw new Error("Die Bewertungen konnten nicht geladen werden.");
    const data = await response.json();
    setItems(data.reviews);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setNotice(""); setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/v1/reviews", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reviewType: data.get("reviewType"), rating: Number(data.get("rating")),
          title: data.get("title"), body: data.get("body"), displayMode: data.get("displayMode"),
          publicationConsent: data.get("publicationConsent") === "on",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Die Bewertung konnte nicht eingereicht werden.");
      form.reset();
      await refresh();
      setNotice("Vielen Dank. Ihre Bewertung wurde zur Prüfung eingereicht.");
      trackAnalyticsEvent("review_submitted", {
        review_type: String(data.get("reviewType") || "portal"),
        rating: Number(data.get("rating")),
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Die Bewertung konnte nicht eingereicht werden.");
    } finally { setLoading(false); }
  }

  async function moderate(id: string, status: ReviewStatus) {
    setLoading(true); setNotice(""); setError("");
    try {
      const response = await fetch(`/api/v1/reviews/${id}`, {
        method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Die Freigabe konnte nicht gespeichert werden.");
      await refresh();
      setNotice(status === "PUBLISHED" ? "Die Bewertung ist jetzt auf der Startseite veröffentlicht." : "Die Bewertung wurde nicht freigegeben.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Die Freigabe konnte nicht gespeichert werden.");
    } finally { setLoading(false); }
  }

  async function remove(id: string) {
    if (!window.confirm(admin
      ? "Diese Bewertung endgültig entfernen?"
      : "Bewertung löschen und eine bereits erteilte Veröffentlichungseinwilligung widerrufen?")) return;
    setLoading(true); setNotice(""); setError("");
    try {
      const response = await fetch(`/api/v1/reviews/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Die Bewertung konnte nicht gelöscht werden.");
      await refresh();
      setNotice("Die Bewertung wurde gelöscht und wird nicht mehr veröffentlicht.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Die Bewertung konnte nicht gelöscht werden.");
    } finally { setLoading(false); }
  }

  return <div className="reviews-wrap">
    <header className="reviews-header"><span>{admin ? "BEWERTUNGEN MODERIEREN" : "IHRE ERFAHRUNG"}</span>
      <h1>{admin ? "Eingereichte Bewertungen" : "Wie war Ihre Erfahrung?"}</h1>
      <p>{admin ? "Prüfen Sie echte Nutzerbewertungen, bevor sie öffentlich auf der Startseite erscheinen." : "Ihre ehrliche Bewertung hilft anderen Menschen bei der Entscheidung. Veröffentlicht wird sie erst nach unserer Prüfung."}</p>
    </header>
    {(notice || error) && <p className={`review-feedback ${error ? "error" : "success"}`}>{error || notice}</p>}

    {!admin && <section className="review-form-card">
      <div className="review-form-intro"><span>BEWERTUNG ABGEBEN</span><h2>Ehrlich, verständlich und ohne Falldetails</h2>
        <p>Bitte nennen Sie keine Namen, Aktenzeichen, Gesundheitsdaten oder andere vertrauliche Inhalte aus Ihrem Rechtsfall.</p></div>
      <form onSubmit={submit} className="review-form">
        <label>Was möchten Sie bewerten?<select name="reviewType" required defaultValue="">
          <option value="" disabled>Bitte auswählen</option>
          <option value="PORTAL">Portal allgemein</option>
          <option value="CHECK" disabled={!hasPaidCheck}>Rechtsfall-Check{!hasPaidCheck ? " – nach bezahlter Prüfung möglich" : ""}</option>
          <option value="SUPPORT" disabled={!hasSupport}>Support{!hasSupport ? " – nach Supportkontakt möglich" : ""}</option>
        </select></label>
        <fieldset><legend>Ihre Bewertung</legend><div className="star-input">
          {[5,4,3,2,1].map(value => <span key={value}><input id={`star-${value}`} type="radio" name="rating" value={value} required/><label htmlFor={`star-${value}`} aria-label={`${value} Sterne`}>★</label></span>)}
        </div></fieldset>
        <label>Kurze Überschrift<input name="title" minLength={4} maxLength={100} required placeholder="Was hat Ihnen besonders geholfen?" /></label>
        <label>Ihre Erfahrung<textarea name="body" minLength={20} maxLength={1200} rows={6} required placeholder="Beschreiben Sie verständlich, was gut funktioniert hat oder was verbessert werden könnte." /></label>
        <label>Namensanzeige<select name="displayMode" required defaultValue="FIRST_NAME_INITIAL">
          {Object.entries(reviewDisplayModes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select></label>
        <label className="review-consent"><input type="checkbox" name="publicationConsent" required/><span>Ich stimme zu, dass meine Bewertung nach Prüfung auf Rechtsfall-Check.de veröffentlicht werden darf. Ich bestätige, keine vertraulichen Fall- oder Personendaten eingetragen zu haben.</span></label>
        <button className="button" disabled={loading}>{loading ? "Wird eingereicht …" : "Bewertung zur Prüfung einreichen"}</button>
      </form>
    </section>}

    <section className="review-list-section"><header><div><span>{admin ? "MODERATION" : "MEINE BEWERTUNGEN"}</span><h2>{admin ? "Prüfen und freigeben" : "Status Ihrer Bewertungen"}</h2></div><b>{items.length}</b></header>
      <div className="review-admin-grid">{items.length ? items.map(item => <article key={item.id} className={`review-admin-card ${item.status.toLowerCase()}`}>
        <header><span>{reviewTypes[item.reviewType as keyof typeof reviewTypes] || item.reviewType}</span><i>{reviewStatuses[item.status as keyof typeof reviewStatuses] || item.status}</i></header>
        <div className="review-stars" aria-label={`${item.rating} von 5 Sternen`}>{"★".repeat(item.rating)}<em>{"★".repeat(5-item.rating)}</em></div>
        <h3>{item.title}</h3><p>{item.body}</p>
        <footer><span>{item.displayName} · {date(item.createdAt)}</span>{admin && <small>{item.ownerEmail}</small>}</footer>
        {admin && item.status === "PENDING" && <div className="review-moderation">
          <button className="button" disabled={loading} onClick={() => moderate(item.id, "PUBLISHED")}>Freigeben</button>
          <button className="button-secondary" disabled={loading} onClick={() => moderate(item.id, "REJECTED")}>Nicht freigeben</button>
        </div>}
        {admin && item.status === "PUBLISHED" && <div className="review-moderation">
          <button className="button-secondary" disabled={loading} onClick={() => moderate(item.id, "REJECTED")}>Von der Startseite nehmen</button>
        </div>}
        {!admin && <div className="review-moderation">
          <button className="button-secondary" disabled={loading} onClick={() => remove(item.id)}>Bewertung löschen</button>
        </div>}
      </article>) : <div className="review-empty">Noch keine Bewertungen vorhanden.</div>}</div>
    </section>
  </div>;
}
