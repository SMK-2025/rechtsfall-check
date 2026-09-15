import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/app/components/site-chrome";
import { SkipLink } from "@/app/components/skip-link";
import { AuthForm } from "./auth-form";
import { RegistrationCompleteTracking } from "./registration-complete-tracking";

export const metadata: Metadata = { title: "Login oder registrieren | Rechtsfall Check", robots: { index: false, follow: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; mode?: string; verified?: string; accountType?: string }> }) {
  const { returnTo, mode, verified, accountType } = await searchParams;
  const initialAccountType = accountType === "LAWYER" ? "LAWYER" : accountType === "MEMBER" ? "MEMBER" : "";
  const defaultDestination = initialAccountType === "LAWYER" ? "/anwalt" : "/fallraum";
  const safeReturnTo = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : defaultDestination;
  return <><SkipLink/>{verified === "1" && <RegistrationCompleteTracking/>}<main id="main-content" tabIndex={-1} className="auth-page">
    <aside className="auth-aside"><Brand inverse/><div><span className="section-label light-label">IHR GESCHÜTZTER FALLRAUM</span><h2>Mehr als ein KI-Chat. Ihr vollständiger Analyseprozess.</h2><p>Erfassen Sie den Sachverhalt, verbinden Sie Ihre Unterlagen und beantworten Sie nur die Rückfragen, die für Ihren Fall noch wichtig sind.</p><div className="auth-points"><span>✓ Persönliche digitale Fallakte</span><span>✓ Sichere Dokumenten- und OCR-Auswertung</span><span>✓ Finaler Rechtsfall Check im Nutzerkonto</span></div></div><small>Rechtsfall Check · Ein Fall für KI</small></aside>
    <section className="auth-main"><div className="auth-card"><Brand/><h1>{mode === "signup" ? "Erstellen Sie Ihr kostenloses Konto." : "Willkommen zurück."}</h1><p>{mode === "signup" ? "Wählen Sie zuerst, ob Sie Rechtsfall-Check.de als Mandant oder als Kanzlei nutzen möchten. Registrierung und Profilanlage bleiben kostenlos." : "Nutzen Sie den Login, um Ihren geschützten Bereich zu öffnen."}</p>{mode === "signup" && <div className="auth-trust-note"><strong>Ein Konto, die richtige Umgebung</strong><span>Mandanten gelangen in ihre Fallakte. Kanzleien können ihr vollständiges Profil vorbereiten und entscheiden erst nach der Zulassungsprüfung über die Buchung.</span></div>}{verified === "1" && <div className="auth-notice" role="status"><strong>E-Mail-Adresse bestätigt.</strong><br/>Melden Sie sich jetzt mit Ihrer E-Mail-Adresse und Ihrem Passwort an.</div>}<AuthForm callbackURL={safeReturnTo} initialMode={mode === "signup" ? "signup" : "login"} initialAccountType={initialAccountType}/><Link className="back-link" href="/">← Zur Startseite</Link></div></section>
  </main></>;
}
