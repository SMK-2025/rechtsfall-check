import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, supportMessages, supportTickets, users } from "@/db/schema";
import { isAdminEmail } from "@/lib/server/admin";
import { apiError, requireApiMember } from "@/lib/server/member";
import { enforceSameOrigin } from "@/lib/server/request-security";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { cleanSupportText, isSupportStatus } from "@/lib/support";
import { sendTransactionalEmail } from "@/lib/email/sendgrid";
import { getSiteUrl } from "@/lib/site-url";

async function accessibleTicket(ticketId: string, memberId: string, admin: boolean) {
  const condition = admin
    ? eq(supportTickets.id, ticketId)
    : and(eq(supportTickets.id, ticketId), eq(supportTickets.ownerId, memberId));
  const [ticket] = await getDb().select().from(supportTickets).where(condition).limit(1);
  return ticket;
}

export async function GET(_: Request, context: { params: Promise<{ ticketId: string }> }) {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const { ticketId } = await context.params;
  const ticket = await accessibleTicket(ticketId, member.id, isAdminEmail(member.email));
  if (!ticket) return apiError("TICKET_NOT_FOUND", 404, "Das Ticket wurde nicht gefunden.");
  const messages = await getDb().select().from(supportMessages)
    .where(eq(supportMessages.ticketId, ticketId)).orderBy(asc(supportMessages.createdAt));
  return Response.json({ ticket, messages }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request, context: { params: Promise<{ ticketId: string }> }) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const limited = await enforceRateLimit({ namespace: "support-reply", identifier: member.id, limit: 30, windowSeconds: 3600 });
  if (limited) return limited;
  const { ticketId } = await context.params;
  const admin = isAdminEmail(member.email);
  const ticket = await accessibleTicket(ticketId, member.id, admin);
  if (!ticket) return apiError("TICKET_NOT_FOUND", 404, "Das Ticket wurde nicht gefunden.");
  if (ticket.status === "CLOSED") return apiError("TICKET_CLOSED", 409, "Dieses Ticket ist geschlossen.");

  const body = await request.json() as { message?: unknown };
  const message = cleanSupportText(body.message, 5000);
  if (message.length < 2) return apiError("INVALID_MESSAGE", 400, "Bitte geben Sie eine Nachricht ein.");
  const now = new Date();
  const nextStatus = admin ? "WAITING_USER" : ticket.status === "RESOLVED" ? "OPEN" : "OPEN";
  await getDb().transaction(async transaction => {
    await transaction.insert(supportMessages).values({
      id: crypto.randomUUID(), ticketId, senderId: member.id,
      senderRole: admin ? "SUPPORT" : "MEMBER", body: message, createdAt: now,
    });
    await transaction.update(supportTickets).set({ status: nextStatus, lastMessageAt: now, updatedAt: now })
      .where(eq(supportTickets.id, ticketId));
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: member.id, eventType: "SUPPORT_MESSAGE_SENT",
      targetType: "SUPPORT_TICKET", targetId: ticketId, metadataJson: { senderRole: admin ? "SUPPORT" : "MEMBER" },
    });
  });
  if (admin) {
    const [owner] = await getDb().select({
      email: users.email,
      firstName: users.firstName,
      displayName: users.displayName,
    }).from(users).where(eq(users.id, ticket.ownerId)).limit(1);
    if (owner?.email) {
      void sendTransactionalEmail({
        kind: "supportUpdate",
        to: owner.email,
        name: owner.firstName || owner.displayName,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        actionUrl: `${getSiteUrl()}/support?ticket=${encodeURIComponent(ticketId)}`,
      }).catch(error => console.error("Support notification failed", error));
    }
  }
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request, context: { params: Promise<{ ticketId: string }> }) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember();
  if (!member || !isAdminEmail(member.email)) return apiError("FORBIDDEN", 403, "Keine Berechtigung.");
  const { ticketId } = await context.params;
  const body = await request.json() as { status?: unknown };
  if (!isSupportStatus(body.status)) return apiError("INVALID_STATUS", 400, "Ungültiger Ticketstatus.");
  const status = body.status;
  const now = new Date();
  await getDb().transaction(async transaction => {
    await transaction.update(supportTickets).set({ status, updatedAt: now }).where(eq(supportTickets.id, ticketId));
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: member.id, eventType: "SUPPORT_STATUS_CHANGED",
      targetType: "SUPPORT_TICKET", targetId: ticketId, metadataJson: { status },
    });
  });
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
