"use client";

import { useState } from "react";
import { Plus, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/client/storage";
import { DEFAULT_PROFILE, type RuleProfile } from "@/lib/types";

const FIELDS: { key: keyof Omit<RuleProfile, "custom">; label: string; help: string; suffix: string; step: number }[] = [
  { key: "accountUsd", label: "Agentic account size", help: "What you have transferred to your Bitget Agentic account.", suffix: "USD", step: 100 },
  { key: "maxRiskPerTradePct", label: "Max risk per trade", help: "Loss at your stop, as a share of the account.", suffix: "%", step: 0.5 },
  { key: "maxLeverage", label: "Max leverage", help: "Hard ceiling on any position.", suffix: "x", step: 1 },
  { key: "maxLeverageIntoEvent", label: "Max leverage into events", help: "Earnings, CPI, FOMC and other scheduled catalysts.", suffix: "x", step: 1 },
  { key: "maxWeekendLeverage", label: "Max leverage over weekends", help: "The rToken trades while NYSE is shut. Weekend news hits first.", suffix: "x", step: 1 },
];

export function RulesEditor() {
  const [profile, setProfile] = useProfile();
  const [draft, setDraft] = useState("");

  const update = (key: keyof RuleProfile, value: number) => setProfile((p) => ({ ...p, [key]: value }));

  return (
    <div className="mx-auto max-w-[760px] px-5 py-8">
      <h1 className="text-headline font-semibold">Your rules</h1>
      <p className="mt-1 text-body-sm text-ink-subtle">Redline checks every trade against these before the debate starts, and the Risk Officer argues from them. Stored in this browser only.</p>

      <div className="panel mt-6 divide-y divide-hairline">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex items-center gap-6 px-5 py-4">
            <span className="flex-1">
              <span className="block text-body-sm text-ink">{f.label}</span>
              <span className="block text-caption text-ink-subtle">{f.help}</span>
            </span>
            <span className="flex h-9 w-40 items-center rounded-md border border-hairline bg-canvas px-3 focus-within:border-hairline-strong">
              <input
                type="number"
                min={0}
                step={f.step}
                value={profile[f.key]}
                onChange={(e) => update(f.key, Number(e.target.value))}
                className="num w-full bg-transparent text-right text-body-sm text-ink outline-none"
              />
              <span className="ml-2 text-caption text-ink-tertiary">{f.suffix}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="panel mt-4 p-5">
        <h2 className="text-body-sm text-ink">Custom rules</h2>
        <p className="text-caption text-ink-subtle">Plain language. The Risk Officer reads these, for example "No new longs after three losing trades in a row".</p>
        <ul className="mt-3 space-y-2">
          {profile.custom.map((c) => (
            <li key={c} className="flex items-center gap-2 rounded-md border border-hairline bg-surface-2 px-3 py-2 text-body-sm text-ink-muted">
              <span className="flex-1">{c}</span>
              <button aria-label={`Remove ${c}`} onClick={() => setProfile((p) => ({ ...p, custom: p.custom.filter((x) => x !== c) }))} className="text-ink-tertiary hover:text-ink">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = draft.trim();
            if (!v) return;
            setProfile((p) => ({ ...p, custom: [...p.custom.filter((x) => x !== v), v] }));
            setDraft("");
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="New custom rule"
            placeholder="Add a rule"
            className="h-9 flex-1 rounded-md border border-hairline bg-canvas px-3 text-body-sm text-ink outline-none placeholder:text-ink-tertiary focus:border-hairline-strong"
          />
          <Button type="submit" variant="secondary">
            <Plus size={14} /> Add
          </Button>
        </form>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="tertiary" size="sm" onClick={() => setProfile(DEFAULT_PROFILE)}>
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
