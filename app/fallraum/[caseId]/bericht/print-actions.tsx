"use client";

import Link from "next/link";

export function PrintActions({ caseId, backHref }: { caseId: string; backHref?: string }) {
  return <nav className="report-actions" aria-label="Aktionen für den Rechtsfall-Check">
    <Link href={backHref || `/fallraum/${caseId}`}>← Zurück</Link>
    <button type="button" onClick={() => window.print()}>Als PDF speichern oder drucken</button>
  </nav>;
}
