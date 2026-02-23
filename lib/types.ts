export type Chain =
  | "ethereum"
  | "arbitrum"
  | "base"
  | "optimism"
  | "polygon"
  | "bnb"
  | "linea"
  | "scroll"
  | "blast";

export type TokenTransfer = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  value: string;
};

export type TokenPnL = {
  symbol: string;
  name: string;
  contractAddress: string;
  logoUrl?: string;
  quantityHeld: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalBought: number;
  totalSold: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  pnlPercent: number;
  hasHistoricalPrice: boolean;
};

export type Summary = {
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  realizedPnl: number;
  unrealizedPnl: number;
  winRate: number;
  tokensTracked: number;
};

export type WalletResponse = {
  tokens: TokenPnL[];
  summary: Summary;
  error?: string;
};

/**
 * USD-pegged stablecoin contract addresses by chain.
 * Used for:
 *   1. Price inference — detect stablecoin ↔ token swaps to infer historical prices
 *   2. Position filtering — excluded from the PnL table
 */
export const STABLECOINS: Record<Chain, Record<string, number>> = {
  ethereum: {
    "0xdac17f958d2ee523a2206206994597c13d831ec7": 1, // USDT
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 1, // USDC
    "0x6b175474e89094c44da98b954eedeac495271d0f": 1, // DAI
    "0xdc035d45d973e3ec169d2276ddab16f1e407384f": 1, // USDS
    "0x4c9edd5852cd905f086c759e8383e09bff1e68b3": 1, // USDe
    "0x6c3ea9036406852006290770bedfcaba0e23a0e8": 1, // PYUSD
    "0x853d955acef822db058eb8505911ed77f175b99e": 1, // FRAX
    "0x4fabb145d64652a948d72533023f6e7a623c7c53": 1, // BUSD
    "0x0000000000085d4780b73119b644ae5ecd22b376": 1, // TUSD
    "0x8e870d67f660d95d5be530380d0ec0bd388289e1": 1, // USDP
    "0x056fd409e1d7a124bd7017459dfea2f387b6d5cd": 1, // GUSD
    "0x5f98805a4e8be255a32880fdec7f6728c6568ba0": 1, // LUSD
    "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e": 1, // crvUSD
    "0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3": 1, // MIM
    "0x57ab1ec28d129707052df4df418d58a2d46d5f51": 1, // sUSD
    "0x0c10bf8fcb7bf5412187a595ab97a3609160b5c6": 1, // USDD
    "0x674c6ad92fd080e4004b2312b45f796a192d27a0": 1, // USDN
  },
  arbitrum: {
    "0xaf88d065e77c8cc2239327c5edb3a432268e5831": 1, // USDC (native)
    "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": 1, // USDC.e (bridged)
    "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": 1, // USDT
    "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": 1, // DAI
    "0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34": 1, // USDe
    "0x17fc002b466eec40dae837fc4be5c67993ddbd6f": 1, // FRAX
    "0x93b346b6bc2548da6a1e7d98e9a421b42541425b": 1, // LUSD
    "0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a": 1, // MIM
    "0x498bf2b1e120fed3ad3d42ea2165e9b73f99c1e5": 1, // crvUSD
    "0x0c10bf8fcb7bf5412187a595ab97a3609160b5c6": 1, // USDD
    "0x35e050d3c0ea2685ce72cd76a00c4c9addfbaa18": 1, // USDT.e (bridged)
  },
  base: {
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": 1, // USDC (native)
    "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca": 1, // USDbC (bridged USDC)
    "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": 1, // DAI
    "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2": 1, // USDT
    "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42": 1, // EURC
    "0x4621b7a9c75199271f773ebd9a499dbd165c3191": 1, // DOLA
  },
  optimism: {
    "0x0b2c639c533813f4aa9d7837caf62653d097ff85": 1, // USDC (native)
    "0x7f5c764cbc14f9669b88837ca1490cca17c31607": 1, // USDC.e (bridged)
    "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58": 1, // USDT
    "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": 1, // DAI
    "0x2e3d870790dc77a83dd1d18184acc7439a53f475": 1, // FRAX
    "0xc40f949f8a4e094d1b49a23ea9241d289b7b2819": 1, // LUSD
    "0x8c6f28f2f1a3c87f0f938b96d27520d9751ec8d9": 1, // sUSD
  },
  polygon: {
    "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": 1, // USDC (native)
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": 1, // USDC.e (PoS bridged)
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": 1, // USDT
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": 1, // DAI
    "0xa3fa99a148fa48d14ed51d610c367c61876997f1": 1, // MAI
    "0x45c32fa6df82ead1e2ef74d17b76547eddfaff89": 1, // FRAX
    "0x9c9e5fd8bbc25984b178fdce6117defa39d2db39": 1, // BUSD
  },
  bnb: {
    "0x55d398326f99059ff775485246999027b3197955": 1, // BSC-USD (Binance-pegged USDT)
    "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": 1, // USDC
    "0xe9e7cea3dedca5984780bafc599bd69add087d56": 1, // BUSD (Binance-USD)
    "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3": 1, // DAI
    "0x90c97f71e18723b0cf0dfa30ee176ab653e89f40": 1, // FRAX
    "0xd17479997f34dd9156deef8d974a1c2b23bfff4f": 1, // USDD
    "0x14016e85a25aeb13065688cafb43044c2ef86784": 1, // TUSD
    "0xb3c11196a4f3b1da7c23d9fb0a3dde9c6340934f": 1, // ZUSD
  },
  linea: {
    "0x176211869ca2b568f2a7d4ee941e073a821ee1ff": 1, // USDC
    "0xa219439258ca9da29e9cc4ce5596924745e12b93": 1, // USDT
    "0x4af15ec2a0bd43db75dd04e62faa3b8ef36b00d5": 1, // DAI
  },
  scroll: {
    "0x06efdBff2a14a7c8e15944d1f4a48f9f95f663a4": 1, // USDC
    "0xf55bec9cafdbe8730f096aa55dad6d22d44099df": 1, // USDT
    "0xca77eb3fefe3725dc33bccb54edefc3d9f764f97": 1, // DAI
  },
  blast: {
    "0x4300000000000000000000000000000000000003": 1, // USDB (native Blast stablecoin)
  },
};

// Wrapped native token addresses by chain (used for swap price inference)
// For non-ETH chains this is the wrapped native (WMATIC, WBNB, etc.)
export const WETH: Record<Chain, string> = {
  ethereum: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
  arbitrum: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH
  base:     "0x4200000000000000000000000000000000000006", // WETH
  optimism: "0x4200000000000000000000000000000000000006", // WETH
  polygon:  "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270", // WMATIC
  bnb:      "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // WBNB
  linea:    "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34", // WETH
  scroll:   "0x5300000000000000000000000000000000000004", // WETH
  blast:    "0x4300000000000000000000000000000000000004", // WETH
};
