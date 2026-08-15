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

export const metadata:Metadata={title:"Rechtsfall prüfen lassen – Ersteinschätzung für 19 €",description:"Rechtsfall online schildern, Unterlagen prüfen lassen und eine persönliche Ersteinschätzung mit Risiken, offenen Punkten und sinnvollen nächsten Schritten erhalten.",alternates:{canonical:"/"}};
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
        <div className="trust-pill dark-pill">Sie haben ein rechtliches Problem?</div>
        <h1>Rechtsfall-Check.de ·<br/>Ihr digitaler KI-Anwalt<em>Einfach. Verständlich. Hilfreich.</em></h1>
        <p className="hero-v2-lead">Ob Ärger mit dem Arbeitgeber, Vermieter, Händler, einer Versicherung oder Behörde: Rechtsfall-Check.de hilft Ihnen in jeder Lebenslage. Ihre Angaben und Unterlagen werden verständlich eingeordnet – damit Sie wissen, worauf es jetzt ankommt.</p>
        <div className="hero-buttons"><PublicSignupLink className="button button-large">Mein Problem jetzt prüfen <b>→</b></PublicSignupLink><Link href="/so-funktionierts" className="hero-ghost">So funktioniert es</Link></div>
        <div className="hero-assurances hero-assurances-light"><span>✓ Kostenlos registrieren</span><span>✓ Kein Abo</span><span>✓ 19 € erst bei Beauftragung</span></div>
      </div>
      <div className="hero-float-card"><small>DAS ERHALTEN SIE</small><strong>Klarheit für Ihre nächsten Schritte</strong><div><span>✓ Situation verständlich zusammengefasst</span><span>✓ Unterlagen und offene Punkte eingeordnet</span><span>✓ Mögliche Fristen und Risiken erkannt</span><span>✓ Nächste Schritte verständlich erklärt</span></div></div>
    </section>

    <section className="case-examples-section">
      <div className="section-wrap">
        <div className="case-examples-head">
          <div className="section-heading"><span className="section-label">HILFE IN JEDER LEBENSLAGE</span><h2>Was beschäftigt Sie gerade?</h2><p>Rechtsfall-Check.de hilft Ihnen, rechtliche Probleme verständlich einzuordnen und besser zu entscheiden, was Sie als Nächstes tun können.</p></div>
          <aside aria-label="Vorteile der Fallanalyse"><strong>In jeder Lebenslage an Ihrer Seite</strong><span>✓ Ihre Situation verständlich erfassen</span><span>✓ Unterlagen und Fakten einordnen</span><span>✓ Sinnvolle nächste Schritte verstehen</span></aside>
        </div>
        <div className="case-example-grid">
          <Link href="/rechtsgebiete/reiserecht"><i>✈</i><span><small>REISERECHT</small><strong>„Mein Flug wurde gestrichen – bekomme ich mein Geld zurück?“</strong><em>Wir helfen Ihnen zu verstehen, ob Erstattung, Ersatzbeförderung oder weitere Ansprüche infrage kommen können.</em></span><b>→</b></Link>
          <Link href="/rechtsgebiete/arbeitsrecht"><i>§</i><span><small>ARBEITSRECHT</small><strong>„Ich wurde gekündigt – was kann ich jetzt tun?“</strong><em>Wir zeigen Ihnen verständlich, welche Fristen, Angaben und Unterlagen jetzt wichtig sein können.</em></span><b>→</b></Link>
          <Link href="/rechtsgebiete/mietrecht"><i>⌂</i><span><small>MIETRECHT</small><strong>„Mein Vermieter reagiert nicht auf den Mangel – welche Möglichkeiten habe ich?“</strong><em>Wir ordnen Ihre Nachweise und die bisherige Kommunikation ein und erklären sinnvolle nächste Schritte.</em></span><b>→</b></Link>
          <Link href="/rechtsgebiete/kaufrecht"><i>✓</i><span><small>KAUFRECHT</small><strong>„Die Ware ist mangelhaft – muss der Händler sie zurücknehmen?“</strong><em>Wir erklären, welche Rechte bei Mängeln, Nachbesserung, Rückgabe und wichtigen Fristen eine Rolle spielen können.</em></span><b>→</b></Link>
        </div>
      </div>
    </section>

    <section className="section-wrap value-intro"><div><span className="section-label">MEHR ALS EINE EINFACHE KI-ANTWORT</span><h2>Ihre Situation wird zusammenhängend analysiert.</h2></div><div><p>Rechtsfall-Check.de ist eine digitale Analyseplattform mit KI-Integration. Ihre Angaben, Unterlagen und Antworten werden gemeinsam ausgewertet. Fehlt etwas Wichtiges, stellt das System gezielte Rückfragen und zeigt anschließend verständlich, welche Tatsachen, Risiken und nächsten Schritte für Ihr rechtliches Problem relevant sind.</p><Link href="/rechtsfall-check" className="inline-arrow">Das bekommen Sie für Ihre Situation →</Link></div></section>

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

    <section className="benefits section-wrap outcome-preview"><div className="section-heading"><span className="section-label">DAS ERHALTEN SIE</span><h2>Eine klare Einordnung Ihres Falls.</h2><p>Das Ergebnis trennt verständlich zwischen bekannten Tatsachen, offenen Punkten und dem weiteren Prüfbedarf.</p></div><div className="benefit-grid three-column"><article><i>✓</i><h3>Was bekannt und belegt ist</h3><p>Sie sehen, welche Tatsachen durch Ihre Angaben oder Dokumente gestützt werden.</p></article><article><i>?</i><h3>Was noch offen ist</h3><p>Fehlende Informationen, mögliche Risiken und ungeklärte Punkte werden sichtbar.</p></article><article><i>→</i><h3>Was als Nächstes geprüft werden sollte</h3><p>Sie erhalten eine verständliche Orientierung für Ihre nächsten sinnvollen Schritte.</p></article></div></section>

    <section className="journey-section section-wrap"><div className="section-heading centered"><span className="section-label">SO EINFACH FUNKTIONIERT ES</span><h2>Drei Schritte zu mehr Klarheit.</h2><p>Sie müssen keine juristischen Begriffe kennen. Wir führen Sie verständlich durch alle wichtigen Angaben.</p></div><div className="journey-cards three-steps"><article><b>01</b><i>✎</i><h3>Situation schildern</h3><p>Erzählen Sie in Ihren Worten, was passiert ist und was Sie erreichen möchten.</p></article><article><b>02</b><i>↥</i><h3>Unterlagen ergänzen</h3><p>Laden Sie vorhandene Dokumente hoch. Nur wenn etwas Wesentliches fehlt, folgen gezielte Rückfragen.</p></article><article><b>03</b><i>→</i><h3>Orientierung erhalten</h3><p>Lesen Sie Ihre verständliche Ersteinschätzung mit Fakten, offenen Punkten und nächsten Prüfschritten.</p></article></div><div className="center-link"><Link href="/so-funktionierts" className="button-secondary">Alle Schritte einfach erklärt →</Link></div></section>

    <section className="areas-preview"><div className="section-wrap"><div className="areas-head"><div><span className="section-label light-label">BIN ICH HIER RICHTIG?</span><h2>Viele Lebenssituationen. Ein verständlicher Einstieg.</h2></div><p>Ob Kündigung, Mietmangel, Rechnung, Vertrag oder Streit mit Nachbarn: Sie wählen nur das Thema und schildern anschließend, was passiert ist.</p></div><div className="area-mini-grid compact-area-grid">{legalAreas.slice(0,6).map(area=><Link href={`/rechtsgebiete/${area.slug}`} key={area.slug}><i>{area.icon}</i><span><strong>{area.title}</strong><small>{area.examples}</small></span><b>→</b></Link>)}</div><Link href="/rechtsgebiete" className="button button-light all-areas">Alle Rechtsgebiete ansehen →</Link></div></section>

    {publishedReviews.length > 0 && <section className="public-reviews">
      <div className="section-wrap"><div className="public-reviews-head"><div><span className="section-label light-label">ECHTE ERFAHRUNGEN</span><h2>So erleben Nutzer den Rechtsfall Check.</h2></div><p>Alle dargestellten Bewertungen stammen aus verifizierten Nutzerkonten und wurden vor der Veröffentlichung geprüft.</p></div>
        <div className="public-review-grid">{publishedReviews.map(review => <article key={review.id}>
          <header><div className="review-stars" aria-label={`${review.rating} von 5 Sternen`}>{"★".repeat(review.rating)}<em>{"★".repeat(5-review.rating)}</em></div><span>Verifizierte Bewertung</span></header>
          <h3>{review.title}</h3><blockquote>{review.body}</blockquote>
          <footer><strong>{review.displayName}</strong><span>{reviewTypes[review.reviewType as keyof typeof reviewTypes] || review.reviewType}</span></footer>
        </article>)}</div>
      </div>
    </section>}

    <section className="responsible section-wrap"><div><span className="section-label">SICHER UND EHRLICH</span><h2>Geschützte Unterlagen. Klare Grenzen.</h2></div><div><p>Ihre Dokumente werden geschützt gespeichert und vor dem Upload auf Schadsoftware geprüft. Ihre Fallakte ist nur in Ihrem persönlichen Nutzerkonto zugänglich.</p><p>Der Rechtsfall Check gibt Ihnen eine strukturierte, nicht abschließende Ersteinschätzung. Er ersetzt keine anwaltliche Beratung und trifft keine verbindliche Entscheidung über Ihren Fall.</p><p>Wenn Angaben fehlen, eine Frist dringend sein könnte oder anwaltliche Hilfe sinnvoll ist, weist das System deutlich darauf hin.</p><Link href="/sicherheit" className="inline-arrow">So schützen und prüfen wir Ihren Fall →</Link></div></section>
    <ConversionCta/>
  </main><SiteFooter/></div>
}
