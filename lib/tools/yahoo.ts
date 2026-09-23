import type { Bar } from "@/lib/types";
import { cached, fetchJson } from "@/lib/net";

type ChartResponse = {
  chart: {
    result: {
      meta: { regularMarketPrice: number; currency: string; symbol: string };
      timestamp: number[];
      indicators: { quote: { open: (number | null)[]; high: (number | null)[]; low: (number | null)[]; close: (number | null)[]; volume: (number | null)[] }[] };
    }[] | null;
    error: { description: string } | null;
  };
};

export async function dailyHistory(symbol: string, range = "5y"): Promise<{ bars: Bar[]; lastPrice: number }> {
  return cached(`yahoo:${symbol}:${range}`, 15 * 60_000, async () => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d&includePrePost=false`;
    const json = await fetchJson<ChartResponse>(url, { timeoutMs: 15_000 });
    const r = json.chart.result?.[0];
    if (!r) throw new Error(json.chart.error?.description ?? `No history for ${symbol}`);
    const q = r.indicators.quote[0];
    const bars: Bar[] = [];
    r.timestamp.forEach((t, i) => {
      const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i];
      if (o == null || h == null || l == null || c == null) return;
      bars.push({ t: t * 1000, o, h, l, c, v: q.volume[i] ?? 0 });
    });
    return { bars, lastPrice: r.meta.regularMarketPrice };
  });
}
