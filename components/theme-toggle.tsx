"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "@/lib/client/storage";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useTheme();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const next = theme === "night" ? "day" : "night";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={ready ? `Switch to ${next} theme` : "Toggle theme"}
      title={ready ? `Switch to ${next} theme` : "Toggle theme"}
      className={`flex size-8 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink ${className}`}
    >
      {ready && theme === "night" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
