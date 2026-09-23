import type { AnalogResult, Bar, GapRisk, TradeIntent } from "@/lib/types";
import { dayKey, mean, quantile, rsi, sortNum, std, tradingDays } from "@/lib/quant";

/** Maintenance margin rate assumed for liquidation math on Bitget USDT perps. */
export const MMR = 0.005;

export function liquidationMove(leverage: number): number {
  return Math.max(0.001, 1 / leverage - MMR);
}

type Features = number[];

function closeOnOrBefore(bars: Bar[], index: Map<string, number>, t: number): number | null {
  for (let back = 0; back < 5; back++) {
    const i = index.get(dayKey(t - back * 86_400_000));
    if (i != null) return bars[i].c;
  }
  return null;
}

function featureAt(bars: Bar[], i: number, ctx: { qqq: Bar[]; qqqIdx: Map<string, number>; btc: Bar[]; btcIdx: Map<string, number> }): Features | null {
  if (i < 252) return null;
  const c = bars.map((b) => b.c);
  const logR: number[] = [];
  for (let k = i - 19; k <= i; k++) logR.push(Math.log(c[k] / c[k - 1]));
  const hi52 = Math.max(...c.slice(i - 251, i + 1));
  const t = bars[i].t;
  const q0 = closeOnOrBefore(ctx.qqq, ctx.qqqIdx, t);
  const q20 = closeOnOrBefore(ctx.qqq, ctx.qqqIdx, t - 28 * 86_400_000);
  const b0 = closeOnOrBefore(ctx.btc, ctx.btcIdx, t);
  const b20 = closeOnOrBefore(ctx.btc, ctx.btcIdx, t - 28 * 86_400_000);
  return [
    c[i] / c[i - 5] - 1,
    c[i] / c[i - 20] - 1,
    c[i] / c[i - 60] - 1,
    std(logR) * Math.sqrt(252),
    rsi(c, i) / 100,
    c[i] / hi52 - 1,
    q0 && q20 ? q0 / q20 - 1 : 0,
    b0 && b20 ? b0 / b20 - 1 : 0,
  ];
}

const WEIGHTS = [1.0, 1.2, 0.8, 1.4, 0.9, 1.0, 0.8, 0.5];

export const FEATURE_LABELS = ["5d return", "20d return", "60d return", "20d realised vol", "RSI(14)", "Distance from 52w high", "Nasdaq 20d return", "BTC 20d return"];

export function currentFeatures(bars: Bar[], qqq: Bar[], btc: Bar[]) {
  const ctx = { qqq, qqqIdx: indexByDay(qqq), btc, btcIdx: indexByDay(btc) };
  return featureAt(bars, bars.length - 1, ctx);
}

function indexByDay(bars: Bar[]): Map<string, number> {
  return new Map(bars.map((b, i) => [dayKey(b.t), i]));
}

type Outcome = { marginRet: number; underlyingRet: number; mae: number; stopped: boolean; liquidated: boolean; path: number[] };

function simulate(bars: Bar[], i: number, H: number, intent: TradeIntent): Outcome {
  const dir = intent.side === "long" ? 1 : -1;
  const entry = bars[i].c;
  const stop = intent.stopPct != null ? intent.stopPct / 100 : null;
  const liq = liquidationMove(intent.leverage);
  let mae = 0;
  const path: number[] = [0];
  for (let j = i + 1; j <= i + H; j++) {
    const b = bars[j];
    const openMove = dir * (b.o / entry - 1);
    const worst = dir === 1 ? b.l / entry - 1 : -(b.h / entry - 1);
    mae = Math.min(mae, worst);
    if (-worst >= liq) {
      path.push(-1);
      return { marginRet: -1, underlyingRet: -liq, mae: -mae, stopped: false, liquidated: true, path };
    }
    if (stop != null && -worst >= stop) {
      const fill = openMove <= -stop ? openMove : -stop;
      const r = Math.max(-1, fill * intent.leverage);
      path.push(r);
      return { marginRet: r, underlyingRet: fill, mae: -mae, stopped: true, liquidated: false, path };
    }
    path.push(Math.max(-1, dir * (b.c / entry - 1) * intent.leverage));
  }
  const u = dir * (bars[i + H].c / entry - 1);
  return { marginRet: Math.max(-1, u * intent.leverage), underlyingRet: u, mae: -mae, stopped: false, liquidated: false, path };
}

