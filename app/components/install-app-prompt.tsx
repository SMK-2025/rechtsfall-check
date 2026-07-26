"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 820px)").matches;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const appleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent);

    setIsIOS(appleMobile);
    setVisible(mobile && !standalone);
  }, [pathname]);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setInstallPrompt(null);
  }

  if (!visible) return null;

  return (
    <aside className="install-app-prompt" aria-label="Rechtsfall KI als Web-App speichern">
      <button
        className="install-app-close"
        type="button"
        aria-label="Installationshinweis schließen"
        onClick={() => setVisible(false)}
      >
        ×
      </button>
      <div className="install-app-icon" aria-hidden="true">R</div>
      <div className="install-app-copy">
        <strong>Rechtsfall KI griffbereit</strong>
        <span>
          {isIOS
            ? "Als Web-App speichern: Teilen antippen und „Zum Home-Bildschirm“ wählen."
            : installPrompt
              ? "Auf dem Startbildschirm speichern und jederzeit direkt öffnen."
              : "Über das Browser-Menü „App installieren“ oder „Zum Startbildschirm“ wählen."}
        </span>
      </div>
      {installPrompt ? (
        <button className="install-app-action" type="button" onClick={install}>
          Installieren
        </button>
      ) : isIOS ? (
        <span className="install-app-share" aria-hidden="true">↑</span>
      ) : null}
    </aside>
  );
}
