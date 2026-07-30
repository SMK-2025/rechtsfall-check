"use client";

const CONSENT_KEY = "rechtsfall-check-consent-v1";

type AnalyticsValue =
  | string
  | number
  | boolean
  | Array<Record<string, string | number>>;

export type AnalyticsEvent =
  | "sign_up"
  | "login"
  | "case_created"
  | "document_upload"
  | "begin_checkout"
  | "purchase"
  | "analysis_started"
  | "follow_up_answered"
  | "case_submitted"
  | "report_ready"
  | "support_ticket_created"
  | "review_submitted";

function hasAnalyticsConsent() {
  try {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    return stored ? JSON.parse(stored).analytics === true : false;
  } catch {
    return false;
  }
}

export function trackAnalyticsEvent(
  event: AnalyticsEvent,
  parameters: Record<string, AnalyticsValue> = {},
) {
  if (typeof window === "undefined" || !hasAnalyticsConsent() || !window.gtag) return;
  window.gtag("event", event, parameters);
}

export function countBand(count: number) {
  if (count <= 0) return "0";
  if (count === 1) return "1";
  if (count <= 3) return "2-3";
  if (count <= 5) return "4-5";
  return "6+";
}

export function trackPurchaseOnce(caseId: string) {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;
  const marker = `rfc-ga-purchase-${caseId}`;
  if (window.localStorage.getItem(marker)) return;
  const transactionId = crypto.randomUUID();
  trackAnalyticsEvent("purchase", {
    transaction_id: transactionId,
    value: 19,
    currency: "EUR",
    items: [{ item_id: "rechtsfall-check", item_name: "Rechtsfall Check", price: 19, quantity: 1 }],
  });
  window.localStorage.setItem(marker, transactionId);
}
