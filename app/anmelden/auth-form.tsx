"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
import { trackAnalyticsEvent } from "../../lib/analytics";

type AccountType = "MEMBER" | "LAWYER" | "";

export function AuthForm({ callbackURL, initialMode, initialAccountType = "" }: { callbackURL: string; initialMode: "login" | "signup"; initialAccountType?: AccountType }) {
  const [mode,setMode]=useState(initialMode);const[busy,setBusy]=useState(false);const[error,setError]=useState("");const[notice,setNotice]=useState("");
  const [accountType,setAccountType]=useState<AccountType>(initialAccountType);
  const signupPageTracked=useRef(false);const signupFormStarted=useRef(false);const signupFormSubmitted=useRef(false);
  useEffect(()=>{
    if(mode==="signup"&&!signupPageTracked.current){signupPageTracked.current=true;trackAnalyticsEvent("signup_page_viewed")}
  },[mode]);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");setNotice("");
    if(mode==="signup"&&!signupFormSubmitted.current){signupFormSubmitted.current=true;trackAnalyticsEvent("signup_form_submitted")}
    const form=new FormData(event.currentTarget);const email=String(form.get("email"));const password=String(form.get("password"));const name=String(form.get("name")||"");
    if(mode==="signup"&&!accountType){setError("Bitte wählen Sie aus, ob Sie sich als Mandant oder Kanzlei registrieren möchten.");setBusy(false);return}
    if(mode==="login")sessionStorage.setItem("rechtsfall-check:returnTo",callbackURL);
    const verificationTarget=accountType==="LAWYER"?"/anmelden?verified=1&accountType=LAWYER&returnTo=%2Fanwalt":"/anmelden?verified=1&accountType=MEMBER&returnTo=%2Ffallraum";
    const result=mode==="signup"?await authClient.signUp.email({email,password,name,accountType,callbackURL:verificationTarget}):await authClient.signIn.email({email,password,callbackURL});
    if(result.error){setError(mode==="signup"?"Konto konnte nicht erstellt werden. Bitte prüfen Sie Ihre Angaben.":"Login nicht möglich. Prüfen Sie Ihre Zugangsdaten und bestätigen Sie gegebenenfalls zuerst Ihre E-Mail-Adresse.");setBusy(false);return}
    if(mode==="signup"){trackAnalyticsEvent("sign_up",{method:"email"});setNotice("Bitte prüfen Sie Ihr Postfach. Für ein neues Konto erhalten Sie den Bestätigungslink. Besteht bereits ein Konto, senden wir Ihnen stattdessen einen sicheren Hinweis zum Login.");setBusy(false);return}
    if((result.data as { twoFactorRedirect?: boolean }|null)?.twoFactorRedirect)return;
    trackAnalyticsEvent("login",{method:"email"});
    const memberResponse=await fetch("/api/v1/member",{cache:"no-store"}).catch(()=>null);
    const memberData=memberResponse?.ok?await memberResponse.json().catch(()=>null):null;
    window.location.href=callbackURL==="/fallraum"&&memberData?.member?.accountRole==="LAWYER"?"/anwalt":callbackURL;
  }
  function changeMode(next:"login"|"signup"){setMode(next);setError("");setNotice("")}
  return <>
    <div className="auth-tabs" role="tablist" aria-label="Zugang auswählen"><button type="button" role="tab" aria-selected={mode==="login"} aria-controls="auth-panel" className={mode==="login"?"active":""} onClick={()=>changeMode("login")}>Login</button><button type="button" role="tab" aria-selected={mode==="signup"} aria-controls="auth-panel" className={mode==="signup"?"active":""} onClick={()=>changeMode("signup")}>Registrierung</button></div>
    <form className="auth-form" id="auth-panel" role="tabpanel" onSubmit={submit} onFocus={()=>{if(mode==="signup"&&!signupFormStarted.current){signupFormStarted.current=true;trackAnalyticsEvent("signup_form_started")}}} aria-busy={busy}>
      {mode==="signup"&&<fieldset className="account-type-picker"><legend>Wie möchten Sie Rechtsfall-Check.de nutzen?</legend><label className={accountType==="MEMBER"?"selected":""}><input type="radio" name="accountType" value="MEMBER" checked={accountType==="MEMBER"} onChange={()=>setAccountType("MEMBER")}/><span><strong>Als Mandant</strong><small>Rechtliches Anliegen prüfen und Fallakte verwalten</small></span></label><label className={accountType==="LAWYER"?"selected":""}><input type="radio" name="accountType" value="LAWYER" checked={accountType==="LAWYER"} onChange={()=>setAccountType("LAWYER")}/><span><strong>Als Kanzlei</strong><small>Anwaltsprofil vorbereiten und später am Matching teilnehmen</small></span></label></fieldset>}
      {mode==="signup"&&<div className="field"><label htmlFor="name">{accountType==="LAWYER"?"Ihr Name / Ansprechpartner":"Ihr Name (optional)"}</label><input id="name" name="name" autoComplete="name" placeholder="Vor- und Nachname"/></div>}
      <div className="field"><label htmlFor="email">E-Mail-Adresse</label><input id="email" name="email" type="email" autoComplete="email" required placeholder="name@beispiel.de"/></div>
      <div className="field"><label htmlFor="password">Passwort</label><input id="password" name="password" type="password" minLength={10} maxLength={128} autoComplete={mode==="signup"?"new-password":"current-password"} required placeholder="Mindestens 10 Zeichen"/></div>
      {mode==="signup"&&<label className="consent"><input type="checkbox" required/><span>Ich akzeptiere die <Link href="/agb" target="_blank">AGB</Link> und habe die <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link> zur Kenntnis genommen.</span></label>}
      {error&&<div className="auth-error" role="alert" aria-live="assertive">{error}</div>}
      {notice&&<div className="auth-notice" role="status" aria-live="polite">{notice}</div>}
      <button className="button auth-submit" disabled={busy}>{busy?"Einen Moment …":mode==="signup"?(accountType==="LAWYER"?"Kanzlei kostenlos registrieren →":"Als Mandant kostenlos registrieren →"):"Login →"}</button>
    </form>
    {mode==="login"&&<Link className="forgot-password-link" href="/passwort-vergessen">Passwort vergessen?</Link>}
    <p className="auth-terms">{mode==="signup"&&accountType==="LAWYER"?"Keine Zahlung bei der Registrierung. Profilanlage und Zulassungsprüfung erfolgen vor der freiwilligen Buchung des Jahreszugangs.":"Kein Abo. Keine Zahlung bei der Registrierung. Der Rechtsfall Check kostet erst bei ausdrücklicher Beauftragung einmalig 19 €."}</p>
  </>;
}
