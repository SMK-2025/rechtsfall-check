export type DeadlineRule = {
  id: string;
  legalAreas: string[] | "*";
  terms: string[];
  headline: string;
  explanation: string;
  trigger: string;
  sourceId: string;
  urgency: "IMPORTANT" | "URGENT";
};

export const deadlineRules: readonly DeadlineRule[] = [
  {
    id: "dismissal-three-weeks", legalAreas: ["employment"], terms: ["kündigung", "änderungskündigung"],
    headline: "Mögliche Dreiwochenfrist",
    explanation: "Bei einer schriftlichen Kündigung kann die Klagefrist nach § 4 KSchG drei Wochen ab Zugang betragen. Zugangstag und Sonderregeln müssen fachkundig geprüft werden.",
    trigger: "Erkannte Kündigung", sourceId: "kschg-4", urgency: "URGENT",
  },
  {
    id: "penalty-order-two-weeks", legalAreas: ["criminal"], terms: ["strafbefehl"],
    headline: "Mögliche Zweiwochenfrist",
    explanation: "Gegen einen Strafbefehl sieht § 410 StPO grundsätzlich zwei Wochen ab Zustellung für den Einspruch vor.",
    trigger: "Erkannter Strafbefehl", sourceId: "stpo-410", urgency: "URGENT",
  },
  {
    id: "fine-two-weeks", legalAreas: ["traffic", "criminal"], terms: ["bußgeldbescheid", "bussgeldbescheid"],
    headline: "Mögliche Zweiwochenfrist",
    explanation: "Gegen einen Bußgeldbescheid sieht § 67 OWiG grundsätzlich zwei Wochen ab Zustellung für den Einspruch vor.",
    trigger: "Erkannter Bußgeldbescheid", sourceId: "owig-67", urgency: "URGENT",
  },
  {
    id: "administrative-one-month", legalAreas: ["administrative"], terms: ["bescheid", "verwaltungsakt", "widerspruch"],
    headline: "Mögliche Monatsfrist",
    explanation: "§ 70 VwGO sieht für den Widerspruch grundsätzlich einen Monat ab Bekanntgabe vor. Rechtsbehelfsbelehrung und Landesrecht können relevant sein.",
    trigger: "Erkannter Behördenbescheid", sourceId: "vwgo-70", urgency: "URGENT",
  },
  {
    id: "social-one-month", legalAreas: ["social"], terms: ["bescheid", "widerspruch"],
    headline: "Mögliche Monatsfrist",
    explanation: "§ 84 SGG sieht für den Widerspruch grundsätzlich einen Monat ab Bekanntgabe vor; bei Bekanntgabe im Ausland gelten Besonderheiten.",
    trigger: "Erkannter Sozialleistungsbescheid", sourceId: "sgg-84", urgency: "URGENT",
  },
  {
    id: "inheritance-six-weeks", legalAreas: ["inheritance"], terms: ["ausschlag", "nachlass", "erbe", "testament"],
    headline: "Mögliche Sechswochenfrist",
    explanation: "Für eine Erbausschlagung gilt nach § 1944 BGB grundsätzlich eine Sechswochenfrist. Beginn und Auslandsfälle haben besondere Voraussetzungen.",
    trigger: "Erkanntes Ausschlagungsthema", sourceId: "bgb-1944", urgency: "URGENT",
  },
  {
    id: "payment-order-two-weeks", legalAreas: "*", terms: ["mahnbescheid"],
    headline: "Mögliche Zweiwochenfrist",
    explanation: "Ein Mahnbescheid fordert nach § 692 ZPO grundsätzlich dazu auf, innerhalb von zwei Wochen ab Zustellung zu zahlen oder Widerspruch zu erklären.",
    trigger: "Erkannter Mahnbescheid", sourceId: "zpo-692", urgency: "URGENT",
  },
];

export function matchDeadlineRules(input: {
  legalArea: string;
  topic?: string;
  description?: string;
  documentText?: string;
}) {
  const text = `${input.topic || ""} ${input.description || ""} ${input.documentText || ""}`.toLocaleLowerCase("de-DE");
  return deadlineRules.filter(rule =>
    (rule.legalAreas === "*" || rule.legalAreas.includes(input.legalArea))
    && rule.terms.some(term => text.includes(term))
  );
}
