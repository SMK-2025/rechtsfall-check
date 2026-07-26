import { and, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { cases } from "../../db/schema";

export async function ownedCase(caseId: string, ownerId: string) {
  const [row] = await getDb().select().from(cases).where(and(eq(cases.id, caseId), eq(cases.ownerId, ownerId))).limit(1);
  return row ?? null;
}
