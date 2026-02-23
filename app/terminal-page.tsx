"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { Chain, TokenPnL, Summary } from "@/lib/types";
import { useShareUrl } from "@/hooks/use-share-url";

// ─── Chain metadata ─────────────────────────────────────────────────────────

const CHAIN_OPTIONS: { value: Chain; label: string; header: string }[] = [
  { value: "ethereum", label: "● Ethereum Mainnet", header: "ETH MAINNET" },
  { value: "arbitrum", label: "◆ Arbitrum One",     header: "ARB ONE"     },
  { value: "base",     label: "◆ Base",             header: "BASE"        },
  { value: "optimism", label: "◆ Optimism",         header: "OPTIMISM"    },
  { value: "polygon",  label: "◆ Polygon",          header: "POLYGON"     },
  { value: "bnb",      label: "◆ BNB Chain",        header: "BNB CHAIN"   },
  { value: "linea",    label: "◆ Linea",            header: "LINEA"       },
  { value: "scroll",   label: "◆ Scroll",           header: "SCROLL"      },
  { value: "blast",    label: "◆ Blast",            header: "BLAST"       },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtUsd(n: number): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${fmt(abs / 1_000_000, 2)}M`;
  if (abs >= 1_000) return `${sign}$${fmt(abs / 1_000, 2)}K`;
  return `${sign}$${fmt(abs, 2)}`;
}

function fmtQty(n: number): string {
  if (!isFinite(n)) return "—";
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(2);
  if (n >= 1_000_000) return `${fmt(n / 1_000_000, 2)}M`;
  if (n >= 1_000) return `${fmt(n / 1_000, 2)}K`;
  return fmt(n, 4);
}

function fmtPrice(n: number): string {
  if (!isFinite(n) || n === 0) return "—";
  if (n < 0.0001) return `$${n.toExponential(2)}`;
  if (n < 0.01) return `$${fmt(n, 6)}`;
  if (n < 1) return `$${fmt(n, 4)}`;
  return `$${fmt(n, 2)}`;
}

function pnlClass(n: number): string {
  if (n > 0.005) return "txt-profit";
  if (n < -0.005) return "txt-loss";
  return "txt-neutral";
}

function PnlBadge({ value, percent }: { value: number; percent?: number }) {
  const cls =
    value > 0.005
      ? "badge-profit"
      : value < -0.005
      ? "badge-loss"
      : "badge-neutral";
  const sign = value > 0 ? "+" : "";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium ${cls}`}
      style={{ whiteSpace: "nowrap" }}
    >
      {sign}{fmtUsd(value)}
      {percent !== undefined && Math.abs(percent) < 9999 && (
        <span className="opacity-70">
          ({sign}{fmt(percent, 1)}%)
        </span>
      )}
    </span>
  );
}

// ─── Boot Sequence ──────────────────────────────────────────────────────────

const BOOT_LINES = [
  "> INITIALIZING RECON TERMINAL v2.4.1",
  "> LOADING ETHERSCAN MODULE... OK",
  "> LOADING COINGECKO PRICE FEED... OK",
  "> FIFO ENGINE READY",
  "> FETCHING TOKEN TRANSFER HISTORY...",
  "> RESOLVING PRICE DATA...",
  "> COMPUTING COST BASIS...",
  "> RENDERING RESULTS.",
];

