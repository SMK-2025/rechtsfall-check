import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { authUsers, users } from "../../db/schema";
import { auth, isAuthConfigured } from "../auth";

export type Member = {
  id: string;
  email: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  phone: string | null;
  deletionRequestedAt: Date | null;
  deletionScheduledFor: Date | null;
  twoFactorEnabled: boolean;
};
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
  const db = getDb();
  const [authUser] = await db.select({ twoFactorEnabled: authUsers.twoFactorEnabled })
    .from(authUsers).where(eq(authUsers.id, id)).limit(1);
  const twoFactorEnabled = Boolean(authUser?.twoFactorEnabled);
  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (existing) {
    await db.update(users).set({ email, updatedAt: new Date() }).where(eq(users.id, id));
    return { ...existing, email, displayName: existing.displayName || displayName, twoFactorEnabled };
  }
  const [created] = await db.insert(users).values({ id, email, displayName }).returning();
  return { ...created, displayName: created.displayName || displayName, twoFactorEnabled };
}
const requiredProfileFields: Array<keyof Pick<Member, "firstName" | "lastName" | "street" | "postalCode" | "city" | "phone">> = [
  "firstName", "lastName", "street", "postalCode", "city", "phone",
];
function isProfileGateExempt(email: string) {
  return (process.env.ADMIN_EMAILS || "").split(",")
    .some(value => value.trim().toLowerCase() === email.trim().toLowerCase());
}

export function missingProfileFields(member: Member) {
  return requiredProfileFields.filter(field => !member[field]?.trim());
}

export function isMemberProfileComplete(member: Member) {
  return missingProfileFields(member).length === 0;
}

export async function requireApiMember(options: { allowIncompleteProfile?: boolean } = {}) {
  const member = await getAuthenticatedMember();
  if (!member) return null;
  if (!options.allowIncompleteProfile && !isProfileGateExempt(member.email) && !isMemberProfileComplete(member)) return null;
  return member;
}

export function profileCompletionApiError(member: Member) {
  if (isProfileGateExempt(member.email) || isMemberProfileComplete(member)) return null;
  return apiError(
    "PROFILE_INCOMPLETE",
    409,
    "Bitte vervollständigen Sie zuerst Ihr Profil unter „Mein Konto“.",
  );
}
export function apiError(code: string, status: number, message: string) {
  return Response.json({ error: { code, message, correlationId: crypto.randomUUID() } }, {
    status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
