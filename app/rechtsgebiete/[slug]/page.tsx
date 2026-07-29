import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConversionCta, SiteFooter, SiteHeader } from "@/app/components/site-chrome";
import { StructuredData } from "@/app/components/structured-data";
import { legalAreas } from "@/lib/legal-areas";
import { getSiteUrl } from "@/lib/site-url";

type PageProps = { params: Promise<{ slug: string }> };
const findArea = (slug: string) => legalAreas.find((area) => area.slug === slug);

export function generateStaticParams() {
  return legalAreas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const area = findArea((await params).slug);
  if (!area) return {};
  return {
    title: `${area.title}: Rechtsfall prüfen und Unterlagen vorbereiten`,
    description: `${area.title} verständlich vorprüfen: typische Themen, benötigte Unterlagen, wichtige Hinweise und der digitale Rechtsfall Check für 19 €.`,
    alternates: { canonical: `/rechtsgebiete/${area.slug}` },
    openGraph: { title: `${area.title} mit dem Rechtsfall Check vorprüfen`, description: area.examples, url: `/rechtsgebiete/${area.slug}`, type: "article" },
  };
}

export default async function LegalAreaPage({ params }: PageProps) {
  const area = findArea((await params).slug);
  if (!area) notFound();
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/rechtsgebiete/${area.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${pageUrl}#webpage`, url: pageUrl, name: `${area.title}: Rechtsfall prüfen und Unterlagen vorbereiten`, description: area.examples, inLanguage: "de-DE", isPartOf: { "@id": `${siteUrl}/#website` }, about: { "@type": "Thing", name: area.title } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Startseite", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Rechtsgebiete", item: `${siteUrl}/rechtsgebiete` },
        { "@type": "ListItem", position: 3, name: area.title, item: pageUrl },
      ] },
      { "@type": "Service", name: `Rechtsfall Check für ${area.title}`, serviceType: "Digitale, nicht abschließende Rechtsfallanalyse", provider: { "@id": `${siteUrl}/#organization` }, areaServed: { "@type": "Country", name: "Deutschland" }, offers: { "@type": "Offer", price: "19.00", priceCurrency: "EUR", url: `${siteUrl}/anmelden?mode=signup` } },
    ],
  };

  return <div className="site"><StructuredData data={schema}/><SiteHeader/><main>
    <section className="subhero legal-area-hero"><div>
      <nav className="seo-breadcrumb" aria-label="Brotkrümelnavigation"><Link href="/">Startseite</Link><span>›</span><Link href="/rechtsgebiete">Rechtsgebiete</Link><span>›</span><span>{area.title}</span></nav>
      <span className="section-label light-label">{area.title.toUpperCase()}</span>
      <h1>{area.title}: Ihren Rechtsfall strukturiert vorprüfen.</h1>
      <p>{area.examples}. Der Rechtsfall Check verbindet Ihre Schilderung, Unterlagen und gezielte Rückfragen zu einer verständlichen, nicht abschließenden Ersteinschätzung.</p>
      <Link href="/anmelden?mode=signup" className="button">Rechtsfall Check für 19 € starten →</Link>
    </div></section>

    <section className="section-wrap legal-area-content"><header><span className="section-label">TYPISCHE FRAGEN</span><h2>Welche Themen können eingeordnet werden?</h2><p>Die Auswahl hilft bei der strukturierten Fallaufnahme. Entscheidend bleiben Ihre konkreten Angaben, Nachweise und mögliche Fristen.</p></header>
      <div className="seo-topic-grid">{area.topics.map(topic=><article key={topic}><span>✓</span><h3>{topic}</h3></article>)}</div>
    </section>

    <section className="legal-area-band"><div className="section-wrap legal-area-columns">
      <article><span className="section-label light-label">WICHTIGE ERSTE SCHRITTE</span><h2>Darauf kommt es häufig an.</h2><ul>{area.guidance.map(item=><li key={item}>{item}</li>)}</ul></article>
      <article><span className="section-label light-label">UNTERLAGEN</span><h2>Diese Nachweise sind oft hilfreich.</h2><ul>{area.documents.map(item=><li key={item}>{item}</li>)}</ul></article>
    </div></section>

    <section className="section-wrap legal-area-content"><header><span className="section-label">RECHTLICHER RAHMEN</span><h2>Welche Grundlagen können eine Rolle spielen?</h2><p>Je nach Sachverhalt können unter anderem die folgenden Regelungsbereiche relevant sein. Die Nennung allein ist noch keine Aussage darüber, ob im Einzelfall ein Anspruch besteht.</p></header>
      <div className="seo-source-list">{area.sourceLabels.map(source=><span key={source}>§ {source}</span>)}</div>
      <aside className="seo-boundary"><strong>Wann ist ein Anwalt sinnvoll?</strong><p>Bei laufenden oder unklaren Fristen, gerichtlichen Schreiben, hoher finanzieller oder persönlicher Tragweite und in dringenden Situationen sollte der Einzelfall zeitnah anwaltlich geprüft werden. Rechtsfall-Check.de ist keine Kanzlei, vermittelt keine Vertretung und ersetzt keine Rechtsberatung.</p></aside>
    </section>
    <ConversionCta/>
  </main><SiteFooter/></div>;
}
