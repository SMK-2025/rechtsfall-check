# Rechtsfall Check

Produktionsdomain: [rechtsfall-check.de](https://rechtsfall-check.de)

Vercel-native Legal-Tech-Plattform für eine sichere, strukturierte und **nicht abschließende Ersteinschätzung**. Die Anwendung ist keine Kanzlei und trifft keine autonome finale Einzelfallentscheidung. Juristisch freizugebende Inhalte und Quellen sind mit `LEGAL_REVIEW_REQUIRED` gekennzeichnet.

## Architektur

- Next.js 16 (App Router), React und TypeScript
- Better Auth mit E-Mail/Passwort und verpflichtender E-Mail-Bestätigung
- Stripe Checkout für den Rechtsfall Check zu 19 Euro je Fall
- OpenAI Responses API für die strukturierte Fallaufnahme; Rechtsquellen bleiben freigabepflichtig
- lokale Pseudonymisierung direkter Identifikatoren vor der KI-gestützten Fallbewertung
- Railway PostgreSQL und Drizzle ORM
- privater Vercel Blob Store für Dokumente
- modulare Upload-, OCR-/Extraktions-, Fakten-/Beleg-, Rückfragen-, Fristen- und Qualitätsgate-Schnittstellen
- serverseitige Mandantentrennung, Audit-Logging, Soft-Deletion und Nicht-Antwort-/Eskalationslogik

Der Upload akzeptiert PDF/JPG/PNG bis 4 MB, prüft Typ, Dateisignatur, SHA-256 sowie Malware und Viren und legt ausschließlich freigegebene Dateien privat in Quarantäne ab. Extraktion bleibt ohne erfolgreichen Malware-Scan gesperrt.

## Lokal starten

Voraussetzungen: Node.js 22+, pnpm, Railway PostgreSQL, privater Vercel Blob Store sowie Zugangsdaten für Stripe, SendGrid und OpenAI.

```bash
pnpm install
copy .env.example .env.local
pnpm db:migrate
pnpm dev
```

Danach `http://localhost:3000` öffnen.

## Prüfung

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Deployment

Das Repository wird einmalig in Vercel importiert. Danach erzeugt jeder Branch-Push ein Preview Deployment; ein Push auf `main` aktualisiert Produktion automatisch. Datenbank, Blob Store und Secrets werden ausschließlich als Vercel Environment Variables konfiguriert.

Die vollständige Schrittfolge steht in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). API, Datenmodell, Sicherheitsgrenzen und Roadmap liegen unter `docs/`.

Für den sicheren Betrieb gelten zusätzlich der
[Schlüsselrotationsplan](docs/KEY-ROTATION.md) und der
[technische Notfallplan](docs/INCIDENT-RESPONSE.md). Beide Dokumente enthalten
absichtlich keine produktiven Geheimnisse.
Healthcheck und Alarmwege sind unter
[Monitoring und Alarmierung](docs/MONITORING.md) beschrieben.

## Annahmen

1. Die Fallaufnahme unterstützt einen zentral versionierten Katalog typischer deutscher Rechtsgebiete, Themen, Hilfestellungen, Unterlagen und Risikostufen.
2. Registrierung und Login erfolgen verbraucherfreundlich per E-Mail und Passwort mit verpflichtender E-Mail-Bestätigung.
3. OCR und Malware-Scanner bleiben deaktiviert, bis Verträge, AVV, Datenschutz und technische Qualitätssicherung abgeschlossen sind; rechtliche Informationen benötigen Quelle, Geltungsbereich und Rechtsstand.

## Support-Center

Angemeldete Nutzer können unter `/support` kontogebundene Tickets für technische Probleme, Konto und Login, Zahlung und Beleg, Dokumente und Upload sowie Bedienung und Verständnis eröffnen. Optional kann eine eigene Fallakte zugeordnet werden; Fallinhalte werden nicht automatisch in das Ticket kopiert. Administratoren aus `ADMIN_EMAILS` sehen und beantworten alle Tickets über denselben geschützten Zugang.

Der Support ist ausdrücklich von der fachlichen Leistung getrennt: Er erteilt keine Rechtsberatung, bewertet keine Erfolgsaussichten und verändert keinen abgeschlossenen Rechtsfall-Check. Tickets und Nachrichten sind Bestandteil des Datenschutzexports und werden mit der endgültigen Kontolöschung aus der aktiven Anwendungsumgebung entfernt.

## Verifizierte Nutzerbewertungen

Angemeldete Nutzer können das Portal bewerten. Bewertungen eines Rechtsfall-Checks setzen eine bezahlte Fallprüfung voraus; Supportbewertungen setzen ein tatsächlich eröffnetes Support-Ticket voraus. Jede Bewertung benötigt eine ausdrückliche Veröffentlichungseinwilligung und bleibt zunächst im Status `PENDING`.

Administratoren prüfen Bewertungen unter `/bewertungen` und können sie veröffentlichen oder ablehnen. Ausschließlich freigegebene Bewertungen erscheinen automatisch auf der Startseite. Nutzer können ihre Bewertung jederzeit löschen und dadurch eine erteilte Veröffentlichungseinwilligung mit Wirkung für die Zukunft widerrufen. Bewertungsdaten sind im Datenschutzexport enthalten und werden bei endgültiger Kontolöschung mit entfernt.

API:

- `GET|POST /api/v1/support` – eigene Tickets laden oder Ticket eröffnen
- `GET|POST /api/v1/support/:ticketId` – zugängliches Ticket laden oder Nachricht senden
- `PATCH /api/v1/support/:ticketId` – Statusänderung, nur Administrator
4. Fristen sind Hinweise auf mögliche Prüfbedarfe, niemals verbindliche Berechnungen.
5. Vor einem Realbetrieb sind anwaltliche Produktfreigabe, DPIA/DSFA-Prüfung, Löschjobs, Penetrationstest und Incident-Prozess erforderlich.
