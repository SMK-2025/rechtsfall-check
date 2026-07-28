import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents } from "@/db/schema";
import { reportOperationalIssue } from "@/lib/server/operational-monitor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type CheckResult = {
  component: string;
  status: "ok" | "failed";
  responseTimeMs?: number;
  code?: string;
};

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

async function checkDatabase(): Promise<CheckResult> {
  const startedAt = Date.now();
  try {
    await getDb().execute(sql`select 1`);
    return { component: "database", status: "ok", responseTimeMs: Date.now() - startedAt };
  } catch {
    return { component: "database", status: "failed", code: "DAILY_DATABASE_CHECK_FAILED" };
  }
}

async function checkMalwareScanner(): Promise<CheckResult> {
  const endpoint = process.env.MALWARE_SCANNER_ENDPOINT;
  if (!endpoint) return { component: "malware-scanner", status: "failed", code: "MALWARE_SCANNER_ENDPOINT_MISSING" };
  const healthUrl = endpoint.replace(/\/scan\/?$/, "/health");
  const startedAt = Date.now();
  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error("unhealthy");
    return { component: "malware-scanner", status: "ok", responseTimeMs: Date.now() - startedAt };
  } catch {
    return { component: "malware-scanner", status: "failed", code: "DAILY_MALWARE_SCANNER_CHECK_FAILED" };
  }
}

function checkConfiguration(): CheckResult[] {
  const required = [
    "BETTER_AUTH_SECRET", "DATABASE_URL", "BLOB_READ_WRITE_TOKEN",
    "OPENAI_API_KEY", "SENDGRID_API_KEY", "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET", "MALWARE_SCANNER_API_KEY", "CRON_SECRET",
  ] as const;
  const missing = required.filter(name => !process.env[name]);
  const results: CheckResult[] = missing.map(name => ({
    component: "configuration",
    status: "failed",
    code: `CONFIG_${name}_MISSING`,
  }));
  if (process.env.REQUIRE_MALWARE_SCAN !== "true") {
    results.push({
      component: "configuration",
      status: "failed",
      code: "PRODUCTION_MALWARE_FAIL_CLOSED_DISABLED",
    });
  }
  return results.length ? results : [{ component: "configuration", status: "ok" }];
}

async function monitor(request: Request) {
  if (!authorized(request)) {
    return new Response(null, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const checkedAt = new Date();
  const results = [await checkDatabase(), await checkMalwareScanner(), ...checkConfiguration()];
  const failures = results.filter(result => result.status === "failed");

  for (const failure of failures) {
    await reportOperationalIssue({
      code: failure.code || "DAILY_SYSTEM_CHECK_FAILED",
      component: failure.component === "database"
        ? "database"
        : failure.component === "malware-scanner" ? "malware-scanner" : "system",
      severity: failure.component === "database" ? "critical" : "high",
      metadata: { dailyCheck: true },
    });
  }

  if (!failures.length) {
    try {
      await getDb().insert(auditEvents).values({
        id: crypto.randomUUID(),
        eventType: "DAILY_SYSTEM_CHECK_PASSED",
        targetType: "system",
        metadataJson: {
          checkedAt: checkedAt.toISOString(),
          databaseResponseTimeMs: results.find(item => item.component === "database")?.responseTimeMs || 0,
          scannerResponseTimeMs: results.find(item => item.component === "malware-scanner")?.responseTimeMs || 0,
        },
      });
    } catch {
      await reportOperationalIssue({
        code: "DAILY_SYSTEM_CHECK_AUDIT_FAILED",
        component: "database",
        severity: "critical",
        metadata: { dailyCheck: true },
      });
    }
  }

  return Response.json({
    status: failures.length ? "degraded" : "ok",
    checkedAt: checkedAt.toISOString(),
    checks: results,
  }, {
    status: failures.length ? 503 : 200,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

export const GET = monitor;
export const POST = monitor;