function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let i = 0;
    const tick = () => {
      if (i < BOOT_LINES.length) {
        setLines((prev) => [...prev, BOOT_LINES[i]]);
        i++;
        timers.push(setTimeout(tick, 280 + Math.random() * 120));
      } else {
        setDone(true);
        timers.push(setTimeout(onComplete, 400));
      }
    };
    timers.push(setTimeout(tick, 100));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="mt-8 p-6 rounded-sm card text-xs leading-relaxed" style={{ minHeight: 200 }}>
      {lines.map((line, i) => (
        <div
          key={i}
          className="boot-line"
          style={{ animationDelay: `0ms`, color: i === lines.length - 1 && !done ? "var(--accent)" : "var(--txt-secondary)" }}
        >
          {line}
        </div>
      ))}
      {!done && (
        <span
          className="inline-block w-2 h-4 ml-1 align-middle"
          style={{
            background: "var(--accent)",
            animation: "blink 1s step-end infinite",
            verticalAlign: "text-bottom",
          }}
        />
      )}
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="token-row">
      {[120, 80, 70, 70, 90, 90, 90].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton" style={{ width: w, height: 14 }} />
        </td>
      ))}
    </tr>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card p-5 rounded-sm">
          <div className="skeleton mb-2" style={{ width: 80, height: 11 }} />
          <div className="skeleton" style={{ width: 120, height: 22 }} />
        </div>
      ))}
    </div>
  );
}

// ─── Summary Cards ──────────────────────────────────────────────────────────

