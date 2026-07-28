import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { auditEvents, cases, payments } from "../../../../db/schema";
import { CASE_CHECK_PRICE_CENTS, getStripe } from "../../../../lib/payments";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !secret || !signature) return new Response("Webhook not configured", { status: 503 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const caseId = session.metadata?.caseId;
    const ownerId = session.metadata?.ownerId;
    const validPayment = session.mode === "payment"
      && session.payment_status === "paid"
      && session.currency === "eur"
      && session.amount_total === CASE_CHECK_PRICE_CENTS
      && session.metadata?.productCode === "CASE_CHECK_19";
    if (!caseId || !ownerId || !validPayment) return new Response("Payment data mismatch", { status: 400 });

    const db = getDb();
    await db.transaction(async transaction => {
      const [payment] = await transaction.select().from(payments).where(and(
        eq(payments.providerSessionId, session.id),
        eq(payments.caseId, caseId),
        eq(payments.ownerId, ownerId),
        eq(payments.amountCents, CASE_CHECK_PRICE_CENTS),
      )).limit(1);
      if (!payment) throw new Error("Payment record not found");
      if (payment.status === "PAID") return;
      const now = new Date();
      await transaction.update(payments).set({ status: "PAID", updatedAt: now }).where(eq(payments.id, payment.id));
      await transaction.update(cases).set({
        paymentStatus: "PAID",
        productCode: "CASE_CHECK_19",
        status: "INTAKE",
        updatedAt: now,
      }).where(and(eq(cases.id, caseId), eq(cases.ownerId, ownerId)));
      await transaction.insert(auditEvents).values({
        id: crypto.randomUUID(),
        caseId,
        actorId: ownerId,
        eventType: "PAYMENT_CONFIRMED",
        targetType: "PAYMENT",
        targetId: payment.id,
        metadataJson: { provider: "stripe", amountCents: CASE_CHECK_PRICE_CENTS, currency: "eur" },
      });
    });
  }
  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const caseId = session.metadata?.caseId;
    const ownerId = session.metadata?.ownerId;
    if (caseId && ownerId) {
      const db = getDb();
      const [payment] = await db.select().from(payments).where(and(
        eq(payments.providerSessionId, session.id),
        eq(payments.caseId, caseId),
        eq(payments.ownerId, ownerId),
      )).limit(1);
      if (payment && payment.status === "OPEN") {
        const now = new Date();
        await db.transaction(async transaction => {
          await transaction.update(payments).set({ status: "EXPIRED", updatedAt: now }).where(eq(payments.id, payment.id));
          await transaction.insert(auditEvents).values({
            id: crypto.randomUUID(), caseId, actorId: ownerId, eventType: "CHECKOUT_EXPIRED",
            targetType: "PAYMENT", targetId: payment.id, metadataJson: { provider: "stripe" },
          });
        });
      }
    }
  }
  return Response.json({ received: true });
}
