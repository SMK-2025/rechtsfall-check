# API v1

Alle produktiven Endpunkte liegen unter `/api/v1`, liefern JSON, setzen `Cache-Control: no-store` und benötigen serverseitig eine authentifizierte Identität sowie Objekt-Eigentümerprüfung.

## GET `/api/v1/member`

Legt das minimierte Mitgliedsprofil beim ersten Zugriff idempotent an und liefert `id`, `email` und `displayName`. Die interne ID wird deterministisch aus der normalisierten Identität abgeleitet.

## GET/POST `/api/v1/cases`

- `GET`: liefert ausschließlich nicht gelöschte Fälle des authentifizierten Eigentümers.
- `POST`: legt einen Fall im aktuell freigegebenen Startrechtsgebiet an, setzt eine Aufbewahrungsfrist und schreibt ein Audit-Ereignis.

## GET/PATCH/DELETE `/api/v1/cases/:caseId`

Jeder Zugriff prüft serverseitig `caseId + ownerId`. `DELETE` ist eine protokollierte Soft-Deletion; die physische Löschung aller PostgreSQL-/Blob-Daten bleibt ein separater Aufbewahrungsjob.

## POST `/api/v1/cases/:caseId/documents`

Multipart-Upload mit Feld `file`. Erlaubt sind PDF, JPG und PNG bis 10 MB. Der Server prüft MIME-Typ, Dateisignatur und SHA-256. Bytes werden in einem privaten Vercel Blob Store unter einem nicht erratbaren Quarantänepfad gespeichert; Metadaten landen in PostgreSQL. Ohne freigegebenen Malware-Scan bleibt `extractionStatus` auf `BLOCKED_UNTIL_SCAN`.

## POST `/api/v1/assessments`

Strukturierte Aufnahme mit Nicht-Antwort- und Eskalationslogik.

Request:

```json
{"caseId":"...","topic":"Mangelhafte Ware","eventDate":"2026-07-01","description":"...","hasDocument":false}
```

Der Endpunkt prüft Eigentümerschaft, speichert Fakten und Rückfragen, versioniert die Ausgabe und protokolliert das Gate-Ergebnis. Response: `summary`, `facts[]`, `missing[]`, `sources[]`, `gate`, `decision`, `assessmentId`, `version`.

`decision` ist ausschließlich `NEEDS_INFORMATION`, `ESCALATE` oder `PRELIMINARY_ONLY`; ein finaler Rechtsentscheid ist absichtlich nicht Teil des Modells.

## POST `/api/v1/checkout`

Erstellt nach Authentifizierung und Eigentümerprüfung eine Stripe Checkout Session für die einmalige Fallprüfung. Preis und Produkt werden ausschließlich serverseitig gesetzt.

## POST `/api/webhooks/stripe`

Verifiziert die Stripe-Signatur und schaltet die zugehörige Fallakte erst nach bestätigter Zahlung frei.

## GET/PATCH `/api/v1/profile`

Liest beziehungsweise aktualisiert die kontogebundenen Profildaten. Die Login-E-Mail kann nicht über diese Route geändert werden.

## Noch geplant

- Malware-Scanner-Callback und Übergang von Quarantäne zu Extraktion
- Antworten auf einzelne Rückfragen
- versionsbezogene Berichts- und Exportendpunkte
- physischer DSGVO-Löschjob einschließlich Blob Store und Providerkopien
- Kanzleirollen und separater verantworteter Prüfpfad

Fehlerformat: `{"error":{"code":"...","message":"...","correlationId":"..."}}`. Keine internen Details oder Dokumentinhalte zurückgeben.
