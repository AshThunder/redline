# Redline

Redline your trade before the market does.

Type a Bitget stock-perp idea in plain English. Redline pulls the live market, replays historical analogues, stress-tests the ticket, and a Judge writes the pre-mortem: **Kill**, **Resize**, or **Proceed**, plus three ways the trade dies. The human places the order.

Live desk: [redlinebh.vercel.app](https://redlinebh.vercel.app)

## What you can open

| Route | What it is |
| --- | --- |
| `/` | Landing page and a published Micron verdict |
| `/desk` | One trade: analogues, shocks, Bull / Bear / Risk, then the Judge |
| `/watchtower` | Tripwires on a verdict you chose to watch |
| `/portfolio` | Shocks across a book of positions |
| `/ledger` | Append-only hash chain of verdicts |
| `/journal` | Decisions you logged on this browser |
| `/rules` | Account rules the stress test enforces |
| `/s/[token]` | A public share card for one verdict |

Share and Post sit on the verdict. Post opens an X draft. A journal entry links to its card.

## Run it

Requires [pnpm](https://pnpm.io).

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Put an API key in `LLM_API_KEY`. The language step is any OpenAI-compatible chat model. `.env.example` points `LLM_BASE_URL` and `LLM_MODEL` at the Bitget hackathon gateway. Prices, analogue search, stress math, and the account-risk check stay outside the model.

Optional: `HTTPS_PROXY` and `BITGET_PIN_IPS` if your network cannot reach Bitget, `TELEGRAM_BOT_TOKEN` for Watchtower texts, and `LEDGER_GITHUB_REPO` to mirror the ledger.

## Agents

From the repo root:

```bash
pnpm redline-mcp
```

That stdio server exposes `redline_trade` (one sentence) and `redline_book` (a list of positions). A deployed desk serves the same tools at `POST /api/mcp`. See [skills/redline/SKILL.md](skills/redline/SKILL.md).

## Stack

Next.js, Bitget REST, Bitget MCP, and an OpenAI-compatible chat model.
