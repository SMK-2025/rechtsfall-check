import { getDb } from "../../db";
import { users } from "../../db/schema";
import { getChatGPTUser } from "../../app/chatgpt-auth";

export type Member = { id: string; email: string; displayName: string };

async function stableUserId(email: string) {
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `usr_${hash.slice(0, 32)}`;
}

export async function requireApiMember(): Promise<Member | null> {
  const identity = await getChatGPTUser();
  if (!identity) return null;
  const id = await stableUserId(identity.email);
  const db = getDb();
  await db.insert(users).values({
    id,
    email: identity.email.trim().toLowerCase(),
    displayName: identity.displayName,
  }).onConflictDoUpdate({
    target: users.email,
    set: { displayName: identity.displayName, updatedAt: new Date().toISOString() },
  });
  return { id, email: identity.email, displayName: identity.displayName };
}

export function apiError(code: string, status: number, message: string) {
  return Response.json(
    { error: { code, message, correlationId: crypto.randomUUID() } },
    { status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } },
  );
}
