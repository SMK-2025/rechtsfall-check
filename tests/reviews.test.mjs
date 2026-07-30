import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("reviews require verified usage, consent and moderation", async () => {
  const collection = await readFile(new URL("../app/api/v1/reviews/route.ts", import.meta.url), "utf8");
  const moderation = await readFile(new URL("../app/api/v1/reviews/[reviewId]/route.ts", import.meta.url), "utf8");
  assert.match(collection, /publicationConsent !== true/);
  assert.match(collection, /eq\(payments\.status, "PAID"\)/);
  assert.match(collection, /eq\(supportTickets\.ownerId, member\.id\)/);
  assert.match(collection, /status: "PENDING"/);
  assert.match(moderation, /isAdminEmail/);
  assert.match(moderation, /status === "PUBLISHED"/);
  assert.match(moderation, /export async function DELETE/);
});

test("only approved reviews are public and review data is covered by privacy handling", async () => {
  const homepage = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const privacy = await readFile(new URL("../app/api/v1/privacy/export/route.ts", import.meta.url), "utf8");
  const policy = await readFile(new URL("../app/datenschutz/page.tsx", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(homepage, /eq\(reviews\.status,\s*"PUBLISHED"\)/);
  assert.match(homepage, /Verifizierte Bewertung/);
  assert.match(privacy, /reviews: reviewRows/);
  assert.match(policy, /Nutzerbewertungen und Veröffentlichung/);
  assert.match(schema, /reviews_owner_type_uq/);
  assert.match(schema, /onDelete: "cascade"/);
});
