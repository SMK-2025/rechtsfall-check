import type { Metadata } from "next";
import Link from "next/link";
import { SignInButton } from "./sign-in-button";
export const metadata: Metadata = { title: "Anmelden | Rechtsfall KI", robots: { index: false, follow: false } };
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  const safeReturnTo = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/fallraum";
  return <main className="auth-page"><div className="auth-card">
    <Link className="brand" href="/"><span className="brand-mark">R</span>Rechtsfall KI</Link>
    <h1>Ihr geschützter Fallraum.</h1><p>Die Anmeldung schützt Ihre Fallakten und ordnet jeden Zugriff eindeutig Ihrem Konto zu.</p>
    <SignInButton callbackURL={safeReturnTo} />
    <small>Im MVP erfolgt die Anmeldung über GitHub. Weitere verbraucherfreundliche Anmeldeverfahren folgen vor dem öffentlichen Marktstart.</small>
    <Link className="back-link" href="/">← Zur öffentlichen Homepage</Link>
  </div></main>;
}
