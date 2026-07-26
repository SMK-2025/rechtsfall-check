export type RiskInput={legalArea:string;daysUntilKnownDeadline?:number;economicExposureEuro?:number;flags:string[]};
export function classifyRisk(input:RiskInput){
  const reasons:string[]=[];
  if(["criminal","immigration","family_child","violence","detention"].includes(input.legalArea)) reasons.push("PROTECTED_HIGH_RISK_AREA");
  if(input.daysUntilKnownDeadline!==undefined&&input.daysUntilKnownDeadline<=14) reasons.push("SHORT_OR_COURT_DEADLINE");
  if((input.economicExposureEuro||0)>=25000) reasons.push("HIGH_ECONOMIC_EXPOSURE");
  if(input.flags.includes("COURT_SERVICE")) reasons.push("COURT_SERVICE");
  if(input.flags.includes("STRATEGY_REQUEST")) reasons.push("PROCESS_STRATEGY");
  return {level:reasons.length?"ESCALATE":"STANDARD",reasons,autonomousAssessmentAllowed:reasons.length===0};
}
