# Datenmodell

- `users`: externe Identität, minimiertes Profil.
- `cases`: Eigentümer, Rechtsgebiet, Status, Aufbewahrungsdatum.
- `documents`: privater Blob-Verweis, Hash, Scan-/Extraktionsstatus; keine Bytes in PostgreSQL.
- `facts`: atomare Behauptungen mit Verifikationsstatus und Konfidenz.
- `evidence_links`: nachvollziehbare Fundstelle zwischen Fakt und Dokumentseite/Zitat.
- `questions`: versionierbare Rückfragen und Antworten.
- `assessments`: unveränderliche Ausgabenversion mit Inhalts-/Quellenstand.
- `audit_events`: append-only Sicherheits- und Verarbeitungshistorie.

Personenbezogene Inhalte werden nicht in technischen Logs dupliziert. Löschung erfasst PostgreSQL-Datensätze, private Blobs, abgeleitete Extrakte und Providerkopien.
