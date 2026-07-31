# Dienstleister- und Transferregister

> Keine Vertragsabschlüsse werden durch dieses Repository bewirkt. Der Betreiber
> muss die jeweils aktuellen Vertragsdokumente im Anbieterportal abschließen,
> herunterladen und zugriffsgeschützt archivieren.

| Anbieter | Leistung | voraussichtliche Rolle | AVV/DPA archiviert | Subprozessoren geprüft | Region/Transfergrundlage | Status |
|---|---|---|---|---|---|---|
| Vercel | Hosting, Functions, privater Blob Store | Auftragsverarbeiter | [ ] | [ ] | Frankfurt/EU soweit konfiguriert; Konzern-/Supportzugriffe prüfen | offen |
| Railway | PostgreSQL und Malware-Scanner | Auftragsverarbeiter | [ ] | [ ] | EU-West soweit konfiguriert; konkrete Garantien prüfen | offen |
| OpenAI | Dokumentextraktion und KI-Analyse | anhand API-Vertrag prüfen | [ ] | [ ] | Datenresidenz, Zero Retention, DPF/SCC konkret dokumentieren | offen |
| Twilio SendGrid | Transaktions-E-Mail | Auftragsverarbeiter | [ ] | [ ] | Versand-/Trackingregion und DPF/SCC prüfen | offen |
| Stripe | Zahlung, Beleg und steuerliche Nachweise | regelmäßig eigener Verantwortlicher für Teile; Vertrag prüfen | n/a/[ ] | [ ] | Datenschutzhinweise und Transfergrundlage archivieren | offen |
| Google Analytics | freiwillige Reichweitenmessung | Rollen nach Google-Vertrag prüfen | [ ] | [ ] | Einwilligung, EU-US-Garantien, 14 Monate | offen |
| IONOS/Microsoft Outlook | Betreiber-E-Mail-Postfach | Auftragsverarbeiter je Vertrag | [ ] | [ ] | Region und Vertrag dokumentieren | offen |

## Mindestprüfung je Anbieter

- Gegenstand, Dauer, Zweck und Datenkategorien
- Weisungsbindung und Vertraulichkeit
- technische und organisatorische Maßnahmen
- Meldung von Datenschutzverletzungen
- Unterstützung bei Betroffenenrechten, DSFA und Löschung
- Rückgabe/Löschung nach Vertragsende
- Audit- und Nachweismöglichkeiten
- genehmigte Subprozessoren und Änderungsmitteilungen
- tatsächliche Speicher- und Supportregionen
- Drittlandgarantie, ergänzende Maßnahmen und Zugriffsmöglichkeiten
- Aufbewahrungs- und Backupfristen

## Ablagekonvention

Verträge und Nachweise nicht im öffentlichen Git-Repository speichern.
Empfohlene interne Bezeichnung:

`YYYY-MM-DD_Anbieter_Dokumenttyp_Version_Freigabestatus.pdf`

Das Register enthält keine API-Schlüssel, Vertragszugänge oder sonstigen
Geheimnisse.
