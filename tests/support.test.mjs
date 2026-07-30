import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("support is account-bound and excludes legal advice", async () => {
  const support = await readFile(new URL("../lib/support.ts", import.meta.url), "utf8");
  const collection = await readFile(new URL("../app/api/v1/support/route.ts", import.meta.url), "utf8");
  const ticket = await readFile(new URL("../app/api/v1/support/[ticketId]/route.ts", import.meta.url), "utf8");
  assert.match(support, /keine rechtlichen Fragen/);
  assert.match(support, /bewertet keine Erfolgsaussichten/);
  assert.match(collection, /eq\(supportTickets\.ownerId, member\.id\)/);
  assert.match(ticket, /accessibleTicket/);
  assert.match(ticket, /isAdminEmail/);
  assert.match(collection, /enforceSameOrigin/);
  assert.match(ticket, /enforceSameOrigin/);
});

test("support data is included in privacy handling", async () => {
  const privacy = await readFile(new URL("../app/api/v1/privacy/export/route.ts", import.meta.url), "utf8");
  const policy = await readFile(new URL("../app/datenschutz/page.tsx", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(privacy, /supportTickets/);
  assert.match(privacy, /supportMessages/);
  assert.match(policy, /Support-Tickets und Nachrichten/);
  assert.match(schema, /onDelete: "cascade"/);
});
