import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rechtsfall KI | Dokumentengestützte Orientierung für Rechtsfälle",
  description:
    "Rechtsfall KI strukturiert Ihren Rechtsfall, ordnet Unterlagen und zeigt belegte Fakten, offene Fragen, mögliche Fristen und relevante Quellen – ohne abschließende Rechtsberatung.",
  alternates: { canonical: "/" },
};

const faq = [
  {
    question: "Was ist Rechtsfall KI?",
    answer:
      "Rechtsfall KI ist ein digitaler Rechts-Kompass. Die Plattform strukturiert Ihre Fallschilderung und Unterlagen, trennt belegte Fakten von offenen Behauptungen und zeigt, welche Informationen für eine weitere Prüfung fehlen.",
  },
  {
    question: "Ersetzt Rechtsfall KI einen Rechtsanwalt?",
    answer:
      "Nein. Rechtsfall KI gibt keine abschließende Rechtsberatung, keine verbindliche Handlungsanweisung und keine autonome finale Einzelfallentscheidung. Wenn eine individuelle Rechtsbewertung erforderlich ist, muss ein verantworteter anwaltlicher Prüfpfad beginnen.",
  },
  {
    question: "Welche Unterlagen kann ich verwenden?",
    answer:
      "Der technische Zielprozess ist für Verträge, Rechnungen, E-Mails, Schreiben und weitere fallbezogene Dokumente ausgelegt. Im aktuellen MVP ist der produktive Dokumenten- und OCR-Betrieb noch nicht freigegeben.",
  },
  {
    question: "Was erhalte ich als Ergebnis?",
    answer:
      "Die standardisierte Orientierung trennt fünf Bereiche: Was die Akte belegt, was ungeklärt ist, welche Quellen relevant sein könnten, was daraus bedingt folgen könnte und welche Gegenargumente oder Belege fehlen.",
  },
];

