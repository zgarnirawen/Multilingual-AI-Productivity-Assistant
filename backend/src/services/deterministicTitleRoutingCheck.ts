import { detectDeterministicModifyTaskTitle } from "./deterministicIntentClassifier.js";

const cases = [
  ["mets comme titre vérifier les factures", "vérifier les factures"],
  ["mets plutôt comme titre préparer le dossier", "préparer le dossier"],
  ["renomme cette tâche en rapport final", "rapport final"],
  ["renomme la tâche en appeler le client", "appeler le client"],
  ["remplace le titre par appeler Sara", "appeler Sara"],
  ["remplace le nom de cette tâche par payer la facture", "payer la facture"],
  ["change le nom de cette tâche en vérifier les serveurs", "vérifier les serveurs"],
];

const nonMatches = [
  "mets une tâche pour vérifier les factures",
  "je dois vérifier les factures",
];

let failures = 0;
for (const [input, expectedTitle] of cases) {
  const result = detectDeterministicModifyTaskTitle(input);
  if (result?.intent !== "modify_task" || result.newTaskTitle !== expectedTitle) {
    failures++;
    console.error("FAIL", { input, expectedTitle, result });
  }
}
for (const input of nonMatches) {
  const result = detectDeterministicModifyTaskTitle(input);
  if (result !== null) {
    failures++;
    console.error("FALSE POSITIVE", { input, result });
  }
}

console.log(`Deterministic title-routing cases: ${cases.length}`);
console.log(`False-positive protection cases: ${nonMatches.length}`);
console.log(failures === 0 ? "PASS" : `FAIL: ${failures}`);

if (failures > 0) process.exitCode = 1;
