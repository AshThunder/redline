"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WarningCircle } from "@phosphor-icons/react";
import { VerdictPoster } from "@/components/landing/verdict-poster";
import { MU_SHARE_TOKEN } from "@/lib/landing/mu-case";
import { Composer } from "@/components/desk/composer";
import { Trace } from "@/components/desk/trace";
import { MarketStrip } from "@/components/desk/market-strip";
import { VerdictCard, VerdictSkeleton } from "@/components/desk/verdict-card";
import { AnalogsPanel } from "@/components/desk/analogs-panel";
import { StressPanel } from "@/components/desk/stress-panel";
import { DebatePanel } from "@/components/desk/debate-panel";
import { EvidencePanel, RulesPanel } from "@/components/desk/evidence-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRedline } from "@/lib/client/use-redline";
import { useJournal, useProfile } from "@/lib/client/storage";
import { useWatchtowerContext } from "@/lib/client/watchtower-context";
import { armWatches } from "@/lib/watchtower";

export function Desk() {
  const params = useSearchParams();
  const q = params.get("q") ?? undefined;
  const { state, run, reset } = useRedline();
  const [profile] = useProfile();
  const [journal, setJournal] = useJournal();
  const { arm } = useWatchtowerContext();
  const [now, setNow] = useState(0);
  const lastQ = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (q && q !== lastQ.current) {
      lastQ.current = q;
      run(q, profile);
    }
  }, [q, profile, run]);

  useEffect(() => {
    if (state.status !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [state.status]);

  const active = state.status !== "idle";
  const running = state.status === "running";
  const elapsed = state.ms ?? (running && state.startedAt ? Math.max(0, now - state.startedAt) : undefined);
  const logged = journal.find((j) => j.id === state.runId);

  const decide = (decision: "taken" | "skipped") => {
    if (!state.verdict || !state.intent || !state.runId || !state.market) return;
    setJournal((prev) => [
      {
        id: state.runId!,
        at: Date.now(),
        query: state.query,
        intent: state.intent!,
        entryPrice: state.market!.price,
        verdict: state.verdict!,
        stability: state.jury?.stability ?? 1,
        decision,
      },
      ...prev.filter((p) => p.id !== state.runId),
    ]);
    if (decision === "taken") {
      arm(
        armWatches({
          journalId: state.runId,
          query: state.query,
          intent: state.intent,
          entryPrice: state.market.price,
          verdict: state.verdict,
        }),
      );
    }
  };

  if (!active) {
    return (
      <div className="mx-auto flex max-w-[1440px] flex-col px-5 py-6 lg:py-8">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:gap-10">
          <div>
            <h1 className="max-w-[14ch] text-[36px] font-medium leading-[1.12] tracking-[-0.8px] text-ink md:text-display-md">
              What are you about to trade?
            </h1>
            <p className="mt-3 max-w-[46ch] text-body text-ink-muted">
              Plain English in. Analogues, shocks, and a Judge who writes how the trade dies. You still place the order.
            </p>
            <div className="mt-6">
              <Composer initial={q} running={false} compact={false} onSubmit={(t) => run(t, profile)} onStop={reset} />
            </div>
          </div>
          <aside className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-xl">
              <Image
                src="/marketing/redline-desk.jpg"
                alt="A dark desk, a blank monitor, and a cream notebook"
                width={960}
                height={540}
                priority
                className="h-40 w-full object-cover sm:h-48"
              />
            </div>
            <VerdictPoster compact />
            <p className="px-1 text-caption text-ink-subtle">
              Micron, 23 Sep.{" "}
              <Link href={`/s/${MU_SHARE_TOKEN}`} className="text-accent-ink hover:underline">
                Open the card
              </Link>
            </p>
          </aside>
        </div>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
          {PASSES.map((p) => (
            <li key={p.n} className="bg-surface-1 px-4 py-4">
              <p className="num text-caption text-ink-tertiary">{p.n}</p>
              <p className="mt-1 text-body-sm font-medium text-ink">{p.t}</p>
              <p className="mt-1 text-caption text-ink-subtle">{p.d}</p>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-4 px-5 py-5">
      <Composer initial={state.query} running={running} compact onSubmit={(t) => run(t, profile)} onStop={reset} />

      {state.error && (
        <div role="alert" className="flex items-start gap-3 rounded-md border border-loss/30 bg-loss-subtle px-4 py-3 text-body-sm text-ink">
          <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-loss" />
          <div>
            <p>Redline could not finish this run.</p>
            <p className="text-caption text-ink-subtle">{state.error}</p>
          </div>
        </div>
      )}

      <MarketStrip state={state} />

      <div className="grid items-start gap-4 lg:grid-cols-[340px_1fr]">
        <div className="lg:sticky lg:top-[72px]">
          <Trace steps={state.steps} running={running} elapsedMs={elapsed} />
        </div>

        <div className="min-w-0 space-y-4">
          {state.verdict && state.intent ? (
            <VerdictCard verdict={state.verdict} jury={state.jury} intent={state.intent} onDecision={decide} decision={logged?.decision} ledgerHash={state.ledgerHash} />
          ) : (
            running && <VerdictSkeleton />
          )}

          {(state.analogs || state.stress || state.debate.length > 0) && state.intent && (
            <section className="panel overflow-hidden">
              <Tabs defaultValue="analogs">
                <TabsList>
                  <TabsTrigger value="analogs">Historical analogs</TabsTrigger>
                  <TabsTrigger value="stress">Stress tests</TabsTrigger>
                  <TabsTrigger value="debate">Debate</TabsTrigger>
                  <TabsTrigger value="rules">
                    Your rules
                    {state.violations.length > 0 && <span className="num rounded-xs bg-caution-subtle px-1 text-[11px] text-caution">{state.violations.length}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="evidence">
                    Evidence <span className="num text-[11px] text-ink-tertiary">{state.evidence.length}</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="analogs">{state.analogs ? <AnalogsPanel result={state.analogs} intent={state.intent} /> : <PanelLoading />}</TabsContent>
                <TabsContent value="stress">{state.stress ? <StressPanel result={state.stress} gaps={state.gaps} intent={state.intent} /> : <PanelLoading />}</TabsContent>
                <TabsContent value="debate"><DebatePanel turns={state.debate} evidence={state.evidence} running={running} /></TabsContent>
                <TabsContent value="rules"><RulesPanel violations={state.violations} /></TabsContent>
                <TabsContent value="evidence"><EvidencePanel evidence={state.evidence} /></TabsContent>
              </Tabs>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

const PASSES = [
  { n: "01", t: "You type it", d: "Ticker, side, size, stop, why." },
  { n: "02", t: "Bitget fills the blanks", d: "Price, funding, depth, the next report." },
  { n: "03", t: "History replays it", d: "Five years of similar setups and shocks." },
  { n: "04", t: "A Judge writes how it dies", d: "Kill, resize, or proceed. Then you decide." },
];

function PanelLoading() {
  return (
    <div className="space-y-3 p-4">
      <div className="h-4 w-1/2 animate-pulse rounded-xs bg-surface-2" />
      <div className="h-48 animate-pulse rounded-md bg-surface-2" />
    </div>
  );
}
