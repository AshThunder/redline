"use client";

import type { GapRisk, StressResult, TradeIntent } from "@/lib/types";
import { cn, plainPct, price, signedPct, usd } from "@/lib/format";

export function StressPanel({ result, gaps, intent }: { result: StressResult; gaps?: GapRisk; intent: TradeIntent }) {
  return (
    <div className="space-y-4 p-4">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-hairline bg-hairline lg:grid-cols-4">
        {[
          { label: "Liquidation price", value: price(result.liquidationPrice), sub: `${plainPct(result.liquidationMovePct)} away`, cls: "text-loss" },
          { label: "Beta to Nasdaq", value: result.betaQqq.toFixed(2), sub: "1y daily, vs QQQ" },
          { label: "Beta to BTC", value: result.betaBtc.toFixed(2), sub: "1y daily" },
          { label: "Funding drag", value: usd(-Math.abs(result.fundingCostUsd)), sub: result.fundingIsEstimate ? "estimated, 0.01%/8h" : `live ${(result.fundingRate! * 100).toFixed(4)}%/8h` },
        ].map((c) => (
          <div key={c.label} className="bg-surface-2 px-3 py-2.5">
            <dt className="text-caption text-ink-tertiary">{c.label}</dt>
            <dd className={cn("num mt-0.5 text-body-sm text-ink", c.cls)}>{c.value}</dd>
            <dd className="mt-0.5 text-caption text-ink-tertiary">{c.sub}</dd>
          </div>
        ))}
      </dl>

      <div className="overflow-hidden rounded-md border border-hairline">
        <table className="w-full text-body-sm">
          <thead className="bg-surface-2 text-caption text-ink-tertiary">
            <tr>
              <th className="px-3 py-2 text-left font-normal">Scenario</th>
              <th className="whitespace-nowrap px-3 py-2 text-right font-normal">{intent.symbol} move</th>
              <th className="whitespace-nowrap px-3 py-2 text-right font-normal">P&amp;L</th>
              <th className="whitespace-nowrap px-3 py-2 text-right font-normal">On margin</th>
              <th className="whitespace-nowrap px-3 py-2 text-right font-normal">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {result.rows.map((r) => (
              <tr key={r.id} className={cn(r.liquidated && "bg-loss-subtle")}>
                <td className="px-3 py-2.5">
                  <p className="text-ink">{r.name}</p>
                  <p className="text-caption text-ink-tertiary">{r.description}</p>
                </td>
                <td className="num whitespace-nowrap px-3 py-2.5 text-right text-ink-muted">{signedPct(r.underlyingMovePct)}</td>
                <td className={cn("num whitespace-nowrap px-3 py-2.5 text-right", r.pnlUsd >= 0 ? "text-gain" : "text-loss")}>{usd(r.pnlUsd, { signed: true })}</td>
                <td className={cn("num whitespace-nowrap px-3 py-2.5 text-right", r.pnlOnMarginPct >= 0 ? "text-gain" : "text-loss")}>{signedPct(r.pnlOnMarginPct, 0)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right text-caption">
                  {r.liquidated ? <span className="text-loss">Liquidated</span> : r.stopTriggered ? <span className="text-caution">Stopped out</span> : <span className="text-ink-subtle">Survives</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {gaps && (
        <div className="rounded-md border border-hairline bg-surface-2 p-4">
          <h4 className="text-body-sm font-medium text-ink">While NYSE sleeps</h4>
          <p className="mt-1 max-w-[75ch] text-caption text-ink-subtle">
            Your horizon includes about <span className="num text-ink-muted">{gaps.closedHoursInHorizon}h</span> of closed US market
            {gaps.weekendsInHorizon > 0 && <> and <span className="num text-ink-muted">{gaps.weekendsInHorizon}</span> weekend{gaps.weekendsInHorizon > 1 ? "s" : ""}</>}.
            The Bitget stock perp keeps trading through it, on thinner liquidity, so news that lands overnight hits your position before the stock reopens.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div><dt className="text-caption text-ink-tertiary">Overnight gap p95</dt><dd className="num text-body-sm">{plainPct(gaps.overnight.p95)}</dd></div>
            <div><dt className="text-caption text-ink-tertiary">Weekend gap p95</dt><dd className="num text-body-sm">{plainPct(gaps.weekend.p95)}</dd></div>
            <div><dt className="text-caption text-ink-tertiary">Worst weekend gap</dt><dd className="num text-body-sm text-loss">{plainPct(gaps.weekend.worst)}</dd></div>
            <div><dt className="text-caption text-ink-tertiary">Gap jumps your stop</dt><dd className="num text-body-sm">{gaps.probGapThroughStop != null ? plainPct(gaps.probGapThroughStop, 0) : "no stop"}</dd></div>
          </dl>
        </div>
      )}
    </div>
  );
}
