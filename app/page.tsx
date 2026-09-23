import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ConversionCta,SiteFooter,SiteHeader } from "./components/site-chrome";
import { legalAreas } from "../lib/legal-areas";
import { getSiteUrl } from "../lib/site-url";
import { StructuredData } from "./components/structured-data";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { reviews } from "@/db/schema";
import { reviewTypes } from "@/lib/reviews";
import { PublicSignupLink } from "./components/public-signup-link";

export const metadata:Metadata={title:"Rechtliches Problem klären – Ersteinschätzung für 19 €",description:"Rechtliches Problem schildern, Unterlagen strukturiert analysieren lassen und verständliche Lösungswege mit gezielten Rückfragen erhalten.",alternates:{canonical:"/"}};
export const dynamic = "force-dynamic";

export default async function Home(){
  const siteUrl=getSiteUrl();
  const publishedReviews = await getDb().select({
    id: reviews.id, reviewType: reviews.reviewType, rating: reviews.rating, title: reviews.title,
    body: reviews.body, displayName: reviews.displayName, publishedAt: reviews.publishedAt,
  }).from(reviews).where(eq(reviews.status, "PUBLISHED")).orderBy(desc(reviews.publishedAt)).limit(6).catch(() => []);
  const structuredData={"@context":"https://schema.org","@graph":[{"@type":"Service","@id":`${siteUrl}/#check`,name:"Rechtsfall Check",serviceType:"Digitale Rechtsfallanalyse",description:"Digitales Analysetool für Rechtsfälle mit geführter Fallaufnahme, Dokumentenauswertung, gezielten Rückfragen und persönlicher Ersteinschätzung zu Risiken, offenen Punkten und sinnvollen nächsten Schritten.",areaServed:{"@type":"Country",name:"Deutschland"},provider:{"@id":`${siteUrl}/#organization`},offers:{"@type":"Offer",url:`${siteUrl}/preise`,price:"19.00",priceCurrency:"EUR",availability:"https://schema.org/InStock"}},{"@type":"SoftwareApplication","@id":`${siteUrl}/#webapp`,name:"Rechtsfall Check",applicationCategory:"BusinessApplication",applicationSubCategory:"Legal Technology",operatingSystem:"Web",url:siteUrl,inLanguage:"de-DE",description:"Geführte Web-Anwendung zur strukturierten Vorprüfung eines Rechtsfalls.",offers:{"@type":"Offer",price:"19.00",priceCurrency:"EUR"}}]};
  return <div className="site"><StructuredData data={structuredData}/><SiteHeader/><main>
    <section className="hero-v2">
      <div className="hero-v2-shade"/>
      <div className="hero-v2-content">
        <div className="trust-pill dark-pill">Mehr als eine KI-Antwort: Dein Problem wird strukturiert analysiert.</div>
        <h1>Du hast ein Problem und benötigst Hilfe.<em>Wir finden mit dir den passenden Lösungsweg.</em></h1>
        <p className="hero-v2-lead">Ob Kündigung, Schreiben vom Amt, Ärger mit dem Vermieter, Probleme mit einem Händler, einer Versicherung oder einem Vertrag: Schildere uns, was passiert ist.</p>
        <div className="hero-buttons"><PublicSignupLink className="button button-large">Mein Problem jetzt prüfen lassen <b>→</b></PublicSignupLink><Link href="/so-funktionierts" className="hero-ghost">So wird dein Problem analysiert</Link></div>
        <div className="hero-assurances hero-assurances-light"><span>✓ Kostenlos registrieren</span><span>✓ Kein Abo</span><span>✓ 19 € erst bei Beauftragung</span></div>
      </div>
      <div className="hero-float-card"><small>DAS BEKOMMST DU</small><strong>Deine persönliche Ersteinschätzung</strong><div><span>✓ Was dein Problem für dich bedeutet</span><span>✓ Welche Möglichkeiten du hast</span><span>✓ Worauf du jetzt achten musst</span><span>✓ Ob anwaltliche Hilfe sinnvoll ist</span></div></div>
    </section>

    <section className="case-examples-section">
      <div className="section-wrap">
        <div className="case-examples-head">
          <div className="section-heading"><span className="section-label">PROBLEM ERKENNEN. LÖSUNG FINDEN.</span><h2>Wobei brauchst du Klarheit?</h2><p>Ob Schreiben, Kündigung, Vertrag oder Streit: Wir erfassen dein konkretes Problem, klären offene Fragen und zeigen dir verständlich, welche Möglichkeiten du hast.</p></div>
          <aside aria-label="Vorteile der Fallanalyse"><strong>So wird aus deiner Unsicherheit Klarheit</strong><span>✓ Dein Problem vollständig erfassen</span><span>✓ Wichtige Fakten und Unterlagen prüfen</span><span>✓ Konkrete Lösungswege verstehen</span></aside>
        </div>
        <div className="case-example-grid">
          <Link href="/rechtsgebiete/reiserecht"><i>✈</i><span><small>REISERECHT</small><strong>„Mein Flug wurde gestrichen – bekomme ich mein Geld zurück?“</strong><em>Wir helfen dir zu verstehen, ob Erstattung, Ersatzbeförderung oder weitere Ansprüche infrage kommen können.</em></span><b>→</b></Link>
          <Link href="/rechtsgebiete/arbeitsrecht"><i>§</i><span><small>ARBEITSRECHT</small><strong>„Ich wurde gekündigt – was kann ich jetzt tun?“</strong><em>Wir zeigen dir verständlich, welche Fristen, Angaben und Unterlagen jetzt wichtig sein können.</em></span><b>→</b></Link>
          <Link href="/rechtsgebiete/mietrecht"><i>⌂</i><span><small>MIETRECHT</small><strong>„Mein Vermieter reagiert nicht auf den Mangel – welche Möglichkeiten habe ich?“</strong><em>Wir ordnen deine Nachweise und die bisherige Kommunikation ein und erklären sinnvolle nächste Schritte.</em></span><b>→</b></Link>
          <Link href="/rechtsgebiete/kaufrecht"><i>✓</i><span><small>KAUFRECHT</small><strong>„Die Ware ist mangelhaft – muss der Händler sie zurücknehmen?“</strong><em>Wir erklären dir, welche Rechte bei Mängeln, Nachbesserung, Rückgabe und wichtigen Fristen eine Rolle spielen können.</em></span><b>→</b></Link>
        </div>
      </div>
    </section>

    <section className="section-wrap value-intro"><div><span className="section-label">KEIN KI-CHAT</span><h2>Analysesoftware für rechtliche Probleme.</h2></div><div><p>Rechtsfall-Check.de gibt dir keine allgemeine Antwort auf eine einzelne Frage. Die speziell entwickelte Analysesoftware ordnet dein Problem dem passenden Rechtsgebiet zu, prüft deine Angaben und Unterlagen nach festen Abläufen, erkennt Widersprüche und fehlende Informationen und stellt dir gezielte Rückfragen. Erst daraus entsteht deine KI-gestützte Einordnung mit nachvollziehbaren Lösungswegen.</p><Link href="/rechtsfall-check" className="inline-arrow">So entsteht deine strukturierte Analyse →</Link></div></section>

    <section className="network-partner" aria-labelledby="network-partner-title">
      <div className="section-wrap network-partner-inner">
        <div className="network-partner-mark"><Image src="/bayer-04-netzwerkpartner.png" alt="Bayer 04 Netzwerkpartner" width={1536} height={1307}/></div>
        <div className="network-partner-copy">
          <span className="section-label">GEMEINSAM STARK IN DER REGION</span>
          <h2 id="network-partner-title">Netzwerkpartner von Bayer 04.</h2>
          <p>Rechtsfall-Check.de ist Teil des Bayer 04-Netzwerks. Die Partnerschaft steht für regionale Verbundenheit, verlässliche Zusammenarbeit und den gemeinsamen Anspruch, Menschen mit starken digitalen Lösungen zu unterstützen.</p>
        </div>
      </div>
    </section>

    <section className="benefits section-wrap outcome-preview"><div className="section-heading"><span className="section-label">VOM PROBLEM ZUM LÖSUNGSWEG</span><h2>Du verstehst, worum es wirklich geht.</h2><p>Die Analyse verbindet deine Situation, Unterlagen und Antworten und macht daraus eine nachvollziehbare Orientierung.</p></div><div className="benefit-grid three-column"><article><i>1</i><h3>Problem vollständig erfassen</h3><p>Deine Angaben und Dokumente werden gemeinsam betrachtet und dem passenden Rechtsgebiet zugeordnet.</p></article><article><i>2</i><h3>Offene Punkte gezielt klären</h3><p>Das System erkennt fehlende oder widersprüchliche Informationen und fragt genau dort nach.</p></article><article><i>3</i><h3>Lösungswege verständlich zeigen</h3><p>Du erfährst, welche Möglichkeiten bestehen, worauf du achten solltest und wann anwaltliche Hilfe sinnvoll ist.</p></article></div></section>

    <section className="journey-section section-wrap"><div className="section-heading centered"><span className="section-label">SO WIRD DEIN PROBLEM GEKLÄRT</span><h2>Drei Schritte zum Lösungsweg.</h2><p>Du brauchst keine juristischen Begriffe. Die Analyse führt dich gezielt durch alles, was für dein konkretes Problem wichtig ist.</p></div><div className="journey-cards three-steps"><article><b>01</b><i>✎</i><h3>Problem schildern</h3><p>Beschreibe in deinen Worten, was passiert ist und welches Ergebnis du erreichen möchtest.</p></article><article><b>02</b><i>?</i><h3>Gezielte Fragen beantworten</h3><p>Deine Unterlagen und Antworten werden geprüft. Fehlt etwas Entscheidendes, fragt das System konkret nach.</p></article><article><b>03</b><i>→</i><h3>Lösungswege erhalten</h3><p>Du erhältst eine verständliche Einordnung mit Möglichkeiten, Risiken und sinnvollen nächsten Schritten.</p></article></div><div className="center-link"><Link href="/so-funktionierts" className="button-secondary">Die strukturierte Analyse ansehen →</Link></div></section>

    <section className="areas-preview"><div className="section-wrap"><div className="areas-head"><div><span className="section-label light-label">BIN ICH HIER RICHTIG?</span><h2>Viele Lebenssituationen. Ein verständlicher Einstieg.</h2></div><p>Ob Kündigung, Mietmangel, Rechnung, Vertrag oder Streit mit Nachbarn: Du wählst nur das Thema und schilderst anschließend, was passiert ist.</p></div><div className="area-mini-grid compact-area-grid">{legalAreas.slice(0,6).map(area=><Link href={`/rechtsgebiete/${area.slug}`} key={area.slug}><i>{area.icon}</i><span><strong>{area.title}</strong><small>{area.examples}</small></span><b>→</b></Link>)}</div><Link href="/rechtsgebiete" className="button button-light all-areas">Alle Rechtsgebiete ansehen →</Link></div></section>

    {publishedReviews.length > 0 && <section className="public-reviews">
      <div className="section-wrap"><div className="public-reviews-head"><div><span className="section-label light-label">ECHTE ERFAHRUNGEN</span><h2>So erleben Nutzer den Rechtsfall Check.</h2></div><p>Alle dargestellten Bewertungen stammen aus verifizierten Nutzerkonten und wurden vor der Veröffentlichung geprüft.</p></div>
        <div className="public-review-grid">{publishedReviews.map(review => <article key={review.id}>
          <header><div className="review-stars" aria-label={`${review.rating} von 5 Sternen`}>{"★".repeat(review.rating)}<em>{"★".repeat(5-review.rating)}</em></div><span>Verifizierte Bewertung</span></header>
          <h3>{review.title}</h3><blockquote>{review.body}</blockquote>
          <footer><strong>{review.displayName}</strong><span>{reviewTypes[review.reviewType as keyof typeof reviewTypes] || review.reviewType}</span></footer>
        </article>)}</div>
      </div>
    </section>}

    <section className="responsible section-wrap"><div><span className="section-label">SICHER UND EHRLICH</span><h2>Geschützte Unterlagen. Klare Grenzen.</h2></div><div><p>Deine Dokumente werden geschützt gespeichert und vor dem Upload auf Schadsoftware geprüft. Deine Fallakte ist nur in deinem persönlichen Nutzerkonto zugänglich.</p><p>Der Rechtsfall Check gibt dir eine strukturierte, nicht abschließende Ersteinschätzung. Er ersetzt keine anwaltliche Beratung und trifft keine verbindliche Entscheidung über deinen Fall.</p><p>Wenn Angaben fehlen, eine Frist dringend sein könnte oder anwaltliche Hilfe sinnvoll ist, weist dich das System deutlich darauf hin.</p><Link href="/sicherheit" className="inline-arrow">So schützen und prüfen wir deinen Fall →</Link></div></section>
    <ConversionCta/>
  </main><SiteFooter/></div>
}
