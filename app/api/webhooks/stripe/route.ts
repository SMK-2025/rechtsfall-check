import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { auditEvents, cases, payments, users } from "../../../../db/schema";
import { sendTransactionalEmail } from "../../../../lib/email/sendgrid";
import { CASE_CHECK_PRICE_CENTS, getStripe } from "../../../../lib/payments";
import { getSiteUrl } from "../../../../lib/site-url";
import { reportOperationalIssue } from "../../../../lib/server/operational-monitor";

type PaymentDetails = {
  paymentIntentId: string | null;
  receiptUrl: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  invoicePdfUrl: string | null;
  hostedInvoiceUrl: string | null;
};

async function paymentDetails(stripe: Stripe, session: Stripe.Checkout.Session): Promise<PaymentDetails> {
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const invoiceId = typeof session.invoice === "string" ? session.invoice : session.invoice?.id;
  const [intent, invoice] = await Promise.all([
    paymentIntentId ? stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] }) : null,
    invoiceId ? stripe.invoices.retrieve(invoiceId) : null,
  ]);
  const charge = intent && typeof intent.latest_charge === "object" ? intent.latest_charge : null;
  return {
    paymentIntentId: intent?.id || null,
    receiptUrl: charge?.receipt_url || null,
    invoiceId: invoice?.id || null,
    invoiceNumber: invoice?.number || null,
    invoiceStatus: invoice?.status || null,
    invoicePdfUrl: invoice?.invoice_pdf || null,
    hostedInvoiceUrl: invoice?.hosted_invoice_url || null,
  };
}

const emptyPaymentDetails: PaymentDetails = {
  paymentIntentId: null,
  receiptUrl: null,
  invoiceId: null,
  invoiceNumber: null,
  invoiceStatus: null,
  invoicePdfUrl: null,
  hostedInvoiceUrl: null,
};

function validPaidSession(session: Stripe.Checkout.Session) {
  return session.mode === "payment"
    && session.payment_status === "paid"
    && session.currency === "eur"
    && session.amount_total === CASE_CHECK_PRICE_CENTS
    && session.metadata?.productCode === "CASE_CHECK_19";
}

async function confirmPayment(stripe: Stripe, session: Stripe.Checkout.Session) {
  const caseId = session.metadata?.caseId;
  const ownerId = session.metadata?.ownerId;
  if (!caseId || !ownerId || !validPaidSession(session)) {
    await reportOperationalIssue({
      code: "STRIPE_PAYMENT_DATA_MISMATCH",
      component: "stripe",
      severity: "critical",
      targetId: session.id,
      metadata: { hasCaseId: Boolean(caseId), hasOwnerId: Boolean(ownerId), validPayment: validPaidSession(session) },
    });
    throw new Error("Payment data mismatch");
  }
  const details = await paymentDetails(stripe, session).catch(() => emptyPaymentDetails);
  const db = getDb();
  const outcome = await db.transaction(async transaction => {
    const [payment] = await transaction.select().from(payments).where(and(
      eq(payments.providerSessionId, session.id),
      eq(payments.caseId, caseId),
      eq(payments.ownerId, ownerId),
      eq(payments.amountCents, CASE_CHECK_PRICE_CENTS),
    )).limit(1);
    if (!payment) throw new Error("Payment record not found");
    if (payment.status === "PAID") return { newlyPaid: false, paymentId: payment.id };
    const now = new Date();
    await transaction.update(payments).set({
      status: "PAID",
      providerPaymentId: details.paymentIntentId,
      providerMode: session.livemode ? "LIVE" : "TEST",
      receiptUrl: details.receiptUrl,
      invoiceId: details.invoiceId,
      invoiceNumber: details.invoiceNumber,
      invoiceStatus: details.invoiceStatus,
      invoicePdfUrl: details.invoicePdfUrl,
      hostedInvoiceUrl: details.hostedInvoiceUrl,
      failureReason: null,
      updatedAt: now,
    }).where(eq(payments.id, payment.id));
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
      metadataJson: {
        provider: "stripe",
        amountCents: CASE_CHECK_PRICE_CENTS,
        currency: "eur",
        paymentIntentId: details.paymentIntentId,
        receiptAvailable: Boolean(details.receiptUrl),
        invoiceId: details.invoiceId,
        invoiceNumber: details.invoiceNumber,
        invoiceAvailable: Boolean(details.invoicePdfUrl || details.hostedInvoiceUrl),
      },
    });
    return { newlyPaid: true, paymentId: payment.id };
  });

  if (outcome.newlyPaid) {
    const [[customer], [caseRow]] = await Promise.all([
      db.select({ email: users.email, name: users.displayName }).from(users).where(eq(users.id, ownerId)).limit(1),
      db.select({ title: cases.title }).from(cases).where(eq(cases.id, caseId)).limit(1),
    ]);
    if (customer?.email) {
      await sendTransactionalEmail({
        kind: "paymentConfirmed",
        to: customer.email,
        name: customer.name,
        caseTitle: caseRow?.title || "Ihr Rechtsfall-Check",
        actionUrl: `${getSiteUrl()}/fallraum/${caseId}`,
        receiptUrl: details.receiptUrl,
      }).catch(async () => {
        await reportOperationalIssue({
          code: "PAYMENT_CONFIRMATION_EMAIL_FAILED",
          component: "email",
          severity: "warning",
          caseId,
          targetId: outcome.paymentId,
        });
      });
    }
  }
}

