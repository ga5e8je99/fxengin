import { publish } from "./bus.ts";
import { getSeedPrice, setLiveSeedPrice } from "./candles.ts";
import { mark } from "./engine.ts";
import { DEMO_SYMBOLS } from "./instruments.ts";

/**
 * Live market-data feed simulator.
 *
 * Generates continuous, smooth real-time ticks starting from the real market price,
 * ensuring zero abrupt jumps, realistic micro-volatility, and smooth chart rendering.
 */

const TICK_MS = 600;

type SymbolCursor = {
  symbol: string;
  basePrice: number;
  currentPrice: number;
  spread: number;
  tickSize: number;
  volatility: number;
};

let timer: ReturnType<typeof setInterval> | null = null;
let cursors: SymbolCursor[] = [];

function getSymbolVolatility(symbol: string, basePrice: number): number {
  if (symbol.startsWith("BTC")) return 1.5; // BTC: ~$1-2 per tick
  if (symbol.startsWith("ETH")) return 0.15; // ETH: ~$0.1-0.2
  if (symbol.startsWith("SOL")) return 0.03; // SOL: ~$0.03
  if (symbol.startsWith("XAU")) return 0.15; // Gold: ~$0.15
  if (symbol.includes("US30")) return 1.5; // Dow Jones: ~$1.5 per tick
  if (symbol.includes("NAS")) return 0.8; // Nasdaq: ~$0.8 per tick
  if (symbol.includes("JPY")) return 0.005; // USDJPY: ~0.005
  // EURUSD, GBPUSD: ~0.00003 (0.3 pip)
  return Math.max(0.00003, basePrice * 0.00003);
}

function buildCursors(): SymbolCursor[] {
  return DEMO_SYMBOLS.map((s) => {
    const seed = getSeedPrice(s.name) || 100;
    const spread = Math.max(s.tickSize, seed * 0.0001);
    const volatility = getSymbolVolatility(s.name, seed);
    return {
      symbol: s.name,
      basePrice: seed,
      currentPrice: seed,
      spread,
      tickSize: s.tickSize,
      volatility,
    };
  });
}

function emitTick(cursor: SymbolCursor): void {
  // Smooth random walk with gentle mean-reversion towards basePrice
  const drift = (cursor.basePrice - cursor.currentPrice) * 0.02;
  const shock = (Math.random() - 0.499) * cursor.volatility;
  cursor.currentPrice += drift + shock;

  const price = cursor.currentPrice;
  const half = cursor.spread / 2;

  publish("market-data", {
    eventType: "MarketTick",
    symbol: cursor.symbol,
    bid: price - half,
    ask: price + half,
    occurredAt: Date.now(),
  });

  mark(cursor.symbol, price);
}

let liveSyncTimer: ReturnType<typeof setInterval> | null = null;

