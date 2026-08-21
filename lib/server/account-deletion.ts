import { del } from "@vercel/blob";
import { eq, inArray, or } from "drizzle-orm";
import { getDb } from "@/db";
import {
  assessments,
  auditEvents,
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
  cases,
  documents,
  emailDeliveryEvents,
  evidenceLinks,
  facts,
  payments,
  questions,
  users,
} from "@/db/schema";

export async function permanentlyDeleteAccount(userId: string, email: string) {
  const db = getDb();
  const caseRows = await db.select({ id: cases.id }).from(cases).where(eq(cases.ownerId, userId));
  const caseIds = caseRows.map(item => item.id);
  const documentRows = caseIds.length
    ? await db.select({ id: documents.id, objectKey: documents.objectKey }).from(documents).where(inArray(documents.caseId, caseIds))
    : [];

  for (const document of documentRows) await del(document.objectKey);

  await db.transaction(async transaction => {
    if (caseIds.length) {
      const factRows = await transaction.select({ id: facts.id }).from(facts).where(inArray(facts.caseId, caseIds));
      const factIds = factRows.map(item => item.id);
      const documentIds = documentRows.map(item => item.id);
      if (factIds.length) await transaction.delete(evidenceLinks).where(inArray(evidenceLinks.factId, factIds));
      if (documentIds.length) await transaction.delete(evidenceLinks).where(inArray(evidenceLinks.documentId, documentIds));
      await transaction.delete(questions).where(inArray(questions.caseId, caseIds));
      await transaction.delete(assessments).where(inArray(assessments.caseId, caseIds));
      await transaction.delete(facts).where(inArray(facts.caseId, caseIds));
      await transaction.delete(documents).where(inArray(documents.caseId, caseIds));
      await transaction.delete(emailDeliveryEvents).where(inArray(emailDeliveryEvents.caseId, caseIds));
      await transaction.delete(payments).where(inArray(payments.caseId, caseIds));
      await transaction.delete(auditEvents).where(or(
        inArray(auditEvents.caseId, caseIds),
        eq(auditEvents.actorId, userId),
        eq(auditEvents.targetId, userId),
      ));
      await transaction.delete(cases).where(inArray(cases.id, caseIds));
    } else {
      await transaction.delete(payments).where(eq(payments.ownerId, userId));
      await transaction.delete(auditEvents).where(or(eq(auditEvents.actorId, userId), eq(auditEvents.targetId, userId)));
    }
    await transaction.delete(users).where(eq(users.id, userId));
    await transaction.delete(authSessions).where(eq(authSessions.userId, userId));
    await transaction.delete(authAccounts).where(eq(authAccounts.userId, userId));
    await transaction.delete(authVerifications).where(eq(authVerifications.identifier, email));
    await transaction.delete(authUsers).where(eq(authUsers.id, userId));
  });

  return { caseCount: caseIds.length, documentCount: documentRows.length };
}
