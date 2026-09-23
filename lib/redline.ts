import { gapRisk, runAnalogs } from "@/lib/analogs";
import { debateTurn, judge, jury, parseIntent } from "@/lib/debate";
import { pct } from "@/lib/quant";
import { checkRules, earningsRisk, runStress } from "@/lib/stress";
import { perpSnapshot } from "@/lib/tools/bitget";
import { bitgetData } from "@/lib/tools/bitget-data";
import { dailyHistory } from "@/lib/tools/yahoo";
import type { DebateTurn, Evidence, PerpSnapshot, RedlineEvent, RuleProfile, TradeIntent } from "@/lib/types";

type Emit = (e: RedlineEvent) => void;

async function step<T>(emit: Emit, id: string, label: string, fn: () => Promise<T>, detail?: (v: T) => string): Promise<T> {
  const t0 = Date.now();
  emit({ type: "step", id, label, status: "running" });
  try {
    const v = await fn();
    emit({ type: "step", id, label, status: "done", detail: detail?.(v), ms: Date.now() - t0 });
    return v;
  } catch (err) {
    emit({ type: "step", id, label, status: "error", detail: (err as Error).message, ms: Date.now() - t0 });
    throw err;
  }
}

async function optional<T>(emit: Emit, id: string, label: string, fn: () => Promise<T>, detail?: (v: T) => string): Promise<T | null> {
  try {
    return await step(emit, id, label, fn, detail);
  } catch {
    return null;
  }
}

