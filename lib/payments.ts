import Stripe from "stripe";
export function getStripe(){
  const secret=process.env.STRIPE_SECRET_KEY;
  if(!secret) return null;
  return new Stripe(secret);
}
export const CASE_CHECK_PRICE_CENTS=1900;
export const CASE_CHECK_VAT_PERCENT=19;

export function getStripeTaxRateId(){
  return process.env.STRIPE_TAX_RATE_ID?.trim() || null;
}
