import Link from "next/link";
import Image from "next/image";

export function Brand({ inverse=false }: { inverse?: boolean }){
  return <Link href="/" className={`logo brand-logo${inverse?" brand-logo-inverse":""}`} aria-label="Rechtsfall-Check.de – Ein Fall für KI – Startseite"><Image src="/rechtsfall-check-logo.png" alt="Rechtsfall-Check.de – Ein Fall für KI" width={8000} height={2000} priority/></Link>
}

export function SiteHeader(){
  return <header className="site-nav multipage-nav"><Brand/><nav aria-label="Hauptnavigation"><Link href="/rechtsfall-check">Rechtsfall Check</Link><Link href="/so-funktionierts">So funktioniert’s</Link><Link href="/rechtsgebiete">Rechtsgebiete</Link><Link href="/preise">Preis</Link><Link href="/sicherheit">Sicherheit</Link></nav><div className="nav-actions"><Link href="/anmelden" className="login-link">Anmelden</Link><Link href="/anmelden?mode=signup" className="button button-small">Rechtsfall Check starten</Link></div></header>
}

export function SiteFooter(){
  return <footer className="site-footer multipage-footer"><div><Brand/></div><div><strong>Rechtsfall Check</strong><Link href="/rechtsfall-check">Leistungsumfang</Link><Link href="/so-funktionierts">Ablauf</Link><Link href="/preise">Preis</Link></div><div><strong>Wissen</strong><Link href="/rechtsgebiete">Rechtsgebiete</Link><Link href="/fragen">Häufige Fragen</Link><Link href="/sicherheit">Sicherheit</Link></div><div><strong>Rechtliches</strong><a href="#">Datenschutz</a><a href="#">Impressum</a><a href="#">Nutzungsbedingungen</a></div><small>© {new Date().getFullYear()} Rechtsfall Check</small></footer>
}

export function ConversionCta({compact=false}:{compact?:boolean}){
  return <section className={compact?"conversion-cta compact":"conversion-cta"}><div><span className="section-label light-label">RECHTSFALL CHECK</span><h2>Wissen, worauf es jetzt ankommt.</h2><p>Starten Sie Ihre Vorprüfung für einmalig 39 €. Ohne Abo. Mit klarer Einordnung der nächsten Prüfschritte.</p></div><Link href="/anmelden?mode=signup" className="button button-light">Rechtsfall Check starten <b>→</b></Link></section>
}
