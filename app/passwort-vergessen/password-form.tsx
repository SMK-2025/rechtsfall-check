"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
export function ForgotPasswordForm() {
  const [busy,setBusy]=useState(false);const[sent,setSent]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);const form=new FormData(event.currentTarget);await authClient.requestPasswordReset({email:String(form.get("email")),redirectTo:"/passwort-zuruecksetzen"});setSent(true);setBusy(false)}
  if(sent)return <div className="auth-notice" role="status"><strong>Bitte prüfen Sie Ihr E-Mail-Postfach.</strong><br/>Wenn ein Konto zu dieser Adresse existiert, erhalten Sie in Kürze den Link zum Zurücksetzen.</div>;
  return <form className="auth-form" onSubmit={submit} aria-busy={busy}><div className="field"><label htmlFor="reset-email">E-Mail-Adresse</label><input id="reset-email" name="email" type="email" autoComplete="email" required placeholder="name@beispiel.de"/></div><button className="button auth-submit" disabled={busy}>{busy?"E-Mail wird vorbereitet …":"Reset-Link anfordern →"}</button></form>;
}
