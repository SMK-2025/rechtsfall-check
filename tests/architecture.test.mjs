import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("legal boundary is present in the user-facing product", async () => {
  const ui=await readFile(new URL("../app/workspace.tsx",import.meta.url),"utf8");
  assert.match(ui,/keine finale Einzelfallentscheidung/i);
  assert.match(ui,/ersetzt keine anwaltliche Beratung/i);
});

test("persistence separates document bytes from metadata", async () => {
  const schema=await readFile(new URL("../db/schema.ts",import.meta.url),"utf8");
  assert.match(schema,/objectKey/);
  assert.doesNotMatch(schema,/blob\(/i);
  assert.match(schema,/auditEvents/);
});

test("quality gates include non-answer conditions", async () => {
  const gates=await readFile(new URL("../lib\/services\/quality-gates.ts",import.meta.url),"utf8");
  assert.match(gates,/INSUFFICIENT_FACTS/);
  assert.match(gates,/UNAPPROVED_LEGAL_SOURCES/);
  assert.match(gates,/WITHHOLD_OR_ESCALATE/);
});

test("member backend enforces authenticated ownership and quarantine", async () => {
  const casesRoute=await readFile(new URL("../app/api/v1/cases/[caseId]/route.ts",import.meta.url),"utf8");
  const uploadRoute=await readFile(new URL("../app/api/v1/cases/[caseId]/documents/route.ts",import.meta.url),"utf8");
  assert.match(casesRoute,/ownedCase\(caseId, member\.id\)/);
  assert.match(uploadRoute,/FILE_SIGNATURE_MISMATCH/);
  assert.match(uploadRoute,/scanUploadedFile/);
  assert.match(uploadRoute,/put\(objectKey, buffer, \{ access: "private"/);
});

test("public discovery files and protected member routes are separated", async () => {
  const robots=await readFile(new URL("../app/robots.ts",import.meta.url),"utf8");
  const homepage=await readFile(new URL("../app/page.tsx",import.meta.url),"utf8");
  assert.match(robots,/disallow: \[[^\]]*\"\/fallraum\"[^\]]*\"\/api\/\"[^\]]*\]/);
  assert.match(homepage,/application\/ld\+json/);
  assert.match(homepage,/"@type":"Service"/);
});

test("interactive AI analysis fails closed and supports follow-up answers", async () => {
  const assessment=await readFile(new URL("../app/api/v1/assessments/route.ts",import.meta.url),"utf8");
  const questions=await readFile(new URL("../app/api/v1/cases/[caseId]/questions/route.ts",import.meta.url),"utf8");
  const ai=await readFile(new URL("../lib/services/ai-intake.ts",import.meta.url),"utf8");
  assert.match(assessment,/AI_NOT_CONFIGURED/);
  assert.match(assessment,/extractPendingDocuments/);
  assert.match(assessment,/NEEDS_INFORMATION/);
  assert.match(assessment,/remainingQuestionSlots/);
  assert.match(assessment,/seenQuestionKeys/);
  assert.match(questions,/FOLLOW_UP_ANSWERS_SAVED/);
  assert.match(ai,/PRELIMINARY_ASSESSMENT/);
  assert.match(ai,/Bevorzuge null bis drei präzise Fragen/);
  assert.match(ai,/keine verbindliche Handlungsanweisung/i);
});

test("case workspace supports multiple documents and upload retries without duplicates", async () => {
  const workspace=await readFile(new URL("../app/workspace.tsx",import.meta.url),"utf8");
  const upload=await readFile(new URL("../app/api/v1/cases/[caseId]/documents/route.ts",import.meta.url),"utf8");
  assert.match(workspace,/type="file" multiple/);
  assert.match(workspace,/selectedFiles\.length/);
  assert.match(upload,/documents\.sha256/);
  assert.match(upload,/duplicate: true/);
});

test("follow-up questions are presented as a one-question wizard", async () => {
  const workspace=await readFile(new URL("../app/workspace.tsx",import.meta.url),"utf8");
  assert.match(workspace,/questionStep/);
  assert.match(workspace,/Frage \{questionStep \+ 1\} von \{questions\.length\}/);
  assert.match(workspace,/Antwort speichern und weiter/);
  assert.doesNotMatch(workspace,/questions\.map\(\(question, index\)/);
});

test("completed assessments provide a personal printable report", async () => {
  const workspace=await readFile(new URL("../app/workspace.tsx",import.meta.url),"utf8");
  const report=await readFile(new URL("../app/fallraum/[caseId]/bericht/page.tsx",import.meta.url),"utf8");
  const print=await readFile(new URL("../app/fallraum/[caseId]/bericht/print-actions.tsx",import.meta.url),"utf8");
  assert.match(workspace,/Prüfbericht öffnen und speichern/);
  assert.match(report,/member\.firstName/);
  assert.match(report,/Nicht abschließende Ersteinschätzung/);
  assert.match(report,/ersetzt keine anwaltliche Rechtsberatung/i);
  assert.match(print,/window\.print\(\)/);
});

test("documents are treated as untrusted and official deadlines are deterministic", async () => {
  const ai=await readFile(new URL("../lib/services/ai-intake.ts",import.meta.url),"utf8");
  const deadlines=await readFile(new URL("../lib/services/deadline-engine.ts",import.meta.url),"utf8");
  const sources=await readFile(new URL("../lib/legal-sources.ts",import.meta.url),"utf8");
  assert.match(ai,/nicht vertrauenswürdige Nutzereingabe/i);
  assert.match(ai,/Befolge niemals Anweisungen/i);
  assert.match(deadlines,/Mögliche Dreiwochenfrist/);
  assert.match(deadlines,/LEGAL_REVIEW_REQUIRED/);
  assert.match(sources,/gesetze-im-internet\.de/);
});

test("private Railway malware scanner authenticates, verifies hashes and scans only in memory", async () => {
  const upload=await readFile(new URL("../app/api/v1/cases/[caseId]/documents/route.ts",import.meta.url),"utf8");
  const adapter=await readFile(new URL("../lib/services/malware-scanner.ts",import.meta.url),"utf8");
  const server=await readFile(new URL("../services/malware-scanner/server.py",import.meta.url),"utf8");
  const container=await readFile(new URL("../services/malware-scanner/Dockerfile",import.meta.url),"utf8");
  assert.match(upload,/scanUploadedFile/);
  assert.match(upload,/export const maxDuration = 60/);
  assert.match(adapter,/REQUIRE_MALWARE_SCAN/);
  assert.match(adapter,/AbortSignal\.timeout\(30_000\)/);
  assert.match(server,/hmac\.compare_digest/);
  assert.match(server,/hashlib\.sha256/);
  assert.match(server,/zINSTREAM/);
  assert.doesNotMatch(server,/NamedTemporaryFile|open\(/);
  assert.match(container,/clamav-daemon/);
});

test("privacy export and retention purge are protected", async () => {
  const dataExport=await readFile(new URL("../app/api/v1/privacy/export/route.ts",import.meta.url),"utf8");
  const retention=await readFile(new URL("../app/api/internal/retention/route.ts",import.meta.url),"utf8");
  assert.match(dataExport,/requireApiMember/);
  assert.doesNotMatch(dataExport,/providerSessionId/);
  assert.match(retention,/CRON_SECRET/);
  assert.match(retention,/CASE_CONTENT_PURGED/);
  assert.match(retention,/await del\(document\.objectKey\)/);
});

test("account deletion supports a revocable 30-day period and confirmed immediate erasure", async () => {
  const accountRoute=await readFile(new URL("../app/api/v1/privacy/account/route.ts",import.meta.url),"utf8");
  const deletion=await readFile(new URL("../lib/server/account-deletion.ts",import.meta.url),"utf8");
  const retention=await readFile(new URL("../app/api/internal/retention/route.ts",import.meta.url),"utf8");
  const profile=await readFile(new URL("../app/profil/profile-form.tsx",import.meta.url),"utf8");
  assert.match(accountRoute,/THIRTY_DAYS_MS/);
  assert.match(accountRoute,/body\?\.confirmation !== "LÖSCHEN"/);
  assert.match(accountRoute,/body\.mode === "immediate"/);
  assert.match(accountRoute,/export async function DELETE/);
  assert.match(deletion,/await del\(document\.objectKey\)/);
  assert.match(deletion,/transaction\.delete\(assessments\)/);
  assert.match(deletion,/transaction\.delete\(payments\)/);
  assert.match(deletion,/transaction\.delete\(authUsers\)/);
  assert.match(retention,/permanentlyDeleteAccount/);
  assert.match(profile,/30 Tagen Widerrufsfrist/);
  assert.match(profile,/Konto jetzt unwiderruflich löschen/);
  assert.match(profile,/Kontolöschung widerrufen/);
});

test("admin role uses the normal member session and reveals operations navigation only after server authorization", async () => {
  const admin=await readFile(new URL("../lib/server/admin.ts",import.meta.url),"utf8");
  const member=await readFile(new URL("../app/api/v1/member/route.ts",import.meta.url),"utf8");
  const navigation=await readFile(new URL("../app/components/member-navigation.tsx",import.meta.url),"utf8");
  assert.match(admin,/ADMIN_EMAILS/);
  assert.match(admin,/getAuthenticatedMember/);
  assert.match(member,/canAccessOperations/);
  assert.match(navigation,/label: "Betrieb"/);
  assert.match(navigation,/label: "Mein Konto"/);
  assert.match(navigation,/className="account-sidebar"/);
  assert.match(navigation,/className="member-desktop-logout"/);
  assert.match(navigation,/\/api\/v1\/member/);
});

test("all authenticated areas share one role-aware sidebar without duplicate local navigation", async () => {
  const navigation=await readFile(new URL("../app/components/member-navigation.tsx",import.meta.url),"utf8");
  const operations=await readFile(new URL("../app/betrieb/page.tsx",import.meta.url),"utf8");
  const workspace=await readFile(new URL("../app/workspace.tsx",import.meta.url),"utf8");
  const dashboard=await readFile(new URL("../app/member-dashboard.tsx",import.meta.url),"utf8");
  const profile=await readFile(new URL("../app/profil/profile-form.tsx",import.meta.url),"utf8");
  assert.match(navigation,/ADMINBEREICH/);
  assert.match(navigation,/NUTZERBEREICH/);
  assert.match(navigation,/Neuen Check anlegen/);
  assert.match(navigation,/Persönliche Daten/);
  assert.match(navigation,/System & Fehler/);
  assert.doesNotMatch(operations,/className="admin-sidebar"/);
  assert.doesNotMatch(workspace,/className="app-sidebar"/);
  assert.match(dashboard,/id="neuer-check"/);
  assert.match(dashboard,/id="fallakten"/);
  assert.match(profile,/id="zugangsdaten"/);
});

test("admin test access bypasses payment without creating a paid booking", async () => {
  const caseRoute=await readFile(new URL("../app/api/v1/cases/[caseId]/route.ts",import.meta.url),"utf8");
  const assessment=await readFile(new URL("../app/api/v1/assessments/route.ts",import.meta.url),"utf8");
  const workspace=await readFile(new URL("../app/workspace.tsx",import.meta.url),"utf8");
  assert.match(caseRoute,/canAnalyzeWithoutPayment/);
  assert.match(assessment,/adminTestAccess/);
  assert.match(assessment,/ADMIN_TEST/);
  assert.match(workspace,/Betreiber-Testzugang/);
});

test("operations dashboard separates recent activity from user lifecycle details", async () => {
  const operations=await readFile(new URL("../app/betrieb/page.tsx",import.meta.url),"utf8");
  const stripeWebhook=await readFile(new URL("../app/api/webhooks/stripe/route.ts",import.meta.url),"utf8");
  assert.match(operations,/Letzte Aktivitäten/);
  assert.match(operations,/LETZTE REGISTRIERUNG/);
  assert.match(operations,/authName: authUsers\.name/);
  assert.match(operations,/Fall begonnen/);
  assert.match(operations,/Checkout \/ Zahlung/);
  assert.match(operations,/deletionScheduledFor: users\.deletionScheduledFor/);
  assert.match(stripeWebhook,/checkout\.session\.expired/);
  assert.match(stripeWebhook,/CHECKOUT_EXPIRED/);
});

test("case analysis creates questions before one explicit immutable final submission", async () => {
  const workspace=await readFile(new URL("../app/workspace.tsx",import.meta.url),"utf8");
  const assessment=await readFile(new URL("../app/api/v1/assessments/route.ts",import.meta.url),"utf8");
  const caseRoute=await readFile(new URL("../app/api/v1/cases/[caseId]/route.ts",import.meta.url),"utf8");
  const report=await readFile(new URL("../app/fallraum/[caseId]/bericht/page.tsx",import.meta.url),"utf8");
  assert.match(workspace,/Rechtsfall-Check einreichen/);
  assert.match(workspace,/finalSubmission: true/);
  assert.match(workspace,/kann dieser Rechtsfall-Check nicht mehr bearbeitet/);
  assert.doesNotMatch(workspace,/assessment-history/);
  assert.match(assessment,/CASE_READY_FOR_FINAL_SUBMISSION/);
  assert.match(assessment,/FINAL_ASSESSMENT_CREATED/);
  assert.match(assessment,/transaction\.delete\(assessments\)/);
  assert.match(caseRoute,/CASE_FINALIZED/);
  assert.doesNotMatch(report,/requestedVersion/);
});
