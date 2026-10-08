import { z } from "zod";
import { runPortfolio } from "@/lib/portfolio-run";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  source: z.enum(["journal", "sample", "custom"]).default("custom"),
  book: z
    .array(
      z.object({
        symbol: z.string().min(1),
        side: z.enum(["long", "short"]),
        notionalUsd: z.number().positive(),
        leverage: z.number().min(1).max(125),
      }),
    )
    .min(1)
    .max(12),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Send 1 to 12 positions" }, { status: 400 });
  try {
    const report = await runPortfolio(parsed.data.book, parsed.data.source);
    return Response.json(report);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
