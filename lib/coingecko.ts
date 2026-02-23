import { Chain } from "./types";
import {
  partitionAddresses,
  setCachedPrice,
  markNoFeed,
} from "./price-cache";

const PLATFORM: Record<Chain, string> = {
  ethereum: "ethereum",
  arbitrum: "arbitrum-one",
  base:     "base",
  optimism: "optimistic-ethereum",
  polygon:  "polygon-pos",
  bnb:      "binance-smart-chain",
  linea:    "linea",
  scroll:   "scroll",
  blast:    "blast",
};

const BASE    = "https://api.coingecko.com/api/v3";
const CG_KEY  = process.env.COINGECKO_API_KEY ?? "";
const CHUNK   = 50;   // CoinGecko max per request

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildUrl(path: string, extra: Record<string, string> = {}): string {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
  if (CG_KEY) url.searchParams.set("x_cg_demo_api_key", CG_KEY);
  return url.toString();
}

async function cgGet(url: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(CG_KEY ? { "x-cg-demo-apikey": CG_KEY } : {}),
  };

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000), headers, next: { revalidate: 0 } });

  if (res.status === 429) {
    await sleep(5000);
    const r2 = await fetch(url, { signal: AbortSignal.timeout(15_000), headers, next: { revalidate: 0 } });
    if (!r2.ok) return null;
    return r2.json();
  }

  if (!res.ok) return null;

  return res.json();
}

/**
 * Fetch USD prices for a list of contract addresses.
 *
 * Optimizations applied:
 *   1. Partition: serve from cache / skip known no-feed / only call CG for unknowns
 *   2. Batch: 50 contracts per request
 *   3. After response: mark any requested contract absent from response as no-feed
 *   4. Cache all successful hits for 5 min
 */
export async function fetchTokenPrices(
  contractAddresses: string[],
  chain: Chain
): Promise<Record<string, number>> {
  if (contractAddresses.length === 0) return {};

  const { cached, toFetch, skipped } = partitionAddresses(contractAddresses);

  const prices: Record<string, number> = { ...cached };

  if (toFetch.length === 0) return prices;

  const platform = PLATFORM[chain];

  for (let i = 0; i < toFetch.length; i += CHUNK) {
    const chunk = toFetch.slice(i, i + CHUNK);
    const url = buildUrl(`/simple/token_price/${platform}`, {
      contract_addresses: chunk.join(","),
      vs_currencies: "usd",
    });

    try {
      const data = await cgGet(url);
      if (data && typeof data === "object") {
        let hits = 0;
        const responded = new Set(Object.keys(data as object).map(k => k.toLowerCase()));

        for (const [addr, pd] of Object.entries(
          data as Record<string, { usd?: number }>
        )) {
          const key = addr.toLowerCase();
          if (pd?.usd !== undefined) {
            prices[key] = pd.usd;
            setCachedPrice(key, pd.usd);
            hits++;
          }
        }

        // Mark contracts absent from response as no-feed
        for (const addr of chunk) {
          if (!responded.has(addr.toLowerCase())) {
            markNoFeed(addr);
          }
        }

      }
    } catch {
      // chunk failed — continue with remaining chunks
    }

    if (i + CHUNK < toFetch.length) await sleep(500);
  }

  return prices;
}
