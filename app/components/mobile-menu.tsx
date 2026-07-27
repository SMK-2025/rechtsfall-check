"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  ["/rechtsfall-check", "Rechtsfall Check"],
  ["/so-funktionierts", "So funktioniert’s"],
  ["/rechtsgebiete", "Rechtsgebiete"],
  ["/preise", "Preis"],
  ["/sicherheit", "Sicherheit"],
  ["/fragen", "Häufige Fragen"],
] as const;

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.classList.add("mobile-menu-open");
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("mobile-menu-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button
        className={`mobile-menu-toggle${open ? " is-open" : ""}`}
        type="button"
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen(value => !value)}
      >
        <span /><span /><span />
      </button>
      <div className={`mobile-menu-panel${open ? " is-open" : ""}`} id="mobile-navigation" aria-hidden={!open}>
        <button className="mobile-menu-backdrop" type="button" aria-label="Menü schließen" onClick={() => setOpen(false)} />
        <nav className="mobile-menu-drawer" aria-label="Mobile Navigation">
          <div className="mobile-menu-heading"><span>MENÜ</span><button type="button" onClick={() => setOpen(false)} aria-label="Menü schließen">×</button></div>
          <div className="mobile-menu-links">
            {links.map(([href, label]) => <Link href={href} key={href} className={pathname === href ? "active" : ""}>{label}<span>→</span></Link>)}
          </div>
          <div className="mobile-menu-actions">
            <Link href="/anmelden" className="mobile-login">Anmelden</Link>
            <Link href="/anmelden?mode=signup" className="button">Rechtsfall Check starten →</Link>
          </div>
          <small>Einmalig 39 € · kein Abo</small>
        </nav>
      </div>
    </>
  );
}
