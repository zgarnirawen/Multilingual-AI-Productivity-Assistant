import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type Report = { evaluation: string; accuracy: number };
type Baseline = {
  intentGeneralization: number;
  entityExtraction: number;
  minAccuracy: number;
  maxRegressionDrop: number;
};

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(resolve(process.cwd(), file), "utf8")) as T;
}

async function main() {
  const baseline = await readJson<Baseline>("evaluation-baseline.json");
  const generalization = await readJson<Report>("evaluation-results/generalization.json");
  const entities = await readJson<Report>("evaluation-results/entity-extraction.json");

  const evaluations = [
    { name: "Intent generalization", current: generalization.accuracy, baseline: baseline.intentGeneralization },
    { name: "Entity extraction", current: entities.accuracy, baseline: baseline.entityExtraction },
  ];

  let failed = false;
  console.log("LLM evaluation regression gate");
  console.log("--------------------------------");
  console.log(`Minimum accuracy: ${baseline.minAccuracy}%`);
  console.log(`Maximum allowed regression: ${baseline.maxRegressionDrop} percentage points`);

  for (const evaluation of evaluations) {
    const regression = evaluation.baseline - evaluation.current;
    const passed = evaluation.current >= baseline.minAccuracy && regression <= baseline.maxRegressionDrop;
    console.log(`${evaluation.name}: current=${evaluation.current.toFixed(1)}%, baseline=${evaluation.baseline.toFixed(1)}%, regression=${regression.toFixed(1)}pp ${passed ? "PASS" : "FAIL"}`);
    if (!passed) failed = true;
  }

  if (failed) {
    console.error("Evaluation gate failed.");
    process.exitCode = 1;
  } else {
    console.log("Evaluation gate passed.");
  }
}

main().catch((error) => {
  console.error("Evaluation gate failed:", error);
  process.exitCode = 1;
});
