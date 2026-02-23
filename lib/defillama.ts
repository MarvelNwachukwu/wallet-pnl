import { Chain } from "./types";

const CHAIN_PREFIX: Record<Chain, string> = {
  ethereum: "ethereum",
  arbitrum: "arbitrum",
  base:     "base",
  optimism: "optimism",
  polygon:  "polygon",
  bnb:      "bsc",
  linea:    "linea",
  scroll:   "scroll",
  blast:    "blast",
};

export interface PricePoint {
  timestamp: number;
  price: number;
}

// 24hr in-process cache — historical prices never change
const historyCache = new Map<string, { data: PricePoint[]; exp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1_000;

function getCached(key: string): PricePoint[] | null {
  const e = historyCache.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) { historyCache.delete(key); return null; }
  return e.data;
}

function setCached(key: string, data: PricePoint[]): void {
  historyCache.set(key, { data, exp: Date.now() + CACHE_TTL });
}

/**
 * Fetch daily price history for a token from DeFiLlama.
 * Free, no API key, no rate limits.
 *
 * https://coins.llama.fi/chart/{coin}?start={ts}&span={days}&period=1d
 */
export async function fetchPriceHistory(
  contractAddress: string,
  chain: Chain,
  startTimestamp: number,
  endTimestamp: number
): Promise<PricePoint[]> {
  const coin     = `${CHAIN_PREFIX[chain]}:${contractAddress.toLowerCase()}`;
  const spanDays = Math.ceil((endTimestamp - startTimestamp) / 86_400) + 2;
  const cacheKey = `${coin}:${Math.floor(startTimestamp / 86_400)}:${spanDays}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url =
    `https://coins.llama.fi/chart/${coin}` +
    `?start=${startTimestamp}&span=${spanDays}&period=1d`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      setCached(cacheKey, []);
      return [];
    }

    const data = await res.json();
    const coinData = data?.coins?.[coin];

    if (!Array.isArray(coinData?.prices) || coinData.prices.length === 0) {
      setCached(cacheKey, []);
      return [];
    }

    const prices: PricePoint[] = coinData.prices;
    setCached(cacheKey, prices);
    return prices;
  } catch {
    return [];
  }
}

/**
 * Find the closest price to a given unix timestamp.
 * Returns null if no point is within maxDeltaHours.
 */
export function getPriceAt(
  history: PricePoint[],
  targetTs: number,
  maxDeltaHours = 36
): number | null {
  if (!history.length) return null;

  let best = history[0];
  for (const p of history) {
    if (Math.abs(p.timestamp - targetTs) < Math.abs(best.timestamp - targetTs)) {
      best = p;
    }
  }

  if (Math.abs(best.timestamp - targetTs) > maxDeltaHours * 3_600) return null;
  return best.price;
}

/**
 * Fetch historical prices for multiple contracts with bounded concurrency.
 * Returns a map of contract → price history.
 */
export async function fetchAllPriceHistories(
  contracts: string[],
  chain: Chain,
  startTimestamp: number,
  endTimestamp: number
): Promise<Record<string, PricePoint[]>> {
  if (contracts.length === 0) return {};

  const CONCURRENCY = 8;
  const entries: Array<[string, PricePoint[]]> = new Array(contracts.length);
  let idx = 0;

  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= contracts.length) break;
      const contract = contracts[i];
      const history = await fetchPriceHistory(contract, chain, startTimestamp, endTimestamp);
      entries[i] = [contract.toLowerCase(), history];
    }
  }

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, contracts.length) },
    () => worker()
  );
  await Promise.all(workers);

  const map: Record<string, PricePoint[]> = {};
  for (const [contract, history] of entries) {
    if (history.length > 0) map[contract] = history;
  }

  return map;
}
