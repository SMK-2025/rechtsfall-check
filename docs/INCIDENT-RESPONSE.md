# Technischer Notfallplan

Dieser Plan gilt für Sicherheitsvorfälle, Datenabfluss, kompromittierte
Zugangsdaten, unberechtigte Kontozugriffe, fehlerhafte Löschungen und Ausfälle.

## Schweregrade

- **SEV 1:** bestätigter Abfluss von Falldaten, aktiver Kontomissbrauch,
  kompromittierte Produktionsdatenbank, manipulierte Zahlungen oder Ergebnisse.
- **SEV 2:** wahrscheinlicher Schlüsselabfluss, unberechtigter Zugriff,
  Kernfunktionsausfall oder fehlerhafte Berechtigungsprüfung.
- **SEV 3:** einzelne fehlgeschlagene Verarbeitung oder Warnung ohne
  Zugriffsanzeichen.

Im Zweifel gilt zunächst die höhere Stufe.

## Sofortmaßnahmen

1. Uhrzeit, meldende Person und beobachtetes Verhalten festhalten.
2. Keine Falldokumente, Tokens oder Passwörter in Tickets oder Chats kopieren.
3. Bereich eingrenzen: Auth, Datenbank, Blob, Scanner, KI, Mail, Stripe, Job.
4. Bei SEV 1 Zugang sofort sperren oder Schlüssel widerrufen. Upload, Analyse
   oder Checkout nötigenfalls vorübergehend deaktivieren.
5. Anbieter- und Anwendungsprotokolle mit minimalen Metadaten sichern.
6. Betreiber, Technik und Datenschutz informieren; juristisch bewerten lassen.

## Datenschutzbewertung

Unverzüglich Datenarten, besondere Kategorien, Anzahl Betroffener, Zeitraum,
Ursache, Folgen und Schutzmaßnahmen dokumentieren. Eine mögliche Meldung an
die Aufsichtsbehörde und Information Betroffener fachlich prüfen.

Die 72-Stunden-Frist für eine mögliche Meldung nach Art. 33 DSGVO beginnt
grundsätzlich mit Bekanntwerden. Dieser technische Plan ersetzt keine
juristische oder datenschutzfachliche Entscheidung.

## Eindämmung

- **Auth:** Sitzungen invalidieren, Reset erzwingen, `BETTER_AUTH_SECRET`,
  Rollen, E-Mail-Änderungen und `ADMIN_EMAILS` prüfen.
- **Datenbank:** Schreibzugriff nötigenfalls stoppen, Zugang rotieren, Railway
  Logs, PITR und Backup prüfen. Nie ungeprüft über Produktion wiederherstellen.
- **Dokumente:** Upload sperren, Blob-Token rotieren, Referenzen und
  Löschstatus abgleichen. Kein ungescannter Fallback.
- **KI/Mail/Stripe/Scanner:** Betroffenen Schlüssel sperren und nach
  `KEY-ROTATION.md` rotieren. Buchungen mit Stripe-Ereignissen abgleichen und
  Zahlungen nie doppelt freischalten. Scanner erst nach Healthcheck, sauberer
  Datei und EICAR-Test wieder freigeben.

## Wiederanlauf

Freigabe erst, wenn Ursache und Version bekannt, kompromittierte Zugänge
widerrufen, Korrekturen geprüft, Mandantentrennung getestet und die betroffenen
Kernabläufe erfolgreich kontrolliert sind. Danach mindestens 24 Stunden
verstärkt überwachen.

## Kommunikation

Nur bestätigte Tatsachen kommunizieren, keine Falldetails oder Geheimnisse per
E-Mail versenden. Nutzerinformationen müssen Ereignis, betroffene Daten,
Maßnahmen und Schutzschritte verständlich benennen. Aussagen zu Haftung,
Meldepflichten und Rechtsfolgen juristisch freigeben.

## Nachbereitung und Übungen

Innerhalb von fünf Werktagen Zeitlinie, Ursache, Maßnahmen, Rotation,
Berechtigungen, Tests und Monitoring dokumentieren. Halbjährlich einen
Tabletop-Test durchführen. Railway PostgreSQL mindestens vierteljährlich in
einer getrennten Umgebung probeweise wiederherstellen, niemals über Produktion.

