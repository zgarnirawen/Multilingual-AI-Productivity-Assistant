import "dotenv/config";
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

async function main() {
  let failures = 0;

  const results: Array<{
    input: string;
    expected: string;
    actual: string;
    confidence: number;
    status: string;
  }> = [];

  for (const testCase of GENERALIZATION_CASES) {
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

  console.table(results);

  const total = GENERALIZATION_CASES.length;
  const passed = total - failures;
  const accuracy = (passed / total) * 100;

  console.log(`Tested ${total} frozen unseen paraphrases.`);
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Failed: ${failures}/${total}`);
  console.log(`Generalization accuracy: ${accuracy.toFixed(1)}%`);

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error("Intent generalization test failed:", error);
  process.exitCode = 1;
});
