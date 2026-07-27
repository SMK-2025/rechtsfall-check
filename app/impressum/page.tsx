import type {Metadata} from "next";
import {SiteFooter,SiteHeader} from "@/app/components/site-chrome";
import "../legal-pages.css";

export const metadata:Metadata={title:"Impressum",description:"Anbieterkennzeichnung und Kontakt von Rechtsfall-Check.de.",alternates:{canonical:"/impressum"}};

export default function ImprintPage(){return <div className="site"><SiteHeader/><main>
  <header className="legal-hero"><span className="section-label">RECHTLICHES</span><h1>Impressum</h1><p>Anbieterkennzeichnung für Rechtsfall-Check.de gemäß § 5 Digitale-Dienste-Gesetz (DDG).</p></header>
  <div className="legal-shell"><nav className="legal-toc" aria-label="Inhalt"><strong>INHALT</strong><a href="#anbieter">Anbieter</a><a href="#kontakt">Kontakt</a><a href="#verantwortlich">Verantwortlich</a><a href="#streitbeilegung">Streitbeilegung</a><a href="#hinweise">Hinweise</a></nav>
  <article className="legal-content">
    <section id="anbieter"><h2>Anbieter und Betreiber</h2><div className="legal-contact"><p><strong>Media Online Innovations Group</strong></p><p>Inhaber: Martin Kelm</p><p>Im Weidenblech 25</p><p>51371 Leverkusen</p><p>Deutschland</p></div><p>Rechtsfall-Check.de ist ein Angebot der Media Online Innovations Group.</p></section>
    <section id="kontakt"><h2>Kontakt</h2><p>Telefon: <a href="tel:+4921433014060">0214 / 330 140 60</a><br/>E-Mail: <a href="mailto:mail@media-online-innovations.group">mail@media-online-innovations.group</a><br/>Web: <a href="https://www.media-online-innovations.group">www.media-online-innovations.group</a></p><p>Bitte übermitteln Sie sensible Fallunterlagen nicht unverschlüsselt per E-Mail. Nutzen Sie dafür ausschließlich den geschützten Fallraum.</p></section>
    <section id="verantwortlich"><h2>Redaktionell verantwortlich</h2><p>Verantwortlich für journalistisch-redaktionelle Inhalte, soweit anwendbar:</p><p>Martin Kelm<br/>Im Weidenblech 25<br/>51371 Leverkusen</p></section>
    <section id="streitbeilegung"><h2>Verbraucherstreitbeilegung</h2><p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p><p>Die frühere europäische Plattform zur Online-Streitbeilegung wurde zum 20. Juli 2025 eingestellt und wird daher nicht mehr verlinkt.</p></section>
    <section id="hinweise"><h2>Rechtliche Hinweise zum Angebot</h2><p>Rechtsfall-Check.de ist keine Rechtsanwaltskanzlei. Die Plattform bietet eine KI-gestützte, strukturierte Vorprüfung und eine nicht abschließende Ersteinschätzung. Sie erbringt keine anwaltliche Vertretung und keine verbindliche Rechtsberatung oder finale Einzelfallentscheidung.</p><p>Inhalte dieser Website dienen der allgemeinen Produktinformation. Sie begründen ohne ausdrücklich bestätigten Vertrag keine individuelle Beratungsbeziehung.</p></section>
  </article></div><SiteFooter/></main></div>}
