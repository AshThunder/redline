import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShareView } from "@/components/share/share-view";
import { decodeShare, verdictLabel } from "@/lib/share";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const card = decodeShare(token);
  if (!card) return { title: "Verdict | Redline" };
  const verb = verdictLabel(card.verdict);
  return {
    title: `${card.symbol} ${verb} | Redline`,
    description: card.headline,
    openGraph: {
      title: `Redline ${card.symbol}: ${verb}`,
      description: card.headline,
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const card = decodeShare(token);
  if (!card) notFound();
  return <ShareView card={card} token={token} />;
}
