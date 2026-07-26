# Rechtsfall KI – technisches MVP

Startfähiger, Cloudflare-kompatibler MVP eines sicheren Fallraums für eine **nicht abschließende Ersteinschätzung**. Das Produkt strukturiert Angaben und Belege, erkennt Informationslücken und hält eine Ausgabe zurück, wenn Qualitätskriterien nicht erfüllt sind.

> Keine Rechtsberatung. Keine verbindliche Handlungsanweisung. Keine autonome finale Einzelfallentscheidung. Alle mit `*` oder `PENDING_LEGAL_REVIEW` gekennzeichneten juristischen Inhalte und Datenquellen müssen vor produktiver Nutzung anwaltlich/redaktionell freigegeben werden.

## Status

- Startrechtsgebiet: `consumer_purchase_dummy` (Verbraucherrecht / Kaufvertrag)
- öffentliche, indexierbare Homepage und geschützter Memberbereich: funktionsfähig
- authentifizierte Fallverwaltung mit Eigentümerprüfung: funktionsfähig
- versionierte deterministische Dummy-Ersteinschätzung: funktionsfähig
- Datenmodell: D1/SQLite + Drizzle, Migration generierbar
- Dokumentablage: R2-Quarantäne mit Signatur-, Größen- und Hashprüfung; Extraktion bleibt bis zum Malware-Scan gesperrt
- Authentifizierung: Sites/ChatGPT-Identität mit serverseitiger Nutzer- und Fallautorisierung
- OCR, Virenscan, Rechtsquellen und Fristen: Ports/Adapter vorhanden, Provider bewusst nicht konfiguriert

## Schnellstart

Voraussetzungen: Node.js 22.13+ und npm.

```text
npm ci
npm run db:generate
npm run dev
```

Dann die ausgegebene lokale Adresse öffnen. Für eine lokale Datenbank-/R2-Simulation nutzt der Starter die Cloudflare-Entwicklungsumgebung.

## Architektur

```text
Browser / geschützter Fallraum
        |
        v
Next-kompatible App + API-Routen
        |
        +-- Domain: Fallaufnahme, Fakten, Rückfragen, Ersteinschätzung
        +-- Quality Gates: Nicht-Antwort / Eskalation
        +-- Ports: OCR/Extraktion, Rechtsquellen, Fristen
        +-- Persistenz: D1 (Metadaten) + R2 (Dokumentbytes)
        +-- Audit: append-only Ereignisse
```

Die Anwendung folgt einer modularen Monolith-Architektur. Das hält das MVP deploybar, während OCR, Quellen/Fristen und spätere Modell-Inferenz über stabile Interfaces separat ersetzt oder ausgelagert werden können.

## Datenfluss

1. Serverseitig authentifizierten Nutzer ermitteln und minimiertes Memberprofil idempotent anlegen.
2. Fall mit Eigentümerbindung anlegen.
3. Upload validieren (Typ, Größe, Signatur), hashen und in Quarantäne speichern. Malware-Scan ist der nächste freizugebende Adapter.
4. Bytes verschlüsselt in R2; Metadaten in D1 speichern.
5. OCR/Extraktion ausführen; Seiten, Konfidenz und Warnungen erhalten.
6. Behauptungen als Fakten speichern und mit Fundstellen/Belegen verknüpfen.
7. Rückfragen aus fehlenden Pflichtfakten und Widersprüchen erzeugen.
8. Kandidatenquellen und mögliche Fristen zeitstandsbezogen abrufen.
9. Qualitätsgates ausführen. Bei Unsicherheit: Nicht-Antwort oder menschliche Eskalation.
10. Versionierte, unverbindliche Ersteinschätzung speichern; Audit-Ereignis schreiben.

## Sicherheitsgrundsätze

- Deny-by-default, serverseitige Eigentümerprüfung für jeden Fall und jedes Dokument.
- Keine Objekt-URLs oder R2-Keys im Client; kurzlebige Downloads nur nach Autorisierung.
- Upload-Quarantäne bis erfolgreichem Virenscan; Magic-Byte- statt nur MIME-Prüfung.
- TLS, D1/R2-Verschlüsselung, Secret-Verwaltung außerhalb des Repositories.
- Kein Training mit Nutzerdaten; keine Inhalte in Logs. Audit-Metadaten minimieren.
- `Cache-Control: no-store`, Content-Security-Policy, CSRF-Schutz bei Cookie-Auth, Rate Limits.
- Lösch-/Aufbewahrungsfristen, Export, Berichtigung und Einwilligungsnachweise technisch vorsehen.
- Modell-/Prompt-Version, Quelldatenstand und Gate-Ergebnis reproduzierbar speichern.

Siehe [docs/SECURITY-PRIVACY.md](docs/SECURITY-PRIVACY.md).

## Annahmen

1. Grundlage ist die 13-seitige Machbarkeitsstudie „Autonome KI-Rechtsplattform für Endnutzer in Deutschland“, Stand 24.07.2026. Ihre Architekturvorgaben (Fakten vor Schlussfolgerungen, Quellen vor Textgenerierung, Rückfragen vor Ergebnis und Nicht-Antwort) sind als Leitplanken umgesetzt.
2. Deutschland ist alleinige Jurisdiktion; Sprache ist zunächst Deutsch.
3. Verbraucherrecht/Kaufvertrag dient nur als konfigurierbarer Dummy, nicht als freigegebener Rechtsinhalt.
4. Sites/Cloudflare D1 und R2 sind die MVP-Laufzeit. Ein Wechsel ist durch Ports möglich.
5. Authentifizierung nutzt die von der Hosting-Plattform gelieferte Identität. Produktive Mandanten-/Rollenlogik folgt in Phase 2.
6. Jede rechtliche Quelle, Fristlogik und Formulierung braucht fachliche Freigabe mit Version und Gültigkeitszeitraum.
7. OCR-, Malware-, E-Mail- und KI-Provider werden erst nach AVV, DPIA-Prüfung und Datenresidenzentscheidung angeschlossen.

## Umgebungsvariablen

`.env.example` dokumentiert optionale Providerwerte. D1 (`DB`) und R2 (`DOCUMENTS`) werden durch Sites gebunden und gehören nicht in `.env`.

## Tests

```text
npm run build
npm run test:unit
```

Vorgesehen sind Unit-Tests für Gates/Fragen, API-Vertragstests, Persistenztests, Upload-Sicherheitstests und End-to-End-Fälle einschließlich Nicht-Antwort.

## Dokumentation

- [API](docs/API.md)
- [Datenmodell](docs/DATA-MODEL.md)
- [Sicherheit & Datenschutz](docs/SECURITY-PRIVACY.md)
- [Roadmap](docs/ROADMAP.md)
- [öffentliche Quellenpolitik](docs/SOURCES-POLICY.md)
- [juristische Freigabeliste](legal/LEGAL-REVIEW-REQUIRED.md)
