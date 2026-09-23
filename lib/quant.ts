import type { Bar } from "@/lib/types";

export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function sortNum(xs: number[]): number[] {
  return [...xs].sort((a, b) => a - b);
}

export function mean(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0) / (xs.length || 1);
}

export function std(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, xs.length - 1));
}

export function dayKey(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

/** Daily simple returns keyed by date. */
export function returnsByDay(bars: Bar[]): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 1; i < bars.length; i++) m.set(dayKey(bars[i].t), bars[i].c / bars[i - 1].c - 1);
  return m;
}

/** OLS beta of `a` on `b` over the dates they share. */
export function beta(a: Map<string, number>, b: Map<string, number>, lastN = 252): number {
  const keys = [...a.keys()].filter((k) => b.has(k)).slice(-lastN);
  if (keys.length < 30) return 1;
  const xa = keys.map((k) => a.get(k)!);
  const xb = keys.map((k) => b.get(k)!);
  const ma = mean(xa), mb = mean(xb);
  let cov = 0, varb = 0;
  for (let i = 0; i < keys.length; i++) {
    cov += (xa[i] - ma) * (xb[i] - mb);
    varb += (xb[i] - mb) ** 2;
  }
  return varb === 0 ? 1 : cov / varb;
}

export function rsi(closes: number[], end: number, period = 14): number {
  let gain = 0, loss = 0;
  for (let i = end - period + 1; i <= end; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }
  if (loss === 0) return 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

export function tradingDays(calendarDays: number): number {
  return Math.max(1, Math.round((calendarDays * 5) / 7));
}

export function pct(x: number, digits = 1): string {
  const v = x * 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%`;
}
