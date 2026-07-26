import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rechtsfall KI – Rechtsfall-Check",
    short_name: "Rechtsfall KI",
    description: "Ihr digitaler Rechtsfall-Check für eine strukturierte Vorprüfung.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fb",
    theme_color: "#0b1d2a",
    lang: "de",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
