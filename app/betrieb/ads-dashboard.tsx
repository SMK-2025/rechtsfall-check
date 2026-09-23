"use client";

import { useEffect, useMemo, useState } from "react";

export type AdvertisingRow = {
  source: string;
  medium: string;
  campaign: string;
  campaignId: string;
  content: string;
  lastSeen: string;
  visits: number;
  signupClicks: number;
  formStarts: number;
  formSubmissions: number;
  accounts: number;
  confirmations: number;
  checkouts: number;
  purchases: number;
  recommendation: string;
};

type Campaign = AdvertisingRow & { key: string; paid: boolean; advertisements: AdvertisingRow[] };

const sourceLabels: Record<string, string> = {
  direct: "Direkter Zugriff",
  meta: "Meta (Facebook und Instagram)",
  tiktok: "TikTok",
  google: "Google",
  bing: "Bing",
  newsletter: "Newsletter",
  none: "Quelle nicht erkannt",
};

const mediumLabels: Record<string, string> = {
  none: "Ohne Kampagnenzuordnung",
  paid: "Bezahlte Werbung",
  "paid-social": "Bezahlte Werbung in sozialen Netzwerken",
  paid_social: "Bezahlte Werbung in sozialen Netzwerken",
  cpc: "Bezahlte Klickwerbung",
  ppc: "Bezahlte Klickwerbung",
  organic: "Organischer Zugriff",
  social: "Organischer Zugriff über soziale Netzwerke",
  referral: "Verweis von einer anderen Website",
  email: "E-Mail",
};

const isPaidMedium = (medium: string) => ["paid", "paid-social", "paid_social", "cpc", "ppc", "display"].includes(medium.toLowerCase());
const label = (value: string, labels: Record<string, string>, fallback: string) => value === "none" ? fallback : labels[value.toLowerCase()] || value;
const campaignName = (campaign: Campaign) => campaign.campaign === "none"
  ? campaign.paid ? "Bezahlte Kampagne ohne Bezeichnung" : "Direkte und organische Zugriffe"
  : campaign.campaign;
