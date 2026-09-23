import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

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

export function llmConfigured() {
  return Boolean(process.env.LLM_API_KEY ?? process.env.BITGET_QWEN_API_KEY);
}
