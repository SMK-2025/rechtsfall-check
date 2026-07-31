# Technische und organisatorische Maßnahmen (TOM)

## Vertraulichkeit

- rollen- und kontogebundene Zugriffskontrolle
- bestätigte E-Mail-Adresse und sichere Sitzungsverwaltung
- serverseitige Eigentümerprüfung bei Fall-, Dokument- und Supportzugriffen
- TLS, HSTS, CSP, sichere Cookieattribute und Same-Origin-Schutz
- Geheimnisse ausschließlich in Vercel/Railway-Umgebungsvariablen
- private Dokumentobjekte ohne öffentliche Abrufadresse
- minimierte und pseudonymisierte KI-Eingaben soweit technisch möglich

## Integrität

- Dateityp-, Magic-Byte-, Größen-, Hash- und Malware-Prüfung
- signierte Stripe-Webhooks und geschützte interne Jobs
- strukturierte KI-Ausgaben, Quellenregister und Qualitätsgates
- Audit-Ereignisse für sicherheits- und fallrelevante Zustandsänderungen
- Versionskontrolle, reproduzierbarer Build und automatisierte Tests

## Verfügbarkeit und Belastbarkeit

- Railway PostgreSQL mit Backups und Point-in-Time-Recovery
- Healthcheck, täglicher Systemcheck und Betreiberanzeige
- Rate Limits für Authentifizierung und ressourcenintensive Endpunkte
- dokumentierter Wiederanlauf-, Schlüsselrotations- und Incident-Prozess
- getrennte Produktions-, Preview- und lokale Konfiguration

## Wiederherstellbarkeit

- regelmäßige Volume-Backups und PITR
- quartalsweiser Restore-Test in getrennter Umgebung
- dokumentierter Abgleich von Datenbank- und Blobobjekten
- keine ungeprüfte Wiederherstellung über die Produktionsumgebung

## Datenschutz durch Technikgestaltung

- zweckgebundene Datenfelder und begrenzte Eingabelängen
- keine Fallvolltexte in Analytics, E-Mail oder Betriebslogs
- Datenschutzexport und kontogebundene Löschfunktionen
- automatisierter Retention-Job mit Dry-Run und begrenzten Batches
- Widerruf der KI-Einwilligung für zukünftige Verarbeitung
- Einwilligungs-, Löschungs- und Sicherheitsnachweise im Audit

## Organisatorische Maßnahmen

- dokumentierte Rollen und Verantwortlichkeiten
- Need-to-know-Zugriff für Betreiber und künftige Prüfer
- Dienstleisterregister und regelmäßige Subprozessorprüfung
- jährliche DSFA-Überprüfung sowie anlassbezogene Aktualisierung
- halbjährliche Incident-Übung
- unabhängiger Penetrationstest vor größerer öffentlicher Skalierung
- dokumentierte Behebung und Nachtest kritischer/hoher Befunde

## Noch nachzuweisen

- [ ] Datum und Ergebnis des letzten Restore-Tests
- [ ] Datum und Ergebnis des letzten Löschtests
- [ ] Datum und Ergebnis des Malware-Ausfall-/EICAR-Tests
- [ ] Datum, Umfang und Nachtest des Penetrationstests
- [ ] AVV/DPA- und Transferprüfung sämtlicher Anbieter
- [ ] formelle DSFA-Freigabe