async function updateInvoice(invoice: Stripe.Invoice) {
  const db = getDb();
  const paymentId = invoice.metadata?.paymentId;
  const invoiceId = invoice.id;
  if (!invoiceId) return;
  const [payment] = paymentId
    ? await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1)
    : await db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).limit(1);
  if (!payment) return;
  await db.update(payments).set({
    providerMode: invoice.livemode ? "LIVE" : "TEST",
    invoiceId,
    invoiceNumber: invoice.number,
    invoiceStatus: invoice.status,
    invoicePdfUrl: invoice.invoice_pdf,
    hostedInvoiceUrl: invoice.hosted_invoice_url,
    updatedAt: new Date(),
  }).where(eq(payments.id, payment.id));
}

async function updateCheckoutFailure(session: Stripe.Checkout.Session, status: "FAILED" | "EXPIRED") {
  const caseId = session.metadata?.caseId;
  const ownerId = session.metadata?.ownerId;
  if (!caseId || !ownerId) return;
  const db = getDb();
  const [payment] = await db.select().from(payments).where(and(
    eq(payments.providerSessionId, session.id),
    eq(payments.caseId, caseId),
    eq(payments.ownerId, ownerId),
  )).limit(1);
  if (!payment || payment.status !== "OPEN") return;
  const now = new Date();
  await db.transaction(async transaction => {
    await transaction.update(payments).set({
      status,
      failureReason: status === "EXPIRED" ? "checkout_expired" : "asynchronous_payment_failed",
      updatedAt: now,
    }).where(eq(payments.id, payment.id));
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(),
      caseId,
      actorId: ownerId,
      eventType: status === "EXPIRED" ? "CHECKOUT_EXPIRED" : "PAYMENT_FAILED",
      targetType: "PAYMENT",
      targetId: payment.id,
      metadataJson: { provider: "stripe" },
    });
  });
}

async function registerRefund(charge: Stripe.Charge) {
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;
  const db = getDb();
  const [payment] = await db.select().from(payments).where(eq(payments.providerPaymentId, paymentIntentId)).limit(1);
  if (!payment) return;
  const refunded = charge.amount_refunded;
  const fullyRefunded = refunded >= payment.amountCents;
  const status = fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED";
  await db.transaction(async transaction => {
    await transaction.update(payments).set({
      status,
      refundedAmountCents: refunded,
      updatedAt: new Date(),
    }).where(eq(payments.id, payment.id));
    if (fullyRefunded) {
      await transaction.update(cases).set({ paymentStatus: "REFUNDED", updatedAt: new Date() })
        .where(and(eq(cases.id, payment.caseId), eq(cases.ownerId, payment.ownerId)));
    }
    await transaction.insert(auditEvents).values({
      id: crypto.randomUUID(),
      caseId: payment.caseId,
      actorId: payment.ownerId,
      eventType: fullyRefunded ? "PAYMENT_REFUNDED" : "PAYMENT_PARTIALLY_REFUNDED",
      targetType: "PAYMENT",
      targetId: payment.id,
      metadataJson: { provider: "stripe", refundedAmountCents: refunded, currency: payment.currency },
    });
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !secret) {
    await reportOperationalIssue({ code: "STRIPE_WEBHOOK_NOT_CONFIGURED", component: "stripe", severity: "critical" });
    return new Response("Webhook not configured", { status: 503 });
  }
  if (!signature) return new Response("Missing signature", { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      if (session.payment_status === "paid") await confirmPayment(stripe, session);
    } else if (event.type === "checkout.session.async_payment_failed") {
      await updateCheckoutFailure(event.data.object, "FAILED");
    } else if (event.type === "checkout.session.expired") {
      await updateCheckoutFailure(event.data.object, "EXPIRED");
    } else if (event.type === "charge.refunded") {
      await registerRefund(event.data.object);
    } else if (
      event.type === "invoice.paid"
      || event.type === "invoice.finalization_failed"
      || event.type === "invoice.voided"
    ) {
      await updateInvoice(event.data.object);
    }
  } catch {
    await reportOperationalIssue({
      code: "STRIPE_PAYMENT_PROCESSING_FAILED",
      component: "stripe",
      severity: "critical",
      targetId: event.id,
    });
    return new Response("Payment processing failed", { status: 500 });
  }
  return Response.json({ received: true });
}
