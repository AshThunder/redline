import { callTool } from "@/lib/tools/mcp";
import { cached } from "@/lib/net";

/** Typed wrappers over the Bitget market-data MCP catalog (guide / do_query). */

type Envelope<T> = { success: boolean; status_code: number; data: { results?: T[] } | "" };

async function query<T>(entryId: string, params: Record<string, unknown>, timeoutMs = 20_000): Promise<T[]> {
  const text = await callTool("do_query", { entry_id: entryId, params }, timeoutMs);
  const json = JSON.parse(text) as Envelope<T>;
  if (!json.success) throw new Error(`${entryId} failed (${json.status_code})`);
  return typeof json.data === "object" && json.data.results ? json.data.results : [];
}

export type Quote = { lastPrice: number; changePct: number; marketCapUsd: number | null; pb: number | null };

export async function quote(symbol: string): Promise<Quote | null> {
  const [r] = await query<{ last_price: number; change_percent: number; total_market_cap?: number; pb?: number }>("equity_price_quote", { symbol });
  return r ? { lastPrice: r.last_price, changePct: r.change_percent, marketCapUsd: r.total_market_cap ?? null, pb: r.pb ?? null } : null;
}

type CalendarRow = {
  period_ending: string;
  report_type_name: string;
  is_trading_time?: string | null;
  perf_report_dsclsr_date: string | null;
  perf_brief_dsclsr_date: string | null;
  perf_briefing_fore_dsclsr_date: string | null;
  perf_report_fore_dsclsr_date: string | null;
};

export type Earnings = { next: string | null; daysUntil: number | null; nextIsEstimate: boolean; timing: "after-close" | "pre-market" | "unknown"; past: string[] };

const DAY = 86_400_000;

export async function earnings(symbol: string): Promise<Earnings> {
  return cached(`bgd:cal:${symbol}`, 6 * 3600_000, async () => {
    const rows = await query<CalendarRow>("equity_calendar", { symbol });
    const dates = new Set<string>();
    let timing: Earnings["timing"] = "unknown";
    for (const r of rows) {
      const d = r.perf_report_dsclsr_date ?? r.perf_brief_dsclsr_date ?? r.perf_briefing_fore_dsclsr_date ?? r.perf_report_fore_dsclsr_date;
      if (d) dates.add(d.slice(0, 10));
      if (r.is_trading_time === "盘后") timing = "after-close";
      else if (r.is_trading_time === "盘前") timing = "pre-market";
    }
    const today = new Date().toISOString().slice(0, 10);
    const sorted = [...dates].sort();
    const past = sorted.filter((d) => d < today);
    let next = sorted.find((d) => d >= today) ?? null;
    let nextIsEstimate = false;
    if (!next && past.length >= 2) {
      // Not yet announced: project the median spacing of recent reports forward from the last one.
      const gaps = past.slice(-5).map((d, i, a) => (i ? Date.parse(d) - Date.parse(a[i - 1]) : 0)).slice(1).sort((x, y) => x - y);
      const step = gaps[Math.floor(gaps.length / 2)];
      let t = Date.parse(past[past.length - 1]) + step;
      while (t < Date.parse(today)) t += step;
      next = new Date(t).toISOString().slice(0, 10);
      nextIsEstimate = true;
    }
    return {
      next,
      daysUntil: next ? Math.round((Date.parse(next) - Date.parse(today)) / DAY) : null,
      nextIsEstimate,
      timing,
      past,
    };
  });
}

const RATING: Record<string, "buy" | "hold" | "sell"> = {
  买入: "buy", 强力买入: "buy", 强烈推荐: "buy", 增持: "buy", 推荐: "buy", 谨慎增持: "buy", 跑赢行业: "buy", 跑赢大盘: "buy", 优于大市: "buy", 表现优于大市: "buy", 超配: "buy",
  中性: "hold", 持有: "hold", 同步大市: "hold", 与大市同步: "hold", 市场表现: "hold", 标配: "hold", 同步行业: "hold",
  减持: "sell", 卖出: "sell", 跑输行业: "sell", 跑输大盘: "sell", 逊于大市: "sell", 弱于大市: "sell", 表现不佳: "sell", 低配: "sell",
};

export type Analysts = { count90d: number; meanTarget: number | null; highTarget: number | null; lowTarget: number | null; buy: number; hold: number; sell: number; latest: { firm: string; target: number | null; rating: string; date: string }[] };

