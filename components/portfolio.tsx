"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useJournal } from "@/lib/client/storage";
import { usd } from "@/lib/format";
import type { BookLine, PortfolioReport } from "@/lib/portfolio";

const SAMPLE: BookLine[] = [
  { symbol: "MU", side: "long", notionalUsd: 10_000, leverage: 5 },
  { symbol: "NVDA", side: "long", notionalUsd: 8_000, leverage: 4 },
  { symbol: "COIN", side: "long", notionalUsd: 5_000, leverage: 3 },
];

export function Portfolio() {
  const [journal] = useJournal();
  const taken: BookLine[] = journal
    .filter((j) => j.decision === "taken")
    .map((j) => ({ symbol: j.intent.symbol, side: j.intent.side, notionalUsd: j.intent.notionalUsd, leverage: j.intent.leverage }));
  const [report, setReport] = useState<PortfolioReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (book: BookLine[], source: PortfolioReport["source"]) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ book, source }),
      });
      const json = (await res.json()) as PortfolioReport & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Portfolio redline failed");
      setReport(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8">
      <h1 className="text-headline font-medium">Portfolio</h1>
      <p className="mt-2 max-w-[62ch] text-body-sm text-ink-muted">
        The same shocks, applied to the whole book. Bitget account keys are not connected, so this uses trades you marked taken on the desk.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="ai" size="md" disabled={busy || taken.length === 0} onClick={() => run(taken, "journal")}>
          {busy ? "Reading the book" : `Redline ${taken.length} taken trade${taken.length === 1 ? "" : "s"}`}
        </Button>
        <Button variant="secondary" size="md" disabled={busy} onClick={() => run(SAMPLE, "sample")}>
          Redline a sample book
        </Button>
        <Button asChild variant="tertiary" size="md">
          <Link href="/desk">Open the desk</Link>
        </Button>
      </div>
      {error && <p className="mt-4 text-body-sm text-loss">{error}</p>}
      {report && <ReportView report={report} />}
    </div>
  );
}

function ReportView({ report }: { report: PortfolioReport }) {
  return (
    <div className="mt-8 space-y-4">
      <p className="text-caption text-ink-subtle">{report.source === "sample" ? "Sample book. Not a live account." : "Taken trades from this browser."}</p>
      <dl className="grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-3">
        {[
          ["Gross", usd(report.grossUsd)],
          ["QQQ beta", report.betaQqq.toFixed(2)],
          ["BTC beta", report.betaBtc.toFixed(2)],
        ].map(([k, v]) => (
          <div key={k} className="bg-surface-1 px-4 py-3">
            <dt className="text-caption text-ink-tertiary">{k}</dt>
            <dd className="num mt-1 text-headline font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="panel overflow-x-auto">
        <table className="w-full min-w-[640px] text-body-sm">
          <thead className="bg-surface-2 text-caption text-ink-tertiary">
            <tr>
              <th className="px-4 py-2 text-left font-normal">Name</th>
              <th className="px-4 py-2 text-left font-normal">Sector</th>
              <th className="px-4 py-2 text-right font-normal">Notional</th>
              <th className="px-4 py-2 text-right font-normal">QQQ</th>
              <th className="px-4 py-2 text-right font-normal">BTC</th>
              <th className="px-4 py-2 text-right font-normal">Liq</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {report.lines.map((l) => (
              <tr key={l.symbol}>
                <td className="px-4 py-3 font-medium text-ink">
                  {l.symbol} <span className="text-caption font-normal text-ink-subtle">{l.side} {l.leverage}x</span>
                </td>
                <td className="px-4 py-3 text-ink-muted">{l.sector}</td>
                <td className="num px-4 py-3 text-right">{usd(l.notionalUsd)}</td>
                <td className="num px-4 py-3 text-right">{l.betaQqq.toFixed(2)}</td>
                <td className="num px-4 py-3 text-right">{l.betaBtc.toFixed(2)}</td>
                <td className="num px-4 py-3 text-right">{(l.liquidationMovePct * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-body-sm font-medium text-ink">Where the book dies first</h2>
          <ul className="mt-3 space-y-2">
            {report.liquidations.map((l) => (
              <li key={l.symbol} className="flex items-baseline justify-between gap-3 text-body-sm">
                <span className="text-ink">{l.symbol}</span>
                <span className="num text-ink-subtle">
                  {l.price.toFixed(2)} · {(l.distancePct * 100).toFixed(1)}% away
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel p-5">
          <h2 className="text-body-sm font-medium text-ink">Shocks on the whole book</h2>
          <ul className="mt-3 space-y-2">
            {report.shocks.map((s) => (
              <li key={s.id} className="flex items-baseline justify-between gap-3 text-body-sm">
                <span className="text-ink">{s.name}</span>
                <span className={`num ${s.pnlUsd < 0 ? "text-loss" : "text-gain"}`}>{usd(s.pnlUsd, { signed: true })}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel p-5">
        <h2 className="text-body-sm font-medium text-ink">Hedges</h2>
        <ul className="mt-3 space-y-2">
          {report.hedges.map((h) => (
            <li key={h} className="text-body-sm text-ink-muted">
              {h}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
