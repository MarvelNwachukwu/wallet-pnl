import type { Metadata } from "next";
import TerminalPage from "./terminal-page";
import { formatAddress } from "@/lib/build-og-url";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ address?: string; chain?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const address = typeof params?.address === "string" ? params.address.trim() : undefined;
  const chain = typeof params?.chain === "string" ? params.chain : "ethereum";

  if (!address || !ADDRESS_RE.test(address)) {
    return {};
  }

  const short = formatAddress(address);
  const description = `EVM wallet PnL for ${short} on ${chain}. Token-by-token FIFO cost basis across 8 EVM chains.`;

  return {
    title: `${short} // Recon`,
    description,
    openGraph: {
      title: `Recon — ${short} wallet PnL`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Recon — ${short} wallet PnL`,
      description,
      creator: "@marvel_codes",
      site: "@marvel_codes",
    },
  };
}

export default function Page() {
  return <TerminalPage />;
}
