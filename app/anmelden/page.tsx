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
  const lawyerJourney = initialAccountType === "LAWYER";
  const defaultDestination = initialAccountType === "LAWYER" ? "/anwalt" : "/fallraum";
  const safeReturnTo = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : defaultDestination;
  return <><SkipLink/>{verified === "1" && <RegistrationCompleteTracking/>}<main id="main-content" tabIndex={-1} className="auth-page">
    <aside className="auth-aside"><Brand inverse/><div><span className="section-label light-label">{lawyerJourney ? "IHR KANZLEIZUGANG" : "DEIN GESCHÜTZTER PROBLEMLÖSER"}</span><h2>{lawyerJourney ? "Bereiten Sie Ihr Kanzleiprofil vollständig vor." : "Dein Problem. Deine Unterlagen. Deine Lösungsmöglichkeiten."}</h2><p>{lawyerJourney ? "Hinterlegen Sie Ihre Zulassung, Rechtsgebiete und Ihren Tätigkeitsradius für das spätere Matching." : "Schildere, was passiert ist. Unser Portal analysiert deine Angaben und Unterlagen, fragt gezielt nach und erklärt dir passende Lösungswege."}</p><div className="auth-points"><span>✓ Persönlicher geschützter Bereich</span><span>✓ Sichere Dokumenten- und OCR-Auswertung</span><span>✓ Verständliches Ergebnis im Nutzerkonto</span></div></div><small>Rechtsfall Check · Ein Fall für KI</small></aside>
    <section className="auth-main"><div className="auth-card"><Brand/><h1>{mode === "signup" ? (lawyerJourney ? "Erstellen Sie Ihr kostenloses Kanzleikonto." : "Erstelle dein kostenloses Konto.") : (lawyerJourney ? "Willkommen zurück." : "Willkommen zurück.")}</h1><p>{mode === "signup" ? (lawyerJourney ? "Registrierung und Profilanlage bleiben kostenlos. Über die Buchung entscheiden Sie erst nach der Zulassungsprüfung." : "Wähle aus, ob du Rechtsfall-Check.de als Mandant oder als Kanzlei nutzen möchtest. Die Registrierung bleibt kostenlos.") : (lawyerJourney ? "Nutzen Sie den Login, um Ihren geschützten Kanzleibereich zu öffnen." : "Logge dich ein und arbeite an deinem Problem weiter.")}</p>{mode === "signup" && <div className="auth-trust-note"><strong>Ein Konto, die richtige Umgebung</strong><span>{lawyerJourney ? "Sie können Ihr vollständiges Profil vorbereiten und entscheiden erst nach der Zulassungsprüfung über die Buchung." : "Als Mandant gelangst du direkt in deinen geschützten Bereich. Als Kanzlei bereitest du zunächst dein Profil vor."}</span></div>}{verified === "1" && <div className="auth-notice" role="status"><strong>E-Mail-Adresse bestätigt.</strong><br/>{lawyerJourney ? "Melden Sie sich jetzt mit Ihrer E-Mail-Adresse und Ihrem Passwort an." : "Logge dich jetzt mit deiner E-Mail-Adresse und deinem Passwort ein."}</div>}<AuthForm callbackURL={safeReturnTo} initialMode={mode === "signup" ? "signup" : "login"} initialAccountType={initialAccountType}/><Link className="back-link" href="/">← Zur Startseite</Link></div></section>
  </main></>;
}
