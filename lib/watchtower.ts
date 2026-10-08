import type { TradeIntent, Tripwire, Verdict } from "@/lib/types";

export type WatchStatus = "armed" | "tripped" | "dismissed" | "expired";

export type Watch = {
  id: string;
  journalId: string;
  symbol: string;
  side: "long" | "short";
  leverage: number;
  entryPrice: number;
  armedAt: number;
  expiresAt: number;
  query: string;
  deathTitle: string;
  tripwire: Tripwire;
  status: WatchStatus;
  lastPrice: number | null;
  lastReading: number | string | null;
  lastCheckedAt: number | null;
  trippedAt: number | null;
  reason: string | null;
  telegramSent: boolean;
};

export type MarketReading = {
  lastPrice: number;
  fundingRate: number | null;
  nyseOpen: boolean;
  daysUntilEarnings: number | null;
};

/** NYSE regular session in UTC: weekdays 13:30-20:00. */
export function nyseOpen(at = new Date()): boolean {
  const day = at.getUTCDay();
  if (day === 0 || day === 6) return false;
  const mins = at.getUTCHours() * 60 + at.getUTCMinutes();
  return mins >= 13 * 60 + 30 && mins < 20 * 60;
}

function num(threshold: number | string): number | null {
  if (typeof threshold === "number") return threshold;
  const n = Number(threshold);
  return Number.isFinite(n) ? n : null;
}

function crossed(reading: number, op: Tripwire["operator"], threshold: number): boolean {
  return op === ">" ? reading > threshold : reading < threshold;
}

export function readingFor(watch: Watch, m: MarketReading): { value: number | string; label: string } {
  const dir = watch.side === "long" ? 1 : -1;
  const move = m.lastPrice / watch.entryPrice - 1;
  const adverse = -dir * move;
  const tw = watch.tripwire;
  switch (tw.metric) {
    case "price_move_pct":
      return { value: move * 100, label: `${(move * 100).toFixed(2)}% vs entry` };
    case "drawdown_on_margin_pct":
      return { value: Math.max(0, adverse) * watch.leverage * 100, label: `${(Math.max(0, adverse) * watch.leverage * 100).toFixed(1)}% of margin` };
    case "gap_pct":
      return { value: m.nyseOpen ? 0 : Math.abs(move) * 100, label: m.nyseOpen ? "NYSE open, gap not live" : `${(Math.abs(move) * 100).toFixed(2)}% while NYSE is shut` };
    case "funding_rate":
      return { value: (m.fundingRate ?? 0) * 100, label: m.fundingRate == null ? "funding n/a" : `${(m.fundingRate * 100).toFixed(4)}% / 8h` };
    case "news_keyword":
      return {
        value: m.daysUntilEarnings ?? "none",
        label: m.daysUntilEarnings == null ? "no report on the Bitget calendar" : `earnings in ${m.daysUntilEarnings}d`,
      };
  }
}

export function evaluate(watch: Watch, m: MarketReading, now = Date.now()): Watch {
  if (watch.status === "dismissed") return { ...watch, lastPrice: m.lastPrice, lastCheckedAt: now };
  if (now >= watch.expiresAt && watch.status === "armed") {
    return { ...watch, status: "expired", lastPrice: m.lastPrice, lastCheckedAt: now, reason: "Horizon ended" };
  }
  if (watch.status !== "armed") return { ...watch, lastPrice: m.lastPrice, lastCheckedAt: now };

  const { value, label } = readingFor(watch, m);
  const tw = watch.tripwire;
  let hit = false;
  let reason = label;

  if (tw.metric === "news_keyword") {
    const key = String(tw.threshold).toLowerCase();
    hit = m.daysUntilEarnings != null && m.daysUntilEarnings <= 2 && /earn|report|print|guidance/.test(key);
    if (hit) reason = `Bitget calendar: earnings in ${m.daysUntilEarnings}d (keyword "${tw.threshold}")`;
  } else {
    const th = num(tw.threshold);
    if (th != null && typeof value === "number") {
      hit = crossed(value, tw.operator, th);
      if (hit) reason = `${tw.metric} ${value.toFixed(2)} ${tw.operator} ${th}`;
    }
  }

  return {
    ...watch,
    lastPrice: m.lastPrice,
    lastReading: value,
    lastCheckedAt: now,
    status: hit ? "tripped" : "armed",
    trippedAt: hit ? now : null,
    reason: hit ? reason : null,
  };
}

export function armWatches(input: {
  journalId: string;
  query: string;
  intent: TradeIntent;
  entryPrice: number;
  verdict: Verdict;
  now?: number;
}): Watch[] {
  const now = input.now ?? Date.now();
  const expiresAt = now + input.intent.horizonDays * 86_400_000;
  return input.verdict.deathModes.map((d, i) => ({
    id: `${input.journalId}:${i}`,
    journalId: input.journalId,
    symbol: input.intent.symbol,
    side: input.intent.side,
    leverage: input.intent.leverage,
    entryPrice: input.entryPrice,
    armedAt: now,
    expiresAt,
    query: input.query,
    deathTitle: d.title,
    tripwire: d.tripwire,
    status: "armed" as const,
    lastPrice: null,
    lastReading: null,
    lastCheckedAt: null,
    trippedAt: null,
    reason: null,
    telegramSent: false,
  }));
}

export function mergeWatches(prev: Watch[], next: Watch[]): Watch[] {
  const keep = new Set(next.map((w) => w.id));
  const older = prev.filter((w) => !keep.has(w.id) && (w.status === "dismissed" || w.status === "expired"));
  return [...next, ...older];
}
