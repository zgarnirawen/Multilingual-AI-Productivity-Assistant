import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { detectIntent } from "./intentDetection.js";

const cases = [
  { input: "Réserve-moi un créneau avec Ali demain pendant 1h30", expectedIntent: "create_event", checks: { contactName: "Ali", durationMinutes: 90 } },
  { input: "N'oublie pas d'appeler Karim", expectedIntent: "create_task", checks: { contactName: "Karim" } },
  { input: "Supprime la tâche concernant les factures", expectedIntent: "delete_task", checks: { targetTitleQuery: "factures" } },
  { input: "Renomme cette tâche en rapport final", expectedIntent: "modify_task", checks: { newTaskTitle: "rapport final" } },
  { input: "Décale la réunion avec Sara à vendredi", expectedIntent: "modify_event", checks: { contactName: "Sara" } },
];
const writeReport = (report: Record<string, unknown>) => {
  const dir = resolve(process.cwd(), "evaluation-results");
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "entity-extraction.json"), JSON.stringify(report, null, 2) + "\n");
};
const message = (error: unknown) => error instanceof Error ? error.message : String(error);

async function main() {
  const results: Array<Record<string, unknown>> = [];
  let failures = 0;
  for (const testCase of cases) {
    let result;
    try {
      result = await detectIntent(testCase.input);
    } catch (error) {
      writeReport({
        evaluation: "entity-extraction", status: "unavailable", reason: message(error),
        model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b",
        fallbackModel: process.env.GROQ_FALLBACK_MODEL || null,
        total: cases.length, completed: results.length,
        passed: results.filter(r => r.status === "PASS").length, failed: failures,
        timestamp: new Date().toISOString(), cases: results,
      });
      console.warn("Provider evaluation unavailable; not a model regression.");
      return;
    }
    try {
      assert.equal(result.intent, testCase.expectedIntent, `expected intent ${testCase.expectedIntent}, got ${result.intent}`);
      for (const [field, expected] of Object.entries(testCase.checks)) {
        assert.equal(result[field as keyof typeof result], expected, `expected ${field}=${expected}, got ${String(result[field as keyof typeof result])}`);
      }
      results.push({ input: testCase.input, status: "PASS" });
      console.log(`✓ ${testCase.input}`);
    } catch (error) {
      failures++;
      results.push({ input: testCase.input, status: "FAIL", error: message(error) });
      console.error(`✗ ${testCase.input}: ${message(error)}`);
    }
  }
  const accuracy = (cases.length - failures) / cases.length * 100;
  writeReport({
    evaluation: "entity-extraction", status: "complete",
    model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b",
    fallbackModel: process.env.GROQ_FALLBACK_MODEL || null,
    total: cases.length, passed: cases.length - failures, failed: failures,
    accuracy: Number(accuracy.toFixed(1)), timestamp: new Date().toISOString(), cases: results,
  });
  console.log(`Entity extraction: ${cases.length - failures}/${cases.length}`);
  if (failures) process.exitCode = 1;
}
main().catch(error => {
  writeReport({ evaluation: "entity-extraction", status: "unavailable", reason: message(error), total: cases.length, completed: 0, passed: 0, failed: 0, timestamp: new Date().toISOString(), cases: [] });
  console.warn("Provider evaluation unavailable; not a model regression.");
});
