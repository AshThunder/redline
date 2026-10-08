# Redline

Redline your trade before the market does.

Type a Bitget stock-perp idea in plain English. Redline gathers the market, replays similar setups from the last five years, stress-tests the ticket, and a Judge writes the pre-mortem: **Kill**, **Resize**, or **Proceed**, plus three ways the trade dies. The human places the order.

Live desk: [redlinebh.vercel.app](https://redlinebh.vercel.app)

Example:

```text
Long MU 5x for 8 days, $2000 margin, stop 7%, memory prices are turning up
```

## How a run works

One sentence becomes a structured ticket: ticker, side, notional, leverage, stop, horizon, and the thesis. From there the desk does this, in order, and streams each step as it finishes.

1. **Market.** Five years of daily prices for the ticker, QQQ, and BTC. The Bitget stock perp supplies last price, funding, and top-of-book depth. Bitget market data adds the earnings calendar, analyst targets, insider filings, valuation, and Fear & Greed.
2. **Analogues.** The engine searches that five-year history for setups that looked like this one and replays them over the same horizon. You get the return distribution, win rate, expectancy, how often the stop was hit, how often the position would have liquidated, and a stop wide enough to survive 80% of those drawdowns.
3. **Gaps.** Weekend and overnight gaps are measured separately, because the NYSE can be shut while the Bitget perp keeps trading. A gap can fill past the stop.
4. **Stress.** The ticket is run through a fixed book of shocks: a Nasdaq −3% day, a hot CPI print, the ticker’s own 1-in-100 adverse day, a 99th-percentile weekend gap, a BTC −12% flush, an 8% squeeze, and the next earnings reaction when one is on the calendar. Each row shows the underlying move, P&L on margin, and whether the stop or the liquidation hits first. Funding over the horizon is included.
5. **Rules.** The ticket is checked against the account rules on this browser. The defaults are a $5,000 account, 10x max, 3x max into an event, 2% max risk per trade, and 5x max over a weekend. You can change them on `/rules`.
6. **Debate.** Bull, Bear, and a Risk Officer each write a case from that evidence. The Judge then writes Kill, Resize, or Proceed: a headline, a confidence, three death modes with a probability and a tripwire, and a resized ticket (leverage, notional, stop). Two more Judge calls check whether that word still holds. The card shows how many of the three agree.

Prices, analogue search, stress math, liquidation distance, and the account-risk check are deterministic. The language step is an OpenAI-compatible chat model. It parses the sentence, writes the three cases, writes the Judge, and runs the two re-checks. It does not invent the prices.

## What you can open

| Route | What it is |
| --- | --- |
| `/` | Landing page, and the published Micron verdict |
| `/desk` | The run above. The command palette (`⌘K`) also starts a trade |
| `/watchtower` | Tripwires from a verdict you chose to watch. While the desk is open it polls Bitget and can text you |
| `/portfolio` | A book of positions: gross and net, QQQ and BTC beta, sector weights, pairwise correlation, the nearest liquidation, three book shocks, and hedge lines |
| `/ledger` | An append-only SHA-256 chain. Each verdict links to the previous hash. When the horizon ends, the later price is scored against the call |
| `/journal` | Decisions you logged in this browser, with a link back to the desk and to the share card |
| `/rules` | The account rules the stress test enforces |
| `/s/[token]` | A public card for one verdict. No account required |

On a verdict, **Skip trade** logs a pass and **Take and watch** arms the tripwires. **Share** copies the card link. On a phone it uses the system share sheet. **Post** opens an X draft with the verdict and the link. Replay on the card fills the original sentence back into the desk.

A card encodes the ticket and the verdict in the URL, so it can be opened without a database. The preview image is a 1200×630 PNG of the same card.

The ledger’s first row is the Micron case from 23 Sep 2026, entry 1091.67. A Kill should have lost, a Proceed should have made money, and a Resize should have lost less than the original ticket. The same check is on the desk, the share card, and the agent tools.

## Run it

Requires Node.js and [pnpm](https://pnpm.io) 10.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

`pnpm typecheck` and `pnpm lint` check the project. `pnpm build` then `pnpm start` runs the production server.

### Environment

Copy `.env.example` to `.env.local`. The key is required. The rest have defaults.

| Variable | Role |
| --- | --- |
| `LLM_API_KEY` | Key for the chat model |
| `LLM_BASE_URL` | OpenAI-compatible base URL. The example uses the Bitget hackathon gateway |
| `LLM_MODEL` | Chat model name. The example is `qwen3.8-max` |
| `BITGET_REST_BASE` | Bitget REST host, default `https://api.bitget.com` |
| `BITGET_MCP_URL` | Bitget market-data MCP, default `https://agent.bitget.com/mcp` |
| `HTTPS_PROXY` | Optional proxy when Bitget is not reachable directly |
| `BITGET_PIN_IPS` | Optional Cloudflare edge IPs when your DNS blocks `*.bitget.com` |
| `TELEGRAM_BOT_TOKEN` | Optional. Watchtower texts this bot when a tripwire fires |
| `TELEGRAM_CHAT_ID` | Chat that receives those texts |
| `LEDGER_GITHUB_TOKEN` | Optional token used to mirror the ledger |
| `LEDGER_GITHUB_REPO` | `owner/name` of the public repo that mirror is pushed to |

## Agents

The same engine is available as two tools, `redline_trade` and `redline_book`. Neither places, modifies, or cancels an order.

From the repo root, with the same `.env.local` as the desk:

```bash
pnpm redline-mcp
```

Point an MCP client at that stdio process. Set `cwd` to this repository:

```json
{
  "mcpServers": {
    "redline": {
      "command": "pnpm",
      "args": ["--silent", "redline-mcp"],
      "cwd": "/absolute/path/to/redline"
    }
  }
}
```

`redline_trade` takes one sentence, the same shape as the desk composer. `redline_book` takes up to twelve lines, each with `symbol`, `side`, `notionalUsd`, and `leverage`.

A deployed desk serves those tools over HTTP at `POST /api/mcp`. Instructions for an agent that should call them are in [skills/redline/SKILL.md](skills/redline/SKILL.md).

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Bitget REST, Bitget MCP, and a chat model. Verdict cards are rendered with `next/og`. The local ledger is a JSONL hash chain under `ledger/`.
