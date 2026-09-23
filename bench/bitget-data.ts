import { installNetworkOverrides } from "../lib/pin";
import { bitgetData } from "../lib/tools/bitget-data";
import { dailyHistory } from "../lib/tools/yahoo";
import { earningsRisk } from "../lib/stress";

const symbol = process.argv[2] ?? "NVDA";

async function main() {
  console.log("network:", await installNetworkOverrides());
  const t0 = Date.now();
  const [d, h] = await Promise.all([bitgetData(symbol), dailyHistory(symbol)]);
  console.log(`bitgetData ${Date.now() - t0}ms, sources: ${d.sources.join(", ")}`);
  console.log(JSON.stringify({ ...d, earnings: d.earnings && { ...d.earnings, past: d.earnings.past.slice(-8) } }, null, 2));
  const e = earningsRisk(h.bars, d.earnings, { symbol, side: "long", notionalUsd: 5000, leverage: 5, stopPct: 8, takeProfitPct: null, horizonDays: 7, catalyst: null, thesis: "" });
  console.log("earningsRisk:", JSON.stringify(e, null, 2));
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
