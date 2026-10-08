"use client";

import { useEffect, useState } from "react";
import type { LedgerEntry, LedgerMark } from "@/lib/ledger";
import { usd } from "@/lib/format";

type Payload = { ok: boolean; brokenAt: number | null; entries: LedgerEntry[]; marks: LedgerMark[] };

export function LedgerView() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    fetch("/api/ledger")
      .then(async (res) => {
        if (!res.ok) throw new Error("Ledger unavailable");
        return (await res.json()) as Payload;
      })
      .then((json) => {
        if (!cancel) setData(json);
      })
      .catch((err: Error) => {
        if (!cancel) setError(err.message);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const marks = new Map(data?.marks.map((m) => [m.hash, m]) ?? []);

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8">
      <h1 className="text-headline font-medium">Ledger</h1>
      <p className="mt-2 max-w-[64ch] text-body-sm text-ink-muted">
        Every verdict is hashed when it is written. Each row includes the hash of the row before it. A later price scores the call. Kill should have lost, Proceed should have made money, Resize should have lost less than the original ticket.
      </p>
      {error && <p className="mt-4 text-body-sm text-loss">{error}</p>}
      {data && (
        <p className={`mt-4 text-caption ${data.ok ? "text-gain" : "text-loss"}`}>
          {data.ok ? `Chain intact · ${data.entries.length} verdict${data.entries.length === 1 ? "" : "s"}` : `Chain broken at row ${data.brokenAt}`}
        </p>
      )}
      <ol className="mt-6 space-y-3">
        {(data?.entries ?? []).map((entry) => {
          const mark = marks.get(entry.hash);
          return (
            <li key={entry.hash} className="panel px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-body-sm font-medium text-ink">
                  {entry.symbol} {entry.side} {entry.leverage}x
                  <span className="ml-2 capitalize text-ink-subtle">{entry.verdict}</span>
                </p>
                <time className="num text-caption text-ink-tertiary">{entry.at.slice(0, 16).replace("T", " ")} UTC</time>
              </div>
              <p className="mt-2 text-body-sm text-ink-muted">{entry.headline}</p>
              <p className="num mt-3 break-all text-caption text-ink-tertiary">{entry.hash}</p>
              {mark && (
                <p className="mt-2 text-caption text-ink-subtle">
                  Mark {mark.price.toFixed(2)} · {usd(mark.pnlOnMarginPct * (entry.notionalUsd / entry.leverage), { signed: true })} on margin ·{" "}
                  <span className={mark.aligned ? "text-gain" : "text-loss"}>{mark.aligned ? "Call held" : "Call missed"}</span>
                  {mark.final ? "" : " · horizon still open"}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
