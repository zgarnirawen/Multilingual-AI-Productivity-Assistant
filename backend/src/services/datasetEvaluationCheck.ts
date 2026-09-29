import "dotenv/config";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { detectIntent, type IntentResult } from "./intentDetection.js";

type EvaluationCase = {
  id: string;
  language: "fr" | "en";
  input: string;
  expectedIntent: string;
  expectedEntities?: Record<string, unknown>;
};

type EvaluationDataset = {
  schemaVersion: number;
  name: string;
  cases: EvaluationCase[];
};

function loadDataset(): EvaluationDataset {
  const datasetPath = resolve(
    process.cwd(),
    process.env.EVAL_DATASET_PATH || "evaluation/dataset/intent-evaluation.json",
  );
  return JSON.parse(readFileSync(datasetPath, "utf8")) as EvaluationDataset;
}

function valuesEqual(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(actual) && Array.isArray(expected)) {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }
  return actual === expected;
}

function emptyConfusionMatrix(cases: EvaluationCase[]) {
  const labels = [...new Set(cases.map((item) => item.expectedIntent))];
  return Object.fromEntries(
    labels.map((expected) => [
      expected,
      Object.fromEntries(labels.map((actual) => [actual, 0])),
    ]),
  ) as Record<string, Record<string, number>>;
}

async function main() {
  const dataset = loadDataset();
  const limit = Number(process.env.EVAL_LIMIT || 0);
  const cases = limit > 0 ? dataset.cases.slice(0, limit) : dataset.cases;

  const results: Array<Record<string, unknown>> = [];
  const confusionMatrix = emptyConfusionMatrix(cases);
  const perIntent: Record<string, { total: number; passed: number }> = {};
  let intentPassed = 0;
  let entityChecks = 0;
  let entityPassed = 0;
  let confidenceSum = 0;
  let latencySum = 0;

  for (const testCase of cases) {
    const started = performance.now();
    let result: IntentResult;

    try {
      result = await detectIntent(testCase.input);
    } catch (error) {
      const latencyMs = Number((performance.now() - started).toFixed(1));
      results.push({
        id: testCase.id,
        input: testCase.input,
        expectedIntent: testCase.expectedIntent,
        actualIntent: null,
        confidence: null,
        latencyMs,
        intentPassed: false,
        entityChecks: 0,
        entityPassed: 0,
        error: error instanceof Error ? error.message : String(error),
        status: "ERROR",
      });
      perIntent[testCase.expectedIntent] ??= { total: 0, passed: 0 };
      perIntent[testCase.expectedIntent].total++;
      confusionMatrix[testCase.expectedIntent] ??= {};
      confusionMatrix[testCase.expectedIntent]["__error__"] =
        (confusionMatrix[testCase.expectedIntent]["__error__"] || 0) + 1;
      continue;
    }

    const latencyMs = Number((performance.now() - started).toFixed(1));
    const intentPassedCase = result.intent === testCase.expectedIntent;
    const expectedEntities = testCase.expectedEntities || {};
    const entityEntries = Object.entries(expectedEntities);
    const entityMatches = entityEntries.filter(([field, expected]) =>
      valuesEqual(result[field as keyof IntentResult], expected),
    ).length;

    intentPassed += intentPassedCase ? 1 : 0;
    entityChecks += entityEntries.length;
    entityPassed += entityMatches;
    confidenceSum += result.confidence ?? 0;
    latencySum += latencyMs;

    perIntent[testCase.expectedIntent] ??= { total: 0, passed: 0 };
    perIntent[testCase.expectedIntent].total++;
    perIntent[testCase.expectedIntent].passed += intentPassedCase ? 1 : 0;

    const row = confusionMatrix[testCase.expectedIntent];
    row[result.intent] = (row[result.intent] || 0) + 1;

    results.push({
      id: testCase.id,
      language: testCase.language,
      input: testCase.input,
      expectedIntent: testCase.expectedIntent,
      actualIntent: result.intent,
      confidence: result.confidence ?? 0,
      latencyMs,
      intentPassed: intentPassedCase,
      expectedEntities,
      entityChecks: entityEntries.length,
      entityPassed: entityMatches,
      status: intentPassedCase && entityMatches === entityEntries.length ? "PASS" : "FAIL",
    });
  }

  const total = cases.length;
  const errors = results.filter((item) => item.status === "ERROR").length;
  const intentAccuracy = total ? Number(((intentPassed / total) * 100).toFixed(1)) : 0;
  const entityAccuracy = entityChecks
    ? Number(((entityPassed / entityChecks) * 100).toFixed(1))
    : null;

  const perIntentMetrics = Object.fromEntries(
    Object.entries(perIntent).map(([intent, value]) => [
      intent,
      {
        total: value.total,
        passed: value.passed,
        failed: value.total - value.passed,
        accuracy: Number(((value.passed / value.total) * 100).toFixed(1)),
      },
    ]),
  );

  const report = {
    schemaVersion: 1,
    evaluation: "dataset-metrics",
    dataset: dataset.name,
    datasetSchemaVersion: dataset.schemaVersion,
    model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b",
    fallbackModel: process.env.GROQ_FALLBACK_MODEL || null,
    mode: process.env.LLM_EVAL_MODE || "local",
    total,
    completed: total - errors,
    errors,
    metrics: {
      intentAccuracy,
      entityAccuracy,
      averageLatencyMs: total ? Number((latencySum / Math.max(total - errors, 1)).toFixed(1)) : 0,
      averageConfidence: total ? Number((confidenceSum / Math.max(total - errors, 1)).toFixed(3)) : 0,
    },
    perIntent: perIntentMetrics,
    confusionMatrix,
    cases: results,
    timestamp: new Date().toISOString(),
  };

  const outputDir = resolve(process.cwd(), "evaluation-results");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    resolve(outputDir, "dataset-metrics.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );

  console.table(
    Object.entries(perIntentMetrics).map(([intent, metrics]) => ({
      intent,
      accuracy: `${metrics.accuracy}%`,
      passed: `${metrics.passed}/${metrics.total}`,
    })),
  );
  console.log(`Dataset cases: ${total}`);
  console.log(`Intent accuracy: ${intentAccuracy}%`);
  console.log(`Entity accuracy: ${entityAccuracy === null ? "N/A" : entityAccuracy + "%"}`);
  console.log(`Average latency: ${report.metrics.averageLatencyMs} ms`);
  console.log(`Average confidence: ${report.metrics.averageConfidence}`);
  console.log(`Report: evaluation-results/dataset-metrics.json`);

  if (errors > 0 || intentAccuracy < 95) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Dataset evaluation failed:", error);
  process.exitCode = 1;
});
