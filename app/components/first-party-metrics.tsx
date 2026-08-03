"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const publicPageGroups: Record<string, string> = {
  "/": "startseite",
  "/rechtsfall-check": "rechtsfall-check",
  "/so-funktionierts": "ablauf",
  "/rechtsgebiete": "rechtsgebiete",
  "/preise": "preise",
  "/sicherheit": "sicherheit",
  "/fragen": "fragen",
  "/datenschutz": "datenschutz",
  "/impressum": "impressum",
  "/agb": "agb",
  "/barrierefreiheit": "barrierefreiheit",
};

export function FirstPartyMetrics() {
  const pathname = usePathname();

  useEffect(() => {
    const pageGroup = publicPageGroups[pathname];
    if (!pageGroup) return;
    void fetch("/api/v1/public/metrics", {
      method: "POST",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pageGroup }),
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
