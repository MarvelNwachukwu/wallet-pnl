import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const APP_URL = "https://recon.marvellousnwachukwu.com";

export const viewport: Viewport = {
  themeColor: "#FFB800",
};

const OG_IMAGE = {
  url: `${APP_URL}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: "Recon — EVM Wallet PnL Terminal",
  type: "image/png",
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default: "Recon // TERMINAL",
    template: "%s // Recon",
  },
  description:
    "EVM wallet PnL terminal — token-by-token FIFO cost basis across Ethereum, Arbitrum, Base, Optimism, Polygon, BNB Chain, Linea, Scroll, and Blast.",
  keywords: [
    "recon",
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
  authors: [{ name: "Marvel", url: "https://github.com/MarvelNwachukwu" }],
  creator: "Marvel",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },

  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "Recon",
    title: "Recon — EVM Wallet PnL Terminal",
    description:
      "Token-by-token PnL breakdown with FIFO cost basis across 9 EVM chains. Enter any wallet address and see unrealized + realized gains instantly.",
    locale: "en_US",
    images: [ OG_IMAGE ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@marvel_codes",
    creator: "@marvel_codes",
    title: "Recon — EVM Wallet PnL Terminal",
    description:
      "Token-by-token PnL breakdown with FIFO cost basis across 9 EVM chains.",
    images: [ OG_IMAGE ],
  },

  images: [ OG_IMAGE ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <body>{children}</body>
    </html>
  );
}
