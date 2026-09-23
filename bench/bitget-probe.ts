import { installNetworkOverrides } from "../lib/pin";
import { perpSnapshot, contracts } from "../lib/tools/bitget";
import { listTools } from "../lib/tools/mcp";

async function main() {
  console.log("network mode:", await installNetworkOverrides());
  const all = await contracts();
  const rwa = all.filter((c) => c.isRwa === "YES");
  console.log(`contracts: ${all.length}, RWA/stock perps: ${rwa.length}`);
  console.log(rwa.slice(0, 40).map((c) => c.symbol).join(" "));
  for (const t of ["NVDA", "TSLA", "COIN", "MSTR", "AAPL"]) console.log(t, await perpSnapshot(t).catch((e) => `ERR ${e.message}`));
  const tools = await listTools();
  console.log(`MCP tools: ${tools.length}`);
  for (const t of tools) console.log(`- ${t.name}: ${(t.description ?? "").slice(0, 90)} | args: ${Object.keys(t.inputSchema?.properties ?? {}).join(",")}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
