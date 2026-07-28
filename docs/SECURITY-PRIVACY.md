# Sicherheit und Datenschutz

## Vor Produktion verpflichtend

- Rechtsgrundlage, Rollen (Verantwortlicher/Auftragsverarbeiter), AVV und DPIA prüfen.
- EU-Datenresidenz und Subprozessoren dokumentieren; Drittlandtransfer bewerten.
- Private Blob-Upload-Quarantäne, Magic-Byte-Prüfung, Malware-Scan, Größen-/Seitenlimits aktivieren.
- Fallbezogene Autorisierung, Kanzlei-Mandantentrennung und Rollenmatrix pen-testen.
- CSP, Same-Origin-/CSRF-Schutz, HSTS, Referrer-Policy und Permissions-Policy sind aktiv. Schreibende Browser-Endpunkte validieren `Origin` und `Sec-Fetch-Site`; signierte Webhooks und interne Jobs verwenden ihre eigenen Geheimnisprüfungen. Authentifizierungs-, Upload-, Analyse-, Checkout- und Fallanlage-Endpunkte verwenden persistente datenbankgestützte Rate Limits.
- Schlüsselrotation, Incident Response, Backups/Restore und Löschjobs testen.
- Direkte Identifikatoren in Freitext, Antworten und Dokumentextraktionen werden vor der Fallbewertung lokal pseudonymisiert. Originaldokumente benötigen für ihre Auslesung weiterhin eine freigegebene Auftragsverarbeitung; Zero-Retention-Verträge und EU-Datenresidenz sind vertraglich zu prüfen.

## Bedrohungen

Prompt-Injection in Dokumenten wird als untrusted content behandelt; extrahierter Text darf keine Systemanweisung ändern. Quellen müssen allowlist-basiert, zeitstandsbezogen und signiert/versioniert sein. OCR-Konfidenz und Widersprüche blockieren die Ausgabe. Audit-Logs sind manipulationsarm und enthalten keine Volltexte.
- **Datenminimierung vor KI-Aufrufen:** Die eigentliche Fallbewertung erhält pseudonymisierte Freitexte, Antworten und strukturierte Dokumentextraktionen. Wiederkehrende Werte erhalten innerhalb eines Aufrufs konsistente Platzhalter. Dateinamen werden vor der Dokumentauslesung neutralisiert; direkte Identifikatoren dürfen nicht in das Extraktionsergebnis übernommen werden.
- **Produktiver Malware-Schutz:** Ein Scanner-Adapter ist implementiert. Vor dem Livebetrieb Endpunkt und Schlüssel setzen, einen EICAR-/Ausfalltest durchführen und `REQUIRE_MALWARE_SCAN=true` aktivieren.
- **Privater Scanner-Dienst:** Unter `services/malware-scanner` liegt ein isolierter, authentifizierter ClamAV-Dienst für Railway. Er scannt Binärdaten ausschließlich im Arbeitsspeicher per `clamd INSTREAM`, prüft den vom Hauptsystem gelieferten SHA-256-Wert und protokolliert weder Inhalte noch Dateinamen oder Hashwerte.
- **Löschung:** Gelöschte oder abgelaufene Fallakten werden täglich verarbeitet. Originaldateien und Fallinhalte werden entfernt; minimale Zahlungs- und Auditdaten bleiben nur soweit für Abrechnung, Nachweis und Aufbewahrung erforderlich.
- **Auskunft:** Kontoinhaber können strukturierte Profildaten, Fallinhalte, Fragen, Ergebnisse und Auditinformationen als JSON exportieren.
