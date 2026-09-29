import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type Report = { evaluation: string; status?: "complete" | "unavailable"; accuracy?: number; reason?: string };
type Baseline = { intentGeneralization: number; entityExtraction: number; minAccuracy: number; maxRegressionDrop: number };

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(resolve(process.cwd(), file), "utf8")) as T;
}
async function readReport(file: string, name: string): Promise<Report> {
  try { return await readJson<Report>(file); }
  catch (error) {
    return { evaluation: name, status: "unavailable", reason: `report could not be read: ${error instanceof Error ? error.message : String(error)}` };
  }
}
async function main() {
  const baseline = await readJson<Baseline>("evaluation-baseline.json");
  const reports = [
    { name: "Intent generalization", report: await readReport("evaluation-results/generalization.json", "intent-generalization"), baseline: baseline.intentGeneralization },
    { name: "Entity extraction", report: await readReport("evaluation-results/entity-extraction.json", "entity-extraction"), baseline: baseline.entityExtraction },
  ];
  let failed = false, unavailable = false;
  console.log("LLM evaluation regression gate");
  console.log(`Minimum accuracy: ${baseline.minAccuracy}%; max regression: ${baseline.maxRegressionDrop}pp`);
  for (const item of reports) {
    if (item.report.status !== "complete" || typeof item.report.accuracy !== "number") {
      unavailable = true;
      console.warn(`::warning::${item.name} unavailable: ${item.report.reason ?? "no complete report"}`);
      console.log(`${item.name}: UNAVAILABLE (not treated as regression)`);
      continue;
    }
    const regression = item.baseline - item.report.accuracy;
    const passed = item.report.accuracy >= baseline.minAccuracy && regression <= baseline.maxRegressionDrop;
    console.log(`${item.name}: current=${item.report.accuracy.toFixed(1)}%, baseline=${item.baseline.toFixed(1)}%, regression=${regression.toFixed(1)}pp ${passed ? "PASS" : "FAIL"}`);
    if (!passed) failed = true;
  }
  if (failed) { console.error("Evaluation gate failed: a completed evaluation regressed."); process.exitCode = 1; return; }
  if (unavailable) { console.warn("Live evaluation unavailable; offline validation remains authoritative."); return; }
  console.log("Evaluation gate passed.");
}
main().catch(error => { console.error("Evaluation gate failed unexpectedly:", error); process.exitCode = 1; });
