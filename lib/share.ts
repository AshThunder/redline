import { z } from "zod";
import type { JuryResult, TradeIntent, Verdict } from "@/lib/types";

const V = { kill: "k", resize: "r", proceed: "p" } as const;
const V_INV = { k: "kill", r: "resize", p: "proceed" } as const;
const P = { low: "l", medium: "m", high: "h" } as const;
const P_INV = { l: "low", m: "medium", h: "high" } as const;

export const SharePayloadSchema = z.object({
  v: z.literal(1),
  sy: z.string().min(1).max(12),
  sd: z.enum(["L", "S"]),
  lv: z.number().min(1).max(125),
  n: z.number().positive(),
  st: z.number().nonnegative().nullable(),
  hz: z.number().int().min(1).max(90),
  vd: z.enum(["k", "r", "p"]),
  cf: z.number().int().min(0).max(100),
  hd: z.string().min(1).max(180),
  dm: z
    .array(z.object({ t: z.string().min(1).max(80), p: z.enum(["l", "m", "h"]) }))
    .max(3),
  sl: z.number().min(1).max(125),
  sn: z.number().positive(),
  ss: z.number().nonnegative(),
  jy: z.array(z.enum(["k", "r", "p"])).max(5).optional(),
});

export type SharePayload = z.infer<typeof SharePayloadSchema>;

export type ShareCard = {
  symbol: string;
  side: "long" | "short";
  leverage: number;
  notionalUsd: number;
  stopPct: number | null;
  horizonDays: number;
  verdict: Verdict["verdict"];
  confidence: number;
  headline: string;
  deathModes: { title: string; probability: "low" | "medium" | "high" }[];
  suggestedLeverage: number;
  suggestedNotionalUsd: number;
  suggestedStopPct: number;
  jury?: Verdict["verdict"][];
};

function clip(s: string, n: number) {
  const t = s.trim();
  return t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}…`;
}

export function packShare(intent: TradeIntent, verdict: Verdict, jury?: JuryResult): SharePayload {
  return {
    v: 1,
    sy: clip(intent.symbol.toUpperCase(), 12),
    sd: intent.side === "short" ? "S" : "L",
    lv: intent.leverage,
    n: Math.round(intent.notionalUsd),
    st: intent.stopPct,
    hz: intent.horizonDays,
    vd: V[verdict.verdict],
    cf: Math.round(Math.min(1, Math.max(0, verdict.confidence)) * 100),
    hd: clip(verdict.headline, 160),
    dm: verdict.deathModes.slice(0, 3).map((d) => ({ t: clip(d.title, 72), p: P[d.probability] })),
    sl: verdict.suggestedLeverage,
    sn: Math.round(verdict.suggestedNotionalUsd),
    ss: verdict.suggestedStopPct,
    jy: jury?.votes.map((vote) => V[vote]),
  };
}

export function unpackShare(p: SharePayload): ShareCard {
  return {
    symbol: p.sy,
    side: p.sd === "S" ? "short" : "long",
    leverage: p.lv,
    notionalUsd: p.n,
    stopPct: p.st,
    horizonDays: p.hz,
    verdict: V_INV[p.vd],
    confidence: p.cf / 100,
    headline: p.hd,
    deathModes: p.dm.map((d) => ({ title: d.t, probability: P_INV[d.p] })),
    suggestedLeverage: p.sl,
    suggestedNotionalUsd: p.sn,
    suggestedStopPct: p.ss,
    jury: p.jy?.map((vote) => V_INV[vote]),
  };
}

function toBase64Url(bytes: Uint8Array) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = typeof btoa === "function" ? btoa(bin) : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(token: string) {
  const pad = token.length % 4 === 0 ? "" : "=".repeat(4 - (token.length % 4));
  const b64 = token.replace(/-/g, "+").replace(/_/g, "/") + pad;
  if (typeof atob === "function") {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(token, "base64url").toString("utf8");
}

export function encodeShare(intent: TradeIntent, verdict: Verdict, jury?: JuryResult) {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(packShare(intent, verdict, jury))));
}

export function decodeShare(token: string): ShareCard | null {
  try {
    const parsed = SharePayloadSchema.safeParse(JSON.parse(fromBase64Url(token)));
    return parsed.success ? unpackShare(parsed.data) : null;
  } catch {
    return null;
  }
}

export function sharePath(token: string) {
  return `/s/${token}`;
}

export function replayQuery(card: ShareCard) {
  const side = card.side === "short" ? "Short" : "Long";
  const stop = card.stopPct != null ? `, stop ${card.stopPct}%` : "";
  return `${side} ${card.symbol} ${card.leverage}x for ${card.horizonDays} days, $${card.notionalUsd} notional${stop}`;
}

export function shareTweetText(card: ShareCard) {
  const verb = card.verdict === "kill" ? "Kill" : card.verdict === "resize" ? "Resize" : "Proceed";
  return `Redline: ${card.symbol} ${card.side} ${card.leverage}x → ${verb}. ${card.headline}\n#BitgetHackathon @Bitget_AI`;
}

export function xIntentUrl(url: string, text: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export function verdictLabel(v: ShareCard["verdict"]) {
  return v === "kill" ? "Kill" : v === "resize" ? "Resize" : "Proceed";
}
