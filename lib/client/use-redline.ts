"use client";

import { useCallback, useRef, useState } from "react";
import type {
  AnalogResult,
  BitgetData,
  DebateTurn,
  Evidence,
  GapRisk,
  JuryResult,
  PerpSnapshot,
  RedlineEvent,
  RuleProfile,
  RuleViolation,
  StressResult,
  TraceStatus,
  TradeIntent,
  Verdict,
} from "@/lib/types";

export type TraceStep = { id: string; label: string; status: TraceStatus; detail?: string; ms?: number };

export type RedlineState = {
  status: "idle" | "running" | "done" | "error";
  query: string;
  steps: TraceStep[];
  intent?: TradeIntent;
  market?: { price: number; source: string; perp: PerpSnapshot | null; series: { t: number; c: number }[] };
  fundamentals?: BitgetData;
  evidence: Evidence[];
  analogs?: AnalogResult;
  gaps?: GapRisk;
  stress?: StressResult;
  violations: RuleViolation[];
  debate: DebateTurn[];
  verdict?: Verdict;
  jury?: JuryResult;
  error?: string;
  runId?: string;
  ms?: number;
  startedAt?: number;
};

const EMPTY: RedlineState = { status: "idle", query: "", steps: [], evidence: [], violations: [], debate: [] };

function reduce(s: RedlineState, e: RedlineEvent): RedlineState {
  switch (e.type) {
    case "step": {
      const i = s.steps.findIndex((x) => x.id === e.id);
      const next = { id: e.id, label: e.label, status: e.status, detail: e.detail, ms: e.ms };
      const steps = i === -1 ? [...s.steps, next] : s.steps.map((x, j) => (j === i ? next : x));
      return { ...s, steps };
    }
    case "intent":
      return { ...s, intent: e.intent };
    case "market":
      return { ...s, market: { price: e.price, source: e.source, perp: e.perp, series: e.series } };
    case "fundamentals":
      return { ...s, fundamentals: e.data };
    case "evidence":
      return { ...s, evidence: e.evidence };
    case "analogs":
      return { ...s, analogs: e.result };
    case "gaps":
      return { ...s, gaps: e.result };
    case "stress":
      return { ...s, stress: e.result };
    case "rules":
      return { ...s, violations: e.violations };
    case "debate":
      return { ...s, debate: [...s.debate.filter((d) => d.role !== e.turn.role), e.turn] };
    case "verdict":
      return { ...s, verdict: e.verdict, jury: e.jury };
    case "error":
      return { ...s, status: "error", error: e.message };
    case "done":
      return { ...s, status: s.status === "error" ? "error" : "done", runId: e.id, ms: e.ms };
  }
}

export function useRedline() {
  const [state, setState] = useState<RedlineState>(EMPTY);
  const abort = useRef<AbortController | null>(null);

  const run = useCallback(async (text: string, profile: RuleProfile) => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setState({ ...EMPTY, status: "running", query: text, startedAt: Date.now() });
    try {
      const res = await fetch("/api/redline", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, profile }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
        setState((s) => ({ ...s, status: "error", error: body.error }));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (line) setState((s) => reduce(s, JSON.parse(line) as RedlineEvent));
        }
      }
      setState((s) => (s.status === "running" ? { ...s, status: s.verdict ? "done" : "error", error: s.verdict ? undefined : "The run ended before a verdict" } : s));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState((s) => ({ ...s, status: "error", error: (err as Error).message }));
    }
  }, []);

  const reset = useCallback(() => {
    abort.current?.abort();
    setState(EMPTY);
  }, []);

  return { state, run, reset };
}
