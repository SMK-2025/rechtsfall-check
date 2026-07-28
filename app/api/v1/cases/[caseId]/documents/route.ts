import { put } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { documents } from "../../../../../../db/schema";
import { ownedCase } from "../../../../../../lib/server/case-access";
import { writeAudit } from "../../../../../../lib/server/audit";
import { requireApiMember, apiError } from "../../../../../../lib/server/member";
import { scanUploadedFile } from "../../../../../../lib/services/malware-scanner";
import { enforceRateLimit } from "../../../../../../lib/server/rate-limit";
import { enforceSameOrigin } from "../../../../../../lib/server/request-security";

type Params = { params: Promise<{ caseId: string }> };
const allowed = new Set(["application/pdf", "image/jpeg", "image/png"]);
const maxBytes = 4 * 1024 * 1024;
export const maxDuration = 60;

function validSignature(bytes: Uint8Array, mime: string) {
  if (mime === "application/pdf") return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  if (mime === "image/png") return bytes.slice(0, 8).every((value, index) => value === [137,80,78,71,13,10,26,10][index]);
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  return false;
}

export async function POST(request: Request, { params }: Params) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const limited = await enforceRateLimit({ namespace: "document-upload", identifier: member.id, limit: 30, windowSeconds: 600 });
  if (limited) return limited;
  const { caseId } = await params;
  const item = await ownedCase(caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  if (item.status === "ASSESSMENT_READY" || item.status === "ESCALATED") {
    return apiError("CASE_FINALIZED", 409, "Dieser Rechtsfall-Check wurde final eingereicht. Unterlagen können nicht mehr geändert werden.");
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return apiError("FILE_REQUIRED", 400, "Eine Datei ist erforderlich.");
  if (!allowed.has(file.type) || file.size < 1 || file.size > maxBytes) return apiError("INVALID_FILE", 422, "Nur PDF, JPG oder PNG bis 4 MB sind erlaubt.");
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (!validSignature(bytes, file.type)) return apiError("FILE_SIGNATURE_MISMATCH", 422, "Dateiinhalt und Dateityp stimmen nicht überein.");
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const sha256 = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const [existing] = await getDb().select().from(documents)
    .where(and(eq(documents.caseId, caseId), eq(documents.sha256, sha256))).limit(1);
  if (existing) {
    return Response.json({
      document: {
        id: existing.id, originalName: existing.originalName, mimeType: existing.mimeType,
        sizeBytes: existing.sizeBytes, scanStatus: existing.scanStatus, extractionStatus: existing.extractionStatus,
      },
      duplicate: true,
    }, { status: 200, headers: { "cache-control": "no-store" } });
  }
  let scan: Awaited<ReturnType<typeof scanUploadedFile>>;
  try {
    scan = await scanUploadedFile(buffer, file.type, sha256);
  } catch (error) {
    const code = error instanceof Error ? error.message : "MALWARE_SCAN_FAILED";
    const message = code === "MALWARE_DETECTED"
      ? "Die Datei wurde aus Sicherheitsgründen abgewiesen."
      : "Die Sicherheitsprüfung der Datei ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.";
    await writeAudit({ caseId, actorId: member.id, eventType: code, targetType: "document", metadata: { mimeType: file.type, sizeBytes: file.size, sha256 } });
    return apiError(code, code === "MALWARE_DETECTED" ? 422 : 503, message);
  }
  const id = crypto.randomUUID();
  const objectKey = `quarantine/${member.id}/${caseId}/${id}`;
  const blob = await put(objectKey, buffer, { access: "private", contentType: file.type, addRandomSuffix: false });
  await getDb().insert(documents).values({
    id, caseId, objectKey: blob.url, originalName: file.name.slice(0, 240), mimeType: file.type,
    sizeBytes: file.size, sha256, scanStatus: scan.status, extractionStatus: "PENDING",
  });
  await writeAudit({ caseId, actorId: member.id, eventType: scan.status === "CLEAN" ? "DOCUMENT_MALWARE_SCAN_CLEAN" : "DOCUMENT_SIGNATURE_VALIDATED", targetType: "document", targetId: id, metadata: { mimeType: file.type, sizeBytes: file.size, malwareScannerConfigured: scan.status === "CLEAN" } });
  return Response.json({ document: { id, originalName: file.name, mimeType: file.type, sizeBytes: file.size, scanStatus: scan.status, extractionStatus: "PENDING" } }, { status: 201, headers: { "cache-control": "no-store" } });
}
