import { ImageResponse } from "next/og";
import type { Summary } from "@/lib/types";

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 };

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const VALID_CHAINS = [
  "ethereum", "arbitrum", "base", "optimism",
  "polygon", "bnb", "linea", "scroll", "blast",
];

const DEFAULT_STATS = [
  { label: "PORTFOLIO VALUE", value: "$124,582", color: "#FFB800" },
  { label: "TOTAL PNL", value: "+$23,451", color: "#00D68F" },
  { label: "WIN RATE", value: "68.4%", color: "#00D68F" },
  { label: "REALIZED PNL", value: "+$18,220", color: "#00D68F" },
];

const CHAINS = ["ETH", "ARB", "BASE", "OP", "MATIC", "BNB", "LINEA", "SCROLL", "BLAST"];

function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "+";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

function summaryToStats(summary: Summary) {
  const pnlColor = summary.totalPnl >= 0 ? "#00D68F" : "#FF3B5C";
  return [
    { label: "PORTFOLIO VALUE", value: formatUsd(summary.totalValue).replace(/^\+/, ""), color: "#FFB800" },
    { label: "TOTAL PNL", value: formatUsd(summary.totalPnl), color: pnlColor },
    { label: "WIN RATE", value: `${(summary.winRate * 100).toFixed(1)}%`, color: "#00D68F" },
    { label: "REALIZED PNL", value: formatUsd(summary.realizedPnl), color: summary.realizedPnl >= 0 ? "#00D68F" : "#FF3B5C" },
  ];
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function chainToHeader(chain: string): string {
  const map: Record<string, string> = {
    ethereum: "ETH MAINNET",
    arbitrum: "ARB ONE",
    base: "BASE",
    optimism: "OPTIMISM",
    polygon: "POLYGON",
    bnb: "BNB CHAIN",
    linea: "LINEA",
    scroll: "SCROLL",
    blast: "BLAST",
  };
  return map[chain] ?? chain.toUpperCase();
}

function OgImage({
  title = "RECON",
  titleFontSize = 108,
  subtitle = "EVM TOKEN-BY-TOKEN BREAKDOWN · FIFO COST BASIS · 9 CHAINS",
  stats = DEFAULT_STATS,
  showChainBadge = false,
  chainLabel = "",
}: {
  title?: string;
  titleFontSize?: number;
  subtitle?: string;
  stats?: { label: string; value: string; color: string }[];
  showChainBadge?: boolean;
  chainLabel?: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#07080F",
        fontFamily: '"Courier New", Courier, monospace',
        overflow: "hidden",
      }}
    >
      <div style={{ height: 4, width: "100%", background: "#FFB800", opacity: 0.85 }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "52px 68px 44px 68px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 52 }}>
          <span style={{ color: "#FFB800", fontSize: 18, fontWeight: 700, letterSpacing: "0.22em" }}>
            RECON
          </span>
          <div
            style={{
              marginLeft: 16,
              background: "rgba(255,184,0,0.12)",
              border: "1.5px solid rgba(255,184,0,0.38)",
              borderRadius: 3,
              color: "#FFB800",
              padding: "3px 13px",
              fontSize: 12,
              letterSpacing: "0.12em",
            }}
          >
            TERMINAL
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ width: 8, height: 8, borderRadius: 4, background: "#00D68F", marginRight: 9 }} />
          <span style={{ color: "#8A93B8", fontSize: 13, letterSpacing: "0.16em" }}>LIVE</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 18 }}>
          <span
            style={{
              color: "#E8EAF4",
              fontSize: titleFontSize,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </span>
        </div>
        <div
          style={{
            color: "#60687F",
            fontSize: 16,
            letterSpacing: "0.2em",
            marginBottom: showChainBadge ? 12 : 48,
          }}
        >
          {subtitle}
        </div>
        {showChainBadge && chainLabel && (
          <div style={{ marginBottom: 36 }}>
            <span
              style={{
                background: "rgba(255,184,0,0.07)",
                border: "1px solid rgba(255,184,0,0.22)",
                borderRadius: 3,
                color: "#8A93B8",
                padding: "4px 11px",
                fontSize: 11,
                letterSpacing: "0.12em",
              }}
            >
              {chainLabel}
            </span>
          </div>
        )}
        <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
          {stats.map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                flex: 1,
                background: "#0C0F1C",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 4,
                borderTop: `2px solid ${color}`,
                padding: "18px 22px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  color: "#60687F",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  marginBottom: 10,
                }}
              >
                {label}
              </span>
              <span style={{ color, fontSize: 30, fontWeight: 700, letterSpacing: "-0.01em" }}>
                {value}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {CHAINS.map((c) => (
            <div
              key={c}
              style={{
                background: "rgba(255,184,0,0.07)",
                border: "1px solid rgba(255,184,0,0.22)",
                borderRadius: 3,
                color: "#8A93B8",
                padding: "4px 11px",
                fontSize: 11,
                letterSpacing: "0.12em",
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 2, width: "40%", background: "#FFB800", opacity: 0.3 }} />
    </div>
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim();
  const chainParam = searchParams.get("chain")?.trim() || "ethereum";
  const chain = VALID_CHAINS.includes(chainParam) ? chainParam : "ethereum";

  let summary: Summary | null = null;

  if (address && ADDRESS_RE.test(address)) {
    try {
      const origin = new URL(request.url).origin;
      const res = await fetch(`${origin}/api/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chain }),
        signal: AbortSignal.timeout(12_000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.summary) summary = data.summary;
      }
    } catch {
      // Fall through to static image
    }
  }

  if (summary) {
    const short = formatAddress(address!);
    const stats = summaryToStats(summary);
    const chainLabel = chainToHeader(chain);
    return new ImageResponse(
      (
        <OgImage
          title={short}
          titleFontSize={72}
          subtitle="EVM TOKEN-BY-TOKEN BREAKDOWN · FIFO COST BASIS · 9 CHAINS"
          stats={stats}
          showChainBadge
          chainLabel={chainLabel}
        />
      ),
      {
        ...SIZE,
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
          "Content-Type": "image/png",
        },
      }
    );
  }

  return new ImageResponse(
    <OgImage />,
    {
      ...SIZE,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Content-Type": "image/png",
      },
    }
  );
}
