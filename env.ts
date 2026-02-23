import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Single Etherscan V2 key covers all chains (Ethereum, Arbitrum, etc.)
    ETHERSCAN_API_KEY: z.string().min(1),
    // CoinGecko demo key — get free at coingecko.com/en/api
    // Without it the price endpoint now returns 401
    COINGECKO_API_KEY: z.string().optional(),
  },
  client: {},
  experimental__runtimeEnv: {},
});
