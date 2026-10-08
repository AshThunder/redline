import { liquidationMove } from "@/lib/analogs";
import { corr, returnsByDay } from "@/lib/quant";
import type { Bar } from "@/lib/types";

export type BookLine = {
  symbol: string;
  side: "long" | "short";
  notionalUsd: number;
  leverage: number;
};

export type LineSnapshot = {
  symbol: string;
  bars: Bar[];
  lastPrice: number;
};

const SECTORS: Record<string, string> = {
  MU: "Semiconductors",
  NVDA: "Semiconductors",
  AMD: "Semiconductors",
  AVGO: "Semiconductors",
  TSM: "Semiconductors",
  ASML: "Semiconductors",
  ARM: "Semiconductors",
  AAPL: "Mega-cap tech",
  MSFT: "Mega-cap tech",
  GOOGL: "Mega-cap tech",
  GOOG: "Mega-cap tech",
  META: "Mega-cap tech",
  AMZN: "Consumer",
  TSLA: "Consumer",
  COIN: "Crypto proxies",
  MSTR: "Crypto proxies",
  MARA: "Crypto proxies",
  HOOD: "Crypto proxies",
};

export function sectorOf(symbol: string): string {
  return SECTORS[symbol.toUpperCase()] ?? "Other";
}

export type PortfolioLine = {
  symbol: string;
  side: "long" | "short";
  notionalUsd: number;
  leverage: number;
  marginUsd: number;
  lastPrice: number;
  betaQqq: number;
  betaBtc: number;
  weight: number;
  sector: string;
  liquidationMovePct: number;
  liquidationPrice: number;
};

export type PortfolioReport = {
  source: "journal" | "sample" | "custom";
  lines: PortfolioLine[];
  grossUsd: number;
  netUsd: number;
  marginUsd: number;
  betaQqq: number;
  betaBtc: number;
  sectors: { name: string; notionalUsd: number; weight: number }[];
  pairs: { a: string; b: string; corr: number }[];
  liquidations: { symbol: string; price: number; distancePct: number }[];
  shocks: { id: string; name: string; pnlUsd: number; pnlOnMarginPct: number }[];
  hedges: string[];
};

function sign(side: BookLine["side"]) {
  return side === "long" ? 1 : -1;
}

