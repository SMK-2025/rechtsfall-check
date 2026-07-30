export const supportCategories = {
  TECHNICAL: "Technisches Problem",
  ACCOUNT: "Konto und Login",
  PAYMENT: "Zahlung und Beleg",
  DOCUMENT: "Dokument und Upload",
  USABILITY: "Bedienung und Verständnis",
} as const;

export const supportStatuses = {
  OPEN: "Offen",
  IN_PROGRESS: "In Bearbeitung",
  WAITING_USER: "Rückfrage an Nutzer",
  RESOLVED: "Gelöst",
  CLOSED: "Geschlossen",
} as const;

export type SupportCategory = keyof typeof supportCategories;
export type SupportStatus = keyof typeof supportStatuses;

export const supportBoundary =
  "Der Support hilft bei Technik, Konto, Zahlung, Dokumenten und Bedienung. Er beantwortet keine rechtlichen Fragen, bewertet keine Erfolgsaussichten und ändert keinen abgeschlossenen Rechtsfall-Check.";

export function isSupportCategory(value: unknown): value is SupportCategory {
  return typeof value === "string" && value in supportCategories;
}

export function isSupportStatus(value: unknown): value is SupportStatus {
  return typeof value === "string" && value in supportStatuses;
}

export function cleanSupportText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\r\n/g, "\n").trim().slice(0, maxLength)
    : "";
}

export function ticketNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `RFC-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}
