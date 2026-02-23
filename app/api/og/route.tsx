import { ImageResponse } from "next/og";

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 };

const STATS = [
  { label: "PORTFOLIO VALUE", value: "$124,582", color: "#FFB800" },
  { label: "TOTAL PNL", value: "+$23,451", color: "#00D68F" },
  { label: "WIN RATE", value: "68.4%", color: "#00D68F" },
  { label: "REALIZED PNL", value: "+$18,220", color: "#00D68F" },
];

const CHAINS = ["ETH", "ARB", "BASE", "OP", "MATIC", "BNB", "LINEA", "SCROLL", "BLAST"];

export async function GET() {
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
                fontSize: 108,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              RECON
            </span>
          </div>
          <div
            style={{
              color: "#60687F",
              fontSize: 16,
              letterSpacing: "0.2em",
              marginBottom: 48,
            }}
          >
            EVM TOKEN-BY-TOKEN BREAKDOWN · FIFO COST BASIS · 9 CHAINS
          </div>
          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
            {STATS.map(({ label, value, color }) => (
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
            {CHAINS.map((chain) => (
              <div
                key={chain}
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
                {chain}
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 2, width: "40%", background: "#FFB800", opacity: 0.3 }} />
      </div>
    ),
    {
      ...SIZE,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Content-Type": "image/png",
      },
    }
  );
}
