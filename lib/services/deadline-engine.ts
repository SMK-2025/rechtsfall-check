import { getLegalSourceRegister, type OfficialLegalSource } from "@/lib/legal-sources";
import { matchDeadlineRules } from "./deadline-rules";

export type DeadlineWarning = {
  id: string;
  headline: string;
  explanation: string;
  trigger: string;
  source: OfficialLegalSource;
  urgency: "IMPORTANT" | "URGENT";
  reviewStatus: "LEGAL_REVIEW_REQUIRED";
};

export function detectDeadlineWarnings(input: {
  legalArea: string;
  topic?: string;
  description?: string;
  documentText?: string;
}): DeadlineWarning[] {
  const sources = getLegalSourceRegister();
  return matchDeadlineRules(input).map(rule => {
    const source = sources.find(item => item.id === rule.sourceId);
    if (!source) throw new Error(`Missing official source: ${rule.sourceId}`);
    return {
      id: rule.id, headline: rule.headline, explanation: rule.explanation,
      trigger: rule.trigger, source, urgency: rule.urgency,
      reviewStatus: "LEGAL_REVIEW_REQUIRED" as const,
    };
  });
}
