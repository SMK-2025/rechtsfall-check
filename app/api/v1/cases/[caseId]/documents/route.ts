import { put } from "@vercel/blob";
import { getDb } from "../../../../../../db";
import { documents } from "../../../../../../db/schema";
import { ownedCase } from "../../../../../../lib/server/case-access";
import { writeAudit } from "../../../../../../lib/server/audit";
import { requireApiMember, apiError } from "../../../../../../lib/server/member";

type Params = { params: Promise<{ caseId: string }> };
const allowed = new Set(["application/pdf", "image/jpeg", "image/png"]);
const maxBytes = 10 * 1024 * 1024;

function validSignature(bytes: Uint8Array, mime: string) {
  if (mime === "application/pdf") return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  if (mime === "image/png") return bytes.slice(0, 8).every((value, index) => value === [137,80,78,71,13,10,26,10][index]);
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  return false;
}

export async function POST(request: Request, { params }: Params) {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const { caseId } = await params;
  const item = await ownedCase(caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return apiError("FILE_REQUIRED", 400, "Eine Datei ist erforderlich.");
  if (!allowed.has(file.type) || file.size < 1 || file.size > maxBytes) return apiError("INVALID_FILE", 422, "Nur PDF, JPG oder PNG bis 10 MB sind erlaubt.");
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (!validSignature(bytes, file.type)) return apiError("FILE_SIGNATURE_MISMATCH", 422, "Dateiinhalt und Dateityp stimmen nicht überein.");
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const sha256 = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const id = crypto.randomUUID();
  const objectKey = `quarantine/${member.id}/${caseId}/${id}`;
  const blob = await put(objectKey, buffer, { access: "private", contentType: file.type, addRandomSuffix: false });
  await getDb().insert(documents).values({
    id, caseId, objectKey: blob.url, originalName: file.name.slice(0, 240), mimeType: file.type,
    sizeBytes: file.size, sha256, scanStatus: "QUARANTINED", extractionStatus: "BLOCKED_UNTIL_SCAN",
  });
  await writeAudit({ caseId, actorId: member.id, eventType: "DOCUMENT_QUARANTINED", targetType: "document", targetId: id, metadata: { mimeType: file.type, sizeBytes: file.size } });
  return Response.json({ document: { id, originalName: file.name, mimeType: file.type, sizeBytes: file.size, scanStatus: "QUARANTINED", extractionStatus: "BLOCKED_UNTIL_SCAN" } }, { status: 201, headers: { "cache-control": "no-store" } });
}
