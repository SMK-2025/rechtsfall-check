# Schlüsselrotation

Diese Betriebsanweisung erfasst alle produktiven Geheimnisse von
Rechtsfall-Check.de. Sie enthält absichtlich keine Schlüssel, Tokens,
Passwörter oder vollständigen Verbindungsadressen.

## Grundregeln

- Geheimnisse nur in geschützten Dienstvariablen speichern, niemals in
  GitHub, Tickets, E-Mails oder Screenshots.
- Regulär zuerst einen neuen Wert erzeugen, hinterlegen, deployen und testen.
  Erst danach den alten Wert widerrufen.
- Bei wahrscheinlichem Abfluss den alten Wert sofort widerrufen.
- Produktion und Test strikt trennen.
- Datum, Dienst, verantwortliche Person, Prüfergebnis und Widerruf
  dokumentieren, niemals jedoch den Geheimniswert selbst.

## Rotationsmatrix

| Variable | Dienst | Rhythmus |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Vercel / Better Auth | jährlich oder sofort bei Verdacht |
| `DATABASE_URL` | Railway / Vercel | halbjährlich oder sofort bei Verdacht |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob | halbjährlich oder sofort bei Verdacht |
| `OPENAI_API_KEY` | OpenAI / Vercel | vierteljährlich oder sofort bei Verdacht |
| `SENDGRID_API_KEY` | SendGrid / Vercel | vierteljährlich oder sofort bei Verdacht |
| `STRIPE_SECRET_KEY` | Stripe / Vercel | halbjährlich oder sofort bei Verdacht |
| `STRIPE_WEBHOOK_SECRET` | Stripe / Vercel | bei neuem Endpunkt oder Verdacht |
| `MALWARE_SCANNER_API_KEY` / `SCANNER_API_KEY` | Vercel / Railway | vierteljährlich oder sofort bei Verdacht |
| `CRON_SECRET` | Vercel | halbjährlich oder sofort bei Verdacht |

`NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL`, `OPENAI_MODEL`,
`REQUIRE_MALWARE_SCAN`, `RETENTION_BATCH_SIZE` und `ADMIN_EMAILS` sind keine
Geheimnisse. Sie müssen dennoch geschützt und nach Änderungen getestet werden.

## Sichere Standardreihenfolge

1. Wartungsfenster und verantwortliche Person festlegen.
2. Login, Datenbank, Upload, Scan, Mail, Checkout, Webhook und KI prüfen.
3. Beim Anbieter neuen Schlüssel erzeugen, ohne den alten zu löschen.
4. Neuen Wert in Vercel beziehungsweise Railway eintragen.
5. Neue Produktionsbereitstellung auslösen.
6. Betroffene Funktion mit sicherem Testkonto testen.
7. Anbieterprotokolle auf ungewöhnliche Nutzung prüfen.
8. Alten Schlüssel beim Anbieter widerrufen.
9. Erneut testen und Rotation ohne Geheimniswert protokollieren.

## Dienstspezifische Prüfungen

- **Better Auth:** Login, Logout, E-Mail-Bestätigung und
  Passwort-Zurücksetzung testen. Neuanmeldung aller Nutzer ist bei einer
  Sicherheitsrotation erwünscht.
- **PostgreSQL:** Vorher Backup und Point-in-time Recovery prüfen. Neue
  Zugangsdaten bereitstellen, Login, Fallliste und ungefährlichen
  Schreibvorgang testen. Erst dann alten Zugang sperren.
- **Vercel Blob:** Store privat lassen. Upload, authentifizierten Abruf und
  Löschung mit Testdatei prüfen.
- **OpenAI:** Projektschlüssel mit minimalen Rechten und Ausgabenlimits nutzen.
  Testanalyse durchführen und Logs auf direkte Identifikatoren prüfen.
- **SendGrid:** Schlüssel auf Mailversand beschränken. Bestätigung und
  Passwort-Zurücksetzung sowie Sender Authentication und Link Branding testen.
- **Stripe:** Test und Live nicht vermischen. Test-Checkout und signiertes
  Webhook-Ereignis prüfen; Buchung muss genau einmal als bezahlt erscheinen.
- **Scanner:** Zuerst `SCANNER_API_KEY` in Railway, danach denselben Wert als
  `MALWARE_SCANNER_API_KEY` in Vercel setzen. Healthcheck, saubere Datei und
  EICAR-Test durchführen. Produktion bleibt fail-closed.
- **Löschjob:** Nach Änderung von `CRON_SECRET` neu bereitstellen und zuerst
  `/api/internal/retention?dryRun=true` testen. Lokale Kopien entfernen.

## Internes Rotationsprotokoll

- Datum und Uhrzeit
- Dienst und Variablenname
- Anlass
- ausführende und kontrollierende Person
- erfolgreiche Funktionsprüfung
- Zeitpunkt des Widerrufs des alten Werts
- Incident- oder Wartungsnummer

