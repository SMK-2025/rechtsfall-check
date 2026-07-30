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

function loadGoogleAnalytics() {
  if (!measurementId || document.querySelector("[data-rfc-google-analytics]")) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) { window.dataLayer.push(args); };
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });
  window.gtag("set", "ads_data_redaction", true);
  setGoogleConsent(true);
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.rfcGoogleAnalytics = "true";
  document.head.appendChild(script);
}

export function AnalyticsConsent() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!measurementId) return;
    const stored = readChoice();
    setChoice(stored);
    setOpen(stored === null);
    if (stored?.analytics) loadGoogleAnalytics();
    const showSettings = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, showSettings);
    return () => window.removeEventListener(OPEN_EVENT, showSettings);
  }, []);

  useEffect(() => {
    if (!choice?.analytics || !measurementId || !isPublicPage(pathname)) return;
    loadGoogleAnalytics();
    window.gtag?.("event", "page_view", {
      page_title: document.title,
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
    });
  }, [choice, pathname]);

  if (!measurementId || !open) return null;

  const save = (analytics: boolean) => {
    const nextChoice: ConsentChoice = { necessary: true, analytics, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextChoice));
    setChoice(nextChoice);
    setOpen(false);
    if (analytics) loadGoogleAnalytics();
    else {
      setGoogleConsent(false);
      removeAnalyticsCookies();
      if (document.querySelector("[data-rfc-google-analytics]")) window.location.reload();
    }
  };

  return <div className="analytics-consent-backdrop" role="presentation">
    <section className="analytics-consent-dialog" role="dialog" aria-modal="true" aria-labelledby="analytics-consent-title">
      <span className="analytics-consent-kicker">IHRE PRIVATSPHÄRE</span>
      <h2 id="analytics-consent-title">Dürfen wir die öffentlichen Seiten verbessern?</h2>
      <p>Mit Ihrer Zustimmung misst Google Analytics ausschließlich die Nutzung unserer öffentlichen Informationsseiten. Fallakten, Dokumente, Konto-, Support- und Zahlungsbereiche bleiben vollständig ausgeschlossen.</p>
      <div className="analytics-consent-details">
        <strong>Notwendige Funktionen</strong><span>Immer aktiv – für Sicherheit, Login und Seitendarstellung.</span>
        <strong>Reichweitenmessung</strong><span>Nur mit Ihrer Einwilligung; keine personalisierte Werbung.</span>
      </div>
      <div className="analytics-consent-actions">
        <button type="button" className="button-secondary" onClick={() => save(false)}>Nur notwendige</button>
        <button type="button" className="button" onClick={() => save(true)}>Statistik erlauben</button>
      </div>
      <small>Ihre Auswahl können Sie jederzeit über „Cookie-Einstellungen“ ändern. <Link href="/datenschutz#cookies">Mehr zum Datenschutz</Link></small>
    </section>
  </div>;
}

export function CookieSettingsButton() {
  if (!measurementId) return null;
  return <button type="button" className="cookie-settings-button" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>Cookie-Einstellungen</button>;
}
