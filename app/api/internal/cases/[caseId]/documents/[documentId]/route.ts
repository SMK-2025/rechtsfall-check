import { get } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import { requireAdmin } from "@/lib/server/admin";
import { writeAudit } from "@/lib/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ caseId: string; documentId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return new Response("Nicht gefunden", { status: 404 });

  const { caseId, documentId } = await params;
  const db = getDb();
  const document = (await db.select().from(documents).where(and(eq(documents.id, documentId), eq(documents.caseId, caseId))).limit(1))[0];
  if (!document) return new Response("Nicht gefunden", { status: 404 });

  const blob = await get(document.objectKey, { access: "private" });
  if (!blob || blob.statusCode !== 200 || !blob.stream) return new Response("Dokument nicht verfügbar", { status: 404 });

  await writeAudit({
    caseId,
    actorId: admin.id,
    eventType: "ADMIN_DOCUMENT_VIEWED",
    targetType: "document",
    targetId: document.id,
  });

  const encodedName = encodeURIComponent(document.originalName);
  return new Response(blob.stream, {
    headers: {
      "Content-Type": document.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
