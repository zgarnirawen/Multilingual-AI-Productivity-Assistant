export type ModelAttempt<T> = (model: string) => Promise<T>;

function statusCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  const status = Number((error as { status?: unknown }).status);
  return Number.isFinite(status) ? status : undefined;
}

/** One bounded retry for transient failures; 429 advances to the next model. */
export async function withModelFallback<T>(
  models: string[],
  attempt: ModelAttempt<T>,
  wait: (milliseconds: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<T> {
  const configured = [...new Set(models.map((model) => model.trim()).filter(Boolean))];
  if (!configured.length) throw new Error("No inference model is configured.");
  let lastError: unknown;
  for (const model of configured) {
    for (let retry = 0; retry < 2; retry++) {
      try { return await attempt(model); }
      catch (error) {
        lastError = error;
        const status = statusCode(error);
        const transient = status === undefined || status === 408 || status === 409 || status === 425 || (status >= 500 && status <= 599);
        if (!transient || retry === 1) break;
        await wait(250 * (retry + 1));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All configured inference models failed.");
}
