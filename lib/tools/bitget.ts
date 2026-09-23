import type { PerpSnapshot } from "@/lib/types";
import { cached, fetchJson } from "@/lib/net";

const BASE = process.env.BITGET_REST_BASE ?? "https://api.bitget.com";
const PRODUCT = "USDT-FUTURES";

type Envelope<T> = { code: string; msg: string; data: T };

type Contract = { symbol: string; baseCoin: string; quoteCoin: string; symbolStatus: string; isRwa?: string };

type Ticker = {
  symbol: string;
  lastPr: string;
  markPrice?: string;
  fundingRate?: string;
  change24h?: string;
  usdtVolume?: string;
  quoteVolume?: string;
};

type Depth = { asks: [string, string][]; bids: [string, string][] };

async function get<T>(path: string, timeoutMs = 8_000): Promise<T> {
  const json = await fetchJson<Envelope<T>>(`${BASE}${path}`, { timeoutMs });
  if (json.code !== "00000") throw new Error(`Bitget ${json.code}: ${json.msg}`);
  return json.data;
}

export async function contracts(): Promise<Contract[]> {
  return cached("bitget:contracts", 60 * 60_000, () => get<Contract[]>(`/api/v2/mix/market/contracts?productType=${PRODUCT}`, 12_000));
}

/** Resolve a US ticker (e.g. NVDA) to Bitget's tokenized-stock perpetual symbol. */
export async function resolvePerp(ticker: string): Promise<string | null> {
  const all = await contracts();
  const t = ticker.toUpperCase();
  const live = all.filter((c) => c.symbolStatus === "normal" && c.quoteCoin === "USDT");
  const exact = live.find((c) => c.baseCoin.toUpperCase() === t);
  if (exact) return exact.symbol;
  const rwa = live.find((c) => c.isRwa === "YES" && c.baseCoin.toUpperCase().startsWith(t));
  return rwa?.symbol ?? null;
}

export async function perpSnapshot(ticker: string): Promise<PerpSnapshot | null> {
  const symbol = await resolvePerp(ticker);
  if (!symbol) return null;
  const [tickers, depth] = await Promise.all([
    get<Ticker[]>(`/api/v2/mix/market/ticker?symbol=${symbol}&productType=${PRODUCT}`),
    get<Depth>(`/api/v2/mix/market/merge-depth?symbol=${symbol}&productType=${PRODUCT}&limit=50`).catch(() => null),
  ]);
  const tk = tickers[0];
  const last = Number(tk.lastPr);
  const sum = (rows: [string, string][]) => rows.reduce((s, [p, q]) => s + Number(p) * Number(q), 0);
  const bestBid = depth?.bids[0] ? Number(depth.bids[0][0]) : null;
  const bestAsk = depth?.asks[0] ? Number(depth.asks[0][0]) : null;
  return {
    symbol,
    lastPrice: last,
    markPrice: tk.markPrice ? Number(tk.markPrice) : null,
    fundingRate: tk.fundingRate != null ? Number(tk.fundingRate) : null,
    change24hPct: tk.change24h != null ? Number(tk.change24h) * 100 : null,
    volume24hUsd: tk.usdtVolume ? Number(tk.usdtVolume) : tk.quoteVolume ? Number(tk.quoteVolume) : null,
    bidDepthUsd: depth ? sum(depth.bids) : null,
    askDepthUsd: depth ? sum(depth.asks) : null,
    spreadBps: bestBid && bestAsk ? ((bestAsk - bestBid) / ((bestAsk + bestBid) / 2)) * 10_000 : null,
  };
}
