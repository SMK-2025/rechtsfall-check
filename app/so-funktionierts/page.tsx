import type { Metadata } from "next";
import { ConversionCta, SiteFooter, SiteHeader } from "../components/site-chrome";
import { PublicSignupLink } from "../components/public-signup-link";

export const metadata: Metadata = {
  title: "So funktioniert der Rechtsfall Check",
  description:
    "Einfach erklärt: Situation schildern, Unterlagen hochladen, gezielte Rückfragen beantworten und eine verständliche Ersteinschätzung erhalten.",
  alternates: { canonical: "/so-funktionierts" },
};

const phases = [
  {
    number: "01",
    title: "Kostenlos starten",
    text: "Du erstellst dein Konto und legst eine geschützte Fallakte an. Bezahlt wird erst, wenn du den Rechtsfall Check ausdrücklich beauftragst.",
    detail: "Registrierung · Fallakte · noch keine Zahlung",
  },
  {
    number: "02",
    title: "Situation vollständig erfassen",
    text: "Du erzählst in eigenen Worten, was passiert ist, und lädst vorhandene Schreiben, Verträge, Rechnungen oder Fotos hoch.",
    detail: "Ohne Anwaltsdeutsch · Text oder Sprache · mehrere Dateien",
  },
  {
    number: "03",
    title: "Offene Punkte gezielt klären",
    text: "Die erste Analyse ordnet deine Angaben und Unterlagen. Nur wenn etwas Wesentliches fehlt, erhältst du kurze, passende Rückfragen.",
    detail: "Dokumentenanalyse · Faktenabgleich · höchstens nötige Fragen",
  },
  {
    number: "04",
    title: "Rechtsfall Check erhalten",
    text: "Nach deiner finalen Einreichung erhältst du eine verständliche Ersteinschätzung mit Risiken, offenen Punkten und sinnvollen nächsten Schritten.",
    detail: "Zusammenfassung · Einordnung · Ergebnis als PDF",
  },
];

const results = [
  ["Sachverhalt", "Was nach deinen Angaben passiert ist – klar und geordnet."],
  ["Fakten und Unterlagen", "Was belegt ist und welche Informationen noch fehlen."],
  ["Risiken und Fristen", "Welche Punkte besondere Aufmerksamkeit benötigen können."],
  ["Nächste Schritte", "Welche weitere Prüfung oder Unterstützung sinnvoll sein kann."],
];

export default function HowPage() {
  return (
    <div className="site how-page">
      <SiteHeader />
      <main>
        <section className="how-hero">
          <div className="how-inner how-hero-grid">
            <div>
              <span className="section-label light-label">SO FUNKTIONIERT DER RECHTSFALL CHECK</span>
              <h1>Von Ihrer Situation zu einer klaren Ersteinschätzung.</h1>
              <p>
                Du schilderst, was passiert ist. Wir führen dich verständlich durch Unterlagen und nötige Rückfragen – bis zu deinem persönlichen Rechtsfall Check.
              </p>
              <PublicSignupLink className="button button-large">Zur kostenlosen Registrierung →</PublicSignupLink>
            </div>
            <div className="how-hero-summary" aria-label="Deine Vorteile">
              <strong>Einfach durch den ganzen Fall</strong>
              <span>✓ Ohne juristische Fachbegriffe</span>
              <span>✓ Nur notwendige Rückfragen</span>
              <span>✓ Verständliches Ergebnis</span>
              <small>Einmalig 19 € bei Beauftragung · kein Abo</small>
            </div>
          </div>
        </section>

        <section className="how-process">
          <div className="how-inner">
            <header className="how-section-head">
              <span className="section-label">DER ABLAUF</span>
              <h2>Vier klare Phasen. Kein Rätselraten.</h2>
              <p>Du siehst jederzeit, wo dein Fall steht und was als Nächstes zu tun ist.</p>
            </header>
            <div className="how-phase-grid">
              {phases.map((phase) => (
                <article key={phase.number}>
                  <b>{phase.number}</b>
                  <h3>{phase.title}</h3>
                  <p>{phase.text}</p>
                  <small>{phase.detail}</small>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="how-result">
          <div className="how-inner how-result-grid">
            <div className="how-result-copy">
              <span className="section-label light-label">IHR ERGEBNIS</span>
              <h2>Du verstehst, worauf es bei deinem Fall ankommt.</h2>
              <p>
                Der Rechtsfall Check fasst nicht nur zusammen. Er verbindet deine Angaben mit den Unterlagen, zeigt offene Punkte und erklärt die mögliche weitere Richtung.
              </p>
            </div>
            <div className="how-result-list">
              {results.map(([title, text], index) => (
                <article key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{title}</h3><p>{text}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="how-preparation">
          <div className="how-inner how-preparation-grid">
            <div>
              <span className="section-label">GUT VORBEREITET</span>
              <h2>Das kannst du bereithalten.</h2>
              <p>Du musst noch nicht alles haben. Lade nur hoch, was zu deiner Situation gehört.</p>
            </div>
            <div className="how-preparation-items">
              <span><b>Wichtige Daten</b>Termine, Beträge und bisherige Reaktionen</span>
              <span><b>Vorhandene Unterlagen</b>PDF, Foto, Rechnung, Vertrag oder Schreiben</span>
              <span><b>Dein Ziel</b>Was du mit der Prüfung klären oder erreichen möchtest</span>
            </div>
          </div>
        </section>

        <section className="how-boundary">
          <div className="how-inner">
            <strong>Klare Grenze:</strong> Der Rechtsfall Check ist eine nicht abschließende Ersteinschätzung. Er ersetzt keine individuelle anwaltliche Beratung und trifft keine verbindliche Einzelfallentscheidung.
          </div>
        </section>

        <ConversionCta compact />
        <SiteFooter />
      </main>
    </div>
  );
}