export async function analysts(symbol: string): Promise<Analysts> {
  const rows = await query<{ published_date: string; analyst_firm: string; price_target: number | null; rating_current: string | null; action?: string }>("equity_estimates_price_target", { symbol, limit: 60 });
  const cutoff = new Date(Date.now() - 90 * DAY).toISOString().slice(0, 10);
  const recent = rows.filter((r) => r.published_date >= cutoff);
  const targets = recent.map((r) => r.price_target).filter((x): x is number => x != null && x > 0);
  const tally = { buy: 0, hold: 0, sell: 0 };
  for (const r of recent) {
    const k = r.rating_current ? RATING[r.rating_current] : undefined;
    if (k) tally[k]++;
  }
  return {
    count90d: recent.length,
    meanTarget: targets.length ? targets.reduce((s, x) => s + x, 0) / targets.length : null,
    highTarget: targets.length ? Math.max(...targets) : null,
    lowTarget: targets.length ? Math.min(...targets) : null,
    ...tally,
    latest: recent.slice(0, 5).map((r) => ({ firm: r.analyst_firm, target: r.price_target, rating: r.rating_current ? RATING[r.rating_current] ?? r.rating_current : "n/a", date: r.published_date })),
  };
}

export type Insiders = { filings90d: number; latest: { name: string; role: string | null; date: string }[] };

export async function insiders(symbol: string): Promise<Insiders> {
  const rows = await query<{ owner_name: string; ownership_type: string | null; filing_date: string }>("equity_ownership_insider_trading", { symbol, limit: 30 });
  const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
  const recent = rows.filter((r) => r.filing_date >= cutoff);
  return { filings90d: recent.length, latest: recent.slice(0, 3).map((r) => ({ name: r.owner_name, role: r.ownership_type, date: r.filing_date })) };
}

export type Valuation = { peTtm: number | null; psTtm: number | null; pbMrq: number | null; divYieldPct: number | null };

export async function valuation(symbol: string): Promise<Valuation | null> {
  const [r] = await query<{ pe_ttm_ed?: number; ps_ttm_ed?: number; pb_mrq?: number; div_yield_12m?: number }>("equity_fundamental_ratios", { symbol, limit: 1 });
  return r ? { peTtm: r.pe_ttm_ed ?? null, psTtm: r.ps_ttm_ed ?? null, pbMrq: r.pb_mrq ?? null, divYieldPct: r.div_yield_12m ?? null } : null;
}

export type Sentiment = { usScore: number; usRating: string; usWeekAgo: number | null; cryptoScore: number | null; cryptoRating: string | null };

export async function sentiment(): Promise<Sentiment> {
  return cached("bgd:sentiment", 15 * 60_000, async () => {
    const [[us], [crypto]] = await Promise.all([
      query<{ score: number; rating: string; previous_1_week?: number }>("sentiment_market_fear_greed", {}),
      query<{ value: number; classification: string }>("crypto_sentiment_crypto_fear_greed", { limit: 1 }).catch(() => []),
    ]);
    return {
      usScore: us.score,
      usRating: us.rating,
      usWeekAgo: us.previous_1_week ?? null,
      cryptoScore: crypto?.value ?? null,
      cryptoRating: crypto?.classification ?? null,
    };
  });
}

export type BitgetData = {
  quote: Quote | null;
  earnings: Earnings | null;
  analysts: Analysts | null;
  insiders: Insiders | null;
  valuation: Valuation | null;
  sentiment: Sentiment | null;
  sources: string[];
};

export async function bitgetData(symbol: string): Promise<BitgetData> {
  const settle = async <T>(p: Promise<T>) => {
    try {
      return await p;
    } catch {
      return null;
    }
  };
  const [q, e, a, i, v, s] = await Promise.all([settle(quote(symbol)), settle(earnings(symbol)), settle(analysts(symbol)), settle(insiders(symbol)), settle(valuation(symbol)), settle(sentiment())]);
  const sources = [q && "quote", e && "earnings calendar", a && "analyst targets", i && "insider filings", v && "valuation", s && "fear & greed"].filter(Boolean) as string[];
  if (sources.length === 0) throw new Error("Bitget market-data MCP returned nothing");
  return { quote: q, earnings: e, analysts: a, insiders: i, valuation: v, sentiment: s, sources };
}
