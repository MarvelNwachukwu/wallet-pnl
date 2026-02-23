import { TokenTransfer, TokenPnL, Summary, Chain, STABLECOINS, WETH } from "./types";
import { PricePoint, getPriceAt } from "./defillama";

/**
 * Parse a raw token amount (big integer string) to a JS number without
 * precision loss. Splits into whole + fractional parts before converting.
 */
function parseTokenAmount(rawValue: string, decimals: number): number {
  if (rawValue === "0") return 0;
  const raw = BigInt(rawValue);
  if (raw === BigInt(0)) return 0;
  if (decimals === 0) return Number(raw);
  const factor = BigInt(10) ** BigInt(decimals);
  const whole = raw / factor;
  const frac = raw % factor;
  return Number(whole) + Number(frac) / Number(factor);
}

/**
 * Fast O(n) scan to find contracts with net positive inflow to the wallet.
 * Used to pre-filter price requests — no point fetching prices for tokens
 * the wallet has already fully sold or never held.
 */
export function scanNonZeroContracts(
  transfers: TokenTransfer[],
  walletAddress: string,
  chain: Chain
): Set<string> {
  const wallet  = walletAddress.toLowerCase();
  const weth    = WETH[chain].toLowerCase();

  // net quantity per contract (in raw token units, pre-decimal)
  const net = new Map<string, bigint>();
  const ZERO = BigInt(0);

  for (const tx of transfers) {
    const contract = tx.contractAddress.toLowerCase();

    let value: bigint;
    try { value = BigInt(tx.value); } catch { continue; }

    const prev = net.get(contract) ?? ZERO;
    // Use if/else if to avoid double-counting self-transfers
    if (tx.to.toLowerCase() === wallet) {
      net.set(contract, prev + value);
    } else if (tx.from.toLowerCase() === wallet) {
      net.set(contract, prev - value);
    }
  }

  const result = new Set<string>();
  for (const [contract, qty] of Array.from(net.entries())) {
    if (qty > ZERO) result.add(contract);
  }

  // Always include WETH so we can infer historical prices
  result.add(weth);

  return result;
}

interface CostLot {
  quantity: number;
  pricePerToken: number; // USD
}

interface TxPriceMap {
  /** txHash → inferred USD price per token for a given contract */
  [contractAddress: string]: Record<string, number>;
}

/**
 * Infer historical buy/sell prices by correlating token movements with
 * stablecoin (USDC/USDT/DAI) or WETH movements in the same transaction.
 *
 * Strategy:
 *   - Group ALL transfers by tx hash
 *   - For each target token tx:
 *       1. If stablecoin moved in opposite direction → USD price = stable_amount / token_amount
 *       2. If WETH moved in opposite direction → price = weth_amount × weth_price
 *       3. Fallback: use current price
 */
