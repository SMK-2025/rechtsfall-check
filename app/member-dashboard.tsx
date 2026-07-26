"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { authClient } from "../lib/auth-client";
type CaseItem={id:string;title:string;legalArea:string;status:string;paymentStatus:string;createdAt:string;updatedAt:string};
export function MemberDashboard({userName}:{userName:string}){
  const[items,setItems]=useState<CaseItem[]>([]);const[title,setTitle]=useState("");const[busy,setBusy]=useState(true);const[error,setError]=useState("");
  async function load(){setBusy(true);const response=await fetch("/api/v1/cases",{cache:"no-store"});if(!response.ok){setError("Ihre Fälle konnten nicht geladen werden.");setBusy(false);return}setItems((await response.json()).cases);setBusy(false)}
  useEffect(()=>{void load()},[]);
  async function create(event:React.FormEvent){event.preventDefault();setError("");const response=await fetch("/api/v1/cases",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({title})});if(!response.ok){setError("Der Fall konnte nicht angelegt werden.");return}const data=await response.json();window.location.href=`/fallraum/${data.case.id}`}
  async function signOut(){await authClient.signOut();window.location.href="/"}
  return <div className="member-shell">
    <header className="member-nav"><Link href="/" className="logo"><span>R</span><strong>Rechtsfall</strong><em>KI</em></Link><div><Link className="profile-link" href="/profil">{userName}</Link><button className="link-button" onClick={signOut}>Abmelden</button></div></header>
    <main className="member-main">
      <div className="member-heading"><div><span className="section-label">MEIN BEREICH</span><h1>Guten Tag, {userName.split(" ")[0]}.</h1><p>Hier finden Sie Ihre Fallprüfungen, Unterlagen und Ergebnisse.</p></div><Link href="/profil" className="button-secondary">Profil verwalten →</Link></div>
      <section className="new-case-panel"><div><h2>Was möchten Sie prüfen?</h2><p>Legen Sie kostenlos eine Fallakte an. Die vollständige Analyse kostet einmalig 39 €.</p></div><form onSubmit={create}><label htmlFor="case-title">Kurzer Titel für Ihren Fall</label><div><input id="case-title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={160} required placeholder="z. B. Defektes Notebook nach Lieferung"/><button className="button">Fall anlegen →</button></div></form></section>
      {error&&<p className="member-error">{error}</p>}
      <section className="case-list-section"><div className="list-head"><h2>Ihre Fallakten</h2><span>{items.length} {items.length===1?"Fall":"Fälle"}</span></div>
        {busy?<div className="empty-state">Ihre Fallakten werden geladen …</div>:items.length===0?<div className="empty-state"><strong>Noch keine Fallakte</strong><p>Geben Sie oben einen kurzen Titel ein und starten Sie mit Ihrem ersten Fall.</p></div>:<div className="case-list">{items.map(item=><Link href={`/fallraum/${item.id}`} className="case-list-item" key={item.id}><div><span className="case-status">{item.paymentStatus==="PAID"?"ANALYSE FREIGESCHALTET":"ENTWURF · NOCH NICHT BEZAHLT"}</span><h3>{item.title}</h3><p>Kaufrecht · zuletzt aktualisiert {new Intl.DateTimeFormat("de-DE").format(new Date(item.updatedAt))}</p></div><span className="case-arrow">→</span></Link>)}</div>}
      </section>
    </main>
  </div>
}
