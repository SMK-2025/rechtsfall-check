# Datenschutz-Folgenabschätzung (DSFA) – Arbeitsstand

> **Status:** Betreiberentwurf. Vor Verarbeitung in größerem Umfang durch eine
> fachkundige Datenschutzperson prüfen, freigeben und versionieren.
> Dieses Dokument ist keine Rechtsberatung und ersetzt keine Konsultation nach
> Art. 36 DSGVO, falls trotz Maßnahmen ein hohes Restrisiko verbleibt.

## 1. Gegenstand und Verantwortlicher

Rechtsfall-Check.de verarbeitet Angaben und Dokumente natürlicher Personen, um
einen Sachverhalt zu strukturieren, fehlende Informationen abzufragen und eine
nicht abschließende Ersteinschätzung zu erzeugen.

Verantwortlicher ist die Media Online Innovations Group, Inhaber Martin Kelm,
Im Weidenblech 25, 51371 Leverkusen.

## 2. Warum eine DSFA durchgeführt wird

Fallakten können besondere Kategorien personenbezogener Daten nach Art. 9 DSGVO,
Daten zu strafrechtlichen Vorwürfen nach Art. 10 DSGVO, Daten Dritter und
wirtschaftlich oder persönlich besonders nachteilige Informationen enthalten.
Zusätzlich werden neue Technologien zur strukturierten Auswertung eingesetzt.
Damit ist ein hohes Ausgangsrisiko jedenfalls ernsthaft möglich.

## 3. Verarbeitung und Datenfluss

1. Nutzerkonto mit bestätigter E-Mail-Adresse wird angelegt.
2. Nutzer schildert den Fall und lädt erforderlichenfalls Dokumente hoch.
3. Uploads werden nach Größe, Dateisignatur und Schadsoftware geprüft.
4. Freigegebene Dateien werden in einem privaten Objektspeicher abgelegt.
5. Nach ausdrücklicher Einwilligung werden erforderliche Inhalte extrahiert,
   minimiert und an den konfigurierten KI-Dienst übermittelt.
6. Qualitätsgates entscheiden, ob Rückfragen, Eskalation oder eine
   nicht abschließende Ersteinschätzung zulässig sind.
7. Ergebnis und Vorgangsnachweise bleiben im geschützten Nutzerkonto.
8. Fristabläufe und Löschanträge werden automatisiert verarbeitet.

Die technische Detaildarstellung steht in [DATA-FLOW.md](DATA-FLOW.md).

## 4. Datenkategorien und betroffene Personen

- Konto-, Kontakt-, Adress- und Authentifizierungsdaten
- Fallschilderungen, Antworten, Dokumente, Metadaten und Extraktionsergebnisse
- Vertrags-, Zahlungs-, Kommunikations- und Verfahrensangaben
- möglicherweise Gesundheits-, Familien-, Gewerkschafts- oder Sexualdaten
- möglicherweise Angaben zu Straftaten, Vorwürfen oder Verurteilungen
- Daten von Nutzern, Gegnern, Zeugen, Angehörigen und sonstigen Beteiligten
- Sicherheits-, Audit-, Einwilligungs- und Löschungsnachweise

## 5. Zwecke, Erforderlichkeit und Verhältnismäßigkeit

Die Fallinhalte werden ausschließlich für die beauftragte Fallaufnahme,
Dokumentenauswertung, Rückfragen und Ersteinschätzung verarbeitet. Direkte
Identifikatoren werden vor der allgemeinen Fallbewertung soweit möglich lokal
pseudonymisiert. Öffentliche Reichweitenmessung und Produktanalyse erhalten
keine Fall-, Dokument-, Kontakt- oder Supportinhalte.

Weniger eingriffsintensive Alternativen wurden berücksichtigt:

- freie allgemeine Informationen ersetzen keine fallbezogene Strukturierung;
- eine rein manuelle Aufnahme wäre möglich, aber nicht Bestandteil des
  derzeitigen Produkts und würde die gleichen Fallinhalte erfordern;
