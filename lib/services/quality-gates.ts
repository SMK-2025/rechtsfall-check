export type QualityGateDecision = "NEEDS_INFORMATION" | "ESCALATE" | "READY";

export type QualityGateReason =
  | "INSUFFICIENT_NARRATIVE"
  | "INSUFFICIENT_FACTS"
  | "OPEN_REQUIRED_QUESTIONS"
  | "UNRESOLVED_CONTRADICTIONS"
  | "AI_REQUIRES_INFORMATION"
  | "AI_REQUIRES_ESCALATION"
  | "URGENT_DEADLINE"
  | "DEADLINE_START_UNCLEAR"
  | "NO_SUPPORTING_EVIDENCE"
  | "DOCUMENT_EXTRACTION_INCOMPLETE"
  | "LEGAL_EDITORIAL_REVIEW_PENDING";

export type QualityGateContext = {
  aiStage: "NEEDS_INFORMATION" | "PRELIMINARY_ASSESSMENT" | "ESCALATE";
  narrativeLength: number;
  factCount: number;
  evidenceCount: number;
  openRequiredQuestionCount: number;
  unresolvedContradictions: number;
  urgentDeadlineCount: number;
  deadlineStartKnown: boolean;
  extractionFailureCount: number;
  legalSourcesApproved: boolean;
};

const reasonLabels: Record<QualityGateReason, string> = {
  INSUFFICIENT_NARRATIVE: "Die Fallschilderung enthält noch zu wenig konkreten Sachverhalt.",
  INSUFFICIENT_FACTS: "Es konnten noch nicht genügend belastbare Eckdaten erkannt werden.",
  OPEN_REQUIRED_QUESTIONS: "Mindestens eine erforderliche Rückfrage ist noch offen.",
  UNRESOLVED_CONTRADICTIONS: "Widersprüchliche Angaben sind noch nicht geklärt.",
  AI_REQUIRES_INFORMATION: "Die Voranalyse benötigt weitere fallbezogene Angaben.",
  AI_REQUIRES_ESCALATION: "Der Fall erfordert wegen seiner Art eine zeitnahe fachkundige Prüfung.",
  URGENT_DEADLINE: "Es bestehen Anhaltspunkte für eine möglicherweise kurzfristige gesetzliche Frist.",
  DEADLINE_START_UNCLEAR: "Für eine möglicherweise laufende Frist fehlt noch das maßgebliche Zugangs- oder Ereignisdatum.",
  NO_SUPPORTING_EVIDENCE: "Die Einordnung beruht derzeit ausschließlich auf den Angaben des Nutzers.",
  DOCUMENT_EXTRACTION_INCOMPLETE: "Mindestens eine Unterlage konnte nicht vollständig ausgewertet werden.",
  LEGAL_EDITORIAL_REVIEW_PENDING: "Verwendete amtliche Quellen sind technisch hinterlegt, aber redaktionell noch freigabepflichtig.",
};

export function evaluateQualityGates(context: QualityGateContext) {
  const blockers = new Set<QualityGateReason>();
  const warnings = new Set<QualityGateReason>();

  if (context.aiStage === "NEEDS_INFORMATION") blockers.add("AI_REQUIRES_INFORMATION");
  if (context.narrativeLength < 80) blockers.add("INSUFFICIENT_NARRATIVE");
  if (context.factCount < 2) blockers.add("INSUFFICIENT_FACTS");
  if (context.openRequiredQuestionCount > 0) blockers.add("OPEN_REQUIRED_QUESTIONS");
  if (context.unresolvedContradictions > 0) blockers.add("UNRESOLVED_CONTRADICTIONS");
  if (context.urgentDeadlineCount > 0 && !context.deadlineStartKnown) blockers.add("DEADLINE_START_UNCLEAR");

  if (context.evidenceCount < 1) warnings.add("NO_SUPPORTING_EVIDENCE");
  if (context.extractionFailureCount > 0) warnings.add("DOCUMENT_EXTRACTION_INCOMPLETE");
  if (!context.legalSourcesApproved) warnings.add("LEGAL_EDITORIAL_REVIEW_PENDING");

  const escalation = context.aiStage === "ESCALATE" || context.urgentDeadlineCount > 0;
  if (context.aiStage === "ESCALATE") warnings.add("AI_REQUIRES_ESCALATION");
  if (context.urgentDeadlineCount > 0) warnings.add("URGENT_DEADLINE");

  const decision: QualityGateDecision = blockers.size
    ? "NEEDS_INFORMATION"
    : escalation ? "ESCALATE" : "READY";

  return {
    passed: decision !== "NEEDS_INFORMATION",
    decision,
    blockers: [...blockers],
    warnings: [...warnings],
    blockerMessages: [...blockers].map(reason => reasonLabels[reason]),
    warningMessages: [...warnings].map(reason => reasonLabels[reason]),
    evaluatedAt: new Date().toISOString(),
  };
}
