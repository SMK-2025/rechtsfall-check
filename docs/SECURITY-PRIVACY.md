# Sicherheit und Datenschutz

## Vor Produktion verpflichtend

- Rechtsgrundlage, Rollen (Verantwortlicher/Auftragsverarbeiter), AVV und DPIA prüfen.
- EU-Datenresidenz und Subprozessoren dokumentieren; Drittlandtransfer bewerten.
- Private Blob-Upload-Quarantäne, Magic-Byte-Prüfung, Malware-Scan, Größen-/Seitenlimits aktivieren.
- Fallbezogene Autorisierung, Kanzlei-Mandantentrennung und Rollenmatrix pen-testen.
- CSP und CSRF-Schutz vervollständigen. HSTS, Referrer-Policy und Permissions-Policy sind aktiv. Authentifizierungs-, Upload-, Analyse-, Checkout- und Fallanlage-Endpunkte verwenden persistente datenbankgestützte Rate Limits.
- Schlüsselrotation, Incident Response, Backups/Restore und Löschjobs testen.
- PII-Redaktion vor externen Modellaufrufen; Zero-Retention-Verträge bevorzugen.

## Bedrohungen

Prompt-Injection in Dokumenten wird als untrusted content behandelt; extrahierter Text darf keine Systemanweisung ändern. Quellen müssen allowlist-basiert, zeitstandsbezogen und signiert/versioniert sein. OCR-Konfidenz und Widersprüche blockieren die Ausgabe. Audit-Logs sind manipulationsarm und enthalten keine Volltexte.
- **Produktiver Malware-Schutz:** Ein Scanner-Adapter ist implementiert. Vor dem Livebetrieb Endpunkt und Schlüssel setzen, einen EICAR-/Ausfalltest durchführen und `REQUIRE_MALWARE_SCAN=true` aktivieren.
- **Privater Scanner-Dienst:** Unter `services/malware-scanner` liegt ein isolierter, authentifizierter ClamAV-Dienst für Railway. Er scannt Binärdaten ausschließlich im Arbeitsspeicher per `clamd INSTREAM`, prüft den vom Hauptsystem gelieferten SHA-256-Wert und protokolliert weder Inhalte noch Dateinamen oder Hashwerte.
- **Löschung:** Gelöschte oder abgelaufene Fallakten werden täglich verarbeitet. Originaldateien und Fallinhalte werden entfernt; minimale Zahlungs- und Auditdaten bleiben nur soweit für Abrechnung, Nachweis und Aufbewahrung erforderlich.
- **Auskunft:** Kontoinhaber können strukturierte Profildaten, Fallinhalte, Fragen, Ergebnisse und Auditinformationen als JSON exportieren.
