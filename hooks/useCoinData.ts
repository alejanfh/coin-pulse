import { useCallback, useEffect, useState } from "react";
import type { CoinDataResponse } from "@/app/api/coin/[coinId]/route";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "idle" | "loading" | "success" | "error";

interface UseCoinDataReturn {
  price: ExtendedPriceData | null;
  trades: Trade[];
  ohlcv: null; // kept for interface compatibility with the WS hook
  isConnected: boolean;
  status: Status;
  error: string | null;
  /** Manually re-fetch (e.g. pull-to-refresh button) */
  refresh: () => void;
}

interface UseCoinDataProps {
  coinId: string;
  poolId: string;
  /** Unused — kept for API compatibility with the WS hook */
  liveInterval?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches coin price + trades once on mount (and on `coinId`/`poolId` change)
 * via the internal Next.js Route Handler `/api/coin/[coinId]`.
 *
 * - No API key exposed to the client
 * - No polling / WebSocket — one request per page load
 * - Exposes `refresh()` for manual re-fetches (e.g. a "Refresh" button)
 * - Same return shape as `useCoinGeckoWebSocket` for drop-in compatibility
 */
export function useCoinData({
  coinId,
  poolId,
}: UseCoinDataProps): UseCoinDataReturn {
  const [price, setPrice] = useState<ExtendedPriceData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // `trigger` is bumped by `refresh()` to re-run the effect without changing deps
  const [trigger, setTrigger] = useState(0);

  const refresh = useCallback(() => setTrigger((n) => n + 1), []);

  useEffect(() => {
    if (!coinId) return;

    let cancelled = false;

    const load = async () => {
      setStatus("loading");
      setError(null);

      try {
        const url = `/api/coin/${encodeURIComponent(coinId)}?poolId=${encodeURIComponent(poolId)}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data: CoinDataResponse = await res.json();

        if (cancelled) return;

        setPrice(data.price);
        setTrades(data.trades);
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [coinId, poolId, trigger]);

  return {
    price,
    trades,
    ohlcv: null,
    isConnected: status === "success",
    status,
    error,
    refresh,
  };
}
