import Link from "next/link";
import { Brand } from "./site-chrome";

export function MemberFooter() {
  return <div className="member-footer-wrap">
    <section className="member-security-strip" aria-label="Sicherheit des Fallraums">
      <span><b>✓</b> Verschlüsselte Übertragung</span>
      <span><b>✓</b> Kontogebundener Zugriff</span>
      <span><b>✓</b> Keine öffentliche Indexierung</span>
    </section>
    <footer className="member-footer">
      <div className="member-footer-brand">
        <Brand />
        <p>Ihr geschützter Bereich für Fallakten, Unterlagen und nicht abschließende Ersteinschätzungen.</p>
      </div>
      <nav aria-label="Rechtliche Informationen">
        <strong>Rechtliches</strong>
        <Link href="/datenschutz">Datenschutz</Link>
        <Link href="/impressum">Impressum</Link>
        <Link href="/agb">AGB</Link>
        <Link href="/barrierefreiheit">Barrierefreiheit</Link>
      </nav>
      <nav aria-label="Hilfe und Sicherheit">
        <strong>Hilfe &amp; Sicherheit</strong>
        <Link href="/sicherheit">Sicherheit</Link>
        <Link href="/fragen">Häufige Fragen</Link>
        <Link href="/support">Support-Center</Link>
        <a href="mailto:service@rechtsfall-check.de">service@rechtsfall-check.de</a>
      </nav>
      <div className="member-footer-boundary">
        <strong>Leistungsgrenze</strong>
        <p>Der Rechtsfall Check bietet eine nicht abschließende Ersteinschätzung und ersetzt keine anwaltliche Beratung.</p>
      </div>
      <small>© {new Date().getFullYear()} Rechtsfall-Check.de · Ein Fall für KI</small>
    </footer>
  </div>;
}
