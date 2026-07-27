import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { InstallAppPrompt } from "@/app/components/install-app-prompt";
import { AccessibilityWidget } from "@/app/components/accessibility-widget";
import "./globals.css";
import "./report.css";

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const image = `${siteUrl}/rechtsfall-check-logo.png`;
  return {
    metadataBase:new URL(siteUrl),
    title:{default:"Rechtsfall Check | Klarheit für Ihren Rechtsfall",template:"%s | Rechtsfall Check"},
    description:"Der digitale Rechtsfall Check strukturiert Ihren Fall und Ihre Unterlagen für eine nachvollziehbare, nicht abschließende Vorprüfung.",
    alternates:{canonical:"/"},
    keywords:["Rechtsfall Check","Rechtsfall prüfen","KI Rechtsorientierung","Dokumentenanalyse Rechtsfall","digitale Fallakte","rechtliche Ersteinschätzung"],
    authors:[{name:"Rechtsfall Check"}],
    creator:"Rechtsfall Check",
    publisher:"Rechtsfall Check",
    category:"Legal Technology",
    robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1,"max-video-preview":-1}},
    icons:{
      icon:[
        {url:"/icons/icon-192.png",sizes:"192x192",type:"image/png"},
        {url:"/icons/icon-512.png",sizes:"512x512",type:"image/png"},
      ],
      apple:[{url:"/icons/apple-touch-icon.png",sizes:"180x180",type:"image/png"}],
    },
    manifest:"/manifest.webmanifest",
    appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"Rechtsfall Check"},
    applicationName:"Rechtsfall Check",
    openGraph:{title:"Rechtsfall Check",description:"Klarheit, bevor Sie entscheiden.",url:siteUrl,siteName:"Rechtsfall Check",locale:"de_DE",type:"website",images:[image]},
    twitter:{card:"summary_large_image",title:"Rechtsfall Check",description:"Klarheit, bevor Sie entscheiden.",images:[image]},
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        {children}
        <AccessibilityWidget />
        <InstallAppPrompt />
      </body>
    </html>
  );
}
