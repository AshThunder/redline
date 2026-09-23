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
            <h2 className="text-card-title font-semibold">{intent.symbol}</h2>
            <span className="text-caption text-ink-tertiary">{perp ? perp.symbol : "rToken perp"}</span>
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
                    <stop offset="0%" stopColor="#1fd5e0" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#1fd5e0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Area type="monotone" dataKey="c" stroke="#1fd5e0" strokeWidth={1.25} fill="url(#spark)" isAnimationActive={false} />
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
    </section>
  );
}
