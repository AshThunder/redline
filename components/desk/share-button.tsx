"use client";

import { useMemo, useState } from "react";
import { Check, ShareNetwork, XLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  encodeShare,
  sharePath,
  shareTweetText,
  unpackShare,
  packShare,
  xIntentUrl,
  type ShareCard,
} from "@/lib/share";
import type { JuryResult, TradeIntent, Verdict } from "@/lib/types";

function absoluteShareUrl(token: string) {
  return `${window.location.origin}${sharePath(token)}`;
}

export function ShareActions({ card, token }: { card: ShareCard; token: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = absoluteShareUrl(token);
    const payload = { title: `Redline ${card.symbol}`, text: card.headline, url };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(payload);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this Redline card", url);
    }
  };

  const post = () => {
    const url = absoluteShareUrl(token);
    window.open(xIntentUrl(url, shareTweetText(card)), "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Button size="sm" variant="secondary" onClick={copy}>
        {copied ? <Check size={12} /> : <ShareNetwork size={12} />}
        {copied ? "Copied" : "Share"}
      </Button>
      <Button size="sm" variant="tertiary" onClick={post}>
        <XLogo size={12} />
        Post
      </Button>
    </>
  );
}

export function VerdictShare({
  intent,
  verdict,
  jury,
}: {
  intent: TradeIntent;
  verdict: Verdict;
  jury?: JuryResult;
}) {
  const token = useMemo(() => encodeShare(intent, verdict, jury), [intent, verdict, jury]);
  const card = useMemo(() => unpackShare(packShare(intent, verdict, jury)), [intent, verdict, jury]);
  return <ShareActions card={card} token={token} />;
}
