"use client";

import type { Evidence, RuleViolation } from "@/lib/types";
import { cn } from "@/lib/format";

export function RulesPanel({ violations }: { violations: RuleViolation[] }) {
  if (violations.length === 0)
    return <p className="p-4 text-body-sm text-ink-subtle">This trade respects every rule in your profile.</p>;
  return (
    <ul className="divide-y divide-hairline">
      {violations.map((v) => (
        <li key={v.rule} className="flex items-start gap-3 px-4 py-3">
          <span className={cn("mt-0.5 rounded-xs px-1.5 py-px text-[11px] font-medium", v.severity === "block" ? "bg-loss-subtle text-loss" : "bg-caution-subtle text-caution")}>
            {v.severity === "block" ? "Broken" : "Warning"}
          </span>
          <div>
            <p className="text-body-sm text-ink">{v.rule}</p>
            <p className="text-caption text-ink-subtle">{v.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EvidencePanel({ evidence }: { evidence: Evidence[] }) {
  const groups = evidence.reduce<Record<string, Evidence[]>>((acc, e) => {
    (acc[e.source] ??= []).push(e);
    return acc;
  }, {});
  return (
    <div className="grid gap-4 p-4 md:grid-cols-2">
      {Object.entries(groups).map(([source, items]) => (
        <section key={source} className="rounded-md border border-hairline bg-surface-2">
          <h4 className="border-b border-hairline px-3 py-2 text-caption text-ink-subtle">{source}</h4>
          <dl className="divide-y divide-hairline">
            {items.map((e) => (
              <div key={e.id} className="grid grid-cols-[2.25rem_1fr] gap-2 px-3 py-2">
                <dt className="num text-caption text-ink-tertiary">{e.id}</dt>
                <dd>
                  <p className="text-caption text-ink-muted">{e.label}</p>
                  <p className="num mt-0.5 break-words text-caption text-ink-subtle">{e.value}</p>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
