# Datenfluss und Systemgrenzen

## Produktiver Hauptfluss

| Schritt | Quelle | Empfänger/System | Daten | Schutz/Begrenzung |
|---|---|---|---|---|
| Registrierung | Nutzer | Vercel/Better Auth, Railway | Name, E-Mail, Passwort-Hash, Sitzungsdaten | TLS, E-Mail-Verifikation, Rate Limit |
| Fallaufnahme | Nutzer | Vercel, Railway | Rechtsgebiet, Beschreibung, Ziel, Antworten | Authentifizierung, Eigentümerprüfung |
| Upload | Nutzer | Vercel, Malware-Scanner, Vercel Blob | Datei und technische Metadaten | Typ/Signatur/Größe, SHA-256, Malware-Scan, privat |
| Dokumentextraktion | Blob | OpenAI API | erforderlicher Dokumentinhalt, neutraler Dateiname | ausdrückliche Einwilligung, minimierter Zweck |
| Fallanalyse | Railway | OpenAI API | pseudonymisierte Fallangaben, Extrakte, Antworten | lokale Minimierung, keine Kontaktdaten soweit erkennbar |
| Ergebnis | OpenAI API | Vercel/Railway | strukturierte Analyse | Schema, Qualitätsgates, Quellen- und Eskalationslogik |
| Zahlung | Browser/Vercel | Stripe | E-Mail, Preis, Zahlungs- und Belegdaten | signierter Checkout/Webhook; keine Kartendaten in eigener DB |
| Transaktionsmail | Vercel | SendGrid | E-Mail, Vorname, Statuslink | keine Fall- oder Ticketinhalte in E-Mail |
| Statistik | Browser | Google Analytics | öffentliche Pfade bzw. abstrakte Statusereignisse | Einwilligung; keine IDs, Titel oder Fallinhalte |
| Löschung | Vercel Job | Railway, Vercel Blob | Kontoverknüpfungen und Objekt-IDs | authentifizierter Job, begrenzte Batches, Audit |

## Vertrauensgrenzen

- **Öffentlich:** Marketingseiten, Registrierung, Login und Webhooks.
- **Authentifiziert:** Profil, Fallakten, Dokumente, Support und Bewertungen.
- **Administrativ:** Betreiberansicht; Zugriff nur für konfigurierte Admin-E-Mails.
- **Intern:** Retention- und Monitoring-Endpunkte mit eigenem Geheimnis.
- **Extern:** Stripe, SendGrid, OpenAI, Google und Infrastrukturprovider.

## Verbotene Datenflüsse

- keine Fall-, Dokument-, Support- oder Kontaktdaten an Google Analytics;
- keine Karten- oder vollständigen Stripe-Zahlungsdaten in der Anwendungsdatenbank;
- keine Originaldokumente oder Fallvolltexte in Audit- und Betriebslogs;
- keine öffentlichen Blob-URLs für Fallunterlagen;
- keine Analyse einer Datei ohne erfolgreiche Sicherheitsfreigabe;
- keine KI-Verarbeitung ohne dokumentierte ausdrückliche Einwilligung.

Diese Darstellung muss bei jeder neuen Integration aktualisiert und mit
Datenschutzerklärung, DSFA, Verarbeitungsverzeichnis und Dienstleisterregister
abgeglichen werden.