async function syncLiveTicks(): Promise<void> {
  let ticks: Record<string, any> | null = null;

  try {
    const res = await fetch("/api/market-data/ticks", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      ticks = await res.json();
    }
  } catch {
    // Backend API unavailable, fallback to direct browser fetch
  }

  // Direct client fallback to TradingView & Binance
  if (!ticks || Object.keys(ticks).length === 0) {
    try {
      const fallbackTicks: Record<string, any> = {};
      const promises: Promise<void>[] = [];

      // 1. Binance Crypto
      const cryptoMap: Record<string, string> = {
        BTCUSD: "BTCUSDT",
        ETHUSD: "ETHUSDT",
        SOLUSD: "SOLUSDT",
        BNBUSD: "BNBUSDT",
        XRPUSD: "XRPUSDT",
        ADAUSD: "ADAUSDT",
      };
      promises.push(
        fetch("https://api.binance.com/api/v3/ticker/bookTicker", { signal: AbortSignal.timeout(3000) })
          .then((r) => r.json())
          .then((list) => {
            if (Array.isArray(list)) {
              const lookup = new Map(list.map((x: any) => [x.symbol, x]));
              for (const [sym, bPair] of Object.entries(cryptoMap)) {
                const item = lookup.get(bPair);
                if (item) {
                  const bid = parseFloat(item.bidPrice);
                  const ask = parseFloat(item.askPrice);
                  fallbackTicks[sym] = { symbol: sym, bid, ask, timestamp: Date.now() };
                }
              }
            }
          })
          .catch(() => {})
      );

      // 2. TradingView Forex
      promises.push(
        fetch("https://scanner.tradingview.com/forex/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbols: { tickers: ["FX:EURUSD", "FX:GBPUSD", "FX:USDJPY"] },
            columns: ["close", "bid", "ask"],
          }),
          signal: AbortSignal.timeout(3000),
        })
          .then((r) => r.json())
          .then((json) => {
            for (const row of json.data || []) {
              const sym = row.s?.replace("FX:", "");
              if (sym && row.d) {
                const close = row.d[0];
                const bid = row.d[1] ?? close;
                const ask = row.d[2] ?? (close + (sym === "USDJPY" ? 0.015 : 0.00015));
                fallbackTicks[sym] = { symbol: sym, bid, ask, timestamp: Date.now() };
              }
            }
          })
          .catch(() => {})
      );

      // 3. TradingView CFD (Gold & US30)
      promises.push(
        fetch("https://scanner.tradingview.com/cfd/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbols: { tickers: ["OANDA:XAUUSD", "OANDA:US30USD"] },
            columns: ["close", "bid", "ask"],
          }),
          signal: AbortSignal.timeout(3000),
        })
          .then((r) => r.json())
          .then((json) => {
            for (const row of json.data || []) {
              const sym = row.s === "OANDA:XAUUSD" ? "XAUUSD" : row.s === "OANDA:US30USD" ? "US30" : row.s;
              if (sym && row.d) {
                const close = row.d[0];
                const spread = sym === "XAUUSD" ? 0.35 : 3.0;
                const bid = row.d[1] ?? close;
                const ask = row.d[2] ?? (close + spread);
                fallbackTicks[sym] = { symbol: sym, bid, ask, timestamp: Date.now() };
              }
            }
          })
          .catch(() => {})
      );

      // 4. TradingView America (NAS100)
      promises.push(
        fetch("https://scanner.tradingview.com/america/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbols: { tickers: ["NASDAQ:NDX"] },
            columns: ["close"],
          }),
          signal: AbortSignal.timeout(3000),
        })
          .then((r) => r.json())
          .then((json) => {
            for (const row of json.data || []) {
              if (row.s === "NASDAQ:NDX" && row.d) {
                const close = row.d[0];
                fallbackTicks["NAS100"] = { symbol: "NAS100", bid: close, ask: close + 1.5, timestamp: Date.now() };
              }
            }
          })
          .catch(() => {})
      );

      await Promise.allSettled(promises);
      if (Object.keys(fallbackTicks).length > 0) {
        ticks = fallbackTicks;
      }
    } catch {
      // ignore
    }
  }

  if (!ticks) return;

  for (const [sym, t] of Object.entries(ticks as Record<string, any>)) {
    if (t && t.bid > 0) {
      const cursor = cursors.find((c) => c.symbol === sym);
      const mid = (t.bid + t.ask) / 2;
      setLiveSeedPrice(sym, mid);
      if (cursor) {
        cursor.basePrice = mid;
        cursor.currentPrice = mid;
        cursor.spread = Math.abs(t.ask - t.bid) || cursor.spread;
      }
      publish("market-data", {
        eventType: "MarketTick",
        symbol: sym,
        bid: t.bid,
        ask: t.ask,
        occurredAt: Date.now(),
      });
      mark(sym, mid);
    }
  }
}

export function startDemoFeed(): void {
  if (timer) return;
  cursors = buildCursors();
  // Seed initial price for every symbol immediately
  for (const c of cursors) emitTick(c);
  // Fetch real live ticks right away
  syncLiveTicks();

  timer = setInterval(() => {
    for (const c of cursors) emitTick(c);
  }, TICK_MS);

  // Poll live MT5 & Binance ticks every 1000ms
  liveSyncTimer = setInterval(() => {
    syncLiveTicks();
  }, 1000);
}

export function stopDemoFeed(): void {
  if (timer) clearInterval(timer);
  if (liveSyncTimer) clearInterval(liveSyncTimer);
  timer = null;
  liveSyncTimer = null;
}
