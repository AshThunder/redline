"use client";

import { motion, useReducedMotion } from "motion/react";
import { TrendDown, TrendUp, ShieldWarning } from "@phosphor-icons/react";
import type { DebateTurn, Evidence } from "@/lib/types";
import { cn } from "@/lib/format";

const ROLE = {
  bull: { name: "Bull", icon: TrendUp, cls: "text-gain" },
  bear: { name: "Bear", icon: TrendDown, cls: "text-loss" },
  risk: { name: "Risk Officer", icon: ShieldWarning, cls: "text-caution" },
} as const;

export function DebatePanel({ turns, evidence, running }: { turns: DebateTurn[]; evidence: Evidence[]; running: boolean }) {
  const reduce = useReducedMotion();
  const byId = new Map(evidence.map((e) => [e.id, e]));
  const order: DebateTurn["role"][] = ["bull", "bear", "risk"];
  return (
    <div className="grid gap-3 p-4 lg:grid-cols-3">
      {order.map((role) => {
        const t = turns.find((x) => x.role === role);
        const r = ROLE[role];
        const Icon = r.icon;
        return (
          <motion.article
            key={role}
            layout={!reduce}
            className="rounded-md border border-hairline bg-surface-2 p-4"
          >
            <header className={cn("flex items-center gap-2 text-body-sm font-medium", r.cls)}>
              <Icon size={16} />
              {r.name}
            </header>
            {t ? (
              <>
                <p className="mt-2 text-body-sm text-ink">{t.stance}</p>
                <ul className="mt-3 space-y-2.5">
                  {t.points.map((p) => (
                    <li key={p.claim} className="text-caption leading-relaxed text-ink-subtle">
                      {p.claim}
                      {p.evidenceIds.length > 0 && (
                        <span className="ml-1.5 inline-flex flex-wrap gap-1 align-middle">
                          {p.evidenceIds.map((id) => (
                            <span key={id} title={byId.get(id) ? `${byId.get(id)!.label}: ${byId.get(id)!.value}` : id} className="num cursor-help rounded-xs border border-hairline px-1 text-[10px] text-ink-tertiary hover:border-primary/40 hover:text-primary">
                              {id}
                            </span>
                          ))}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="mt-3 space-y-2">
                {running ? [0, 1, 2].map((i) => <div key={i} className="h-3 animate-pulse rounded-xs bg-surface-3" style={{ width: `${90 - i * 15}%` }} />) : <p className="text-caption text-ink-tertiary">No argument returned.</p>}
              </div>
            )}
          </motion.article>
        );
      })}
    </div>
  );
}