function buildHistoricalPriceMap(
  allTransfers: TokenTransfer[],
  walletAddress: string,
  chain: Chain,
  wethPrice: number
): TxPriceMap {
  const stables = STABLECOINS[chain];
  const wethAddr = WETH[chain].toLowerCase();
  const wallet = walletAddress.toLowerCase();

  // Group by tx hash
  const byTx = new Map<string, TokenTransfer[]>();
  for (const tx of allTransfers) {
    const list = byTx.get(tx.hash) ?? [];
    list.push(tx);
    byTx.set(tx.hash, list);
  }

  const result: TxPriceMap = {};

  for (const [txHash, txTransfers] of Array.from(byTx.entries())) {
    // Compute net USD value flowing to/from wallet in this tx via stablecoins
    let netStableToWallet = 0; // positive = received stables, negative = sent stables
    let netWethToWallet = 0;   // in WETH units

    for (const t of txTransfers) {
      const contract = t.contractAddress.toLowerCase();
      const decimals = parseInt(t.tokenDecimal) || 18;
      const amount = parseTokenAmount(t.value, decimals);

      if (stables[contract] !== undefined) {
        // Stablecoin movement
        if (t.to.toLowerCase() === wallet) netStableToWallet += amount;
        if (t.from.toLowerCase() === wallet) netStableToWallet -= amount;
      } else if (contract === wethAddr) {
        if (t.to.toLowerCase() === wallet) netWethToWallet += amount;
        if (t.from.toLowerCase() === wallet) netWethToWallet -= amount;
      }
    }

    const netUsdToWallet =
      netStableToWallet !== 0
        ? netStableToWallet
        : wethPrice > 0
        ? netWethToWallet * wethPrice
        : 0;

    if (netUsdToWallet === 0) continue;

    // Now pair each non-stable, non-weth token movement with this USD flow
    for (const t of txTransfers) {
      const contract = t.contractAddress.toLowerCase();
      if (stables[contract] !== undefined || contract === wethAddr) continue;

      const decimals = parseInt(t.tokenDecimal) || 18;
      const tokenAmount = parseTokenAmount(t.value, decimals);
      if (tokenAmount === 0) continue;

      const isTokenInflow = t.to.toLowerCase() === wallet;
      const isTokenOutflow = t.from.toLowerCase() === wallet;
      if (!isTokenInflow && !isTokenOutflow) continue;

      // Token buy: wallet received token + sent stables (netUsdToWallet < 0)
      // Token sell: wallet sent token + received stables (netUsdToWallet > 0)
      const usdAmount = Math.abs(netUsdToWallet);
      if (usdAmount > 0 && tokenAmount > 0) {
        const inferredPrice = usdAmount / tokenAmount;
        if (!result[contract]) result[contract] = {};
        result[contract][txHash] = inferredPrice;
      }
    }
  }

  return result;
}

