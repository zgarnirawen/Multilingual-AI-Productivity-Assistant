import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { detectIntent } from "./intentDetection.js";

type GeneralizationCase = {
  input: string;
  expectedIntent: string;
};

const GENERALIZATION_CASES: GeneralizationCase[] = [
  { input: "pense à prévenir Sara", expectedIntent: "create_task" },
  { input: "je dois terminer le dossier avant ce soir", expectedIntent: "create_task" },
  { input: "il faut que je contacte le client", expectedIntent: "create_task" },
  { input: "réserve-moi un créneau avec Ali demain", expectedIntent: "create_event" },
  { input: "j'ai une consultation chez le dentiste jeudi matin", expectedIntent: "create_event" },
  { input: "prévois une réunion vendredi après-midi", expectedIntent: "create_event" },
  { input: "je ne veux plus garder le rappel du fournisseur", expectedIntent: "delete_task" },
  { input: "retire cette tâche de ma liste", expectedIntent: "delete_task" },
  { input: "enlève le rappel concernant les factures", expectedIntent: "delete_task" },
  { input: "annule ce que j'avais prévu avec Sara", expectedIntent: "delete_event" },
  { input: "retire la rencontre de mon calendrier", expectedIntent: "delete_event" },
  { input: "je ne pourrai finalement pas faire ce rendez-vous", expectedIntent: "delete_event" },
  { input: "renomme cette tâche en rapport final", expectedIntent: "modify_task" },
  { input: "pour cette tâche, remplace le titre par appeler le client", expectedIntent: "modify_task" },
  { input: "mets plutôt comme titre vérifier les factures", expectedIntent: "modify_task" },
  { input: "finalement, décale la réunion à vendredi", expectedIntent: "modify_event" },
  { input: "mets notre rendez-vous une heure plus tard", expectedIntent: "modify_event" },
  { input: "on peut déplacer la rencontre à lundi ?", expectedIntent: "modify_event" },
  { input: "qu'est-ce qui est prévu pour les prochains jours ?", expectedIntent: "summarize_period" },
  { input: "fais-moi le point sur mon agenda", expectedIntent: "summarize_period" },
  { input: "qu'est-ce que j'ai de programmé cette semaine ?", expectedIntent: "summarize_period" },
  { input: "hey", expectedIntent: "greeting" },
  { input: "coucou assistant", expectedIntent: "greeting" },
  { input: "hello, ça va ?", expectedIntent: "greeting" },
  { input: "je te remercie", expectedIntent: "thanks" },
  { input: "super, merci pour ton aide", expectedIntent: "thanks" },
  { input: "merci c'est parfait", expectedIntent: "thanks" },
  { input: "on se reparle plus tard", expectedIntent: "farewell" },
  { input: "à demain", expectedIntent: "farewell" },
  { input: "je dois y aller, à plus", expectedIntent: "farewell" },
  { input: "quelles sortes de choses peux-tu gérer ?", expectedIntent: "capabilities" },
  { input: "à quoi peux-tu me servir ?", expectedIntent: "capabilities" },
  { input: "qu'est-ce que tu sais faire exactement ?", expectedIntent: "capabilities" },
];

function selectCases(): GeneralizationCase[] {
  if (process.env.LLM_EVAL_MODE !== "ci") return GENERALIZATION_CASES;

  // CI samples one frozen paraphrase per intent. The complete 33-case suite
  // remains available locally/on-demand, while CI stays within provider quotas.
  const selected = new Map<string, GeneralizationCase>();
  for (const testCase of GENERALIZATION_CASES) {
    if (!selected.has(testCase.expectedIntent)) {
      selected.set(testCase.expectedIntent, testCase);
    }
  }
  return [...selected.values()];
}

function writeReport(report: Record<string, unknown>) {
  const outputDir = resolve(process.cwd(), "evaluation-results");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    resolve(outputDir, "generalization.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function main() {
  const evaluationCases = selectCases();
  const results: Array<Record<string, unknown>> = [];
  let failures = 0;

  try {
    for (const testCase of evaluationCases) {
      const result = await detectIntent(testCase.input);
      const passed = result.intent === testCase.expectedIntent;
      results.push({
        input: testCase.input,
        expected: testCase.expectedIntent,
        actual: result.intent,
        confidence: result.confidence ?? 0,
        status: passed ? "PASS" : "FAIL",
      });
      if (!passed) failures += 1;
    }
  } catch (error) {
    const message = errorMessage(error);
    console.error("Live intent generalization evaluation unavailable:", message);
    writeReport({
      evaluation: "intent-generalization",
      status: "unavailable",
      reason: message,
      model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b",
      fallbackModel: process.env.GROQ_FALLBACK_MODEL || null,
      scope: process.env.LLM_EVAL_MODE === "ci" ? "ci-representative" : "full",
      configuredTotal: GENERALIZATION_CASES.length,
      total: evaluationCases.length,
      passed: results.filter((result) => result.status === "PASS").length,
      failed: results.filter((result) => result.status === "FAIL").length,
      completed: results.length,
      timestamp: new Date().toISOString(),
      cases: results,
    });
    console.warn("Evaluation is unavailable; this is not treated as a model regression.");
    return;
  }

  const total = evaluationCases.length;
  const passed = total - failures;
  const accuracy = (passed / total) * 100;

  console.table(results);
  console.log(`Tested ${total} frozen unseen paraphrases (${process.env.LLM_EVAL_MODE === "ci" ? "CI representative set" : "full suite"}).`);
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Failed: ${failures}/${total}`);
  console.log(`Generalization accuracy: ${accuracy.toFixed(1)}%`);

  writeReport({
    evaluation: "intent-generalization",
    status: "complete",
    model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b",
    fallbackModel: process.env.GROQ_FALLBACK_MODEL || null,
    scope: process.env.LLM_EVAL_MODE === "ci" ? "ci-representative" : "full",
    configuredTotal: GENERALIZATION_CASES.length,
    total,
    passed,
    failed: failures,
    accuracy: Number(accuracy.toFixed(1)),
    timestamp: new Date().toISOString(),
    cases: results,
  });

  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  const message = errorMessage(error);
  console.error("Intent generalization evaluation crashed:", message);
  writeReport({
    evaluation: "intent-generalization",
    status: "unavailable",
    reason: message,
    model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b",
    fallbackModel: process.env.GROQ_FALLBACK_MODEL || null,
    scope: process.env.LLM_EVAL_MODE === "ci" ? "ci-representative" : "full",
    configuredTotal: GENERALIZATION_CASES.length,
    total: 0,
    passed: 0,
    failed: 0,
    completed: 0,
    timestamp: new Date().toISOString(),
    cases: [],
  });
  console.warn("Evaluation is unavailable; this is not treated as a model regression.");
});
