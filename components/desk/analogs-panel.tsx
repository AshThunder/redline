"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalogResult, TradeIntent } from "@/lib/types";
import { cn, plainPct, signedPct } from "@/lib/format";

const AXIS = { stroke: "var(--color-ink-tertiary)", fontSize: 11, fontFamily: "var(--font-mono)" };

export function AnalogsPanel({ result, intent }: { result: AnalogResult; intent: TradeIntent }) {
  const pathData = useMemo(() => {
    const len = Math.max(...result.paths.map((p) => p.length));
    return Array.from({ length: len }, (_, d) => {
      const row: Record<string, number> = { d };
      const vals: number[] = [];
      result.paths.forEach((p, i) => {
        const v = p[Math.min(d, p.length - 1)];
        row[`p${i}`] = v * 100;
        vals.push(v);
      });
      vals.sort((a, b) => a - b);
      row.median = vals[Math.floor(vals.length / 2)] * 100;
      return row;
    });
  }, [result.paths]);

  const hist = useMemo(() => {
    const xs = result.finals.map((x) => x * 100);
    const lo = Math.floor(Math.min(...xs) / 10) * 10;
    const hi = Math.ceil(Math.max(...xs) / 10) * 10;
    const step = Math.max(5, Math.round((hi - lo) / 16 / 5) * 5);
    const bins: { x: number; n: number }[] = [];
    for (let b = lo; b < hi; b += step) bins.push({ x: b, n: xs.filter((v) => v >= b && v < b + step).length });
    return { bins, step };
  }, [result.finals]);

  const stats = [
    { label: "Win rate", value: plainPct(result.winRate, 0) },
    { label: "Median", value: signedPct(result.quantiles.p50), tone: result.quantiles.p50 },
    { label: "Bad case (p5)", value: signedPct(result.quantiles.p5), tone: result.quantiles.p5 },
    { label: "Good case (p95)", value: signedPct(result.quantiles.p95), tone: result.quantiles.p95 },
    { label: "Stop hit", value: result.stopHitProb != null ? plainPct(result.stopHitProb, 0) : "no stop" },
    { label: "Liquidated", value: plainPct(result.liquidationProb, 0), tone: result.liquidationProb > 0 ? -1 : 0 },
  ];

  return (
    <div className="space-y-4 p-4">
      <p className="text-caption text-ink-subtle">
        {result.sampleSize} non-overlapping moments in the last {result.lookbackYears} years that looked like today (momentum, volatility, RSI, distance from highs, Nasdaq and BTC trend).
        Each one replays your exact trade: {intent.side} {intent.leverage}x{intent.stopPct != null ? `, ${intent.stopPct}% stop` : ""}, {intent.horizonDays} days. Returns are on margin.
      </p>
      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-hairline bg-hairline lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-2 px-3 py-2.5">
            <dt className="text-caption text-ink-tertiary">{s.label}</dt>
            <dd className={cn("num mt-0.5 text-body-sm", s.tone == null ? "text-ink" : s.tone > 0 ? "text-gain" : s.tone < 0 ? "text-loss" : "text-ink")}>{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        <figure className="rounded-md border border-hairline bg-surface-2 p-3">
          <figcaption className="mb-2 flex items-center justify-between text-caption text-ink-subtle">
            <span>Counterfactual replay: {result.paths.length} equity paths</span>
            <span className="flex items-center gap-1.5"><span className="h-px w-4 bg-accent-ink" />median</span>
          </figcaption>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pathData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="var(--color-hairline)" vertical={false} />
                <XAxis dataKey="d" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(d) => `d${d}`} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <ReferenceLine y={0} stroke="var(--color-hairline-strong)" />
                {intent.stopPct != null && <ReferenceLine y={-intent.stopPct * intent.leverage} stroke="var(--color-caution)" strokeDasharray="3 3" />}
                <ReferenceLine y={-100} stroke="var(--color-loss)" strokeDasharray="3 3" />
                {result.paths.map((p, i) => (
                  <Line key={i} dataKey={`p${i}`} stroke={(p[p.length - 1] ?? 0) >= 0 ? "var(--color-gain)" : "var(--color-loss)"} strokeOpacity={0.35} strokeWidth={1} dot={false} isAnimationActive={false} />
                ))}
                <Line dataKey="median" stroke="var(--color-accent-ink)" strokeWidth={2} dot={false} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>

        <figure className="rounded-md border border-hairline bg-surface-2 p-3">
          <figcaption className="mb-2 text-caption text-ink-subtle">Outcome distribution (return on margin)</figcaption>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist.bins} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid stroke="var(--color-hairline)" vertical={false} />
                <XAxis dataKey="x" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "var(--color-surface-3)", fillOpacity: 0.5 }}
                  contentStyle={{ background: "var(--color-surface-1)", border: "1px solid var(--color-hairline-strong)", color: "var(--color-ink)", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(v) => `${v}% to ${Number(v) + hist.step}%`}
                  formatter={(v) => [`${v} analogs`, ""]}
                />
                <Bar dataKey="n" radius={[3, 3, 0, 0]}>
                  {hist.bins.map((b) => (
                    <Cell key={b.x} fill={b.x + hist.step <= 0 ? "var(--color-loss)" : b.x >= 0 ? "var(--color-gain)" : "var(--color-ink-tertiary)"} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </figure>
      </div>

      <div>
        <h4 className="mb-2 text-caption text-ink-subtle">Closest historical matches</h4>
        <div className="overflow-hidden rounded-md border border-hairline">
          <table className="w-full text-body-sm">
            <thead className="bg-surface-2 text-caption text-ink-tertiary">
              <tr>
                <th className="px-3 py-2 text-left font-normal">Date</th>
                <th className="px-3 py-2 text-right font-normal">Similarity</th>
                <th className="px-3 py-2 text-right font-normal">Worst drawdown</th>
                <th className="px-3 py-2 text-right font-normal">Result on margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {result.topAnalogs.map((a) => (
                <tr key={a.date}>
                  <td className="num px-3 py-2 text-ink-muted">{a.date}</td>
                  <td className="num px-3 py-2 text-right text-ink-subtle">{plainPct(a.similarity, 0)}</td>
                  <td className="num px-3 py-2 text-right text-ink-subtle">{signedPct(-a.maePct)}</td>
                  <td className={cn("num px-3 py-2 text-right", a.returnPct >= 0 ? "text-gain" : "text-loss")}>{signedPct(a.returnPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
