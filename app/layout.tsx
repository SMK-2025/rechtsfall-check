import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export async function generateMetadata():Promise<Metadata>{
  const h=await headers();
  const host=h.get("x-forwarded-host")||h.get("host")||"localhost:3000";
  const protocol=h.get("x-forwarded-proto")||(host.startsWith("localhost")?"http":"https");
  const image=`${protocol}://${host}/og.png`;
  return {
    metadataBase:new URL(`${protocol}://${host}`),
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
