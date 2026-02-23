# Recon Terminal

**EVM wallet PnL terminal** — token-by-token FIFO cost-basis analysis across 9 chains.

[Live Demo](https://recon.marvellousnwachukwu.com)

---

## What is Recon?

Recon is an open-source web app that calculates profit & loss for any EVM wallet. Paste a wallet address, pick a chain, and get a full breakdown of realized and unrealized gains using **FIFO (First-In, First-Out) cost-basis accounting** — the same method used in traditional finance.

### Features

- **Token-by-token PnL** — average buy price, current price, realized/unrealized gains per token
- **FIFO cost basis** — accurate accounting that matches lots in purchase order
- **9 EVM chains** — Ethereum, Arbitrum, Base, Optimism, Polygon, BNB Chain, Linea, Scroll, Blast
- **Historical price inference** — reconstructs buy prices from on-chain swap data (stablecoin and WETH pairs) with DeFiLlama fallback
- **Portfolio summary** — total value, overall PnL, win rate, realized vs. unrealized breakdown

## Supported Chains

| Chain | Chain ID |
| --- | --- |
| Ethereum | 1 |
| Arbitrum | 42161 |
| Base | 8453 |
| Optimism | 10 |
| Polygon | 137 |
| BNB Chain | 56 |
| Linea | 59144 |
| Scroll | 534352 |
| Blast | 81457 |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) |
| Font | [JetBrains Mono](https://www.jetbrains.com/lp/mono/) |
| Env validation | [@t3-oss/env-nextjs](https://env.t3.gg/) + [Zod](https://zod.dev/) |
| Deployment | [Vercel](https://vercel.com/) |

### External APIs

| API | Purpose |
| --- | --- |
| [Etherscan V2](https://docs.etherscan.io/etherscan-v2) | Token transfer history (single key covers all chains) |
| [CoinGecko](https://www.coingecko.com/en/api) | Current token prices and logos |
| [DeFiLlama](https://defillama.com/docs/api) | Historical token prices (free, no key required) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) (recommended) or npm/yarn
- An [Etherscan API key](https://docs.etherscan.io/getting-started/viewing-api-usage-statistics) (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/MarvelNwachukwu/Recon.git
cd Recon

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

Edit `.env.local` with your keys:

| Variable | Required | Description |
| --- | --- | --- |
| `ETHERSCAN_API_KEY` | Yes | Etherscan V2 API key (single key covers all supported chains) |
| `COINGECKO_API_KEY` | No | CoinGecko demo API key ([get one free](https://www.coingecko.com/en/api)). Recommended — without it, price requests may return 401. |
| `NEXT_PUBLIC_APP_URL` | No | Public URL of the app (used for OG image generation). Auto-detected on Vercel. |

### Running Locally

```bash
# Development server (http://localhost:3000)
pnpm dev

# Production build
pnpm build
pnpm start

# Lint
pnpm lint
```

## Project Structure

```
recon/
├── app/
│   ├── api/
│   │   ├── og/route.tsx           # Dynamic OpenGraph image endpoint
│   │   └── wallet/route.ts        # Main wallet analysis API
│   ├── globals.css                # Design tokens & global styles
│   ├── layout.tsx                 # Root layout, metadata, fonts
│   ├── opengraph-image.tsx        # Static OG image generation
│   └── page.tsx                   # Client-side UI (search, table, summary)
├── lib/
│   ├── coingecko.ts               # CoinGecko price fetching (batched, cached)
│   ├── defillama.ts               # DeFiLlama historical price fetching
│   ├── etherscan.ts               # Etherscan V2 token transfer queries
│   ├── pnl.ts                     # Core FIFO PnL calculation engine
│   ├── price-cache.ts             # In-memory price cache (5 min TTL)
│   └── types.ts                   # Shared TypeScript types & chain constants
├── env.ts                         # Runtime env validation (t3-env + Zod)
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## How It Works

### 1. Data Collection

When a wallet address is submitted, the backend fetches all ERC-20 token transfer events from the Etherscan V2 API. Transfers are serialized with a 210ms delay between requests to respect rate limits.

### 2. Position Filtering

Only tokens with a **net positive balance** (more inflows than outflows) are analyzed. Stablecoins are excluded from PnL calculations but are used for price inference.

### 3. Price Resolution

Current prices are fetched from CoinGecko in batches of 50 contract addresses. Historical buy prices are resolved in priority order:

1. **Swap inference** — if a token was received in the same transaction that a stablecoin or WETH was sent, the implied price is calculated from the ratio
2. **DeFiLlama** — timestamp-based historical price lookup as fallback
3. **Zero** — if no price source is available, cost basis defaults to zero

### 4. FIFO PnL Calculation

Each token's transaction history is replayed chronologically:

- **Buys** are pushed onto a FIFO queue as cost lots `{ quantity, price }`
- **Sells** consume lots from the front of the queue, recording realized PnL as `(sell_price - lot_price) * quantity`
- **Unrealized PnL** is computed on remaining lots using the current market price

### 5. Portfolio Summary

Aggregated metrics are computed: total portfolio value, overall PnL (realized + unrealized), PnL percentage, and win rate (% of tokens with positive total PnL).

## API Reference

### `POST /api/wallet`

Analyze a wallet's token PnL.

**Request body:**

```json
{
  "address": "0x...",
  "chain": "ethereum"
}
```

**Response:**

```json
{
  "tokens": [
    {
      "symbol": "PEPE",
      "name": "Pepe",
      "contractAddress": "0x...",
      "logoUrl": "https://...",
      "quantityHeld": 1000000,
      "avgBuyPrice": 0.000001,
      "currentPrice": 0.000002,
      "totalBought": 1500000,
      "totalSold": 500000,
      "realizedPnl": 0.5,
      "unrealizedPnl": 1.0,
      "totalPnl": 1.5,
      "pnlPercent": 100,
      "hasHistoricalPrice": true
    }
  ],
  "summary": {
    "totalValue": 2.0,
    "totalPnl": 1.5,
    "totalPnlPercent": 100,
    "realizedPnl": 0.5,
    "unrealizedPnl": 1.0,
    "winRate": 75,
    "tokensTracked": 12
  }
}
```

**Valid `chain` values:** `ethereum`, `arbitrum`, `base`, `optimism`, `polygon`, `bnb`, `linea`, `scroll`, `blast`

### `GET /api/og`

Returns a dynamically generated 1200x630 PNG image for social card previews.

## Performance Considerations

- **In-memory price cache** — CoinGecko responses are cached for 5 minutes; tokens confirmed to have no CoinGecko listing are cached for 24 hours to avoid redundant lookups
- **Batch requests** — CoinGecko prices are fetched in chunks of 50 contract addresses per request
- **Parallel fetching** — CoinGecko and DeFiLlama requests run concurrently
- **Pre-filtering** — only tokens with net positive balance are priced, reducing API calls
- **Rate-limit handling** — Etherscan requests are serialized with 210ms intervals; user-friendly error messages on rate limit or invalid key responses

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feat/your-feature
   ```
3. **Make your changes** and ensure the build passes:
   ```bash
   pnpm build
   pnpm lint
   ```
4. **Commit** with a descriptive message
5. **Open a pull request** against `main`

### Ideas for Contribution

- Add support for additional EVM chains
- Implement NFT PnL tracking
- Add CSV/PDF export for tax reporting
- Persist analysis results (database integration)
- Add more historical price sources
- Improve mobile responsiveness

## License

This project is open source. See the [LICENSE](LICENSE) file for details.

## Author

**Marvel Nwachukwu**

- GitHub: [@MarvelNwachukwu](https://github.com/MarvelNwachukwu)
- Twitter: [@marvel_codes](https://twitter.com/marvel_codes)
- Website: [marvellousnwachukwu.com](https://marvellousnwachukwu.com)
