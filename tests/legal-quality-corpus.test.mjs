import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluateQualityGates } from "../lib/services/quality-gates.ts";
import { matchDeadlineRules } from "../lib/services/deadline-rules.ts";

const corpus = JSON.parse(await readFile(new URL("./fixtures/legal-quality-corpus.json", import.meta.url), "utf8"));

for (const fixture of corpus) {
  test(`legal quality corpus: ${fixture.id}`, () => {
    if (fixture.deadlineInput) {
      const ids = matchDeadlineRules(fixture.deadlineInput).map(rule => rule.id);
      assert.deepEqual(ids, fixture.expectedDeadlineIds);
    }
    if (fixture.gateContext) {
      const result = evaluateQualityGates(fixture.gateContext);
      assert.equal(result.decision, fixture.expectedDecision);
      if (fixture.expectedBlocker) assert.ok(result.blockers.includes(fixture.expectedBlocker));
      if (fixture.expectedWarning) assert.ok(result.warnings.includes(fixture.expectedWarning));
    }
  });
}