export function assemblePortfolio(
  book: BookLine[],
  snaps: LineSnapshot[],
  betas: { symbol: string; betaQqq: number; betaBtc: number }[],
  source: PortfolioReport["source"],
): PortfolioReport {
  const gross = book.reduce((s, l) => s + l.notionalUsd, 0);
  const bySym = new Map(snaps.map((s) => [s.symbol.toUpperCase(), s]));
  const byBeta = new Map(betas.map((b) => [b.symbol.toUpperCase(), b]));
  const lines: PortfolioLine[] = book.map((line) => {
    const snap = bySym.get(line.symbol.toUpperCase());
    const b = byBeta.get(line.symbol.toUpperCase());
    const price = snap?.lastPrice ?? 0;
    const liq = liquidationMove(line.leverage);
    const dir = sign(line.side);
    return {
      symbol: line.symbol.toUpperCase(),
      side: line.side,
      notionalUsd: line.notionalUsd,
      leverage: line.leverage,
      marginUsd: line.notionalUsd / line.leverage,
      lastPrice: price,
      betaQqq: b?.betaQqq ?? 1,
      betaBtc: b?.betaBtc ?? 0,
      weight: gross > 0 ? line.notionalUsd / gross : 0,
      sector: sectorOf(line.symbol),
      liquidationMovePct: liq,
      liquidationPrice: price * (1 - dir * liq),
    };
  });

  const net = lines.reduce((s, l) => s + sign(l.side) * l.notionalUsd, 0);
  const margin = lines.reduce((s, l) => s + l.marginUsd, 0);
  const wBeta = (pick: (l: PortfolioLine) => number) => lines.reduce((s, l) => s + (l.notionalUsd / (gross || 1)) * sign(l.side) * pick(l), 0);

  const sectorMap = new Map<string, number>();
  for (const l of lines) sectorMap.set(l.sector, (sectorMap.get(l.sector) ?? 0) + l.notionalUsd);
  const sectors = [...sectorMap.entries()]
    .map(([name, notionalUsd]) => ({ name, notionalUsd, weight: gross > 0 ? notionalUsd / gross : 0 }))
    .sort((a, b) => b.notionalUsd - a.notionalUsd);

  const ret = new Map(snaps.map((s) => [s.symbol.toUpperCase(), returnsByDay(s.bars)]));
  const pairs: PortfolioReport["pairs"] = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const a = ret.get(lines[i].symbol);
      const b = ret.get(lines[j].symbol);
      if (!a || !b) continue;
      pairs.push({ a: lines[i].symbol, b: lines[j].symbol, corr: corr(a, b) });
    }
  }
  pairs.sort((x, y) => Math.abs(y.corr) - Math.abs(x.corr));

  const shock = (id: string, name: string, moveFor: (l: PortfolioLine) => number) => {
    const pnlUsd = lines.reduce((s, l) => s + sign(l.side) * l.notionalUsd * moveFor(l), 0);
    return { id, name, pnlUsd, pnlOnMarginPct: margin > 0 ? pnlUsd / margin : 0 };
  };
  const shocks = [
    shock("nasdaq", "Nasdaq −3%", (l) => l.betaQqq * -0.03),
    shock("btc", "BTC −12%", (l) => l.betaBtc * -0.12),
    shock("gap", "Every name −8%", () => -0.08),
  ];

  const betaQqq = wBeta((l) => l.betaQqq);
  const betaBtc = wBeta((l) => l.betaBtc);
  const hedges: string[] = [];
  const top = sectors[0];
  if (top && top.weight >= 0.4) {
    hedges.push(`${top.name} is ${(top.weight * 100).toFixed(0)}% of gross. Cut the largest name in that sector before adding another.`);
  }
  if (betaQqq > 1) {
    const driver = [...lines].sort((a, b) => sign(b.side) * b.notionalUsd * b.betaQqq - sign(a.side) * a.notionalUsd * a.betaQqq)[0];
    const excess = (betaQqq - 1) * gross;
    hedges.push(`Book beta to QQQ is ${betaQqq.toFixed(2)}. ${driver?.symbol ?? "The largest line"} carries most of it. A QQQ hedge of about $${Math.round(excess).toLocaleString()} notional would bring the book back to 1.`);
  }
  if (betaBtc > 0.3) {
    hedges.push(`BTC beta is ${betaBtc.toFixed(2)}. A −12% crypto flush is already in the shock book. Do not add another crypto proxy on top.`);
  }
  const tight = [...lines].sort((a, b) => a.liquidationMovePct - b.liquidationMovePct)[0];
  if (tight && tight.liquidationMovePct < 0.12) {
    hedges.push(`${tight.symbol} liquidates on a ${(tight.liquidationMovePct * 100).toFixed(1)}% adverse move, at ${tight.liquidationPrice.toFixed(2)}. That is the first line to resize.`);
  }
  const hot = pairs.filter((p) => p.corr >= 0.7);
  if (hot.length) {
    hedges.push(`${hot.map((p) => `${p.a}/${p.b} (${p.corr.toFixed(2)})`).join(", ")} move together. They are one bet, not a diversifier.`);
  }
  if (!hedges.length) hedges.push("No single factor dominates this book. The shock table is the constraint, not concentration.");

  return {
    source,
    lines,
    grossUsd: gross,
    netUsd: net,
    marginUsd: margin,
    betaQqq,
    betaBtc,
    sectors,
    pairs: pairs.slice(0, 6),
    liquidations: [...lines]
      .sort((a, b) => a.liquidationMovePct - b.liquidationMovePct)
      .map((l) => ({ symbol: l.symbol, price: l.liquidationPrice, distancePct: l.liquidationMovePct })),
    shocks,
    hedges,
  };
}
