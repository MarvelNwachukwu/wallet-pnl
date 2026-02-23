"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Chain } from "@/lib/types";

const VALID_CHAINS: Chain[] = [
  "ethereum", "arbitrum", "base", "optimism",
  "polygon", "bnb", "linea", "scroll", "blast",
];

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

interface UseShareUrlOptions {
  onPrefill: (address: string, chain: Chain) => void;
}

interface UseShareUrlReturn {
  updateUrl: (address: string, chain: Chain) => void;
  clearUrl: () => void;
  copyShareUrl: () => Promise<boolean>;
  copied: boolean;
}

export function useShareUrl({ onPrefill }: UseShareUrlOptions): UseShareUrlReturn {
  const searchParams = useSearchParams();
  const firedRef = useRef(false);
  const [copied, setCopied] = useState(false);

  // Read URL params on mount and trigger prefill once
  useEffect(() => {
    if (firedRef.current) return;

    const urlAddress = searchParams.get("address");
    const urlChain = searchParams.get("chain");

    if (urlAddress && ADDRESS_RE.test(urlAddress)) {
      firedRef.current = true;
      const chain: Chain =
        urlChain && VALID_CHAINS.includes(urlChain as Chain)
          ? (urlChain as Chain)
          : "ethereum";
      onPrefill(urlAddress, chain);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateUrl = useCallback((address: string, chain: Chain) => {
    const params = new URLSearchParams({ address, chain });
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, []);

  const clearUrl = useCallback(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const copyShareUrl = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { updateUrl, clearUrl, copyShareUrl, copied };
}
