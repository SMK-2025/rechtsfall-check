import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { InstallAppPrompt } from "@/app/components/install-app-prompt";
import { AccessibilityWidget } from "@/app/components/accessibility-widget";
import { StructuredData } from "@/app/components/structured-data";
import "./globals.css";
import "./report.css";

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const image = `${siteUrl}/rechtsfall-check-logo.png`;
  return {
    metadataBase:new URL(siteUrl),
    title:{default:"Rechtsfall Check | Digitale Fallanalyse für 19 €",template:"%s | Rechtsfall Check"},
    description:"Das digitale Analysetool verbindet Sachverhalt, Dokumente, interaktive KI und offizielle Gesetzesquellen zu einem nachvollziehbaren Rechtsfall Check.",
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
    openGraph:{title:"Rechtsfall Check – Ein Fall für KI",description:"Ihr Fall. Systematisch analysiert. Verständlich eingeordnet.",url:siteUrl,siteName:"Rechtsfall Check",locale:"de_DE",type:"website",images:[image]},
    twitter:{card:"summary_large_image",title:"Rechtsfall Check – Ein Fall für KI",description:"Ihr Fall. Systematisch analysiert. Verständlich eingeordnet.",images:[image]},
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const siteUrl = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Rechtsfall-Check.de",
        alternateName: "Rechtsfall Check",
        url: siteUrl,
        logo: { "@type": "ImageObject", url: `${siteUrl}/rechtsfall-check-logo.png` },
        email: "service@rechtsfall-check.de",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Im Weidenblech 25",
          postalCode: "51371",
          addressLocality: "Leverkusen",
          addressCountry: "DE",
        },
        legalName: "Media Online Innovations Group, Inhaber Martin Kelm",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Rechtsfall-Check.de",
        inLanguage: "de-DE",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };
  return (
    <html lang="de">
      <body>
        <StructuredData data={structuredData} />
        {children}
        <AccessibilityWidget />
        <InstallAppPrompt />
      </body>
    </html>
  );
}
