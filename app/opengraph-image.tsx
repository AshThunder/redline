import { MU_INTENT, MU_JURY, MU_VERDICT } from "@/lib/landing/mu-case";
import { packShare, unpackShare } from "@/lib/share";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Redline: MU resized. Earnings in 6 days at 5x leverage.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";

export default async function Image() {
  return renderOg(unpackShare(packShare(MU_INTENT, MU_VERDICT, MU_JURY)));
}
