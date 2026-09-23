"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_PROFILE, type RuleProfile, type TradeIntent, type Verdict } from "@/lib/types";

export type JournalEntry = {
  id: string;
  at: number;
  query: string;
  intent: TradeIntent;
  entryPrice: number;
  verdict: Verdict;
  stability: number;
  decision: "taken" | "skipped" | "pending";
};

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  try {
    value = raw ? (JSON.parse(raw) as T) : fallback;
  } catch {}
  cache.set(key, { raw, value });
  return value;
}

function write<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = () => l();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

function useStored<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(subscribe, () => read(key, fallback), () => fallback);
  const set = useCallback((v: T | ((prev: T) => T)) => {
    const prev = read(key, fallback);
    write(key, typeof v === "function" ? (v as (p: T) => T)(prev) : v);
  }, [key, fallback]);
  return [value, set] as const;
}

const EMPTY_JOURNAL: JournalEntry[] = [];

export function useProfile() {
  return useStored<RuleProfile>("redline.profile", DEFAULT_PROFILE);
}

export function useJournal() {
  return useStored<JournalEntry[]>("redline.journal", EMPTY_JOURNAL);
}

export type Theme = "day" | "night";

/** Keep in sync with the pre-paint script in app/layout.tsx, which applies the stored theme before hydration. */
export const THEME_KEY = "redline.theme";

export function useTheme() {
  const [theme, setStored] = useStored<Theme>(THEME_KEY, "day");
  const set = useCallback(
    (t: Theme) => {
      document.documentElement.dataset.theme = t;
      setStored(t);
    },
    [setStored],
  );
  return [theme, set] as const;
}
