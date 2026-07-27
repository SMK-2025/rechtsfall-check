"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Preference = "largeText" | "highContrast" | "reducedMotion";
type Preferences = Record<Preference, boolean>;

const initialPreferences: Preferences = {
  largeText: false,
  highContrast: false,
  reducedMotion: false,
};

function applyPreferences(preferences: Preferences) {
  const root = document.documentElement;
  root.classList.toggle("a11y-large-text", preferences.largeText);
  root.classList.toggle("a11y-high-contrast", preferences.highContrast);
  root.classList.toggle("a11y-reduced-motion", preferences.reducedMotion);
}

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState(initialPreferences);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rechtsfall-check-accessibility");
      if (!saved) return;
      const next = { ...initialPreferences, ...JSON.parse(saved) };
      window.requestAnimationFrame(() => {
        setPreferences(next);
        applyPreferences(next);
      });
    } catch {
      localStorage.removeItem("rechtsfall-check-accessibility");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function update(key: Preference) {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    applyPreferences(next);
    localStorage.setItem("rechtsfall-check-accessibility", JSON.stringify(next));
  }

  function reset() {
    setPreferences(initialPreferences);
    applyPreferences(initialPreferences);
    localStorage.removeItem("rechtsfall-check-accessibility");
  }

  return <div className="a11y-widget">
    {open && <div className="a11y-panel" id="accessibility-options" ref={panelRef} role="dialog" aria-modal="false" aria-labelledby="a11y-title">
      <div className="a11y-panel-head">
        <div><small>DARSTELLUNG</small><h2 id="a11y-title">Barrierefreiheit</h2></div>
        <button type="button" className="a11y-close" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} aria-label="Menü Barrierefreiheit schließen">×</button>
      </div>
      <div className="a11y-options">
        <button type="button" className={preferences.largeText ? "active" : ""} aria-pressed={preferences.largeText} onClick={() => update("largeText")}><span aria-hidden="true">A+</span><span><strong>Größere Schrift</strong><small>Texte besser lesbar anzeigen</small></span></button>
        <button type="button" className={preferences.highContrast ? "active" : ""} aria-pressed={preferences.highContrast} onClick={() => update("highContrast")}><span aria-hidden="true">◐</span><span><strong>Hoher Kontrast</strong><small>Farben deutlicher unterscheiden</small></span></button>
        <button type="button" className={preferences.reducedMotion ? "active" : ""} aria-pressed={preferences.reducedMotion} onClick={() => update("reducedMotion")}><span aria-hidden="true">Ⅱ</span><span><strong>Bewegung reduzieren</strong><small>Animationen und Übergänge abschalten</small></span></button>
      </div>
      <div className="a11y-panel-foot"><button type="button" onClick={reset}>Einstellungen zurücksetzen</button><Link href="/barrierefreiheit" onClick={() => setOpen(false)}>Erklärung zur Barrierefreiheit →</Link></div>
    </div>}
    <button ref={triggerRef} type="button" className="a11y-trigger" aria-label="Einstellungen zur Barrierefreiheit öffnen" aria-expanded={open} aria-controls="accessibility-options" onClick={() => setOpen(value => !value)}>
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="12" r="6"/><path d="M13 22c11 4 27 4 38 0M32 19v17M32 35 20 53M32 35l12 18" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/></svg>
    </button>
  </div>;
}
