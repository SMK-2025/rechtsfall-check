import type { Metadata } from "next";
import { Brand } from "@/app/components/site-chrome";
import { SkipLink } from "@/app/components/skip-link";
import { TwoFactorChallenge } from "./two-factor-challenge";

export const metadata: Metadata = { title: "Sicherheitscode | Rechtsfall Check", robots: { index: false, follow: false } };

export default function TwoFactorPage() {
  return <><SkipLink/><main id="main-content" tabIndex={-1} className="auth-page">
    <aside className="auth-aside"><Brand inverse/><div><span className="section-label light-label">ZUSÄTZLICHER KONTOSCHUTZ</span><h2>Deine Daten verdienen eine zweite Sicherung.</h2><p>Bestätige diesen Login mit dem aktuellen Code aus deiner Authenticator-App.</p></div><small>Rechtsfall Check · Ein Fall für KI</small></aside>
    <section className="auth-main"><div className="auth-card"><Brand/><span className="section-label">ZWEI-FAKTOR-ANMELDUNG</span><h1>Sicherheitscode eingeben.</h1><p>Die erste Anmeldestufe war erfolgreich. Jetzt fehlt nur noch dein zweiter Faktor.</p><TwoFactorChallenge/></div></section>
  </main></>;
}
