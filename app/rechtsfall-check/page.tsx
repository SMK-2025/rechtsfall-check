import type { Metadata } from "next";
import { ConversionCta, SiteFooter, SiteHeader } from "../components/site-chrome";
import { PublicSignupLink } from "../components/public-signup-link";

export const metadata: Metadata = {
  title: "Was Sie beim Rechtsfall Check erhalten",
  description:
    "Ihr Rechtsproblem verständlich vorprüfen: mit geführter Fallaufnahme, Dokumentenanalyse, passenden Rückfragen und klaren nächsten Prüfschritten.",
  alternates: { canonical: "/rechtsfall-check" },
};

const steps = [
  ["Verständliche Fallaufnahme", "Sie geben Beteiligte, Ereignisse, Daten, Beträge und Ihr gewünschtes Ergebnis ohne juristische Fachbegriffe an."],
  ["Unterlagen werden gelesen", "Verträge, Rechnungen, Schreiben und Bilder werden sicher verarbeitet und den passenden Angaben zugeordnet."],
  ["Passende Rückfragen", "Statt allgemeiner Fragen erhalten Sie nur Rückfragen, die für Ihren konkreten Fall noch wichtig sind."],
  ["Geprüfte Grenzen", "Das System macht fehlende Angaben und mögliche Fristen sichtbar, statt eine scheinbar sichere Antwort zu erfinden."],
  ["Ihr finaler Rechtsfall Check", "Sie erhalten eine klare Zusammenfassung mit Fakten, offenen Punkten, möglichen Prüfgrundlagen und sinnvollen nächsten Schritten."],
];

export default function CheckPage() {
  return (
    <div className="site product-check-page">
      <SiteHeader />
      <main>
        <section className="subhero product-subhero">
          <div>
            <span className="section-label light-label">MEHR ALS EINE EINFACHE KI-ANTWORT</span>
            <h1>Ihr Fall wird Schritt für Schritt aufbereitet.</h1>
            <p>Sie schildern das Problem, laden Unterlagen hoch und beantworten bei Bedarf kurze Rückfragen.</p>
            <PublicSignupLink className="button button-light">Kostenlose Fallakte anlegen →</PublicSignupLink>
          </div>
        </section>

        <section className="content-split section-wrap">
          <div><span className="section-label">DAS SYSTEM HINTER DEM CHECK</span><h2>Ihre Angaben und Unterlagen werden zusammen betrachtet.</h2></div>
          <div><p>Der Rechtsfall Check sammelt alles an einem geschützten Ort: Ihre Schilderung, Ihre Dokumente und Ihre Antworten. So wird sichtbar, welche Aussagen belegt sind und wo noch etwas fehlt.</p><p>Geprüfte Gesetzesquellen und feste Qualitätsregeln begrenzen die Analyse. Kann etwas nicht zuverlässig eingeordnet werden, zeigt das Ergebnis diese Unsicherheit deutlich.</p></div>
        </section>

        <section className="check-process-band">
          <div className="section-wrap check-process-inner">
            <header className="check-process-heading">
              <span className="section-label">DER WEG ZUM ERGEBNIS</span>
              <h2>Ihr Fall entwickelt sich Schritt für Schritt.</h2>
              <p>Jede Phase baut auf der vorherigen auf. Sie sehen dabei jederzeit, was bereits berücksichtigt wurde.</p>
            </header>
            <div className="check-timeline">
              {steps.map(([title, text], index) => (
                <article key={title}>
                  <div className="check-timeline-card"><h3>{title}</h3><p>{text}</p></div>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="deliverable section-wrap">
          <div className="deliverable-preview">
            <small>ERGEBNIS IHRES RECHTSFALL CHECKS</small>
            <h3>Strukturierte Ersteinschätzung</h3>
            {["Kurzfassung Ihres Falls", "Belegte Fakten und Dokumente", "Offene Fragen und fehlende Nachweise", "Mögliche Fristen und Rechtsgrundlagen", "Risiken, Gegenargumente und Prüfbedarf", "Hinweis, wann anwaltliche Hilfe nötig ist"].map((item) => <span key={item}>✓ {item}</span>)}
          </div>
          <div><span className="section-label">IHR MEHRWERT</span><h2>Besser vorbereitet in jede weitere Entscheidung.</h2><p>Wenn anwaltliche Hilfe notwendig ist, gehen Sie mit einer strukturierten Fallakte und klaren offenen Fragen in das Gespräch. Das kann die Erstaufnahme effizienter machen.</p><p>Wenn Informationen fehlen, wissen Sie konkret, was Sie noch zusammentragen sollten.</p></div>
        </section>

        <ConversionCta />
        <SiteFooter />
      </main>
    </div>
  );
}
