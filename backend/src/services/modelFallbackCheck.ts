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
  if (first) {
    first = false;
    throw Object.assign(new Error("server error"), { status: 503 });
  }
  return "recovered";
}, noWait);
assert.equal(recovered, "recovered");
assert.deepEqual(calls, ["primary", "primary"]);

calls = [];
let primaryAttempts = 0;
const fallbackRecovered = await withModelFallback(["primary", "fallback"], async (model) => {
  calls.push(model);
  if (model === "primary") {
    primaryAttempts++;
    throw Object.assign(new Error("server error"), { status: 503 });
  }
  return "fallback-ok";
}, noWait);
assert.equal(fallbackRecovered, "fallback-ok");
assert.equal(primaryAttempts, 2);
assert.deepEqual(calls, ["primary", "primary", "fallback"]);

calls = [];
await assert.rejects(() => withModelFallback(["primary", "fallback"], async (model) => {
  calls.push(model);
  throw Object.assign(new Error("invalid key"), { status: 401 });
}, noWait));
assert.deepEqual(calls, ["primary"]);

calls = [];
const timeoutRecovered = await withModelFallback(["primary"], async (model) => {
  calls.push(model);
  if (calls.length === 1) throw Object.assign(new Error("socket timeout"), { code: "ETIMEDOUT" });
  return "network-recovered";
}, noWait);
assert.equal(timeoutRecovered, "network-recovered");
assert.deepEqual(calls, ["primary", "primary"]);

calls = [];
await assert.rejects(() => withModelFallback(["primary", "fallback"], async (model) => {
  calls.push(model);
  throw new Error("unexpected application error");
}, noWait));
assert.deepEqual(calls, ["primary"]);

calls = [];
await assert.rejects(() => withModelFallback(["primary", "fallback"], async (model) => {
  calls.push(model);
  throw Object.assign(new Error("server unavailable"), { status: 503 });
}, noWait));
assert.deepEqual(calls, ["primary", "primary", "fallback", "fallback"]);

console.log("Model fallback checks passed: 429 failover, bounded 5xx retry, network retry, non-retryable errors, and exhausted fallback.");