function SummaryCards({ summary }: { summary: Summary }) {
  const pnlSign = summary.totalPnl >= 0 ? "+" : "";
  const pnlColor = summary.totalPnl > 0 ? "var(--profit)" : summary.totalPnl < 0 ? "var(--loss)" : "var(--txt-secondary)";

  const cards = [
    {
      label: "PORTFOLIO VALUE",
      value: fmtUsd(summary.totalValue),
      sub: `${summary.tokensTracked} token${summary.tokensTracked !== 1 ? "s" : ""} tracked`,
      color: "var(--accent)",
    },
    {
      label: "TOTAL PNL",
      value: `${pnlSign}${fmtUsd(summary.totalPnl)}`,
      sub: `${pnlSign}${fmt(summary.totalPnlPercent, 1)}% overall`,
      color: pnlColor,
    },
    {
      label: "WIN RATE",
      value: `${fmt(summary.winRate, 1)}%`,
      sub: `${Math.round((summary.winRate / 100) * summary.tokensTracked)} / ${summary.tokensTracked} profitable`,
      color: summary.winRate >= 50 ? "var(--profit)" : "var(--loss)",
    },
    {
      label: "REALIZED PNL",
      value: `${summary.realizedPnl >= 0 ? "+" : ""}${fmtUsd(summary.realizedPnl)}`,
      sub: "FIFO cost basis",
      color: summary.realizedPnl > 0 ? "var(--profit)" : summary.realizedPnl < 0 ? "var(--loss)" : "var(--txt-secondary)",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map((c, i) => (
        <div
          key={i}
          className="card rounded-sm p-5 animate-slide-up"
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
        >
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--txt-muted)" }}>
            {c.label}
          </div>
          <div className="text-xl font-bold truncate" style={{ color: c.color }}>
            {c.value}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--txt-muted)" }}>
            {c.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Token Table ────────────────────────────────────────────────────────────

type SortKey = "symbol" | "value" | "pnl" | "unrealized" | "realized" | "price" | "avgBuy";

function TokenTable({ tokens }: { tokens: TokenPnL[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState("");

  const sorted = [...tokens]
    .filter((t) =>
      filter === "" ||
      t.symbol.toLowerCase().includes(filter.toLowerCase()) ||
      t.name.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      let va: number, vb: number;
      switch (sortKey) {
        case "symbol":
          return sortAsc
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        case "value":
          va = a.quantityHeld * a.currentPrice;
          vb = b.quantityHeld * b.currentPrice;
          break;
        case "pnl":
          va = a.totalPnl;
          vb = b.totalPnl;
          break;
        case "unrealized":
          va = a.unrealizedPnl;
          vb = b.unrealizedPnl;
          break;
        case "realized":
          va = a.realizedPnl;
          vb = b.realizedPnl;
          break;
        case "price":
          va = a.currentPrice;
          vb = b.currentPrice;
          break;
        case "avgBuy":
          va = a.avgBuyPrice;
          vb = b.avgBuyPrice;
          break;
        default:
          va = vb = 0;
      }
      return sortAsc ? va - vb : vb - va;
    });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortArrow = ({ k }: { k: SortKey }) => (
    <span className="ml-1 opacity-40" style={sortKey === k ? { opacity: 1, color: "var(--accent)" } : {}}>
      {sortKey === k ? (sortAsc ? "↑" : "↓") : "⇅"}
    </span>
  );

  const ColHead = ({
    label, k, align = "right",
  }: { label: string; k: SortKey; align?: "left" | "right" }) => (
    <th
      className={`px-4 py-3 text-xs tracking-widest font-medium text-${align}`}
      style={{ color: "var(--txt-muted)", whiteSpace: "nowrap" }}
    >
      <button className={`sort-btn ${sortKey === k ? "active" : ""} ${align === "right" ? "ml-auto" : ""}`} onClick={() => handleSort(k)}>
        {label}<SortArrow k={k} />
      </button>
    </th>
  );

  if (tokens.length === 0) {
    return (
      <div className="card rounded-sm p-12 text-center">
        <div className="text-sm" style={{ color: "var(--txt-muted)" }}>
          NO TOKEN POSITIONS FOUND
        </div>
        <div className="text-xs mt-2" style={{ color: "var(--txt-muted)" }}>
          This wallet has no ERC-20 token history on the selected chain.
        </div>
      </div>
    );
  }

  return (
    <div className="card rounded-sm animate-fade-in">
      {/* Table toolbar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <input
          className="terminal-input text-xs px-3 py-1.5 rounded-sm"
          style={{ width: 200 }}
          placeholder="FILTER TOKEN..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="text-xs" style={{ color: "var(--txt-muted)" }}>
          {sorted.length} / {tokens.length} POSITIONS
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-bright)" }}>
              <ColHead label="TOKEN" k="symbol" align="left" />
              <th className="px-4 py-3 text-xs tracking-widest font-medium text-right"
                style={{ color: "var(--txt-muted)", whiteSpace: "nowrap" }}>
                QTY HELD
              </th>
              <ColHead label="PRICE" k="price" />
              <ColHead label="VALUE" k="value" />
              <ColHead label="AVG BUY" k="avgBuy" />
              <ColHead label="UNREALIZED" k="unrealized" />
              <ColHead label="REALIZED" k="realized" />
              <ColHead label="TOTAL PNL" k="pnl" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => {
              const heldValue = t.quantityHeld * t.currentPrice;
              return (
                <tr
                  key={t.contractAddress}
                  className="token-row animate-slide-up"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
                >
                  {/* Token */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.logoUrl ? (
                        <img src={t.logoUrl} alt={t.symbol} width={20} height={20}
                          className="rounded-full" style={{ flexShrink: 0 }} />
                      ) : (
                        <div className="flex items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            width: 20, height: 20, flexShrink: 0,
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border-bright)",
                            color: "var(--txt-muted)",
                            fontSize: 9,
                          }}>
                          {t.symbol.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold" style={{ color: "var(--accent)" }}>
                          {t.symbol}
                        </div>
                        <div className="font-light" style={{ color: "var(--txt-muted)", fontSize: 10 }}>
                          {t.contractAddress.slice(0, 6)}…{t.contractAddress.slice(-4)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Qty Held */}
                  <td className="px-4 py-3 text-right font-mono" style={{ color: "var(--txt-primary)" }}>
                    {t.quantityHeld > 0 ? fmtQty(t.quantityHeld) : <span style={{ color: "var(--txt-muted)" }}>—</span>}
                  </td>

                  {/* Current Price */}
                  <td className="px-4 py-3 text-right font-mono" style={{ color: "var(--txt-primary)" }}>
                    {t.currentPrice > 0 ? fmtPrice(t.currentPrice) : (
                      <span style={{ color: "var(--txt-muted)" }}>NO FEED</span>
                    )}
                  </td>

                  {/* Value */}
                  <td className="px-4 py-3 text-right font-mono" style={{ color: "var(--txt-primary)" }}>
                    {heldValue > 0 ? fmtUsd(heldValue) : <span style={{ color: "var(--txt-muted)" }}>—</span>}
                  </td>

                  {/* Avg Buy Price */}
                  <td className="px-4 py-3 text-right font-mono">
                    {t.avgBuyPrice > 0 ? (
                      <span style={{ color: "var(--txt-secondary)" }}>
                        {t.hasHistoricalPrice ? "" : "~"}{fmtPrice(t.avgBuyPrice)}
                      </span>
                    ) : (
                      <span style={{ color: "var(--txt-muted)" }}>—</span>
                    )}
                  </td>

                  {/* Unrealized PnL */}
                  <td className="px-4 py-3 text-right">
                    {t.currentPrice > 0 && t.quantityHeld > 0 ? (
                      <PnlBadge value={t.unrealizedPnl} percent={t.pnlPercent} />
                    ) : (
                      <span style={{ color: "var(--txt-muted)" }}>—</span>
                    )}
                  </td>

                  {/* Realized PnL */}
                  <td className="px-4 py-3 text-right">
                    {Math.abs(t.realizedPnl) > 0.001 ? (
                      <PnlBadge value={t.realizedPnl} />
                    ) : (
                      <span style={{ color: "var(--txt-muted)" }}>—</span>
                    )}
                  </td>

                  {/* Total PnL */}
                  <td className="px-4 py-3 text-right">
                    {Math.abs(t.totalPnl) > 0.001 ? (
                      <span className={`font-semibold ${pnlClass(t.totalPnl)}`}>
                        {t.totalPnl > 0 ? "+" : ""}{fmtUsd(t.totalPnl)}
                      </span>
                    ) : (
                      <span style={{ color: "var(--txt-muted)" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div
        className="px-4 py-2 text-xs"
        style={{ borderTop: "1px solid var(--border)", color: "var(--txt-muted)" }}
      >
        ~ = estimated using current price · FIFO cost basis · prices via CoinGecko
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function TerminalPage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState<Chain>("ethereum");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(false);
  const [tokens, setTokens] = useState<TokenPnL[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // Captures address+chain at analyze-time so handleBootComplete is stable
  const pendingRef = useRef({ address: "", chain: "ethereum" as Chain });

  const { updateUrl, clearUrl, copyShareUrl, copied } = useShareUrl({
    onPrefill: (addr, c) => {
      setAddress(addr);
      setChain(c);
      pendingRef.current = { address: addr, chain: c };
      setError(null);
      setTokens(null);
      setSummary(null);
      setBooting(true);
    },
  });

  // Live clock — UTC
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        `${d.toLocaleTimeString("en-US", {
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hour12: false, timeZone: "UTC",
        })} UTC`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleAnalyze = useCallback(() => {
    const trimmed = address.trim();
    if (!trimmed) return;

    // Basic validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      setError("Invalid address — must be a 42-character 0x... hex string.");
      return;
    }

    // Capture address+chain at submit time so the fetch callback stays stable
    pendingRef.current = { address: trimmed, chain };
    clearUrl();
    setError(null);
    setTokens(null);
    setSummary(null);
    setBooting(true);
  }, [address, chain, clearUrl]);

  // Stable callback — reads address/chain from ref, not state
  const handleBootComplete = useCallback(async () => {
    const { address: addr, chain: c } = pendingRef.current;
    setBooting(false);
    setLoading(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr, chain: c }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unknown error");
        return;
      }
      setTokens(data.tokens ?? []);
      setSummary(data.summary ?? null);
      updateUrl(addr, c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [updateUrl]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && !booting) handleAnalyze();
  };

  const isLoading = booting || loading;

  return (
    <div className="relative min-h-screen" style={{ zIndex: 1 }}>
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-6 py-3"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(7,8,15,0.8)",
          backdropFilter: "blur(8px)",
          position: "sticky", top: 0, zIndex: 50,
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-bold tracking-widest glow-amber"
            style={{ color: "var(--accent)", letterSpacing: "0.2em" }}
          >
            RECON
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-sm"
            style={{
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-border)",
              color: "var(--accent)",
              letterSpacing: "0.1em",
            }}
          >
            TERMINAL
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--txt-secondary)" }}>
          <div className="flex items-center gap-2">
            <div className="status-dot" />
            <span className="uppercase tracking-widest">
              {CHAIN_OPTIONS.find(c => c.value === chain)?.header ?? chain.toUpperCase()}
            </span>
          </div>
          <span className="hidden sm:block font-mono" style={{ color: "var(--txt-muted)" }}>
            {clock}
          </span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Title block ── */}
        <div className="mb-8">
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-2"
            style={{ color: "var(--txt-primary)", lineHeight: 1.1 }}
          >
            WALLET
            <span style={{ color: "var(--accent)" }}> PNL</span>
          </h1>
          <p className="text-xs tracking-widest uppercase" style={{ color: "var(--txt-muted)" }}>
            EVM token-by-token breakdown · FIFO cost basis · 9 chains
          </p>
        </div>

        {/* ── Input ── */}
        <div className="mb-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs select-none"
                style={{ color: "var(--accent)", opacity: 0.7 }}
              >
                ›
              </span>
              <input
                ref={inputRef}
                type="text"
                className="terminal-input w-full pl-7 pr-4 py-3 rounded-sm text-sm"
                placeholder="0x... wallet address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
              />
            </div>
            <button
              className="btn-analyze rounded-sm h-12"
              style={{ minWidth: 120 }}
              onClick={handleAnalyze}
              disabled={isLoading || !address.trim()}
            >
              {isLoading ? "LOADING..." : "ANALYZE →"}
            </button>
          </div>
        </div>

        {/* ── Chain selector ── */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-xs uppercase tracking-widest" style={{ color: "var(--txt-muted)" }}>
            CHAIN:
          </span>
          <div className="chain-select-wrap">
            <select
              className="chain-select rounded-sm"
              value={chain}
              onChange={(e) => !isLoading && setChain(e.target.value as Chain)}
              disabled={isLoading}
            >
              {CHAIN_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-sm text-xs"
            style={{
              background: "var(--loss-dim)",
              border: "1px solid var(--loss-border)",
              color: "var(--loss)",
            }}
          >
            <span className="font-bold">ERROR:</span> {error}
          </div>
        )}

        {/* ── Boot sequence ── */}
        {booting && <BootSequence onComplete={handleBootComplete} />}

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="animate-fade-in">
            <SummarySkeleton />
            <div className="card rounded-sm overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {!isLoading && summary && tokens && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-end mb-3">
              <button
                className="text-xs uppercase tracking-widest px-3 py-1.5 rounded-sm"
                style={{
                  background: "var(--accent-dim)",
                  border: "1px solid var(--accent-border)",
                  color: "var(--accent)",
                  cursor: "pointer",
                }}
                onClick={copyShareUrl}
              >
                {copied ? "COPIED!" : "SHARE ↗"}
              </button>
            </div>
            <SummaryCards summary={summary} />
            <TokenTable tokens={tokens} />
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && !error && !summary && (
          <div
            className="text-center py-24"
            style={{ color: "var(--txt-muted)" }}
          >
            <div className="text-5xl mb-4 opacity-20">◈</div>
            <div className="text-xs uppercase tracking-widest mb-2">
              AWAITING WALLET ADDRESS
            </div>
            <div className="text-xs" style={{ color: "var(--txt-muted)", opacity: 0.6 }}>
              Paste any EVM wallet address above and press ANALYZE
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="mt-12 pt-6 text-xs text-center" style={{ borderTop: "1px solid var(--border)", color: "var(--txt-muted)" }}>
          <p>
            Recon · Data via Etherscan, CoinGecko and Defillama free tiers ·{" "}
            <span style={{ color: "var(--accent)", opacity: 0.6 }}>
              PnL values are estimates — not financial advice
            </span>
          </p>
          <p className="mt-6">
            <a className="text-accent hover:underline" href="https://x.com/marvel_codes" target="_blank" rel="noopener noreferrer">Da developer</a>
            {" · "}
            <a className="text-accent hover:underline" href="https://github.com/MarvelNwachukwu/Recon" target="_blank" rel="noopener noreferrer">Source Code</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
