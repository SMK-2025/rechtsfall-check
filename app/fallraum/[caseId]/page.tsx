import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CaseWorkspace } from "../../workspace";
import { getAuthenticatedMember } from "../../../lib/server/member";

export const dynamic = "force-dynamic";
export const metadata:Metadata={title:"Fallakte | Rechtsfall KI",robots:{index:false,follow:false}};

export default async function CasePage({params}:{params:Promise<{caseId:string}>}){
  const user=await getAuthenticatedMember();
  if(!user) redirect("/anmelden?returnTo=%2Ffallraum");
  const {caseId}=await params;
  return <CaseWorkspace userName={user.displayName} caseId={caseId}/>;
}
