"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWatches } from "@/lib/client/storage";
import type { Watch } from "@/lib/watchtower";

const INTERVAL = 20_000;

export function useWatchtower() {
  const [watches, setWatches] = useWatches();
  const [telegram, setTelegram] = useState(false);
  const [checking, setChecking] = useState(false);
  const watchesRef = useRef(watches);
  const busy = useRef(false);
  watchesRef.current = watches;

  const tick = useCallback(async () => {
    const current = watchesRef.current;
    if (busy.current || current.every((w) => w.status !== "armed")) return;
    busy.current = true;
    setChecking(true);
    try {
      const res = await fetch("/api/watchtower/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watches: current }),
      });
      if (!res.ok) return;
      const body = (await res.json()) as { watches: Watch[]; telegram?: boolean };
      setTelegram(Boolean(body.telegram));
      if (Array.isArray(body.watches)) setWatches(body.watches);
    } catch {
      // Keep the last reading. The next interval retries.
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }, [setWatches]);

  useEffect(() => {
    fetch("/api/watchtower/check")
      .then((r) => r.json())
      .then((b: { telegram?: boolean }) => setTelegram(Boolean(b.telegram)))
      .catch(() => {});
  }, []);

  const armedKey = watches
    .filter((w) => w.status === "armed")
    .map((w) => w.id)
    .join(",");

  useEffect(() => {
    if (!armedKey) return;
    void tick();
    const id = setInterval(() => {
      void tick();
    }, INTERVAL);
    return () => clearInterval(id);
  }, [armedKey, tick]);

  const dismiss = useCallback(
    (id: string) => setWatches((prev) => prev.map((w) => (w.id === id ? { ...w, status: "dismissed" } : w))),
    [setWatches],
  );

  const arm = useCallback(
    (next: Watch[]) => {
      setWatches((prev) => {
        const drop = new Set(next.map((w) => w.journalId));
        return [...next, ...prev.filter((w) => !drop.has(w.journalId))];
      });
    },
    [setWatches],
  );

  return {
    watches,
    armed: watches.filter((w) => w.status === "armed"),
    tripped: watches.filter((w) => w.status === "tripped"),
    telegram,
    checking,
    tick,
    dismiss,
    arm,
    setWatches,
  };
}
