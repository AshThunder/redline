export class FetchError extends Error {
  constructor(
    message: string,
    public readonly kind: "timeout" | "network" | "http",
    public readonly status?: number,
  ) {
    super(message);
  }
}

export async function fetchJson<T>(url: string, opts: { timeoutMs?: number; headers?: Record<string, string> } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 10_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "Mozilla/5.0 (Redline research desk)", accept: "application/json", ...opts.headers },
      cache: "no-store",
    });
    if (!res.ok) throw new FetchError(`HTTP ${res.status} for ${new URL(url).host}`, "http", res.status);
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof FetchError) throw err;
    if ((err as Error).name === "AbortError") throw new FetchError(`Timed out reaching ${new URL(url).host}`, "timeout");
    throw new FetchError(`Cannot reach ${new URL(url).host}: ${(err as Error).message}`, "network");
  } finally {
    clearTimeout(timer);
  }
}

const memo = new Map<string, { at: number; value: unknown }>();

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await fn();
  memo.set(key, { at: Date.now(), value });
  return value;
}
