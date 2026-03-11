import { useCallback, useEffect, useRef, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_COINGECKO_BASE_URL ?? "";
const API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY ?? "";

const DEFAULT_PRICE_INTERVAL_MS = 15_000;
const DEFAULT_TRADES_INTERVAL_MS = 10_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("x_cg_pro_api_key", API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Raw API response shapes ──────────────────────────────────────────────────

interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change: number;
    usd_market_cap: number;
    usd_24h_vol: number;
    last_updated_at: number;
  };
}

interface CoinGeckoTradeResponse {
  trades: Array<{
    timestamp: string; // ISO string
    price: string;
    volume: string;
    from_token_amount: string;
    kind: "buy" | "sell";
  }>;
}

// ─── Normalizers (raw API → domain types) ─────────────────────────────────────

function normalizePrice(
  coinId: string,
  raw: CoinGeckoPriceResponse,
): ExtendedPriceData | null {
  const data = raw[coinId];
  if (!data) return null;

  return {
    usd: data.usd,
    coin: coinId,
    price: data.usd,
    change24h: data.usd_24h_change,
    marketCap: data.usd_market_cap,
    volume24h: data.usd_24h_vol,
    timestamp: data.last_updated_at,
  };
}

function normalizeTrades(raw: CoinGeckoTradeResponse): Trade[] {
  return raw.trades.slice(0, 7).map((t) => ({
    price: parseFloat(t.price),
    value: parseFloat(t.volume),
    amount: parseFloat(t.from_token_amount),
    timestamp: new Date(t.timestamp).getTime(),
    type: t.kind === "buy" ? "b" : "s",
  }));
}

// ─── Polling primitives ───────────────────────────────────────────────────────

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>;
  onSuccess: (data: T) => void;
  onError?: (err: unknown) => void;
  intervalMs: number;
  enabled: boolean;
}

/**
 * Generic polling primitive. Fires immediately, then on every `intervalMs`.
 * Cleans up automatically when `enabled` turns false or deps change.
 */
function usePolling<T>({
  fetcher,
  onSuccess,
  onError,
  intervalMs,
  enabled,
}: UsePollingOptions<T>): void {
  // Keep a stable ref to callbacks so interval never needs to restart when
  // parent re-renders with new inline functions.
  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    fetcherRef.current = fetcher;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const data = await fetcherRef.current();
        if (!cancelled) onSuccessRef.current(data);
      } catch (err) {
        if (!cancelled) onErrorRef.current?.(err);
      }
    };

    poll(); // immediate first fetch
    const id = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs, enabled]);
}

// ─── Public hook ──────────────────────────────────────────────────────────────

interface UseCoinGeckoPollingProps {
  coinId: string;
  poolId: string; // format: "networkId_poolAddress"  (same as WS hook)
  /** Unused — kept for API compatibility with the WS hook */
  liveInterval?: string;
  priceIntervalMs?: number;
  tradesIntervalMs?: number;
}

/**
 * Drop-in replacement for `useCoinGeckoWebSocket`.
 * Returns the same shape: `{ price, trades, ohlcv, isConnected }`.
 *
 * `ohlcv` is not provided by the REST trade endpoint, so it remains `null`.
 * If you need live candles, combine this hook with a separate OHLCV fetcher.
 */
export function useCoinGeckoPolling({
  coinId,
  poolId,
  priceIntervalMs = DEFAULT_PRICE_INTERVAL_MS,
  tradesIntervalMs = DEFAULT_TRADES_INTERVAL_MS,
}: UseCoinGeckoPollingProps): UseCoinGeckoWebSocketReturn {
  const [price, setPrice] = useState<ExtendedPriceData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Derive network + pool address from the poolId ("ethereum_0xabc…")
  const [network, poolAddress] = poolId.split("_");
  const hasPool = Boolean(network && poolAddress);

  // ── Price polling ────────────────────────────────────────────────────────

  const fetchPrice = useCallback(
    () =>
      fetchJson<CoinGeckoPriceResponse>(
        buildUrl("/simple/price", {
          ids: coinId,
          vs_currencies: "usd",
          include_market_cap: "true",
          include_24hr_vol: "true",
          include_24hr_change: "true",
          include_last_updated_at: "true",
        }),
      ),
    [coinId],
  );

  usePolling({
    fetcher: fetchPrice,
    onSuccess: (raw) => {
      const normalized = normalizePrice(coinId, raw);
      if (normalized) {
        setPrice(normalized);
        setIsConnected(true);
      }
    },
    onError: () => setIsConnected(false),
    intervalMs: priceIntervalMs,
    enabled: Boolean(coinId),
  });

  // ── Trades polling ────────────────────────────────────────────────────────

  const fetchTrades = useCallback(
    () =>
      fetchJson<CoinGeckoTradeResponse>(
        buildUrl(`/onchain/networks/${network}/pools/${poolAddress}/trades`),
      ),
    [network, poolAddress],
  );

  usePolling({
    fetcher: fetchTrades,
    onSuccess: (raw) => setTrades(normalizeTrades(raw)),
    intervalMs: tradesIntervalMs,
    enabled: hasPool,
  });

  // ── Reset on coin/pool change ─────────────────────────────────────────────

  useEffect(() => {
    setPrice(null);
    setTrades([]);
    setIsConnected(false);
  }, [coinId, poolId]);

  return {
    price,
    trades,
    ohlcv: null, // not available via REST trades endpoint
    isConnected,
  };
}
