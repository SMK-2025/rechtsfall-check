import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents } from "@/db/schema";
import { sendTransactionalEmail } from "@/lib/email/sendgrid";
import { getSiteUrl } from "@/lib/site-url";

type Severity = "critical" | "high" | "warning";

type OperationalIssue = {
  code: string;
  component: "auth" | "database" | "documents" | "malware-scanner" | "ai" | "email" | "stripe" | "retention" | "system";
  severity: Severity;
  caseId?: string;
  targetId?: string;
  metadata?: Record<string, string | number | boolean>;
};

const ALERT_COOLDOWN_MINUTES = 30;

function alertEventType(code: string) {
  return `OPERATIONAL_ALERT_SENT_${code.replace(/[^A-Z0-9_]/gi, "_").toUpperCase()}`.slice(0, 180);
}

export async function reportOperationalIssue(issue: OperationalIssue) {
  const db = getDb();
  const now = new Date();
  const eventType = issue.code.replace(/[^A-Z0-9_]/gi, "_").toUpperCase().slice(0, 180);
  const sentEventType = alertEventType(eventType);

  try {
    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      caseId: issue.caseId,
      eventType,
      targetType: issue.component,
      targetId: issue.targetId,
      metadataJson: {
        severity: issue.severity,
        occurredAt: now.toISOString(),
        ...(issue.metadata ?? {}),
      },
    });
  } catch {
    // The primary request must not fail because observability storage failed.
  }

  const recipient = process.env.ALERT_EMAIL?.trim();
  if (!recipient) return { recorded: true, alerted: false, reason: "not-configured" };

  const cooldownStartedAt = new Date(now.getTime() - ALERT_COOLDOWN_MINUTES * 60_000);
  try {
    const [recentAlert] = await db.select({ id: auditEvents.id }).from(auditEvents)
      .where(and(eq(auditEvents.eventType, sentEventType), gte(auditEvents.createdAt, cooldownStartedAt)))
      .orderBy(desc(auditEvents.createdAt))
      .limit(1);
    if (recentAlert) return { recorded: true, alerted: false, reason: "cooldown" };
  } catch {
    // A database outage must not suppress an alert sent through the mail provider.
  }

  try {
    await sendTransactionalEmail({
      kind: "operationalAlert",
      to: recipient,
      name: "Betrieb",
      alertCode: eventType,
      component: issue.component,
      severity: issue.severity,
      occurredAt: now.toLocaleString("de-DE", { timeZone: "Europe/Berlin" }),
      actionUrl: `${getSiteUrl()}/betrieb?tab=system`,
    });
    try {
      await db.insert(auditEvents).values({
        id: crypto.randomUUID(),
        eventType: sentEventType,
        targetType: issue.component,
        targetId: issue.targetId,
        metadataJson: { severity: issue.severity, cooldownMinutes: ALERT_COOLDOWN_MINUTES },
      });
    } catch {
      // Mail delivery remains useful when the database cannot record it.
    }
    return { recorded: true, alerted: true };
  } catch {
    try {
      await db.insert(auditEvents).values({
        id: crypto.randomUUID(),
        eventType: "OPERATIONAL_ALERT_DELIVERY_FAILED",
        targetType: issue.component,
        targetId: issue.targetId,
        metadataJson: { sourceEventType: eventType, occurredAt: now.toISOString() },
      });
    } catch {
      // No recursive alert attempt.
    }
    return { recorded: true, alerted: false, reason: "delivery-failed" };
  }
}
