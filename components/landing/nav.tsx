"use client";

import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#case", label: "A real run" },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-2 px-4 sm:gap-6 sm:px-5">
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex h-8 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 text-body-sm text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="primary" size="md">
            <Link href="/desk">
              <span className="sm:hidden">Desk</span>
              <span className="hidden sm:inline">Open the desk</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
