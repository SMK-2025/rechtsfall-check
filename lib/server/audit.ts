import { getDb } from "../../db";
import { auditEvents } from "../../db/schema";

export async function writeAudit(input: {
  caseId?: string;
  actorId: string;
  eventType: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, string | number | boolean>;
}) {
  await getDb().insert(auditEvents).values({
    id: crypto.randomUUID(),
    caseId: input.caseId,
    actorId: input.actorId,
    eventType: input.eventType,
    targetType: input.targetType,
    targetId: input.targetId,
    metadataJson: input.metadata ?? {},
  });
}
