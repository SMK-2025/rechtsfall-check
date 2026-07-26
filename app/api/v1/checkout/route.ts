import { getDb } from "../../../../db";
import { payments } from "../../../../db/schema";
import { getSiteUrl } from "../../../../lib/site-url";
import { CASE_CHECK_PRICE_CENTS,getStripe } from "../../../../lib/payments";
import { ownedCase } from "../../../../lib/server/case-access";
import { apiError,requireApiMember } from "../../../../lib/server/member";
export async function POST(request:Request){
  const member=await requireApiMember();if(!member)return apiError("AUTHENTICATION_REQUIRED",401,"Anmeldung erforderlich.");
  const {caseId}=await request.json() as{caseId?:string};if(!caseId)return apiError("CASE_ID_REQUIRED",400,"Fall-ID fehlt.");
  const item=await ownedCase(caseId,member.id);if(!item||item.status==="DELETED")return apiError("CASE_NOT_FOUND",404,"Fall nicht gefunden.");
  if(item.paymentStatus==="PAID")return Response.json({alreadyPaid:true,url:`${getSiteUrl()}/fallraum/${caseId}`});
  const stripe=getStripe();if(!stripe)return apiError("PAYMENT_NOT_CONFIGURED",503,"Die Zahlungsfunktion wird gerade eingerichtet.");
  const site=getSiteUrl();const session=await stripe.checkout.sessions.create({
    mode:"payment",customer_email:member.email,client_reference_id:caseId,
    line_items:[{quantity:1,price_data:{currency:"eur",unit_amount:CASE_CHECK_PRICE_CENTS,product_data:{name:"Rechtsfall Check – Digitale Fallprüfung",description:"Geführte Fallaufnahme, Dokumentenanalyse und nicht abschließende Ersteinschätzung"}}}],
    metadata:{caseId,ownerId:member.id,productCode:"CASE_CHECK_39"},
    success_url:`${site}/fallraum/${caseId}?payment=success`,cancel_url:`${site}/fallraum/${caseId}?payment=cancelled`,
  });
  await getDb().insert(payments).values({id:crypto.randomUUID(),caseId,ownerId:member.id,providerSessionId:session.id,status:"OPEN",amountCents:CASE_CHECK_PRICE_CENTS,currency:"eur"});
  return Response.json({url:session.url},{status:201,headers:{"cache-control":"no-store"}});
}
