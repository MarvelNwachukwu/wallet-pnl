import { NextRequest, NextResponse } from "next/server";
import { fetchTokenTransfers, CHAIN_IDS } from "@/lib/etherscan";
import { fetchTokenPrices } from "@/lib/coingecko";
import { fetchAllPriceHistories } from "@/lib/defillama";
import { calculatePnL, scanNonZeroContracts } from "@/lib/pnl";
import { Chain, STABLECOINS, WETH } from "@/lib/types";
import { getCacheStats } from "@/lib/price-cache";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, chain = "ethereum" } = body as {
      address: string;
      chain: Chain;
    };

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid wallet address. Please provide a valid 0x... address." },
        { status: 400 }
      );
    }

    const validChains = Object.keys(CHAIN_IDS) as Chain[];
    if (!validChains.includes(chain)) {
      return NextResponse.json({ error: "Invalid chain" }, { status: 400 });
    }

    console.log(`\n[wallet] ── START address=${address} chain=${chain}`);
    console.log(`[wallet] cache before: ${JSON.stringify(getCacheStats())}`);

    // ── 1. Fetch token transfers ───────────────────────────────────────────
    const transfers = await fetchTokenTransfers(address, chain);
    console.log(`[wallet] transfers: ${transfers.length}`);

    if (transfers.length === 0) {
      return NextResponse.json({
        tokens: [],
        summary: { totalValue: 0, totalPnl: 0, totalPnlPercent: 0, winRate: 0, tokensTracked: 0 },
      });
    }

    // ── 2. Pre-filter: only price contracts with net positive balance ───────
    // This avoids spending API quota on:
    //   a) tokens fully sold / transferred out
    //   b) spam airdrop tokens the wallet never "bought"
    const allContracts = Array.from(
      new Set(transfers.map((t) => t.contractAddress.toLowerCase()))
    );
    const heldContracts = scanNonZeroContracts(transfers, address, chain);

    // For price inference (stablecoin↔token pairing) we need ALL contracts,
    // but we only need CoinGecko prices for held ones + WETH for ETH inference.
    const priceTargets = allContracts.filter((c) => heldContracts.has(c));

    console.log(
      `[wallet] contracts total=${allContracts.length} held=${heldContracts.size} ` +
      `price-targets=${priceTargets.length}`
    );

    // ── 3+4. Compute targets, then fetch CoinGecko + DeFiLlama in parallel ──
    const timestamps = transfers.map((t) => parseInt(t.timeStamp)).filter(Boolean);
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);

    // Only fetch history for held, non-stable tokens (skip stables & WETH)
    const stables = STABLECOINS[chain];
    const wethAddr = WETH[chain].toLowerCase();
    const historyTargets = priceTargets.filter(
      (c) => stables[c] === undefined && c !== wethAddr
    );

    console.log(`[wallet] fetching prices (${priceTargets.length} targets) + DeFiLlama history (${historyTargets.length} tokens) in parallel`);

    const [prices, llamaHistories] = await Promise.all([
      fetchTokenPrices(priceTargets, chain),
      fetchAllPriceHistories(historyTargets, chain, minTs, maxTs),
    ]);
    console.log(`[wallet] prices=${Object.keys(prices).length} llama=${Object.keys(llamaHistories).length}`);

    // ── 5. Calculate FIFO PnL ─────────────────────────────────────────────
    const result = calculatePnL(transfers, address, prices, chain, llamaHistories);
    console.log(`[wallet] tokens out: ${result.tokens.length} | summary: ${JSON.stringify(result.summary)}`);
    console.log(`[wallet] cache after: ${JSON.stringify(getCacheStats())}`);
    console.log(`[wallet] ── END\n`);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch wallet data";
    console.error("[wallet] ERROR:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
