import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, lawyerLegalAreas, lawyerProfiles } from "@/db/schema";
import { isLegalAreaId } from "@/lib/legal-areas";
import { apiError, requireApiMember } from "@/lib/server/member";
import { enforceSameOrigin } from "@/lib/server/request-security";

type Payload = {
  barAssociation?: string;
  officialDirectoryUrl?: string;
  firmName?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  practiceRadiusKm?: number;
  legalAreas?: string[];
  biography?: string;
  websiteUrl?: string;
  publicEmail?: string;
  publicPhone?: string;
};

const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function GET() {
  const member = await requireApiMember({ allowIncompleteProfile: true });
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const db = getDb();
  const [profile, areas] = await Promise.all([
    db.select().from(lawyerProfiles).where(eq(lawyerProfiles.userId, member.id)).limit(1),
    db.select({ legalArea: lawyerLegalAreas.legalArea }).from(lawyerLegalAreas)
      .where(eq(lawyerLegalAreas.lawyerId, member.id)),
  ]);
  return Response.json({ profile: profile[0] ?? null, legalAreas: areas.map(item => item.legalArea) }, {
    headers: { "cache-control": "no-store" },
  });
}

export async function PUT(request: Request) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember({ allowIncompleteProfile: true });
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const body = await request.json().catch(() => null) as Payload | null;
  if (!body) return apiError("INVALID_REQUEST", 400, "Die Angaben konnten nicht gelesen werden.");

  const barAssociation = clean(body.barAssociation, 120);
  const officialDirectoryUrl = clean(body.officialDirectoryUrl, 500);
  const firmName = clean(body.firmName, 180);
  const street = clean(body.street, 180);
  const postalCode = clean(body.postalCode, 12);
  const city = clean(body.city, 120);
  const biography = clean(body.biography, 1200);
  const websiteUrl = clean(body.websiteUrl, 500);
  const publicEmail = clean(body.publicEmail, 180);
  const publicPhone = clean(body.publicPhone, 40);
  const practiceRadiusKm = Number(body.practiceRadiusKm);
  const legalAreas = [...new Set(Array.isArray(body.legalAreas) ? body.legalAreas.filter(isLegalAreaId) : [])];
  if (!barAssociation || !firmName || !street || !postalCode || !city || legalAreas.length === 0) {
    return apiError("LAWYER_PROFILE_INCOMPLETE", 400, "Bitte füllen Sie alle Pflichtangaben aus und wählen Sie mindestens ein Rechtsgebiet.");
  }
  if (!Number.isInteger(practiceRadiusKm) || practiceRadiusKm < 5 || practiceRadiusKm > 250) {
    return apiError("INVALID_PRACTICE_RADIUS", 400, "Der Tätigkeitsradius muss zwischen 5 und 250 Kilometern liegen.");
  }
  if (officialDirectoryUrl) {
    try {
      const url = new URL(officialDirectoryUrl);
      if (url.protocol !== "https:") throw new Error("invalid protocol");
    } catch {
      return apiError("INVALID_DIRECTORY_URL", 400, "Bitte geben Sie einen vollständigen HTTPS-Link zum amtlichen Verzeichniseintrag an.");
    }
  }
  if (websiteUrl) {
    try {
      const url = new URL(websiteUrl);
      if (url.protocol !== "https:") throw new Error("invalid protocol");
    } catch {
      return apiError("INVALID_WEBSITE_URL", 400, "Bitte geben Sie eine vollständige HTTPS-Adresse für die Kanzlei-Website an.");
    }
  }

  const db = getDb();
  const now = new Date();
  await db.transaction(async transaction => {
    await transaction.insert(lawyerProfiles).values({
      userId: member.id, status: "PENDING", barAssociation, officialDirectoryUrl: officialDirectoryUrl || null,
      firmName, street, postalCode, city, biography: biography || null, websiteUrl: websiteUrl || null,
      publicEmail: publicEmail || null, publicPhone: publicPhone || null,
      practiceRadiusKm, acceptsNewMandates: false, updatedAt: now,
    }).onConflictDoUpdate({
      target: lawyerProfiles.userId,
      set: {
        status: "PENDING", barAssociation, officialDirectoryUrl: officialDirectoryUrl || null,
        firmName, street, postalCode, city, biography: biography || null, websiteUrl: websiteUrl || null,
        publicEmail: publicEmail || null, publicPhone: publicPhone || null,
        practiceRadiusKm, acceptsNewMandates: false,
        verificationNote: null, verifiedBy: null, verifiedAt: null, latitudeE6: null, longitudeE6: null, updatedAt: now,
      },
    });
    await transaction.delete(lawyerLegalAreas).where(eq(lawyerLegalAreas.lawyerId, member.id));
    await transaction.insert(lawyerLegalAreas).values(legalAreas.map(legalArea => ({
      id: crypto.randomUUID(), lawyerId: member.id, legalArea,
    })));
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: member.id, eventType: "LAWYER_PROFILE_SUBMITTED",
      targetType: "LAWYER_PROFILE", targetId: member.id,
      metadataJson: { legalAreas, practiceRadiusKm, status: "PENDING" },
    });
  });
  return Response.json({ ok: true, status: "PENDING" }, { headers: { "cache-control": "no-store" } });
}
