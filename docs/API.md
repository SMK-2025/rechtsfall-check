# API v1

Alle produktiven Endpunkte liegen unter `/api/v1`, liefern JSON, setzen `Cache-Control: no-store` und benötigen serverseitig eine authentifizierte Identität sowie Objekt-Eigentümerprüfung.

## GET `/api/v1/member`

Legt das minimierte Mitgliedsprofil beim ersten Zugriff idempotent an und liefert `id`, `email` und `displayName`. Die interne ID wird deterministisch aus der normalisierten Identität abgeleitet.

## GET/POST `/api/v1/cases`

- `GET`: liefert ausschließlich nicht gelöschte Fälle des authentifizierten Eigentümers.
- `POST`: legt einen Fall im freigegebenen MVP-Rechtsgebiet an, setzt eine Aufbewahrungsfrist und schreibt ein Audit-Ereignis.

## GET/PATCH/DELETE `/api/v1/cases/:caseId`

Jeder Zugriff prüft serverseitig `caseId + ownerId`. `DELETE` ist eine protokollierte Soft-Deletion; die physische Löschung aller D1-/R2-Daten bleibt ein separater Aufbewahrungsjob.

## POST `/api/v1/cases/:caseId/documents`

Multipart-Upload mit Feld `file`. Erlaubt sind PDF, JPG und PNG bis 10 MB. Der Server prüft MIME-Typ, Dateisignatur und SHA-256. Bytes werden in R2 unter einem nicht erratbaren Quarantänepfad gespeichert; Metadaten landen in D1. Ohne freigegebenen Malware-Scan bleibt `extractionStatus` auf `BLOCKED_UNTIL_SCAN`.

## POST `/api/v1/assessments`

MVP-Dummy für strukturierte Aufnahme und Nicht-Antwort.

Request:

```json
{"caseId":"...","topic":"Mangelhafte Ware","eventDate":"2026-07-01","description":"...","hasDocument":false}
```

Der Endpunkt prüft Eigentümerschaft, speichert Fakten und Rückfragen, versioniert die Ausgabe und protokolliert das Gate-Ergebnis. Response: `summary`, `facts[]`, `missing[]`, `sources[]`, `gate`, `decision`, `assessmentId`, `version`.

`decision` ist ausschließlich `NEEDS_INFORMATION`, `ESCALATE` oder `PRELIMINARY_ONLY`; ein finaler Rechtsentscheid ist absichtlich nicht Teil des Modells.

## Noch geplant

- Malware-Scanner-Callback und Übergang von Quarantäne zu Extraktion
- Antworten auf einzelne Rückfragen
- versionsbezogene Berichts- und Exportendpunkte
- physischer DSGVO-Löschjob einschließlich R2 und Providerkopien
- Kanzleirollen und separater verantworteter Prüfpfad

Fehlerformat: `{"error":{"code":"...","message":"...","correlationId":"..."}}`. Keine internen Details oder Dokumentinhalte zurückgeben.
