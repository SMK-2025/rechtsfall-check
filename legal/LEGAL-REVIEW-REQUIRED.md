# Juristisch freizugeben

- Sämtliche Paragraphen, Rechtsquellen, Gültigkeitsstände und deren Anwendbarkeit.
- Jede Fristdefinition, Start-/Hemmungs-/Ablauflogik und Darstellung.
- Alle Rückfragenkataloge und juristischen Ontologien.
- Schwellwerte der Qualitätsgates und Eskalationskriterien.
- Wortlaut von Disclaimer, Einwilligung, Datenschutz und Leistungsbeschreibung.
- Marketingbegriff „KI-Anwalt“ einschließlich UWG-, RDG- und berufsrechtlicher Prüfung.
- Standardisierte Ausgabesätze und Bewertungsskalen.
- Testkorpus, erwartete Ergebnisse und Grenzen des Startrechtsgebiets.

Status im MVP: **PENDING_LEGAL_REVIEW – NICHT FÜR PRODUKTIVE RECHTLICHE AUSGABEN**.
# Freigabepaket: amtliche Fristwarnungen

Die folgenden Regeln sind technisch implementiert, aber vor dem produktiven Einsatz durch eine dafür befugte juristische Redaktion in Wortlaut, Triggern, Ausnahmen und Aktualisierungsprozess freizugeben:

- § 4 KSchG: mögliche Dreiwochenfrist nach Zugang einer schriftlichen Kündigung
- § 410 StPO: mögliche Zweiwochenfrist nach Zustellung eines Strafbefehls
- § 67 OWiG: mögliche Zweiwochenfrist nach Zustellung eines Bußgeldbescheids
- § 70 VwGO: mögliche Monatsfrist nach Bekanntgabe eines Verwaltungsakts
- § 84 SGG: mögliche Monatsfrist nach Bekanntgabe eines Verwaltungsakts
- § 1944 BGB: mögliche Sechswochenfrist für die Erbausschlagung
- § 692 ZPO: Hinweis auf zwei Wochen ab Zustellung eines Mahnbescheids

Quelle ist jeweils der aktuelle Text unter `gesetze-im-internet.de`. Das System berechnet bewusst kein Enddatum, solange Zugang/Zustellung, Rechtsbehelfsbelehrung, Auslandsbezug und Sonderregeln nicht verlässlich geklärt sind. Technische Registry: `lib/legal-sources.ts`; konservative Trigger: `lib/services/deadline-engine.ts`.
