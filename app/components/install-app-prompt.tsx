"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppPrompt() {
  const [visible, setVisible] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const appleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent);

    queueMicrotask(() => {
      setIsIOS(appleMobile);
      setVisible(!standalone);
    });

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setVisible(true);
    };
    const handleInstalled = () => {
      setVisible(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setVisible(false);
      setInstallPrompt(null);
      return;
    }
    setShowHelp(current => !current);
  }

  if (!visible) return null;

  const directInstall = Boolean(installPrompt);

  return (
    <aside className="install-app-prompt" aria-label="Rechtsfall Check als Web-App installieren">
      <button
        className="install-app-close"
        type="button"
        aria-label="Installationshinweis schließen"
        onClick={() => setVisible(false)}
      >
        ×
      </button>
      <div className="install-app-icon" aria-hidden="true">
        <Image src="/icons/icon-192.png" alt="" width={192} height={192} />
      </div>
      <div className="install-app-copy">
        <strong>Rechtsfall Check installieren</strong>
        <span>
          {directInstall
            ? "Direkt auf Ihrem Gerät speichern – ohne App Store."
            : isIOS
              ? "Als App auf dem Home-Bildschirm speichern."
              : "Als App speichern und jederzeit direkt öffnen."}
        </span>
        {showHelp && (
          <span className="install-app-help">
            {isIOS
              ? "1. Teilen-Symbol antippen  ·  2. „Zum Home-Bildschirm“ wählen"
              : "Öffnen Sie das Browser-Menü und wählen Sie „App installieren“ oder „Zum Startbildschirm hinzufügen“."}
          </span>
        )}
      </div>
      <button className="install-app-action" type="button" onClick={install}>
        {directInstall ? "Jetzt installieren" : "Installation öffnen"}
      </button>
    </aside>
  );
}
