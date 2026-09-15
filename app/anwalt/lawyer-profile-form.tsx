"use client";

import { FormEvent, useState } from "react";
import { legalAreas } from "@/lib/legal-areas";

type Initial = {
  status: string;
  barAssociation: string;
  officialDirectoryUrl: string | null;
  firmName: string;
  street: string;
  postalCode: string;
  city: string;
  practiceRadiusKm: number;
  biography: string | null;
  websiteUrl: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
};

type Subscription = { status: string; termEndsAt: Date | null; cancellationDeadlineAt: Date | null; cancelsAtTermEnd: boolean };

export function LawyerProfileForm({ initial, selectedAreas, subscription }: { initial: Initial | null; selectedAreas: string[]; subscription: Subscription | null }) {
  const [form, setForm] = useState({
    barAssociation: initial?.barAssociation ?? "", officialDirectoryUrl: initial?.officialDirectoryUrl ?? "",
    firmName: initial?.firmName ?? "", street: initial?.street ?? "", postalCode: initial?.postalCode ?? "",
    city: initial?.city ?? "", practiceRadiusKm: initial?.practiceRadiusKm ?? 25,
    biography: initial?.biography ?? "", websiteUrl: initial?.websiteUrl ?? "",
    publicEmail: initial?.publicEmail ?? "", publicPhone: initial?.publicPhone ?? "",
  });
  const [areas, setAreas] = useState(selectedAreas);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const set = (key: keyof typeof form, value: string | number) => setForm(current => ({ ...current, [key]: value }));
  const toggle = (id: string) => setAreas(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice(""); setError("");
    const response = await fetch("/api/v1/lawyer-profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, legalAreas: areas }) });
    const data = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) return setError(data?.error?.message || "Die Angaben konnten nicht gespeichert werden.");
    setNotice("Ihre Angaben wurden eingereicht. Die Anwaltsrolle wird erst nach Prüfung der Zulassung freigeschaltet.");
  }
  async function checkout() {
    setBusy(true); setError("");
    const response = await fetch("/api/v1/lawyer-checkout", { method: "POST" });
    const data = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) return setError(data?.error?.message || "Die Zahlung konnte nicht gestartet werden.");
    if (data?.url) window.location.href = data.url;
  }
  async function cancelSubscription() {
    if (!window.confirm("Möchten Sie den Jahreszugang wirklich zum Ende der laufenden Vertragsperiode kündigen?")) return;
    setBusy(true); setError(""); setNotice("");
    const response = await fetch("/api/v1/lawyer-subscription/cancel", { method: "POST" });
    const data = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) return setError(data?.error?.message || "Die Kündigung konnte nicht gespeichert werden.");
    setNotice("Ihre Kündigung wurde verbindlich erfasst. Der Zugang bleibt bis zum Ende der laufenden Vertragsperiode aktiv.");
    window.setTimeout(() => window.location.reload(), 1200);
  }

  return <div className="profile-content">
    <header className="member-heading"><span>ANWALTSZUGANG</span><h1>Kanzleiprofil vorbereiten</h1><p>Ihre Angaben bilden später die Grundlage für passende Vorschläge nach Rechtsgebiet und Entfernung.</p></header>
    {initial && <div className="profile-required-notice" role="status"><strong>Status: {initial.status === "VERIFIED" ? "Geprüft" : initial.status === "REJECTED" ? "Rückfrage erforderlich" : "Prüfung ausstehend"}</strong><span>Bis zur Freigabe werden keine Fälle oder Kontaktdaten übermittelt.</span></div>}
    <form className="profile-section profile-form" onSubmit={submit}>
      <div className="profile-section-heading"><span>01</span><div><h2>Zulassung und Kanzlei</h2><p>Die Berufsbezeichnung wird vor Aktivierung im amtlichen Anwaltsverzeichnis geprüft.</p></div></div>
      <div className="profile-fields">
        <div className="field"><label>Kanzlei</label><input value={form.firmName} onChange={e=>set("firmName",e.target.value)} maxLength={180} required/></div>
        <div className="field"><label>Zuständige Rechtsanwaltskammer</label><input value={form.barAssociation} onChange={e=>set("barAssociation",e.target.value)} maxLength={120} required/></div>
        <div className="field full"><label>Link zum Eintrag im amtlichen Anwaltsverzeichnis (optional)</label><input type="url" value={form.officialDirectoryUrl} onChange={e=>set("officialDirectoryUrl",e.target.value)} placeholder="https://..."/></div>
        <div className="field full"><label>Kanzleianschrift</label><input value={form.street} onChange={e=>set("street",e.target.value)} maxLength={180} required/></div>
        <div className="field"><label>Postleitzahl</label><input value={form.postalCode} onChange={e=>set("postalCode",e.target.value)} maxLength={12} required/></div>
        <div className="field"><label>Ort</label><input value={form.city} onChange={e=>set("city",e.target.value)} maxLength={120} required/></div>
        <div className="field"><label>Öffentliche Kanzlei-E-Mail</label><input type="email" value={form.publicEmail} onChange={e=>set("publicEmail",e.target.value)} maxLength={180}/></div>
        <div className="field"><label>Öffentliche Telefonnummer</label><input type="tel" value={form.publicPhone} onChange={e=>set("publicPhone",e.target.value)} maxLength={40}/></div>
        <div className="field full"><label>Kanzlei-Website</label><input type="url" value={form.websiteUrl} onChange={e=>set("websiteUrl",e.target.value)} placeholder="https://..."/></div>
        <div className="field full"><label>Kurzprofil für Nutzer</label><textarea value={form.biography} onChange={e=>set("biography",e.target.value)} maxLength={1200} rows={6} placeholder="Erfahrung, Arbeitsweise und Schwerpunkte Ihrer Kanzlei"/></div>
      </div>
      <div className="profile-section-heading"><span>02</span><div><h2>Tätigkeitsgebiete und Radius</h2><p>Wählen Sie nur Gebiete, in denen Sie tatsächlich Mandate übernehmen.</p></div></div>
      <div className="lawyer-area-options">{legalAreas.filter(area=>area.id!=="other_unsure").map(area=><label key={area.id}><input type="checkbox" checked={areas.includes(area.id)} onChange={()=>toggle(area.id)}/><span><strong>{area.title}</strong><small>{area.examples}</small></span></label>)}</div>
      <div className="field"><label>Tätigkeitsradius um den Kanzleisitz: {form.practiceRadiusKm} km</label><input type="range" min="5" max="250" step="5" value={form.practiceRadiusKm} onChange={e=>set("practiceRadiusKm",Number(e.target.value))}/></div>
      <div className="legal-note"><strong>Keine automatische Mandatsübernahme</strong><p>Ein Vorschlag begründet kein Mandat. Identität, Interessenkollision, Kapazität und Mandatsbedingungen müssen vor einer Übernahme separat geprüft und bestätigt werden.</p></div>
      <div className="legal-note"><strong>Jahreszugang: 5.880 € netto im Voraus</strong><p>12 Monate Laufzeit. Davon werden garantiert 2.940 € als Mediabudget eingesetzt; 2.940 € sind die Vergütung für die Plattformleistung. Der Vertrag verlängert sich um weitere zwölf Monate, wenn er nicht spätestens drei Monate vor Laufzeitende im Portal gekündigt wird.</p></div>
      {error && <div className="profile-notice error" role="alert">{error}</div>}{notice && <div className="profile-notice success" role="status">{notice}</div>}
      <button className="button" disabled={busy}>{busy ? "Wird eingereicht …" : "Profil zur Prüfung einreichen →"}</button>
    </form>
    <section className="profile-section lawyer-preview-section" aria-labelledby="lawyer-preview-title">
      <div className="profile-section-heading"><span>VORSCHAU</span><div><h2 id="lawyer-preview-title">So sehen Nutzer Ihr Profil nach einem Match</h2><p>Diese Vorschau ist nur für Sie sichtbar. Vor einem bezahlten Rechtsfall-Check wird Ihr Profil keinem Nutzer angezeigt.</p></div></div>
      <article className="lawyer-profile-preview">
        <header><div className="lawyer-avatar" aria-hidden="true">§</div><div><small>GEPRÜFTES ANWALTSPROFIL</small><h3>{form.firmName || "Name Ihrer Kanzlei"}</h3><p>{form.city || "Kanzleisitz"} · bis {form.practiceRadiusKm} km tätig</p></div></header>
        <p className="lawyer-biography">{form.biography || "Beschreiben Sie hier Ihre Erfahrung, Arbeitsweise und Tätigkeitsschwerpunkte. Dieser Text hilft Nutzern bei ihrer eigenen Auswahl."}</p>
        <div className="lawyer-preview-areas">{areas.length ? areas.map(id => <span key={id}>{legalAreas.find(area => area.id === id)?.title || id}</span>) : <span>Noch keine Rechtsgebiete ausgewählt</span>}</div>
        <footer><span>Der Nutzer entscheidet selbst, ob er Kontakt aufnehmen möchte.</span><button type="button" disabled>Nachricht an Kanzlei senden</button></footer>
      </article>
    </section>
    <section className="profile-section lawyer-process-section">
      <div className="profile-section-heading"><span>ABLAUF</span><div><h2>Vom Profil zum möglichen Mandat</h2><p>Sie bleiben bis zu einem passenden, bezahlten Rechtsfall vollständig unsichtbar.</p></div></div>
      <div className="lawyer-process-grid">
        <article><b>01</b><strong>Profil fertigstellen</strong><p>Kanzlei, Rechtsgebiete, Tätigkeitsradius und Kurzprofil vollständig hinterlegen.</p></article>
        <article><b>02</b><strong>Zulassung prüfen lassen</strong><p>Rechtsfall-Check.de bestätigt die Berufsberechtigung vor der Zahlungsfreigabe.</p></article>
        <article><b>03</b><strong>Jahreszugang aktivieren</strong><p>Die freiwillige Stripe-Zahlung schaltet das geprüfte Profil für zwölf Monate frei.</p></article>
        <article><b>04</b><strong>Passend vorgeschlagen werden</strong><p>Nur Rechtsgebiet, Entfernung, Vertragsstatus und Mandatsbereitschaft entscheiden.</p></article>
        <article><b>05</b><strong>Nutzer eröffnet Kontakt</strong><p>Der Nutzer wählt Ihr Profil und gibt Kontaktangaben und Prüfbericht ausdrücklich frei.</p></article>
        <article><b>06</b><strong>Im Portal austauschen</strong><p>Beide Seiten können im geschützten Match-Chat schreiben. Ein Mandat entsteht erst separat.</p></article>
      </div>
    </section>
    <section className="profile-section">
      <div className="profile-section-heading"><span>03</span><div><h2>Jahreszugang und Aktivierung</h2><p>Zahlung und Zulassungsprüfung müssen beide erfolgreich abgeschlossen sein.</p></div></div>
      {subscription && <div className="profile-required-notice"><strong>Vertragsstatus: {subscription.status}</strong><span>{subscription.termEndsAt ? `Laufzeit bis ${new Date(subscription.termEndsAt).toLocaleDateString("de-DE")}.` : "Die Laufzeit beginnt mit bestätigter Zahlung."}</span></div>}
      {initial?.status === "VERIFIED" && !["ACTIVE","CANCELS_AT_TERM_END"].includes(subscription?.status || "")
        ? <button className="button" type="button" disabled={busy} onClick={checkout}>Jahreszugang für 5.880 € netto buchen →</button>
        : initial?.status !== "VERIFIED" ? <p>Die Zahlung wird nach erfolgreicher Prüfung Ihrer Zulassung freigeschaltet.</p> : null}
      {subscription?.status === "ACTIVE" && !subscription.cancelsAtTermEnd && <button className="button button-secondary" type="button" disabled={busy} onClick={cancelSubscription}>Jahreszugang zum Laufzeitende kündigen</button>}
      {subscription?.cancelsAtTermEnd && <div className="profile-required-notice"><strong>Kündigung vorgemerkt</strong><span>Der Zugang bleibt bis {subscription.termEndsAt ? new Date(subscription.termEndsAt).toLocaleDateString("de-DE") : "zum Laufzeitende"} aktiv und verlängert sich nicht.</span></div>}
    </section>
    <style jsx>{`.lawyer-area-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0 28px}.lawyer-area-options label{display:flex;gap:12px;padding:14px;border:1px solid #dbe4ea;border-radius:12px;background:#fff;cursor:pointer}.lawyer-area-options input{margin-top:3px}.lawyer-area-options span{display:grid;gap:4px}.lawyer-area-options small{color:#687985;line-height:1.45}.lawyer-profile-preview{border:1px solid #cfdae2;border-radius:20px;background:linear-gradient(145deg,#fff,#f2f7fb);padding:28px;box-shadow:0 18px 45px rgba(8,43,67,.08)}.lawyer-profile-preview header{display:flex;align-items:center;gap:17px}.lawyer-avatar{width:62px;height:62px;display:grid;place-items:center;border-radius:17px;background:#0b3048;color:#fff;font-size:27px;font-weight:850}.lawyer-profile-preview small{color:#397dcc;font-size:9px;font-weight:850;letter-spacing:.13em}.lawyer-profile-preview h3{margin:5px 0;font-size:25px}.lawyer-profile-preview header p{margin:0;color:#667985}.lawyer-biography{margin:24px 0;line-height:1.7;color:#405765;white-space:pre-wrap}.lawyer-preview-areas{display:flex;flex-wrap:wrap;gap:8px}.lawyer-preview-areas span{padding:8px 11px;border-radius:99px;background:#deebfb;color:#164e79;font-size:12px;font-weight:750}.lawyer-profile-preview footer{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:25px;padding-top:20px;border-top:1px solid #dce5eb}.lawyer-profile-preview footer span{font-size:12px;color:#697b87}.lawyer-profile-preview footer button{border:0;border-radius:10px;padding:12px 15px;background:#0b3048;color:#fff;font-weight:750;opacity:.55}.lawyer-process-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:13px}.lawyer-process-grid article{display:grid;align-content:start;gap:8px;padding:20px;border:1px solid #dbe4ea;border-radius:14px;background:#fff}.lawyer-process-grid b{color:#397dcc;font-size:11px}.lawyer-process-grid p{margin:0;color:#687985;font-size:12px;line-height:1.55}@media(max-width:850px){.lawyer-process-grid{grid-template-columns:1fr 1fr}}@media(max-width:700px){.lawyer-area-options,.lawyer-process-grid{grid-template-columns:1fr}.lawyer-profile-preview footer{align-items:stretch;flex-direction:column}.lawyer-profile-preview footer button{width:100%}}`}</style>
  </div>;
}
