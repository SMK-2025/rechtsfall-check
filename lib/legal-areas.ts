export type LegalAreaRisk = "standard" | "heightened" | "urgent";

export type LegalArea = {
  id: string;
  slug: string;
  icon: string;
  title: string;
  shortTitle: string;
  examples: string;
  risk: LegalAreaRisk;
  topics: readonly string[];
  guidance: readonly string[];
  documents: readonly string[];
  sourceLabels: readonly string[];
};

export const legalAreas: readonly LegalArea[] = [
  {
    id: "employment", slug: "arbeitsrecht", icon: "▣", title: "Arbeitsrecht", shortTitle: "Arbeitsrecht",
    examples: "Kündigung, Abmahnung, Arbeitszeugnis, Lohn, Urlaub und Arbeitsvertrag", risk: "heightened",
    topics: ["Kündigung oder Aufhebungsvertrag", "Abmahnung", "Lohn oder Überstunden", "Arbeitszeugnis", "Urlaub oder Krankheit", "Befristung", "Diskriminierung oder Mobbing", "Sonstiges arbeitsrechtliches Thema"],
    guidance: ["Zugangsdaten von Kündigungen und Schreiben genau festhalten.", "Arbeitsvertrag, Abrechnungen und Kommunikation vollständig sichern.", "Bei Kündigungen können kurze Klagefristen laufen; eine umgehende anwaltliche Prüfung kann erforderlich sein."],
    documents: ["Arbeitsvertrag und Nachträge", "Kündigung oder Abmahnung", "Lohnabrechnungen", "E-Mails, Nachrichten und Zeugnisse"],
    sourceLabels: ["BGB – Dienstvertrag", "Kündigungsschutzgesetz", "Arbeitszeitgesetz", "Bundesurlaubsgesetz"],
  },
  {
    id: "tenancy", slug: "mietrecht", icon: "⌂", title: "Miet- & Wohnrecht", shortTitle: "Mietrecht",
    examples: "Mieterhöhung, Mängel, Kaution, Kündigung, Nebenkosten und Eigentümergemeinschaft", risk: "standard",
    topics: ["Mietmangel oder Schimmel", "Mieterhöhung", "Nebenkostenabrechnung", "Kaution", "Kündigung oder Räumung", "Modernisierung", "Wohnungseigentum / WEG", "Sonstiges Miet- oder Wohnproblem"],
    guidance: ["Mängel mit Datum, Fotos und Zeugen dokumentieren.", "Vertrag, Übergabeprotokoll und Abrechnungen zusammenstellen.", "Vor einer Mietminderung sollten Voraussetzungen und Höhe individuell geprüft werden."],
    documents: ["Mietvertrag", "Übergabeprotokoll", "Nebenkostenabrechnung", "Fotos und Schriftverkehr"],
    sourceLabels: ["BGB §§ 535 ff. – Mietrecht", "Betriebskostenverordnung", "Wohnungseigentumsgesetz"],
  },
  {
    id: "neighbour_property", slug: "nachbarrecht", icon: "⌂", title: "Nachbarrecht & Grundstück", shortTitle: "Nachbarrecht",
    examples: "Lärm, Grenze, Bäume, Hecken, Wegerecht, Zaun und Bauvorhaben", risk: "standard",
    topics: ["Lärm oder sonstige Störungen", "Grundstücksgrenze oder Grenzbebauung", "Bäume, Hecken oder Überwuchs", "Wegerecht oder Zufahrt", "Sichtschutz, Zaun oder Mauer", "Bauvorhaben des Nachbarn", "Beschädigung des Grundstücks", "Sonstiger Nachbarschaftskonflikt"],
    guidance: ["Störungen mit Datum, Dauer und möglichen Zeugen dokumentieren.", "Flurkarte, Grundbuchangaben und vorhandene Vereinbarungen bereithalten.", "Nachbarrecht kann vom Bundesland und von kommunalen Regeln abhängen."],
    documents: ["Fotos oder Videos", "Lärm- oder Ereignisprotokoll", "Flurkarte und Grundbuchauszug", "Schriftverkehr mit Nachbarn oder Behörden"],
    sourceLabels: ["BGB §§ 903 ff. – Eigentum und Nachbarrecht", "Landesnachbarrechtsgesetze", "Örtliche Satzungen und Bauordnungsrecht"],
  },
  {
    id: "consumer_purchase", slug: "kaufrecht", icon: "□", title: "Kauf- & Verbraucherrecht", shortTitle: "Kaufrecht",
    examples: "Mängel, Widerruf, Onlinekauf, Garantie, Lieferung und Rückzahlung", risk: "standard",
    topics: ["Mangelhafte Ware oder Kaufvertrag", "Lieferung verspätet oder ausgeblieben", "Widerruf oder Rückgabe", "Garantie oder Gewährleistung", "Erstattung oder Rückzahlung", "Online-Marktplatz oder Privatkauf", "Abo oder unerwünschter Vertrag", "Sonstiges Verbraucherproblem"],
    guidance: ["Bestellung, Rechnung und Lieferdatum sichern.", "Mängel mit Fotos und einer nachvollziehbaren Beschreibung dokumentieren.", "Kommunikation mit Händler oder Plattform vollständig aufbewahren."],
    documents: ["Bestellung, Kaufvertrag oder Rechnung", "Fotos des Mangels", "Liefer- und Rücksendenachweise", "Kommunikation mit dem Verkäufer"],
    sourceLabels: ["BGB §§ 433 ff. – Kaufvertrag", "BGB §§ 437 ff. – Mängelrechte", "BGB §§ 312 ff. – Verbraucherverträge"],
  },
  {
    id: "contract", slug: "vertragsrecht", icon: "✎", title: "Vertragsrecht", shortTitle: "Vertragsrecht",
    examples: "Vertragsprüfung, Kündigung, Forderungen, Leistungsstörungen und Werkverträge", risk: "standard",
    topics: ["Vertragsschluss oder Vertragsinhalt", "Kündigung oder Vertragslaufzeit", "Nicht erbrachte Leistung", "Zahlungsforderung oder Rechnung", "Werkvertrag oder Handwerker", "Schadensersatzforderung", "Allgemeine Geschäftsbedingungen", "Sonstiger Vertragsstreit"],
    guidance: ["Vertrag, Anlagen und Änderungen in zeitlicher Reihenfolge sammeln.", "Leistungsversprechen und Abweichungen konkret gegenüberstellen.", "Zahlungen, Mahnungen und gesetzte Fristen dokumentieren."],
    documents: ["Vertrag und AGB", "Angebote und Rechnungen", "Abnahme- oder Leistungsnachweise", "Mahnungen und Schriftverkehr"],
    sourceLabels: ["BGB – Allgemeines Schuldrecht", "BGB §§ 145 ff. – Vertragsschluss", "BGB §§ 280 ff. – Pflichtverletzungen"],
  },
  {
    id: "traffic", slug: "verkehrsrecht", icon: "◇", title: "Verkehrsrecht", shortTitle: "Verkehrsrecht",
    examples: "Unfall, Bußgeld, Führerschein, Fahrzeugmängel und Schadensregulierung", risk: "heightened",
    topics: ["Verkehrsunfall", "Bußgeldbescheid", "Führerschein oder Fahrerlaubnis", "Fahrzeugkauf oder Werkstatt", "Versicherungsregulierung", "Parkverstoß", "Personenschaden", "Sonstiger Verkehrsfall"],
    guidance: ["Unfallort, Schäden, Beteiligte und Zeugen unverzüglich dokumentieren.", "Bescheide mit Zustellungsdatum aufbewahren; Einspruchsfristen können kurz sein.", "Keine Schuldanerkenntnisse abgeben, ohne die Folgen geprüft zu haben."],
    documents: ["Unfallbericht und Fotos", "Bußgeldbescheid oder Anhörung", "Gutachten und Reparaturrechnung", "Versicherungsschriftverkehr"],
    sourceLabels: ["Straßenverkehrsgesetz", "Straßenverkehrs-Ordnung", "Ordnungswidrigkeitengesetz", "BGB – Schadensersatz"],
  },
  {
    id: "family", slug: "familienrecht", icon: "○", title: "Familienrecht", shortTitle: "Familienrecht",
    examples: "Trennung, Scheidung, Unterhalt, Sorgerecht, Umgang und Zugewinn", risk: "heightened",
    topics: ["Trennung oder Scheidung", "Kindesunterhalt", "Ehegattenunterhalt", "Sorgerecht", "Umgangsrecht", "Zugewinn oder Vermögen", "Gewaltschutz", "Sonstiges Familienthema"],
    guidance: ["Absprachen, Zahlungen und wichtige Ereignisse sachlich dokumentieren.", "Einkommens- und Vermögensunterlagen geordnet bereithalten.", "Bei Gewalt, Kindeswohlgefährdung oder akuter Eskalation sofort geeignete Hilfe einschalten."],
    documents: ["Heirats- und Geburtsurkunden", "Einkommensnachweise", "Vereinbarungen und Beschlüsse", "Relevanter Schriftverkehr"],
    sourceLabels: ["BGB – Familienrecht", "FamFG", "Unterhaltsrechtliche Leitlinien", "Gewaltschutzgesetz"],
  },
  {
    id: "inheritance", slug: "erbrecht", icon: "⌁", title: "Erbrecht", shortTitle: "Erbrecht",
    examples: "Testament, Pflichtteil, Erbengemeinschaft, Ausschlagung und Nachlass", risk: "heightened",
    topics: ["Testament oder Erbvertrag", "Pflichtteil", "Erbengemeinschaft", "Erbausschlagung", "Nachlass und Schulden", "Erbschein", "Schenkung zu Lebzeiten", "Sonstiges Erbthema"],
    guidance: ["Testamente und Urkunden im Originalzustand sichern.", "Kenntnis- und Zustellungsdaten genau notieren; Ausschlagungsfristen können kurz sein.", "Vermögen und mögliche Nachlassverbindlichkeiten getrennt erfassen."],
    documents: ["Testament oder Erbvertrag", "Sterbeurkunde", "Nachlassverzeichnis", "Schreiben des Nachlassgerichts"],
    sourceLabels: ["BGB §§ 1922 ff. – Erbrecht", "FamFG – Nachlassverfahren"],
  },
  {
    id: "insurance", slug: "versicherungsrecht", icon: "◈", title: "Versicherungsrecht", shortTitle: "Versicherungsrecht",
    examples: "Leistungsablehnung, Schadensfall, Berufsunfähigkeit und Vertragsauslegung", risk: "standard",
    topics: ["Leistungsablehnung", "Schadensregulierung", "Berufsunfähigkeit", "Krankenversicherung", "Haftpflichtversicherung", "Kündigung oder Beitrag", "Obliegenheitsverletzung", "Sonstiger Versicherungsfall"],
    guidance: ["Versicherungsbedingungen und Nachträge vollständig sichern.", "Schaden und Meldung mit Datum nachvollziehbar dokumentieren.", "Ablehnungsschreiben auf Begründung und genannte Fristen prüfen lassen."],
    documents: ["Versicherungsschein und Bedingungen", "Schadenmeldung", "Ablehnungsschreiben", "Gutachten und Nachweise"],
    sourceLabels: ["Versicherungsvertragsgesetz", "BGB – Vertragsrecht"],
  },
  {
    id: "social", slug: "sozialrecht", icon: "+", title: "Sozialrecht", shortTitle: "Sozialrecht",
    examples: "Bescheid, Bürgergeld, Rente, Pflege, Krankengeld und Schwerbehinderung", risk: "heightened",
    topics: ["Bürgergeld oder Grundsicherung", "Rente", "Pflegegrad", "Krankengeld", "Arbeitslosengeld", "Schwerbehinderung", "Rückforderung", "Sonstiger Sozialleistungsbescheid"],
    guidance: ["Bescheid und Umschlag beziehungsweise Zustellungsdatum sichern.", "Widerspruchs- und Klagefristen können kurz sein.", "Medizinische und finanzielle Nachweise vollständig zusammenstellen."],
    documents: ["Bescheid und Rechtsbehelfsbelehrung", "Antrag und Anlagen", "Medizinische Unterlagen", "Schriftverkehr mit der Behörde"],
    sourceLabels: ["Sozialgesetzbücher", "Sozialgerichtsgesetz"],
  },
  {
    id: "bank_finance", slug: "bankrecht", icon: "▤", title: "Bank- & Finanzrecht", shortTitle: "Bankrecht",
    examples: "Kredit, Kontosperre, Zahlungsverkehr, Anlage und unberechtigte Abbuchung", risk: "heightened",
    topics: ["Kredit oder Darlehen", "Kontosperre oder Kündigung", "Unberechtigte Zahlung", "Kreditkarte oder Onlinebanking", "Geldanlage oder Beratung", "Vorfälligkeitsentschädigung", "Inkasso oder Forderung", "Sonstiges Bankthema"],
    guidance: ["Umsätze und verdächtige Vorgänge unverzüglich sichern und melden.", "Verträge, Beratungsprotokolle und Produktinformationen zusammentragen.", "Bei Betrugsverdacht Zugangsdaten sperren und Bank beziehungsweise Polizei kontaktieren."],
    documents: ["Kontoauszüge", "Kredit- oder Anlagevertrag", "Beratungsprotokoll", "Reklamationen und Bankantworten"],
    sourceLabels: ["BGB – Darlehen und Zahlungsdienste", "Zahlungsdiensteaufsichtsrecht", "Wertpapierhandelsrecht"],
  },
  {
    id: "digital_privacy", slug: "internetrecht", icon: "@", title: "Internet-, Medien- & Datenschutzrecht", shortTitle: "Internetrecht",
    examples: "Datenschutz, Accounts, Bewertungen, Abmahnungen, Urheberrecht und digitale Verträge", risk: "heightened",
    topics: ["Datenschutz oder Auskunft", "Account gesperrt oder gehackt", "Bewertung oder Persönlichkeitsrecht", "Urheberrecht oder Abmahnung", "Onlinevertrag oder Plattform", "Domain oder Website", "Betrug im Internet", "Sonstiges digitales Thema"],
    guidance: ["Screenshots mit Datum, URL und vollständigem Kontext erstellen.", "E-Mails, Headerdaten und Plattformnachrichten sichern.", "Abmahnungen und gerichtliche Schreiben wegen möglicher Fristen nicht ignorieren."],
    documents: ["Screenshots und URLs", "Abmahnung oder Plattformmitteilung", "Verträge und Rechnungen", "Datenschutzkorrespondenz"],
    sourceLabels: ["Datenschutz-Grundverordnung", "Bundesdatenschutzgesetz", "Digitale-Dienste-Gesetz", "Urheberrechtsgesetz"],
  },
  {
    id: "travel", slug: "reiserecht", icon: "↗", title: "Reiserecht", shortTitle: "Reiserecht",
    examples: "Pauschalreise, Flugausfall, Verspätung, Unterkunft und Reisemängel", risk: "standard",
    topics: ["Flugverspätung oder Annullierung", "Pauschalreisemangel", "Unterkunft oder Buchung", "Gepäck", "Rücktritt oder Stornierung", "Reiseversicherung", "Erstattung", "Sonstiges Reiseproblem"],
    guidance: ["Buchung, Zeiten und tatsächlichen Ablauf dokumentieren.", "Mängel möglichst vor Ort anzeigen und Belege sichern.", "Zusätzliche Ausgaben nur mit nachvollziehbaren Quittungen geltend machen."],
    documents: ["Buchungsbestätigung", "Tickets und Bordkarten", "Fotos und Mängelanzeige", "Quittungen und Schriftverkehr"],
    sourceLabels: ["BGB §§ 651a ff. – Pauschalreiserecht", "EU-Fluggastrechteverordnung"],
  },
  {
    id: "medical", slug: "medizinrecht", icon: "✚", title: "Medizin- & Patientenrecht", shortTitle: "Medizinrecht",
    examples: "Behandlungsfehler, Aufklärung, Patientenakte, Abrechnung und Pflege", risk: "heightened",
    topics: ["Möglicher Behandlungsfehler", "Aufklärung oder Einwilligung", "Patientenakte", "Arztrechnung", "Krankenhaus oder Pflege", "Heil- oder Hilfsmittel", "Datenschutz im Gesundheitswesen", "Sonstiges Patiententhema"],
    guidance: ["Behandlungsverlauf und Beschwerden chronologisch dokumentieren.", "Patientenunterlagen und Befunde vollständig anfordern und sichern.", "Bei gesundheitlichen Beschwerden hat medizinische Versorgung Vorrang vor der rechtlichen Prüfung."],
    documents: ["Patientenakte und Befunde", "Aufklärungsunterlagen", "Rechnungen", "Gutachten und Schriftverkehr"],
    sourceLabels: ["BGB §§ 630a ff. – Behandlungsvertrag", "Patientenrechte", "Sozialgesetzbuch V"],
  },
  {
    id: "administrative", slug: "verwaltungsrecht", icon: "▦", title: "Verwaltungsrecht", shortTitle: "Verwaltungsrecht",
    examples: "Behördenbescheid, Genehmigung, Gebühren, Schule, Gewerbe und öffentliches Baurecht", risk: "heightened",
    topics: ["Behördenbescheid", "Baugenehmigung oder Bauordnung", "Gewerbe oder Erlaubnis", "Schule oder Hochschule", "Gebühr oder Beitrag", "Ordnungsverfügung", "Widerspruchsverfahren", "Sonstige Behördenentscheidung"],
    guidance: ["Bescheid einschließlich Rechtsbehelfsbelehrung und Zustelldatum sichern.", "Aktenzeichen bei jeder Kommunikation angeben.", "Rechtsbehelfsfristen können kurz sein; rechtzeitig fachkundige Prüfung veranlassen."],
    documents: ["Bescheid", "Antrag und Anlagen", "Rechtsbehelfsbelehrung", "Behördenschriftverkehr"],
    sourceLabels: ["Verwaltungsverfahrensgesetz", "Verwaltungsgerichtsordnung", "Jeweiliges Fach- und Landesrecht"],
  },
  {
    id: "criminal", slug: "strafrecht", icon: "!", title: "Straf- & Ordnungswidrigkeitenrecht", shortTitle: "Strafrecht",
    examples: "Vorladung, Beschuldigung, Strafbefehl, Durchsuchung und Opferrechte", risk: "urgent",
    topics: ["Vorladung als beschuldigte Person", "Strafbefehl oder Anklage", "Durchsuchung oder Beschlagnahme", "Anzeige oder Ermittlungsverfahren", "Opfer einer Straftat", "Jugendstrafrecht", "Ordnungswidrigkeit", "Sonstiges strafrechtliches Thema"],
    guidance: ["Fristen und Termine sofort sichern.", "Als beschuldigte Person keine unüberlegte Aussage zur Sache machen.", "Bei Haft, Durchsuchung, Anklage oder Strafbefehl unverzüglich strafrechtlichen Beistand suchen."],
    documents: ["Vorladung oder Anhörung", "Strafbefehl oder Anklage", "Durchsuchungs- und Sicherstellungsunterlagen", "Beweismittel und Schriftverkehr"],
    sourceLabels: ["Strafgesetzbuch", "Strafprozessordnung", "Ordnungswidrigkeitengesetz"],
  },
  {
    id: "other_unsure", slug: "sonstiges", icon: "?", title: "Anderes Thema / noch unsicher", shortTitle: "Noch unklar",
    examples: "Schildern Sie den Fall frei – die Fallaufnahme hilft bei der ersten Zuordnung", risk: "standard",
    topics: ["Rechtsgebiet noch unklar", "Mehrere Rechtsgebiete betroffen", "Sonstiges rechtliches Anliegen"],
    guidance: ["Schildern Sie Ereignisse möglichst chronologisch.", "Nennen Sie beteiligte Personen, Unternehmen oder Behörden.", "Heben Sie Schreiben mit Fristen, Terminen oder Aktenzeichen besonders hervor."],
    documents: ["Verträge und Schreiben", "Bescheide oder gerichtliche Dokumente", "Rechnungen und Zahlungsnachweise", "Fotos, Nachrichten und sonstige Belege"],
    sourceLabels: ["Die passenden Rechtsgrundlagen werden nach der Fallaufnahme eingegrenzt."],
  },
] as const;

export const LEGACY_LEGAL_AREA = "consumer_purchase_dummy";

export function normalizeLegalAreaId(id?: string | null) {
  return id === LEGACY_LEGAL_AREA ? "consumer_purchase" : id || "other_unsure";
}

export function getLegalArea(id?: string | null): LegalArea {
  const normalized = normalizeLegalAreaId(id);
  return legalAreas.find(area => area.id === normalized) ?? legalAreas[legalAreas.length - 1];
}

export function isLegalAreaId(id: string) {
  return legalAreas.some(area => area.id === id);
}
