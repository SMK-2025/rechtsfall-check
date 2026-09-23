import type { Metadata } from "next";
import Link from "next/link";
import { ConversionCta, SiteFooter, SiteHeader } from "../components/site-chrome";
import { legalAreas } from "../../lib/legal-areas";
import { PublicSignupLink } from "../components/public-signup-link";

export const metadata: Metadata = {
  title: "Rechtsgebiete für den Rechtsfall Check",
  description: "Rechtsfall Check für Kaufrecht, Arbeitsrecht, Mietrecht, Verkehrsrecht, Familienrecht, Vertragsrecht und weitere Rechtsgebiete.",
  alternates: { canonical: "/rechtsgebiete" },
};

export default function AreasPage() {
  return <div className="site legal-areas-page"><SiteHeader/><main>
    <section className="subhero areas-subhero"><div><span className="section-label light-label">RECHTSGEBIETE</span><h1>Ein Einstieg für deine rechtliche Frage.</h1><p>Der Rechtsfall Check strukturiert deinen Sachverhalt, ordnet Unterlagen und zeigt die relevanten Informations- und Prüfschritte.</p></div></section>
    <section className="areas-page section-wrap"><div className="section-heading"><span className="section-label">TYPISCHE RECHTSFRAGEN</span><h2>Worum geht es in deinem Fall?</h2><p>Wähle ein Rechtsgebiet oder starte ohne sichere Zuordnung. Innerhalb der Fallakte stehen passende Themen, Hilfestellungen und Unterlagen-Checklisten bereit.</p></div>
      <div className="area-page-grid">{legalAreas.map(area=><article id={area.slug} key={area.slug}><i>{area.icon}</i><div><h3><Link href={`/rechtsgebiete/${area.slug}`}>{area.title}</Link></h3><p>{area.examples}</p><span>{area.risk==="urgent"?"Sofortige fachkundige Hilfe kann erforderlich sein":area.risk==="heightened"?"Besondere Fristen- und Risikoprüfung":"Rechtsfall Check verfügbar"}</span><Link className="area-detail-link" href={`/rechtsgebiete/${area.slug}`}>Themen und Unterlagen ansehen →</Link></div></article>)}</div>
    </section>
    <section className="areas-scope-band"><div className="section-wrap scope-note"><h2>Nicht sicher, welches Rechtsgebiet passt?</h2><p>Kein Problem. Wähle „Anderes Thema / noch unsicher“ und schildere den Fall in deinen Worten. Bei akuten Fristen, laufenden Gerichtsverfahren, Haft, Durchsuchung oder anderen eilbedürftigen Situationen solltest du unmittelbar anwaltliche Hilfe einholen.</p><PublicSignupLink className="button">Zur kostenlosen Registrierung →</PublicSignupLink></div></section>
    <ConversionCta compact/><SiteFooter/>
  </main></div>;
}
