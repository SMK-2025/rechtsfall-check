"use client";

import Link from "next/link";

export function PrintActions({ caseId }: { caseId: string }) {
  return <nav className="report-actions" aria-label="Aktionen für den Rechtsfall-Check">
    <Link href={`/fallraum/${caseId}`}>← Zur Fallakte</Link>
    <button type="button" onClick={() => window.print()}>Als PDF speichern oder drucken</button>
  </nav>;
}
