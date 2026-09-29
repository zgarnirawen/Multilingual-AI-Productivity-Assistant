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

let failures = 0;
for (const testCase of cases) {
  const result = await detectIntent(testCase.input);
  try {
    assert.equal(result.intent, testCase.expectedIntent, `expected intent ${testCase.expectedIntent}, got ${result.intent}`);
    for (const [field, expected] of Object.entries(testCase.checks)) {
      assert.equal(result[field as keyof typeof result], expected, `expected ${field}=${expected}, got ${String(result[field as keyof typeof result])}`);
    }
    console.log(`✓ ${testCase.input}`);
  } catch (error) {
    failures++;
    console.error(`✗ ${testCase.input}`);
    console.error(error);
  }
}

const total = cases.length;
const passed = total - failures;
const accuracy = (passed / total) * 100;
const outputDir = resolve(process.cwd(), "evaluation-results");
mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, "entity-extraction.json"), JSON.stringify({
  evaluation: "entity-extraction",
  model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b",
  fallbackModel: process.env.GROQ_FALLBACK_MODEL || null,
  total,
  passed,
  failed: failures,
  accuracy: Number(accuracy.toFixed(1)),
  timestamp: new Date().toISOString(),
}, null, 2) + "\n", "utf8");

console.log(`\nEntity extraction cases: ${total}`);
console.log(`Passed: ${passed}/${total}`);
console.log(`Failures: ${failures}`);
if (failures > 0) process.exit(1);
