import { installNetworkOverrides } from "../lib/pin";
import { callTool } from "../lib/tools/mcp";

const sym = process.argv[2] ?? "NVDA";
const now = Math.floor(Date.now() / 1000);

const queries: [string, Record<string, unknown>][] = [
  ["equity_price_quote", { symbol: sym }],
  ["equity_calendar", { symbol: sym }],
  ["equity_estimates_price_target", { symbol: sym, limit: 5 }],
  ["equity_estimates_consensus", { symbol: sym }],
  ["equity_ownership_insider_trading", { symbol: sym, limit: 5 }],
  ["equity_fundamental_ratios", { symbol: sym, limit: 1 }],
  ["sentiment_market_fear_greed", {}],
  ["crypto_sentiment_crypto_fear_greed", { limit: 1 }],
  ["equity_price_historical", { symbol: sym, start_time: now - 86400 * 10, end_time: now }],
];

async function main() {
  await installNetworkOverrides();
  for (const [id, params] of queries) {
    const t0 = Date.now();
    const out = await callTool("do_query", { entry_id: id, params }, 30_000).catch((e) => `ERR ${e.message}`);
    console.log(`\n=== ${id} (${Date.now() - t0}ms, ${out.length} chars)\n${out.slice(0, 700)}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
