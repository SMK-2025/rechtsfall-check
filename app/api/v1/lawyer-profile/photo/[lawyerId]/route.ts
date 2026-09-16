import { del, get, put } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { cases, lawyerMatches, lawyerProfilePhotos } from "@/db/schema";
import { apiError, requireApiMember } from "@/lib/server/member";
import { enforceSameOrigin } from "@/lib/server/request-security";
import { enforceRateLimit } from "@/lib/server/rate-limit";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
function hasValidSignature(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (mime === "image/png") return [137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value);
  return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

export async function GET(_: Request, context: { params: Promise<{ lawyerId: string }> }) {
  const member = await requireApiMember({ allowIncompleteProfile: true });
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const { lawyerId } = await context.params;
  const db = getDb();
  if (member.id !== lawyerId && member.accountRole !== "ADMIN") {
    const [match] = await db.select({ id: lawyerMatches.id }).from(lawyerMatches).innerJoin(cases, eq(cases.id, lawyerMatches.caseId))
      .where(and(eq(lawyerMatches.lawyerId, lawyerId), eq(cases.ownerId, member.id))).limit(1);
    if (!match) return apiError("PHOTO_NOT_AVAILABLE", 404, "Foto nicht verfügbar.");
  }
  const [photo] = await db.select().from(lawyerProfilePhotos).where(eq(lawyerProfilePhotos.userId, lawyerId)).limit(1);
  if (!photo) return apiError("PHOTO_NOT_AVAILABLE", 404, "Foto nicht verfügbar.");
  const blob = await get(photo.objectKey, { access: "private" });
  if (!blob?.stream) return apiError("PHOTO_NOT_AVAILABLE", 404, "Foto nicht verfügbar.");
  return new Response(blob.stream, { headers: { "content-type": photo.mimeType, "cache-control": "private, max-age=300", "x-content-type-options": "nosniff" } });
}

export async function POST(request: Request, context: { params: Promise<{ lawyerId: string }> }) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember({ allowIncompleteProfile: true });
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const { lawyerId } = await context.params;
  if (lawyerId !== member.id || member.accountRole !== "LAWYER") return apiError("FORBIDDEN", 403, "Nicht erlaubt.");
  const limited = await enforceRateLimit({ namespace: "lawyer-photo-upload", identifier: member.id, limit: 10, windowSeconds: 3600 });
  if (limited) return limited;
  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File) || !allowed.has(file.type) || file.size < 1 || file.size > 5_000_000) return apiError("INVALID_PHOTO", 400, "Bitte laden Sie ein JPG-, PNG- oder WebP-Foto mit maximal 5 MB hoch.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidSignature(bytes, file.type)) return apiError("INVALID_PHOTO", 400, "Die Bilddatei ist ungültig.");
  const db = getDb();
  const [previous] = await db.select().from(lawyerProfilePhotos).where(eq(lawyerProfilePhotos.userId, member.id)).limit(1);
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const stored = await put(`lawyer-profile-photos/${member.id}/${crypto.randomUUID()}.${extension}`, file, { access: "private", contentType: file.type, addRandomSuffix: false });
  await db.insert(lawyerProfilePhotos).values({ userId: member.id, objectKey: stored.url, mimeType: file.type, sizeBytes: file.size })
    .onConflictDoUpdate({ target: lawyerProfilePhotos.userId, set: { objectKey: stored.url, mimeType: file.type, sizeBytes: file.size, updatedAt: new Date() } });
  if (previous?.objectKey && previous.objectKey !== stored.url) await del(previous.objectKey).catch(() => undefined);
  return Response.json({ ok: true, photoUrl: `/api/v1/lawyer-profile/photo/${member.id}?v=${Date.now()}` }, { headers: { "cache-control": "no-store" } });
}
