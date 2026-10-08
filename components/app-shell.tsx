"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Bell, BookOpen, ChartPie, Crosshair, Hash, ShieldCheck, MagnifyingGlass, Lightning, Moon, Sun } from "@phosphor-icons/react";
import { Wordmark } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";
import { Kbd } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/format";
import { useTheme } from "@/lib/client/storage";
import { WatchtowerProvider, useWatchtowerContext } from "@/lib/client/watchtower-context";
import { EXAMPLES } from "@/components/desk/examples";

const NAV = [
  { href: "/desk", label: "Desk", icon: Crosshair },
  { href: "/watchtower", label: "Watchtower", icon: Bell },
  { href: "/portfolio", label: "Portfolio", icon: ChartPie },
  { href: "/ledger", label: "Ledger", icon: Hash },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/rules", label: "Rules", icon: ShieldCheck },
];

function NavLink({
  item,
  active,
  tripped,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  tripped: number;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 shrink-0 items-center gap-1.5 rounded-md px-2 text-body-sm text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink md:h-8 md:px-2",
        active && "bg-surface-2 text-ink",
      )}
    >
      <Icon size={16} />
      <span>{item.label}</span>
      {item.href === "/watchtower" && tripped > 0 && (
        <span className="num rounded-xs bg-loss-subtle px-1 text-[11px] text-loss">{tripped}</span>
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <WatchtowerProvider>
      <AppShellInner>{children}</AppShellInner>
    </WatchtowerProvider>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const { tripped } = useWatchtowerContext();
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
        <div className="mx-auto max-w-[1440px] px-4 sm:px-5">
          <div className="flex h-14 items-center gap-2 sm:gap-3">
            <Link href="/" className="shrink-0">
              <Wordmark />
            </Link>
            <nav aria-label="Pages" className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden">
              {NAV.map((item) => (
                <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} tripped={tripped.length} />
              ))}
            </nav>
            <button
              onClick={() => setOpen(true)}
              aria-label="Search or redline a trade"
              className="ml-auto flex h-8 shrink-0 items-center gap-2 rounded-md border border-hairline bg-surface-1 px-2 text-body-sm text-ink-tertiary transition-colors hover:border-hairline-strong sm:px-2.5 lg:w-72"
            >
              <MagnifyingGlass size={14} />
              <span className="hidden lg:inline">Search or redline a trade</span>
              <span className="ml-auto hidden gap-1 lg:flex">
                <Kbd>Ctrl</Kbd>
                <Kbd>K</Kbd>
              </span>
            </button>
            <ThemeToggle />
          </div>
          <nav aria-label="Pages" className="flex gap-1 overflow-x-auto pb-2.5 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
            {NAV.map((item) => (
              <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} tripped={tripped.length} />
            ))}
          </nav>
        </div>
      </header>
      {tripped.length > 0 && pathname !== "/watchtower" && (
        <Link href="/watchtower" className="block border-b border-loss/25 bg-loss-subtle px-5 py-2 text-center text-caption text-loss">
          {tripped.length} tripwire{tripped.length === 1 ? "" : "s"} fired. Open Watchtower.
        </Link>
      )}
      <main className="flex-1">{children}</main>
      <SiteFooter />

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
