import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = process.env.BITGET_MCP_URL ?? "https://agent.bitget.com/mcp";

type ToolInfo = { name: string; description?: string; inputSchema?: { properties?: Record<string, unknown>; required?: string[] } };

let clientPromise: Promise<Client> | null = null;

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${what} timed out after ${ms}ms`)), ms))]);
}

async function client(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const c = new Client({ name: "redline", version: "0.1.0" });
      await withTimeout(c.connect(new StreamableHTTPClientTransport(new URL(MCP_URL))), 12_000, "Bitget MCP connect");
      return c;
    })().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

export async function listTools(): Promise<ToolInfo[]> {
  const c = await client();
  return (await c.listTools()).tools as ToolInfo[];
}

export async function callTool(name: string, args: Record<string, unknown>, timeoutMs = 15_000): Promise<string> {
  const c = await client();
  try {
    const res = await withTimeout(c.callTool({ name, arguments: args }), timeoutMs, `MCP ${name}`);
    const content = (res.content ?? []) as { type: string; text?: string }[];
    return content
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("\n");
  } catch (err) {
    // A dropped session poisons the cached client; reconnect on the next call.
    if (!(err as Error).message.includes("timed out")) clientPromise = null;
    throw err;
  }
}
