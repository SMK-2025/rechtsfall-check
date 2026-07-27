import { getAuthenticatedMember } from "@/lib/server/member";

export async function requireAdmin() {
  const member = await getAuthenticatedMember();
  if (!member) return null;
  const allowed = (process.env.ADMIN_EMAILS || "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(member.email.toLowerCase()) ? member : null;
}
