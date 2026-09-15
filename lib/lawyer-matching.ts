export type MatchableLawyer = {
  id: string;
  status: string;
  acceptsNewMandates: boolean;
  legalAreas: readonly string[];
  latitudeE6: number | null;
  longitudeE6: number | null;
  practiceRadiusKm: number;
};

export type MatchRequest = {
  legalArea: string;
  latitudeE6: number;
  longitudeE6: number;
  casePaymentStatus: string;
};

const earthRadiusKm = 6371.0088;
const radians = (degrees: number) => degrees * Math.PI / 180;

export function distanceInKm(
  from: Pick<MatchRequest, "latitudeE6" | "longitudeE6">,
  to: Pick<MatchableLawyer, "latitudeE6" | "longitudeE6">,
) {
  if (to.latitudeE6 === null || to.longitudeE6 === null) return null;
  const lat1 = radians(from.latitudeE6 / 1_000_000);
  const lat2 = radians(to.latitudeE6 / 1_000_000);
  const deltaLat = lat2 - lat1;
  const deltaLon = radians((to.longitudeE6 - from.longitudeE6) / 1_000_000);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function rankLawyerMatches(request: MatchRequest, lawyers: readonly MatchableLawyer[]) {
  if (request.casePaymentStatus !== "PAID") return [];
  return lawyers.flatMap(lawyer => {
    if (lawyer.status !== "VERIFIED" || !lawyer.acceptsNewMandates) return [];
    if (!lawyer.legalAreas.includes(request.legalArea)) return [];
    const distanceKm = distanceInKm(request, lawyer);
    if (distanceKm === null || distanceKm > lawyer.practiceRadiusKm) return [];
    return [{ lawyerId: lawyer.id, legalArea: request.legalArea, distanceKm }];
  }).sort((left, right) => left.distanceKm - right.distanceKm || left.lawyerId.localeCompare(right.lawyerId));
}

export function mayDiscloseCaseToLawyer(input: {
  casePaymentStatus: string;
  matchStatus: string;
  userConsentAt: Date | null;
  selectedByUserAt: Date | null;
}) {
  return input.casePaymentStatus === "PAID"
    && input.matchStatus === "CONTACT_RELEASED"
    && input.userConsentAt !== null
    && input.selectedByUserAt !== null;
}
