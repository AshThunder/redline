import { beta, returnsByDay } from "@/lib/quant";
import { assemblePortfolio, type BookLine, type PortfolioReport } from "@/lib/portfolio";
import { perpSnapshot } from "@/lib/tools/bitget";
import { dailyHistory } from "@/lib/tools/yahoo";

export async function runPortfolio(book: BookLine[], source: PortfolioReport["source"]): Promise<PortfolioReport> {
  const symbols = [...new Set(book.map((l) => l.symbol.toUpperCase()))];
  const [qqq, btc, snaps] = await Promise.all([
    dailyHistory("QQQ"),
    dailyHistory("BTC-USD"),
    Promise.all(
      symbols.map(async (symbol) => {
        const [hist, perp] = await Promise.all([dailyHistory(symbol), perpSnapshot(symbol).catch(() => null)]);
        return { symbol, bars: hist.bars, lastPrice: perp?.lastPrice ?? hist.lastPrice };
      }),
    ),
  ]);
  const qRet = returnsByDay(qqq.bars);
  const bRet = returnsByDay(btc.bars);
  const betas = snaps.map((s) => {
    const own = returnsByDay(s.bars);
    return { symbol: s.symbol, betaQqq: beta(own, qRet), betaBtc: beta(own, bRet) };
  });
  return assemblePortfolio(book, snaps, betas, source);
}
