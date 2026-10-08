"use client";

import Link from "next/link";
import { BellRinging, Broadcast } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useWatchtowerContext } from "@/lib/client/watchtower-context";
import { armWatches, type Watch } from "@/lib/watchtower";
import { MU_INTENT, MU_QUERY, MU_VERDICT } from "@/lib/landing/mu-case";
import { cn, price, signedPct } from "@/lib/format";

const STATUS: Record<Watch["status"], string> = {
  armed: "text-accent-ink",
  tripped: "text-loss",
  dismissed: "text-ink-tertiary",
  expired: "text-ink-tertiary",
};

export function Watchtower() {
  const { watches, telegram, checking, tick, dismiss, arm } = useWatchtowerContext();
  const groups = group(watches);

  const armMicron = () => {
    arm(
      armWatches({
        journalId: "mu-demo",
        query: MU_QUERY,
        intent: MU_INTENT,
        entryPrice: 1091.67,
        verdict: MU_VERDICT,
      }),
    );
  };

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline font-medium">Watchtower</h1>
          <p className="mt-1 max-w-[62ch] text-body-sm text-ink-subtle">
            When you take a trade, Watchtower keeps the Judge&apos;s three tripwires on Bitget. It polls while Redline is open.
            {telegram ? " Telegram is connected." : " Telegram alerts are off until you add a bot chat in .env.local."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {checking && <span className="text-caption text-ink-tertiary">Checking Bitget</span>}
          <Button size="sm" variant="secondary" onClick={() => void tick()} disabled={checking}>
            Check now
          </Button>
        </div>
      </div>

      {watches.length === 0 ? (
        <div className="panel mt-8 flex flex-col items-center px-6 py-16 text-center">
          <Broadcast size={20} className="text-ink-tertiary" />
          <p className="mt-3 text-body-sm text-ink">No tripwires armed</p>
          <p className="mt-1 max-w-sm text-caption text-ink-subtle">
            Redline a trade, then log it as taken. Or arm the Micron run we already judged.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild variant="primary" size="md">
              <Link href="/desk">Open the desk</Link>
            </Button>
            <Button variant="secondary" size="md" onClick={armMicron}>
              Arm the Micron run
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {groups.map((g) => (
            <section key={g.journalId} className="panel overflow-hidden">
              <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-hairline px-5 py-3">
                <div>
                  <p className="text-body-sm font-medium text-ink">
                    {g.side === "long" ? "Long" : "Short"} {g.symbol} {g.leverage}x
                  </p>
                  <p className="text-caption text-ink-subtle">{g.query}</p>
                </div>
                <p className="num text-caption text-ink-subtle">
                  Entry {price(g.entryPrice)}
                  {g.lastPrice != null && (
                    <>
                      {" "}
                      · last {price(g.lastPrice)}{" "}
                      <span className={g.lastPrice >= g.entryPrice ? "text-gain" : "text-loss"}>
                        {signedPct(g.lastPrice / g.entryPrice - 1)}
                      </span>
                    </>
                  )}
                </p>
              </header>
              <ul>
                {g.items.map((w) => (
                  <li key={w.id} className="flex flex-wrap items-start gap-4 border-t border-hairline px-5 py-3 first:border-t-0">
                    <BellRinging size={16} className={cn("mt-0.5 shrink-0", STATUS[w.status])} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <p className="text-body-sm font-medium text-ink">{w.deathTitle}</p>
                        <span className={cn("text-caption capitalize", STATUS[w.status])}>{w.status}</span>
                      </div>
                      <p className="mt-1 text-caption text-ink-subtle">{w.tripwire.description}</p>
                      {w.reason && <p className="num mt-1 text-caption text-loss">{w.reason}</p>}
                    </div>
                    <div className="text-right">
                      {w.lastReading != null && (
                        <p className="num text-caption text-ink-muted">{formatReading(w)}</p>
                      )}
                      {w.status === "armed" || w.status === "tripped" ? (
                        <Button size="sm" variant="tertiary" className="mt-1" onClick={() => dismiss(w.id)}>
                          Dismiss
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function formatReading(w: Watch): string {
  const v = w.lastReading;
  if (v == null) return "";
  if (w.tripwire.metric === "news_keyword") return typeof v === "number" ? `${v}d` : String(v);
  if (w.tripwire.metric === "gap_pct" && v === 0) return "NYSE open";
  if (typeof v === "number") return `${v.toFixed(2)}%`;
  return String(v);
}

function group(watches: Watch[]) {
  const map = new Map<string, Watch[]>();
  for (const w of watches) {
    const list = map.get(w.journalId) ?? [];
    list.push(w);
    map.set(w.journalId, list);
  }
  return [...map.entries()].map(([journalId, items]) => ({
    journalId,
    symbol: items[0].symbol,
    side: items[0].side,
    leverage: items[0].leverage,
    entryPrice: items[0].entryPrice,
    lastPrice: items[0].lastPrice,
    query: items[0].query,
    items,
  }));
}
