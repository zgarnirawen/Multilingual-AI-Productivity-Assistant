import assert from "node:assert/strict";
import { normalizeTargetTitleQuery } from "./targetTitleQuery.js";

const cases: Array<[string, string | undefined]> = [
  ["tâche concernant les factures", "factures"],
  ["la tâche à propos de la réunion client", "réunion client"],
  ["rappel concernant appeler Karim", "appeler Karim"],
  ["task about deployment logs", "deployment logs"],
  ["the reminder regarding invoices", "invoices"],
  ["factures", "factures"],
  ["  la   tâche concernant   les factures  ", "factures"],
  ["la tâche", "tâche"],
];
for (const [input, expected] of cases) {
  assert.equal(normalizeTargetTitleQuery(input), expected, input);
}
console.log(`Target title query normalization: ${cases.length}/${cases.length} passed`);
