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
  assert.match(assessment,/slice\(0, 10\)/);
  assert.match(assessment,/seenQuestionKeys/);
  assert.match(questions,/FOLLOW_UP_ANSWERS_SAVED/);
  assert.match(ai,/PRELIMINARY_ASSESSMENT/);
  assert.match(ai,/Stelle dann keine weiteren Rückfragen/);
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
  assert.match(workspace,/Persönlichen Prüfbericht öffnen/);
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

test("privacy export and retention purge are protected", async () => {
  const dataExport=await readFile(new URL("../app/api/v1/privacy/export/route.ts",import.meta.url),"utf8");
  const retention=await readFile(new URL("../app/api/internal/retention/route.ts",import.meta.url),"utf8");
  assert.match(dataExport,/requireApiMember/);
  assert.doesNotMatch(dataExport,/providerSessionId/);
  assert.match(retention,/CRON_SECRET/);
  assert.match(retention,/CASE_CONTENT_PURGED/);
  assert.match(retention,/await del\(document\.objectKey\)/);
});

test("admin role uses the normal member session and reveals operations navigation only after server authorization", async () => {
  const admin=await readFile(new URL("../lib/server/admin.ts",import.meta.url),"utf8");
  const member=await readFile(new URL("../app/api/v1/member/route.ts",import.meta.url),"utf8");
  const navigation=await readFile(new URL("../app/components/member-navigation.tsx",import.meta.url),"utf8");
  assert.match(admin,/ADMIN_EMAILS/);
  assert.match(admin,/getAuthenticatedMember/);
  assert.match(member,/canAccessOperations/);
  assert.match(navigation,/Betriebsübersicht/);
  assert.match(navigation,/\/api\/v1\/member/);
});
