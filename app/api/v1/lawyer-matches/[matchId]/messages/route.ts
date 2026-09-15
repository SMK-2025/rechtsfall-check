import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { cases, lawyerMatches, lawyerMatchMessages, lawyerSubscriptions } from "@/db/schema";
import { apiError, requireApiMember } from "@/lib/server/member";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOrigin } from "@/lib/server/request-security";

async function chatAccess(matchId: string, memberId: string) {
  const db = getDb();
  const [row] = await db.select({ match: lawyerMatches, ownerId: cases.ownerId }).from(lawyerMatches)
    .innerJoin(cases, eq(lawyerMatches.caseId, cases.id)).where(eq(lawyerMatches.id, matchId)).limit(1);
  if (!row || !["CONTACT_RELEASED", "ACCEPTED"].includes(row.match.status)
    || !row.match.userConsentAt || !row.match.selectedByUserAt) return null;
  if (row.ownerId === memberId) return { ...row, role: "MEMBER" as const };
  if (row.match.lawyerId !== memberId) return null;
  const [subscription] = await db.select({ id: lawyerSubscriptions.id }).from(lawyerSubscriptions).where(and(
    eq(lawyerSubscriptions.lawyerId, memberId),
    inArray(lawyerSubscriptions.status, ["ACTIVE", "CANCELS_AT_TERM_END"]),
  )).limit(1);
  return subscription ? { ...row, role: "LAWYER" as const } : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const member = await requireApiMember({ allowIncompleteProfile: true });
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const { matchId } = await params;
  const access = await chatAccess(matchId, member.id);
  if (!access) return apiError("CHAT_NOT_AVAILABLE", 404, "Dieser Chat ist nicht verfügbar.");
  const messages = await getDb().select({
    id: lawyerMatchMessages.id, senderRole: lawyerMatchMessages.senderRole,
    body: lawyerMatchMessages.body, readAt: lawyerMatchMessages.readAt, createdAt: lawyerMatchMessages.createdAt,
  }).from(lawyerMatchMessages).where(eq(lawyerMatchMessages.matchId, matchId))
    .orderBy(asc(lawyerMatchMessages.createdAt)).limit(500);
  return Response.json({ messages, role: access.role }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember({ allowIncompleteProfile: true });
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const { matchId } = await params;
  const access = await chatAccess(matchId, member.id);
  if (!access) return apiError("CHAT_NOT_AVAILABLE", 404, "Dieser Chat ist nicht verfügbar.");
  const limited = await enforceRateLimit({ namespace: "lawyer-chat", identifier: `${member.id}:${matchId}`, limit: 30, windowSeconds: 300 });
  if (limited) return limited;
  const body = await request.json().catch(() => null) as { message?: string } | null;
  const message = body?.message?.trim().slice(0, 5000) || "";
  if (!message) return apiError("MESSAGE_REQUIRED", 400, "Bitte geben Sie eine Nachricht ein.");
  const id = crypto.randomUUID();
  const now = new Date();
  const db = getDb();
  await db.transaction(async transaction => {
    await transaction.insert(lawyerMatchMessages).values({ id, matchId, senderId: member.id, senderRole: access.role, body: message });
    await transaction.update(lawyerMatches).set({ lawyerRespondedAt: access.role === "LAWYER" ? now : access.match.lawyerRespondedAt, updatedAt: now })
      .where(eq(lawyerMatches.id, matchId));
  });
  return Response.json({ message: { id, senderRole: access.role, body: message, createdAt: now } }, { status: 201 });
}

