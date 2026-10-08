"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Stop } from "@phosphor-icons/react";
import { Button, Kbd } from "@/components/ui/button";
import { EXAMPLES } from "@/components/desk/examples";
import { cn } from "@/lib/format";

export function Composer({
  initial,
  running,
  compact,
  onSubmit,
  onStop,
}: {
  initial?: string;
  running: boolean;
  compact: boolean;
  onSubmit: (text: string) => void;
  onStop: () => void;
}) {
  const [text, setText] = useState(initial ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initial) setText(initial);
  }, [initial]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const submit = () => {
    const t = text.trim();
    if (t && !running) onSubmit(t);
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "overflow-hidden bg-surface-1 transition-[border-color] duration-150",
          compact ? "panel flex items-end gap-2 rounded-lg p-2 pl-4 focus-within:border-hairline-strong" : "rounded-xl border-2 border-ink focus-within:border-accent-ink",
        )}
      >
        {!compact && <div aria-hidden className="h-1 bg-accent" />}
        <div className={cn("flex items-end gap-2", compact ? "min-w-0 flex-1" : "flex-col p-3 sm:flex-row sm:pl-5")}>
          <textarea
            ref={ref}
            value={text}
            rows={compact ? 1 : 2}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            aria-label="Trade idea"
            placeholder="Describe the trade. Ticker, side, size, leverage, stop, and why."
            className={cn(
              "min-w-0 flex-1 resize-none bg-transparent text-ink outline-none",
              compact ? "min-h-9 py-2 text-body-sm placeholder:text-ink-tertiary" : "min-h-16 py-2 text-body-lg placeholder:text-ink-subtle",
            )}
          />
          {running ? (
            <Button variant="secondary" size={compact ? "md" : "lg"} onClick={onStop} aria-label="Stop" className="shrink-0">
              <Stop size={14} weight="fill" />
              Stop
            </Button>
          ) : (
            <Button variant="ai" size={compact ? "md" : "lg"} onClick={submit} disabled={!text.trim()} className={cn("shrink-0", compact ? undefined : "self-end disabled:opacity-100")}>
              Redline it
              <ArrowUp size={14} weight="bold" />
            </Button>
          )}
        </div>
      </div>
      {!compact && (
        <div className="mt-3 overflow-hidden rounded-xl border border-hairline bg-surface-1">
          <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
            <p className="text-caption text-ink-subtle">Or run a ticket we already know</p>
            <span className="hidden items-center gap-1.5 text-caption text-ink-tertiary sm:flex">
              <Kbd>Enter</Kbd> to run
            </span>
          </div>
          <ul>
            {EXAMPLES.map((ex, i) => (
              <li key={ex} className="border-b border-hairline last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    setText(ex);
                    onSubmit(ex);
                  }}
                  className="flex w-full items-baseline gap-3 px-4 py-3 text-left text-body-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  <span className="num shrink-0 text-caption text-ink-tertiary">{String(i + 1).padStart(2, "0")}</span>
                  <span>{ex}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
