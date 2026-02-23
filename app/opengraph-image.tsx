import { ImageResponse } from "next/og";

export const alt = "Recon — EVM Wallet PnL Terminal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STATS = [
  { label: "PORTFOLIO VALUE", value: "$124,582", color: "#FFB800" },
  { label: "TOTAL PNL",       value: "+$23,451", color: "#00D68F" },
  { label: "WIN RATE",        value: "68.4%",    color: "#00D68F" },
  { label: "REALIZED PNL",    value: "+$18,220", color: "#00D68F" },
];

const CHAINS = ["ETH", "ARB", "BASE", "OP", "MATIC", "BNB", "LINEA", "SCROLL", "BLAST"];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#07080F",
          fontFamily: "monospace",
        }}
      >
        {/* Top amber bar */}
        <div style={{ height: 4, width: "100%", backgroundColor: "#FFB800", flexShrink: 0 }} />

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "52px 68px 44px" }}>

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 44 }}>
            <span style={{ color: "#FFB800", fontSize: 18, fontWeight: 700, letterSpacing: 4 }}>
              RECON
            </span>
            <div style={{
              display: "flex",
              alignItems: "center",
              marginLeft: 14,
              backgroundColor: "rgba(255,184,0,0.12)",
              borderRadius: 3,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "rgba(255,184,0,0.38)",
              paddingTop: 3,
              paddingBottom: 3,
              paddingLeft: 12,
              paddingRight: 12,
            }}>
              <span style={{ color: "#FFB800", fontSize: 11, letterSpacing: 2 }}>TERMINAL</span>
            </div>
            <div style={{ flexGrow: 1 }} />
            <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#00D68F", marginRight: 8 }} />
            <span style={{ color: "#8A93B8", fontSize: 13, letterSpacing: 2 }}>LIVE</span>
          </div>

          {/* Title */}
          <div style={{ display: "flex", alignItems: "flex-end", marginBottom: 16 }}>
            <span style={{ color: "#E8EAF4", fontSize: 108, fontWeight: 700, lineHeight: 1, letterSpacing: -3 }}>
              RECON
            </span>
          </div>

          {/* Subtitle */}
          <div style={{ color: "#60687F", fontSize: 15, letterSpacing: 3, marginBottom: 40 }}>
            EVM TOKEN-BY-TOKEN BREAKDOWN · FIFO COST BASIS · 9 CHAINS
          </div>

          {/* Stat cards */}
          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
            {STATS.map(({ label, value, color }) => (
              <div key={label} style={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                flexBasis: 0,
                backgroundColor: "#0C0F1C",
                borderRadius: 4,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}>
                {/* Color accent strip — avoids borderTop shorthand */}
                <div style={{ height: 2, backgroundColor: color, flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", padding: "16px 22px" }}>
                  <span style={{ color: "#60687F", fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>
                    {label}
                  </span>
                  <span style={{ color, fontSize: 30, fontWeight: 700 }}>
                    {value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Chain badges */}
          <div style={{ display: "flex", gap: 9 }}>
            {CHAINS.map((chain) => (
              <div key={chain} style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(255,184,0,0.07)",
                borderRadius: 3,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "rgba(255,184,0,0.22)",
                paddingTop: 4,
                paddingBottom: 4,
                paddingLeft: 11,
                paddingRight: 11,
              }}>
                <span style={{ color: "#8A93B8", fontSize: 11, letterSpacing: 1 }}>{chain}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{ height: 2, width: "40%", backgroundColor: "#FFB800", flexShrink: 0 }} />
      </div>
    ),
    size
  );
}
