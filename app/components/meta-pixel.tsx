"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_CHANGED_EVENT, CONSENT_STORAGE_KEY, type ConsentChoice } from "./analytics-consent";

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
const excludedPrefixes = ["/anmelden", "/api", "/betrieb", "/bewertungen", "/fallraum", "/passwort", "/profil", "/support"];

type MetaPixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
    __rfcMetaPixelInitialized?: boolean;
  }
}

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

function initializeMetaPixel() {
  if (!pixelId || !/^\d+$/.test(pixelId)) return false;
  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as MetaPixelFunction;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.push = (...args: unknown[]) => fbq(...args);
    window.fbq = fbq;
    window._fbq = fbq;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.dataset.rfcMetaPixel = "true";
    document.head.appendChild(script);
  }
  if (!window.__rfcMetaPixelInitialized) {
    window.fbq?.("init", pixelId);
    window.__rfcMetaPixelInitialized = true;
  }
  return true;
}

export function MetaPixel() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(hasMarketingConsent());
    const update = (event: Event) => {
      const detail = (event as CustomEvent<ConsentChoice>).detail;
      setAllowed(detail?.marketing === true);
    };
    window.addEventListener(CONSENT_CHANGED_EVENT, update);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, update);
  }, []);

  useEffect(() => {
    if (!allowed || !isPublicPage(pathname) || !initializeMetaPixel()) return;
    window.fbq?.("track", "PageView");
  }, [allowed, pathname]);

  return null;
}
