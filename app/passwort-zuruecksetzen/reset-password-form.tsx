"use client";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
export function ResetPasswordForm({token}:{token:string}){
  const[busy,setBusy]=useState(false);const[error,setError]=useState("");const[done,setDone]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");const form=new FormData(event.currentTarget);const password=String(form.get("password"));const confirmation=String(form.get("confirmation"));if(password!==confirmation){setError("Die beiden Passwörter stimmen nicht überein.");setBusy(false);return}const result=await authClient.resetPassword({newPassword:password,token});if(result.error){setError("Das Passwort konnte nicht geändert werden. Fordern Sie bitte einen neuen Link an.");setBusy(false);return}setDone(true);setBusy(false)}
  if(done)return <div className="auth-notice" role="status"><strong>Ihr Passwort wurde geändert.</strong><br/><Link href="/anmelden">Jetzt mit dem neuen Passwort einloggen →</Link></div>;
  return <form className="auth-form" onSubmit={submit} aria-busy={busy}><div className="field"><label htmlFor="new-password">Neues Passwort</label><input id="new-password" name="password" type="password" minLength={10} maxLength={128} autoComplete="new-password" required/></div><div className="field"><label htmlFor="confirm-password">Passwort wiederholen</label><input id="confirm-password" name="confirmation" type="password" minLength={10} maxLength={128} autoComplete="new-password" required/></div>{error&&<div className="auth-error" role="alert">{error}</div>}<button className="button auth-submit" disabled={busy}>{busy?"Passwort wird gespeichert …":"Neues Passwort speichern →"}</button></form>
}
