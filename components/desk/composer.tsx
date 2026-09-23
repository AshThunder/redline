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
          "panel flex items-end gap-2 p-2 pl-4 transition-[border-color] duration-150 focus-within:border-hairline-strong",
          compact ? "rounded-lg" : "rounded-xl",
        )}
      >
        <textarea
          ref={ref}
          value={text}
          rows={1}
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
            "min-h-9 flex-1 resize-none bg-transparent py-2 text-ink outline-none placeholder:text-ink-tertiary",
            compact ? "text-body-sm" : "text-body-lg",
          )}
        />
        {running ? (
          <Button variant="secondary" size="md" onClick={onStop} aria-label="Stop">
            <Stop size={14} weight="fill" />
            Stop
          </Button>
        ) : (
          <Button variant="ai" size="md" onClick={submit} disabled={!text.trim()}>
            Redline it
            <ArrowUp size={14} weight="bold" />
          </Button>
        )}
      </div>
      {!compact && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setText(ex);
                onSubmit(ex);
              }}
              className="h-7 rounded-md border border-hairline bg-surface-1 px-2.5 text-caption text-ink-subtle transition-colors hover:border-hairline-strong hover:text-ink"
            >
              {ex}
            </button>
          ))}
          <span className="ml-auto hidden items-center gap-1.5 text-caption text-ink-tertiary md:flex">
            <Kbd>Enter</Kbd> to run
          </span>
        </div>
      )}
    </div>
  );
}
