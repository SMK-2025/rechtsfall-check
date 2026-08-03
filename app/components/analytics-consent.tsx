"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const STORAGE_KEY = "rechtsfall-check-consent-v1";
const OPEN_EVENT = "rechtsfall-check:open-cookie-settings";
const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const excludedPrefixes = ["/anmelden", "/api", "/betrieb", "/bewertungen", "/fallraum", "/passwort", "/profil", "/support"];

type ConsentChoice = { necessary: true; analytics: boolean; updatedAt: string };

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    __rfcGaConfigured?: boolean;
  }
}

function readChoice(): ConsentChoice | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentChoice) : null;
  } catch {
    return null;
  }
}

function isPublicPage(pathname: string) {
  return !excludedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function setGoogleConsent(analytics: boolean) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) { window.dataLayer.push(args); };
  window.gtag("consent", "update", {
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

function removeAnalyticsCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (name === "_ga" || name?.startsWith("_ga_")) {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.${location.hostname}; SameSite=Lax`;
    }
  });
}

function configureGoogleAnalytics() {
  if (!measurementId || window.__rfcGaConfigured) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) { window.dataLayer.push(args); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  window.__rfcGaConfigured = true;
}

export function AnalyticsConsent() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsSelected, setAnalyticsSelected] = useState(false);

  useEffect(() => {
    if (!measurementId) return;
    const stored = readChoice();
    configureGoogleAnalytics();
    setGoogleConsent(stored?.analytics === true);
    const initialize = window.setTimeout(() => {
      setChoice(stored);
      setAnalyticsSelected(stored?.analytics === true);
      setOpen(stored === null);
    }, 0);
    const showSettings = () => {
      const current = readChoice();
      setAnalyticsSelected(current?.analytics === true);
      setShowDetails(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, showSettings);
    return () => {
      window.clearTimeout(initialize);
      window.removeEventListener(OPEN_EVENT, showSettings);
    };
  }, []);

  useEffect(() => {
    if (!choice?.analytics || !measurementId || !isPublicPage(pathname)) return;
    configureGoogleAnalytics();
    setGoogleConsent(true);
    window.gtag?.("config", measurementId, {
      send_page_view: true,
      page_title: document.title,
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      transport_type: "beacon",
    });
  }, [choice, pathname]);

  if (!measurementId || !open) return null;

  const save = (analytics: boolean) => {
    const nextChoice: ConsentChoice = { necessary: true, analytics, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextChoice));
    setChoice(nextChoice);
    setAnalyticsSelected(analytics);
    setOpen(false);
    setShowDetails(false);
    configureGoogleAnalytics();
    setGoogleConsent(analytics);
    if (!analytics) {
      removeAnalyticsCookies();
    }
  };

  return <div className="analytics-consent-backdrop" role="presentation">
    <section className="analytics-consent-dialog" role="dialog" aria-modal="true" aria-labelledby="analytics-consent-title">
      <div className="analytics-consent-heading">
        <div>
          <span className="analytics-consent-kicker">IHRE PRIVATSPHÄRE</span>
          <h2 id="analytics-consent-title">Cookies und Datenschutz</h2>
        </div>
        {choice && <button type="button" className="analytics-consent-close" aria-label="Cookie-Einstellungen schließen" onClick={() => { setOpen(false); setShowDetails(false); }}>×</button>}
      </div>
      <p>Wir verwenden notwendige Technologien für den sicheren Betrieb. Mit Ihrer freiwilligen Zustimmung hilft uns Google Analytics, öffentliche Seiten und anonyme Schritte im Ablauf zu verbessern. Fall- und Kontoinhalte werden nicht übertragen.</p>

      {showDetails && <div className="analytics-consent-settings" id="cookie-details">
        <div className="analytics-consent-category">
          <div>
            <strong>Notwendig</strong>
            <span>Login, Sicherheit, Einwilligungsstatus und Seitendarstellung</span>
          </div>
          <span className="analytics-consent-always">Immer aktiv</span>
        </div>
        <div className="analytics-consent-category">
          <div>
            <strong>Statistik</strong>
            <span>Google Analytics 4 · Anbieter: Google Ireland Limited · öffentliche Seitenaufrufe und anonyme Prozessstatus · Speicherdauer in Analytics: 14 Monate</span>
          </div>
          <button
            type="button"
            className="analytics-consent-toggle"
            aria-label="Google Analytics erlauben"
            aria-pressed={analyticsSelected}
            onClick={() => setAnalyticsSelected((value) => !value)}
          ><span /></button>
        </div>
        <p className="analytics-consent-exclusions"><strong>Nicht erfasst:</strong> Namen, Kontaktdaten, Falltexte, Rechtsfragen, Dokumente, Supportnachrichten, Zahlungs- oder Kartendaten. Werbung und Personalisierung bleiben deaktiviert.</p>
      </div>}

      <div className="analytics-consent-actions">
        <button type="button" className="button-secondary" onClick={() => save(false)}>Nur notwendige</button>
        {!showDetails && <button type="button" className="button-secondary" aria-expanded={false} aria-controls="cookie-details" onClick={() => setShowDetails(true)}>Einstellungen</button>}
        {showDetails && <button type="button" className="button-secondary" onClick={() => save(analyticsSelected)}>Auswahl speichern</button>}
        <button type="button" className="button" onClick={() => save(true)}>Alle akzeptieren</button>
      </div>
      <small>Sie können Ihre Einwilligung jederzeit über „Cookie-Einstellungen“ im Footer widerrufen oder ändern. <Link href="/datenschutz#cookies">Details in der Datenschutzerklärung</Link></small>
    </section>
  </div>;
}

export function CookieSettingsButton() {
  if (!measurementId) return null;
  return <button type="button" className="cookie-settings-button" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>Cookie-Einstellungen</button>;
}
