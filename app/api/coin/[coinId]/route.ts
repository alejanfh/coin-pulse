// app/api/coin/[coinId]/route.ts
import { NextRequest, NextResponse } from "next/server";

// ─── Constants ────────────────────────────────────────────────────────────────

const CG_BASE =
  process.env.COINGECKO_BASE_URL || "https://api.coingecko.com/api/v3";
const API_KEY = process.env.COINGECKO_API_KEY ?? ""; // server-only, no NEXT_PUBLIC_

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cgUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${CG_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

// Para precio — CoinGecko con API key
async function cgFetch<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${CG_BASE}${path}`);
  if (params)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { "x-cg-demo-api-key": API_KEY },
    next: { revalidate: 30 },
  });

  if (!res.ok) throw new Error(`CoinGecko ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// Para trades — GeckoTerminal, gratuito, sin API key
async function gtFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${CG_BASE}${path}`, {
    headers: { "x-cg-demo-api-key": API_KEY },
    next: { revalidate: 30 },
  });

  if (!res.ok) throw new Error(`GeckoTerminal ${res.status}: ${path}`);

  return res.json() as Promise<T>;
}

// ─── Raw CoinGecko shapes ─────────────────────────────────────────────────────

interface RawPrice {
  [coinId: string]: {
    usd: number;
    usd_24h_change: number;
    usd_market_cap: number;
    usd_24h_vol: number;
    last_updated_at: number;
  };
}

interface RawTrade {
  timestamp: string;
  price_from_in_usd: string;
  to_token_amount: string;
  from_token_amount: string;
  kind: "buy" | "sell";
  block_timestamp: string;
}

interface RawTradesResponse {
  data: Array<{
    attributes: RawTrade;
  }>;
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizePrice(
  coinId: string,
  raw: RawPrice,
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

function normalizeTrades(raw: RawTradesResponse): Trade[] {
  return raw.data.slice(0, 7).map(({ attributes: t }) => ({
    price: parseFloat(t.price_from_in_usd),
    value: parseFloat(t.to_token_amount),
    amount: parseFloat(t.from_token_amount),
    timestamp: new Date(t.block_timestamp).getTime(),
    type: t.kind === "buy" ? ("b" as const) : ("s" as const),
  }));
}

// ─── Route Handler ────────────────────────────────────────────────────────────

interface RouteParams {
  params: Promise<{ coinId: string }>;
}

export interface CoinDataResponse {
  price: ExtendedPriceData | null;
  trades: Trade[];
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { coinId } = await params;
  const { searchParams } = req.nextUrl;
  const poolId = searchParams.get("poolId") ?? "";

  try {
    const [network, poolAddress] = poolId.split("_");
    const hasPool = Boolean(network && poolAddress);

    // Fan out both requests in parallel — trades failure is non-fatal
    const [rawPrice, rawTradesResult] = await Promise.all([
      cgFetch<RawPrice>("/simple/price", {
        ids: coinId,
        vs_currencies: "usd",
        include_market_cap: "true",
        include_24hr_vol: "true",
        include_24hr_change: "true",
        include_last_updated_at: "true",
      }),
      hasPool
        ? gtFetch<RawTradesResponse>(
            `/onchain/networks/${network}/pools/${poolAddress}/trades`, // ← gtFetch, no cgFetch
          ).catch((err) => {
            console.error("Trades unavailable:", err.message);
            return { data: [] } as RawTradesResponse;
          })
        : Promise.resolve({ data: [] } as RawTradesResponse),
    ]);

    const payload: CoinDataResponse = {
      price: normalizePrice(coinId, rawPrice),
      trades: normalizeTrades(rawTradesResult),
    };

    return NextResponse.json(payload);
  } catch (err) {
    // Solo llega aquí si falla /simple/price
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error fetching price:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
