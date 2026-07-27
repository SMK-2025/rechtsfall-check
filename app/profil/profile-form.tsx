"use client";

import Link from "next/link";
import { useState } from "react";
import { Brand } from "@/app/components/site-chrome";
import { MemberFooter } from "@/app/components/member-footer";

export function ProfileForm({ initial }: { initial: { displayName: string; email: string } }) {
  const [name, setName] = useState(initial.displayName);
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaved(false);
    const response = await fetch("/api/v1/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: name, phone }),
    });
    setSaved(response.ok);
  }

  return <div className="member-shell">
    <header className="member-nav">
      <Brand />
      <nav aria-label="Nutzerbereich"><Link href="/fallraum">Übersicht</Link><Link className="active" href="/profil">Profil</Link></nav>
      <div><Link href="/fallraum">Meine Fälle</Link></div>
    </header>
    <main className="member-main">
      <div className="member-heading"><div><span className="section-label">MEIN KONTO</span><h1>Persönliche Angaben</h1><p>Verwalten Sie die Informationen zu Ihrem Nutzerkonto.</p></div></div>
      <form className="app-card" onSubmit={submit}>
        <div className="app-grid">
          <div className="field"><label htmlFor="displayName">Name</label><input id="displayName" value={name} onChange={event => setName(event.target.value)} required maxLength={120} /></div>
          <div className="field"><label htmlFor="email">E-Mail-Adresse</label><input id="email" value={initial.email} disabled /></div>
          <div className="field"><label htmlFor="phone">Telefon (optional)</label><input id="phone" value={phone} onChange={event => setPhone(event.target.value)} maxLength={40} /></div>
        </div>
        <div className="app-actions"><small>{saved ? "Änderungen wurden gespeichert." : "Ihre E-Mail-Adresse ist Ihrem Login zugeordnet."}</small><button className="button">Änderungen speichern</button></div>
      </form>
    </main>
    <MemberFooter />
  </div>;
}
