"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Brand } from "./site-chrome";

type NavigationItem = {
  href: string;
  label: string;
  description: string;
  symbol: string;
  children?: Array<{ href: string; label: string }>;
};

export function MemberNavigation({
  caseId,
  adminMode = false,
}: {
  userName: string;
  userEmail: string;
  caseId?: string;
  adminMode?: boolean;
}) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [canAccessOperations, setCanAccessOperations] = useState(adminMode);

  function closeMenu() {
    menuRef.current?.removeAttribute("open");
    document.body.classList.remove("member-menu-open");
  }

  async function signOut() {
    closeMenu();
    await authClient.signOut();
    window.location.href = "/";
  }

  useEffect(() => closeMenu(), [pathname, searchParams]);
  useEffect(() => {
    if (adminMode) return;
    let active = true;
    fetch("/api/v1/member", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (active) setCanAccessOperations(data?.member?.canAccessOperations === true);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [adminMode]);
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

  const items = useMemo<NavigationItem[]>(() => {
    if (adminMode || pathname.startsWith("/betrieb")) {
      return [
        {
          href: "/betrieb", label: "Betrieb", description: "Betreiber-Dashboard", symbol: "⌂",
          children: [
            { href: "/betrieb", label: "Übersicht" },
            { href: "/betrieb?tab=reach", label: "Reichweite" },
            { href: "/betrieb?tab=users", label: "Nutzer" },
            { href: "/betrieb?tab=payments", label: "Buchungen & Umsatz" },
            { href: "/betrieb?tab=cases", label: "Rechtsfall-Checks" },
            { href: "/betrieb?tab=sources", label: "Rechtsinhalte" },
            { href: "/betrieb?tab=checks", label: "Systemchecks" },
            { href: "/betrieb?tab=system", label: "System & Fehler" },
          ],
        },
        { href: "/support", label: "Support", description: "Tickets und Nachrichten", symbol: "?" },
        { href: "/bewertungen", label: "Bewertungen", description: "Prüfen und veröffentlichen", symbol: "★" },
        { href: "/fallraum", label: "Meine Fälle", description: "Eigene Test-Fallakten", symbol: "▤" },
        { href: "/profil", label: "Mein Konto", description: "Daten und Sicherheit", symbol: "◎" },
      ];
    }
    if (caseId) {
      return [
        { href: "/fallraum", label: "Meine Fälle", description: "Übersicht und Fallakten", symbol: "⌂" },
        {
          href: `/fallraum/${caseId}`, label: "Aktuelle Fallakte", description: "Rechtsfall-Check bearbeiten", symbol: "▤",
          children: [
            { href: `/fallraum/${caseId}#fallangaben`, label: "Fallangaben" },
            { href: `/fallraum/${caseId}#unterlagen`, label: "Unterlagen" },
            { href: `/fallraum/${caseId}#rueckfragen`, label: "Rückfragen" },
            { href: `/fallraum/${caseId}#ergebnis`, label: "Prüfbericht" },
          ],
        },
        { href: "/support", label: "Support", description: "Tickets und Nachrichten", symbol: "?" },
        { href: "/bewertungen", label: "Bewertungen", description: "Erfahrung teilen", symbol: "★" },
        { href: "/profil", label: "Mein Konto", description: "Daten und Sicherheit", symbol: "◎" },
        ...(canAccessOperations ? [{ href: "/betrieb", label: "Betrieb", description: "Betreiber-Dashboard", symbol: "⚙" }] : []),
      ];
    }
    if (pathname === "/profil") {
      return [
        { href: "/fallraum", label: "Meine Fälle", description: "Übersicht und Fallakten", symbol: "⌂" },
        { href: "/support", label: "Support", description: "Tickets und Nachrichten", symbol: "?" },
        { href: "/bewertungen", label: "Bewertungen", description: "Erfahrung teilen", symbol: "★" },
        {
          href: "/profil", label: "Mein Konto", description: "Daten und Sicherheit", symbol: "◎",
          children: [
            { href: "/profil#persoenliche-daten", label: "Persönliche Daten" },
            { href: "/profil#zugangsdaten", label: "Zugangsdaten" },
            { href: "/profil#datenschutz", label: "Datenschutz & Export" },
            { href: "/profil#konto-loeschen", label: "Konto löschen" },
          ],
        },
        ...(canAccessOperations ? [{ href: "/betrieb", label: "Betrieb", description: "Betreiber-Dashboard", symbol: "⚙" }] : []),
      ];
    }
    return [
      {
        href: "/fallraum", label: "Meine Fälle", description: "Übersicht und Fallakten", symbol: "⌂",
        children: [
          { href: "/fallraum#neuer-check", label: "Neuen Check anlegen" },
          { href: "/fallraum#fallakten", label: "Alle Fallakten" },
        ],
      },
      { href: "/support", label: "Support", description: "Tickets und Nachrichten", symbol: "?" },
      { href: "/bewertungen", label: "Bewertungen", description: "Erfahrung teilen", symbol: "★" },
      { href: "/profil", label: "Mein Konto", description: "Daten und Sicherheit", symbol: "◎" },
      ...(canAccessOperations ? [{ href: "/betrieb", label: "Betrieb", description: "Betreiber-Dashboard", symbol: "⚙" }] : []),
    ];
  }, [adminMode, canAccessOperations, caseId, pathname]);

  const currentUrl = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;
  const active = (href: string) => href.includes("?")
    ? currentUrl === href
    : href.includes("#")
      ? pathname === href.split("#")[0]
      : pathname === href || (href !== "/fallraum" && pathname.startsWith(`${href}/`));

  const sidebar = <nav className="account-navigation" aria-label={adminMode ? "Betreiberbereich" : "Kontobereich"}>
    <div className="account-navigation-title"><span>{adminMode ? "ADMINBEREICH" : "NUTZERBEREICH"}</span><strong>Navigation</strong></div>
    <div className="account-navigation-links">
      {items.map(item => <section key={item.href} className={active(item.href) ? "active" : ""}>
        <Link href={item.href} className="account-navigation-main">
          <b aria-hidden="true">{item.symbol}</b>
          <span><strong>{item.label}</strong><small>{item.description}</small></span>
          <i aria-hidden="true">→</i>
        </Link>
        {item.children && <div className="account-navigation-children">
          {item.children.map(child => <Link href={child.href} key={child.href} className={active(child.href) ? "active" : ""}>{child.label}</Link>)}
        </div>}
      </section>)}
    </div>
    <div className="account-navigation-help"><Link href="/fragen">Hilfe &amp; häufige Fragen</Link><Link href="/support">Support kontaktieren</Link></div>
  </nav>;

  return <>
    <header className="member-nav">
      <Brand />
      <button className="member-desktop-logout" type="button" onClick={signOut}>Logout</button>
      <details className="member-mobile-menu" ref={menuRef} onToggle={event => document.body.classList.toggle("member-menu-open", event.currentTarget.open)}>
        <summary className="member-menu-toggle" aria-label="Menü öffnen oder schließen"><span/><span/><span/></summary>
        <div className="member-menu-layer">
          <button className="member-menu-backdrop" type="button" aria-label="Menü schließen" onClick={closeMenu}/>
          <div className="member-menu-drawer">
            <div className="member-menu-head"><Brand/><button type="button" aria-label="Menü schließen" onClick={closeMenu}>×</button></div>
            {sidebar}
            <div className="member-mobile-actions"><Link className="button button-full" href="/fallraum#neuer-check">Neuen Rechtsfall-Check starten</Link><button type="button" onClick={signOut}>Logout</button></div>
          </div>
        </div>
      </details>
    </header>
    <aside className="account-sidebar">{sidebar}</aside>
  </>;
}
