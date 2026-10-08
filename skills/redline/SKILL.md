---
name: redline
description: Stress-test a trade or a book of Bitget stock perps before an order is placed. Use when the user asks to redline, pre-mortem, stress-test, size, kill, resize, or check concentration on a long or short.
---

# Redline

Redline writes the pre-mortem. The human places the order.

## Tools

Use the `redline` MCP server.

- `redline_trade` for one idea, in plain English. Example: `Long MU 5x for 8 days, $2000 margin, stop 7%, memory prices are turning up`.
- `redline_book` for several open positions. Pass symbol, side, notionalUsd, and leverage for each line.

If the MCP server is not connected, start it from this repo:

```json
{
  "mcpServers": {
    "redline": {
      "command": "pnpm",
      "args": ["--silent", "redline-mcp"],
      "cwd": "/home/michael/bitget2"
    }
  }
}
```

A deployed desk also serves the same tools at `POST /api/mcp`.

## How to answer

Report the verdict word first: Kill, Resize, or Proceed. Then the headline, the three death modes, and the suggested leverage and notional. For a book, report gross exposure, QQQ beta, the nearest liquidation, and the hedge lines.

Do not place, modify, or cancel an order. Redline never does. If the user wants the trade after a Resize, repeat the resized ticket and leave the click to them.
