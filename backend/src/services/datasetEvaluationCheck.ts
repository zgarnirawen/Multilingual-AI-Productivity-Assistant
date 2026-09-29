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

function classifyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const status = typeof error === "object" && error !== null && "status" in error
    ? Number((error as { status?: unknown }).status)
    : NaN;
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";

  if (status === 429 || /rate.?limit|too many requests|quota|limit.*exceeded/i.test(message)) {
    return "RATE_LIMITED";
  }
  if (
    [408, 409, 425].includes(status) ||
    (status >= 500 && status <= 599) ||
    /timeout|timed out|temporar|service unavailable|connection reset/i.test(message)
  ) {
    return code === "ETIMEDOUT" || /timeout|timed out/i.test(message)
      ? "NETWORK_ERROR"
      : "PROVIDER_TRANSIENT_ERROR";
  }
  if ([401, 403].includes(status) || /unauthorized|forbidden|invalid.*api.?key|authentication/i.test(message)) {
    return "PROVIDER_AUTH_ERROR";
  }
  if (code === "ECONNRESET" || code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return "NETWORK_ERROR";
  }
  return "EVALUATION_ERROR";
}

const ENTITY_FIELDS: Array<keyof IntentResult> = [
  "taskTitle",
  "taskDateTime",
  "eventTitle",
  "eventDateTime",
  "durationMinutes",
  "timeOffsetMinutes",
  "contactName",
  "summaryPeriodStart",
  "summaryPeriodEnd",
  "summaryScope",
  "summaryDates",
  "targetTitleQuery",
  "newTaskTitle",
  "newEventTitle",
  "newEventDateTime",
];

