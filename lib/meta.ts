"use client";

import { CONSENT_STORAGE_KEY, type ConsentChoice } from "@/app/components/analytics-consent";

type MetaFunnelEvent = "registration_started" | "registration_completed" | "checkout_started";

function hasMarketingConsent() {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentChoice).marketing === true : false;
  } catch {
    return false;
  }
}

export function trackMetaFunnelEvent(event: MetaFunnelEvent) {
  if (typeof window === "undefined" || !hasMarketingConsent() || !window.fbq) return false;
  if (event === "registration_started") window.fbq("trackCustom", "StartRegistration");
  if (event === "registration_completed") window.fbq("track", "CompleteRegistration");
  if (event === "checkout_started") window.fbq("track", "InitiateCheckout", { content_name: "Rechtsfall Check", currency: "EUR", value: 19 });
  return true;
}

export function trackMetaPurchaseOnce(caseId: string) {
  if (typeof window === "undefined" || !hasMarketingConsent() || !window.fbq) return false;
  const marker = `rfc-meta-purchase-${caseId}`;
  if (window.localStorage.getItem(marker)) return false;
  window.fbq("track", "Purchase", { content_name: "Rechtsfall Check", currency: "EUR", value: 19 });
  window.localStorage.setItem(marker, "1");
  return true;
}
