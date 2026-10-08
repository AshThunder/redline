import { readChain, scoreChain, verifyChain } from "@/lib/ledger";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const entries = await readChain();
  const check = verifyChain(entries);
  const marks = await scoreChain(entries).catch(() => []);
  return Response.json({ ok: check.ok, brokenAt: check.brokenAt, entries, marks });
}
