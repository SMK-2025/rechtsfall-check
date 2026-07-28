import { getAuthenticatedMember } from "@/lib/server/member";

export function isAdminEmail(email: string) {
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export async function requireAdmin() {
  const member = await getAuthenticatedMember();
  if (!member) return null;
  return isAdminEmail(member.email) ? member : null;
}
