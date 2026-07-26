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
  assert.match(uploadRoute,/BLOCKED_UNTIL_SCAN/);
  assert.match(uploadRoute,/put\(objectKey, buffer, \{ access: "private"/);
});

test("public discovery files and protected member routes are separated", async () => {
  const robots=await readFile(new URL("../app/robots.ts",import.meta.url),"utf8");
  const homepage=await readFile(new URL("../app/page.tsx",import.meta.url),"utf8");
  assert.match(robots,/disallow: \[\"\/fallraum\", \"\/api\/\"\]/);
  assert.match(homepage,/application\/ld\+json/);
  assert.match(homepage,/FAQPage/);
});
