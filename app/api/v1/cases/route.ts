import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { cases } from "../../../../db/schema";
import { writeAudit } from "../../../../lib/server/audit";
import { requireApiMember, apiError } from "../../../../lib/server/member";

export async function GET() {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const rows = await getDb().select({
    id: cases.id, title: cases.title, legalArea: cases.legalArea, status: cases.status, paymentStatus: cases.paymentStatus,
    createdAt: cases.createdAt, updatedAt: cases.updatedAt,
  }).from(cases).where(eq(cases.ownerId, member.id)).orderBy(desc(cases.updatedAt)).limit(100);
  return Response.json({ cases: rows.filter((row) => row.status !== "DELETED") }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    return apiError("UNSUPPORTED_MEDIA_TYPE", 415, "JSON erwartet.");
  }
  const body = await request.json() as { title?: string; legalArea?: string };
  const title = body.title?.trim();
  if (!title || title.length > 160) return apiError("INVALID_TITLE", 400, "Ein Titel mit maximal 160 Zeichen ist erforderlich.");
  const legalArea = body.legalArea ?? "consumer_purchase_dummy";
  if (legalArea !== "consumer_purchase_dummy") return apiError("LEGAL_AREA_NOT_ENABLED", 422, "Dieses Rechtsgebiet ist derzeit noch nicht verfügbar.");
  const now = new Date();
  const id = crypto.randomUUID();
  await getDb().insert(cases).values({
    id, ownerId: member.id, legalArea, status: "DRAFT", title,
    retentionUntil: new Date(Date.now() + 30 * 86_400_000), createdAt: now, updatedAt: now,
  });
  await writeAudit({ caseId: id, actorId: member.id, eventType: "CASE_CREATED", targetType: "case", targetId: id });
  return Response.json({ case: { id, title, legalArea, status: "DRAFT", paymentStatus: "UNPAID", createdAt: now, updatedAt: now } }, { status: 201, headers: { "cache-control": "no-store" } });
}
