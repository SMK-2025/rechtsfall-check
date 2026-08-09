"use client";

import { CONSENT_STORAGE_KEY, type ConsentChoice } from "@/app/components/analytics-consent";

type MetaFunnelEvent = "registration_started" | "registration_completed" | "checkout_started";
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

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

export function initializeMetaPixel() {
  if (typeof window === "undefined" || !pixelId || !/^\d+$/.test(pixelId) || !hasMarketingConsent()) return false;
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

export function trackMetaFunnelEvent(event: MetaFunnelEvent) {
  if (!initializeMetaPixel() || !window.fbq) return false;
  if (event === "registration_started") window.fbq("trackCustom", "StartRegistration");
  if (event === "registration_completed") window.fbq("track", "CompleteRegistration");
  if (event === "checkout_started") window.fbq("track", "InitiateCheckout", { content_name: "Rechtsfall Check", currency: "EUR", value: 19 });
  return true;
}

export function trackMetaPurchaseOnce(caseId: string) {
  if (!initializeMetaPixel() || !window.fbq) return false;
  const marker = `rfc-meta-purchase-${caseId}`;
  if (window.localStorage.getItem(marker)) return false;
  window.fbq("track", "Purchase", { content_name: "Rechtsfall Check", currency: "EUR", value: 19 });
  window.localStorage.setItem(marker, "1");
  return true;
}
