import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("member features require a complete profile while privacy tools remain accessible", async () => {
  const member = await read("lib/server/member.ts");
  const profile = await read("app/api/v1/profile/route.ts");
  const profilePage = await read("app/profil/profile-form.tsx");
  const caseRoom = await read("app/fallraum/page.tsx");
  const privacyExport = await read("app/api/v1/privacy/export/route.ts");

  for (const field of ["firstName", "lastName", "street", "postalCode", "city", "phone"]) {
    assert.match(member, new RegExp(`"${field}"`));
  }
  assert.match(member, /isMemberProfileComplete/);
  assert.match(member, /allowIncompleteProfile/);
  assert.match(profile, /alle persönlichen Angaben vollständig/);
  assert.match(profilePage, /Bitte vervollständigen Sie zuerst Ihr Profil/);
  assert.match(caseRoom, /required=1/);
  assert.match(privacyExport, /allowIncompleteProfile:\s*true/);
});
