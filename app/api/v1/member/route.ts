import { requireApiMember, apiError } from "../../../../lib/server/member";
import { isAdminEmail } from "../../../../lib/server/admin";

export async function GET() {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  return Response.json({
    member: {
      ...member,
      role: isAdminEmail(member.email) ? "ADMIN" : "MEMBER",
      canAccessOperations: isAdminEmail(member.email),
    },
  }, { headers: { "cache-control": "no-store" } });
}
