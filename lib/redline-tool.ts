import { runRedline } from "@/lib/redline";
import { encodeShare, sharePath } from "@/lib/share";
import { DEFAULT_PROFILE, type JuryResult, type TradeIntent, type Verdict } from "@/lib/types";

export type RedlineCard = {
  intent: TradeIntent;
  verdict: Verdict;
  jury: JuryResult;
  entryPrice: number;
  sharePath: string;
  ledgerHash: string | null;
};

/** One plain-English trade, through the same engine as the desk. Never places an order. */
export async function redlineTrade(text: string): Promise<RedlineCard> {
  let intent: TradeIntent | undefined;
  let verdict: Verdict | undefined;
  let jury: JuryResult | undefined;
  let entryPrice = 0;
  let ledgerHash: string | null = null;
  let failure: string | undefined;

  await runRedline({ text, profile: DEFAULT_PROFILE }, (event) => {
    if (event.type === "intent") intent = event.intent;
    if (event.type === "market") entryPrice = event.price;
    if (event.type === "verdict") {
      verdict = event.verdict;
      jury = event.jury;
    }
    if (event.type === "done") ledgerHash = event.ledgerHash ?? null;
    if (event.type === "error") failure = event.message;
  });

  if (!intent || !verdict || !jury) throw new Error(failure ?? "Redline did not finish");
  return { intent, verdict, jury, entryPrice, sharePath: sharePath(encodeShare(intent, verdict, jury)), ledgerHash };
}