const conversion = (value: number, basis: number) => basis ? `${((value / basis) * 100).toFixed(1).replace(".", ",")} %` : "–";
const germanDate = (value: string) => new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`));

export function AdsDashboard({ rows }: { rows: AdvertisingRow[] }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const campaigns = useMemo(() => Object.values(rows.reduce<Record<string, Campaign>>((groups, row) => {
    const key = `${row.source}|${row.medium}|${row.campaign}|${row.campaignId}`;
    groups[key] ||= {
      ...row,
      key,
      paid: isPaidMedium(row.medium),
      advertisements: [],
      visits: 0,
      signupClicks: 0,
      formStarts: 0,
      formSubmissions: 0,
      accounts: 0,
      confirmations: 0,
      checkouts: 0,
      purchases: 0,
    };
    groups[key].advertisements.push(row);
    if (row.lastSeen > groups[key].lastSeen) groups[key].lastSeen = row.lastSeen;
    for (const metric of ["visits", "signupClicks", "formStarts", "formSubmissions", "accounts", "confirmations", "checkouts", "purchases"] as const) {
      groups[key][metric] += row[metric];
    }
    return groups;
  }, {})).sort((left, right) => right.lastSeen.localeCompare(left.lastSeen) || right.visits - left.visits), [rows]);
  const selected = campaigns.find(campaign => campaign.key === selectedKey) || null;

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedKey(null); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selected]);

  const renderGroup = (title: string, description: string, entries: Campaign[], paid: boolean) => <section className={`ads-campaign-section ${paid ? "paid" : "organic"}`}>
    <header><div><span>{paid ? "BEZAHLTE WERBUNG" : "ORGANISCHE ZUGRIFFE"}</span><h3>{title}</h3><p>{description}</p></div><strong>{entries.length}</strong></header>
    {entries.length ? <div className="ads-card-grid">{entries.map(campaign => <button type="button" className="ads-campaign-card" key={campaign.key} onClick={() => setSelectedKey(campaign.key)}>
      <span className="ads-card-type">{paid ? "BEZAHLT" : "ORGANISCH"}</span>
      <h4>{campaignName(campaign)}</h4>
      <p>{label(campaign.source, sourceLabels, "Quelle nicht erkannt")} · {label(campaign.medium, mediumLabels, "Ohne Kampagnenzuordnung")}</p>
      <p className="ads-card-date">Zuletzt gemessen: {germanDate(campaign.lastSeen)}</p>
      <div className="ads-card-metrics"><span><strong>{campaign.visits}</strong>Besuche</span><span><strong>{campaign.signupClicks}</strong>Registrierungs-Klicks</span><span><strong>{campaign.confirmations}</strong>Bestätigte Konten</span><span><strong>{campaign.purchases}</strong>Käufe</span></div>
      <small>Alle Messergebnisse öffnen →</small>
    </button>)}</div> : <div className="ads-empty-state">Für diesen Bereich liegen im ausgewählten Zeitraum noch keine Daten vor.</div>}
  </section>;

  const paidCampaigns = campaigns.filter(campaign => campaign.paid);
  const organicCampaigns = campaigns.filter(campaign => !campaign.paid);

  return <>
    <div className="ads-dashboard">
      {renderGroup("Bezahlte Kampagnen", "Kampagnen von Meta, TikTok und weiteren Werbeplattformen mit bezahlter Kennzeichnung.", paidCampaigns, true)}
      {renderGroup("Organisch und direkt", "Direkte Seitenaufrufe und unbezahlte Zugriffe ohne bezahlte Kampagnenzuordnung.", organicCampaigns, false)}
    </div>
    {selected && <div className="ads-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedKey(null); }}>
      <section className="ads-modal" role="dialog" aria-modal="true" aria-labelledby="ads-modal-title">
        <button className="ads-modal-close" type="button" aria-label="Detailansicht schließen" onClick={() => setSelectedKey(null)}>×</button>
        <span className="ads-card-type">{selected.paid ? "BEZAHLTE WERBUNG" : "ORGANISCHER ZUGRIFF"}</span>
        <h2 id="ads-modal-title">{campaignName(selected)}</h2>
        <dl className="ads-identifiers">
          <div><dt>Quelle</dt><dd>{label(selected.source, sourceLabels, "Quelle nicht erkannt")}</dd></div>
          <div><dt>Zugriffsart</dt><dd>{label(selected.medium, mediumLabels, "Ohne Kampagnenzuordnung")}</dd></div>
          <div><dt>Kampagnenbezeichnung</dt><dd>{selected.campaign === "none" ? "Nicht übermittelt" : selected.campaign}</dd></div>
          <div><dt>Kampagnen-ID</dt><dd>{selected.campaignId === "none" ? "Nicht übermittelt" : selected.campaignId}</dd></div>
          <div><dt>Zuletzt gemessen</dt><dd>{germanDate(selected.lastSeen)}</dd></div>
        </dl>
        <h3>Gemessener Verlauf</h3>
        <div className="ads-modal-metrics">
          <article><span>Besuche</span><strong>{selected.visits}</strong></article>
          <article><span>Registrierungs-Klicks</span><strong>{selected.signupClicks}</strong><small>{conversion(selected.signupClicks, selected.visits)} der Besuche</small></article>
          <article><span>Formular begonnen</span><strong>{selected.formStarts}</strong><small>{conversion(selected.formStarts, selected.signupClicks)} der Registrierungs-Klicks</small></article>
          <article><span>Formular abgesendet</span><strong>{selected.formSubmissions}</strong><small>{conversion(selected.formSubmissions, selected.formStarts)} der Formularstarts</small></article>
          <article><span>Konto angelegt</span><strong>{selected.accounts}</strong><small>{conversion(selected.accounts, selected.formSubmissions)} der Absendungen</small></article>
          <article><span>E-Mail bestätigt</span><strong>{selected.confirmations}</strong><small>{conversion(selected.confirmations, selected.accounts)} der Konten</small></article>
          <article><span>Bezahlung begonnen</span><strong>{selected.checkouts}</strong><small>{conversion(selected.checkouts, selected.confirmations)} der Bestätigungen</small></article>
          <article><span>Erfolgreiche Käufe</span><strong>{selected.purchases}</strong><small>{conversion(selected.purchases, selected.checkouts)} der begonnenen Bezahlungen</small></article>
        </div>
        <div className="ads-recommendation"><strong>Aktuelle Einschätzung</strong><p>{selected.recommendation}</p></div>
        <h3>Erkannte Anzeigen und Varianten</h3>
        <div className="ads-variants">{selected.advertisements.map(ad => <div key={`${ad.content}:${ad.visits}:${ad.signupClicks}`}><span>{ad.content === "none" ? "Keine Anzeigenkennung übermittelt" : ad.content}</span><strong>{ad.visits} Besuche · {ad.signupClicks} Registrierungs-Klicks · {ad.purchases} Käufe</strong></div>)}</div>
      </section>
    </div>}
  </>;
}
