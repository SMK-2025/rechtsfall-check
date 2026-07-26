import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Rechtsfall KI – Klarheit für Ihren Rechtsfall",
  description: "Unterlagen hochladen, Fragen beantworten und eine verständliche KI-gestützte Ersteinschätzung mit Quellen, offenen Punkten und nächsten Prüfschritten erhalten.",
  alternates: { canonical: "/" },
};

const faqs = [
  ["Ist Rechtsfall KI eine Kanzlei?", "Nein. Rechtsfall KI bereitet Ihren Fall strukturiert auf und liefert eine nicht abschließende Ersteinschätzung. Eine verbindliche Rechtsberatung oder Vertretung erfolgt ausschließlich durch zugelassene Rechtsanwältinnen und Rechtsanwälte."],
  ["Was ist im Preis enthalten?", "Enthalten sind die digitale Fallaufnahme, Dokumenten-Upload, strukturierte Analyse, Rückfragen sowie Ihre persönliche Ersteinschätzung im geschützten Fallraum."],
  ["Wie sicher sind meine Unterlagen?", "Dokumente werden getrennt von den Falldaten in einem privaten Speicher abgelegt. Zugriffe sind kontogebunden und werden protokolliert. Vor dem Marktstart werden zusätzlich Löschkonzept, Auftragsverarbeitung und Sicherheitsprüfung abgeschlossen."],
  ["Was passiert, wenn mein Fall zu komplex ist?", "Dann gibt das System keine scheinbar sichere Antwort aus. Es zeigt transparent, welche Punkte offen sind und wann eine anwaltliche Prüfung erforderlich ist."],
];