function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
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
  const perIntent: Record<string, { total: number; completed: number; passed: number; errors: number }> = {};
  let intentPassed = 0;
  let completed = 0;
  let entityChecks = 0;
  let entityPassed = 0;
  let actualEntityCount = 0;
  let unexpectedEntityCount = 0;
  let confidenceSum = 0;
  let latencySum = 0;
  const errorTypes: Record<string, number> = {};

  for (const testCase of cases) {
    const started = performance.now();
    let result: IntentResult;

    try {
      result = await detectIntent(testCase.input);
    } catch (error) {
      const latencyMs = Number((performance.now() - started).toFixed(1));
      const errorType = classifyError(error);
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;

      results.push({
        id: testCase.id,
        language: testCase.language,
        input: testCase.input,
        expectedIntent: testCase.expectedIntent,
        actualIntent: null,
        confidence: null,
        latencyMs,
        intentPassed: null,
        entityChecks: 0,
        entityPassed: 0,
        errorType,
        error: error instanceof Error ? error.message : String(error),
        status: "ERROR",
      });

      perIntent[testCase.expectedIntent] ??= {
        total: 0,
        completed: 0,
        passed: 0,
        errors: 0,
      };
      perIntent[testCase.expectedIntent].total++;
      perIntent[testCase.expectedIntent].errors++;
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
    const actualEntities = ENTITY_FIELDS.filter((field) => isPresent(result[field]));
    const expectedEntityFields = new Set(entityEntries.map(([field]) => field));
    const unexpectedEntities = actualEntities.filter((field) => !expectedEntityFields.has(field));
    const actualEntityCountCase = actualEntities.length;
    const unexpectedEntityCountCase = unexpectedEntities.length;

    completed++;
    intentPassed += intentPassedCase ? 1 : 0;
    entityChecks += entityEntries.length;
    entityPassed += entityMatches;
    actualEntityCount += actualEntityCountCase;
    unexpectedEntityCount += unexpectedEntityCountCase;
    confidenceSum += result.confidence ?? 0;
    latencySum += latencyMs;

    perIntent[testCase.expectedIntent] ??= {
      total: 0,
      completed: 0,
      passed: 0,
      errors: 0,
    };
    perIntent[testCase.expectedIntent].total++;
    perIntent[testCase.expectedIntent].completed++;
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
      actualEntityCount: actualEntityCountCase,
      unexpectedEntityCount: unexpectedEntityCountCase,
      unexpectedEntities,
      status: intentPassedCase && entityMatches === entityEntries.length ? "PASS" : "FAIL",
    });
  }

  const total = cases.length;
  const errors = total - completed;
  const intentAccuracy = completed
    ? Number(((intentPassed / completed) * 100).toFixed(1))
    : null;
  const entityAccuracy = entityChecks
    ? Number(((entityPassed / entityChecks) * 100).toFixed(1))
    : null;
  const errorRate = total
    ? Number(((errors / total) * 100).toFixed(1))
    : 0;
  const entityPrecision = actualEntityCount
    ? Number(((entityPassed / actualEntityCount) * 100).toFixed(1))
    : null;
  const entityRecall = entityChecks
    ? Number(((entityPassed / entityChecks) * 100).toFixed(1))
    : null;
  const unexpectedEntityRate = actualEntityCount
    ? Number(((unexpectedEntityCount / actualEntityCount) * 100).toFixed(1))
    : 0;
  const status = errors > 0
    ? "DEGRADED"
    : intentAccuracy !== null && intentAccuracy < 95
      ? "FAILED"
      : "PASS";

  const perIntentMetrics = Object.fromEntries(
    Object.entries(perIntent).map(([intent, value]) => [
      intent,
      {
        total: value.total,
        completed: value.completed,
        passed: value.passed,
        failed: value.completed - value.passed,
        errors: value.errors,
        accuracy: value.completed
          ? Number(((value.passed / value.completed) * 100).toFixed(1))
          : null,
      },
    ]),
  );

  const report = {
    schemaVersion: 2,
    evaluation: "dataset-metrics",
    dataset: dataset.name,
    datasetSchemaVersion: dataset.schemaVersion,
    model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b",
    fallbackModel: process.env.GROQ_FALLBACK_MODEL || null,
    mode: process.env.LLM_EVAL_MODE || "local",
    status,
    total,
    completed,
    errors,
    coverage: total ? Number(((completed / total) * 100).toFixed(1)) : 0,
    errorRate,
    errorTypes,
    metrics: {
      intentAccuracy,
      entityAccuracy,
      entityPrecision,
      entityRecall,
      unexpectedEntityRate,
      averageLatencyMs: completed
        ? Number((latencySum / completed).toFixed(1))
        : null,
      averageConfidence: completed
        ? Number((confidenceSum / completed).toFixed(3))
        : null,
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
      accuracy: metrics.accuracy === null ? "N/A" : `${metrics.accuracy}%`,
      passed: `${metrics.passed}/${metrics.completed}`,
      errors: metrics.errors,
    })),
  );
  console.log(`Dataset cases: ${total}`);
  console.log(`Completed cases: ${completed}`);
  console.log(`Provider/evaluation errors: ${errors}`);
  console.log(`Coverage: ${report.coverage}%`);
  console.log(`Error rate: ${errorRate}%`);
  console.log(`Intent accuracy (completed cases): ${intentAccuracy === null ? "N/A" : intentAccuracy + "%"}`);
  console.log(`Entity accuracy/recall: ${entityAccuracy === null ? "N/A" : entityAccuracy + "%"}`);
  console.log(`Entity precision: ${entityPrecision === null ? "N/A" : entityPrecision + "%"}`);
  console.log(`Unexpected entity rate: ${unexpectedEntityRate}%`);
  console.log(`Average latency: ${report.metrics.averageLatencyMs === null ? "N/A" : report.metrics.averageLatencyMs + " ms"}`);
  console.log(`Average confidence: ${report.metrics.averageConfidence === null ? "N/A" : report.metrics.averageConfidence}`);
  if (Object.keys(errorTypes).length > 0) {
    console.log("Error types:", errorTypes);
  }
  console.log(`Evaluation status: ${status}`);
  console.log("Report: evaluation-results/dataset-metrics.json");

  if (errors > 0) {
    console.warn("Evaluation is DEGRADED: provider/evaluation errors were excluded from accuracy metrics.");
    console.warn("A partial run is not a valid full-dataset quality benchmark.");
    process.exitCode = 2;
  } else if (intentAccuracy !== null && intentAccuracy < 95) {
    console.error("Evaluation quality gate failed: intent accuracy is below 95%.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Dataset evaluation failed:", error);
  process.exitCode = 1;
});
