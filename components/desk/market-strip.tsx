"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import type { RedlineState } from "@/lib/client/use-redline";
import { price, signedPct, usd, cn } from "@/lib/format";

export function MarketStrip({ state }: { state: RedlineState }) {
  const { intent, market, stress } = state;
  if (!intent) return null;
  const perp = market?.perp;
  const series = market?.series ?? [];
  const change = series.length > 1 ? series[series.length - 1].c / series[0].c - 1 : 0;

  const cells: { label: string; value: string; tone?: string }[] = [
    { label: "Side", value: `${intent.side === "long" ? "Long" : "Short"} ${intent.leverage}x`, tone: intent.side === "long" ? "text-gain" : "text-loss" },
    { label: "Notional", value: usd(intent.notionalUsd) },
    { label: "Margin", value: usd(intent.notionalUsd / intent.leverage) },
    { label: "Stop", value: intent.stopPct != null ? `${intent.stopPct}%` : "None", tone: intent.stopPct == null ? "text-caution" : undefined },
    { label: "Horizon", value: `${intent.horizonDays}d` },
    { label: "Liq. price", value: stress ? price(stress.liquidationPrice) : "…", tone: "text-loss" },
    { label: "Funding 8h", value: perp?.fundingRate != null ? `${(perp.fundingRate * 100).toFixed(4)}%` : "est. 0.0100%" },
  ];

  return (
    <section className="panel grid grid-cols-1 overflow-hidden md:grid-cols-[minmax(260px,1fr)_2fr]">
      <div className="flex items-center gap-4 border-b border-hairline p-4 md:border-b-0 md:border-r">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h2 className="text-card-title font-medium">{intent.symbol}</h2>
            <span className="text-caption text-ink-tertiary">{perp ? perp.symbol : "Stock perp"}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="num text-body-lg text-ink">{market ? price(market.price) : "…"}</span>
            {series.length > 1 && <span className={cn("num text-caption", change >= 0 ? "text-gain" : "text-loss")}>{signedPct(change)} 6m</span>}
          </div>
          <p className="mt-1 truncate text-caption text-ink-tertiary">{market?.source ?? "Loading market data"}</p>
        </div>
        <div className="ml-auto h-12 w-32 shrink-0">
          {series.length > 1 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent-ink)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-accent-ink)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Area type="monotone" dataKey="c" stroke="var(--color-accent-ink)" strokeWidth={1.25} fill="url(#spark)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
        {cells.map((c) => (
          <div key={c.label} className="border-hairline px-4 py-3 [&:not(:last-child)]:border-r max-lg:border-b">
            <dt className="text-caption text-ink-tertiary">{c.label}</dt>
            <dd className={cn("num mt-1 text-body-sm text-ink", c.tone)}>{c.value}</dd>
          </div>
        ))}
      </dl>
      <IntelRow state={state} />
    </section>
  );
}

function IntelRow({ state }: { state: RedlineState }) {
  const f = state.fundamentals;
  const e = state.stress?.earnings;
  const entry = state.market?.price;
  if (!f) return null;
  const a = f.analysts;
  const s = f.sentiment;
  const rated = a ? a.buy + a.hold + a.sell : 0;

  return (
    <div className="col-span-full flex flex-wrap items-stretch border-t border-hairline bg-surface-2/50">
      <span className="flex items-center gap-1.5 px-4 py-2.5 text-caption text-ink-tertiary">
        <span className="size-1.5 rounded-full bg-accent-ink" />
        Bitget market data
      </span>
      {f.earnings?.next && (
        <Intel label="Next earnings" tone={e?.inHorizon ? "text-caution" : undefined}>
          {f.earnings.next}
          {f.earnings.nextIsEstimate && <span className="text-ink-tertiary"> est.</span>}
          <span className="text-ink-tertiary"> · {f.earnings.daysUntil}d</span>
          {e?.inHorizon && <span className="ml-1.5 rounded-sm bg-caution-subtle px-1 text-caution">in horizon</span>}
        </Intel>
      )}
      {e && e.sample >= 3 && (
        <Intel label={`Earnings move p90 (${e.sample} reports)`}>±{(e.absMoveP90 * 100).toFixed(1)}%</Intel>
      )}
      {a?.meanTarget != null && entry != null && (
        <Intel label={`Analyst target (${a.count90d} in 90d)`}>
          {price(a.meanTarget)} <span className={cn(a.meanTarget >= entry ? "text-gain" : "text-loss")}>{signedPct(a.meanTarget / entry - 1)}</span>
        </Intel>
      )}
      {rated > 0 && a && (
        <Intel label="Ratings buy / hold / sell">
          <span className="flex items-center gap-2">
            <span className="flex h-1.5 w-16 overflow-hidden rounded-full bg-surface-3">
              <span className="bg-gain" style={{ width: `${(a.buy / rated) * 100}%` }} />
              <span className="bg-ink-tertiary" style={{ width: `${(a.hold / rated) * 100}%` }} />
              <span className="bg-loss" style={{ width: `${(a.sell / rated) * 100}%` }} />
            </span>
            {a.buy}/{a.hold}/{a.sell}
          </span>
        </Intel>
      )}
      {f.valuation?.peTtm != null && <Intel label="P/E ttm">{f.valuation.peTtm.toFixed(1)}</Intel>}
      {f.insiders && <Intel label="Insider filings 90d">{f.insiders.filings90d}</Intel>}
      {s && (
        <Intel label="Fear & Greed US / crypto">
          <span className={fgTone(s.usScore)}>{s.usScore.toFixed(0)}</span>
          {s.cryptoScore != null && (
            <>
              <span className="text-ink-tertiary"> / </span>
              <span className={fgTone(s.cryptoScore)}>{s.cryptoScore}</span>
            </>
          )}
        </Intel>
      )}
    </div>
  );
}

function fgTone(score: number) {
  return score < 40 ? "text-loss" : score > 60 ? "text-gain" : "text-ink";
}

function Intel({ label, tone, children }: { label: string; tone?: string; children: React.ReactNode }) {
  return (
    <div className="border-l border-hairline px-4 py-2.5">
      <div className="text-caption text-ink-tertiary">{label}</div>
      <div className={cn("num mt-0.5 flex items-center text-body-sm text-ink", tone)}>{children}</div>
    </div>
  );
}
