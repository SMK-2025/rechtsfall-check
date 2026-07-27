import type { Metadata } from "next";
import { count, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { assessments, auditEvents, cases, documents, users } from "@/db/schema";
import { requireAdmin } from "@/lib/server/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Betriebsübersicht", robots: { index: false, follow: false } };

export default async function OperationsPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const db = getDb();
  const [[userCount], [caseCount], [assessmentCount], [failedDocuments], [failedCases], recentEvents] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(cases),
    db.select({ value: count() }).from(assessments),
    db.select({ value: count() }).from(documents).where(eq(documents.extractionStatus, "FAILED")),
    db.select({ value: count() }).from(cases).where(eq(cases.status, "ANALYSIS_FAILED")),
    db.select({
      id: auditEvents.id, eventType: auditEvents.eventType, targetType: auditEvents.targetType,
      caseId: auditEvents.caseId, createdAt: auditEvents.createdAt, metadata: auditEvents.metadataJson,
    }).from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(50),
  ]);
  return <main className="operations-page">
    <header><span>GESCHÜTZTE BETRIEBSANSICHT</span><h1>Qualität und Betrieb</h1><p>Technische Zustände ohne Falltexte oder Dokumentinhalte.</p></header>
    <section className="operations-grid">
      <article><strong>{userCount.value}</strong><span>Konten</span></article>
      <article><strong>{caseCount.value}</strong><span>Fallakten</span></article>
      <article><strong>{assessmentCount.value}</strong><span>Analysen</span></article>
      <article className={failedDocuments.value ? "warning" : ""}><strong>{failedDocuments.value}</strong><span>Dokumentfehler</span></article>
      <article className={failedCases.value ? "warning" : ""}><strong>{failedCases.value}</strong><span>Analysefehler</span></article>
    </section>
    <section className="operations-events"><h2>Letzte Systemereignisse</h2>
      <div className="operations-table">{recentEvents.map(event => <article key={event.id}>
        <time>{new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(event.createdAt)}</time>
        <strong>{event.eventType}</strong><span>{event.targetType || "System"}</span><code>{event.caseId ? `Fall ${event.caseId.slice(0, 8)}` : "—"}</code>
      </article>)}</div>
    </section>
  </main>;
}
