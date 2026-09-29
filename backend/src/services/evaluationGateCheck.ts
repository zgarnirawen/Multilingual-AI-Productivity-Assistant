import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type Report = {
  evaluation: string;
  status?: "complete" | "unavailable";
  accuracy?: number;
  reason?: string;
};

type Baseline = {
  intentGeneralization: number;
  entityExtraction: number;
  minAccuracy: number;
  maxRegressionDrop: number;
};

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(resolve(process.cwd(), file), "utf8")) as T;
}

async function readReport(file: string, name: string): Promise<Report> {
  try {
    return await readJson<Report>(file);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      evaluation: name,
      status: "unavailable",
      reason: `report could not be read: ${reason}`,
    };
  }
}

async function main() {
  const baseline = await readJson<Baseline>("evaluation-baseline.json");
  const generalization = await readReport("evaluation-results/generalization.json", "intent-generalization");
  const entities = await readReport("evaluation-results/entity-extraction.json", "entity-extraction");

  const evaluations = [
    { name: "Intent generalization", report: generalization, baseline: baseline.intentGeneralization },
    { name: "Entity extraction", report: entities, baseline: baseline.entityExtraction },
  ];

  let failed = false;
  let unavailable = false;

  console.log("LLM evaluation regression gate");
  console.log("--------------------------------");
  console.log(`Minimum accuracy: ${baseline.minAccuracy}%`);
  console.log(`Maximum allowed regression: ${baseline.maxRegressionDrop} percentage points`);

  for (const evaluation of evaluations) {
    if (evaluation.report.status !== "complete" || typeof evaluation.report.accuracy !== "number") {
      unavailable = true;
      console.warn(`::warning::${evaluation.name} evaluation unavailable: ${evaluation.report.reason ?? "no complete report"}`);
      console.log(`${evaluation.name}: UNAVAILABLE (not treated as a regression)`);
      continue;
    }

    const regression = evaluation.baseline - evaluation.report.accuracy;
    const passed =
      evaluation.report.accuracy >= baseline.minAccuracy &&
      regression <= baseline.maxRegressionDrop;

    console.log(
      `${evaluation.name}: current=${evaluation.report.accuracy.toFixed(1)}%, ` +
      `baseline=${evaluation.baseline.toFixed(1)}%, regression=${regression.toFixed(1)}pp ` +
      `${passed ? "PASS" : "FAIL"}`,
    );

    if (!passed) failed = true;
  }

  if (failed) {
    console.error("Evaluation gate failed: a completed evaluation regressed.");
    process.exitCode = 1;
    return;
  }

  if (unavailable) {
    console.warn("Evaluation gate not evaluated: at least one live evaluation was unavailable.");
    console.log("Offline validation remains authoritative; rerun live evaluation when the provider is available.");
    return;
  }

  console.log("Evaluation gate passed.");
}

main().catch((error) => {
  console.error("Evaluation gate failed unexpectedly:", error);
  process.exitCode = 1;
});
