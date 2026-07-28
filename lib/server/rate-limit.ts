import { sql } from "drizzle-orm";
import { getDb } from "../../db";

type RateLimitOptions = {
  namespace: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitRow = {
  count: number;
  window_started_at: Date | string;
};

export async function enforceRateLimit({
  namespace,
  identifier,
  limit,
  windowSeconds,
}: RateLimitOptions): Promise<Response | null> {
  const keyMaterial = `${namespace}:${identifier}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(keyMaterial));
  const key = Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");

  const result = await getDb().execute(sql`
    INSERT INTO api_rate_limits ("key", "count", "window_started_at", "expires_at")
    VALUES (${key}, 1, NOW(), NOW() + (${windowSeconds} * INTERVAL '1 second'))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN api_rate_limits."window_started_at" <= NOW() - (${windowSeconds} * INTERVAL '1 second')
          THEN 1
        ELSE api_rate_limits."count" + 1
      END,
      "window_started_at" = CASE
        WHEN api_rate_limits."window_started_at" <= NOW() - (${windowSeconds} * INTERVAL '1 second')
          THEN NOW()
        ELSE api_rate_limits."window_started_at"
      END,
      "expires_at" = NOW() + (${windowSeconds} * INTERVAL '1 second')
    RETURNING "count", "window_started_at"
  `);
  const row = result[0] as RateLimitRow | undefined;
  if (!row || Number(row.count) <= limit) return null;

  const startedAt = new Date(row.window_started_at).getTime();
  const retryAfter = Math.max(1, Math.ceil((startedAt + windowSeconds * 1000 - Date.now()) / 1000));
  return Response.json(
    { error: { code: "RATE_LIMITED", message: "Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut." } },
    {
      status: 429,
      headers: {
        "cache-control": "no-store",
        "retry-after": String(retryAfter),
        "x-ratelimit-limit": String(limit),
        "x-ratelimit-remaining": "0",
      },
    },
  );
}