const capabilities = [
  ["01", "Fakten statt Vermutungen", "Ihre Schilderung und Dokumente werden in einzelne Tatsachen zerlegt. Jede Aussage erhält einen sichtbaren Belegstatus."],
  ["02", "Rückfragen statt Lücken", "Das System erkennt fehlende Angaben und Widersprüche, bevor eine Orientierung formuliert wird."],
  ["03", "Quellen statt Blackbox", "Mögliche Rechtsquellen werden mit Stand und Reichweite getrennt von den Tatsachen ausgewiesen."],
  ["04", "Nicht-Antwort statt Scheinsicherheit", "Bei fehlenden Kernbelegen, Fristrisiken oder hoher Tragweite wird die Ausgabe gesperrt oder eskaliert."],
];

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://rechtsfall-ki-mvp.r-k-com.chatgpt.site/#organization",
        name: "Rechtsfall KI",
        url: "https://rechtsfall-ki-mvp.r-k-com.chatgpt.site/",
        description: "Digitale, dokumentengestützte Rechtsorientierung für Verbraucher in Deutschland.",
      },
      {
        "@type": "WebApplication",
        "@id": "https://rechtsfall-ki-mvp.r-k-com.chatgpt.site/#application",
        name: "Rechtsfall KI",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        inLanguage: "de-DE",
        audience: { "@type": "Audience", audienceType: "Verbraucher in Deutschland" },
        description: "Sicherer Fallraum zur strukturierten Aufbereitung von Rechtsfällen und Dokumenten.",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", description: "MVP-Testzugang" },
        provider: { "@id": "https://rechtsfall-ki-mvp.r-k-com.chatgpt.site/#organization" },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <div className="marketing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="marketing-nav">
        <Link className="brand" href="/" aria-label="Rechtsfall KI Startseite">
          <span className="brand-mark">R</span>Rechtsfall KI
        </Link>
        <nav aria-label="Hauptnavigation">
          <a href="#so-funktionierts">So funktioniert&apos;s</a>
          <a href="#sicherheit">Sicherheit</a>
          <a href="#faq">FAQ</a>
        </nav>
        <Link className="nav-cta" href="/fallraum">Fallraum öffnen</Link>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Die digitale Rechtsakte für Verbraucher</p>
            <h1>Verstehen, was Ihr Rechtsfall wirklich zeigt.</h1>
            <p className="hero-lead">
              Schildern Sie Ihren Fall und ordnen Sie Ihre Unterlagen. Rechtsfall KI macht belegte Fakten,
              offene Fragen, mögliche Fristen und relevante Quellen sichtbar – bevor Sie entscheiden, ob
              eine anwaltliche Prüfung nötig ist.
            </p>
            <div className="hero-actions">
              <Link className="primary hero-primary" href="/fallraum">Fall strukturiert erfassen <span>→</span></Link>
              <a className="text-link" href="#grenze">Was die Plattform leisten darf</a>
            </div>
            <p className="hero-note">MVP-Testbetrieb · keine abschließende Rechtsberatung · Deutschland</p>
          </div>
          <div className="case-visual" aria-label="Beispiel einer strukturierten digitalen Fallakte">
            <div className="visual-top"><span>Digitale Fallakte</span><span className="status">Strukturiert</span></div>
            <div className="case-title">Kaufvertrag · mangelhafte Ware</div>
            <div className="evidence-row"><span className="evidence-icon confirmed">✓</span><div><strong>Durch Dokument belegt</strong><p>Bestellung und Kaufpreis</p></div><span className="source-tag">Beleg 01</span></div>
            <div className="evidence-row"><span className="evidence-icon open">?</span><div><strong>Noch ungeklärt</strong><p>Zeitpunkt der Mängelanzeige</p></div><span className="source-tag muted-tag">Rückfrage</span></div>
            <div className="evidence-row"><span className="evidence-icon source">§</span><div><strong>Mögliche Prüfgrundlage</strong><p>Quellenstand wird ausgewiesen</p></div><span className="source-tag">Quelle *</span></div>
            <div className="visual-gate"><span>Qualitätsgate</span><strong>Keine Folgerung ohne Fakten- und Quellenanker</strong></div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Produktgrundsätze">
          <span>Geschützter Fallraum</span><span>Beleggebundene Analyse</span><span>Klare Unsicherheiten</span><span>Nachvollziehbare Quellen</span>
        </section>

        <section className="section intro-section" id="so-funktionierts">
          <div className="section-kicker">Vom Dokumentenstapel zur klaren Fallakte</div>
          <div className="section-title-row">
            <h2>Die erste 80-Prozent-Arbeit – sauber vorbereitet.</h2>
            <p>Rechtsfall KI ersetzt nicht die verantwortete Rechtsbewertung. Die Plattform automatisiert die aufwendige Vorarbeit, die vor einer belastbaren Einordnung nötig ist.</p>
          </div>
          <div className="capability-grid">
            {capabilities.map(([number,title,text]) => <article className="capability-card" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>

        <section className="process-section">
          <div>
            <p className="section-kicker">So funktioniert&apos;s</p>
            <h2>Eine verständliche Nutzerreise. Klare technische Grenzen.</h2>
          </div>
          <ol className="process-list">
            <li><span>1</span><div><h3>Fall in Alltagssprache schildern</h3><p>Sie beschreiben, was passiert ist, ohne juristische Begriffe kennen zu müssen.</p></div></li>
            <li><span>2</span><div><h3>Unterlagen strukturiert zuordnen</h3><p>Dokumente, Parteien, Daten, Beträge und Aussagen werden als überprüfbare Informationen erfasst.</p></div></li>
            <li><span>3</span><div><h3>Offene Punkte beantworten</h3><p>Neutrale Rückfragen klären fehlende Tatsachen und machen Widersprüche sichtbar.</p></div></li>
            <li><span>4</span><div><h3>Orientierung mit Grenzen erhalten</h3><p>Die Ausgabe zeigt Beleglage, offene Punkte, mögliche Quellen und Risiken – oder antwortet bewusst nicht.</p></div></li>
          </ol>
        </section>

        <section className="boundary-section" id="grenze">
          <div className="boundary-copy">
            <p className="section-kicker light">Die rechtliche Grenze ist Teil des Produkts</p>
            <h2>Orientierung ja. Autonome finale Rechtsmeinung nein.</h2>
            <p>Ein allgemeiner Hinweis allein genügt nicht. Entscheidend ist, was das System tatsächlich ausgibt. Deshalb trennt Rechtsfall KI Tatsachen, Quellen und bedingte Möglichkeiten sichtbar voneinander.</p>
          </div>
          <div className="boundary-grid">
            <div><span className="yes">Möglich</span><ul><li>Dokumente und Zeitachsen strukturieren</li><li>Faktenlücken und Widersprüche erkennen</li><li>Quellen mit Geltungsstand anzeigen</li><li>Bedingte Prüfmöglichkeiten erklären</li></ul></div>
            <div><span className="no">Nicht autonom</span><ul><li>Ansprüche verbindlich feststellen</li><li>Klage oder Vergleich empfehlen</li><li>Prozesschancen final bewerten</li><li>Anwaltliche Haftung oder Vertretung ersetzen</li></ul></div>
          </div>
        </section>

        <section className="section security-section" id="sicherheit">
          <div><p className="section-kicker">Sicherheit &amp; Vertraulichkeit</p><h2>Für sensible Fallakten von Anfang an mitgedacht.</h2></div>
          <div className="security-copy">
            <p>Der Zielbetrieb sieht getrennte Mandantenbereiche, verschlüsselte Speicherung, unveränderte Originaldateien, rollenbasierte Zugriffe, Audit-Protokolle und nachvollziehbare Löschfristen vor.</p>
            <p className="pilot-warning"><strong>Transparenz im MVP:</strong> Der produktive OCR-, Dokumenten- und Rechtsquellenbetrieb ist noch nicht freigegeben. Testen Sie die Vorschau nicht mit echten vertraulichen Unterlagen.</p>
          </div>
        </section>

        <section className="section faq-section" id="faq">
          <div><p className="section-kicker">Häufige Fragen</p><h2>Kurz und eindeutig beantwortet.</h2></div>
          <div className="faq-list">{faq.map((item) => <details key={item.question}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}</div>
        </section>

        <section className="final-cta">
          <p className="eyebrow">Ihr Fall. Klarer vorbereitet.</p>
          <h2>Beginnen Sie mit den Fakten.</h2>
          <p>Erfassen Sie einen Testfall und erleben Sie, wie aus einer ungeordneten Schilderung eine nachvollziehbare Fallakte entsteht.</p>
          <Link className="primary hero-primary" href="/fallraum">Zum geschützten Fallraum <span>→</span></Link>
        </section>
      </main>

      <footer>
        <Link className="brand footer-brand" href="/"><span className="brand-mark">R</span>Rechtsfall KI</Link>
        <p>Digitale Rechtsorientierung · MVP-Testbetrieb</p>
        <div><a href="#grenze">Leistungsgrenzen</a><a href="#sicherheit">Datenschutz-Hinweise</a><a href="#faq">FAQ</a></div>
      </footer>
    </div>
  );
}
