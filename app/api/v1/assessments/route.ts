import { assessConsumerPurchase } from "../../../../lib/domain/assessment";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { assessments, facts, questions } from "../../../../db/schema";
import { ownedCase } from "../../../../lib/server/case-access";
import { writeAudit } from "../../../../lib/server/audit";
import { requireApiMember, apiError } from "../../../../lib/server/member";

export async function POST(request:Request){
  const member = await requireApiMember();
  if(!member) return apiError("AUTHENTICATION_REQUIRED",401,"Anmeldung erforderlich.");
  const contentType=request.headers.get("content-type")||"";
  if(!contentType.includes("application/json")) return apiError("UNSUPPORTED_MEDIA_TYPE",415,"JSON erwartet.");
  const body=await request.json() as {caseId?:string;topic?:string;eventDate?:string;description?:string;hasDocument?:boolean};
  if(!body.caseId) return apiError("CASE_ID_REQUIRED",400,"Fall-ID fehlt.");
  const item=await ownedCase(body.caseId,member.id);
  if(!item||item.status==="DELETED") return apiError("CASE_NOT_FOUND",404,"Fall nicht gefunden.");
  const result=assessConsumerPurchase(body);
  const db=getDb();
  const now=new Date();
  const factRows=[
    {id:crypto.randomUUID(),caseId:item.id,predicate:"user_description",value:body.description?.trim()||"",status:"USER_ASSERTED",confidence:100,createdAt:now,updatedAt:now},
    {id:crypto.randomUUID(),caseId:item.id,predicate:"event_date",value:body.eventDate||"",status:"USER_ASSERTED",confidence:100,createdAt:now,updatedAt:now},
  ].filter(row=>row.value);
  if(factRows.length) await db.insert(facts).values(factRows);
  const questionRows=result.missing.map((prompt,index)=>({id:crypto.randomUUID(),caseId:item.id,questionKey:`assessment_${Date.now()}_${index}`,prompt,status:"OPEN",createdAt:now,updatedAt:now}));
  if(questionRows.length) await db.insert(questions).values(questionRows);
  const [latest]=await db.select({version:assessments.version}).from(assessments).where(eq(assessments.caseId,item.id)).orderBy(desc(assessments.version)).limit(1);
  const version=(latest?.version||0)+1;
  const assessmentId=crypto.randomUUID();
  await db.insert(assessments).values({id:assessmentId,caseId:item.id,version,decision:result.decision,payloadJson:result,legalContentVersion:"unapproved-mvp-0",createdAt:now,updatedAt:now});
  await writeAudit({caseId:item.id,actorId:member.id,eventType:"ASSESSMENT_CREATED",targetType:"assessment",targetId:assessmentId,metadata:{version,decision:result.decision}});
  return Response.json({...result,assessmentId,version},{status:200,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
}
