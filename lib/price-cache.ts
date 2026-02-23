/**
 * Module-level in-memory price cache.
 * Persists across requests within the same Next.js server process.
 *
 * Two stores:
 *   priceStore  — successful prices, TTL 5 min
 *   noFeedStore — contracts with no CoinGecko listing, TTL 24 hr
 *                 (avoids wasting API quota on spam/unknown tokens)
 */

const PRICE_TTL    = 5  * 60 * 1_000;        // 5 minutes
const NO_FEED_TTL  = 24 * 60 * 60 * 1_000;   // 24 hours

interface PriceEntry { usd: number; exp: number }

const priceStore  = new Map<string, PriceEntry>();
const noFeedStore = new Map<string, number>();   // addr → expiry timestamp

// ── price cache ────────────────────────────────────────────────────────────

export function getCachedPrice(addr: string): number | null {
  const key = addr.toLowerCase();
  const entry = priceStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.exp) { priceStore.delete(key); return null; }
  return entry.usd;
}

export function setCachedPrice(addr: string, usd: number): void {
  priceStore.set(addr.toLowerCase(), { usd, exp: Date.now() + PRICE_TTL });
}

// ── no-feed cache ──────────────────────────────────────────────────────────

export function isNoFeed(addr: string): boolean {
  const key = addr.toLowerCase();
  const exp = noFeedStore.get(key);
  if (exp === undefined) return false;
  if (Date.now() > exp) { noFeedStore.delete(key); return false; }
  return true;
}

export function markNoFeed(addr: string): void {
  noFeedStore.set(addr.toLowerCase(), Date.now() + NO_FEED_TTL);
}

// ── bulk helpers ───────────────────────────────────────────────────────────

/**
 * Given a list of contract addresses, return:
 *   cached   — addresses with a live cached price
 *   toFetch  — addresses that need a CoinGecko call
 *   skipped  — addresses in the no-feed cache (skip entirely)
 */
export function partitionAddresses(addrs: string[]): {
  cached: Record<string, number>;
  toFetch: string[];
  skipped: string[];
} {
  const cached: Record<string, number> = {};
  const toFetch: string[] = [];
  const skipped: string[] = [];

  for (const addr of addrs) {
    const key = addr.toLowerCase();
    if (isNoFeed(key)) {
      skipped.push(key);
      continue;
    }
    const price = getCachedPrice(key);
    if (price !== null) {
      cached[key] = price;
    } else {
      toFetch.push(key);
    }
  }

  return { cached, toFetch, skipped };
}

// ── stats (for logging) ────────────────────────────────────────────────────

export function getCacheStats() {
  // Purge expired entries before reporting
  const now = Date.now();
  for (const [k, v] of priceStore)  if (now > v.exp)  priceStore.delete(k);
  for (const [k, v] of noFeedStore) if (now > v)       noFeedStore.delete(k);
  return { prices: priceStore.size, noFeed: noFeedStore.size };
}
