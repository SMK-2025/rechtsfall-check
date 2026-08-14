"use client";

export const FIRST_PARTY_ATTRIBUTION_KEY = "rfc-first-party-attribution-v1";
const CONSENT_KEY = "rechtsfall-check-consent-v1";

export type FirstPartyAttribution = {
  source: string;
  medium: string;
  campaign: string;
  metaClick: boolean;
};

const clean = (value: string | null, fallback: string) => {
  const normalized = (value || "").trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized.slice(0, 64) || fallback;
};

export function hasFirstPartyAnalyticsConsent() {
  try {
    return JSON.parse(window.localStorage.getItem(CONSENT_KEY) || "null")?.analytics === true;
  } catch {
    return false;
  }
}

export function readAttribution(): FirstPartyAttribution {
  try {
    const stored = window.sessionStorage.getItem(FIRST_PARTY_ATTRIBUTION_KEY);
    if (stored) return JSON.parse(stored) as FirstPartyAttribution;
  } catch {
    // A direct visit remains measurable even when session storage is unavailable.
  }
  return { source: "direct", medium: "none", campaign: "none", metaClick: false };
}

export function captureAttribution() {
  const parameters = new URLSearchParams(window.location.search);
  const metaClick = parameters.has("fbclid");
  const hasCampaign = metaClick || parameters.has("utm_source") || parameters.has("utm_medium") || parameters.has("utm_campaign");
  if (!hasCampaign) return readAttribution();
  const attribution: FirstPartyAttribution = {
    source: clean(parameters.get("utm_source"), metaClick ? "meta" : "unknown"),
    medium: clean(parameters.get("utm_medium"), metaClick ? "paid-social" : "unknown"),
    campaign: clean(parameters.get("utm_campaign"), "none"),
    metaClick,
  };
  try {
    window.sessionStorage.setItem(FIRST_PARTY_ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    // The aggregate event can still be sent without persisting attribution locally.
  }
  return attribution;
}

export function trackFirstPartyEvent(
  eventType: "session" | "page_visit" | "scroll" | "read_time" | "cta" | "funnel",
  eventKey: string,
  pageGroup: string,
  value = 0,
) {
  if (typeof window === "undefined" || !hasFirstPartyAnalyticsConsent()) return;
  const attribution = captureAttribution();
  const body = JSON.stringify({ eventType, eventKey, pageGroup, value, ...attribution });
  if (eventType === "read_time" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/v1/public/engagement", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/v1/public/engagement", {
    method: "POST",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    keepalive: true,
    headers: { "content-type": "application/json" },
    body,
  }).catch(() => undefined);
}

export function trackFirstPartyFunnelEvent(eventKey: string) {
  trackFirstPartyEvent("funnel", eventKey, "funnel");
}

/**
 * Counts a click on the public registration CTA without cookies, browser IDs or
 * personal content. This deliberately records click actions rather than people.
 */
export function trackPublicSignupClick() {
  if (typeof window === "undefined") return;
  const parameters = new URLSearchParams(window.location.search);
  const metaClick = parameters.has("fbclid");
  const body = JSON.stringify({
    eventType: "funnel",
    eventKey: "cta_create_case_clicked",
    pageGroup: "funnel",
    source: clean(parameters.get("utm_source"), metaClick ? "meta" : "direct"),
    medium: clean(parameters.get("utm_medium"), metaClick ? "paid-social" : "none"),
    campaign: clean(parameters.get("utm_campaign"), "none"),
    metaClick,
  });
  void fetch("/api/v1/public/engagement", {
    method: "POST",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    keepalive: true,
    headers: { "content-type": "application/json" },
    body,
  }).catch(() => undefined);
}
