export type OfficialLegalSource = {
  id: string;
  title: string;
  url: string;
  authority: "Bundesministerium der Justiz / Bundesamt für Justiz";
  reviewStatus: "LEGAL_REVIEW_REQUIRED";
  technicalStatus: "OFFICIAL_SOURCE_REGISTERED";
  legalAreas: string[];
};

type SourceDefinition = Omit<
  OfficialLegalSource,
  "authority" | "reviewStatus" | "technicalStatus" | "legalAreas"
>;

export const officialLegalSources = {
  bgb195: { id: "bgb-195", title: "§ 195 BGB – Regelmäßige Verjährungsfrist", url: "https://www.gesetze-im-internet.de/bgb/__195.html" },
  bgb280: { id: "bgb-280", title: "§ 280 BGB – Schadensersatz wegen Pflichtverletzung", url: "https://www.gesetze-im-internet.de/bgb/__280.html" },
  bgb312g: { id: "bgb-312g", title: "§ 312g BGB – Widerrufsrecht", url: "https://www.gesetze-im-internet.de/bgb/__312g.html" },
  bgb433: { id: "bgb-433", title: "§ 433 BGB – Vertragstypische Pflichten beim Kaufvertrag", url: "https://www.gesetze-im-internet.de/bgb/__433.html" },
  bgb474: { id: "bgb-474", title: "§ 474 BGB – Verbrauchsgüterkauf", url: "https://www.gesetze-im-internet.de/bgb/__474.html" },
  bgb535: { id: "bgb-535", title: "§ 535 BGB – Inhalt und Hauptpflichten des Mietvertrags", url: "https://www.gesetze-im-internet.de/bgb/__535.html" },
  bgb611a: { id: "bgb-611a", title: "§ 611a BGB – Arbeitsvertrag", url: "https://www.gesetze-im-internet.de/bgb/__611a.html" },
  bgb651a: { id: "bgb-651a", title: "§ 651a BGB – Pauschalreisevertrag", url: "https://www.gesetze-im-internet.de/bgb/__651a.html" },
  bgb823: { id: "bgb-823", title: "§ 823 BGB – Schadensersatzpflicht", url: "https://www.gesetze-im-internet.de/bgb/__823.html" },
  bgb1004: { id: "bgb-1004", title: "§ 1004 BGB – Beseitigungs- und Unterlassungsanspruch", url: "https://www.gesetze-im-internet.de/bgb/__1004.html" },
  bgb1944: { id: "bgb-1944", title: "§ 1944 BGB – Ausschlagungsfrist", url: "https://www.gesetze-im-internet.de/bgb/__1944.html" },
  kschg4: { id: "kschg-4", title: "§ 4 KSchG – Anrufung des Arbeitsgerichts", url: "https://www.gesetze-im-internet.de/kschg/__4.html" },
  vvg1: { id: "vvg-1", title: "§ 1 VVG – Vertragstypische Pflichten", url: "https://www.gesetze-im-internet.de/vvg_2008/__1.html" },
  sgg84: { id: "sgg-84", title: "§ 84 SGG – Widerspruch", url: "https://www.gesetze-im-internet.de/sgg/__84.html" },
  zpo692: { id: "zpo-692", title: "§ 692 ZPO – Mahnbescheid", url: "https://www.gesetze-im-internet.de/zpo/__692.html" },
  vwgo70: { id: "vwgo-70", title: "§ 70 VwGO – Widerspruch", url: "https://www.gesetze-im-internet.de/vwgo/__70.html" },
  owig67: { id: "owig-67", title: "§ 67 OWiG – Einspruch gegen den Bußgeldbescheid", url: "https://www.gesetze-im-internet.de/owig_1968/__67.html" },
  stpo410: { id: "stpo-410", title: "§ 410 StPO – Einspruch gegen den Strafbefehl", url: "https://www.gesetze-im-internet.de/stpo/__410.html" },
  famfg1: { id: "famfg-1", title: "§ 1 FamFG – Anwendungsbereich", url: "https://www.gesetze-im-internet.de/famfg/__1.html" },
  bgb630a: { id: "bgb-630a", title: "§ 630a BGB – Behandlungsvertrag", url: "https://www.gesetze-im-internet.de/bgb/__630a.html" },
  bdsg1: { id: "bdsg-1", title: "§ 1 BDSG – Anwendungsbereich", url: "https://www.gesetze-im-internet.de/bdsg_2018/__1.html" },
  urhg1: { id: "urhg-1", title: "§ 1 UrhG – Allgemeines", url: "https://www.gesetze-im-internet.de/urhg/__1.html" },
} satisfies Record<string, SourceDefinition>;

const sourceKeysByArea: Record<string, Array<keyof typeof officialLegalSources>> = {
  employment: ["bgb611a", "kschg4", "bgb195"],
  tenancy: ["bgb535", "bgb195"],
  neighbour_property: ["bgb823", "bgb1004", "bgb195"],
  consumer_purchase: ["bgb433", "bgb474", "bgb312g", "bgb195"],
  contract: ["bgb280", "zpo692", "bgb195"],
  traffic: ["bgb823", "owig67", "bgb195"],
  family: ["famfg1", "bgb195"],
  inheritance: ["bgb1944", "bgb195"],
  insurance: ["vvg1", "bgb195"],
  social: ["sgg84"],
  bank_finance: ["bgb280", "zpo692", "bgb195"],
  digital_privacy: ["bdsg1", "urhg1", "bgb195"],
  travel: ["bgb651a", "bgb280", "bgb195"],
  medical: ["bgb630a", "bgb823", "bgb195"],
  administrative: ["vwgo70"],
  criminal: ["stpo410", "owig67"],
  other_unsure: ["bgb195"],
};

export function getOfficialSources(legalArea: string): OfficialLegalSource[] {
  return (sourceKeysByArea[legalArea] || ["bgb195"]).map(key => ({
    ...officialLegalSources[key],
    authority: "Bundesministerium der Justiz / Bundesamt für Justiz",
    reviewStatus: "LEGAL_REVIEW_REQUIRED",
    technicalStatus: "OFFICIAL_SOURCE_REGISTERED",
    legalAreas: Object.entries(sourceKeysByArea)
      .filter(([, keys]) => keys.includes(key))
      .map(([area]) => area),
  }));
}

export function getLegalSourceRegister(): OfficialLegalSource[] {
  return (Object.keys(officialLegalSources) as Array<keyof typeof officialLegalSources>)
    .map(key => ({
      ...officialLegalSources[key],
      authority: "Bundesministerium der Justiz / Bundesamt für Justiz" as const,
      reviewStatus: "LEGAL_REVIEW_REQUIRED" as const,
      technicalStatus: "OFFICIAL_SOURCE_REGISTERED" as const,
      legalAreas: Object.entries(sourceKeysByArea)
        .filter(([, keys]) => keys.includes(key))
        .map(([area]) => area),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "de"));
}
