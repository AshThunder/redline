"use client";

import Link from "next/link";
import { BookOpen } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useJournal } from "@/lib/client/storage";
import { cn, price, usd } from "@/lib/format";
import { encodeShare, sharePath } from "@/lib/share";

const VERDICT = { kill: "text-loss", resize: "text-caution", proceed: "text-gain" } as const;

export function Journal() {
  const [entries] = useJournal();

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8">
      <h1 className="text-headline font-medium">Journal</h1>
      <p className="mt-1 text-body-sm text-ink-subtle">
        Every redlined trade and what you decided. The public hash of each verdict is on the{" "}
        <Link href="/ledger" className="text-accent-ink hover:underline">
          ledger
        </Link>
        .
      </p>

      {entries.length === 0 ? (
        <div className="panel mt-8 flex flex-col items-center px-6 py-16 text-center">
          <BookOpen size={20} className="text-ink-tertiary" />
          <p className="mt-3 text-body-sm text-ink">No trades logged yet</p>
          <p className="mt-1 max-w-sm text-caption text-ink-subtle">Redline a trade on the desk, then log it as taken or skipped. It shows up here with its verdict.</p>
          <Button asChild variant="primary" size="lg" className="mt-5">
            <Link href="/desk">Open the desk</Link>
          </Button>
        </div>
      ) : (
        <>
        <ul className="panel mt-6 divide-y divide-hairline md:hidden">
          {entries.map((e) => (
            <li key={e.id} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <Link href={`/desk?q=${encodeURIComponent(e.query)}`} className="text-body-sm text-ink hover:text-accent-ink">
                  {e.intent.side === "long" ? "Long" : "Short"} {e.intent.symbol} {e.intent.leverage}x
                </Link>
                <span className={cn("shrink-0 text-body-sm font-medium capitalize", VERDICT[e.verdict.verdict])}>{e.verdict.verdict}</span>
              </div>
              <p className="mt-1 text-caption text-ink-subtle">{e.verdict.headline}</p>
              <p className="num mt-2 text-caption text-ink-tertiary">
                {usd(e.intent.notionalUsd)} · {e.intent.horizonDays}d · entry {price(e.entryPrice)} · {e.decision}
              </p>
              <p className="num mt-1 text-caption text-ink-tertiary">
                {new Date(e.at).toLocaleString()}
                {" · "}
                <Link href={sharePath(encodeShare(e.intent, e.verdict))} className="text-accent-ink hover:underline">
                  Card
                </Link>
              </p>
            </li>
          ))}
        </ul>
        <div className="panel mt-6 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-body-sm">
            <thead className="bg-surface-2 text-caption text-ink-tertiary">
              <tr>
                <th className="px-4 py-2 text-left font-normal">When</th>
                <th className="px-4 py-2 text-left font-normal">Trade</th>
                <th className="px-4 py-2 text-right font-normal">Entry</th>
                <th className="px-4 py-2 text-left font-normal">Verdict</th>
                <th className="px-4 py-2 text-left font-normal">You</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-surface-2/60">
                  <td className="num px-4 py-3 text-caption text-ink-subtle">{new Date(e.at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/desk?q=${encodeURIComponent(e.query)}`} className="text-ink hover:text-accent-ink">
                      {e.intent.side === "long" ? "Long" : "Short"} {e.intent.symbol} {e.intent.leverage}x
                    </Link>
                    <p className="num text-caption text-ink-tertiary">{usd(e.intent.notionalUsd)} · {e.intent.horizonDays}d</p>
                  </td>
                  <td className="num px-4 py-3 text-right text-ink-muted">{price(e.entryPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-body-sm font-medium capitalize", VERDICT[e.verdict.verdict])}>{e.verdict.verdict}</span>
                    <p className="line-clamp-1 max-w-[42ch] text-caption text-ink-subtle">{e.verdict.headline}</p>
                  </td>
                  <td className="px-4 py-3 text-caption capitalize text-ink-muted">
                    {e.decision}
                    {" · "}
                    <Link href={sharePath(encodeShare(e.intent, e.verdict))} className="text-accent-ink hover:underline">
                      Card
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
