import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { cases } from "@/db/schema";
import { isAllowedAudioType, MAX_AUDIO_BYTES, transcriptionModel } from "@/lib/audio";
import { writeAudit } from "@/lib/server/audit";
import { apiError, requireApiMember } from "@/lib/server/member";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const member = await requireApiMember();
  if (!member) return apiError("UNAUTHORIZED", 401, "Bitte melden Sie sich erneut an.");
  if (!process.env.OPENAI_API_KEY) return apiError("TRANSCRIPTION_UNAVAILABLE", 503, "Die Spracheingabe ist derzeit nicht verfügbar.");

  const input = await request.formData();
  const caseId = String(input.get("caseId") || "");
  const field = String(input.get("field") || "unknown").slice(0, 80);
  const aiConsent = input.get("aiConsent") === "true";
  const file = input.get("file");
  if (!aiConsent) return apiError("AI_CONSENT_REQUIRED", 422, "Bitte stimmen Sie zuerst der KI-Verarbeitung zu.");
  if (!(file instanceof File)) return apiError("AUDIO_REQUIRED", 400, "Es wurde keine Audioaufnahme übertragen.");
  if (file.size < 1 || file.size > MAX_AUDIO_BYTES) return apiError("AUDIO_SIZE_INVALID", 413, "Die Audioaufnahme darf maximal 4 MB groß sein.");
  if (!isAllowedAudioType(file.type)) return apiError("AUDIO_TYPE_INVALID", 415, "Dieses Audioformat wird nicht unterstützt.");

  const [ownedCase] = await getDb().select({ id: cases.id }).from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.ownerId, member.id))).limit(1);
  if (!ownedCase) return apiError("CASE_NOT_FOUND", 404, "Die Fallakte wurde nicht gefunden.");

  const upstream = new FormData();
  upstream.set("file", file, "spracheingabe");
  upstream.set("model", transcriptionModel());
  upstream.set("language", "de");
  upstream.set("response_format", "json");
  upstream.set("prompt", "Transkribiere die deutsche Fallschilderung originalgetreu. Bewahre Namen, Daten, Beträge und Abkürzungen. Ergänze keine rechtliche Bewertung.");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: upstream,
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    await writeAudit({ caseId, actorId: member.id, eventType: "AUDIO_TRANSCRIPTION_FAILED", targetType: "case", targetId: caseId, metadata: { field, status: response.status } });
    return apiError("TRANSCRIPTION_FAILED", 502, "Die Spracheingabe konnte nicht verarbeitet werden. Sie können jederzeit weiterschreiben.");
  }
  const result = await response.json() as { text?: string };
  if (!result.text?.trim()) return apiError("TRANSCRIPTION_EMPTY", 422, "Es wurde keine verständliche Sprache erkannt.");

  await writeAudit({
    caseId, actorId: member.id, eventType: "AUDIO_TRANSCRIPTION_CREATED",
    targetType: "case", targetId: caseId,
    metadata: { field, sizeBytes: file.size, mimeType: file.type.slice(0, 80) },
  });
  return Response.json({ text: result.text.trim() }, {
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
