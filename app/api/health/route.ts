import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET() {
  const startedAt = Date.now();
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({
      status: "ok",
      service: "rechtsfall-check",
      database: "reachable",
      responseTimeMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    }, {
      status: 200,
      headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
    });
  } catch {
    return Response.json({
      status: "unavailable",
      service: "rechtsfall-check",
      database: "unreachable",
      checkedAt: new Date().toISOString(),
    }, {
      status: 503,
      headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
    });
  }
}

