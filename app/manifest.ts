import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rechtsfall Check – Klarheit, bevor Sie entscheiden",
    short_name: "Rechtsfall Check",
    description: "Der digitale Rechtsfall Check für eine strukturierte Vorprüfung.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fb",
    theme_color: "#0b1d2a",
    lang: "de",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