export function runAnalogs(bars: Bar[], qqq: Bar[], btc: Bar[], intent: TradeIntent, k = 60): AnalogResult {
  const H = tradingDays(intent.horizonDays);
  const ctx = { qqq, qqqIdx: indexByDay(qqq), btc, btcIdx: indexByDay(btc) };
  const now = featureAt(bars, bars.length - 1, ctx);
  if (!now) throw new Error("Not enough price history for analog search (need 1 year+)");

  const cands: { i: number; f: Features }[] = [];
  for (let i = 252; i + H < bars.length - 1; i++) {
    const f = featureAt(bars, i, ctx);
    if (f) cands.push({ i, f });
  }
  const dims = now.length;
  const mu = Array.from({ length: dims }, (_, d) => mean(cands.map((c) => c.f[d])));
  const sd = Array.from({ length: dims }, (_, d) => std(cands.map((c) => c.f[d])) || 1);
  const z = (f: Features) => f.map((x, d) => (x - mu[d]) / sd[d]);
  const zNow = z(now);

  const scored = cands
    .map((c) => {
      const zc = z(c.f);
      const dist = Math.sqrt(zc.reduce((s, x, d) => s + WEIGHTS[d] * (x - zNow[d]) ** 2, 0));
      return { ...c, dist };
    })
    .sort((a, b) => a.dist - b.dist);

  // Avoid overlapping windows so one episode can't dominate the sample.
  const picked: typeof scored = [];
  for (const s of scored) {
    if (picked.length >= k) break;
    if (picked.every((p) => Math.abs(p.i - s.i) > Math.max(3, Math.floor(H / 2)))) picked.push(s);
  }

  const outcomes = picked.map((p) => ({ p, o: simulate(bars, p.i, H, intent) }));
  const rets = sortNum(outcomes.map((x) => x.o.marginRet));
  const maes = sortNum(outcomes.map((x) => x.o.mae));
  const liq = liquidationMove(intent.leverage);
  const suggested = Math.min(Math.max(quantile(maes, 0.8), 0.01), liq * 0.8);
  const maxDist = picked[picked.length - 1]?.dist || 1;

  return {
    sampleSize: outcomes.length,
    horizonDays: intent.horizonDays,
    lookbackYears: Math.round(((bars[bars.length - 1].t - bars[0].t) / (365 * 86_400_000)) * 10) / 10,
    quantiles: { p5: quantile(rets, 0.05), p25: quantile(rets, 0.25), p50: quantile(rets, 0.5), p75: quantile(rets, 0.75), p95: quantile(rets, 0.95) },
    winRate: outcomes.filter((x) => x.o.marginRet > 0).length / outcomes.length,
    expectancyPct: mean(outcomes.map((x) => x.o.marginRet)),
    stopHitProb: intent.stopPct != null ? outcomes.filter((x) => x.o.stopped).length / outcomes.length : null,
    liquidationProb: outcomes.filter((x) => x.o.liquidated).length / outcomes.length,
    maeQuantiles: { p50: quantile(maes, 0.5), p80: quantile(maes, 0.8), p95: quantile(maes, 0.95) },
    suggestedStopPct: Math.round(suggested * 1000) / 10,
    paths: outcomes.slice(0, 40).map((x) => x.o.path),
    finals: rets,
    topAnalogs: outcomes.slice(0, 6).map((x) => ({
      date: dayKey(bars[x.p.i].t),
      similarity: Math.max(0, 1 - x.p.dist / (maxDist * 1.25)),
      returnPct: x.o.marginRet,
      maePct: x.o.mae,
    })),
  };
}

export function gapRisk(bars: Bar[], intent: TradeIntent): GapRisk {
  const dir = intent.side === "long" ? 1 : -1;
  const overnight: number[] = [];
  const weekend: number[] = [];
  const adverse: number[] = [];
  for (let i = Math.max(1, bars.length - 756); i < bars.length; i++) {
    const g = bars[i].o / bars[i - 1].c - 1;
    const isWeekend = bars[i].t - bars[i - 1].t > 2.5 * 86_400_000;
    (isWeekend ? weekend : overnight).push(Math.abs(g));
    adverse.push(-dir * g);
  }
  const s = (xs: number[]) => {
    const srt = sortNum(xs);
    return { p50: quantile(srt, 0.5), p95: quantile(srt, 0.95), p99: quantile(srt, 0.99), worst: srt[srt.length - 1] ?? 0 };
  };
  const H = tradingDays(intent.horizonDays);
  const weekends = Math.max(0, Math.floor((intent.horizonDays + new Date().getUTCDay()) / 7));
  let probThrough: number | null = null;
  if (intent.stopPct != null) {
    const stop = intent.stopPct / 100;
    const pWindow = adverse.filter((g) => g >= stop).length / adverse.length;
    probThrough = 1 - (1 - pWindow) ** H;
  }
  return {
    overnight: s(overnight),
    weekend: s(weekend),
    probGapThroughStop: probThrough,
    closedHoursInHorizon: Math.round((H - weekends) * 17.5 + weekends * 65.5),
    weekendsInHorizon: weekends,
  };
}
