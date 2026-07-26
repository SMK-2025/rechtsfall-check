import { requireApiMember, apiError } from "../../../../lib/server/member";

export async function GET() {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  return Response.json({ member }, { headers: { "cache-control": "no-store" } });
}
