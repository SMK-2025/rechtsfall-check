# Rechtsfall Check

Produktionsdomain: [rechtsfall-check.de](https://rechtsfall-check.de)

Vercel-native Legal-Tech-Plattform für eine sichere, strukturierte und **nicht abschließende Ersteinschätzung**. Die Anwendung ist keine Kanzlei und trifft keine autonome finale Einzelfallentscheidung. Juristisch freizugebende Inhalte und Quellen sind mit `LEGAL_REVIEW_REQUIRED` gekennzeichnet.

## Architektur

- Next.js 16 (App Router), React und TypeScript
- Better Auth mit E-Mail/Passwort und verpflichtender E-Mail-Bestätigung
- Stripe Checkout für den Rechtsfall Check zu 19 Euro je Fall
- OpenAI Responses API für die strukturierte Fallaufnahme; Rechtsquellen bleiben freigabepflichtig
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

## Annahmen

1. Die Fallaufnahme unterstützt einen zentral versionierten Katalog typischer deutscher Rechtsgebiete, Themen, Hilfestellungen, Unterlagen und Risikostufen.
2. Registrierung und Login erfolgen verbraucherfreundlich per E-Mail und Passwort mit verpflichtender E-Mail-Bestätigung.
3. OCR und Malware-Scanner bleiben deaktiviert, bis Verträge, AVV, Datenschutz und technische Qualitätssicherung abgeschlossen sind; rechtliche Informationen benötigen Quelle, Geltungsbereich und Rechtsstand.
4. Fristen sind Hinweise auf mögliche Prüfbedarfe, niemals verbindliche Berechnungen.
5. Vor einem Realbetrieb sind anwaltliche Produktfreigabe, DPIA/DSFA-Prüfung, Löschjobs, Penetrationstest und Incident-Prozess erforderlich.
