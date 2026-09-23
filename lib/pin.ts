import type { LookupAddress, LookupOptions } from "node:dns";

type LookupCb = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

/**
 * Some ISPs DNS-block bitget.com. Bitget is fronted by Cloudflare, so any of its
 * edge IPs serves every Bitget host over SNI. BITGET_PIN_IPS routes *.bitget.com there.
 */
export async function installNetworkOverrides() {
  const undici = await import("undici");
  if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY) {
    undici.setGlobalDispatcher(new undici.EnvHttpProxyAgent());
    return "proxy";
  }
  const ips = (process.env.BITGET_PIN_IPS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (ips.length === 0) return "none";
  const dns = await import("node:dns");
  let n = 0;
  const lookup = (hostname: string, options: LookupOptions, cb: LookupCb) => {
    if (hostname === "bitget.com" || hostname.endsWith(".bitget.com")) {
      const address = ips[n++ % ips.length];
      if (options?.all) cb(null, [{ address, family: 4 }]);
      else cb(null, address, 4);
      return;
    }
    dns.lookup(hostname, options, cb as never);
  };
  undici.setGlobalDispatcher(new undici.Agent({ connect: { lookup: lookup as never } }));
  return "pinned";
}
