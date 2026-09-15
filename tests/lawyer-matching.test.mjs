import assert from "node:assert/strict";
import test from "node:test";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(new URL("../lib/lawyer-matching.ts", import.meta.url).pathname).href;

test("matching source enforces verified status, availability, legal area and radius", async () => {
  const source = await import("node:fs/promises").then(fs => fs.readFile(new URL("../lib/lawyer-matching.ts", import.meta.url), "utf8"));
  assert.match(source, /status !== "VERIFIED"/);
  assert.match(source, /casePaymentStatus !== "PAID"/);
  assert.match(source, /!lawyer\.acceptsNewMandates/);
  assert.match(source, /legalAreas\.includes\(request\.legalArea\)/);
  assert.match(source, /distanceKm > lawyer\.practiceRadiusKm/);
  assert.match(source, /matchStatus === "CONTACT_RELEASED"/);
  assert.match(source, /userConsentAt !== null/);
  assert.match(source, /selectedByUserAt !== null/);
  assert.ok(moduleUrl.includes("lawyer-matching.ts"));
});

test("lawyer access stays private until paid matching and explicit user release", async () => {
  const fs = await import("node:fs/promises");
  const [report, contacts, selection, chat, landing] = await Promise.all([
    fs.readFile(new URL("../app/fallraum/[caseId]/bericht/page.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/kontakte/page.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/api/v1/lawyer-matches/[matchId]/select/route.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/api/v1/lawyer-matches/[matchId]/messages/route.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/fuer-anwaelte/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(report, /mayDiscloseCaseToLawyer/);
  assert.match(report, /lawyerSubscriptions\.status/);
  assert.match(contacts, /cases\.paymentStatus, "PAID"/);
  assert.match(contacts, /CONTACT_RELEASED/);
  assert.match(selection, /DISCLOSURE_CONSENT_REQUIRED/);
  assert.match(selection, /\["contact", "case_report"\]/);
  assert.match(chat, /lawyerSubscriptions\.status/);
  assert.match(chat, /row\.ownerId === memberId/);
  assert.match(landing, /nicht öffentlich gelistet/i);
  assert.doesNotMatch(landing, /wir garantieren (ihnen )?mandate/i);
});

test("automatic suggestions use one-time location data without persisting exact user coordinates", async () => {
  const fs = await import("node:fs/promises");
  const [route, client] = await Promise.all([
    fs.readFile(new URL("../app/api/v1/cases/[caseId]/lawyer-matches/route.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/kontakte/lawyer-contacts.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(route, /locationConsent !== true/);
  assert.match(route, /item\.paymentStatus !== "PAID"/);
  assert.match(route, /\["ASSESSMENT_READY", "ESCALATED"\]/);
  assert.match(route, /exactLocationStored: false/);
  const persistedMatch = route.slice(route.indexOf("db.insert(lawyerMatches)"));
  assert.doesNotMatch(persistedMatch, /latitudeE6|longitudeE6/);
  assert.match(client, /navigator\.geolocation\.getCurrentPosition/);
});

test("lawyer activation requires operator verification and Stripe payment", async () => {
  const fs = await import("node:fs/promises");
  const [verification, checkout, webhook] = await Promise.all([
    fs.readFile(new URL("../app/api/internal/lawyers/[lawyerId]/route.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/api/v1/lawyer-checkout/route.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/api/webhooks/stripe/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(verification, /requireAdmin/);
  assert.match(verification, /status: body\.status/);
  assert.match(checkout, /profile\.status !== "VERIFIED"/);
  assert.match(webhook, /profile\.status !== "VERIFIED"/);
  assert.match(webhook, /accountRole: "LAWYER"/);
});

test("annual lawyer access has a protected deadline-aware cancellation flow", async () => {
  const fs = await import("node:fs/promises");
  const route = await fs.readFile(new URL("../app/api/v1/lawyer-subscription/cancel/route.ts", import.meta.url), "utf8");
  assert.match(route, /enforceSameOrigin/);
  assert.match(route, /cancellationDeadlineAt/);
  assert.match(route, /cancel_at_period_end: true/);
  assert.match(route, /LAWYER_SUBSCRIPTION_CANCELLATION_REQUESTED/);
});