- vollständige Dokumente werden nur verarbeitet, wenn ihr Inhalt für den
  beauftragten Analyseschritt benötigt wird.

## 6. Risikobewertung

| Risiko | Ausgangsrisiko | Maßnahmen | Restrisiko |
|---|---:|---|---:|
| Zugriff auf fremde Fallakten | hoch | serverseitige Eigentümerprüfung, Sitzungen, Same-Origin-Schutz, Rate Limits, Audit | mittel |
| Offenlegung sensibler Dokumente | hoch | privater Blob Store, Malware-Prüfung, keine öffentlichen URLs, Löschworkflow | mittel |
| Zu umfangreiche KI-Übermittlung | hoch | Datenminimierung, Pseudonymisierung, neutrale Dateinamen, zweckgebundene Prompts | mittel |
| Fehlerhafte oder irreführende KI-Ausgabe | hoch | Qualitätsgates, Quellenregister, Nicht-Antwort/Eskalation, klare Leistungsgrenze | mittel |
| Unbemerkter Datenabfluss | hoch | minimale Logs, Monitoring, Incident-Prozess, Schlüsselrotation | mittel |
| Unvollständige Löschung | hoch | Konto- und Falllöschworkflow, Blob-Löschung, täglicher Retention-Job, Audit | mittel |
| Daten Dritter ohne Erforderlichkeit | hoch | Hinweise zur Schwärzung und Datenminimierung, Zweckbindung | mittel |
| Drittlandzugriff | hoch | Anbieterprüfung, Transfergrundlage, EU-Region soweit verfügbar, Verschlüsselung | **offen** |
| Missbrauch administrativer Rechte | hoch | rollenbasierter Adminzugang, Audit, Geheimnisverwaltung | mittel |
| Verlust durch Betriebsfehler | hoch | Backups, PITR, Wiederherstellungstest, Änderungs- und Incident-Prozess | niedrig–mittel |

## 7. Bereits umgesetzte Schutzmaßnahmen

- TLS, HSTS, CSP, Referrer- und Permissions-Policy
- Better Auth, E-Mail-Verifikation und serverseitige Mandantentrennung
- private Dokumentablage, Magic-Byte-, Hash- und Malware-Prüfung
- persistente Rate Limits und Same-Origin-Prüfung für schreibende Endpunkte
- Datenminimierung vor KI-Fallbewertung
- Audit-Ereignisse ohne Fallvolltexte
- Datenschutzexport, Falllöschung und vollständiger Kontolöschworkflow
- täglicher Retention-Job, Backups und Point-in-Time-Recovery
- dokumentierter Incident- und Schlüsselrotationsprozess

## 8. Offene Maßnahmen vor DSFA-Freigabe

- [ ] Rollen jedes Dienstleisters verbindlich klassifizieren
- [ ] AVV/DPA, Subprozessorlisten und Sicherheitsanlagen archivieren
- [ ] Drittlandtransfer je Anbieter mit konkreter Garantie dokumentieren
- [ ] tatsächliche Aufbewahrungsfristen der Providerkopien eintragen
- [ ] unabhängigen Penetrationstest durchführen und hohe Befunde schließen
- [ ] Wiederherstellungs- und vollständigen Löschtest protokollieren
- [ ] Restrisiken durch Datenschutzfachperson bewerten
- [ ] bei verbleibendem hohem Risiko Art.-36-Konsultation prüfen

## 9. Freigabe und Review

| Feld | Eintrag |
|---|---|
| Verantwortlicher | Media Online Innovations Group |
| Dokumentversion | 0.1 – Betreiberentwurf |
| Erstellt am | 31.07.2026 |
| Datenschutzprüfung | ausstehend |
| Freigabe | ausstehend |
| Nächste Prüfung | vor öffentlicher Skalierung, danach jährlich und bei wesentlichen Änderungen |

Wesentliche Änderungen sind insbesondere neue KI-/OCR-Anbieter, neue
Rechtsgebiete mit zusätzlichen Risikokategorien, neue Empfänger, geänderte
Speicherorte, neue automatisierte Entscheidungen oder Sicherheitsvorfälle.
