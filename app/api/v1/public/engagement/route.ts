import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { publicEngagementMetrics } from "@/db/schema";

export const dynamic = "force-dynamic";

const allowedGroups = new Set([
  "gesamt", "startseite", "rechtsfall-check", "ablauf", "rechtsgebiete", "preise", "sicherheit",
  "fragen", "datenschutz", "impressum", "agb", "barrierefreiheit", "funnel",
]);
const allowedEvents = new Set(["session", "page_visit", "scroll", "read_time", "cta", "funnel"]);
const allowedScrollKeys = new Set(["25", "50", "75", "100"]);
const allowedCtaKeys = new Set([
  "konto-starten", "login", "rechtsfall-check", "ablauf", "rechtsgebiete", "preise", "fragen", "sicherheit",
]);
const allowedFunnelKeys = new Set([
  "sign_up", "complete_registration", "login", "case_created", "document_upload", "begin_checkout", "purchase",
  "analysis_started", "follow_up_answered", "case_submitted", "report_ready", "support_ticket_created", "review_submitted",
]);

const dimension = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || fallback;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const eventType = dimension(body?.eventType, "");
  const pageGroup = dimension(body?.pageGroup, "");
  const eventKey = dimension(body?.eventKey, "");
  if (!allowedEvents.has(eventType) || !allowedGroups.has(pageGroup)) {
    return Response.json({ error: "Ungültiges Statistikereignis." }, { status: 400 });
  }
  if (eventType === "scroll" && !allowedScrollKeys.has(eventKey)) return Response.json({ error: "Ungültige Scrollstufe." }, { status: 400 });
  if (eventType === "read_time" && eventKey !== "active-seconds") return Response.json({ error: "Ungültige Lesezeit." }, { status: 400 });
  if (eventType === "cta" && !allowedCtaKeys.has(eventKey)) return Response.json({ error: "Ungültige Interaktion." }, { status: 400 });
  if (eventType === "funnel" && !allowedFunnelKeys.has(eventKey)) return Response.json({ error: "Ungültiger Prozessstatus." }, { status: 400 });
  if (eventType === "session" && (eventKey !== "visit" || pageGroup !== "gesamt")) return Response.json({ error: "Ungültiger Besuch." }, { status: 400 });
  if (eventType === "page_visit" && eventKey !== "visit") return Response.json({ error: "Ungültiger Seitenbesuch." }, { status: 400 });

  const source = dimension(body?.metaClick === true ? "meta" : body?.source, "direct");
  const medium = dimension(body?.medium, source === "meta" ? "paid-social" : "none");
  const campaign = dimension(body?.campaign, "none");
  const value = eventType === "read_time" ? Math.max(1, Math.min(1800, Math.round(Number(body?.value) || 0))) : 0;
  const metricDate = new Date().toISOString().slice(0, 10);
  const id = createHash("sha256").update([metricDate, pageGroup, eventType, eventKey, source, medium, campaign].join("|")).digest("hex");
  const db = getDb();
  await db.insert(publicEngagementMetrics).values({
    id, metricDate, pageGroup, eventType, eventKey, source, medium, campaign, count: 1, totalValue: value,
  }).onConflictDoUpdate({
    target: publicEngagementMetrics.id,
    set: {
      count: sql`${publicEngagementMetrics.count} + 1`,
      totalValue: sql`${publicEngagementMetrics.totalValue} + ${value}`,
      updatedAt: new Date(),
    },
  });

  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
