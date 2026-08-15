import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "./mobile-menu";
import { SkipLink } from "./skip-link";
import { CookieSettingsButton } from "./analytics-consent";
import { PublicSignupLink } from "./public-signup-link";

export function Brand({ inverse=false }: { inverse?: boolean }){
  return <Link href="/" className={`logo brand-logo${inverse?" brand-logo-inverse":""}`} aria-label="Rechtsfall-Check.de – Ein Fall für KI – Startseite"><Image src="/rechtsfall-check-logo.png" alt="Rechtsfall-Check.de – Ein Fall für KI" width={8000} height={2000} priority/></Link>
}

export function SiteHeader(){
  return <><SkipLink/><header className="site-nav multipage-nav"><Brand/><nav aria-label="Hauptnavigation"><Link href="/rechtsfall-check">Rechtsfall Check</Link><Link href="/so-funktionierts">So funktioniert’s</Link><Link href="/rechtsgebiete">Rechtsgebiete</Link><Link href="/preise">Preis</Link><Link href="/sicherheit">Sicherheit</Link></nav><div className="nav-actions"><Link href="/anmelden" className="login-link">Login</Link><PublicSignupLink className="button button-small">Kostenlose Fallakte anlegen</PublicSignupLink></div><MobileMenu/></header></>
}

export function SiteFooter(){
  return <footer className="site-footer multipage-footer"><div><Brand/><Image className="footer-partner-badge" src="/bayer-04-netzwerkpartner.png" alt="Bayer 04 Netzwerkpartner" width={1536} height={1307}/></div><div><strong>Rechtsfall Check</strong><Link href="/rechtsfall-check">Leistungsumfang</Link><Link href="/so-funktionierts">Ablauf</Link><Link href="/preise">Preis</Link></div><div><strong>Wissen</strong><Link href="/rechtsgebiete">Rechtsgebiete</Link><Link href="/fragen">Häufige Fragen</Link><Link href="/sicherheit">Sicherheit</Link></div><div><strong>Rechtliches</strong><Link href="/datenschutz">Datenschutz</Link><Link href="/impressum">Impressum</Link><Link href="/agb">AGB</Link><Link href="/barrierefreiheit">Barrierefreiheit</Link><CookieSettingsButton/></div><small>© {new Date().getFullYear()} Rechtsfall Check</small></footer>
}

export function ConversionCta({compact=false}:{compact?:boolean}){
  return <section className={compact?"conversion-cta compact":"conversion-cta"}><div><span className="section-label light-label">IHR DIGITALER RECHTSFALL CHECK</span><h2>Legen Sie zuerst kostenlos Ihre Fallakte an.</h2><p>Die Registrierung ist kostenlos und verpflichtet Sie zu keiner Zahlung. Erst wenn Sie den Rechtsfall Check ausdrücklich beauftragen, zahlen Sie einmalig 19 €. Kein Abo.</p></div><PublicSignupLink className="button button-light">Kostenlose Fallakte anlegen <b>→</b></PublicSignupLink></section>
}
