export const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

const allowedAudioTypes = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/x-m4a",
]);

export function isAllowedAudioType(type: string) {
  return allowedAudioTypes.has(type.toLowerCase().split(";")[0].trim());
}

export function transcriptionModel() {
  return process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-transcribe";
}
