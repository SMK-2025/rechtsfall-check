import Stripe from "stripe";
export function getStripe(){
  const secret=process.env.STRIPE_SECRET_KEY;
  if(!secret) return null;
  return new Stripe(secret);
}
export const CASE_CHECK_PRICE_CENTS=1900;
