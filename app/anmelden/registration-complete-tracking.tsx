"use client";

import { useEffect } from "react";
import { CONSENT_CHANGED_EVENT, CONSENT_STORAGE_KEY, type ConsentChoice } from "@/app/components/analytics-consent";
import { trackAnalyticsEvent } from "@/lib/analytics";

export function RegistrationCompleteTracking() {
  useEffect(() => {
    const marker = "rfc-registration-complete-tracked";
    const track = () => {
      if (window.sessionStorage.getItem(marker)) return;
      try {
        const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
        const choice = raw ? (JSON.parse(raw) as ConsentChoice) : null;
        if (!choice?.analytics && !choice?.marketing) return;
      } catch { return; }
      trackAnalyticsEvent("complete_registration", { method: "email" });
      window.sessionStorage.setItem(marker, "1");
    };
    track();
    const onConsent = () => track();
    window.addEventListener(CONSENT_CHANGED_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onConsent);
  }, []);
  return null;
}
