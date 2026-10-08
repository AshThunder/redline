import { evaluate, nyseOpen, type MarketReading, type Watch } from "@/lib/watchtower";
import { perpSnapshot } from "@/lib/tools/bitget";
import { earnings } from "@/lib/tools/bitget-data";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = { watches?: Watch[] };

async function telegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
  });
  return res.ok;
}

export async function GET() {
  return Response.json({ telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const incoming = Array.isArray(body.watches) ? body.watches : [];
  const live = incoming.filter((w) => w.status === "armed");
  if (live.length === 0) {
    return Response.json({ watches: incoming, telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) });
  }

  const symbols = [...new Set(live.map((w) => w.symbol))];
  const markets = new Map<string, MarketReading>();
  await Promise.all(
    symbols.map(async (symbol) => {
      const [perp, cal] = await Promise.all([
        perpSnapshot(symbol).catch(() => null),
        earnings(symbol).catch(() => null),
      ]);
      if (!perp) return;
      markets.set(symbol, {
        lastPrice: perp.lastPrice,
        fundingRate: perp.fundingRate,
        nyseOpen: nyseOpen(),
        daysUntilEarnings: cal?.daysUntil ?? null,
      });
    }),
  );

  const now = Date.now();
  const out: Watch[] = [];
  const alerts: Watch[] = [];
  for (const w of incoming) {
    const m = markets.get(w.symbol);
    if (!m) {
      out.push({ ...w, lastCheckedAt: now });
      continue;
    }
    const next = evaluate(w, m, now);
    if (w.status === "armed" && next.status === "tripped" && !w.telegramSent) {
      const ok = await telegram(
        [
          `Watchtower: ${next.symbol} / ${next.deathTitle}`,
          `Price ${m.lastPrice} from entry ${next.entryPrice}`,
          next.reason ?? next.tripwire.description,
          "You decide. Redline does not place an order.",
        ].join("\n"),
      );
      next.telegramSent = ok;
      alerts.push(next);
    }
    out.push(next);
  }

  return Response.json({
    watches: out,
    alerts: alerts.map((w) => w.id),
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  });
}
