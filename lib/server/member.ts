import { headers } from "next/headers";
import { getDb } from "../../db";
import { users } from "../../db/schema";
import { auth, isAuthConfigured } from "../auth";

export type Member = { id: string; email: string; displayName: string };
async function stableUserId(email: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.trim().toLowerCase()));
  return `usr_${Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32)}`;
}
export async function getAuthenticatedMember(): Promise<Member | null> {
  if (!isAuthConfigured) return null;
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user.email?.trim().toLowerCase();
  if (!email) return null;
  const id = session?.user.id || await stableUserId(email);
  const displayName = session?.user.name || email;
  await getDb().insert(users).values({ id, email, displayName }).onConflictDoUpdate({
    target: users.email, set: { displayName, updatedAt: new Date() },
  });
  return { id, email, displayName };
}
export async function requireApiMember() { return getAuthenticatedMember(); }
export function apiError(code: string, status: number, message: string) {
  return Response.json({ error: { code, message, correlationId: crypto.randomUUID() } }, {
    status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
