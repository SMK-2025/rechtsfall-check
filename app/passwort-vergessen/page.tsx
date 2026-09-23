import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/app/components/site-chrome";
import { SkipLink } from "@/app/components/skip-link";
import { ForgotPasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Passwort vergessen", robots: { index: false, follow: false } };
export default function ForgotPasswordPage() {
  return <><SkipLink/><main id="main-content" tabIndex={-1} className="auth-page auth-page-centered"><section className="auth-main"><div className="auth-card"><Brand/><span className="section-label">KONTOZUGANG</span><h1>Passwort zurücksetzen.</h1><p>Gib die E-Mail-Adresse deines Nutzerkontos ein. Wenn ein Konto besteht, senden wir dir einen sicheren Link.</p><ForgotPasswordForm/><Link className="back-link" href="/anmelden">← Zurück zum Login</Link></div></section></main></>;
}
