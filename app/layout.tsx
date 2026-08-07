import type { Metadata } from "next";
import Script from "next/script";
import { getSiteUrl } from "@/lib/site-url";
import { InstallAppPrompt } from "@/app/components/install-app-prompt";
import { AccessibilityWidget } from "@/app/components/accessibility-widget";
import { StructuredData } from "@/app/components/structured-data";
import { AnalyticsConsent } from "@/app/components/analytics-consent";
import { FirstPartyMetrics } from "@/app/components/first-party-metrics";
import "./globals.css";
import "./report.css";

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const shareTitle = "Rechtsfall-Check.de - Ein Fall für KI.";
  const shareDescription = "Wir geben Ihnen Klarheit über Ihren Rechtsfall: verständliche Fallanalyse, klare Einordnung und konkrete nächste Schritte – ohne Anwaltsdeutsch.";
  const shareImage = `${siteUrl}/icons/icon-512.png`;
  return {
    metadataBase:new URL(siteUrl),
    title:{default:shareTitle,template:"%s | Rechtsfall-Check.de"},
    description:shareDescription,
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
    applicationName:"Rechtsfall-Check.de",
    openGraph:{
      title:shareTitle,
      description:shareDescription,
      url:siteUrl,
      siteName:"Rechtsfall-Check.de",
      locale:"de_DE",
      type:"website",
      images:[{url:shareImage,width:512,height:512,alt:"Rechtsfall-Check.de - Ein Fall für KI"}],
    },
    twitter:{
      card:"summary",
      title:shareTitle,
      description:shareDescription,
      images:[{url:shareImage,alt:"Rechtsfall-Check.de - Ein Fall für KI"}],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const siteUrl = getSiteUrl();
  const configuredMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const measurementId = configuredMeasurementId && /^G-[A-Z0-9]+$/i.test(configuredMeasurementId)
    ? configuredMeasurementId
    : undefined;
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
        {measurementId && <>
          <Script
            id="google-consent-default"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: `
              window.dataLayer = window.dataLayer || [];
              window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
              window.gtag('consent', 'default', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                wait_for_update: 500
              });
              window.gtag('set', 'ads_data_redaction', true);
            ` }}
          />
          <Script
            id="google-analytics"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
            strategy="afterInteractive"
            data-rfc-google-analytics="true"
          />
        </>}
        <StructuredData data={structuredData} />
        {children}
        <FirstPartyMetrics />
        <AccessibilityWidget />
        <InstallAppPrompt />
        <AnalyticsConsent />
      </body>
    </html>
  );
}
