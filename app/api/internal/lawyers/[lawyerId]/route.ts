import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, lawyerProfiles, lawyerSubscriptions, users } from "@/db/schema";
import { requireAdmin } from "@/lib/server/admin";
import { apiError } from "@/lib/server/member";
import { enforceSameOrigin } from "@/lib/server/request-security";

type Payload = { status?: "VERIFIED" | "REJECTED"; latitude?: number; longitude?: number; verificationNote?: string };

export async function PATCH(request: Request, context: { params: Promise<{ lawyerId: string }> }) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const admin = await requireAdmin();
  if (!admin) return apiError("ADMIN_REQUIRED", 403, "Keine Berechtigung.");
  const { lawyerId } = await context.params;
  const body = await request.json().catch(() => null) as Payload | null;
  if (!body || !["VERIFIED", "REJECTED"].includes(body.status || "")) return apiError("INVALID_STATUS", 400, "Bitte wählen Sie einen gültigen Prüfstatus.");
  const note = typeof body.verificationNote === "string" ? body.verificationNote.trim().slice(0, 1000) : "";
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  if (body.status === "VERIFIED" && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    return apiError("INVALID_COORDINATES", 400, "Für die Freigabe werden gültige Koordinaten des Kanzleisitzes benötigt.");
  }
  if (body.status === "REJECTED" && !note) return apiError("NOTE_REQUIRED", 400, "Bitte dokumentieren Sie den Grund der Rückfrage oder Ablehnung.");

  const db = getDb();
  const [profile] = await db.select().from(lawyerProfiles).where(eq(lawyerProfiles.userId, lawyerId)).limit(1);
  if (!profile) return apiError("LAWYER_NOT_FOUND", 404, "Das Kanzleiprofil wurde nicht gefunden.");
  const [activeSubscription] = await db.select({ id: lawyerSubscriptions.id }).from(lawyerSubscriptions).where(and(
    eq(lawyerSubscriptions.lawyerId, lawyerId), inArray(lawyerSubscriptions.status, ["ACTIVE", "CANCELS_AT_TERM_END"]),
  )).limit(1);
  const now = new Date();
  const verified = body.status === "VERIFIED";
  await db.transaction(async transaction => {
    await transaction.update(lawyerProfiles).set({
      status: body.status!, verificationNote: note || null,
      latitudeE6: verified ? Math.round(latitude * 1_000_000) : null,
      longitudeE6: verified ? Math.round(longitude * 1_000_000) : null,
      verifiedBy: verified ? admin.id : null, verifiedAt: verified ? now : null,
      acceptsNewMandates: verified && Boolean(activeSubscription), updatedAt: now,
    }).where(eq(lawyerProfiles.userId, lawyerId));
    await transaction.update(users).set({
      accountRole: verified && activeSubscription ? "LAWYER" : "MEMBER", updatedAt: now,
    }).where(eq(users.id, lawyerId));
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: admin.id, eventType: verified ? "LAWYER_PROFILE_VERIFIED" : "LAWYER_PROFILE_REJECTED",
      targetType: "LAWYER_PROFILE", targetId: lawyerId,
      metadataJson: { note: note || null, locationConfirmed: verified },
    });
  });
  return Response.json({ ok: true, status: body.status }, { headers: { "cache-control": "no-store" } });
}
