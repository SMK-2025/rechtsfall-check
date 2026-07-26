import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { cases,payments } from "../../../../db/schema";
import { getStripe } from "../../../../lib/payments";
export async function POST(request:Request){
  const stripe=getStripe(),secret=process.env.STRIPE_WEBHOOK_SECRET,signature=request.headers.get("stripe-signature");
  if(!stripe||!secret||!signature)return new Response("Webhook not configured",{status:503});
  let event:Stripe.Event;try{event=stripe.webhooks.constructEvent(await request.text(),signature,secret)}catch{return new Response("Invalid signature",{status:400})}
  if(event.type==="checkout.session.completed"){
    const session=event.data.object;const caseId=session.metadata?.caseId;
    if(caseId&&session.payment_status==="paid"){const now=new Date();await getDb().update(payments).set({status:"PAID",updatedAt:now}).where(eq(payments.providerSessionId,session.id));await getDb().update(cases).set({paymentStatus:"PAID",status:"INTAKE",updatedAt:now}).where(eq(cases.id,caseId))}
  }
  return Response.json({received:true});
}
