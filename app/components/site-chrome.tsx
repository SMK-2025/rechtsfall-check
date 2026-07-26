import Link from "next/link";

export function Brand(){
  return <Link href="/" className="logo" aria-label="Rechtsfall KI Startseite"><span>R</span><strong>Rechtsfall</strong><em>KI</em></Link>
}

export function SiteHeader(){
  return <header className="site-nav multipage-nav"><Brand/><nav aria-label="Hauptnavigation"><Link href="/rechtsfall-check">Rechtsfall-Check</Link><Link href="/so-funktionierts">So funktioniert’s</Link><Link href="/rechtsgebiete">Rechtsgebiete</Link><Link href="/preise">Preis</Link><Link href="/sicherheit">Sicherheit</Link></nav><div className="nav-actions"><Link href="/anmelden" className="login-link">Anmelden</Link><Link href="/anmelden?mode=signup" className="button button-small">Rechtsfall-Check starten</Link></div></header>
}

export function SiteFooter(){
  return <footer className="site-footer multipage-footer"><div><Brand/><p>Rechtsfall-Check<br/>Klarheit, bevor Sie entscheiden.</p></div><div><strong>Rechtsfall-Check</strong><Link href="/rechtsfall-check">Leistungsumfang</Link><Link href="/so-funktionierts">Ablauf</Link><Link href="/preise">Preis</Link></div><div><strong>Wissen</strong><Link href="/rechtsgebiete">Rechtsgebiete</Link><Link href="/fragen">Häufige Fragen</Link><Link href="/sicherheit">Sicherheit</Link></div><div><strong>Rechtliches</strong><a href="#">Datenschutz</a><a href="#">Impressum</a><a href="#">Nutzungsbedingungen</a></div><small>© {new Date().getFullYear()} Rechtsfall KI</small></footer>
}

export function ConversionCta({compact=false}:{compact?:boolean}){
  return <section className={compact?"conversion-cta compact":"conversion-cta"}><div><span className="section-label light-label">RECHTSFALL-CHECK</span><h2>Wissen, worauf es jetzt ankommt.</h2><p>Starten Sie Ihre Vorprüfung für einmalig 39 €. Ohne Abo. Mit klarer Einordnung der nächsten Prüfschritte.</p></div><Link href="/anmelden?mode=signup" className="button button-light">Rechtsfall-Check starten <b>→</b></Link></section>
}
