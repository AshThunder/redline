import { z } from "zod";
import { generateJson } from "@/lib/llm";
import type { DebateTurn, Evidence, JuryResult, RuleProfile, TradeIntent, Verdict } from "@/lib/types";
import { TradeIntentSchema } from "@/lib/types";

export async function parseIntent(text: string): Promise<TradeIntent> {
  const object = await generateJson({
    schema: TradeIntentSchema,
    temperature: 0,
    system: [
      "You convert a trader's plain-language trade idea into a structured order intent for Bitget tokenized US-stock perpetuals.",
      "Rules: symbol is the US ticker only (NVDA, not NVDAUSDT). notionalUsd is total position size; if the user gives margin and leverage, multiply.",
      "If size is missing assume 1000 USD notional. If leverage is missing assume 1. If horizon is missing infer from the catalyst (earnings: 3 days, weekend: 3 days, otherwise 7).",
      "stopPct and takeProfitPct are percentages of the underlying price, not of margin. Use null when not given.",
      "thesis restates the user's reasoning faithfully; do not invent one.",
    ].join(" "),
    prompt: text,
  });
  return { ...object, symbol: object.symbol.toUpperCase().replace(/USDT$/, "") };
}

const TurnSchema = z.object({
  stance: z.string().describe("One sentence position"),
  points: z
    .array(z.object({ claim: z.string().describe("A specific, quantified argument"), evidenceIds: z.array(z.string()).describe("IDs like E3 that support the claim") }))
    .min(2)
    .max(4),
});

const ROLES: Record<DebateTurn["role"], string> = {
  bull: "You are the Bull. Make the strongest honest case FOR taking this trade as specified. Use only the evidence provided; cite evidence IDs. No cheerleading, only numbers-backed arguments.",
  bear: "You are the Bear. Make the strongest honest case AGAINST this trade. Hunt for the specific ways it loses money: gaps, leverage, crowding, catalysts, trend. Use only the evidence provided; cite evidence IDs.",
  risk: "You are the Risk Officer at a prop desk. You do not care about direction. You care about sizing, stop placement versus historical adverse excursion, liquidation distance, gap-through-stop risk while NYSE is closed but the Bitget stock perp trades, funding drag, and the trader's own rules. Use only the evidence provided; cite evidence IDs.",
};

function brief(intent: TradeIntent, evidence: Evidence[], profile: RuleProfile) {
  return [
    `TRADE: ${intent.side.toUpperCase()} ${intent.symbol} stock perp on Bitget, $${intent.notionalUsd} notional at ${intent.leverage}x, stop ${intent.stopPct ?? "none"}%, target ${intent.takeProfitPct ?? "none"}%, horizon ${intent.horizonDays}d, catalyst: ${intent.catalyst ?? "none"}.`,
    `THESIS: ${intent.thesis}`,
    `TRADER RULES: account $${profile.accountUsd}, max ${profile.maxLeverage}x, max ${profile.maxLeverageIntoEvent}x into events, max ${profile.maxRiskPerTradePct}% risk per trade, max ${profile.maxWeekendLeverage}x over weekends${profile.custom.length ? `; custom: ${profile.custom.join("; ")}` : ""}.`,
    "EVIDENCE:",
    ...evidence.map((e) => `${e.id} [${e.source}] ${e.label}: ${e.value}`),
  ].join("\n");
}

export async function debateTurn(role: DebateTurn["role"], intent: TradeIntent, evidence: Evidence[], profile: RuleProfile): Promise<DebateTurn> {
  const object = await generateJson({
    schema: TurnSchema,
    temperature: 0.4,
    system: ROLES[role],
    prompt: brief(intent, evidence, profile),
  });
  return { role, ...object };
}

const VerdictSchema = z.object({
  verdict: z.enum(["kill", "resize", "proceed"]),
  confidence: z.number().min(0).max(1),
  headline: z.string().describe("Max 12 words. Where this trade breaks, e.g. 'Breaks on a 6% weekend gap before your stop can fill'"),
  summary: z.string().describe("2-3 sentences for the trader, plain language, quantified"),
  deathModes: z
    .array(
      z.object({
        title: z.string().describe("Short name of how the trade dies"),
        mechanism: z.string().describe("One or two sentences, quantified"),
        probability: z.enum(["low", "medium", "high"]),
        evidenceIds: z.array(z.string()),
        tripwire: z.object({
          metric: z.enum(["price_move_pct", "funding_rate", "gap_pct", "drawdown_on_margin_pct", "news_keyword"]),
          operator: z.enum([">", "<"]),
          threshold: z.union([z.number(), z.string()]),
          description: z.string().describe("What Watchtower should watch, in plain words"),
        }),
      }),
    )
    .length(3),
  suggestedLeverage: z.number().min(1),
  suggestedNotionalUsd: z.number().positive(),
  suggestedStopPct: z.number().positive(),
  hedge: z.string().nullable(),
});

export async function judge(
  intent: TradeIntent,
  evidence: Evidence[],
  profile: RuleProfile,
  turns: DebateTurn[],
  opts: { temperature?: number; shuffle?: boolean } = {},
): Promise<Verdict> {
  const ev = opts.shuffle ? [...evidence].sort(() => Math.random() - 0.5) : evidence;
  const debate = turns.map((t) => `${t.role.toUpperCase()}: ${t.stance}\n${t.points.map((p) => `- ${p.claim} (${p.evidenceIds.join(", ")})`).join("\n")}`).join("\n\n");
  const object = await generateJson({
    schema: VerdictSchema,
    temperature: opts.temperature ?? 0.2,
    thinking: process.env.LLM_JUDGE_THINKING === "1",
    system: [
      "You are the Judge on Redline, a pre-trade stress-testing desk. Run a pre-mortem: assume it is the end of the horizon and this trade lost money. Identify the three most likely causes of death, ranked.",
      "Verdict: 'kill' if expected value is negative or a blocking rule is broken with no fix; 'resize' if the idea is viable but size, leverage, or stop is wrong; 'proceed' only if the trade survives the stress tests as specified.",
      "Every death mode needs a concrete tripwire Watchtower can monitor. Suggested stop must respect the historical adverse-excursion data. Never exceed the trader's own rules in your suggestion.",
      "The human makes the final decision. Be direct, specific, and quantified. No hedging language.",
    ].join(" "),
    prompt: `${brief(intent, ev, profile)}\n\nDEBATE:\n${debate}`,
  });
  return object;
}

/** Re-run the judge independently and measure how often it reaches the same verdict. */
export async function jury(intent: TradeIntent, evidence: Evidence[], profile: RuleProfile, turns: DebateTurn[], primary: Verdict, extra = 2): Promise<JuryResult> {
  const once = (t: number) => judge(intent, evidence, profile, turns, { temperature: t, shuffle: true });
  const runs = await Promise.allSettled(Array.from({ length: extra }, (_, i) => once(0.6 + i * 0.2).catch(() => once(0.5))));
  for (const r of runs) if (r.status === "rejected") console.warn("[jury] run failed:", (r.reason as Error).message.slice(0, 400));
  const votes = [primary.verdict, ...runs.flatMap((r) => (r.status === "fulfilled" ? [r.value.verdict] : []))];
  const agree = votes.filter((v) => v === primary.verdict).length;
  return { votes, stability: agree / votes.length };
}
