import { TokenTransfer, Chain } from "./types";
import { env } from "@/env";

// Etherscan V2: single endpoint, chain selected via chainid param
const V2_ENDPOINT = "https://api.etherscan.io/v2/api";

export const CHAIN_IDS: Record<Chain, number> = {
  ethereum: 1,
  arbitrum: 42161,
  base:     8453,
  optimism: 10,
  polygon:  137,
  bnb:      56,
  linea:    59144,
  scroll:   534352,
  blast:    81457,
};

// Safety cap: 100k transfers max (10 pages × 10k)
const MAX_PAGES = 10;

/**
 * Queue-based rate limiter: serialises concurrent waiters at min `interval` ms apart.
 * Prevents races where multiple simultaneous calls both pass the time check.
 */
class RateLimiter {
  private queue: Array<() => void> = [];
  private running = false;
  private last = 0;
  private readonly interval = 210; // ms between calls (≤5 req/sec)

  wait(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      if (!this.running) this.drain();
    });
  }

  private drain() {
    if (this.queue.length === 0) { this.running = false; return; }
    this.running = true;
    const now = Date.now();
    const delay = Math.max(0, this.last + this.interval - now);
    setTimeout(() => {
      this.last = Date.now();
      this.queue.shift()!();
      this.drain();
    }, delay);
  }
}

const limiter = new RateLimiter();

export async function fetchTokenTransfers(
  address: string,
  chain: Chain
): Promise<TokenTransfer[]> {
  const chainid = CHAIN_IDS[chain];
  const apiKey = env.ETHERSCAN_API_KEY;
  const allTransfers: TokenTransfer[] = [];
  let page = 1;
  const pageSize = 10000;

  while (true) {
    await limiter.wait();

    const params = new URLSearchParams({
      chainid: chainid.toString(),
      module: "account",
      action: "tokentx",
      address,
      page: page.toString(),
      offset: pageSize.toString(),
      sort: "asc",
      apikey: apiKey,
    });

    const url = `${V2_ENDPOINT}?${params.toString()}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 0 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Etherscan API HTTP error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    const result = typeof data.result === "string" ? data.result : "";
    const msg: string = data.message ?? "";
    // Valid empty state
    if (msg === "No transactions found") break;

    if (data.status !== "1" || !Array.isArray(data.result)) {
      const detail = result || msg || "unknown error";
      const lower = detail.toLowerCase();

      if (lower.includes("rate limit") || lower.includes("max rate")) {
        throw new Error("Etherscan rate limit reached — wait a moment and retry");
      }
      if (lower.includes("invalid api key") || lower.includes("missing apikey")) {
        throw new Error("Invalid Etherscan API key — check ETHERSCAN_API_KEY in .env.local");
      }

      throw new Error(`Etherscan error: ${detail}`);
    }

    allTransfers.push(...(data.result as TokenTransfer[]));

    if (data.result.length < pageSize) break;

    if (page >= MAX_PAGES) {
      console.warn(`[etherscan] hit page cap (${MAX_PAGES} pages / ${allTransfers.length} transfers) — truncating`);
      break;
    }

    page++;
  }

  return allTransfers;
}
