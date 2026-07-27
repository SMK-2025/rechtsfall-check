"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const links = [
  ["/rechtsfall-check", "Rechtsfall Check"],
  ["/so-funktionierts", "So funktioniert’s"],
  ["/rechtsgebiete", "Rechtsgebiete"],
  ["/preise", "Preis"],
  ["/sicherheit", "Sicherheit"],
  ["/fragen", "Häufige Fragen"],
] as const;

export function MobileMenu() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  function closeMenu() {
    detailsRef.current?.removeAttribute("open");
    document.body.classList.remove("mobile-menu-open");
  }

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("mobile-menu-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <details
      className="mobile-menu"
      ref={detailsRef}
      onToggle={event => document.body.classList.toggle("mobile-menu-open", event.currentTarget.open)}
    >
      <summary className="mobile-menu-toggle" aria-label="Menü öffnen">
        <span /><span /><span />
      </summary>
      <div className="mobile-menu-panel">
        <button className="mobile-menu-backdrop" type="button" aria-label="Menü schließen" onClick={closeMenu} />
        <nav className="mobile-menu-drawer" aria-label="Mobile Navigation">
          <div className="mobile-menu-heading">
            <Link href="/" className="mobile-menu-brand" aria-label="Rechtsfall-Check.de – Ein Fall für KI – Startseite">
              <Image src="/rechtsfall-check-logo.png" alt="Rechtsfall-Check.de – Ein Fall für KI" width={8000} height={2000} priority />
            </Link>
          </div>
          <div className="mobile-menu-links">
            {links.map(([href, label]) => <Link href={href} key={href} className={pathname === href ? "active" : ""}>{label}<span>→</span></Link>)}
          </div>
          <div className="mobile-menu-actions">
            <Link href="/anmelden" className="mobile-login">Login</Link>
            <Link href="/anmelden?mode=signup" className="button">Rechtsfall Check starten →</Link>
          </div>
          <small>Einmalig 39 € · kein Abo</small>
        </nav>
      </div>
    </details>
  );
}
