import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/app/components/site-chrome";
import { SkipLink } from "@/app/components/skip-link";
import { AuthForm } from "./auth-form";
export const metadata: Metadata = { title: "Login oder registrieren | Rechtsfall Check", robots: { index: false, follow: false } };
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; mode?: string }> }) {
  const { returnTo,mode } = await searchParams;
  const safeReturnTo = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/fallraum";
  return <><SkipLink/><main id="main-content" tabIndex={-1} className="auth-page">
    <aside className="auth-aside"><Brand inverse/><div><span className="section-label light-label">IHR GESCHÜTZTER FALLRAUM</span><h2>Alles zu Ihrem Fall. Sicher an einem Ort.</h2><p>Erfassen Sie Ihren Sachverhalt, laden Sie Unterlagen hoch und verfolgen Sie den Stand Ihrer Analyse.</p><div className="auth-points"><span>✓ Persönliche Fallakte</span><span>✓ Kontogebundener Dokumentenzugriff</span><span>✓ Ergebnisse jederzeit abrufbar</span></div></div><small>Rechtsfall Check · Klarheit, bevor Sie entscheiden.</small></aside>
    <section className="auth-main"><div className="auth-card"><Brand/><h1>{mode==="signup"?"Ihr Konto erstellen.":"Willkommen zurück."}</h1><p>{mode==="signup"?"Starten Sie kostenlos. Bezahlt wird erst, wenn Sie eine Fallprüfung beauftragen.":"Nutzen Sie den Login, um Ihre Fälle und Ergebnisse zu öffnen."}</p><AuthForm callbackURL={safeReturnTo} initialMode={mode==="signup"?"signup":"login"}/><Link className="back-link" href="/">← Zur Startseite</Link></div></section>
  </main></>;
}
