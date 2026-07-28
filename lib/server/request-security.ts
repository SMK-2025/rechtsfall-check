import { apiError } from "./member";

/**
 * Blocks state-changing browser requests that were not initiated by this site.
 * Webhooks and authenticated internal jobs use their own signature/secret checks
 * and must not call this helper.
 */
export function enforceSameOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const expectedOrigin = new URL(request.url).origin;

  if (origin !== expectedOrigin || (fetchSite && fetchSite !== "same-origin")) {
    return apiError(
      "ORIGIN_NOT_ALLOWED",
      403,
      "Die Anfrage wurde aus Sicherheitsgründen abgewiesen. Bitte laden Sie die Seite neu.",
    );
  }

  return null;
}
