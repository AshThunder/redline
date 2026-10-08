"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { Wordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ShareActions } from "@/components/desk/share-button";
import { usd } from "@/lib/format";
import { replayQuery, verdictLabel, type ShareCard } from "@/lib/share";

const TINT = {
  kill: { text: "text-loss", bg: "bg-loss-subtle", border: "border-loss/25" },
  resize: { text: "text-caution", bg: "bg-caution-subtle", border: "border-caution/25" },
  proceed: { text: "text-gain", bg: "bg-gain-subtle", border: "border-gain/25" },
} as const;

export function ShareView({ card, token }: { card: ShareCard; token: string }) {
  const tint = TINT[card.verdict];
  const agree = card.jury ? card.jury.filter((v) => v === card.verdict).length : null;
  const rows = [
    { label: "Leverage", from: `${card.leverage}x`, to: `${card.suggestedLeverage}x` },
    { label: "Notional", from: usd(card.notionalUsd), to: usd(card.suggestedNotionalUsd) },
    { label: "Stop", from: card.stopPct != null ? `${card.stopPct}%` : "none", to: `${card.suggestedStopPct}%` },
  ];

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[800px] items-center gap-2 px-4 sm:gap-4 sm:px-5">
          <Link href="/" className="shrink-0">
            <Wordmark />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="primary" size="md">
              <Link href={`/desk?q=${encodeURIComponent(replayQuery(card))}`}>
                <span className="sm:hidden">Replay</span>
                <span className="hidden sm:inline">Replay on the desk</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] px-5 py-12 md:py-16">
        <p className="text-caption font-medium text-ink-subtle">A shared Redline verdict</p>
        <article className={`panel mt-4 overflow-hidden ${tint.border}`}>
          <header className={`flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-hairline px-5 py-3 ${tint.bg}`}>
            <span className={`text-body-sm font-medium ${tint.text}`}>{verdictLabel(card.verdict)}</span>
            <span className="num text-caption text-ink-subtle">Confidence {Math.round(card.confidence * 100)}%</span>
            {agree != null && card.jury && (
              <span className="num text-caption text-ink-subtle">
                Jury {agree}/{card.jury.length} agree
              </span>
            )}
          </header>
          <div className="px-5 py-5">
            <p className="text-caption uppercase tracking-[0.08em] text-ink-subtle">
              {card.symbol} · {card.side} · {card.leverage}x · {card.horizonDays}d
            </p>
            <h1 className="mt-2 text-headline font-medium tracking-[-0.5px] text-ink">{card.headline}</h1>
            <ol className="mt-5 space-y-2">
              {card.deathModes.map((d, i) => (
                <li key={d.title} className="flex items-baseline justify-between gap-4 border-t border-hairline pt-2 first:border-t-0 first:pt-0">
                  <p className="text-body-sm text-ink">
                    <span className="num mr-2 text-ink-tertiary">{i + 1}</span>
                    {d.title}
                  </p>
                  <span className="shrink-0 text-caption capitalize text-ink-subtle">{d.probability}</span>
                </li>
              ))}
            </ol>
          </div>
          <dl className="grid grid-cols-1 gap-px border-t border-hairline bg-hairline min-[480px]:grid-cols-3">
            {rows.map((c) => {
              const changed = c.from !== c.to;
              return (
                <div key={c.label} className="bg-surface-1 px-4 py-3">
                  <dt className="text-caption text-ink-tertiary">{c.label}</dt>
                  <dd className="num mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-body-sm">
                    <span className={changed ? "text-ink-tertiary line-through" : "text-ink"}>{c.from}</span>
                    {changed && <span className="text-accent-ink">{c.to}</span>}
                  </dd>
                </div>
              );
            })}
          </dl>
        </article>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ShareActions card={card} token={token} />
          <Button asChild variant="ai" size="md">
            <Link href={`/desk?q=${encodeURIComponent(replayQuery(card))}`}>
              Run it yourself
              <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
        <p className="mt-8 max-w-[52ch] text-body-sm text-ink-muted">
          Redline never places an order. This card is a pre-mortem: Kill, Resize, or Proceed, plus the three ways the trade dies.
        </p>
      </main>
    </div>
  );
}
