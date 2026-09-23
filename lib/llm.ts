import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject } from "ai";
import { z } from "zod";

const provider = createOpenAICompatible({
  name: "qwen",
  baseURL: process.env.LLM_BASE_URL ?? "https://hackathon.bitgetops.com/v1",
  apiKey: process.env.LLM_API_KEY ?? process.env.BITGET_QWEN_API_KEY,
  supportsStructuredOutputs: false,
});

export const MODEL_ID = process.env.LLM_MODEL ?? "qwen3.8-max";

export function model(id: string = MODEL_ID) {
  return provider.chatModel(id);
}

/**
 * generateObject for providers without native structured outputs: the endpoint only offers json_object mode,
 * which requires the word "json" in the messages and never sees the schema, so we put the schema in the system prompt.
 */
export async function generateJson<T extends z.ZodType>(opts: { schema: T; system: string; prompt: string; temperature?: number; thinking?: boolean }): Promise<z.infer<T>> {
  const jsonSchema = JSON.stringify(z.toJSONSchema(opts.schema));
  const { object } = await generateObject({
    model: model(),
    schema: opts.schema,
    temperature: opts.temperature,
    maxRetries: 2,
    // qwen3 models reason by default, which costs minutes per call on long evidence briefs.
    providerOptions: { qwen: { enable_thinking: opts.thinking ?? false } },
    system: `${opts.system}\n\nRespond with a single JSON object, no prose, that validates against this JSON Schema:\n${jsonSchema}`,
    prompt: opts.prompt,
  });
  return object as z.infer<T>;
}

export function llmConfigured() {
  return Boolean(process.env.LLM_API_KEY ?? process.env.BITGET_QWEN_API_KEY);
}
