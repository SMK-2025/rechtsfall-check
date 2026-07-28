"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Brand } from "./site-chrome";

export function MemberNavigation({ userName, userEmail, caseId }: { userName: string; userEmail: string; caseId?: string }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const [canAccessOperations, setCanAccessOperations] = useState(false);
  function closeMenu() {
    menuRef.current?.removeAttribute("open");
    document.body.classList.remove("member-menu-open");
  }
  async function signOut() {
    closeMenu();
    await authClient.signOut();
    window.location.href = "/";
  }
  useEffect(() => closeMenu(), [pathname]);
  useEffect(() => {
    let active = true;
    fetch("/api/v1/member", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (active) setCanAccessOperations(data?.member?.canAccessOperations === true);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuRef.current?.open) {
        closeMenu();
        menuRef.current.querySelector<HTMLElement>("summary")?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("member-menu-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);
  const links = [
    { href: "/fallraum", label: "Meine Fälle", description: "Übersicht und Fallakten" },
    ...(caseId ? [{ href: `/fallraum/${caseId}`, label: "Aktuelle Fallakte", description: "Fall weiterbearbeiten" }] : []),
    { href: "/profil", label: "Mein Konto", description: "Persönliche Daten und Sicherheit" },
    ...(canAccessOperations ? [{ href: "/betrieb", label: "Betriebsübersicht", description: "Qualität, Fehler und Systemstatus" }] : []),
  ];
  return <header className="member-nav">
    <Brand />
    <nav className="member-desktop-nav" aria-label="Nutzerbereich">
      <Link className={pathname === "/fallraum" ? "active" : ""} href="/fallraum">Übersicht</Link>
      {caseId && <Link className={pathname === `/fallraum/${caseId}` ? "active" : ""} href={`/fallraum/${caseId}`}>Fallakte</Link>}
      <Link className={pathname === "/profil" ? "active" : ""} href="/profil">Profil</Link>
      {canAccessOperations && <Link className={pathname === "/betrieb" ? "active" : ""} href="/betrieb">Betrieb</Link>}
    </nav>
    <div className="member-desktop-account"><Link className="profile-link" href="/profil">{userName}</Link><button className="link-button" type="button" onClick={signOut}>Logout</button></div>
    <details className="member-mobile-menu" ref={menuRef} onToggle={event => document.body.classList.toggle("member-menu-open", event.currentTarget.open)}>
      <summary className="member-menu-toggle" aria-label="Menü öffnen oder schließen"><span/><span/><span/></summary>
      <div className="member-menu-layer">
        <button className="member-menu-backdrop" type="button" aria-label="Menü schließen" onClick={closeMenu}/>
        <nav className="member-menu-drawer" aria-label="Mobiles Nutzermenü">
          <div className="member-menu-head"><Brand/><button type="button" aria-label="Menü schließen" onClick={closeMenu}>×</button></div>
          <section className="member-account-summary" aria-labelledby="member-account-title">
            <span>MEIN KONTO</span><strong id="member-account-title">{userName}</strong><small>{userEmail}</small><Link href="/profil">Kontodetails verwalten →</Link>
          </section>
          <div className="member-menu-links">{links.map(link => <Link href={link.href} key={link.href} className={pathname === link.href ? "active" : ""}><span><strong>{link.label}</strong><small>{link.description}</small></span><b>→</b></Link>)}</div>
          <div className="member-menu-bottom"><Link className="button button-full" href="/fallraum">Neuen Rechtsfall Check starten →</Link><Link href="/fragen">Hilfe und häufige Fragen</Link><button type="button" onClick={signOut}>Logout</button></div>
        </nav>
      </div>
    </details>
  </header>;
}
