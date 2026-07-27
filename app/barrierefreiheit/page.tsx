import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../components/site-chrome";
import "../legal-pages.css";

export const metadata: Metadata = {
  title: "Barrierefreiheit | Rechtsfall-Check.de",
  description: "Informationen zur barrierefreien Nutzung des Rechtsfall Checks und zu unserem aktuellen Umsetzungsstand.",
};

export default function AccessibilityPage(){
  return <div className="site"><SiteHeader/><main id="main-content" tabIndex={-1}>
    <section className="legal-hero"><div><span className="section-label light-label">BARRIEREFREIHEIT</span><h1>Einfach zugänglich. Für möglichst alle Menschen.</h1><p>Wir entwickeln Rechtsfall-Check.de so, dass die Fallprüfung auch mit Tastatur, assistiven Technologien und unterschiedlichen Darstellungsbedürfnissen nutzbar ist.</p></div></section>
    <article className="legal-page section-wrap">
      <div className="legal-intro"><p><strong>Stand: 27. Juli 2026</strong></p><p>Diese Information beschreibt den aktuellen Stand der Barrierefreiheit unseres digitalen Rechtsfall Checks. Sie ist zugleich die verständliche Beschreibung der angebotenen Dienstleistung und ihrer barrierefreien Nutzung.</p></div>

      <section><h2>1. Angebot und Nutzung</h2><p>Rechtsfall-Check.de ist eine digitale Dienstleistung zur strukturierten Vorprüfung rechtlicher Anliegen. Nutzer können ein Konto erstellen, einen Fall in verständlicher Sprache erfassen, Dokumente hochladen, Rückfragen beantworten, die Fallprüfung bezahlen und eine nicht abschließende Ersteinschätzung im geschützten Nutzerkonto abrufen.</p><p>Die wesentlichen Funktionen können über die sichtbare Navigation, das mobile Menü oder direkt per Tastatur erreicht werden. Formularfelder besitzen Beschriftungen, Status- und Fehlermeldungen werden als solche ausgegeben und der Hauptinhalt kann über den Link „Direkt zum Inhalt“ angesprungen werden.</p></section>

      <section><h2>2. Maßstab und aktueller Stand</h2><p>Unser Ziel ist die Konformität mit den Anforderungen des Barrierefreiheitsstärkungsgesetzes (BFSG), der Barrierefreiheitsstärkungsverordnung (BFSGV), der europäischen Norm EN 301 549 und den Web Content Accessibility Guidelines (WCAG) 2.2 auf Konformitätsstufe AA.</p><p>Nach unserer derzeitigen Selbstbewertung ist das Angebot <strong>teilweise konform</strong>. Die zentralen Wege – Information, Registrierung, Login, Fallaufnahme, Dokumentenauswahl und Ergebnisdarstellung – werden fortlaufend geprüft. Eine unabhängige vollständige Barrierefreiheitsprüfung steht noch aus.</p></section>

      <section><h2>3. Bereits umgesetzte Maßnahmen</h2><ul>
        <li>semantische Überschriften, Navigationen, Hauptbereiche und Formularbeschriftungen,</li>
        <li>vollständige Bedienbarkeit der zentralen Funktionen per Tastatur,</li>
        <li>deutlich sichtbare Fokusmarkierung und Sprunglink zum Hauptinhalt,</li>
        <li>ausreichend große Bedienelemente für mobile und motorisch eingeschränkte Nutzung,</li>
        <li>verständliche Fehler-, Status- und Bestätigungsmeldungen für assistive Technologien,</li>
        <li>skalierbare, responsive Darstellung ohne erzwungene horizontale Nutzung,</li>
        <li>reduzierte Animationen, wenn dies im Betriebssystem eingestellt ist,</li>
        <li>Alternativtexte für inhaltlich relevante Grafiken und verständliche Linkbezeichnungen.</li>
      </ul></section>

      <section><h2>4. Bekannte Einschränkungen</h2><p>Folgende Bereiche können derzeit noch Einschränkungen aufweisen:</p><ul>
        <li>Vom Nutzer hochgeladene PDF-Dateien, Fotos oder Scans können selbst nicht barrierefrei aufgebaut sein. Die Plattform kann deren ursprüngliche Zugänglichkeit nicht verändern.</li>
        <li>Die Zahlungsseite wird teilweise durch einen externen Zahlungsdienst bereitgestellt. Deren konkrete Darstellung und Bedienbarkeit liegt nicht vollständig in unserem Einflussbereich.</li>
        <li>Einzelne automatisch erzeugte Inhalte können trotz strukturierter Ausgabe sprachlich oder technisch noch nicht in jeder Situation optimal zugänglich sein.</li>
        <li>Ältere oder noch nicht öffentlich freigegebene Funktionsbereiche werden vor ihrer Veröffentlichung weiter geprüft.</li>
      </ul><p>Wir priorisieren Hindernisse, die Registrierung, Bezahlung, Fallaufnahme oder den Zugang zum Ergebnis verhindern.</p></section>

      <section><h2>5. Feedback und Unterstützung</h2><p>Wenn Sie auf eine Barriere stoßen oder Inhalte in einer besser zugänglichen Form benötigen, teilen Sie uns bitte mit, auf welcher Seite und bei welchem Schritt das Problem auftritt. Wir bemühen uns um eine zeitnahe, passende Lösung.</p><address><strong>Media Online Innovations Group</strong><br/>Inhaber: Martin Kelm<br/>Im Weidenblech 25<br/>51371 Leverkusen<br/>Deutschland<br/>E-Mail: <a href="mailto:mail@media-online-innovations.group">mail@media-online-innovations.group</a><br/>Telefon: <a href="tel:+4921433014060">0214 / 330 140 60</a></address></section>

      <section><h2>6. Erstellung und Überprüfung</h2><p>Diese Information wurde am 27. Juli 2026 auf Grundlage einer technischen Selbstbewertung erstellt. Sie wird bei wesentlichen Produktänderungen und nach weiteren Prüfungen aktualisiert.</p></section>
    </article>
    <SiteFooter/>
  </main></div>
}
