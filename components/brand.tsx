import { cn } from "@/lib/format";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[15px] font-medium tracking-[-0.3px] text-ink", className)}>
      <span aria-hidden className="relative block size-[18px] rounded-sm border border-hairline-strong bg-mark">
        <span className="absolute inset-x-[3px] top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-accent" />
      </span>
      Redline
    </span>
  );
}
