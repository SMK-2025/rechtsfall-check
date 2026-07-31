# API v1

Alle produktiven Endpunkte liegen unter `/api/v1`, liefern JSON, setzen `Cache-Control: no-store` und benötigen serverseitig eine authentifizierte Identität sowie Objekt-Eigentümerprüfung.

## GET `/api/v1/member`

Legt das minimierte Mitgliedsprofil beim ersten Zugriff idempotent an und liefert `id`, `email` und `displayName`. Die interne ID wird deterministisch aus der normalisierten Identität abgeleitet.

## GET/POST `/api/v1/cases`

- `GET`: liefert ausschließlich nicht gelöschte Fälle des authentifizierten Eigentümers.
- `POST`: validiert das ausgewählte Rechtsgebiet gegen den zentralen Katalog, legt die Fallakte an, setzt eine Aufbewahrungsfrist und schreibt ein Audit-Ereignis.

## GET/PATCH/DELETE `/api/v1/cases/:caseId`

Jeder Zugriff prüft serverseitig `caseId + ownerId`. `DELETE` ist eine protokollierte Soft-Deletion; die physische Löschung aller PostgreSQL-/Blob-Daten bleibt ein separater Aufbewahrungsjob.

## POST `/api/v1/cases/:caseId/documents`

Multipart-Upload mit Feld `file`. Erlaubt sind PDF, JPG und PNG bis 4 MB. Der Server prüft MIME-Typ, Dateisignatur und SHA-256 und lässt die Datei vor der Speicherung durch den angebundenen Malware-Scanner prüfen. Bytes werden ausschließlich nach erfolgreicher Sicherheitsprüfung in einem privaten Vercel Blob Store unter einem nicht erratbaren Quarantänepfad gespeichert; Metadaten landen in PostgreSQL. Nach ausdrücklicher KI-Einwilligung wird der Inhalt serverseitig über die modulare Dokumentenpipeline strukturiert extrahiert. Sie erkennt gescannte Inhalte, führt bei Bedarf OCR aus, ordnet Feststellungen Seiten zu und speichert Qualitäts- und Prüfhinweise im `extractionJson`. Zur Datenminimierung wird keine zusätzliche vollständige Textkopie des Dokuments gespeichert. Die Datei wird nie öffentlich verlinkt.

## POST `/api/v1/assessments`

Dialogische Aufnahme mit Dokumentextraktion, Nicht-Antwort- und Eskalationslogik. Der Endpunkt arbeitet „fail closed“: Ohne KI-Schlüssel oder bei einem Providerfehler wird keine regelbasierte Ausgabe als KI-Ergebnis ausgegeben.

Request:

```json
{"caseId":"...","legalArea":"neighbour_property","topic":"Lärm oder sonstige Störungen","eventDate":"2026-07-01","federalState":"Nordrhein-Westfalen","opposingParty":"Nachbar","description":"...","desiredOutcome":"Störung beenden","hasDocument":false,"finalSubmission":false}
```

Der Endpunkt prüft Eigentümerschaft und Zahlung, extrahiert noch nicht ausgewertete Unterlagen und berücksichtigt bereits beantwortete Rückfragen.

- Ohne `finalSubmission` prüft er ausschließlich die Vollständigkeit. Er erzeugt nur unverzichtbare, fallbezogene Rückfragen oder setzt den Fall auf `READY_FOR_REVIEW`. In dieser Phase wird kein sichtbarer Prüfbericht und keine Assessment-Version gespeichert.
- Mit `finalSubmission: true` wird nach erneuter Vollständigkeitsprüfung genau ein Prüfbericht erzeugt. Anschließend erhält der Fall den Status `ASSESSMENT_READY` oder `ESCALATED` und ist inhaltlich gesperrt.
- Bereits final eingereichte Fälle antworten mit `409 CASE_ALREADY_FINALIZED`.
- Insgesamt werden pro Fall höchstens zehn inhaltlich unterschiedliche Rückfragen zugelassen; bei ausreichenden Angaben werden keine Rückfragen gestellt.

Der Prüfbericht bleibt eine nicht abschließende Ersteinschätzung. Ein finaler Rechtsentscheid oder eine verbindliche Handlungsanweisung ist absichtlich nicht Teil des Modells.

## POST `/api/v1/checkout`

Erstellt nach Authentifizierung und Eigentümerprüfung eine Stripe Checkout Session für die einmalige Fallprüfung. Preis und Produkt werden ausschließlich serverseitig gesetzt.

## POST `/api/webhooks/stripe`

Verifiziert die Stripe-Signatur und schaltet die zugehörige Fallakte erst nach bestätigter Zahlung frei.

## GET/PATCH `/api/v1/profile`

