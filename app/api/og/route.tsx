import { ImageResponse } from "next/og";

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 };

const VALID_CHAINS = [
  "ethereum", "arbitrum", "base", "optimism",
  "polygon", "linea", "scroll", "blast",
];

const CHAINS = ["ETH", "ARB", "BASE", "OP", "MATIC", "LINEA", "SCROLL", "BLAST"];

const DEFAULT_STATS = [
  { label: "PORTFOLIO VALUE", value: "$124,582", color: "#FFB800" },
  { label: "TOTAL PNL",       value: "+$23,451", color: "#00D68F" },
  { label: "WIN RATE",        value: "68.4%",    color: "#00D68F" },
  { label: "REALIZED PNL",    value: "+$18,220", color: "#00D68F" },
];

const CHAIN_HEADERS: Record<string, string> = {
  ethereum: "ETH MAINNET",
  arbitrum: "ARB ONE",
  base:     "BASE",
  optimism: "OPTIMISM",
  polygon:  "POLYGON",
  linea:    "LINEA",
  scroll:   "SCROLL",
  blast:    "BLAST",
};

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/i;

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim();
  const chainParam = searchParams.get("chain")?.trim() ?? "ethereum";
  const chain = VALID_CHAINS.includes(chainParam) ? chainParam : "ethereum";

  const hasAddress = !!address && ADDRESS_RE.test(address);
  const shortAddr  = hasAddress ? formatAddress(address!) : null;
  const chainLabel = CHAIN_HEADERS[chain] ?? chain.toUpperCase();

  return new ImageResponse(
    (
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
        {/* Top amber bar */}
        <div style={{ height: 4, width: "100%", background: "#FFB800", opacity: 0.85, flexShrink: 0 }} />

        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "52px 68px 44px 68px" }}>

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 44 }}>
            <span style={{ color: "#FFB800", fontSize: 18, fontWeight: 700, letterSpacing: "0.22em" }}>
              RECON
            </span>
            <div style={{
              marginLeft: 14,
              background: "rgba(255,184,0,0.12)",
              border: "1px solid rgba(255,184,0,0.38)",
              borderRadius: 3,
              color: "#FFB800",
              padding: "3px 12px",
              fontSize: 11,
              letterSpacing: "0.12em",
            }}>
              TERMINAL
            </div>
            {hasAddress && (
              <div style={{
                marginLeft: 14,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 3,
                color: "#8A93B8",
                padding: "3px 12px",
                fontSize: 11,
                letterSpacing: "0.12em",
              }}>
                {chainLabel}
              </div>
            )}
            <div style={{ flex: 1 }} />
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#00D68F", marginRight: 8 }} />
            <span style={{ color: "#8A93B8", fontSize: 13, letterSpacing: "0.16em" }}>LIVE</span>
          </div>

          {/* Title */}
          <div style={{ display: "flex", alignItems: "baseline", marginBottom: 16 }}>
            {hasAddress ? (
              <span style={{
                color: "#FFB800",
                fontSize: 80,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}>
                {shortAddr}
              </span>
            ) : (
              <>
                <span style={{
                  color: "#E8EAF4",
                  fontSize: 108,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                }}>
                  WALLET
                </span>
                <span style={{
                  color: "#FFB800",
                  fontSize: 108,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  marginLeft: 28,
                }}>
                  PNL
                </span>
              </>
            )}
          </div>

          {/* Subtitle */}
          <div style={{
            color: "#60687F",
            fontSize: 15,
            letterSpacing: "0.18em",
            marginBottom: 40,
          }}>
            EVM TOKEN-BY-TOKEN BREAKDOWN · FIFO COST BASIS · 8 CHAINS
          </div>

          {/* Stat cards */}
          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
            {DEFAULT_STATS.map(({ label, value, color }) => (
              <div key={label} style={{
                flex: 1,
                background: "#0C0F1C",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 4,
                borderTop: `2px solid ${color}`,
                padding: "18px 22px",
                display: "flex",
                flexDirection: "column",
              }}>
                <span style={{ color: "#60687F", fontSize: 10, letterSpacing: "0.2em", marginBottom: 10 }}>
                  {label}
                </span>
                <span style={{ color, fontSize: 30, fontWeight: 700 }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Chain badges */}
          <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
            {CHAINS.map((c) => (
              <div key={c} style={{
                background: "rgba(255,184,0,0.07)",
                border: "1px solid rgba(255,184,0,0.22)",
                borderRadius: 3,
                color: "#8A93B8",
                padding: "4px 11px",
                fontSize: 11,
                letterSpacing: "0.1em",
              }}>
                {c}
              </div>
            ))}
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{ height: 2, width: "40%", background: "#FFB800", opacity: 0.3, flexShrink: 0 }} />
      </div>
    ),
    {
      ...SIZE,
      headers: {
        // Cache aggressively — this is a static render now
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Type": "image/png",
      },
    }
  );
}
