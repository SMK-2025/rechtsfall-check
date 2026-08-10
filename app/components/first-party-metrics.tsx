"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_CHANGED_EVENT, type ConsentChoice } from "./analytics-consent";
import { hasFirstPartyAnalyticsConsent, trackFirstPartyEvent } from "@/lib/first-party-analytics";

const publicPageGroups: Record<string, string> = {
  "/": "startseite",
  "/rechtsfall-check": "rechtsfall-check",
  "/so-funktionierts": "ablauf",
  "/rechtsgebiete": "rechtsgebiete",
  "/preise": "preise",
  "/sicherheit": "sicherheit",
  "/fragen": "fragen",
  "/datenschutz": "datenschutz",
  "/impressum": "impressum",
  "/agb": "agb",
  "/barrierefreiheit": "barrierefreiheit",
};

const ctaTargets: Record<string, string> = {
  "/anmelden": "konto-starten",
  "/rechtsfall-check": "rechtsfall-check",
  "/so-funktionierts": "ablauf",
  "/rechtsgebiete": "rechtsgebiete",
  "/preise": "preise",
  "/fragen": "fragen",
  "/sicherheit": "sicherheit",
};

export function FirstPartyMetrics() {
  const pathname = usePathname();
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    const update = (event?: Event) => {
      const detail = (event as CustomEvent<ConsentChoice> | undefined)?.detail;
      setAnalyticsAllowed(detail ? detail.analytics === true : hasFirstPartyAnalyticsConsent());
    };
    update();
    window.addEventListener(CONSENT_CHANGED_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => {
    const pageGroup = publicPageGroups[pathname];
    if (!pageGroup) return;
    void fetch("/api/v1/public/metrics", {
      method: "POST",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pageGroup }),
    }).catch(() => undefined);
  }, [pathname]);

  useEffect(() => {
    const pageGroup = publicPageGroups[pathname];
    if (!analyticsAllowed || !pageGroup) return;

    try {
      if (!window.sessionStorage.getItem("rfc-first-party-session-counted-v1")) {
        trackFirstPartyEvent("session", "visit", "gesamt");
        window.sessionStorage.setItem("rfc-first-party-session-counted-v1", "1");
      }
      const pageMarker = `rfc-first-party-page-v1:${pageGroup}`;
      if (!window.sessionStorage.getItem(pageMarker)) {
        trackFirstPartyEvent("page_visit", "visit", pageGroup);
        window.sessionStorage.setItem(pageMarker, "1");
      }
    } catch {
      trackFirstPartyEvent("page_visit", "visit", pageGroup);
    }

    const reached = new Set<number>();
    const recordScroll = () => {
      const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const depth = height <= window.innerHeight ? 100 : Math.round(((window.scrollY + window.innerHeight) / height) * 100);
      for (const threshold of [25, 50, 75, 100]) {
        if (depth >= threshold && !reached.has(threshold)) {
          reached.add(threshold);
          trackFirstPartyEvent("scroll", String(threshold), pageGroup);
        }
      }
    };

    let activeSeconds = 0;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && document.hasFocus()) activeSeconds += 1;
    }, 1000);

    const recordClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("a,button,[data-analytics-cta]") : null;
      if (!target) return;
      const explicit = target.dataset.analyticsCta;
      if (explicit && Object.values(ctaTargets).includes(explicit)) {
        trackFirstPartyEvent("cta", explicit, pageGroup);
        return;
      }
      if (target instanceof HTMLAnchorElement) {
        const destination = new URL(target.href, window.location.origin);
        if (destination.origin !== window.location.origin) return;
        const key = ctaTargets[destination.pathname];
        if (key) trackFirstPartyEvent("cta", key, pageGroup);
      }
    };

    recordScroll();
    window.addEventListener("scroll", recordScroll, { passive: true });
    document.addEventListener("click", recordClick, true);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("scroll", recordScroll);
      document.removeEventListener("click", recordClick, true);
      if (activeSeconds >= 3) trackFirstPartyEvent("read_time", "active-seconds", pageGroup, activeSeconds);
    };
  }, [analyticsAllowed, pathname]);

  return null;
}
