"use client";
import { useState } from "react";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
import { trackAnalyticsEvent } from "../../lib/analytics";

export function AuthForm({ callbackURL, initialMode }: { callbackURL: string; initialMode: "login" | "signup" }) {
  const [mode,setMode]=useState(initialMode);const[busy,setBusy]=useState(false);const[error,setError]=useState("");const[notice,setNotice]=useState("");
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");setNotice("");
    const form=new FormData(event.currentTarget);const email=String(form.get("email"));const password=String(form.get("password"));const name=String(form.get("name")||"");
    if(mode==="login")sessionStorage.setItem("rechtsfall-check:returnTo",callbackURL);
    const result=mode==="signup"?await authClient.signUp.email({email,password,name,callbackURL:"/anmelden?verified=1"}):await authClient.signIn.email({email,password,callbackURL});
    if(result.error){setError(mode==="signup"?"Konto konnte nicht erstellt werden. Bitte prüfen Sie Ihre Angaben.":"Login nicht möglich. Prüfen Sie Ihre Zugangsdaten und bestätigen Sie gegebenenfalls zuerst Ihre E-Mail-Adresse.");setBusy(false);return}
    if(mode==="signup"){trackAnalyticsEvent("sign_up",{method:"email"});setNotice("Fast geschafft: Wir haben Ihnen eine Bestätigungs-E-Mail gesendet. Öffnen Sie den Link, um Ihr Konto zu aktivieren.");setBusy(false);return}
    if((result.data as { twoFactorRedirect?: boolean }|null)?.twoFactorRedirect)return;
    trackAnalyticsEvent("login",{method:"email"});
    window.location.href=callbackURL;
  }
  function changeMode(next:"login"|"signup"){setMode(next);setError("");setNotice("")}
  return <>
    <div className="auth-tabs" role="tablist" aria-label="Zugang auswählen"><button type="button" role="tab" aria-selected={mode==="login"} aria-controls="auth-panel" className={mode==="login"?"active":""} onClick={()=>changeMode("login")}>Login</button><button type="button" role="tab" aria-selected={mode==="signup"} aria-controls="auth-panel" className={mode==="signup"?"active":""} onClick={()=>changeMode("signup")}>Konto erstellen</button></div>
    <form className="auth-form" id="auth-panel" role="tabpanel" onSubmit={submit} aria-busy={busy}>
      {mode==="signup"&&<div className="field"><label htmlFor="name">Ihr Name</label><input id="name" name="name" autoComplete="name" required placeholder="Vor- und Nachname"/></div>}
      <div className="field"><label htmlFor="email">E-Mail-Adresse</label><input id="email" name="email" type="email" autoComplete="email" required placeholder="name@beispiel.de"/></div>
      <div className="field"><label htmlFor="password">Passwort</label><input id="password" name="password" type="password" minLength={10} maxLength={128} autoComplete={mode==="signup"?"new-password":"current-password"} required placeholder="Mindestens 10 Zeichen"/></div>
      {mode==="signup"&&<label className="consent"><input type="checkbox" required/><span>Ich akzeptiere die <Link href="/agb" target="_blank">AGB</Link> und habe die <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link> zur Kenntnis genommen.</span></label>}
      {error&&<div className="auth-error" role="alert" aria-live="assertive">{error}</div>}
      {notice&&<div className="auth-notice" role="status" aria-live="polite">{notice}</div>}
      <button className="button auth-submit" disabled={busy}>{busy?"Einen Moment …":mode==="signup"?"Kostenloses Konto erstellen →":"Login →"}</button>
    </form>
    {mode==="login"&&<Link className="forgot-password-link" href="/passwort-vergessen">Passwort vergessen?</Link>}
    <p className="auth-terms">Die Registrierung ist kostenlos. Eine Zahlung entsteht erst durch eine gesonderte zahlungspflichtige Bestellung.</p>
  </>;
}
