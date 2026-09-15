import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { lawyerProfiles, lawyerSubscriptions } from "@/db/schema";
import { getLawyerTaxRateId, getStripe, LAWYER_ANNUAL_NET_CENTS } from "@/lib/payments";
import { getSiteUrl } from "@/lib/site-url";
import { apiError, requireApiMember } from "@/lib/server/member";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOrigin } from "@/lib/server/request-security";

export async function POST(request: Request) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember({ allowIncompleteProfile: true });
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const limited = await enforceRateLimit({ namespace: "lawyer-checkout", identifier: member.id, limit: 5, windowSeconds: 900 });
  if (limited) return limited;
  const db = getDb();
  const [profile] = await db.select().from(lawyerProfiles).where(eq(lawyerProfiles.userId, member.id)).limit(1);
  if (!profile || profile.status !== "VERIFIED") {
    return apiError("LAWYER_NOT_VERIFIED", 403, "Die Jahreszahlung wird erst nach erfolgreicher Prüfung Ihrer Zulassung freigeschaltet.");
  }
  const [active] = await db.select().from(lawyerSubscriptions).where(and(
    eq(lawyerSubscriptions.lawyerId, member.id),
    inArray(lawyerSubscriptions.status, ["ACTIVE", "CANCELS_AT_TERM_END"]),
  )).limit(1);
  if (active) return Response.json({ alreadyActive: true, url: `${getSiteUrl()}/anwalt?payment=active` });

  const stripe = getStripe();
  const taxRateId = getLawyerTaxRateId();
  if (!stripe || !taxRateId) return apiError("LAWYER_PAYMENT_NOT_CONFIGURED", 503, "Die Jahreszahlung wird gerade eingerichtet.");
  const [open] = await db.select().from(lawyerSubscriptions).where(and(
    eq(lawyerSubscriptions.lawyerId, member.id), eq(lawyerSubscriptions.status, "CHECKOUT_OPEN"),
  )).orderBy(desc(lawyerSubscriptions.createdAt)).limit(1);
  if (open?.providerCheckoutSessionId) {
    const prior = await stripe.checkout.sessions.retrieve(open.providerCheckoutSessionId).catch(() => null);
    if (prior?.status === "open" && prior.url) return Response.json({ url: prior.url, resumed: true });
  }

  const id = crypto.randomUUID();
  const site = getSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: member.email,
    client_reference_id: member.id,
    line_items: [{
      quantity: 1,
      tax_rates: [taxRateId],
      price_data: {
        currency: "eur", unit_amount: LAWYER_ANNUAL_NET_CENTS, tax_behavior: "exclusive",
        recurring: { interval: "year", interval_count: 1 },
        product_data: {
          name: "Rechtsfall-Check.de – Anwaltsportal Jahreszugang",
          description: "12 Monate Plattformzugang inklusive garantiertem Mediabudget von 2.940 € netto",
        },
      },
    }],
    subscription_data: { metadata: { lawyerId: member.id, subscriptionRecordId: id, productCode: "LAWYER_ANNUAL_5880" } },
    metadata: { lawyerId: member.id, subscriptionRecordId: id, productCode: "LAWYER_ANNUAL_5880" },
    success_url: `${site}/anwalt?payment=success`, cancel_url: `${site}/anwalt?payment=cancelled`,
  }, { idempotencyKey: `lawyer-annual:${member.id}:${Math.floor(Date.now() / 1_800_000)}` });
  await db.insert(lawyerSubscriptions).values({
    id, lawyerId: member.id, status: "CHECKOUT_OPEN", providerCheckoutSessionId: session.id,
  });
  return Response.json({ url: session.url }, { status: 201, headers: { "cache-control": "no-store" } });
}
