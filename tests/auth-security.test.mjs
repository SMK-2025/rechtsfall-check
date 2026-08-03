import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("email verification never creates a session and redirects to login", async () => {
  const server = await read("lib/auth.ts");
  const form = await read("app/anmelden/auth-form.tsx");
  assert.match(server, /autoSignIn:\s*false/);
  assert.match(server, /autoSignInAfterVerification:\s*false/);
  assert.match(form, /callbackURL:\s*"\/anmelden\?verified=1"/);
});

test("two-factor authentication includes TOTP, backup codes and account lockout", async () => {
  const server = await read("lib/auth.ts");
  const client = await read("lib/auth-client.ts");
  const schema = await read("db/schema.ts");
  const challenge = await read("app/zwei-faktor/two-factor-challenge.tsx");
  assert.match(server, /twoFactor\(\{/);
  assert.match(server, /maxFailedAttempts:\s*5/);
  assert.match(client, /twoFactorPage:\s*"\/zwei-faktor"/);
  assert.match(schema, /authTwoFactors/);
  assert.match(schema, /twoFactorEnabled/);
  assert.match(challenge, /verifyTotp/);
  assert.match(challenge, /verifyBackupCode/);
});
