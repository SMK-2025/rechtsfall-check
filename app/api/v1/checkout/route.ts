import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { payments } from "../../../../db/schema";
import { CASE_CHECK_PRICE_CENTS, CASE_CHECK_VAT_PERCENT, getStripe, getStripeTaxRateId } from "../../../../lib/payments";
import { getSiteUrl } from "../../../../lib/site-url";
import { ownedCase } from "../../../../lib/server/case-access";
import { apiError, requireApiMember } from "../../../../lib/server/member";
import { enforceRateLimit } from "../../../../lib/server/rate-limit";
import { enforceSameOrigin } from "../../../../lib/server/request-security";

export async function POST(request: Request) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const limited = await enforceRateLimit({namespace:"checkout", identifier: member.id, limit: 10, windowSeconds: 600});
  if (limited) return limited;
  const { caseId } = await request.json() as { caseId?: string };
  if (!caseId) return apiError("CASE_ID_REQUIRED", 400, "Fall-ID fehlt.");
  const item = await ownedCase(caseId, member.id);
  if (!item || item.status === "DELETED") return apiError("CASE_NOT_FOUND", 404, "Fall nicht gefunden.");
  if (item.paymentStatus === "PAID") {
    return Response.json({ alreadyPaid: true, url: `${getSiteUrl()}/fallraum/${caseId}` });
  }
  const stripe = getStripe();
  if (!stripe) return apiError("PAYMENT_NOT_CONFIGURED", 503, "Die Zahlungsfunktion wird gerade eingerichtet.");
  const taxRateId = getStripeTaxRateId();
  if (!taxRateId) {
    return apiError(
      "PAYMENT_TAX_NOT_CONFIGURED",
      503,
      "Die Umsatzsteuer-Ausweisung wird gerade eingerichtet. Bitte versuchen Sie es später erneut.",
    );
  }
  const db = getDb();
  const [existing] = await db.select().from(payments).where(and(
    eq(payments.caseId, caseId),
    eq(payments.ownerId, member.id),
    eq(payments.status, "OPEN"),
  )).orderBy(desc(payments.createdAt)).limit(1);

  if (existing) {
    try {
      const prior = await stripe.checkout.sessions.retrieve(existing.providerSessionId);
      if (prior.status === "open" && prior.url) {
        return Response.json({ url: prior.url, resumed: true }, { headers: { "cache-control": "no-store" } });
      }
      if (prior.payment_status === "paid") {
        return Response.json({
          processing: true,
          url: `${getSiteUrl()}/fallraum/${caseId}?payment=processing`,
        }, { headers: { "cache-control": "no-store" } });
      }
      await db.update(payments).set({
        status: prior.status === "expired" ? "EXPIRED" : "FAILED",
        failureReason: `checkout_${prior.status || "unknown"}`,
        updatedAt: new Date(),
      }).where(eq(payments.id, existing.id));
    } catch {
      await db.update(payments).set({
        status: "FAILED", failureReason: "checkout_not_retrievable", updatedAt: new Date(),
      }).where(eq(payments.id, existing.id));
    }
  }

  const paymentId = crypto.randomUUID();
  const site = getSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: member.email,
    client_reference_id: caseId,
    line_items: [{
      quantity: 1,
      tax_rates: [taxRateId],
      price_data: {
        currency: "eur",
        unit_amount: CASE_CHECK_PRICE_CENTS,
        tax_behavior: "inclusive",
        product_data: {
          name: "Rechtsfall Check – Digitale Fallprüfung",
          description: "Geführte Fallaufnahme, Dokumentenanalyse und nicht abschließende Ersteinschätzung",
        },
      },
    }],
    metadata: {
      caseId, ownerId: member.id, paymentId, productCode: "CASE_CHECK_19",
      priceIncludesVat: "true", vatPercent: String(CASE_CHECK_VAT_PERCENT),
    },
    payment_intent_data: {
      metadata: {
        caseId, ownerId: member.id, paymentId, productCode: "CASE_CHECK_19",
        priceIncludesVat: "true", vatPercent: String(CASE_CHECK_VAT_PERCENT),
      },
    },
    success_url: `${site}/fallraum/${caseId}?payment=success`,
    cancel_url: `${site}/fallraum/${caseId}?payment=cancelled`,
  }, { idempotencyKey: `case-checkout:${caseId}:${Math.floor(Date.now() / 1_800_000)}` });
  await db.insert(payments).values({
    id: paymentId,
    caseId,
    ownerId: member.id,
    providerSessionId: session.id,
    status: "OPEN",
    amountCents: CASE_CHECK_PRICE_CENTS,
    currency: "eur",
  }).onConflictDoNothing();
  return Response.json({ url: session.url }, { status: 201, headers: { "cache-control": "no-store" } });
}
