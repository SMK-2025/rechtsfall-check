import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/app/components/site-chrome";
import { SkipLink } from "@/app/components/skip-link";
import { AuthForm } from "./auth-form";
import { RegistrationCompleteTracking } from "./registration-complete-tracking";

export const metadata: Metadata = { title: "Login oder registrieren | Rechtsfall Check", robots: { index: false, follow: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; mode?: string; verified?: string }> }) {
  const { returnTo, mode, verified } = await searchParams;
  const safeReturnTo = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/fallraum";
  return <><SkipLink/>{verified === "1" && <RegistrationCompleteTracking/>}<main id="main-content" tabIndex={-1} className="auth-page">
    <aside className="auth-aside"><Brand inverse/><div><span className="section-label light-label">IHR GESCHÜTZTER FALLRAUM</span><h2>Mehr als ein KI-Chat. Ihr vollständiger Analyseprozess.</h2><p>Erfassen Sie den Sachverhalt, verbinden Sie Ihre Unterlagen und beantworten Sie nur die Rückfragen, die für Ihren Fall noch wichtig sind.</p><div className="auth-points"><span>✓ Persönliche digitale Fallakte</span><span>✓ Sichere Dokumenten- und OCR-Auswertung</span><span>✓ Finaler Rechtsfall Check im Nutzerkonto</span></div></div><small>Rechtsfall Check · Ein Fall für KI</small></aside>
    <section className="auth-main"><div className="auth-card"><Brand/><h1>{mode === "signup" ? "Legen Sie Ihre kostenlose Fallakte an." : "Willkommen zurück."}</h1><p>{mode === "signup" ? "Ihre Registrierung ist kostenlos und verpflichtet Sie zu keiner Zahlung. Den kostenpflichtigen Rechtsfall Check beauftragen Sie erst später ausdrücklich." : "Nutzen Sie den Login, um Ihre Fälle und Ergebnisse zu öffnen."}</p>{mode === "signup" && <div className="auth-trust-note"><strong>Ihr geschützter Einstieg</strong><span>Ihre Fallinformationen sind nicht öffentlich. Sie entscheiden selbst, wann Sie einen Fall kostenpflichtig prüfen lassen.</span></div>}{verified === "1" && <div className="auth-notice" role="status"><strong>E-Mail-Adresse bestätigt.</strong><br/>Melden Sie sich jetzt mit Ihrer E-Mail-Adresse und Ihrem Passwort an.</div>}<AuthForm callbackURL={safeReturnTo} initialMode={mode === "signup" ? "signup" : "login"}/><Link className="back-link" href="/">← Zur Startseite</Link></div></section>
  </main></>;
}