Liest beziehungsweise aktualisiert die kontogebundenen Profildaten. Die Login-E-Mail kann nicht über diese Route geändert werden.

## PATCH `/api/v1/cases/:caseId/questions`

Speichert Antworten auf offene, zur Fallakte gehörende KI-Rückfragen. Anschließend wird die Analyse erneut gestartet. Neue Fragen ersetzen nur bisher offene Fragen; beantwortete Fragen bleiben als Kontext und Auditspur erhalten.

## Noch geplant

- Kanzleirollen und separater verantworteter Prüfpfad

Fehlerformat: `{"error":{"code":"...","message":"...","correlationId":"..."}}`. Keine internen Details oder Dokumentinhalte zurückgeben.

## Ergänzte Betriebs- und Datenschutzendpunkte

- `DELETE /api/v1/cases/:caseId/documents/:documentId` entfernt eine Unterlage nach Eigentümerprüfung dauerhaft aus Blob Store und Datenbank.
- `POST /api/v1/cases/:caseId/documents/:documentId` setzt eine fehlgeschlagene Extraktion für die nächste Analyse zurück.
- `GET /api/v1/privacy/export` erzeugt einen nicht zwischengespeicherten JSON-Datenexport für die angemeldete Person. Sitzungstoken, Provider-Geheimnisse und Originaldateien sind ausgeschlossen.
- `GET /api/v1/privacy/consent` zeigt die Fallakten mit dokumentierter KI-Einwilligung und einem gegebenenfalls vorhandenen Widerrufszeitpunkt.
- `DELETE /api/v1/privacy/consent` widerruft die KI-Einwilligung für alle eigenen Fallakten mit Wirkung für die Zukunft. Der Zeitpunkt und die Anzahl betroffener Fallakten werden ohne Fallinhalte protokolliert. Eine spätere erneute Verarbeitung setzt eine neue ausdrückliche Einwilligung in der betreffenden Fallakte voraus.
- `GET /api/internal/retention` ist nur mit `Authorization: Bearer $CRON_SECRET` erreichbar. Der tägliche Vercel-Job entfernt fällige Fallinhalte und private Blobs in begrenzten Batches. Zahlungsdatensätze bleiben wegen möglicher gesetzlicher Aufbewahrungspflichten erhalten; die Fallhülle wird pseudonymisiert.
- `GET /api/internal/retention?dryRun=true` liefert ausschließlich die Anzahl der im nächsten Batch fälligen Fälle und Konten. Es werden keine Inhalte oder Identifikatoren ausgegeben und keine Daten verändert.
- `RETENTION_BATCH_SIZE` begrenzt getrennt die Zahl der Fälle und Konten pro Lauf auf 1 bis 100; Standardwert ist 25. Fehlgeschlagene Einzelvorgänge werden als technische Auditereignisse protokolliert und blockieren die übrigen Löschungen nicht.

## Kontolöschung

`/api/v1/privacy/account` ist ausschließlich mit einer gültigen Nutzersitzung erreichbar.

- `GET` liefert eine bestehende Löschvormerkung und den verbindlichen Löschtermin.
- `POST` mit `mode: "scheduled"` merkt das Konto nach ausdrücklicher Bestätigung für die endgültige Löschung in 30 Tagen vor.
- `POST` mit `mode: "immediate"` löscht nach ausdrücklicher Bestätigung ohne Widerrufsfrist das Konto, alle Sitzungen, Fallakten, Dokumentobjekte, Extrakte, Fragen, Antworten, Analysen, Prüfberichte, Auditdaten und lokale Zahlungsverknüpfungen.
- `DELETE` widerruft eine noch nicht ausgeführte Löschvormerkung.
- Der tägliche geschützte Aufbewahrungsjob führt fällige Kontolöschungen mit demselben serverseitigen Löschdienst aus.
- `/betrieb` ist nur für Adressen aus `ADMIN_EMAILS` zugänglich und zeigt ausschließlich technische Zustände, keine Falltexte.

Mit `REQUIRE_MALWARE_SCAN=true` werden Uploads bei Scanner-Ausfall, unklarem Befund oder Schadsoftware fail-closed abgewiesen.

## Spracheingabe

`POST /api/v1/audio/transcriptions` wandelt eine freiwillige, authentifizierte Spracheingabe in deutschen Text um. Erwartet wird `multipart/form-data` mit `caseId`, `field`, `aiConsent=true` und `file`. Die Fallakte muss dem angemeldeten Nutzer gehören. Unterstützt werden WebM, OGG, MP4/M4A, MP3 und WAV bis 4 MB. Die Anwendung speichert nur den zurückgegebenen, vom Nutzer editierbaren Text und keine Audiodatei.
