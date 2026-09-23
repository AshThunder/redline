"use client";

import Link from "next/link";
import { BookOpen } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useJournal } from "@/lib/client/storage";
import { cn, price, usd } from "@/lib/format";

const VERDICT = { kill: "text-loss", resize: "text-caution", proceed: "text-gain" } as const;

export function Journal() {
  const [entries] = useJournal();

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8">
      <h1 className="text-headline font-semibold">Journal</h1>
      <p className="mt-1 text-body-sm text-ink-subtle">Every redlined trade and what you decided. Outcomes are scored against the verdict once the horizon ends.</p>

      {entries.length === 0 ? (
        <div className="panel mt-8 flex flex-col items-center px-6 py-16 text-center">
          <BookOpen size={20} className="text-ink-tertiary" />
          <p className="mt-3 text-body-sm text-ink">No trades logged yet</p>
          <p className="mt-1 max-w-sm text-caption text-ink-subtle">Redline a trade on the desk, then log it as taken or skipped. It shows up here with its verdict.</p>
          <Button asChild variant="primary" size="md" className="mt-5">
            <Link href="/desk">Open the desk</Link>
          </Button>
        </div>
      ) : (
        <div className="panel mt-6 overflow-hidden">
          <table className="w-full text-body-sm">
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
                    <Link href={`/desk?q=${encodeURIComponent(e.query)}`} className="text-ink hover:text-primary">
                      {e.intent.side === "long" ? "Long" : "Short"} {e.intent.symbol} {e.intent.leverage}x
                    </Link>
                    <p className="num text-caption text-ink-tertiary">{usd(e.intent.notionalUsd)} · {e.intent.horizonDays}d</p>
                  </td>
                  <td className="num px-4 py-3 text-right text-ink-muted">{price(e.entryPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-body-sm font-medium capitalize", VERDICT[e.verdict.verdict])}>{e.verdict.verdict}</span>
                    <p className="line-clamp-1 max-w-[42ch] text-caption text-ink-subtle">{e.verdict.headline}</p>
                  </td>
                  <td className="px-4 py-3 text-caption capitalize text-ink-muted">{e.decision}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
