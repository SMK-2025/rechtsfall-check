import type { Metadata } from "next";
import Link from "next/link";
import { ConversionCta,SiteFooter,SiteHeader } from "./components/site-chrome";
import { legalAreas } from "../lib/legal-areas";
import { getSiteUrl } from "../lib/site-url";
import { StructuredData } from "./components/structured-data";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { reviews } from "@/db/schema";
import { reviewTypes } from "@/lib/reviews";

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
      <div className="hero-v2-content"><div className="trust-pill dark-pill">Sie haben rechtliche Probleme?</div><h1>Wir geben Ihnen Klarheit<br/><em>über Ihren Rechtsfall.</em></h1><p className="hero-v2-lead">Mit Rechtsfall-Check.de verstehen Sie ohne Anwaltsdeutsch, worauf es jetzt ankommt. Prüfen Sie Ihren Fall sicher und erhalten Sie eine Fallanalyse, die Ihnen bei den nächsten Schritten weiterhilft.</p><div className="hero-buttons"><Link href="/anmelden?mode=signup" className="button button-large">Rechtsfall Check starten <b>→</b></Link><Link href="/so-funktionierts" className="hero-ghost">So funktioniert es</Link></div><div className="hero-assurances hero-assurances-light"><span>✓ Einmalig 19 €</span><span>✓ Kein Abo</span><span>✓ Geschützte Dokumente</span></div></div>
      <div className="hero-float-card"><small>IHRE ERSTEINSCHÄTZUNG</small><strong>Wissen, worauf es jetzt ankommt</strong><div><span>✓ Rechtsfall verständlich zusammengefasst</span><span>✓ Chancen, Risiken und offene Punkte eingeordnet</span><span>✓ Relevante Unterlagen und mögliche Fristen erkannt</span><span>✓ Sinnvolle nächste Schritte verständlich erklärt</span></div></div>
    </section>

    <section className="comparison-ribbon"><div><small>RECHTSFALL CHECK</small><strong>19 €</strong><span>je Fall, kein Abo</span></div><i>statt direkt in eine kostenintensivere Beratung zu starten</i><div><small>ANWALTLICHES ERSTGESPRÄCH</small><strong>bis 190 €*</strong><span>zzgl. USt., sofern nichts vereinbart</span></div><p>* Gesetzlicher Höchstbetrag für Verbraucher ohne Vergütungsvereinbarung nach § 34 RVG. Der Rechtsfall Check ist keine anwaltliche Erstberatung.</p></section>

    <section className="section-wrap value-intro"><div><span className="section-label">MEHR ALS EINE EINFACHE KI-ANTWORT</span><h2>Nicht nur fragen.<br/>Den Fall wirklich verstehen.</h2></div><div><p>Ein Rechtsproblem lässt sich selten mit einem einzigen Satz erklären. Deshalb führt Sie der Rechtsfall Check Schritt für Schritt durch Ihren Fall. Ihre Angaben und Unterlagen werden zusammen betrachtet. Fehlt etwas Wichtiges, fragt das System gezielt nach.</p><Link href="/rechtsfall-check" className="inline-arrow">Das bekommen Sie für Ihren Fall →</Link></div></section>

    <section className="benefits section-wrap"><div className="section-heading"><span className="section-label">SO WIRD IHR FALL GEPRÜFT</span><h2>Vier Schritte.<br/>Ein verständliches Ergebnis.</h2></div><div className="benefit-grid"><article><i>01</i><h3>Sie schildern Ihr Problem</h3><p>Sie beschreiben in Ihren eigenen Worten, was passiert ist und was Sie erreichen möchten.</p></article><article><i>02</i><h3>Sie laden Unterlagen hoch</h3><p>Verträge, Schreiben, Rechnungen und Fotos werden sicher geprüft, gelesen und Ihrem Fall zugeordnet.</p></article><article><i>03</i><h3>Das System fragt nach</h3><p>Fehlen wichtige Angaben, erhalten Sie passende Rückfragen zu Ihrem konkreten Fall.</p></article><article><i>04</i><h3>Sie erhalten Orientierung</h3><p>Das Ergebnis erklärt wichtige Fakten, mögliche Fristen, offene Punkte und sinnvolle nächste Prüfschritte.</p></article></div></section>

    <section className="journey-section section-wrap"><div className="section-heading centered"><span className="section-label">EINFACH DURCH DEN GANZEN FALL</span><h2>Sie müssen keine juristischen Begriffe kennen.</h2><p>Wir führen Sie verständlich durch alle Angaben, die für die Vorprüfung wichtig sind.</p></div><div className="journey-cards"><article><b>01</b><i>✎</i><h3>Fall erzählen</h3><p>Schreiben Sie einfach auf, was passiert ist. So, wie Sie es erlebt haben.</p></article><article><b>02</b><i>↥</i><h3>Unterlagen ergänzen</h3><p>Laden Sie vorhandene Verträge, Schreiben, Belege oder Fotos hoch.</p></article><article><b>03</b><i>✦</i><h3>Kurze Fragen klären</h3><p>Nur wenn etwas Wichtiges fehlt, fragt das System noch einmal verständlich nach.</p></article><article><b>04</b><i>→</i><h3>Rechtsfall Check lesen</h3><p>Sie sehen auf einen Blick, was belegt ist, was offen bleibt und was als Nächstes sinnvoll sein kann.</p></article></div><div className="center-link"><Link href="/so-funktionierts" className="button-secondary">Alle Schritte einfach erklärt →</Link></div></section>

    <section className="benefits section-wrap"><div className="section-heading"><span className="section-label">TYPISCHE ANWENDUNGSSITUATIONEN</span><h2>Wobei der Rechtsfall Check Orientierung schafft.</h2><p>Beispiele für typische Ausgangslagen – keine erfundenen Kundenstimmen.</p></div><div className="benefit-grid"><article><i>?</i><h3>„Ist das überhaupt rechtlich relevant?“</h3><p>Der Check ordnet den Sachverhalt und zeigt, welche Tatsachen und Grundlagen genauer geprüft werden sollten.</p></article><article><i>≡</i><h3>„Welche Unterlagen zählen?“</h3><p>Die Analyse trennt vorhandene Nachweise von noch fehlenden Informationen.</p></article><article><i>!</i><h3>„Gibt es ein Fristenrisiko?“</h3><p>Mögliche zeitkritische Punkte werden sichtbar gemacht – ohne eine verbindliche Fristenkontrolle vorzutäuschen.</p></article><article><i>→</i><h3>„Was ist jetzt sinnvoll?“</h3><p>Das Ergebnis zeigt den nächsten Prüfbedarf und wann anwaltliche Unterstützung angezeigt ist.</p></article></div></section>

    <section className="areas-preview"><div className="section-wrap"><div className="areas-head"><div><span className="section-label light-label">VIELE RECHTSGEBIETE · EIN EINSTIEG</span><h2>Welches rechtliche Problem beschäftigt Sie?</h2></div><p>Von Arbeits- und Mietrecht über Nachbarschafts-, Vertrags- und Verbraucherfragen bis zu Behörden-, Familien- oder Strafsachen: Die geführte Fallaufnahme stellt die passenden Themen und Hilfestellungen bereit.</p></div><div className="area-mini-grid">{legalAreas.slice(0,8).map(area=><Link href={`/rechtsgebiete/${area.slug}`} key={area.slug}><i>{area.icon}</i><span><strong>{area.title}</strong><small>{area.examples}</small></span><b>→</b></Link>)}</div><Link href="/rechtsgebiete" className="button button-light all-areas">Alle Rechtsgebiete entdecken →</Link></div></section>

    <section className="benefits section-wrap"><div className="section-heading"><span className="section-label">IHR ERGEBNIS</span><h2>Keine Blackbox.<br/>Ein nachvollziehbarer Rechtsfall Check.</h2></div><div className="benefit-grid"><article><i>✓</i><h3>Was belegt ist</h3><p>Welche Tatsachen durch Ihre Angaben oder Dokumente gestützt werden.</p></article><article><i>?</i><h3>Was noch fehlt</h3><p>Welche Rückfragen und Unterlagen für eine bessere Einordnung wichtig sind.</p></article><article><i>§</i><h3>Was relevant sein kann</h3><p>Welche geprüften Rechtsgrundlagen und Fristen grundsätzlich in Betracht kommen.</p></article><article><i>→</i><h3>Was als Nächstes zählt</h3><p>Ob weitere Informationen, eine Fristprüfung oder anwaltliche Hilfe angezeigt ist.</p></article></div></section>

    {publishedReviews.length > 0 && <section className="public-reviews">
      <div className="section-wrap"><div className="public-reviews-head"><div><span className="section-label light-label">ECHTE ERFAHRUNGEN</span><h2>So erleben Nutzer den Rechtsfall Check.</h2></div><p>Alle dargestellten Bewertungen stammen aus verifizierten Nutzerkonten und wurden vor der Veröffentlichung geprüft.</p></div>
        <div className="public-review-grid">{publishedReviews.map(review => <article key={review.id}>
          <header><div className="review-stars" aria-label={`${review.rating} von 5 Sternen`}>{"★".repeat(review.rating)}<em>{"★".repeat(5-review.rating)}</em></div><span>Verifizierte Bewertung</span></header>
          <h3>{review.title}</h3><blockquote>{review.body}</blockquote>
          <footer><strong>{review.displayName}</strong><span>{reviewTypes[review.reviewType as keyof typeof reviewTypes] || review.reviewType}</span></footer>
        </article>)}</div>
      </div>
    </section>}

    <section className="responsible section-wrap"><div><span className="section-label">EHRLICHE ORIENTIERUNG</span><h2>Keine leeren Versprechen. Klare Grenzen.</h2></div><div><p>Der Rechtsfall Check gibt Ihnen eine strukturierte, nicht abschließende Ersteinschätzung. Er ersetzt keine anwaltliche Beratung und trifft keine verbindliche Entscheidung über Ihren Fall.</p><p>Wenn Angaben fehlen, eine Frist dringend sein könnte oder ein Anwalt übernehmen sollte, sagt das System das deutlich. So wissen Sie, wann weitere Hilfe sinnvoll ist.</p><Link href="/sicherheit" className="inline-arrow">So schützen und prüfen wir Ihren Fall →</Link></div></section>
    <ConversionCta/>
  </main><SiteFooter/></div>
}
