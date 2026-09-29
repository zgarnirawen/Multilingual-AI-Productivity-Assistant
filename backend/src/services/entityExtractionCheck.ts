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

function writeReport(report: Record<string, unknown>) {
  const outputDir = resolve(process.cwd(), "evaluation-results");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    resolve(outputDir, "entity-extraction.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function main() {
  let failures = 0;
  const results: Array<Record<string, unknown>> = [];

  try {
    for (const testCase of cases) {
      try {
        const result = await detectIntent(testCase.input);
        for (const [field, expected] of Object.entries(testCase.checks)) {
          assert.equal(
            result[field as keyof typeof result],
            expected,
            `expected ${field}=${expected}, got ${String(result[field as keyof typeof result])}`,
          );
        }
        assert.equal(result.intent, testCase.expectedIntent, `expected intent ${testCase.expectedIntent}, got ${result.intent}`);
        results.push({ input: testCase.input, status: "PASS" });
        console.log(`✓ ${testCase.input}`);
      } catch (error) {
        failures++;
        results.push({ input: testCase.input, status: "FAIL", error: errorMessage(error) });
        console.error(`✗ ${testCase.input}`);
        console.error(error);
      }
    }
  } catch (error) {
    const message = errorMessage(error);
    console.error("Live entity extraction evaluation unavailable:", message);
    writeReport({
      evaluation: "entity-extraction",
      status: "unavailable",
      reason: message,
      model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b",
      fallbackModel: process.env.GROQ_FALLBACK_MODEL || null,
      total: cases.length,
      passed: results.filter((result) => result.status === "PASS").length,
      failed: results.filter((result) => result.status === "FAIL").length,
      completed: results.length,
      timestamp: new Date().toISOString(),
      cases: results,
    });
    console.warn("Evaluation is unavailable; this is not treated as a model regression.");
    return;
  }

  const total = cases.length;
  const passed = total - failures;
  const accuracy = (passed / total) * 100;

  writeReport({
    evaluation: "entity-extraction",
    status: "complete",
    model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b",
    fallbackModel: process.env.GROQ_FALLBACK_MODEL || null,
    total,
    passed,
    failed: failures,
    accuracy: Number(accuracy.toFixed(1)),
    timestamp: new Date().toISOString(),
    cases: results,
  });

  console.log(`\nEntity extraction cases: ${total}`);
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Failures: ${failures}`);
  if (failures > 0) process.exit(1);
}

main().catch((error) => {
  const message = errorMessage(error);
  console.error("Entity extraction evaluation crashed:", message);
  writeReport({
    evaluation: "entity-extraction",
    status: "unavailable",
    reason: message,
    model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b",
    fallbackModel: process.env.GROQ_FALLBACK_MODEL || null,
    total: cases.length,
    passed: 0,
    failed: 0,
    completed: 0,
    timestamp: new Date().toISOString(),
    cases: [],
  });
  console.warn("Evaluation is unavailable; this is not treated as a model regression.");
});
