import { cn } from "@/lib/format";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-[-0.4px] text-ink", className)}>
      <span aria-hidden className="relative block h-4 w-4 rounded-xs border border-hairline-strong bg-surface-2">
        <span className="absolute inset-x-[3px] top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-primary" />
      </span>
      Redline
    </span>
  );
}
