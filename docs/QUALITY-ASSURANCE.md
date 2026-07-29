# Qualitätsprüfung juristischer Logik

## Automatisierter Testkorpus

`tests/fixtures/legal-quality-corpus.json` enthält kontrollierte, vollständig synthetische Testkonstellationen ohne reale personenbezogene Daten. Jede Konstellation beschreibt:

- das betroffene Rechtsgebiet,
- typische Signalbegriffe für deterministische Fristenwarnungen,
- die erwarteten Warnungs-IDs,
- die Ausgangslage der Qualitätsgates,
- die erwartete Entscheidung `READY`, `NEEDS_INFORMATION` oder `ESCALATE`.

Der Test `tests/legal-quality-corpus.test.mjs` führt diese Konstellationen gegen dieselben Regelmodule aus, die auch die Anwendung verwendet. Änderungen an `deadline-rules.ts` oder `quality-gates.ts`, die ein erwartetes Sicherheitsverhalten verändern, lassen den Build fehlschlagen.

## Erweiterungsregel

Ein neues Rechtsgebiet oder eine neue feste Fristenregel wird erst produktiv freigegeben, wenn mindestens folgende Fälle ergänzt wurden:

1. normaler Fall ohne Eilbedürftigkeit,
2. unvollständiger Sachverhalt,
3. erkannte Frist ohne gesicherten Fristbeginn,
4. erkannte Frist mit bekanntem Fristbeginn,
5. widersprüchliche Angaben,
6. fehlender oder schlecht lesbarer Beleg,
7. fachkundig zu eskalierende Hochrisikokonstellation.

## Grenzen

Der automatisierte Korpus prüft technische Entscheidungswege und verhindert Regressionen. Er ersetzt weder die juristische Prüfung einer Regel noch die anwaltliche Abnahme der daraus entstehenden Nutzertexte. Testfälle verwenden keine echten Fallakten und lösen keine kostenpflichtigen KI-Aufrufe aus.
