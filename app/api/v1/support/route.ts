import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, cases, supportMessages, supportTickets, users } from "@/db/schema";
import { isAdminEmail } from "@/lib/server/admin";
import { apiError, requireApiMember } from "@/lib/server/member";
import { enforceSameOrigin } from "@/lib/server/request-security";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { cleanSupportText, isSupportCategory, ticketNumber } from "@/lib/support";
import { sendTransactionalEmail } from "@/lib/email/sendgrid";
import { getSiteUrl } from "@/lib/site-url";

export async function GET() {
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const admin = isAdminEmail(member.email);
  const selection = {
    id: supportTickets.id,
    ticketNumber: supportTickets.ticketNumber,
    ownerId: supportTickets.ownerId,
    caseId: supportTickets.caseId,
    category: supportTickets.category,
    subject: supportTickets.subject,
    status: supportTickets.status,
    lastMessageAt: supportTickets.lastMessageAt,
    createdAt: supportTickets.createdAt,
    updatedAt: supportTickets.updatedAt,
    ownerEmail: users.email,
    ownerFirstName: users.firstName,
    ownerLastName: users.lastName,
  };
  const tickets = admin
    ? await getDb().select(selection).from(supportTickets)
      .leftJoin(users, eq(supportTickets.ownerId, users.id))
      .orderBy(desc(supportTickets.lastMessageAt)).limit(500)
    : await getDb().select(selection).from(supportTickets)
      .leftJoin(users, eq(supportTickets.ownerId, users.id))
      .where(eq(supportTickets.ownerId, member.id))
      .orderBy(desc(supportTickets.lastMessageAt)).limit(100);
  return Response.json({ tickets }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Login erforderlich.");
  const limited = await enforceRateLimit({ namespace: "support-create", identifier: member.id, limit: 10, windowSeconds: 3600 });
  if (limited) return limited;

  const body = await request.json() as { category?: unknown; subject?: unknown; message?: unknown; caseId?: unknown };
  if (!isSupportCategory(body.category)) return apiError("INVALID_CATEGORY", 400, "Bitte wählen Sie ein Support-Thema.");
  const category = body.category;
  const subject = cleanSupportText(body.subject, 140);
  const message = cleanSupportText(body.message, 5000);
  if (subject.length < 5 || message.length < 10) {
    return apiError("INVALID_TICKET", 400, "Bitte beschreiben Sie Ihr Anliegen etwas genauer.");
  }

  const caseId = typeof body.caseId === "string" && body.caseId ? body.caseId : null;
  if (caseId) {
    const [ownedCase] = await getDb().select({ id: cases.id }).from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.ownerId, member.id))).limit(1);
    if (!ownedCase) return apiError("CASE_NOT_FOUND", 404, "Die ausgewählte Fallakte wurde nicht gefunden.");
  }

  const now = new Date();
  const id = crypto.randomUUID();
  const number = ticketNumber();
  await getDb().transaction(async transaction => {
    await transaction.insert(supportTickets).values({
      id, ticketNumber: number, ownerId: member.id, caseId, category,
      subject, status: "OPEN", lastMessageAt: now, createdAt: now, updatedAt: now,
    });
    await transaction.insert(supportMessages).values({
      id: crypto.randomUUID(), ticketId: id, senderId: member.id, senderRole: "MEMBER", body: message, createdAt: now,
    });
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: member.id, eventType: "SUPPORT_TICKET_CREATED",
      targetType: "SUPPORT_TICKET", targetId: id, metadataJson: { ticketNumber: number, category },
    });
  });
  const adminEmail = (process.env.ADMIN_EMAILS || "").split(",").map(value => value.trim()).find(Boolean);
  if (adminEmail) {
    void sendTransactionalEmail({
      kind: "supportNew",
      to: adminEmail,
      ticketNumber: number,
      subject,
      actionUrl: `${getSiteUrl()}/support`,
    }).catch(error => console.error("Support notification failed", error));
  }
  return Response.json({ ticket: { id, ticketNumber: number } }, { status: 201, headers: { "cache-control": "no-store" } });
}
