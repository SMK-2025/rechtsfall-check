"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_CHANGED_EVENT, CONSENT_STORAGE_KEY, type ConsentChoice } from "./analytics-consent";
import { initializeMetaPixel } from "@/lib/meta";

const excludedPrefixes = ["/anmelden", "/api", "/betrieb", "/bewertungen", "/fallraum", "/passwort", "/profil", "/support"];

function hasMarketingConsent() {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentChoice).marketing === true : false;
  } catch {
    return false;
  }
}

function isPublicPage(pathname: string) {
  return !excludedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function MetaPixel() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(() => typeof window !== "undefined" && hasMarketingConsent());

  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<ConsentChoice>).detail;
      setAllowed(detail?.marketing === true);
    };
    window.addEventListener(CONSENT_CHANGED_EVENT, update);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, update);
  }, []);

  useEffect(() => {
    if (!allowed || !initializeMetaPixel()) return;
    if (isPublicPage(pathname)) window.fbq?.("track", "PageView");
  }, [allowed, pathname]);

  return null;
}