export function calculatePnL(
  transfers: TokenTransfer[],
  walletAddress: string,
  prices: Record<string, number>,
  chain: Chain,
  llamaHistories: Record<string, PricePoint[]> = {}
): { tokens: TokenPnL[]; summary: Summary } {
  const wallet = walletAddress.toLowerCase();
  const wethAddr = WETH[chain].toLowerCase();
  const wethPrice = prices[wethAddr] ?? 0;

  // Build historical price inference map
  const histPrices = buildHistoricalPriceMap(transfers, walletAddress, chain, wethPrice);

  // Group transfers by contract address
  const byContract = new Map<string, TokenTransfer[]>();
  for (const tx of transfers) {
    const contract = tx.contractAddress.toLowerCase();
    const list = byContract.get(contract) ?? [];
    list.push(tx);
    byContract.set(contract, list);
  }

  const tokens: TokenPnL[] = [];

  for (const [contract, txs] of Array.from(byContract.entries())) {
    const symbol = txs[0].tokenSymbol || "???";
    const name = txs[0].tokenName || symbol;
    const decimals = parseInt(txs[0].tokenDecimal) || 18;
    const currentPrice = prices[contract] ?? 0;
    const txPrices = histPrices[contract] ?? {};

    // Sort chronologically
    const sorted = [...txs].sort(
      (a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp)
    );

    const llamaHistory = llamaHistories[contract] ?? [];
    const lots: CostLot[] = [];
    let realizedPnl = 0;
    let totalBoughtUsd = 0;
    let totalSoldUsd = 0;
    let quantityHeld = 0;
    let hasHistoricalPrice = false;

    for (const tx of sorted) {
      const quantity = parseTokenAmount(tx.value, decimals);
      if (quantity === 0) continue;

      const isInflow = tx.to.toLowerCase() === wallet;
      const isOutflow = tx.from.toLowerCase() === wallet;
      if (!isInflow && !isOutflow) continue;

      const ts = parseInt(tx.timeStamp);

      // Price priority:
      //   1. Stablecoin-inferred (exact swap price from same tx)
      //   2. DeFiLlama historical daily price
      //   3. Current price (last resort — makes PnL meaningless, shown as ~)
      const stableInferred  = txPrices[tx.hash];
      const llamaPrice      = getPriceAt(llamaHistory, ts);
      const price           = stableInferred ?? llamaPrice ?? currentPrice;

      if (stableInferred !== undefined || llamaPrice !== null) hasHistoricalPrice = true;

      if (isInflow) {
        // BUY: received tokens into wallet
        totalBoughtUsd += quantity * price;
        lots.push({ quantity, pricePerToken: price });
        quantityHeld += quantity;
      } else if (isOutflow) {
        // SELL: sent tokens out of wallet
        const sellPrice = stableInferred ?? llamaPrice ?? currentPrice;
        let remaining = quantity;
        let costBasis = 0;

        // FIFO: consume earliest lots first
        while (remaining > 0 && lots.length > 0) {
          const lot = lots[0];
          if (lot.quantity <= remaining) {
            costBasis += lot.quantity * lot.pricePerToken;
            remaining -= lot.quantity;
            lots.shift();
          } else {
            costBasis += remaining * lot.pricePerToken;
            lot.quantity -= remaining;
            remaining = 0;
          }
        }

        const proceeds = quantity * sellPrice;
        totalSoldUsd += proceeds;
        realizedPnl += proceeds - costBasis;
        quantityHeld -= quantity;
      }
    }

    // Clamp rounding errors
    quantityHeld = Math.max(0, quantityHeld);

    // Remaining cost basis for unrealized calc
    const remainingCostBasis = lots.reduce(
      (sum, lot) => sum + lot.quantity * lot.pricePerToken,
      0
    );

    const currentHeldValue = quantityHeld * currentPrice;
    const unrealizedPnl =
      currentPrice > 0 ? currentHeldValue - remainingCostBasis : 0;

    const totalPnl = realizedPnl + unrealizedPnl;

    // Skip ONLY if: no quantity held AND no realized PnL AND no price to value it
    const hasHoldings = quantityHeld > 1e-12;
    const hasRealizedActivity = Math.abs(realizedPnl) > 0.001 || Math.abs(totalBoughtUsd) > 0.001;
    if (!hasHoldings && !hasRealizedActivity) continue;

    const avgBuyPrice =
      quantityHeld > 0 && remainingCostBasis > 0
        ? remainingCostBasis / quantityHeld
        : 0;

    const pnlPercent =
      remainingCostBasis > 0
        ? (unrealizedPnl / remainingCostBasis) * 100
        : totalBoughtUsd > 0
        ? (totalPnl / totalBoughtUsd) * 100
        : 0;

    tokens.push({
      symbol,
      name,
      contractAddress: contract,
      quantityHeld,
      avgBuyPrice,
      currentPrice,
      totalBought: totalBoughtUsd,
      totalSold: totalSoldUsd,
      realizedPnl,
      unrealizedPnl,
      totalPnl,
      pnlPercent,
      hasHistoricalPrice,
    });
  }

  // Sort: held value desc, then by abs(totalPnl)
  tokens.sort((a, b) => {
    const aVal = a.quantityHeld * a.currentPrice;
    const bVal = b.quantityHeld * b.currentPrice;
    if (bVal !== aVal) return bVal - aVal;
    return Math.abs(b.totalPnl) - Math.abs(a.totalPnl);
  });

  // Summary
  const totalValue = tokens.reduce(
    (s, t) => s + t.quantityHeld * t.currentPrice,
    0
  );
  const totalPnl = tokens.reduce((s, t) => s + t.totalPnl, 0);
  const realizedPnlTotal = tokens.reduce((s, t) => s + t.realizedPnl, 0);
  const unrealizedPnlTotal = tokens.reduce((s, t) => s + t.unrealizedPnl, 0);
  const totalCostBasis = tokens.reduce(
    (s, t) => s + (t.avgBuyPrice > 0 ? t.quantityHeld * t.avgBuyPrice : 0),
    0
  );
  const totalPnlPercent =
    totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;

  const profitableTokens = tokens.filter((t) => t.totalPnl > 0).length;
  const winRate =
    tokens.length > 0 ? (profitableTokens / tokens.length) * 100 : 0;

  return {
    tokens,
    summary: {
      totalValue,
      totalPnl,
      totalPnlPercent,
      realizedPnl: realizedPnlTotal,
      unrealizedPnl: unrealizedPnlTotal,
      winRate,
      tokensTracked: tokens.length,
    },
  };
}
