export type AssessmentInput = {
  topic?: string;
  eventDate?: string;
  description?: string;
  hasDocument?: boolean;
};

export type AssessmentResult = {
  summary: string;
  facts: string[];
  missing: string[];
  sources: string[];
  gate: string;
  decision: "NEEDS_INFORMATION" | "ESCALATE" | "PRELIMINARY_ONLY";
};

const MIN_DESCRIPTION_LENGTH = 40;

export function assessConsumerPurchase(input: AssessmentInput): AssessmentResult {
  const facts = [
    `Thema: ${input.topic || "nicht angegeben"}`,
    `Ereignisdatum: ${input.eventDate || "nicht angegeben"}`,
    input.hasDocument ? "Mindestens ein Dokument wurde benannt." : "Keine Unterlage wurde benannt.",
  ];
  const missing = [
    "Wann und bei wem wurde die Ware gekauft?",
    "Wie genau zeigt sich der behauptete Mangel?",
    "Wurde der Verkäufer bereits nachweisbar informiert?",
  ];
  if (!input.hasDocument) missing.push("Kaufbeleg oder Vertragsunterlage fehlt.");

  const insufficient = !input.description || input.description.trim().length < MIN_DESCRIPTION_LENGTH;
  return {
    facts,
    missing,
    sources: [
      "BGB §§ 433 ff., 437 ff. – nur als mögliche Prüfgrundlage *",
      "Verbrauchsgüterkauf: BGB §§ 474 ff. – Anwendbarkeit ungeprüft *",
    ],
    summary: insufficient
      ? "Die Angaben reichen noch nicht für eine belastbare Ersteinschätzung. Zunächst müssen die offenen Tatsachen und Belege geklärt werden."
      : "Die Angaben deuten auf einen kaufrechtlichen Sachverhalt hin. Ob und welche Rechte bestehen, kann ohne Prüfung der offenen Tatsachen und Originalunterlagen nicht beurteilt werden.",
    gate: insufficient
      ? "Nicht-Antwort ausgelöst: zu geringe Tatsachendichte. Keine rechtliche Schlussfolgerung."
      : "Nur vorläufige Strukturierung. Vor einer nutzbaren Ausgabe sind Quellenvalidierung, Fristenprüfung und juristische Freigabe erforderlich.",
    decision: insufficient ? "NEEDS_INFORMATION" : "PRELIMINARY_ONLY",
  };
}
