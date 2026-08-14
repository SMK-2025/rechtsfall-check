"use client";

import { trackMetaFunnelEvent, trackMetaPurchaseOnce } from "./meta";
import { trackFirstPartyFunnelEvent } from "./first-party-analytics";

const CONSENT_KEY = "rechtsfall-check-consent-v1";

type AnalyticsValue =
  | string
  | number
  | boolean
  | Array<Record<string, string | number>>;

export type AnalyticsEvent =
  | "cta_create_case_clicked"
  | "signup_page_viewed"
  | "signup_form_started"
  | "signup_form_submitted"
  | "sign_up"
  | "complete_registration"
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
  if (typeof window === "undefined") return;
  if (hasAnalyticsConsent() && window.gtag) window.gtag("event", event, parameters);
  // Registration CTA clicks are counted separately and cookieless by
  // PublicSignupLink. Do not count them twice after analytics consent.
  if (hasAnalyticsConsent() && event !== "cta_create_case_clicked") trackFirstPartyFunnelEvent(event);
  if (event === "sign_up") trackMetaFunnelEvent("registration_started");
  if (event === "complete_registration") trackMetaFunnelEvent("registration_completed");
  if (event === "begin_checkout") trackMetaFunnelEvent("checkout_started");
}

export function countBand(count: number) {
  if (count <= 0) return "0";
  if (count === 1) return "1";
  if (count <= 3) return "2-3";
  if (count <= 5) return "4-5";
  return "6+";
}

export function trackPurchaseOnce(caseId: string) {
  if (typeof window === "undefined") return;
  if (hasAnalyticsConsent()) {
    const marker = `rfc-ga-purchase-${caseId}`;
    if (!window.localStorage.getItem(marker)) {
      const transactionId = crypto.randomUUID();
      trackAnalyticsEvent("purchase", {
        transaction_id: transactionId,
        value: 19,
        currency: "EUR",
        items: [{ item_id: "rechtsfall-check", item_name: "Rechtsfall Check", price: 19, quantity: 1 }],
      });
      window.localStorage.setItem(marker, transactionId);
    }
  }
  trackMetaPurchaseOnce(caseId);
}