export default function Home() {
  const siteUrl = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${siteUrl}/#organization`, name: "Rechtsfall KI", url: siteUrl },
      { "@type": "Service", "@id": `${siteUrl}/#service`, name: "Digitale Fallprüfung", provider: { "@id": `${siteUrl}/#organization` }, areaServed: "DE", offers: { "@type": "Offer", price: "39.00", priceCurrency: "EUR" } },
      { "@type": "FAQPage", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
    ],
  };

  return <div className="site">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <header className="site-nav">
      <Link href="/" className="logo" aria-label="Rechtsfall KI Startseite"><span>R</span><strong>Rechtsfall</strong><em>KI</em></Link>
      <nav><a href="#ablauf">So funktioniert’s</a><a href="#leistung">Ihre Analyse</a><a href="#preis">Preis</a><a href="#fragen">Fragen</a></nav>
      <div className="nav-actions"><Link href="/anmelden" className="login-link">Anmelden</Link><Link href="/anmelden?mode=signup" className="button button-small">Fall prüfen</Link></div>
    </header>

    <main>
      <section className="product-hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="trust-pill"><span>●</span> Persönliche Fallanalyse in wenigen Schritten</div>
          <h1>Ihr Rechtsfall.<br/><span>Endlich verständlich.</span></h1>
          <p>Schildern Sie, was passiert ist. Laden Sie Ihre Unterlagen hoch. Rechtsfall KI ordnet Fakten, erkennt Lücken und erstellt Ihre verständliche Ersteinschätzung.</p>
          <div className="hero-buttons"><Link href="/anmelden?mode=signup" className="button button-large">Jetzt Fall prüfen <b>→</b></Link><a href="#ablauf" className="button-secondary">So funktioniert es <span>↓</span></a></div>
          <div className="hero-assurances"><span>✓ Einmalig 39 €</span><span>✓ Geschützter Fallraum</span><span>✓ Kein Abo</span></div>
        </div>
        <div className="product-preview" aria-label="Vorschau einer Fallanalyse">
          <div className="preview-bar"><div className="mini-logo">R</div><span>Ihre Fallanalyse</span><small>Analyse läuft</small></div>
          <div className="preview-case"><div><small>KAUFRECHT</small><h3>Defektes Notebook nach Lieferung</h3></div><span className="score-ring">74<small>%</small></span></div>
          <div className="analysis-progress"><span style={{width:"74%"}} /></div>
          <div className="preview-grid">
            <div className="preview-stat green"><i>✓</i><strong>6</strong><span>Fakten belegt</span></div>
            <div className="preview-stat amber"><i>?</i><strong>2</strong><span>Fragen offen</span></div>
            <div className="preview-stat blue"><i>§</i><strong>3</strong><span>Quellen relevant</span></div>
          </div>
          <div className="preview-insight"><span className="spark">✦</span><div><small>VORLÄUFIGE EINORDNUNG</small><p>Die Unterlagen enthalten konkrete Anhaltspunkte für mögliche Gewährleistungsrechte. Zwei Angaben fehlen noch für eine belastbarere Einordnung.</p></div></div>
          <div className="preview-bottom"><span><i/> Automatisch gespeichert</span><b>Analyse fortsetzen →</b></div>
        </div>
      </section>

      <section className="credibility">
        <p>Entwickelt für Menschen, die vor dem nächsten Schritt Klarheit brauchen</p>
        <div><span>🔒 Datenschutzorientiert</span><span>◆ Nachvollziehbare Analyse</span><span>§ Klare Rechtsgrenzen</span><span>✓ Keine versteckten Kosten</span></div>
      </section>

      <section className="how section-wrap" id="ablauf">
        <div className="section-heading"><span className="section-label">EINFACH STARTEN</span><h2>Vom Problem zur klaren<br/>Ersteinschätzung.</h2><p>Kein Juristendeutsch, kein Dokumentenchaos. Wir führen Sie Schritt für Schritt durch Ihren Fall.</p></div>
        <div className="steps-modern">
          <article><span>01</span><div className="step-icon">✎</div><h3>Fall schildern</h3><p>Erzählen Sie in Ihren eigenen Worten, was passiert ist. Geführte Fragen helfen Ihnen dabei.</p></article>
          <article><span>02</span><div className="step-icon">↥</div><h3>Unterlagen hochladen</h3><p>Verträge, Schreiben, Rechnungen oder E-Mails sicher an einem Ort zusammenführen.</p></article>
          <article><span>03</span><div className="step-icon">✦</div><h3>Analyse erhalten</h3><p>Sie sehen belegte Fakten, offene Fragen, mögliche Fristen und eine verständliche Einordnung.</p></article>
        </div>
      </section>

      <section className="analysis-showcase section-wrap" id="leistung">
        <div className="showcase-card">
          <div className="document-stack"><div className="doc-back"/><div className="doc-front"><span>KAUFVERTRAG</span><i/><i/><i/><b>✓ 8 Angaben erkannt</b></div><div className="ai-badge">✦</div></div>
          <div className="showcase-copy"><span className="section-label light-label">MEHR ALS EINE SCHNELLE KI-ANTWORT</span><h2>Eine Analyse, die zeigt,<br/>wie sie zu ihrem Ergebnis kommt.</h2><p>Rechtsfall KI verbindet Ihre Schilderung mit den hochgeladenen Unterlagen. Jede wichtige Aussage wird als belegt, unklar oder offen gekennzeichnet.</p><ul><li><b>Fakten &amp; Zeitachse</b><span>Was ist wann passiert – und wodurch ist es belegt?</span></li><li><b>Offene Punkte</b><span>Welche Information fehlt für eine bessere Einschätzung?</span></li><li><b>Mögliche Rechtsgrundlagen</b><span>Welche geprüften Quellen können relevant sein?</span></li><li><b>Klare Grenzen</b><span>Wo ist eine anwaltliche Prüfung notwendig?</span></li></ul></div>
        </div>
      </section>

      <section className="pricing section-wrap" id="preis">
        <div className="section-heading centered"><span className="section-label">KLARER PREIS</span><h2>Eine Fallprüfung. Alles enthalten.</h2><p>Sie bezahlen einmalig pro Fall. Kein Abo, keine automatische Verlängerung.</p></div>
        <div className="price-card">
          <div className="price-top"><div><small>DIGITALE FALLPRÜFUNG</small><h3>Ihre persönliche Ersteinschätzung</h3></div><div className="price"><strong>39</strong><span>€<small>einmalig</small></span></div></div>
          <div className="price-features"><span>✓ Geführte Fallaufnahme</span><span>✓ Sicherer Dokumenten-Upload</span><span>✓ KI-gestützte Aktenanalyse</span><span>✓ Intelligente Rückfragen</span><span>✓ Strukturierte Ersteinschätzung</span><span>✓ Dauerhafter Zugriff im Profil</span></div>
          <Link href="/anmelden?mode=signup" className="button button-full">Fallprüfung starten <b>→</b></Link>
          <p>Sichere Zahlung über unseren Zahlungsdienstleister · Rechnung per E-Mail</p>
        </div>
      </section>

      <section className="boundary section-wrap">
        <div><span className="section-label">TRANSPARENT VON ANFANG AN</span><h2>Orientierung, ohne falsche Sicherheit.</h2></div>
        <div><p>Rechtsfall KI liefert eine strukturierte, nicht abschließende Ersteinschätzung. Wir geben keine verbindliche Rechtsberatung und treffen keine endgültige Entscheidung über Ansprüche oder Erfolgsaussichten.</p><p>Wenn die Faktenlage nicht ausreicht oder Ihr Fall anwaltliche Prüfung benötigt, sagen wir das klar – statt eine scheinbar sichere Antwort zu erzeugen.</p></div>
      </section>

      <section className="faq section-wrap" id="fragen">
        <div className="section-heading"><span className="section-label">HÄUFIGE FRAGEN</span><h2>Was Sie vor dem Start wissen sollten.</h2></div>
        <div className="faq-list">{faqs.map(([q,a])=><details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div>
      </section>

      <section className="closing-cta"><div><span className="section-label light-label">BEREIT FÜR MEHR KLARHEIT?</span><h2>Bringen Sie Ordnung<br/>in Ihren Rechtsfall.</h2><p>Starten Sie jetzt mit Ihrer persönlichen Fallprüfung.</p><Link href="/anmelden?mode=signup" className="button button-light">Fallprüfung starten <b>→</b></Link></div><div className="closing-orbit"><span>R</span><i/><b>§</b><em>✓</em></div></section>
    </main>

    <footer className="site-footer"><div><Link href="/" className="logo footer-logo"><span>R</span><strong>Rechtsfall</strong><em>KI</em></Link><p>Verstehen, bevor Sie entscheiden.</p></div><div><strong>Produkt</strong><a href="#ablauf">So funktioniert’s</a><a href="#preis">Preis</a><Link href="/anmelden">Anmelden</Link></div><div><strong>Rechtliches</strong><a href="#fragen">Leistungsgrenzen</a><a href="#">Datenschutz</a><a href="#">Impressum</a></div><small>© {new Date().getFullYear()} Rechtsfall KI</small></footer>
  </div>;
}
