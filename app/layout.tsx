import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://walletpnl.xyz";

export const viewport: Viewport = {
  themeColor: "#FFB800",
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default: "WALLET_PNL // TERMINAL",
    template: "%s // WALLET_PNL",
  },
  description:
    "EVM wallet PnL terminal — token-by-token FIFO cost basis across Ethereum, Arbitrum, Base, Optimism, Polygon, BNB Chain, Linea, Scroll, and Blast.",
  keywords: [
    "wallet pnl",
    "crypto pnl",
    "evm wallet tracker",
    "defi portfolio",
    "ethereum pnl",
    "arbitrum pnl",
    "base pnl",
    "fifo cost basis",
    "token tracker",
    "unrealized pnl",
    "realized pnl",
  ],
  authors: [{ name: "WALLET_PNL" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },

  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "WALLET_PNL",
    title: "WALLET_PNL — EVM Wallet PnL Terminal",
    description:
      "Token-by-token PnL breakdown with FIFO cost basis across 9 EVM chains. Enter any wallet address and see unrealized + realized gains instantly.",
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "WALLET_PNL — EVM Wallet PnL Terminal",
    description:
      "Token-by-token PnL breakdown with FIFO cost basis across 9 EVM chains.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <body>{children}</body>
    </html>
  );
}
