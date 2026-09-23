"use client";

import { motion, useReducedMotion } from "motion/react";
import { CheckCircle, CircleNotch, MinusCircle, WarningCircle } from "@phosphor-icons/react";
import type { TraceStep } from "@/lib/client/use-redline";
import { cn } from "@/lib/format";

const ICON = {
  running: <CircleNotch size={14} className="animate-spin text-primary" />,
  done: <CheckCircle size={14} weight="fill" className="text-ink-subtle" />,
  error: <WarningCircle size={14} weight="fill" className="text-caution" />,
  skipped: <MinusCircle size={14} className="text-ink-tertiary" />,
};

export function Trace({ steps, running, elapsedMs }: { steps: TraceStep[]; running: boolean; elapsedMs?: number }) {
  const reduce = useReducedMotion();
  return (
    <section className="panel overflow-hidden">
      <header className="flex h-10 items-center justify-between border-b border-hairline px-4">
        <h2 className="text-body-sm font-medium text-ink">Research trace</h2>
        <span className="num text-caption text-ink-tertiary">
          {steps.filter((s) => s.status === "done").length}/{steps.length}
          {elapsedMs != null && ` · ${(elapsedMs / 1000).toFixed(1)}s`}
        </span>
      </header>
      <ol className="relative px-4 py-3">
        {steps.map((s, i) => (
          <motion.li
            key={s.id}
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex gap-3 pb-3 last:pb-0"
          >
            {i < steps.length - 1 && <span aria-hidden className="absolute left-[6.5px] top-5 bottom-0 w-px bg-hairline" />}
            <span className="relative mt-[3px] flex h-3.5 w-3.5 shrink-0 items-center justify-center bg-surface-1">{ICON[s.status]}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className={cn("text-body-sm", s.status === "running" ? "text-ink" : "text-ink-muted")}>{s.label}</p>
                {s.ms != null && <span className="num shrink-0 text-caption text-ink-tertiary">{s.ms < 1000 ? `${s.ms}ms` : `${(s.ms / 1000).toFixed(1)}s`}</span>}
              </div>
              {s.detail && (
                <p title={s.detail} className={cn("mt-0.5 line-clamp-2 text-caption", s.status === "error" ? "text-caution" : "text-ink-subtle")}>{s.detail}</p>
              )}
            </div>
          </motion.li>
        ))}
        {running && steps.length === 0 && <li className="h-4 w-40 animate-pulse rounded-xs bg-surface-3" />}
      </ol>
    </section>
  );
}
