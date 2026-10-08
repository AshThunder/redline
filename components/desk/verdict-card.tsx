"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ArrowRight, BellRinging, Check, Prohibit, Scales, X } from "@phosphor-icons/react";
import type { JuryResult, TradeIntent, Verdict } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { VerdictShare } from "@/components/desk/share-button";
import { cn, usd } from "@/lib/format";

const META = {
  kill: { label: "Kill", icon: Prohibit, text: "text-loss", tint: "bg-loss-subtle", border: "border-loss/25" },
  resize: { label: "Resize", icon: Scales, text: "text-caution", tint: "bg-caution-subtle", border: "border-caution/25" },
  proceed: { label: "Proceed", icon: Check, text: "text-gain", tint: "bg-gain-subtle", border: "border-gain/25" },
} as const;

const PROB = { low: "text-ink-subtle", medium: "text-caution", high: "text-loss" } as const;

export function VerdictCard({
  verdict,
  jury,
  intent,
  onDecision,
  decision,
  ledgerHash,
  preview = false,
}: {
  verdict: Verdict;
  jury?: JuryResult;
  intent: TradeIntent;
  onDecision?: (d: "taken" | "skipped") => void;
  decision?: "taken" | "skipped" | "pending";
  ledgerHash?: string | null;
  preview?: boolean;
}) {
  const reduce = useReducedMotion();
  const m = META[verdict.verdict];
  const Icon = m.icon;
  const changes = [
    { label: "Leverage", from: `${intent.leverage}x`, to: `${verdict.suggestedLeverage}x`, changed: verdict.suggestedLeverage !== intent.leverage },
    { label: "Notional", from: usd(intent.notionalUsd), to: usd(verdict.suggestedNotionalUsd), changed: Math.abs(verdict.suggestedNotionalUsd - intent.notionalUsd) > 1 },
    { label: "Stop", from: intent.stopPct != null ? `${intent.stopPct}%` : "none", to: `${verdict.suggestedStopPct}%`, changed: verdict.suggestedStopPct !== intent.stopPct },
  ];

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn("panel overflow-hidden", m.border)}
    >
      <header className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline px-5 py-3", m.tint)}>
        <span className={cn("flex items-center gap-2 text-body-sm font-semibold", m.text)}>
          <Icon size={16} weight="bold" />
          {m.label}
        </span>
        <span className="num text-caption text-ink-subtle">Confidence {Math.round(verdict.confidence * 100)}%</span>
        {jury && (
          <span className="num text-caption text-ink-subtle" title={`Votes: ${jury.votes.join(", ")}`}>
            Jury {jury.votes.filter((v) => v === verdict.verdict).length}/{jury.votes.length} agree
          </span>
        )}
      </header>

      <div className="px-5 pt-5">
        <h2 className="text-headline font-medium text-ink">{verdict.headline}</h2>
        <p className="mt-2 max-w-[70ch] text-body-sm text-ink-muted">{verdict.summary}</p>
      </div>

      <div className="px-5 pt-6">
        <h3 className="text-caption font-medium text-ink-subtle">Pre-mortem: how this trade dies</h3>
        <ol className="mt-3 grid gap-3 lg:grid-cols-3">
          {verdict.deathModes.map((d, i) => (
            <li key={d.title} className="rounded-md border border-hairline bg-surface-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-body-sm font-medium text-ink">
                  <span className="num mr-2 text-ink-tertiary">{i + 1}</span>
                  {d.title}
                </p>
                <span className={cn("shrink-0 text-caption capitalize", PROB[d.probability])}>{d.probability}</span>
              </div>
              <p className="mt-2 text-caption leading-relaxed text-ink-subtle">{d.mechanism}</p>
              <div className="mt-3 flex items-start gap-2 border-t border-hairline pt-3 text-caption text-ink-muted">
                <BellRinging size={14} className="mt-px shrink-0 text-accent-ink" />
                <span>{d.tripwire.description}</span>
              </div>
              {d.evidenceIds.length > 0 && <p className="num mt-2 text-[11px] text-ink-tertiary">{d.evidenceIds.join(" ")}</p>}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 grid gap-px border-t border-hairline bg-hairline sm:grid-cols-3">
        {changes.map((c) => (
          <div key={c.label} className="bg-surface-1 px-5 py-3">
            <p className="text-caption text-ink-tertiary">{c.label}</p>
            <p className="num mt-1 flex items-center gap-2 text-body-sm">
              <span className={c.changed ? "text-ink-tertiary line-through" : "text-ink"}>{c.from}</span>
              {c.changed && (
                <>
                  <ArrowRight size={12} className="text-ink-tertiary" />
                  <span className="text-accent-ink">{c.to}</span>
                </>
              )}
            </p>
          </div>
        ))}
      </div>

      {verdict.hedge && (
        <p className="border-t border-hairline px-5 py-3 text-caption text-ink-muted">
          <span className="text-ink-subtle">Hedge: </span>
          {verdict.hedge}
        </p>
      )}

      {!preview && (
        <footer className="flex flex-wrap items-center gap-2 border-t border-hairline px-5 py-3">
          <p className="mr-auto text-caption text-ink-tertiary">
            You make the call. Redline never places an order without your confirmation.
            {ledgerHash && (
              <>
                {" "}
                <Link href="/ledger" className="text-accent-ink hover:underline">
                  Hashed on the ledger
                </Link>
              </>
            )}
          </p>
          {decision && decision !== "pending" ? (
            <span className="text-caption text-ink-subtle">Logged as {decision} in your journal</span>
          ) : (
            <>
              <Button size="sm" variant="tertiary" onClick={() => onDecision?.("skipped")}>
                <X size={12} /> Skip trade
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onDecision?.("taken")}>
                Take and watch
              </Button>
            </>
          )}
          <VerdictShare intent={intent} verdict={verdict} jury={jury} />
        </footer>
      )}
    </motion.section>
  );
}

export function VerdictSkeleton() {
  return (
    <section className="panel overflow-hidden">
      <div className="h-11 border-b border-hairline bg-surface-2/50" />
      <div className="space-y-3 p-5">
        <div className="h-7 w-3/4 animate-pulse rounded-sm bg-surface-3" />
        <div className="h-4 w-full animate-pulse rounded-xs bg-surface-2" />
        <div className="h-4 w-2/3 animate-pulse rounded-xs bg-surface-2" />
        <div className="grid gap-3 pt-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-md bg-surface-2" />
          ))}
        </div>
      </div>
    </section>
  );
}
