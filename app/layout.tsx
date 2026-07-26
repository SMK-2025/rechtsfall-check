import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const image = `${siteUrl}/og.png`;
  return {
    metadataBase:new URL(siteUrl),
    title:{default:"Rechtsfall KI | Digitale Rechtsorientierung",template:"%s"},
    description:"Rechtsfall KI strukturiert Rechtsfälle und Unterlagen für eine nachvollziehbare, nicht abschließende Orientierung.",
    alternates:{canonical:"/"},
    keywords:["Rechtsfall prüfen","KI Rechtsorientierung","Dokumentenanalyse Rechtsfall","digitale Fallakte","rechtliche Ersteinschätzung"],
    authors:[{name:"Rechtsfall KI"}],
    creator:"Rechtsfall KI",
    publisher:"Rechtsfall KI",
    category:"Legal Technology",
    robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1,"max-video-preview":-1}},
    icons:{icon:"/favicon.svg"},
    openGraph:{title:"Rechtsfall KI",description:"Verstehen, was Ihr Fall wirklich zeigt.",images:[image]},
    twitter:{card:"summary_large_image",title:"Rechtsfall KI",description:"Verstehen, was Ihr Fall wirklich zeigt.",images:[image]},
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className={`${sans.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
