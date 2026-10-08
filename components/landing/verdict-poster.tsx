import { ArrowRightIcon, ScalesIcon } from "@/components/landing/glyphs";
import { MU_INTENT, MU_JURY, MU_VERDICT } from "@/lib/landing/mu-case";
import { usd } from "@/lib/format";

const CHANGES = [
  { label: "Leverage", from: `${MU_INTENT.leverage}x`, to: `${MU_VERDICT.suggestedLeverage}x` },
  { label: "Notional", from: usd(MU_INTENT.notionalUsd), to: usd(MU_VERDICT.suggestedNotionalUsd) },
  { label: "Stop", from: `${MU_INTENT.stopPct}%`, to: `${MU_VERDICT.suggestedStopPct}%` },
];

export function VerdictPoster({ compact = false }: { compact?: boolean }) {
  return (
    <article className="panel overflow-hidden rounded-xl">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-hairline bg-caution-subtle px-5 py-3">
        <span className="flex items-center gap-2 text-body-sm font-medium text-caution">
          <ScalesIcon />
          Resize
        </span>
        <span className="num text-caption text-ink-subtle">Confidence {Math.round(MU_VERDICT.confidence * 100)}%</span>
        <span className="num text-caption text-ink-subtle">
          Jury {MU_JURY.votes.filter((v) => v === MU_VERDICT.verdict).length}/{MU_JURY.votes.length} agree
        </span>
      </header>
      <div className="px-5 py-5">
        <h3 className="text-headline font-medium tracking-[-0.5px] text-ink">{MU_VERDICT.headline}</h3>
        {!compact && <p className="mt-2 max-w-[62ch] text-body-sm text-ink-muted">{MU_VERDICT.summary}</p>}
        <ol className="mt-5 space-y-2">
          {MU_VERDICT.deathModes.map((d, i) => (
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
        {CHANGES.map((c) => (
          <div key={c.label} className="bg-surface-1 px-4 py-3">
            <dt className="text-caption text-ink-tertiary">{c.label}</dt>
            <dd className="num mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-body-sm">
              <span className="text-ink-tertiary line-through">{c.from}</span>
              <ArrowRightIcon size={12} />
              <span className="text-accent-ink">{c.to}</span>
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
