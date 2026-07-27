import { getLegalArea } from "../legal-areas";

export type AssessmentInput = {
  legalArea?: string;
  topic?: string;
  eventDate?: string;
  federalState?: string;
  opposingParty?: string;
  description?: string;
  desiredOutcome?: string;
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

const MIN_DESCRIPTION_LENGTH = 80;

export function assessLegalIntake(input: AssessmentInput): AssessmentResult {
  const area = getLegalArea(input.legalArea);
  const facts = [
    `Rechtsgebiet: ${area.title}`,
    `Thema: ${input.topic || "noch nicht eingegrenzt"}`,
    `Ereignisdatum: ${input.eventDate || "nicht angegeben"}`,
    input.federalState ? `Bundesland: ${input.federalState}` : "Bundesland noch nicht angegeben",
    input.opposingParty ? `Andere Seite: ${input.opposingParty}` : "Andere Seite noch nicht benannt",
    input.desiredOutcome ? `Gewünschtes Ergebnis: ${input.desiredOutcome}` : "Gewünschtes Ergebnis noch nicht benannt",
    input.hasDocument ? "Mindestens eine Unterlage ist der Fallakte zugeordnet." : "Noch keine Unterlage zugeordnet.",
  ];
  const missing = [
    "Welche Kommunikation oder Aufforderung gab es bisher und wann?",
    "Gibt es Schreiben mit einer Frist, einem Termin, Aktenzeichen oder Zustellnachweis?",
    "Welche Tatsachen kann die andere Seite voraussichtlich anders darstellen?",
  ];
  if (!input.federalState) missing.push("In welchem Bundesland hat sich der wesentliche Vorgang ereignet?");
  if (!input.opposingParty) missing.push("Gegenüber welcher Person, Firma, Versicherung oder Behörde besteht das Anliegen?");
  if (!input.desiredOutcome) missing.push("Welches konkrete Ergebnis möchten Sie erreichen?");
  if (!input.hasDocument) missing.push(`Noch hilfreich: ${area.documents.slice(0, 2).join(" oder ")}.`);

  const insufficient = (input.description?.trim().length || 0) < MIN_DESCRIPTION_LENGTH;
  const urgent = area.risk === "urgent";
  return {
    facts,
    missing,
    sources: area.sourceLabels.map(source => `${source} – konkrete Anwendbarkeit wird anhand der vollständigen Fallangaben geprüft`),
    summary: insufficient
      ? "Die bisherigen Angaben reichen noch nicht für eine nachvollziehbare Ersteinschätzung. Ergänzen Sie insbesondere Ablauf, Beteiligte, Kommunikation, mögliche Fristen und Ihr gewünschtes Ergebnis."
      : urgent
        ? `Der geschilderte Sachverhalt wurde dem Bereich ${area.title} zugeordnet. Wegen des erhöhten Risikos in diesem Bereich sollte die individuelle Situation zeitnah durch eine befugte fachkundige Stelle geprüft werden. Die Fallakte hilft dabei, Angaben und Unterlagen geordnet bereitzustellen.`
        : `Der Sachverhalt wurde vorläufig dem Bereich ${area.title} und dem Thema „${input.topic || "noch unklar"}“ zugeordnet. Die genannten Informationsgrundlagen können relevant sein. Ob ihre Voraussetzungen im konkreten Fall erfüllt sind, hängt von den offenen Tatsachen, Fristen und Unterlagen ab.`,
    gate: insufficient
      ? "Nicht-Antwort ausgelöst: Die Tatsachendichte ist noch zu gering. Es wird keine rechtliche Schlussfolgerung ausgegeben."
      : urgent
        ? "Eskalationsstufe: Keine autonome rechtliche Schlussfolgerung. Zeitnahe fachkundige Prüfung und besondere Fristenkontrolle empfohlen."
        : "Vorläufige strukturierte Einordnung. Quellen, Fristen, Ausnahmen und Belege müssen für eine weitergehende Bewertung fallbezogen geprüft werden.",
    decision: insufficient ? "NEEDS_INFORMATION" : urgent ? "ESCALATE" : "PRELIMINARY_ONLY",
  };
}
