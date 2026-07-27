import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/app/components/site-chrome";
import { SkipLink } from "@/app/components/skip-link";
import { ResetPasswordForm } from "./reset-password-form";
export const metadata: Metadata = { title: "Neues Passwort vergeben", robots: { index: false, follow: false } };
export default async function ResetPasswordPage({searchParams}:{searchParams:Promise<{token?:string;error?:string}>}){const{token,error}=await searchParams;return <><SkipLink/><main id="main-content" tabIndex={-1} className="auth-page auth-page-centered"><section className="auth-main"><div className="auth-card"><Brand/><span className="section-label">KONTOZUGANG</span><h1>Neues Passwort vergeben.</h1><p>Wählen Sie ein neues, nur für Rechtsfall-Check.de verwendetes Passwort mit mindestens zehn Zeichen.</p>{token&&!error?<ResetPasswordForm token={token}/>:<div className="auth-error" role="alert">Dieser Link ist ungültig oder abgelaufen. Fordern Sie bitte einen neuen Reset-Link an.</div>}<Link className="back-link" href="/passwort-vergessen">← Neuen Link anfordern</Link></div></section></main></>}
