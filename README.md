# Rechtsfall KI

Vercel-native Legal-Tech-Plattform für eine sichere, strukturierte und **nicht abschließende Ersteinschätzung**. Die Anwendung ist keine Kanzlei und trifft keine autonome finale Einzelfallentscheidung. Juristisch freizugebende Inhalte und Quellen sind mit `LEGAL_REVIEW_REQUIRED` gekennzeichnet.

## Architektur

- Next.js 16 (App Router), React und TypeScript
- Better Auth mit E-Mail/Passwort und optionalem GitHub OAuth
- Stripe Checkout für die einmalige Fallprüfung zu 39 Euro
- OpenAI Responses API für die strukturierte Fallaufnahme; Rechtsquellen bleiben freigabepflichtig
- Neon PostgreSQL und Drizzle ORM
- privater Vercel Blob Store für Dokumente
- modulare Upload-, OCR-/Extraktions-, Fakten-/Beleg-, Rückfragen-, Fristen- und Qualitätsgate-Schnittstellen
- serverseitige Mandantentrennung, Audit-Logging, Soft-Deletion und Nicht-Antwort-/Eskalationslogik

Der Upload akzeptiert PDF/JPG/PNG bis 10 MB, prüft Typ, Dateisignatur und SHA-256 und legt Dateien privat in Quarantäne ab. Extraktion bleibt ohne freigegebenen Malware-Scan gesperrt.

## Lokal starten

Voraussetzungen: Node.js 22+, pnpm, Neon PostgreSQL, privater Vercel Blob Store sowie Zugangsdaten für Stripe und OpenAI.

```bash
pnpm install
copy .env.example .env.local
pnpm db:migrate
pnpm dev
```

Danach `http://localhost:3000` öffnen. Der OAuth-Callback lautet lokal:

`http://localhost:3000/api/auth/callback/github`

## Prüfung

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Deployment

Das Repository wird einmalig in Vercel importiert. Danach erzeugt jeder Branch-Push ein Preview Deployment; ein Push auf `main` aktualisiert Produktion automatisch. Datenbank, Blob Store, OAuth und Secrets werden ausschließlich als Vercel Environment Variables konfiguriert.

Die vollständige Schrittfolge steht in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). API, Datenmodell, Sicherheitsgrenzen und Roadmap liegen unter `docs/`.

## Annahmen

1. Startrechtsgebiet ist Kaufrecht/Verbrauchsgüterkauf und bleibt bis zur juristischen Freigabe als `LEGAL_REVIEW_REQUIRED` markiert.
2. E-Mail/Passwort ist die primäre Registrierung; GitHub OAuth bleibt optional.
3. OCR, Malware-Scanner und juristische Quellen bleiben deaktiviert, bis Verträge, AVV, Datenschutz, Quellenrechte und juristische Qualität freigegeben sind.
4. Fristen sind Hinweise auf mögliche Prüfbedarfe, niemals verbindliche Berechnungen.
5. Vor einem Realbetrieb sind anwaltliche Produktfreigabe, DPIA/DSFA-Prüfung, Löschjobs, Penetrationstest und Incident-Prozess erforderlich.
