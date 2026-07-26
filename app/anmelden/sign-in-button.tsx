"use client";
import { useState } from "react";
import { authClient } from "../../lib/auth-client";
export function SignInButton({ callbackURL }: { callbackURL: string }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function signIn() {
    setBusy(true); setError("");
    const result = await authClient.signIn.social({ provider: "github", callbackURL });
    if (result.error) { setError("Anmeldung ist noch nicht konfiguriert."); setBusy(false); }
  }
  return <><button className="primary auth-link" onClick={signIn} disabled={busy}>{busy ? "Weiterleitung …" : "Mit GitHub anmelden"}</button>
    {error && <p className="member-error">{error}</p>}</>;
}
