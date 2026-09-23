import { installNetworkOverrides } from "../lib/pin";
import { callTool } from "../lib/tools/mcp";

async function main() {
  await installNetworkOverrides();
  const [category, subcategory, keyword] = process.argv.slice(2);
  const args: Record<string, string> = {};
  if (category) args.category = category;
  if (subcategory) args.subcategory = subcategory;
  if (keyword) args.keyword = keyword;
  console.log(await callTool("guide", args, 30_000));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
