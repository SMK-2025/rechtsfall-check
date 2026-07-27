export type OfficialLegalSource = {
  id: string;
  title: string;
  url: string;
  authority: "Bundesministerium der Justiz / Bundesamt für Justiz";
  reviewStatus: "LEGAL_REVIEW_REQUIRED";
};

export const officialLegalSources = {
  kschg4: { id: "kschg-4", title: "§ 4 KSchG – Anrufung des Arbeitsgerichts", url: "https://www.gesetze-im-internet.de/kschg/__4.html" },
  stpo410: { id: "stpo-410", title: "§ 410 StPO – Einspruch gegen den Strafbefehl", url: "https://www.gesetze-im-internet.de/stpo/__410.html" },
  owig67: { id: "owig-67", title: "§ 67 OWiG – Einspruch gegen den Bußgeldbescheid", url: "https://www.gesetze-im-internet.de/owig_1968/__67.html" },
  vwgo70: { id: "vwgo-70", title: "§ 70 VwGO – Widerspruch", url: "https://www.gesetze-im-internet.de/vwgo/__70.html" },
  sgg84: { id: "sgg-84", title: "§ 84 SGG – Widerspruch", url: "https://www.gesetze-im-internet.de/sgg/__84.html" },
  bgb1944: { id: "bgb-1944", title: "§ 1944 BGB – Ausschlagungsfrist", url: "https://www.gesetze-im-internet.de/bgb/__1944.html" },
  zpo692: { id: "zpo-692", title: "§ 692 ZPO – Mahnbescheid", url: "https://www.gesetze-im-internet.de/zpo/__692.html" },
  bgb195: { id: "bgb-195", title: "§ 195 BGB – regelmäßige Verjährungsfrist", url: "https://www.gesetze-im-internet.de/bgb/__195.html" },
} satisfies Record<string, Omit<OfficialLegalSource, "authority" | "reviewStatus">>;

const sourceKeysByArea: Record<string, Array<keyof typeof officialLegalSources>> = {
  employment: ["kschg4", "bgb195"],
  traffic: ["owig67", "bgb195"],
  criminal: ["stpo410", "owig67"],
  administrative: ["vwgo70"],
  social: ["sgg84"],
  inheritance: ["bgb1944", "bgb195"],
  consumer_purchase: ["zpo692", "bgb195"],
  contract: ["zpo692", "bgb195"],
  tenancy: ["zpo692", "bgb195"],
};

export function getOfficialSources(legalArea: string): OfficialLegalSource[] {
  return (sourceKeysByArea[legalArea] || ["bgb195"]).map(key => ({
    ...officialLegalSources[key],
    authority: "Bundesministerium der Justiz / Bundesamt für Justiz",
    reviewStatus: "LEGAL_REVIEW_REQUIRED",
  }));
}
