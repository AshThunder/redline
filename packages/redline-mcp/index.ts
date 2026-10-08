import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRedlineMcp } from "../../lib/redline-mcp";

async function main() {
  const server = createRedlineMcp();
  await server.connect(new StdioServerTransport());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
