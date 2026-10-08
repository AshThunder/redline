import { encodeShare } from "@/lib/share";
import type { JuryResult, TradeIntent, Verdict } from "@/lib/types";

/** A real Redline run from 23 Sep 2026. Numbers are from that session, not estimates. */
export const MU_QUERY = "Long MU 5x for 8 days, $2,000 margin, stop 7%, memory prices are turning up";

export const MU_INTENT: TradeIntent = {
  symbol: "MU",
  side: "long",
  notionalUsd: 10_000,
  leverage: 5,
  stopPct: 7,
  takeProfitPct: null,
  horizonDays: 8,
  catalyst: null,
  thesis: "Memory prices are turning up.",
};

export const MU_VERDICT: Verdict = {
  verdict: "resize",
  confidence: 0.95,
  headline: "Earnings in 6 days at 5x leverage blows your stop and account rules.",
  summary:
    "The $10,000 notional at 5x risks $700, 14% of a $5,000 account, on a 7% stop. Bitget's calendar puts Micron earnings on 29 Sep, inside the horizon, and a typical bad print of -14.5% jumps the stop.",
  deathModes: [
    {
      title: "Earnings gap through the stop",
      mechanism:
        "MU reports in 6 days. The 90th-percentile adverse reaction across past reports is -14.5%. At 5x that is a -72% drawdown on margin, about $1,449, and it fills past the 7% stop.",
      probability: "high",
      evidenceIds: ["E5", "E6", "E27"],
      tripwire: {
        metric: "news_keyword",
        operator: ">",
        threshold: "earnings",
        description: "Alert if the MU report date moves forward or guidance leaks inside 48 hours of the print.",
      },
    },
    {
      title: "Weekend gap jumps the stop",
      mechanism:
        "A 99th-percentile weekend gap of 8.3% fills past the 7% stop while NYSE is shut and the Bitget perp keeps trading.",
      probability: "medium",
      evidenceIds: ["E18", "E20"],
      tripwire: {
        metric: "gap_pct",
        operator: ">",
        threshold: 5,
        description: "Alert if MUUSDT gaps more than 5% against the position over a Friday-to-Monday window.",
      },
    },
    {
      title: "Stop chopped by ordinary noise",
      mechanism:
        "The 7% stop is tighter than 80% of historical adverse excursions on similar setups. A 3.2% median analog move already tests it.",
      probability: "medium",
      evidenceIds: ["E16", "E17"],
      tripwire: {
        metric: "drawdown_on_margin_pct",
        operator: ">",
        threshold: 25,
        description: "Alert if unrealized drawdown on margin exceeds 25%.",
      },
    },
  ],
  suggestedLeverage: 1,
  suggestedNotionalUsd: 1428,
  suggestedStopPct: 7,
  hedge: "Flatten or buy puts into 29 Sep if you hold through the print.",
};

export const MU_JURY: JuryResult = {
  votes: ["resize", "kill", "resize"],
  stability: 2 / 3,
};

export const MU_SHARE_TOKEN = encodeShare(MU_INTENT, MU_VERDICT, MU_JURY);
