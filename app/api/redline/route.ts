import { runRedline } from "@/lib/redline";
import { DEFAULT_PROFILE, type RedlineEvent, type RuleProfile, TradeIntentSchema } from "@/lib/types";
import { llmConfigured } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { text?: string; profile?: Partial<RuleProfile>; intent?: unknown };
  const text = body.text?.trim();
  if (!text && !body.intent) return Response.json({ error: "Describe a trade idea" }, { status: 400 });
  if (!llmConfigured()) return Response.json({ error: "LLM_API_KEY is not set on the server" }, { status: 500 });

  const intent = body.intent ? TradeIntentSchema.parse(body.intent) : undefined;
  const profile: RuleProfile = { ...DEFAULT_PROFILE, ...body.profile };
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: RedlineEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        await runRedline({ text: text ?? "", profile, intent }, emit);
      } catch (err) {
        emit({ type: "error", message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
