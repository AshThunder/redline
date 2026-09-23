import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = process.env.BITGET_MCP_URL ?? "https://agent.bitget.com/mcp";

type ToolInfo = { name: string; description?: string; inputSchema?: { properties?: Record<string, unknown>; required?: string[] } };

let clientPromise: Promise<Client> | null = null;
let toolsPromise: Promise<ToolInfo[]> | null = null;

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
  if (!toolsPromise) {
    toolsPromise = client()
      .then((c) => c.listTools())
      .then((r) => r.tools as ToolInfo[])
      .catch((err) => {
        toolsPromise = null;
        throw err;
      });
  }
  return toolsPromise;
}

/** Find the first tool whose name matches every keyword group (any word within a group). */
export async function findTool(...groups: string[][]): Promise<ToolInfo | null> {
  const tools = await listTools();
  return (
    tools.find((t) => {
      const hay = `${t.name} ${t.description ?? ""}`.toLowerCase();
      return groups.every((g) => g.some((w) => hay.includes(w)));
    }) ?? null
  );
}

export async function callTool(name: string, args: Record<string, unknown>, timeoutMs = 15_000): Promise<string> {
  const c = await client();
  const res = await withTimeout(c.callTool({ name, arguments: args }), timeoutMs, `MCP ${name}`);
  const content = (res.content ?? []) as { type: string; text?: string }[];
  return content
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text)
    .join("\n");
}

/** Build arguments for a tool by mapping our fields onto whatever its schema names them. */
export function argsFor(tool: ToolInfo, values: { symbol: string; limit?: number }): Record<string, unknown> {
  const props = Object.keys(tool.inputSchema?.properties ?? {});
  const args: Record<string, unknown> = {};
  const symKey = props.find((p) => /^(symbol|ticker|symbols|code|stock)$/i.test(p)) ?? props.find((p) => /symbol|ticker/i.test(p));
  if (symKey) args[symKey] = /s$/i.test(symKey) ? [values.symbol] : values.symbol;
  const limKey = props.find((p) => /^(limit|size|count|n)$/i.test(p));
  if (limKey && values.limit) args[limKey] = values.limit;
  return args;
}
