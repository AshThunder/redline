import { createHash } from "node:crypto";
import { mkdir, readFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { MU_INTENT, MU_VERDICT } from "@/lib/landing/mu-case";
import { perpSnapshot } from "@/lib/tools/bitget";
import { dailyHistory } from "@/lib/tools/yahoo";

export type LedgerVerdict = "kill" | "resize" | "proceed";

export type LedgerBody = {
  v: 1;
  id: string;
  at: string;
  prev: string | null;
  symbol: string;
  side: "long" | "short";
  leverage: number;
  notionalUsd: number;
  horizonDays: number;
  entryPrice: number;
  verdict: LedgerVerdict;
  confidence: number;
  headline: string;
  suggestedLeverage: number;
  suggestedNotionalUsd: number;
};

export type LedgerEntry = LedgerBody & { hash: string };

export type LedgerMark = {
  id: string;
  hash: string;
  price: number;
  movePct: number;
  pnlOnMarginPct: number;
  suggestedPnlOnMarginPct: number;
  aligned: boolean;
  final: boolean;
  scoredAt: string;
};

const DIR = path.join(process.cwd(), "ledger");
const CHAIN = path.join(DIR, "chain.jsonl");
const MARKS = path.join(DIR, "marks.jsonl");

export function canon(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canon).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canon(obj[k])}`)
    .join(",")}}`;
}

export function hashBody(body: LedgerBody): string {
  return createHash("sha256").update(canon(body)).digest("hex");
}

export function seal(body: LedgerBody): LedgerEntry {
  return { ...body, hash: hashBody(body) };
}

export function verifyChain(entries: LedgerEntry[]): { ok: boolean; brokenAt: number | null } {
  let prev: string | null = null;
  for (let i = 0; i < entries.length; i++) {
    const { hash, ...body } = entries[i];
    if (body.prev !== prev || hashBody(body) !== hash) return { ok: false, brokenAt: i };
    prev = hash;
  }
  return { ok: true, brokenAt: null };
}

function genesis(): LedgerEntry {
  return seal({
    v: 1,
    id: "mu-2026-09-23",
    at: "2026-09-23T16:30:00.000Z",
    prev: null,
    symbol: MU_INTENT.symbol,
    side: MU_INTENT.side,
    leverage: MU_INTENT.leverage,
    notionalUsd: MU_INTENT.notionalUsd,
    horizonDays: MU_INTENT.horizonDays,
    entryPrice: 1091.67,
    verdict: MU_VERDICT.verdict,
    confidence: MU_VERDICT.confidence,
    headline: MU_VERDICT.headline,
    suggestedLeverage: MU_VERDICT.suggestedLeverage,
    suggestedNotionalUsd: MU_VERDICT.suggestedNotionalUsd,
  });
}

async function readJsonl<T>(file: string): Promise<T[]> {
  try {
    const raw = await readFile(file, "utf8");
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l) as T);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function readChain(): Promise<LedgerEntry[]> {
  const rows = await readJsonl<LedgerEntry>(CHAIN);
  if (rows.length > 0) return rows;
  const first = genesis();
  try {
    await mkdir(DIR, { recursive: true });
    await appendFile(CHAIN, `${JSON.stringify(first)}\n`);
  } catch {
    // Read-only hosts still serve the genesis row from memory.
  }
  return [first];
}

export async function recordVerdict(input: Omit<LedgerBody, "v" | "id" | "prev">): Promise<{ entry: LedgerEntry; persisted: boolean }> {
  const chain = await readChain();
  const body: LedgerBody = {
    v: 1,
    id: crypto.randomUUID(),
    prev: chain.at(-1)?.hash ?? null,
    ...input,
  };
  const entry = seal(body);
  let persisted = false;
  try {
    await mkdir(DIR, { recursive: true });
    await appendFile(CHAIN, `${JSON.stringify(entry)}\n`);
    persisted = true;
  } catch {
    persisted = false;
  }
  if (process.env.LEDGER_GITHUB_TOKEN && process.env.LEDGER_GITHUB_REPO) {
    const pushed = await pushGithub(CHAIN, "ledger/chain.jsonl").catch(() => false);
    persisted = persisted || pushed;
  }
  return { entry, persisted };
}

async function pushGithub(file: string, repoPath: string): Promise<boolean> {
  const token = process.env.LEDGER_GITHUB_TOKEN;
  const repo = process.env.LEDGER_GITHUB_REPO;
  if (!token || !repo) return false;
  const headers = {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "user-agent": "redline-ledger",
    "content-type": "application/json",
  };
  const url = `https://api.github.com/repos/${repo}/contents/${repoPath}`;
  const existing = await fetch(url, { headers });
  const sha = existing.ok ? ((await existing.json()) as { sha?: string }).sha : undefined;
  const content = Buffer.from(await readFile(file)).toString("base64");
  const put = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({ message: "Record a Redline verdict", content, sha }),
  });
  return put.ok;
}

export function judgeMark(entry: LedgerEntry, price: number, now = Date.now()): LedgerMark {
  const dir = entry.side === "long" ? 1 : -1;
  const move = dir * (price / entry.entryPrice - 1);
  const pnl = move * entry.leverage;
  const suggested = move * entry.suggestedLeverage;
  const aligned = entry.verdict === "kill" ? pnl < 0 : entry.verdict === "proceed" ? pnl > 0 : pnl < suggested;
  const elapsedDays = (now - Date.parse(entry.at)) / 86_400_000;
  return {
    id: entry.id,
    hash: entry.hash,
    price,
    movePct: move,
    pnlOnMarginPct: pnl,
    suggestedPnlOnMarginPct: suggested,
    aligned,
    final: elapsedDays >= entry.horizonDays,
    scoredAt: new Date(now).toISOString(),
  };
}

async function lastPrice(symbol: string): Promise<number | null> {
  const perp = await perpSnapshot(symbol).catch(() => null);
  if (perp) return perp.lastPrice;
  const hist = await dailyHistory(symbol, "5d").catch(() => null);
  return hist?.lastPrice ?? null;
}

export async function readMarks(): Promise<LedgerMark[]> {
  return readJsonl<LedgerMark>(MARKS);
}

/** Final scores are appended once the horizon has elapsed. Earlier marks stay provisional and are not written. */
export async function scoreChain(entries: LedgerEntry[], now = Date.now()): Promise<LedgerMark[]> {
  const stored = await readMarks();
  const byHash = new Map(stored.filter((m) => m.final).map((m) => [m.hash, m]));
  const out: LedgerMark[] = [];
  for (const entry of entries) {
    const cached = byHash.get(entry.hash);
    if (cached) {
      out.push(cached);
      continue;
    }
    const price = await lastPrice(entry.symbol);
    if (price == null) continue;
    const mark = judgeMark(entry, price, now);
    out.push(mark);
    if (mark.final) {
      try {
        await mkdir(DIR, { recursive: true });
        await appendFile(MARKS, `${JSON.stringify(mark)}\n`);
      } catch {
        // Provisional display still works when the file cannot be written.
      }
    }
  }
  return out;
}
