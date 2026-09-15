import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { cases, lawyerLegalAreas, lawyerMatches, lawyerProfiles, lawyerSubscriptions } from "@/db/schema";
import { rankLawyerMatches } from "@/lib/lawyer-matching";
import { apiError, requireApiMember } from "@/lib/server/member";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOrigin } from "@/lib/server/request-security";

type Payload = { latitude?: number; longitude?: number; locationConsent?: boolean };
const coordinateE6 = (value: number) => Math.round(value * 1_000_000);

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const blocked = enforceSameOrigin(request);
  if (blocked) return blocked;
  const member = await requireApiMember();
  if (!member) return apiError("AUTHENTICATION_REQUIRED", 401, "Anmeldung erforderlich.");
  const limited = await enforceRateLimit({ namespace: "lawyer-match", identifier: member.id, limit: 10, windowSeconds: 900 });
  if (limited) return limited;
  const body = await request.json().catch(() => null) as Payload | null;
  const latitude = Number(body?.latitude); const longitude = Number(body?.longitude);
  if (body?.locationConsent !== true) return apiError("LOCATION_CONSENT_REQUIRED", 400, "Bitte stimmen Sie der einmaligen Standortverwendung zu.");
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return apiError("INVALID_LOCATION", 400, "Der Standort konnte nicht verwendet werden.");
  }
  const { caseId } = await params;
  const db = getDb();
  const [item] = await db.select().from(cases).where(and(eq(cases.id, caseId), eq(cases.ownerId, member.id))).limit(1);
  if (!item || item.paymentStatus !== "PAID" || !["ASSESSMENT_READY", "ESCALATED"].includes(item.status)) {
    return apiError("MATCHING_NOT_AVAILABLE", 409, "Anwaltsvorschläge sind erst nach dem bezahlten und abgeschlossenen Rechtsfall-Check verfügbar.");
  }
  const rows = await db.select({
    id: lawyerProfiles.userId, status: lawyerProfiles.status, acceptsNewMandates: lawyerProfiles.acceptsNewMandates,
    latitudeE6: lawyerProfiles.latitudeE6, longitudeE6: lawyerProfiles.longitudeE6,
    practiceRadiusKm: lawyerProfiles.practiceRadiusKm, legalArea: lawyerLegalAreas.legalArea,
  }).from(lawyerProfiles).innerJoin(lawyerLegalAreas, eq(lawyerLegalAreas.lawyerId, lawyerProfiles.userId))
    .innerJoin(lawyerSubscriptions, and(eq(lawyerSubscriptions.lawyerId, lawyerProfiles.userId), inArray(lawyerSubscriptions.status, ["ACTIVE", "CANCELS_AT_TERM_END"])))
    .where(and(eq(lawyerProfiles.status, "VERIFIED"), eq(lawyerProfiles.acceptsNewMandates, true)));
  const lawyers = [...new Set(rows.map(row => row.id))].map(id => {
    const first = rows.find(row => row.id === id)!;
    return { ...first, legalAreas: rows.filter(row => row.id === id).map(row => row.legalArea) };
  });
  const matches = rankLawyerMatches({ legalArea: item.legalArea, latitudeE6: coordinateE6(latitude), longitudeE6: coordinateE6(longitude), casePaymentStatus: item.paymentStatus }, lawyers);
  if (matches.length) await db.insert(lawyerMatches).values(matches.map(match => ({
    id: crypto.randomUUID(), caseId, lawyerId: match.lawyerId, status: "SUGGESTED",
    distanceKm: Math.max(0, Math.round(match.distanceKm)), matchedLegalArea: match.legalArea,
  }))).onConflictDoNothing();
  return Response.json({ count: matches.length, exactLocationStored: false }, { headers: { "cache-control": "no-store" } });
}
