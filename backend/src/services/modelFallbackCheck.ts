import assert from "node:assert/strict";
import { withModelFallback } from "./modelFallback.js";

const noWait = async () => {};
let calls: string[] = [];
const primary429 = Object.assign(new Error("rate limited"), { status: 429 });
const value = await withModelFallback(["primary", "fallback"], async (model) => {
  calls.push(model);
  if (model === "primary") throw primary429;
  return "ok";
}, noWait);
assert.equal(value, "ok");
assert.deepEqual(calls, ["primary", "fallback"]);

calls = [];
let first = true;
const recovered = await withModelFallback(["primary"], async (model) => {
  calls.push(model);
  if (first) { first = false; throw Object.assign(new Error("server error"), { status: 503 }); }
  return "recovered";
}, noWait);
assert.equal(recovered, "recovered");
assert.deepEqual(calls, ["primary", "primary"]);

calls = [];
await assert.rejects(() => withModelFallback(["primary", "fallback"], async (model) => {
  calls.push(model);
  throw Object.assign(new Error("invalid key"), { status: 401 });
}, noWait));
assert.deepEqual(calls, ["primary"]);
console.log("Model fallback checks passed: 429 failover, transient retry, non-retryable auth error.");
