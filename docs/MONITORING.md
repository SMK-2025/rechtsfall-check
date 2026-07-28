# Monitoring und Alarmierung

## In der Anwendung

- `GET /api/health` prüft Anwendung und Datenbank ohne Anmeldung.
- Der Endpunkt liefert `200`, wenn die Datenbank erreichbar ist, andernfalls
  `503`. Er gibt keine Konfiguration, Nutzerdaten oder Falldaten aus.
- Kritische Fehler bei Dokumentablage, Malware-Scanner, KI-Analyse, Mail,
  Stripe und Löschjob werden im Audit-Protokoll des Betreiberbereichs erfasst.
- Ist `ALERT_EMAIL` gesetzt, wird zusätzlich eine technische Alarmmail
  versendet.
- Gleichartige Alarmmails haben eine Sperrfrist von 30 Minuten. Das Ereignis
  wird weiterhin protokolliert, die Mailflut aber verhindert.
- Alarmmails enthalten nur Ereigniscode, Komponente, Schweregrad und Zeitpunkt,
  niemals Namen, E-Mail-Adressen, Beschreibungen oder Dokumentinhalte.
- Vercel ruft täglich um 05:42 UTC den geschützten Endpunkt
  `/api/internal/monitor` auf. Dieser prüft Datenbank, Railway-Malware-Scanner
  und die Vollständigkeit der produktionskritischen Konfiguration.
- Ein erfolgreicher Lauf erscheint als `DAILY_SYSTEM_CHECK_PASSED` im
  Betreiberprotokoll. Fehler erzeugen einen komponentenspezifischen Alarm.

## Externe Verfügbarkeitsprüfung – bewusst nicht verwendet

Der Betrieb verwendet derzeit auf Betreiberwunsch keinen zusätzlichen
Uptime-Dienst. Der öffentliche Prüfpunkt bleibt für manuelle Kontrollen
erreichbar:

`https://rechtsfall-check.de/api/health`

Erwartung: HTTP 200. Ein vollständiger Vercel-Ausfall kann durch den internen
Vercel-Zeitplan technisch nicht gemeldet werden, weil dann auch der tägliche
Prüflauf nicht startet. Dieses Restrisiko ist dokumentiert und akzeptiert.

Zusätzlich separat überwachen:

- Hauptseite `https://rechtsfall-check.de/`
- Railway Scanner `https://DEINE-RAILWAY-DOMAIN/health`
- Vercel Deployments und Function Error Rate
- Railway PostgreSQL CPU, Speicher, Verbindungen und Speicherplatz
- Stripe Webhook-Zustellungen
- SendGrid Zustellungsfehler und Bounces
- OpenAI Nutzung und Budgetgrenzen

## Betrieb

Die Alarmadresse wird in Vercel als `ALERT_EMAIL` für Produktion gesetzt. Nach
Einrichtung wird jeder Alarmweg kontrolliert getestet. Zugangsdaten oder echte
Falldaten dürfen für Tests nicht verwendet werden.

Ein Alarm ist erst erledigt, wenn Ursache, Auswirkung, Behebung und
Nachkontrolle dokumentiert wurden. Für Sicherheitsvorfälle gilt zusätzlich
`INCIDENT-RESPONSE.md`.
