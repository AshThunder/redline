import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function signedPct(x: number | null | undefined, digits = 1): string {
  if (x == null || Number.isNaN(x)) return "n/a";
  const v = x * 100;
  return `${v > 0 ? "+" : v < 0 ? "\u2212" : ""}${Math.abs(v).toFixed(digits)}%`;
}

export function plainPct(x: number | null | undefined, digits = 1): string {
  if (x == null || Number.isNaN(x)) return "n/a";
  return `${(x * 100).toFixed(digits)}%`;
}

export function usd(x: number | null | undefined, opts: { signed?: boolean; compact?: boolean } = {}): string {
  if (x == null || Number.isNaN(x)) return "n/a";
  const abs = Math.abs(x);
  const body = opts.compact && abs >= 10_000
    ? `$${(abs / 1000).toFixed(abs >= 100_000 ? 0 : 1)}k`
    : `$${abs.toLocaleString("en-US", { maximumFractionDigits: abs < 100 ? 2 : 0 })}`;
  if (!opts.signed) return x < 0 ? `\u2212${body}` : body;
  return `${x > 0 ? "+" : x < 0 ? "\u2212" : ""}${body}`;
}

export function price(x: number | null | undefined): string {
  if (x == null || Number.isNaN(x)) return "n/a";
  return x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: x < 1 ? 4 : 2 });
}

export function tone(x: number): "gain" | "loss" | "flat" {
  return x > 0.0005 ? "gain" : x < -0.0005 ? "loss" : "flat";
}

export const toneText = { gain: "text-gain", loss: "text-loss", flat: "text-ink-subtle" } as const;
