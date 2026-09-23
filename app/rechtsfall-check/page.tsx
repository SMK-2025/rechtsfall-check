import type { Metadata } from "next";
import { ConversionCta, SiteFooter, SiteHeader } from "../components/site-chrome";
import { PublicSignupLink } from "../components/public-signup-link";

export const metadata: Metadata = {
  title: "Was du beim Rechtsfall Check erhältst",
  description:
    "Dein Rechtsproblem verständlich vorprüfen: mit geführter Fallaufnahme, Dokumentenanalyse, passenden Rückfragen und klaren nächsten Prüfschritten.",
  alternates: { canonical: "/rechtsfall-check" },
};

const steps = [
  ["Verständliche Fallaufnahme", "Du gibst Beteiligte, Ereignisse, Daten, Beträge und dein gewünschtes Ergebnis ohne juristische Fachbegriffe an."],
  ["Unterlagen werden gelesen", "Verträge, Rechnungen, Schreiben und Bilder werden sicher verarbeitet und den passenden Angaben zugeordnet."],
  ["Passende Rückfragen", "Statt allgemeiner Fragen erhältst du nur Rückfragen, die für deinen konkreten Fall noch wichtig sind."],
  ["Geprüfte Grenzen", "Das System macht fehlende Angaben und mögliche Fristen sichtbar, statt eine scheinbar sichere Antwort zu erfinden."],
  ["Dein finaler Rechtsfall Check", "Du erhältst eine klare Zusammenfassung mit Fakten, offenen Punkten, möglichen Prüfgrundlagen und sinnvollen nächsten Schritten."],
];

export default function CheckPage() {
  return (
    <div className="site product-check-page">
      <SiteHeader />
      <main>
        <section className="subhero product-subhero">
          <div>
            <span className="section-label light-label">MEHR ALS EINE EINFACHE KI-ANTWORT</span>
            <h1>Dein Fall wird Schritt für Schritt aufbereitet.</h1>
            <p>Du schilderst das Problem, lädst Unterlagen hoch und beantwortest bei Bedarf kurze Rückfragen.</p>
            <PublicSignupLink className="button button-light">Zur kostenlosen Registrierung →</PublicSignupLink>
          </div>
        </section>

        <section className="content-split section-wrap">
          <div><span className="section-label">DAS SYSTEM HINTER DEM CHECK</span><h2>Deine Angaben und Unterlagen werden zusammen betrachtet.</h2></div>
          <div><p>Der Rechtsfall Check sammelt alles an einem geschützten Ort: deine Schilderung, deine Dokumente und deine Antworten. So wird sichtbar, welche Aussagen belegt sind und wo noch etwas fehlt.</p><p>Geprüfte Gesetzesquellen und feste Qualitätsregeln begrenzen die Analyse. Kann etwas nicht zuverlässig eingeordnet werden, zeigt das Ergebnis diese Unsicherheit deutlich.</p></div>
        </section>

        <section className="check-process-band">
          <div className="section-wrap check-process-inner">
            <header className="check-process-heading">
              <span className="section-label">DER WEG ZUM ERGEBNIS</span>
              <h2>Dein Fall entwickelt sich Schritt für Schritt.</h2>
              <p>Jede Phase baut auf der vorherigen auf. Du siehst dabei jederzeit, was bereits berücksichtigt wurde.</p>
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
          <div><span className="section-label">DEIN MEHRWERT</span><h2>Besser vorbereitet auf jede weitere Entscheidung.</h2><p>Wenn anwaltliche Hilfe notwendig ist, gehst du mit einer strukturierten Fallakte und klaren offenen Fragen in das Gespräch. Das kann die Erstaufnahme effizienter machen.</p><p>Wenn Informationen fehlen, weißt du konkret, was du noch zusammentragen solltest.</p></div>
        </section>

        <ConversionCta />
        <SiteFooter />
      </main>
    </div>
  );
}
