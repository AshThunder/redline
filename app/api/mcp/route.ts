import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createRedlineMcp } from "@/lib/redline-mcp";

export const runtime = "nodejs";
export const maxDuration = 300;

async function handle(req: Request) {
  const server = createRedlineMcp();
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
