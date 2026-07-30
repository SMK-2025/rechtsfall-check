import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("analytics requires consent and excludes protected page paths", async () => {
  const [consent, analytics] = await Promise.all([
    read("app/components/analytics-consent.tsx"),
    read("lib/analytics.ts"),
  ]);
  for (const path of ["/betrieb", "/fallraum", "/profil", "/support", "/anmelden"]) {
    assert.match(consent, new RegExp(path.replace("/", "\\/")));
  }
  assert.match(analytics, /analytics === true/);
  assert.match(consent, /loadGoogleAnalytics\(\);\s*setGoogleConsent\(stored\?\.analytics === true\)/);
  assert.match(consent, /ad_personalization: "denied"/);
  assert.match(consent, /allow_google_signals: false/);
});

test("funnel analytics sends statuses but no case or contact content", async () => {
  const files = await Promise.all([
    read("app/anmelden/auth-form.tsx"),
    read("app/member-dashboard.tsx"),
    read("app/workspace.tsx"),
    read("app/support/support-center.tsx"),
    read("app/bewertungen/reviews-center.tsx"),
  ]);
  const instrumentation = files.join("\n");
  for (const event of [
    "sign_up", "login", "case_created", "document_upload", "begin_checkout",
    "purchase", "analysis_started", "follow_up_answered", "case_submitted",
    "report_ready", "support_ticket_created", "review_submitted",
  ]) {
    assert.match(instrumentation + await read("lib/analytics.ts"), new RegExp(`"${event}"`));
  }
  for (const forbiddenParameter of ["user_email:", "case_title:", "document_name:", "ticket_message:", "answer_text:"]) {
    assert.doesNotMatch(instrumentation, new RegExp(forbiddenParameter));
  }
});
