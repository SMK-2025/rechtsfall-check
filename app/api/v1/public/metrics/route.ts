import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { publicPageMetrics } from "@/db/schema";

export const dynamic = "force-dynamic";

const allowedGroups = new Set([
  "startseite", "rechtsfall-check", "ablauf", "rechtsgebiete", "preise", "sicherheit",
  "fragen", "datenschutz", "impressum", "agb", "barrierefreiheit",
]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { pageGroup?: unknown } | null;
  const pageGroup = typeof body?.pageGroup === "string" ? body.pageGroup : "";
  if (!allowedGroups.has(pageGroup)) {
    return Response.json({ error: "Ungültige Seitengruppe." }, { status: 400 });
  }

  const metricDate = new Date().toISOString().slice(0, 10);
  const id = `${metricDate}:${pageGroup}`;
  const db = getDb();
  await db.insert(publicPageMetrics).values({ id, metricDate, pageGroup, views: 1 })
    .onConflictDoUpdate({
      target: publicPageMetrics.id,
      set: { views: sql`${publicPageMetrics.views} + 1`, updatedAt: new Date() },
    });

  return new Response(null, {
    status: 204,
    headers: { "cache-control": "no-store" },
  });
}
