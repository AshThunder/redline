import { z } from "zod";
import type { BitgetData } from "@/lib/tools/bitget-data";

export type { BitgetData };

export const TradeIntentSchema = z.object({
  symbol: z.string().describe("Underlying US ticker, uppercase, e.g. NVDA"),
  side: z.enum(["long", "short"]),
  notionalUsd: z.number().positive().describe("Position notional in USD (margin x leverage)"),
  leverage: z.number().min(1).max(125),
  stopPct: z.number().positive().nullable().describe("Stop distance as % of entry price on the underlying, e.g. 8 for 8%"),
  takeProfitPct: z.number().positive().nullable(),
  horizonDays: z.number().int().min(1).max(90).describe("Intended holding period in calendar days"),
  catalyst: z.string().nullable().describe("Event the trade is positioned for, e.g. earnings, CPI"),
  thesis: z.string().describe("The trader's reason for the trade, in one or two sentences"),
});
export type TradeIntent = z.infer<typeof TradeIntentSchema>;

export type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };

export type RuleProfile = {
  accountUsd: number;
  maxLeverage: number;
  maxLeverageIntoEvent: number;
  maxRiskPerTradePct: number;
  maxWeekendLeverage: number;
  custom: string[];
};

export const DEFAULT_PROFILE: RuleProfile = {
  accountUsd: 5000,
  maxLeverage: 10,
  maxLeverageIntoEvent: 3,
  maxRiskPerTradePct: 2,
  maxWeekendLeverage: 5,
  custom: [],
};

export type Evidence = {
  id: string;
  source: string;
  label: string;
  value: string;
};

export type AnalogResult = {
  sampleSize: number;
  horizonDays: number;
  lookbackYears: number;
  quantiles: { p5: number; p25: number; p50: number; p75: number; p95: number };
  winRate: number;
  expectancyPct: number;
  stopHitProb: number | null;
  liquidationProb: number;
  maeQuantiles: { p50: number; p80: number; p95: number };
  suggestedStopPct: number;
  paths: number[][];
  finals: number[];
  topAnalogs: { date: string; similarity: number; returnPct: number; maePct: number }[];
};

export type GapRisk = {
  overnight: { p50: number; p95: number; p99: number; worst: number };
  weekend: { p50: number; p95: number; p99: number; worst: number };
  probGapThroughStop: number | null;
  closedHoursInHorizon: number;
  weekendsInHorizon: number;
};

export type StressRow = {
  id: string;
  name: string;
  description: string;
  underlyingMovePct: number;
  pnlUsd: number;
  pnlOnMarginPct: number;
  liquidated: boolean;
  stopTriggered: boolean;
};

export type EarningsRisk = {
  nextDate: string | null;
  daysUntil: number | null;
  nextIsEstimate: boolean;
  inHorizon: boolean;
  timing: "after-close" | "pre-market" | "unknown";
  sample: number;
  absMoveP50: number;
  absMoveP90: number;
  worstAdverse: number;
  reactions: { date: string; move: number }[];
};

export type StressResult = {
  earnings: EarningsRisk | null;
  betaQqq: number;
  betaBtc: number;
  marginUsd: number;
  liquidationMovePct: number;
  liquidationPrice: number;
  entryPrice: number;
  fundingCostUsd: number;
  fundingRate: number | null;
  fundingIsEstimate: boolean;
  rows: StressRow[];
};

export type RuleViolation = { rule: string; detail: string; severity: "block" | "warn" };

export type Tripwire = {
  metric: "price_move_pct" | "funding_rate" | "gap_pct" | "drawdown_on_margin_pct" | "news_keyword";
  operator: ">" | "<";
  threshold: number | string;
  description: string;
};

export type DeathMode = {
  title: string;
  mechanism: string;
  probability: "low" | "medium" | "high";
  evidenceIds: string[];
  tripwire: Tripwire;
};

export type Verdict = {
  verdict: "kill" | "resize" | "proceed";
  confidence: number;
  headline: string;
  summary: string;
  deathModes: DeathMode[];
  suggestedLeverage: number;
  suggestedNotionalUsd: number;
  suggestedStopPct: number;
  hedge: string | null;
};

export type DebateTurn = {
  role: "bull" | "bear" | "risk";
  stance: string;
  points: { claim: string; evidenceIds: string[] }[];
};

export type JuryResult = {
  votes: Verdict["verdict"][];
  stability: number;
};

export type TraceStatus = "running" | "done" | "error" | "skipped";

export type RedlineEvent =
  | { type: "step"; id: string; label: string; status: TraceStatus; detail?: string; ms?: number }
  | { type: "intent"; intent: TradeIntent }
  | { type: "market"; price: number; source: string; perp: PerpSnapshot | null; series: { t: number; c: number }[] }
  | { type: "fundamentals"; data: BitgetData }
  | { type: "evidence"; evidence: Evidence[] }
  | { type: "analogs"; result: AnalogResult }
  | { type: "gaps"; result: GapRisk }
  | { type: "stress"; result: StressResult }
  | { type: "rules"; violations: RuleViolation[] }
  | { type: "debate"; turn: DebateTurn }
  | { type: "verdict"; verdict: Verdict; jury: JuryResult }
  | { type: "error"; message: string }
  | { type: "done"; id: string; ms: number; ledgerHash?: string | null };

export type PerpSnapshot = {
  symbol: string;
  lastPrice: number;
  markPrice: number | null;
  fundingRate: number | null;
  change24hPct: number | null;
  volume24hUsd: number | null;
  bidDepthUsd: number | null;
  askDepthUsd: number | null;
  spreadBps: number | null;
};
