import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CaseWorkspace } from "../../workspace";
import { getAuthenticatedMember, isMemberProfileComplete } from "../../../lib/server/member";

export const dynamic = "force-dynamic";
export const metadata:Metadata={title:"Fallakte | Rechtsfall Check",robots:{index:false,follow:false}};

export default async function CasePage({params}:{params:Promise<{caseId:string}>}){
  const user=await getAuthenticatedMember();
  if(!user) redirect("/anmelden?returnTo=%2Ffallraum");
  const {caseId}=await params;
  if(!isMemberProfileComplete(user)) redirect(`/profil?required=1&returnTo=${encodeURIComponent(`/fallraum/${caseId}`)}`);
  return <CaseWorkspace userName={user.displayName} userEmail={user.email} caseId={caseId}/>;
}
