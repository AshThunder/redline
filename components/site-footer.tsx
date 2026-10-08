import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { MU_SHARE_TOKEN } from "@/lib/landing/mu-case";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-hairline">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-8 md:flex-row md:items-center">
        <Wordmark />
        <p className="max-w-[42ch] text-caption text-ink-subtle md:ml-4">
          Built for the Bitget AI Hackathon. Decision stress testing on tokenized US-stock perps. Redline never places an order.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-caption text-ink-subtle md:ml-auto">
          <Link href="/desk" className="hover:text-ink">
            Desk
          </Link>
          <Link href="/portfolio" className="hover:text-ink">
            Portfolio
          </Link>
          <Link href="/ledger" className="hover:text-ink">
            Ledger
          </Link>
          <Link href="/watchtower" className="hover:text-ink">
            Watchtower
          </Link>
          <Link href="/rules" className="hover:text-ink">
            Rules
          </Link>
          <Link href="/journal" className="hover:text-ink">
            Journal
          </Link>
          <Link href={`/s/${MU_SHARE_TOKEN}`} className="hover:text-ink">
            Share card
          </Link>
        </nav>
      </div>
    </footer>
  );
}
