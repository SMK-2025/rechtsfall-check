import { getOfficialSources, type OfficialLegalSource } from "@/lib/legal-sources";

export type DeadlineWarning = {
  id: string;
  headline: string;
  explanation: string;
  trigger: string;
  source: OfficialLegalSource;
  urgency: "IMPORTANT" | "URGENT";
  reviewStatus: "LEGAL_REVIEW_REQUIRED";
};

const includesAny = (text: string, terms: string[]) => terms.some(term => text.includes(term));

export function detectDeadlineWarnings(input: {
  legalArea: string;
  topic?: string;
  description?: string;
  documentText?: string;
}): DeadlineWarning[] {
  const text = `${input.topic || ""} ${input.description || ""} ${input.documentText || ""}`.toLocaleLowerCase("de-DE");
  const sources = getOfficialSources(input.legalArea);
  const source = (id: string) => sources.find(item => item.id === id);
  const warnings: DeadlineWarning[] = [];
  const add = (id: string, headline: string, explanation: string, trigger: string, sourceId: string, urgency: DeadlineWarning["urgency"]) => {
    const basis = source(sourceId);
    if (basis) warnings.push({ id, headline, explanation, trigger, source: basis, urgency, reviewStatus: "LEGAL_REVIEW_REQUIRED" });
  };

  if (input.legalArea === "employment" && includesAny(text, ["kündigung", "änderungskündigung"])) {
    add("dismissal-three-weeks", "Mögliche Dreiwochenfrist", "Bei einer schriftlichen Kündigung kann die Klagefrist nach § 4 KSchG drei Wochen ab Zugang betragen. Zugangstag und Sonderregeln müssen fachkundig geprüft werden.", "Erkannte Kündigung", "kschg-4", "URGENT");
  }
  if (input.legalArea === "criminal" && includesAny(text, ["strafbefehl"])) {
    add("penalty-order-two-weeks", "Mögliche Zweiwochenfrist", "Gegen einen Strafbefehl sieht § 410 StPO grundsätzlich zwei Wochen ab Zustellung für den Einspruch vor.", "Erkannter Strafbefehl", "stpo-410", "URGENT");
  }
  if ((input.legalArea === "traffic" || input.legalArea === "criminal") && includesAny(text, ["bußgeldbescheid", "bussgeldbescheid"])) {
    add("fine-two-weeks", "Mögliche Zweiwochenfrist", "Gegen einen Bußgeldbescheid sieht § 67 OWiG grundsätzlich zwei Wochen ab Zustellung für den Einspruch vor.", "Erkannter Bußgeldbescheid", "owig-67", "URGENT");
  }
  if (input.legalArea === "administrative" && includesAny(text, ["bescheid", "verwaltungsakt", "widerspruch"])) {
    add("administrative-one-month", "Mögliche Monatsfrist", "§ 70 VwGO sieht für den Widerspruch grundsätzlich einen Monat ab Bekanntgabe vor. Rechtsbehelfsbelehrung und Landesrecht können relevant sein.", "Erkannter Behördenbescheid", "vwgo-70", "URGENT");
  }
  if (input.legalArea === "social" && includesAny(text, ["bescheid", "widerspruch"])) {
    add("social-one-month", "Mögliche Monatsfrist", "§ 84 SGG sieht für den Widerspruch grundsätzlich einen Monat ab Bekanntgabe vor; bei Bekanntgabe im Ausland gelten Besonderheiten.", "Erkannter Sozialleistungsbescheid", "sgg-84", "URGENT");
  }
  if (input.legalArea === "inheritance" && includesAny(text, ["ausschlag", "nachlass", "erbe", "testament"])) {
    add("inheritance-six-weeks", "Mögliche Sechswochenfrist", "Für eine Erbausschlagung gilt nach § 1944 BGB grundsätzlich eine Sechswochenfrist. Beginn und Auslandsfälle haben besondere Voraussetzungen.", "Erkanntes Ausschlagungsthema", "bgb-1944", "URGENT");
  }
  if (includesAny(text, ["mahnbescheid"])) {
    const basis = officialSource("zpo-692");
    warnings.push({ id: "payment-order-two-weeks", headline: "Mögliche Zweiwochenfrist", explanation: "Ein Mahnbescheid fordert nach § 692 ZPO grundsätzlich dazu auf, innerhalb von zwei Wochen ab Zustellung zu zahlen oder Widerspruch zu erklären.", trigger: "Erkannter Mahnbescheid", source: basis, urgency: "URGENT", reviewStatus: "LEGAL_REVIEW_REQUIRED" });
  }
  return warnings;
}

function officialSource(id: string): OfficialLegalSource {
  const result = Object.values({
    ...Object.fromEntries(getOfficialSources("consumer_purchase").map(source => [source.id, source])),
  }).find(source => source.id === id);
  if (!result) throw new Error(`Missing official source: ${id}`);
  return result;
}
