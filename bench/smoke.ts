import { gapRisk, runAnalogs } from "../lib/analogs";
import { checkRules, runStress } from "../lib/stress";
import { dailyHistory } from "../lib/tools/yahoo";
import { DEFAULT_PROFILE, type TradeIntent } from "../lib/types";

const intent: TradeIntent = {
  symbol: process.argv[2] ?? "NVDA",
  side: (process.argv[3] as "long" | "short") ?? "long",
  notionalUsd: 10_000,
  leverage: Number(process.argv[4] ?? 5),
  stopPct: 8,
  takeProfitPct: null,
  horizonDays: 7,
  catalyst: "earnings",
  thesis: "smoke test",
};

async function main() {
  const t0 = Date.now();
  const [h, q, b] = await Promise.all([dailyHistory(intent.symbol), dailyHistory("QQQ"), dailyHistory("BTC-USD")]);
  console.log(`history loaded in ${Date.now() - t0}ms: ${h.bars.length} bars, last ${h.lastPrice}`);
  const t1 = Date.now();
  const a = runAnalogs(h.bars, q.bars, b.bars, intent);
  console.log(`analogs in ${Date.now() - t1}ms`);
  const { paths, ...rest } = a;
  console.log(JSON.stringify(rest, null, 2), `paths=${paths.length}`);
  const g = gapRisk(h.bars, intent);
  console.log(JSON.stringify(g, null, 2));
  const s = runStress(intent, h.lastPrice, h.bars, q.bars, b.bars, g, null);
  console.log(JSON.stringify(s, null, 2));
  console.log(checkRules(intent, DEFAULT_PROFILE, g, a.quantiles.p5));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