export async function runRedline(input: { text: string; profile: RuleProfile; intent?: TradeIntent }, emit: Emit): Promise<void> {
  const started = Date.now();
  const runId = crypto.randomUUID();

  const intent = input.intent ?? (await step(emit, "parse", "Parsing trade idea", () => parseIntent(input.text), (i) => `${i.side} ${i.symbol} ${i.leverage}x, $${i.notionalUsd.toLocaleString()}, ${i.horizonDays}d`));
  emit({ type: "intent", intent });

  const [hist, qqq, btc, perp, fund] = await Promise.all([
    step(emit, "history", `Loading 5y ${intent.symbol} price history`, () => dailyHistory(intent.symbol), (h) => `${h.bars.length} daily bars`),
    step(emit, "qqq", "Loading Nasdaq (QQQ) history", () => dailyHistory("QQQ"), (h) => `${h.bars.length} bars`),
    step(emit, "btc", "Loading BTC history", () => dailyHistory("BTC-USD"), (h) => `${h.bars.length} bars`),
    optional<PerpSnapshot | null>(emit, "perp", `Bitget ${intent.symbol} stock perp: price, funding, depth`, () => perpSnapshot(intent.symbol), (p) =>
      p ? `${p.symbol} ${p.lastPrice} | funding ${p.fundingRate != null ? (p.fundingRate * 100).toFixed(4) + "%" : "n/a"}` : "No Bitget perp listed for this ticker",
    ),
    optional(emit, "mcp", "Bitget market data MCP: earnings, analysts, insiders, sentiment", () => bitgetData(intent.symbol), (d) => d.sources.join(", ")),
  ]);
  if (fund) emit({ type: "fundamentals", data: fund });
  const earnings = earningsRisk(hist.bars, fund?.earnings ?? null, intent);

  const entry = perp?.lastPrice ?? hist.lastPrice;
  emit({
    type: "market",
    price: entry,
    source: perp ? `Bitget ${perp.symbol}` : "Yahoo Finance (Bitget unreachable)",
    perp,
    series: hist.bars.slice(-180).map((b) => ({ t: b.t, c: b.c })),
  });

  const analogs = await step(emit, "analogs", "Searching 5 years for similar setups", async () => runAnalogs(hist.bars, qqq.bars, btc.bars, intent), (a) => `${a.sampleSize} analogs, win rate ${(a.winRate * 100).toFixed(0)}%`);
  emit({ type: "analogs", result: analogs });

  const gaps = gapRisk(hist.bars, intent);
  emit({ type: "gaps", result: gaps });

  const stress = await step(emit, "stress", "Running stress scenarios", async () => runStress(intent, entry, hist.bars, qqq.bars, btc.bars, gaps, perp?.fundingRate ?? null, earnings), (s) => `${s.rows.filter((r) => r.liquidated).length} liquidations, ${s.rows.filter((r) => r.stopTriggered).length} stop-outs`);
  emit({ type: "stress", result: stress });

  const violations = checkRules(intent, input.profile, gaps, analogs.quantiles.p5, earnings);
  emit({ type: "step", id: "rules", label: "Checking your personal rules", status: "done", detail: violations.length ? `${violations.length} flagged` : "All clear" });
  emit({ type: "rules", violations });

  const evidence: Evidence[] = [];
  const add = (source: string, label: string, value: string) => evidence.push({ id: `E${evidence.length + 1}`, source, label, value });
  add(perp ? "Bitget" : "Yahoo", "Entry price", `${entry.toFixed(2)}`);
  if (perp?.fundingRate != null) add("Bitget", "Funding rate (8h)", `${(perp.fundingRate * 100).toFixed(4)}%`);
  if (perp?.spreadBps != null) add("Bitget", "Order book", `spread ${perp.spreadBps.toFixed(1)} bps, top-50 depth bid $${Math.round(perp.bidDepthUsd ?? 0).toLocaleString()} / ask $${Math.round(perp.askDepthUsd ?? 0).toLocaleString()}`);
  if (perp?.change24hPct != null) add("Bitget", "Perp 24h change", `${perp.change24hPct.toFixed(2)}%`);
  if (earnings?.nextDate)
    add("Bitget MCP", "Next earnings", `${earnings.nextDate}${earnings.nextIsEstimate ? " (estimated from report cadence, not yet announced)" : ""} - ${earnings.daysUntil}d away, ${earnings.timing}${earnings.inHorizon ? " - INSIDE your horizon" : " - outside your horizon"}`);
  if (earnings && earnings.sample >= 3)
    add("Bitget MCP + history", "Past earnings reactions", `${earnings.sample} reports: median |move| ${(earnings.absMoveP50 * 100).toFixed(1)}%, p90 ${(earnings.absMoveP90 * 100).toFixed(1)}%, worst against your side ${(earnings.worstAdverse * 100).toFixed(1)}%`);
  const a = fund?.analysts;
  if (a && a.count90d > 0)
    add("Bitget MCP", "Analysts (90d)", `${a.count90d} actions: ${a.buy} buy / ${a.hold} hold / ${a.sell} sell${a.meanTarget ? `; mean target ${a.meanTarget.toFixed(0)} (${pct(a.meanTarget / entry - 1)} vs entry), range ${a.lowTarget?.toFixed(0)}-${a.highTarget?.toFixed(0)}` : ""}`);
  const v = fund?.valuation;
  if (v?.peTtm != null) add("Bitget MCP", "Valuation", `P/E ttm ${v.peTtm.toFixed(1)}, P/S ttm ${v.psTtm?.toFixed(1) ?? "n/a"}, P/B ${v.pbMrq?.toFixed(1) ?? "n/a"}`);
  if (fund?.insiders) add("Bitget MCP", "Insider filings (90d)", fund.insiders.filings90d ? `${fund.insiders.filings90d} filings, latest ${fund.insiders.latest.map((x) => `${x.name} ${x.date}`).join("; ")}` : "none");
  const s = fund?.sentiment;
  if (s) add("Bitget MCP", "Fear & Greed", `US stocks ${s.usScore.toFixed(0)} (${s.usRating}${s.usWeekAgo != null ? `, ${s.usWeekAgo.toFixed(0)} a week ago` : ""})${s.cryptoScore != null ? `; crypto ${s.cryptoScore} (${s.cryptoRating})` : ""}`);
  add("Analogs", "Similar setups found", `${analogs.sampleSize} over ${analogs.lookbackYears}y`);
  add("Analogs", "Return on margin distribution", `p5 ${pct(analogs.quantiles.p5)}, median ${pct(analogs.quantiles.p50)}, p95 ${pct(analogs.quantiles.p95)}`);
  add("Analogs", "Win rate / expectancy", `${(analogs.winRate * 100).toFixed(0)}% / ${pct(analogs.expectancyPct)} on margin`);
  if (analogs.stopHitProb != null) add("Analogs", "Stop hit probability", `${(analogs.stopHitProb * 100).toFixed(0)}%`);
  add("Analogs", "Liquidation probability", `${(analogs.liquidationProb * 100).toFixed(0)}%`);
  add("Analogs", "Max adverse excursion", `median ${(analogs.maeQuantiles.p50 * 100).toFixed(1)}%, p80 ${(analogs.maeQuantiles.p80 * 100).toFixed(1)}%, p95 ${(analogs.maeQuantiles.p95 * 100).toFixed(1)}% of price`);
  add("Analogs", "Data-driven stop", `${analogs.suggestedStopPct}% (survives 80% of analog drawdowns)`);
  add("Gaps", "Weekend gap size", `p95 ${(gaps.weekend.p95 * 100).toFixed(1)}%, p99 ${(gaps.weekend.p99 * 100).toFixed(1)}%, worst ${(gaps.weekend.worst * 100).toFixed(1)}%`);
  add("Gaps", "Overnight gap size", `p95 ${(gaps.overnight.p95 * 100).toFixed(1)}%, p99 ${(gaps.overnight.p99 * 100).toFixed(1)}%`);
  add("Gaps", "Closed-market exposure", `${gaps.closedHoursInHorizon}h while NYSE is shut, ${gaps.weekendsInHorizon} weekend(s)`);
  if (gaps.probGapThroughStop != null) add("Gaps", "Chance a gap jumps your stop", `${(gaps.probGapThroughStop * 100).toFixed(0)}% over the horizon`);
  add("Stress", "Liquidation", `${(stress.liquidationMovePct * 100).toFixed(1)}% adverse move, price ${stress.liquidationPrice.toFixed(2)}`);
  add("Stress", "Betas", `QQQ ${stress.betaQqq.toFixed(2)}, BTC ${stress.betaBtc.toFixed(2)}`);
  for (const r of stress.rows) add("Stress", r.name, `${pct(r.underlyingMovePct)} underlying -> ${pct(r.pnlOnMarginPct, 0)} on margin ($${r.pnlUsd.toFixed(0)})${r.liquidated ? " LIQUIDATED" : r.stopTriggered ? " stopped out" : ""}`);
  add("Stress", "Funding drag", `$${stress.fundingCostUsd.toFixed(2)} over horizon${stress.fundingIsEstimate ? " (estimated at 0.01%/8h)" : ""}`);
  for (const v of violations) add("Rules", `${v.severity === "block" ? "BROKEN" : "Warning"}: ${v.rule}`, v.detail);
  emit({ type: "evidence", evidence });

  const turns: DebateTurn[] = [];
  await Promise.all(
    (["bull", "bear", "risk"] as const).map((role) =>
      optional(emit, `debate-${role}`, `${role === "risk" ? "Risk Officer" : role === "bull" ? "Bull" : "Bear"} is building a case`, async () => {
        const t = await debateTurn(role, intent, evidence, input.profile);
        turns.push(t);
        emit({ type: "debate", turn: t });
        return t;
      }, (t) => t.stance),
    ),
  );

  const verdict = await step(emit, "judge", "Judge is writing the pre-mortem", () => judge(intent, evidence, input.profile, turns), (v) => `${v.verdict.toUpperCase()} (${Math.round(v.confidence * 100)}%)`);
  const juryResult = await optional(emit, "jury", "Jury: two independent re-runs for stability", () => jury(intent, evidence, input.profile, turns, verdict), (j) => `${Math.round(j.stability * 100)}% agreement (${j.votes.join(", ")})`);
  emit({ type: "verdict", verdict, jury: juryResult ?? { votes: [verdict.verdict], stability: 1 } });
  emit({ type: "done", id: runId, ms: Date.now() - started });
}
