import { MU_INTENT, MU_JURY, MU_VERDICT } from "@/lib/landing/mu-case";
import { decodeShare, packShare, unpackShare } from "@/lib/share";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Redline verdict card";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const card = decodeShare(token) ?? unpackShare(packShare(MU_INTENT, MU_VERDICT, MU_JURY));
  return renderOg(card);
}
