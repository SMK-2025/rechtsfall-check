export type GateContext={factCount:number; evidenceCount:number; unresolvedContradictions:number; sourceApproval:boolean; deadlineConfidence:number};
export function evaluateGates(x:GateContext){
  const reasons:string[]=[];
  if(x.factCount<3) reasons.push("INSUFFICIENT_FACTS");
  if(x.evidenceCount<1) reasons.push("NO_SUPPORTING_EVIDENCE");
  if(x.unresolvedContradictions>0) reasons.push("UNRESOLVED_CONTRADICTION");
  if(!x.sourceApproval) reasons.push("UNAPPROVED_LEGAL_SOURCES");
  if(x.deadlineConfidence<0.9) reasons.push("DEADLINE_UNCERTAIN");
  return {pass:reasons.length===0,reasons,action:reasons.length?"WITHHOLD_OR_ESCALATE":"PRELIMINARY_OUTPUT"};
}
