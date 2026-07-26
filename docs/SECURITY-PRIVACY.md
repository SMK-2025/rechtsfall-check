# Sicherheit und Datenschutz

## Vor Produktion verpflichtend

- Rechtsgrundlage, Rollen (Verantwortlicher/Auftragsverarbeiter), AVV und DPIA prüfen.
- EU-Datenresidenz und Subprozessoren dokumentieren; Drittlandtransfer bewerten.
- R2-Upload-Quarantäne, Magic-Byte-Prüfung, Malware-Scan, Größen-/Seitenlimits aktivieren.
- Fallbezogene Autorisierung, Kanzlei-Mandantentrennung und Rollenmatrix pen-testen.
- CSP, HSTS, Referrer-Policy, Permissions-Policy, CSRF und Rate Limits aktivieren.
- Schlüsselrotation, Incident Response, Backups/Restore und Löschjobs testen.
- PII-Redaktion vor externen Modellaufrufen; Zero-Retention-Verträge bevorzugen.

## Bedrohungen

Prompt-Injection in Dokumenten wird als untrusted content behandelt; extrahierter Text darf keine Systemanweisung ändern. Quellen müssen allowlist-basiert, zeitstandsbezogen und signiert/versioniert sein. OCR-Konfidenz und Widersprüche blockieren die Ausgabe. Audit-Logs sind manipulationsarm und enthalten keine Volltexte.
