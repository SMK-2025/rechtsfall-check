import { createHash, createPublicKey, createVerify } from "node:crypto";
import { getDb } from "@/db";
import { emailDeliveryEvents } from "@/db/schema";

export const runtime = "nodejs";

const trackedEvents = new Set([
  "processed", "delivered", "deferred", "bounce", "dropped", "open", "click",
  "spamreport", "unsubscribe", "group_unsubscribe", "group_resubscribe",
]);

type SendGridEvent = Record<string, unknown> & {
  event?: string;
  timestamp?: number;
  sg_event_id?: string;
  sg_message_id?: string;
  case_id?: string;
  email_kind?: string;
  url?: string;
  reason?: string;
  response?: string;
};

function publicKey(value: string) {
  const normalized = value.replace(/\\n/g, "\n").trim();
  if (normalized.includes("BEGIN PUBLIC KEY")) return createPublicKey(normalized);
  return createPublicKey({ key: Buffer.from(normalized, "base64"), format: "der", type: "spki" });
}

function isValidSignature(rawBody: string, timestamp: string, signature: string, key: string) {
  try {
    const verifier = createVerify("sha256");
    verifier.update(timestamp);
    verifier.update(rawBody);
    verifier.end();
    return verifier.verify(publicKey(key), Buffer.from(signature, "base64"));
  } catch {
    return false;
  }
}

function eventId(event: SendGridEvent, index: number, rawBody: string) {
  return event.sg_event_id || createHash("sha256")
    .update(`${rawBody}:${index}:${String(event.event || "unknown")}`)
    .digest("hex");
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const key = process.env.SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY;
  const signature = request.headers.get("x-twilio-email-event-webhook-signature") || "";
  const timestamp = request.headers.get("x-twilio-email-event-webhook-timestamp") || "";

  if (!key || !signature || !timestamp || !isValidSignature(rawBody, timestamp, signature, key)) {
    return new Response(null, { status: 401, headers: { "cache-control": "no-store" } });
  }

  let events: SendGridEvent[];
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!Array.isArray(parsed)) throw new Error("Invalid payload");
    events = parsed.slice(0, 1000) as SendGridEvent[];
  } catch {
    return new Response(null, { status: 400, headers: { "cache-control": "no-store" } });
  }

  const rows = events.flatMap((event, index) => {
    const eventType = typeof event.event === "string" ? event.event : "";
    if (!trackedEvents.has(eventType)) return [];
    const seconds = typeof event.timestamp === "number" ? event.timestamp : Math.floor(Date.now() / 1000);
    const caseId = typeof event.case_id === "string" && event.case_id.length <= 100 ? event.case_id : null;
    return [{
      id: crypto.randomUUID(),
      providerEventId: eventId(event, index, rawBody),
      providerMessageId: typeof event.sg_message_id === "string" ? event.sg_message_id.slice(0, 500) : null,
      caseId,
      emailKind: typeof event.email_kind === "string" ? event.email_kind.slice(0, 100) : null,
      eventType,
      eventAt: new Date(seconds * 1000),
      url: typeof event.url === "string" ? event.url.slice(0, 2000) : null,
      reason: typeof event.reason === "string" ? event.reason.slice(0, 1000) : null,
      response: typeof event.response === "string" ? event.response.slice(0, 1000) : null,
      metadataJson: {},
    }];
  });

  if (rows.length) await getDb().insert(emailDeliveryEvents).values(rows).onConflictDoNothing();
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
