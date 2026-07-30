export const reviewTypes = {
  PORTAL: "Portal allgemein",
  CHECK: "Rechtsfall-Check",
  SUPPORT: "Support",
} as const;

export const reviewStatuses = {
  PENDING: "Wartet auf Prüfung",
  PUBLISHED: "Veröffentlicht",
  REJECTED: "Nicht freigegeben",
} as const;

export const reviewDisplayModes = {
  FIRST_NAME_INITIAL: "Vorname und Anfangsbuchstabe",
  INITIALS: "Nur Initialen",
  ANONYMOUS: "Anonym",
} as const;

export type ReviewType = keyof typeof reviewTypes;
export type ReviewStatus = keyof typeof reviewStatuses;
export type ReviewDisplayMode = keyof typeof reviewDisplayModes;

export function isReviewType(value: unknown): value is ReviewType {
  return typeof value === "string" && value in reviewTypes;
}
export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && value in reviewStatuses;
}
export function isReviewDisplayMode(value: unknown): value is ReviewDisplayMode {
  return typeof value === "string" && value in reviewDisplayModes;
}
export function cleanReviewText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}
export function publicReviewerName(mode: ReviewDisplayMode, firstName: string | null, lastName: string | null) {
  const first = cleanReviewText(firstName, 60);
  const last = cleanReviewText(lastName, 60);
  if (mode === "ANONYMOUS") return "Anonyme Bewertung";
  if (mode === "INITIALS") {
    const initials = `${first[0] || ""}${last[0] || ""}`.toUpperCase();
    return initials || "Verifizierter Nutzer";
  }
  return first ? `${first}${last ? ` ${last[0].toUpperCase()}.` : ""}` : "Verifizierter Nutzer";
}
