"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { BookOpen, Crosshair, ShieldCheck, MagnifyingGlass, Lightning, Moon, Sun } from "@phosphor-icons/react";
import { Wordmark } from "@/components/brand";
import { Kbd } from "@/components/ui/button";
import { cn } from "@/lib/format";
import { useTheme } from "@/lib/client/storage";
import { EXAMPLES } from "@/components/desk/examples";

const NAV = [
  { href: "/desk", label: "Desk", icon: Crosshair },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/rules", label: "Rules", icon: ShieldCheck },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const nextTheme = theme === "night" ? "day" : "night";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-5">
          <Link href="/" className="shrink-0">
            <Wordmark />
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-md px-2.5 text-body-sm text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink",
                  pathname.startsWith(href) && "bg-surface-2 text-ink",
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => setOpen(true)}
            className="ml-auto flex h-8 items-center gap-2 whitespace-nowrap rounded-md border border-hairline bg-surface-1 px-2.5 text-body-sm text-ink-tertiary transition-colors hover:border-hairline-strong lg:w-72"
          >
            <MagnifyingGlass size={14} />
            <span className="hidden lg:inline">Search or redline a trade</span>
            <span className="ml-auto flex gap-1">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          <button
            onClick={() => setTheme(nextTheme)}
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
            className="-ml-3 flex size-8 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {theme === "night" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>
      <main className="flex-1">{children}</main>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Command menu"
        overlayClassName="fixed inset-0 z-40 bg-overlay"
        contentClassName="fixed left-1/2 top-[18vh] z-50 w-[min(640px,92vw)] -translate-x-1/2 overflow-hidden rounded-xl border border-hairline-strong bg-surface-1 shadow-float"
      >
        <Command.Input
          placeholder="Type a command or a trade idea"
          className="h-12 w-full border-b border-hairline bg-transparent px-4 text-body text-ink outline-none placeholder:text-ink-tertiary"
        />
        <Command.List className="max-h-[360px] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-body-sm text-ink-subtle">No matches.</Command.Empty>
          <Command.Group heading="Go to" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:text-ink-tertiary">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Command.Item key={href} onSelect={() => go(href)} className="flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 text-body-sm text-ink-muted data-[selected=true]:bg-surface-4 data-[selected=true]:text-ink">
                <Icon size={16} />
                {label}
              </Command.Item>
            ))}
            <Command.Item
              value={`Switch to ${nextTheme} theme`}
              onSelect={() => {
                setTheme(nextTheme);
                setOpen(false);
              }}
              className="flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 text-body-sm text-ink-muted data-[selected=true]:bg-surface-4 data-[selected=true]:text-ink"
            >
              {theme === "night" ? <Sun size={16} /> : <Moon size={16} />}
              Switch to {nextTheme} theme
            </Command.Item>
          </Command.Group>
          <Command.Group heading="Redline an example" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:text-ink-tertiary">
            {EXAMPLES.map((ex) => (
              <Command.Item key={ex} value={ex} onSelect={() => go(`/desk?q=${encodeURIComponent(ex)}`)} className="flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 text-body-sm text-ink-muted data-[selected=true]:bg-surface-4 data-[selected=true]:text-ink">
                <Lightning size={16} className="text-accent-ink" />
                <span className="truncate">{ex}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </div>
  );
}
