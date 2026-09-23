import type { Bar, GapRisk, RuleProfile, RuleViolation, StressResult, StressRow, TradeIntent } from "@/lib/types";
import { liquidationMove } from "@/lib/analogs";
import { beta, quantile, returnsByDay, sortNum } from "@/lib/quant";

/** Default funding assumption when Bitget is unreachable: 0.01% per 8h, the common baseline rate. */
const DEFAULT_FUNDING = 0.0001;

export function runStress(
  intent: TradeIntent,
  entryPrice: number,
  bars: Bar[],
  qqq: Bar[],
  btc: Bar[],
  gaps: GapRisk,
  fundingRate: number | null,
): StressResult {
  const dir = intent.side === "long" ? 1 : -1;
  const own = returnsByDay(bars);
  const bQqq = beta(own, returnsByDay(qqq));
  const bBtc = beta(own, returnsByDay(btc));
  const dailyRets = sortNum([...own.values()].slice(-1260));
  const worstDay1pct = quantile(dailyRets, 0.01);
  const bestDay1pct = quantile(dailyRets, 0.99);
  const margin = intent.notionalUsd / intent.leverage;
  const liq = liquidationMove(intent.leverage);
  const stop = intent.stopPct != null ? intent.stopPct / 100 : null;

  const scenarios: { id: string; name: string; description: string; move: number; gap?: boolean }[] = [
    { id: "nasdaq", name: "Nasdaq -3% day", description: `Beta ${bQqq.toFixed(2)} to QQQ applied to a -3% index day`, move: bQqq * -0.03 },
    { id: "cpi", name: "Hot CPI print", description: "Typical hot-CPI tape: QQQ -2.2%, applied through beta", move: bQqq * -0.022 },
    { id: "tail", name: "1-in-100 day (adverse)", description: "This ticker's own 1st-percentile daily move over 5 years, in the direction that hurts you", move: dir === 1 ? worstDay1pct : bestDay1pct },
    { id: "weekend", name: "Weekend gap (p99)", description: "99th-percentile weekend gap, adverse to your side. Your stop fills at the gapped price, not at the stop.", move: -dir * gaps.weekend.p99, gap: true },
    { id: "btc", name: "BTC -12% flush", description: `Beta ${bBtc.toFixed(2)} to BTC applied to a -12% crypto liquidation cascade`, move: bBtc * -0.12 },
    { id: "rally", name: "Squeeze +8%", description: "Sharp move against a short or in favour of a long", move: 0.08 },
  ];

  const rows: StressRow[] = scenarios.map((s) => {
    const pos = dir * s.move;
    const liquidated = -pos >= liq;
    const stopTriggered = !liquidated && stop != null && -pos >= stop;
    const realised = liquidated ? -liq : stopTriggered && !s.gap ? -stop! : pos;
    const pnlOnMargin = liquidated ? -1 : Math.max(-1, realised * intent.leverage);
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      underlyingMovePct: s.move,
      pnlUsd: pnlOnMargin * margin,
      pnlOnMarginPct: pnlOnMargin,
      liquidated,
      stopTriggered,
    };
  });

  const rate = fundingRate ?? DEFAULT_FUNDING;
  const fundingCost = intent.notionalUsd * rate * 3 * intent.horizonDays * (dir === 1 ? 1 : -1);

  return {
    betaQqq: bQqq,
    betaBtc: bBtc,
    marginUsd: margin,
    liquidationMovePct: liq,
    liquidationPrice: entryPrice * (1 - dir * liq),
    entryPrice,
    fundingCostUsd: fundingCost,
    fundingRate,
    fundingIsEstimate: fundingRate == null,
    rows,
  };
}

export function checkRules(intent: TradeIntent, profile: RuleProfile, gaps: GapRisk, analogWorstPct: number): RuleViolation[] {
  const out: RuleViolation[] = [];
  const margin = intent.notionalUsd / intent.leverage;
  if (intent.leverage > profile.maxLeverage)
    out.push({ rule: `Max leverage ${profile.maxLeverage}x`, detail: `Trade uses ${intent.leverage}x`, severity: "block" });
  if (intent.catalyst && intent.leverage > profile.maxLeverageIntoEvent)
    out.push({ rule: `Max ${profile.maxLeverageIntoEvent}x into events`, detail: `Holding ${intent.leverage}x through "${intent.catalyst}"`, severity: "block" });
  if (gaps.weekendsInHorizon > 0 && intent.leverage > profile.maxWeekendLeverage)
    out.push({ rule: `Max ${profile.maxWeekendLeverage}x over weekends`, detail: `Horizon spans ${gaps.weekendsInHorizon} weekend(s) at ${intent.leverage}x`, severity: "warn" });
  const riskUsd = intent.stopPct != null ? intent.notionalUsd * (intent.stopPct / 100) : margin * Math.min(1, -analogWorstPct);
  const riskPct = (riskUsd / profile.accountUsd) * 100;
  if (riskPct > profile.maxRiskPerTradePct)
    out.push({
      rule: `Max ${profile.maxRiskPerTradePct}% account risk per trade`,
      detail: `${intent.stopPct != null ? "Stop-out" : "Bad-case (p5)"} loss is $${riskUsd.toFixed(0)}, ${riskPct.toFixed(1)}% of a $${profile.accountUsd.toLocaleString()} account`,
      severity: riskPct > profile.maxRiskPerTradePct * 2 ? "block" : "warn",
    });
  if (intent.stopPct == null) out.push({ rule: "Every leveraged trade has a stop", detail: "No stop specified", severity: "warn" });
  if (margin > profile.accountUsd) out.push({ rule: "Margin within account size", detail: `Needs $${margin.toFixed(0)} margin`, severity: "block" });
  return out;
}
