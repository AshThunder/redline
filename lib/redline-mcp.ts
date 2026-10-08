import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runPortfolio } from "@/lib/portfolio-run";
import { redlineTrade } from "@/lib/redline-tool";

const BookLineSchema = z.object({
  symbol: z.string().min(1),
  side: z.enum(["long", "short"]),
  notionalUsd: z.number().positive(),
  leverage: z.number().min(1).max(125),
});

export function createRedlineMcp() {
  const server = new McpServer({ name: "redline", version: "0.1.0" });

  server.registerTool(
    "redline_trade",
    {
      title: "Redline a trade",
      description:
        "Stress-test one plain-English trade before it is placed. Returns Kill, Resize, or Proceed, three ways the trade dies, and a resized ticket. Does not place an order.",
      inputSchema: {
        trade: z.string().min(3).describe("Example: Long MU 5x for 8 days, $2000 margin, stop 7%, memory prices are turning up"),
      },
    },
    async ({ trade }) => {
      const card = await redlineTrade(trade);
      return { content: [{ type: "text" as const, text: JSON.stringify(card, null, 2) }] };
    },
  );

  server.registerTool(
    "redline_book",
    {
      title: "Redline a book",
      description:
        "Stress-test a whole book of stock-perp positions: QQQ and BTC beta, sector concentration, pairwise correlation, a liquidation map, and hedges. Does not place an order.",
      inputSchema: {
        book: z.array(BookLineSchema).min(1).max(12),
      },
    },
    async ({ book }) => {
      const report = await runPortfolio(book, "custom");
      return { content: [{ type: "text" as const, text: JSON.stringify(report, null, 2) }] };
    },
  );

  return server;
}
