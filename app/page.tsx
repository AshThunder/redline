import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, BellIcon } from "@/components/landing/glyphs";
import { LandingNav } from "@/components/landing/nav";
import { Reveal } from "@/components/landing/reveal";
import { VerdictPoster } from "@/components/landing/verdict-poster";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { MU_INTENT, MU_QUERY, MU_SHARE_TOKEN, MU_VERDICT } from "@/lib/landing/mu-case";
import { usd } from "@/lib/format";

export const metadata: Metadata = {
  title: "Redline: stress-test your trade before the market does",
  description:
    "An AI trading desk for Bitget tokenized US stocks. Historical analogues, stress tests, and a Judge who writes the pre-mortem before you place the order.",
};

const FACTS = [
  { k: "Analogues replayed", v: "60" },
  { k: "Days to earnings", v: "6" },
  { k: "Adverse print, p90", v: "−14.5%" },
  { k: "Account at risk", v: "14%" },
];

const BITGET = ["Live perp price", "Funding and depth", "Earnings calendar", "Analyst targets", "Insider filings", "Fear and greed"];

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <LandingNav />

      <main>
        <section className="mx-auto grid max-w-[1200px] items-start gap-8 px-5 pb-12 pt-8 md:pt-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 lg:pt-14">
          <div className="order-2 lg:sticky lg:top-20 lg:order-1">
            <span aria-hidden className="mb-5 block h-0.5 w-12 rounded-full bg-accent" />
            <h1 className="max-w-[11em] text-[40px] font-medium leading-[1.08] tracking-[-1px] text-ink md:text-[52px]">
              Redline your trade
              <br />
              before the market does.
            </h1>
            <p className="mt-5 max-w-[34ch] text-body-lg text-ink-muted">
              Type a trade in plain English. Analogues, stress tests and a Judge find the three ways it dies.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild variant="ai" size="lg">
                <Link href="/desk">
                  Open the desk
                  <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href="#case">See a real run</a>
              </Button>
            </div>
          </div>
          <Reveal immediate className="order-1 lg:order-2">
            <div className="relative">
              <div className="overflow-hidden rounded-xl">
                <Image
                  src="/marketing/redline-desk.jpg"
                  alt="A dark desk, a blank monitor, and a cream notebook"
                  width={1200}
                  height={800}
                  priority
                  sizes="(min-width: 1024px) 640px, 100vw"
                  className="h-[240px] w-full object-cover sm:h-[300px] lg:h-[340px]"
                />
              </div>
              <div className="relative z-10 -mt-16 px-3 sm:-mt-20 sm:px-6">
                <VerdictPoster compact />
              </div>
            </div>
          </Reveal>
        </section>

        <section aria-label="Facts from a live Micron run" className="bg-primary text-on-primary">
          <div className="mx-auto grid max-w-[1200px] grid-cols-2 lg:grid-cols-4">
            {FACTS.map((f) => (
              <div key={f.k} className="border-on-primary/15 px-5 py-6 max-lg:border-b lg:border-r lg:last:border-r-0 [&:nth-child(odd)]:max-lg:border-r">
                <p className="num text-[22px] font-medium leading-tight sm:text-headline">{f.v}</p>
                <p className="mt-1 text-caption text-on-primary/70">{f.k}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-[1200px] px-5 py-16 md:py-20">
          <Reveal>
            <h2 className="max-w-[16ch] text-[32px] font-medium leading-[1.15] tracking-[-0.6px] text-ink sm:text-display-md">Four passes before you size the order.</h2>
          </Reveal>
          <div className="mt-10 grid gap-3 lg:grid-cols-6">
            <article className="panel flex flex-col justify-between p-6 lg:col-span-4 lg:min-h-[240px]">
              <div>
                <p className="num text-caption text-ink-tertiary">01</p>
                <h3 className="mt-2 text-card-title font-medium text-ink">You type the trade.</h3>
              </div>
              <p className="mt-6 rounded-md bg-surface-2 px-4 py-3 text-body-sm text-ink">{MU_QUERY}</p>
            </article>
            <article className="relative min-h-[220px] overflow-hidden rounded-xl lg:col-span-2">
              <Image
                src="/marketing/redline-mark.jpg"
                alt="A thin cyan line drawn across cream paper"
                fill
                sizes="(min-width: 1024px) 360px, 100vw"
                className="object-cover"
              />
            </article>
            <article className="rounded-xl bg-surface-2 p-6 lg:col-span-2">
              <p className="num text-caption text-ink-tertiary">02</p>
              <h3 className="mt-2 text-card-title font-medium text-ink">Bitget fills the blanks.</h3>
              <ul className="mt-4 space-y-1.5">
                {BITGET.map((item) => (
                  <li key={item} className="text-body-sm text-ink-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
            <article className="flex flex-col justify-between rounded-xl bg-primary p-6 text-on-primary lg:col-span-2">
              <div>
                <p className="num text-caption text-on-primary/60">03</p>
                <h3 className="mt-2 text-card-title font-medium">History and shocks.</h3>
              </div>
              <dl className="mt-6 space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-caption text-on-primary/70">Analogues</dt>
                  <dd className="num text-body">60</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-caption text-on-primary/70">Bad print, p90</dt>
                  <dd className="num text-body">−14.5%</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-caption text-on-primary/70">Weekend gap, p99</dt>
                  <dd className="num text-body">8.3%</dd>
                </div>
              </dl>
            </article>
            <article className="rounded-xl border border-hairline bg-surface-1 p-6 lg:col-span-2">
              <p className="num text-caption text-ink-tertiary">04</p>
              <h3 className="mt-2 text-card-title font-medium text-ink">A Judge writes how it dies.</h3>
              <ul className="mt-5 space-y-2">
                <li className="rounded-md bg-loss-subtle px-3 py-2 text-body-sm font-medium text-loss">Kill</li>
                <li className="rounded-md bg-caution-subtle px-3 py-2 text-body-sm font-medium text-caution">Resize</li>
                <li className="rounded-md bg-gain-subtle px-3 py-2 text-body-sm font-medium text-gain">Proceed</li>
              </ul>
            </article>
          </div>
        </section>

        <section id="case" className="border-t border-hairline">
          <div className="mx-auto max-w-[1200px] px-5 py-16 md:py-20">
            <Reveal>
              <h2 className="max-w-[18ch] text-[32px] font-medium leading-[1.15] tracking-[-0.6px] text-ink sm:text-display-md">The trader never mentioned earnings. Bitget did.</h2>
              <p className="mt-4 max-w-[62ch] text-body text-ink-muted">
                {MU_QUERY} Redline found Micron&apos;s 29 Sep report, blocked 5x through the print, and resized the ticket.
              </p>
            </Reveal>

            <dl className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-surface-1 px-5 py-5">
                <dt className="text-caption text-ink-subtle">As written</dt>
                <dd className="num mt-2 text-headline font-medium text-ink">
                  {MU_INTENT.leverage}x · {usd(MU_INTENT.notionalUsd)}
                </dd>
              </div>
              <div className="rounded-xl bg-accent-subtle px-5 py-5">
                <dt className="text-caption text-ink-subtle">After the Judge</dt>
                <dd className="num mt-2 text-headline font-medium text-accent-ink">
                  {MU_VERDICT.suggestedLeverage}x · {usd(MU_VERDICT.suggestedNotionalUsd)}
                </dd>
              </div>
              <div className="rounded-xl bg-loss-subtle px-5 py-5">
                <dt className="text-caption text-ink-subtle">If the print gaps 14.5%</dt>
                <dd className="num mt-2 text-headline font-medium text-loss">−$1,449</dd>
              </div>
            </dl>

            <ol className="mt-3 grid gap-3 lg:grid-cols-3">
              {MU_VERDICT.deathModes.map((d, i) => (
                <li key={d.title} className="flex flex-col rounded-xl border border-hairline bg-surface-1 p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="num text-caption text-ink-tertiary">{String(i + 1).padStart(2, "0")}</p>
                    <span className="text-caption capitalize text-ink-subtle">{d.probability}</span>
                  </div>
                  <h3 className="mt-3 text-body font-medium text-ink">{d.title}</h3>
                  <p className="mt-2 flex-1 text-body-sm text-ink-muted">{d.mechanism}</p>
                  <p className="mt-4 flex items-start gap-2 border-t border-hairline pt-3 text-caption text-ink-subtle">
                    <BellIcon className="mt-0.5 shrink-0 text-accent-ink" />
                    <span>{d.tripwire.description}</span>
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-8">
              <Button asChild variant="secondary" size="lg">
                <Link href={`/s/${MU_SHARE_TOKEN}`}>Open the share card</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-5 pb-16 md:pb-20">
          <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-xl">
            <Image
              src="/marketing/redline-mark.jpg"
              alt="A thin cyan line drawn across cream paper"
              width={1600}
              height={900}
              sizes="(min-width: 1200px) 1200px, 100vw"
              className="h-[420px] w-full object-cover md:h-[480px]"
            />
            <div className="absolute inset-x-4 bottom-4 md:inset-x-auto md:bottom-8 md:left-8 md:max-w-md">
              <div className="panel p-6 md:p-8">
                <h2 className="text-card-title font-medium text-ink md:text-headline">Push the idea to the line. Then you decide.</h2>
                <p className="mt-3 text-body-sm text-ink-muted">
                  Redline never places an order. It sits between the thesis and the ticket, on Bitget stock perps.
                </p>
                <div className="mt-5">
                  <Button asChild variant="primary" size="lg">
                    <Link href="/desk">
                      Open the desk
                      <ArrowRightIcon />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
