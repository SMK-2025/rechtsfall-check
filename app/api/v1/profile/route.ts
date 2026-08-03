import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { auditEvents, users } from "../../../../db/schema";
import { apiError, requireApiMember } from "../../../../lib/server/member";
import { enforceSameOrigin } from "../../../../lib/server/request-security";

type ProfilePayload = {
  firstName?: string;
  lastName?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
};

const clean = (value: string | undefined, max: number) => value?.trim().slice(0, max) || null;

export async function GET() {
  const member = await requireApiMember({ allowIncompleteProfile: true });
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  return Response.json({ profile: member }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember({ allowIncompleteProfile: true });
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");

  const body = await request.json() as ProfilePayload;
  const firstName = clean(body.firstName, 80);
  const lastName = clean(body.lastName, 80);
  const street = clean(body.street, 160);
  const postalCode = clean(body.postalCode, 12);
  const city = clean(body.city, 100);
  const phone = clean(body.phone, 40);
  if (!firstName || !lastName || !street || !postalCode || !city || !phone) {
    return apiError("INVALID_PROFILE", 400, "Bitte füllen Sie alle persönlichen Angaben vollständig aus.");
  }

  const profile = {
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
    street,
    postalCode,
    city,
    phone,
    updatedAt: new Date(),
  };
  const db = getDb();
  await db.transaction(async transaction => {
    await transaction.update(users).set(profile).where(eq(users.id, member.id));
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(),
      actorId: member.id,
      eventType: "PROFILE_UPDATED",
      targetType: "USER",
      targetId: member.id,
      metadataJson: { fields: ["firstName", "lastName", "street", "postalCode", "city", "phone"] },
    });
  });

  return Response.json({ profile: { ...profile, email: member.email } }, {
    headers: { "cache-control": "no-store" },
  });
}
