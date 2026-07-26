"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "../lib/auth-client";

type CaseItem={id:string;title:string;legalArea:string;status:string;createdAt:string;updatedAt:string};

export function MemberDashboard({userName}:{userName:string}) {
  const [items,setItems]=useState<CaseItem[]>([]);
  const [title,setTitle]=useState("");
  const [busy,setBusy]=useState(true);
  const [error,setError]=useState("");

  async function load(){
    setBusy(true);
    const response=await fetch("/api/v1/cases",{cache:"no-store"});
    if(!response.ok){setError("Fälle konnten nicht geladen werden.");setBusy(false);return;}
    setItems((await response.json()).cases);setBusy(false);
  }
  useEffect(()=>{void load()},[]);

  async function create(event:React.FormEvent){
    event.preventDefault();setError("");
    const response=await fetch("/api/v1/cases",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({title})});
    if(!response.ok){setError("Der Fall konnte nicht angelegt werden.");return;}
    const data=await response.json();window.location.href=`/fallraum/${data.case.id}`;
  }
  async function signOut(){ await authClient.signOut(); window.location.href="/"; }

  return <div className="member-shell">
    <header className="member-nav"><Link className="brand" href="/"><span className="brand-mark">R</span>Rechtsfall KI</Link><div><span>{userName}</span><button className="link-button" onClick={signOut}>Abmelden</button></div></header>
    <main className="member-main">
      <div className="member-heading"><div><p className="eyebrow">Geschützter Memberbereich</p><h1>Ihre Fallakten</h1><p>Alle Fälle sind Ihrem Konto zugeordnet und werden serverseitig gegen fremde Zugriffe geschützt.</p></div></div>
      <section className="new-case-panel"><div><h2>Neuen Fall anlegen</h2><p>Im MVP ist zunächst Verbraucherrecht / Kaufvertrag aktiviert.</p></div><form onSubmit={create}><label htmlFor="case-title">Kurzer Falltitel</label><div><input id="case-title" value={title} onChange={event=>setTitle(event.target.value)} maxLength={160} required placeholder="z. B. Defektes Notebook vom Onlinehändler"/><button className="primary">Fall anlegen →</button></div></form></section>
      {error&&<p className="member-error">{error}</p>}
      <section className="case-list-section"><div className="list-head"><h2>Gespeicherte Fälle</h2><span>{items.length} {items.length===1?"Fall":"Fälle"}</span></div>
        {busy?<div className="empty-state">Fallakten werden geladen …</div>:items.length===0?<div className="empty-state"><strong>Noch keine Fallakte</strong><p>Legen Sie oben Ihren ersten Testfall an.</p></div>:<div className="case-list">{items.map(item=><Link href={`/fallraum/${item.id}`} className="case-list-item" key={item.id}><div><span className="case-status">{item.status==="DRAFT"?"Entwurf":item.status}</span><h3>{item.title}</h3><p>Verbraucherrecht · zuletzt aktualisiert {new Intl.DateTimeFormat("de-DE").format(new Date(item.updatedAt))}</p></div><span className="case-arrow">→</span></Link>)}</div>}
      </section>
    </main>
  </div>
}
