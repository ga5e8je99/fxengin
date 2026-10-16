import { Router, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localDataDir = path.join(__dirname, "..", "..", "src", "services", "demo", "data");

export const marketRouter = Router();

const MT5_BRIDGE_URL = process.env.MT5_BRIDGE_URL || "http://186.240.145.87:8008";

// Cache store
const candleCache = new Map<string, { data: any; expiry: number }>();
let tickCache: { data: Record<string, any>; expiry: number } = { data: {}, expiry: 0 };

// Crypto mapping
const CRYPTO_MAP: Record<string, string> = {
  BTCUSD: "BTCUSDT",
  ETHUSD: "ETHUSDT",
  SOLUSD: "SOLUSDT",
  BNBUSD: "BNBUSDT",
  XRPUSD: "XRPUSDT",
  ADAUSD: "ADAUSDT",
};

// Supported Symbols
const SYMBOLS = [
  // Metals & Forex (from MT5)
  {
    id: "XAUUSD",
    name: "XAUUSD",
    displayName: "Gold / USD",
    category: "METALS",
    contractSize: 100,
    tickSize: 0.01,
    tickValue: 1,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 0,
    swapLong: -2.5,
    swapShort: 0.5,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  },
  {
    id: "EURUSD",
    name: "EURUSD",
    displayName: "EUR/USD",
    category: "FOREX",
    contractSize: 100000,
    tickSize: 0.00001,
    tickValue: 1,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 7,
    swapLong: -2.5,
    swapShort: 0.5,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  },
  {
    id: "GBPUSD",
    name: "GBPUSD",
    displayName: "GBP/USD",
    category: "FOREX",
    contractSize: 100000,
    tickSize: 0.00001,
    tickValue: 1,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 7,
    swapLong: -2.5,
    swapShort: 0.5,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  },
  {
    id: "USDJPY",
    name: "USDJPY",
    displayName: "USD/JPY",
    category: "FOREX",
    contractSize: 100000,
    tickSize: 0.001,
    tickValue: 1,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 7,
    swapLong: 0.5,
    swapShort: -2.5,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  },
  {
    id: "AUDUSD",
    name: "AUDUSD",
    displayName: "AUD/USD",
    category: "FOREX",
    contractSize: 100000,
    tickSize: 0.00001,
    tickValue: 1,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 7,
    swapLong: -2,
    swapShort: 0.3,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  },
  {
    id: "USDCAD",
    name: "USDCAD",
    displayName: "USD/CAD",
    category: "FOREX",
    contractSize: 100000,
    tickSize: 0.00001,
    tickValue: 1,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 7,
    swapLong: -1.5,
    swapShort: 0.2,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  },
  {
    id: "USDCHF",
    name: "USDCHF",
    displayName: "USD/CHF",
    category: "FOREX",
    contractSize: 100000,
    tickSize: 0.00001,
    tickValue: 1,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 7,
    swapLong: 0.3,
    swapShort: -2,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  },
  {
    id: "CADJPY",
    name: "CADJPY",
    displayName: "CAD/JPY",
    category: "FOREX",
    contractSize: 100000,
    tickSize: 0.001,
    tickValue: 1,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 7,
    swapLong: 0.2,
    swapShort: -1.8,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  },
  // Crypto (from Binance)
  {
    id: "BTCUSD",
    name: "BTCUSD",
    displayName: "Bitcoin",
    category: "CRYPTO",
    contractSize: 1,
    tickSize: 0.01,
    tickValue: 0.01,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 0,
    swapLong: 0,
    swapShort: 0,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  },
  {
    id: "ETHUSD",
    name: "ETHUSD",
    displayName: "Ethereum",
    category: "CRYPTO",
    contractSize: 1,
    tickSize: 0.01,
    tickValue: 0.01,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 0,
    swapLong: 0,
    swapShort: 0,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  },
  {
    id: "SOLUSD",
    name: "SOLUSD",
    displayName: "Solana",
    category: "CRYPTO",
    contractSize: 1,
    tickSize: 0.01,
    tickValue: 0.01,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 0,
    swapLong: 0,
    swapShort: 0,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  },
  {
    id: "BNBUSD",
    name: "BNBUSD",
    displayName: "BNB",
    category: "CRYPTO",
    contractSize: 1,
    tickSize: 0.01,
    tickValue: 0.01,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 0,
    swapLong: 0,
    swapShort: 0,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  },
  {
    id: "XRPUSD",
    name: "XRPUSD",
    displayName: "XRP",
    category: "CRYPTO",
    contractSize: 1,
    tickSize: 0.0001,
    tickValue: 0.0001,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 0,
    swapLong: 0,
    swapShort: 0,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  },
  {
    id: "ADAUSD",
    name: "ADAUSD",
    displayName: "Cardano",
    category: "CRYPTO",
    contractSize: 1,
    tickSize: 0.0001,
    tickValue: 0.0001,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 0,
    swapLong: 0,
    swapShort: 0,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  },
];

// Yahoo Finance Symbol Mapping for Forex, Metals & Indices
const YAHOO_MAP: Record<string, string> = {
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "JPY=X",
  AUDUSD: "AUDUSD=X",
  USDCAD: "CAD=X",
  USDCHF: "CHF=X",
  CADJPY: "CADJPY=X",
  NZDUSD: "NZDUSD=X",
  EURGBP: "EURGBP=X",
  EURJPY: "EURJPY=X",
  GBPJPY: "GBPJPY=X",
  XAUUSD: "GC=F",
  XAGUSD: "SI=F",
  US30: "YM=F",
  NAS100: "NQ=F",
  SPX500: "ES=F",
};

const YAHOO_TF_CONFIG: Record<string, { interval: string; range: string; aggregate4h?: boolean }> = {
  "1m": { interval: "1m", range: "1d" },
  "5m": { interval: "5m", range: "5d" },
  "15m": { interval: "15m", range: "5d" },
  "30m": { interval: "30m", range: "1mo" },
  "1h": { interval: "60m", range: "1mo" },
  "4h": { interval: "60m", range: "3mo", aggregate4h: true },
  "1d": { interval: "1d", range: "1y" },
  "1w": { interval: "1wk", range: "5y" },
};

// Store latest prices for real-time tick generation
const latestLivePrices = new Map<string, { price: number; timestamp: number }>();

// Helper: Fetch Binance Candles
async function fetchBinanceCandles(binanceSymbol: string, interval: string, limit: number, symbol?: string) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`;
  let candles: any[] = [];
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      candles = data.map((r: any) => ({
        time: Math.floor(r[0] / 1000),
        timestamp: r[0],
        open: parseFloat(r[1]),
        high: parseFloat(r[2]),
        low: parseFloat(r[3]),
        close: parseFloat(r[4]),
        volume: parseFloat(r[5]),
      }));
    }
  } catch (err: any) {
    console.warn(`Binance candle fetch failed for ${binanceSymbol}:`, err.message);
  }

  // Fallback to local clean pre-bundled candles if Binance returned empty
  if (candles.length === 0 && symbol) {
    const localFile = path.join(localDataDir, `${symbol}_${interval}.json`);
    if (fs.existsSync(localFile)) {
      try {
        const fileContent = fs.readFileSync(localFile, "utf-8");
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed) && parsed.length > 0) {
          candles = parsed.map((c: any) => ({
            ...c,
            timestamp: c.timestamp || c.time * 1000,
          }));
        }
      } catch (err: any) {
        console.warn(`Local candle load failed for ${symbol}:`, err.message);
      }
    }
  }

  if (symbol && candles.length > 0) {
    latestLivePrices.set(symbol, { price: candles[candles.length - 1].close, timestamp: Date.now() });
  }
  return candles;
}

// Helper: Fetch Yahoo Finance Candles with TradingView Live Alignment & Local Fallback
async function fetchYahooCandles(symbol: string, yahooSymbol: string, tf: string, limit: number) {
  const conf = YAHOO_TF_CONFIG[tf] || { interval: tf, range: "5d" };
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${conf.interval}&range=${conf.range}`;
  let raw: any[] = [];

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const res0 = data.chart?.result?.[0];
      if (res0?.timestamp && res0?.indicators?.quote?.[0]) {
        const timestamps: number[] = res0.timestamp;
        const quote = res0.indicators.quote[0];
        const opens = quote.open || [];
        const highs = quote.high || [];
        const lows = quote.low || [];
        const closes = quote.close || [];
        const volumes = quote.volume || [];

        for (let i = 0; i < timestamps.length; i++) {
          const t = timestamps[i];
          const o = opens[i];
          const h = highs[i];
          const l = lows[i];
          const c = closes[i];
          const v = volumes[i];
          if (t && o != null && h != null && l != null && c != null) {
            raw.push({
              time: t,
              timestamp: t * 1000,
              open: Number(o.toFixed(5)),
              high: Number(h.toFixed(5)),
              low: Number(l.toFixed(5)),
              close: Number(c.toFixed(5)),
              volume: v && v > 0 ? Math.round(v) : Math.floor(150 + ((t % 3600) / 3600) * 400 + Math.random() * 80),
            });
          }
        }
      }
    }
  } catch (err: any) {
    console.warn(`Yahoo candles fetch failed for ${symbol} (${yahooSymbol}):`, err.message);
  }

  // Fallback to local clean pre-bundled candles if Yahoo returned empty
  if (raw.length === 0) {
    const localFile = path.join(localDataDir, `${symbol}_${tf}.json`);
    if (fs.existsSync(localFile)) {
      try {
        const fileContent = fs.readFileSync(localFile, "utf-8");
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed) && parsed.length > 0) {
          raw = parsed.map((c: any) => ({
            ...c,
            timestamp: c.timestamp || c.time * 1000,
          }));
        }
      } catch (err: any) {
        console.warn(`Local candle load failed for ${symbol}:`, err.message);
      }
    }
  }

  if (raw.length === 0) return [];

  // Anchor the latest candle to the real-time TradingView price
  const live = latestLivePrices.get(symbol);
  if (live && live.price > 0 && raw.length > 0) {
    const lastBar = raw[raw.length - 1];
    lastBar.close = Number(live.price.toFixed(5));
    lastBar.high = Number(Math.max(lastBar.high, live.price).toFixed(5));
    lastBar.low = Number(Math.min(lastBar.low, live.price).toFixed(5));
  } else if (raw.length > 0) {
    latestLivePrices.set(symbol, { price: raw[raw.length - 1].close, timestamp: Date.now() });
  }

  if (conf.aggregate4h) {
    const bucketSec = 4 * 3600;
    const agg: any[] = [];
    let curBucket: any[] = [];
    let curBucketTime = 0;

    for (const c of raw) {
      const bucket = c.time - (c.time % bucketSec);
      if (curBucket.length === 0) {
        curBucketTime = bucket;
        curBucket.push(c);
      } else if (bucket === curBucketTime) {
        curBucket.push(c);
      } else {
        agg.push({
          time: curBucketTime,
          timestamp: curBucketTime * 1000,
          open: curBucket[0].open,
          high: Math.max(...curBucket.map((b) => b.high)),
          low: Math.min(...curBucket.map((b) => b.low)),
          close: curBucket[curBucket.length - 1].close,
          volume: curBucket.reduce((sum, b) => sum + b.volume, 0),
        });
        curBucketTime = bucket;
        curBucket = [c];
      }
    }
    if (curBucket.length > 0) {
      agg.push({
        time: curBucketTime,
        timestamp: curBucketTime * 1000,
        open: curBucket[0].open,
        high: Math.max(...curBucket.map((b) => b.high)),
        low: Math.min(...curBucket.map((b) => b.low)),
        close: curBucket[curBucket.length - 1].close,
        volume: curBucket.reduce((sum, b) => sum + b.volume, 0),
      });
    }
    return limit && limit < agg.length ? agg.slice(-limit) : agg;
  }

  return limit && limit < raw.length ? raw.slice(-limit) : raw;
}

// Helper: Fetch MT5 Candles (Fallback)
async function fetchMT5Candles(symbol: string, tf: string, limit: number) {
  const localFile = path.join(localDataDir, `${symbol}_${tf}.json`);
  if (fs.existsSync(localFile)) {
    try {
      const fileContent = fs.readFileSync(localFile, "utf-8");
      const parsed = JSON.parse(fileContent);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(-limit);
      }
    } catch {}
  }
  return [];
}

// Helper: Fetch All Ticks from TradingView Live Scanners + Binance in Parallel
async function fetchAllTicks(): Promise<Record<string, any>> {
  const now = Date.now();
  if (now < tickCache.expiry && Object.keys(tickCache.data).length > 0) {
    return tickCache.data;
  }

  const result: Record<string, any> = { ...tickCache.data };
  const promises: Promise<void>[] = [];

  // 1. Fetch Binance bookTicker for all crypto (BTC, ETH, SOL, BNB, XRP, ADA)
  promises.push(
    (async () => {
      try {
        const binanceRes = await fetch("https://api.binance.com/api/v3/ticker/bookTicker", {
          signal: AbortSignal.timeout(3500),
        });
        if (binanceRes.ok) {
          const bookTicks = await binanceRes.json();
          const lookup = new Map<string, any>();
          for (const item of bookTicks) {
            lookup.set(item.symbol, item);
          }
          for (const [sym, bPair] of Object.entries(CRYPTO_MAP)) {
            const item = lookup.get(bPair);
            if (item) {
              const bid = parseFloat(item.bidPrice);
              const ask = parseFloat(item.askPrice);
              result[sym] = {
                symbol: sym,
                bid,
                ask,
                timestamp: now,
                source: "Binance Live",
              };
              latestLivePrices.set(sym, { price: (bid + ask) / 2, timestamp: now });
            }
          }
        }
      } catch (err: any) {
        console.warn("Binance tick fetch failed:", err.message);
      }
    })()
  );

  // 2. Fetch TradingView Forex Scanner (EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, USDCHF, CADJPY, NZDUSD, EURGBP, EURJPY, GBPJPY)
  promises.push(
    (async () => {
      try {
        const tvForexRes = await fetch("https://scanner.tradingview.com/forex/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbols: {
              tickers: [
                "FX:EURUSD",
                "FX:GBPUSD",
                "FX:USDJPY",
                "FX:AUDUSD",
                "FX:USDCAD",
                "FX:USDCHF",
                "FX:CADJPY",
                "FX:NZDUSD",
                "FX:EURGBP",
                "FX:EURJPY",
                "FX:GBPJPY",
              ],
            },
            columns: ["close", "bid", "ask", "open", "high", "low"],
          }),
          signal: AbortSignal.timeout(3500),
        });
        if (tvForexRes.ok) {
          const json = await tvForexRes.json();
          for (const row of json.data || []) {
            const sym = row.s?.replace("FX:", "");
            if (sym && row.d) {
              const close = row.d[0];
              const bid = row.d[1] ?? close;
              const isJpy = sym.includes("JPY");
              const ask = row.d[2] ?? (close + (isJpy ? 0.015 : 0.00015));
              result[sym] = {
                symbol: sym,
                bid: Number(bid.toFixed(5)),
                ask: Number(ask.toFixed(5)),
                timestamp: now,
                source: "TradingView Live",
              };
              latestLivePrices.set(sym, { price: (bid + ask) / 2, timestamp: now });
            }
          }
        }
      } catch (err: any) {
        console.warn("TradingView Forex scanner failed:", err.message);
      }
    })()
  );

  // 3. Fetch TradingView CFD Scanner (XAUUSD, XAGUSD, US30)
  promises.push(
    (async () => {
      try {
        const tvCfdRes = await fetch("https://scanner.tradingview.com/cfd/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbols: {
              tickers: ["OANDA:XAUUSD", "OANDA:XAGUSD", "OANDA:US30USD", "TVC:SPX"],
            },
            columns: ["close", "bid", "ask", "open", "high", "low"],
          }),
          signal: AbortSignal.timeout(3500),
        });
        if (tvCfdRes.ok) {
          const json = await tvCfdRes.json();
          for (const row of json.data || []) {
            let sym = row.s;
            if (sym === "OANDA:XAUUSD") sym = "XAUUSD";
            else if (sym === "OANDA:XAGUSD") sym = "XAGUSD";
            else if (sym === "OANDA:US30USD") sym = "US30";
            else if (sym === "TVC:SPX") sym = "SPX500";

            if (sym && row.d) {
              const close = row.d[0];
              const spread = sym === "XAUUSD" ? 0.35 : sym === "XAGUSD" ? 0.03 : sym === "US30" ? 3.0 : 0.5;
              const bid = row.d[1] ?? close;
              const ask = row.d[2] ?? (close + spread);
              result[sym] = {
                symbol: sym,
                bid: Number(bid.toFixed(sym === "XAUUSD" ? 2 : sym === "US30" ? 1 : 4)),
                ask: Number(ask.toFixed(sym === "XAUUSD" ? 2 : sym === "US30" ? 1 : 4)),
                timestamp: now,
                source: "TradingView Live",
              };
              latestLivePrices.set(sym, { price: (bid + ask) / 2, timestamp: now });
            }
          }
        }
      } catch (err: any) {
        console.warn("TradingView CFD scanner failed:", err.message);
      }
    })()
  );

  // 4. Fetch TradingView America Scanner (NASDAQ:NDX for NAS100, DJ:DJI for US30 fallback)
  promises.push(
    (async () => {
      try {
        const tvAmericaRes = await fetch("https://scanner.tradingview.com/america/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbols: { tickers: ["NASDAQ:NDX", "DJ:DJI"] },
            columns: ["close", "open", "high", "low"],
          }),
          signal: AbortSignal.timeout(3500),
        });
        if (tvAmericaRes.ok) {
          const json = await tvAmericaRes.json();
          for (const row of json.data || []) {
            if (row.s === "NASDAQ:NDX" && row.d) {
              const close = row.d[0];
              result["NAS100"] = {
                symbol: "NAS100",
                bid: Number(close.toFixed(2)),
                ask: Number((close + 1.5).toFixed(2)),
                timestamp: now,
                source: "TradingView Live",
              };
              latestLivePrices.set("NAS100", { price: close, timestamp: now });
            } else if (row.s === "DJ:DJI" && row.d && !result["US30"]) {
              const close = row.d[0];
              result["US30"] = {
                symbol: "US30",
                bid: Number(close.toFixed(1)),
                ask: Number((close + 3.0).toFixed(1)),
                timestamp: now,
                source: "TradingView Live",
              };
              latestLivePrices.set("US30", { price: close, timestamp: now });
            }
          }
        }
      } catch (err: any) {
        console.warn("TradingView America scanner failed:", err.message);
      }
    })()
  );

  await Promise.allSettled(promises);

  if (Object.keys(result).length > 0) {
    tickCache = { data: result, expiry: now + 1500 }; // 1.5s cache
  }

  return result;
}

// ── GET /api/market-data/symbols ──
marketRouter.get("/symbols", (req: Request, res: Response) => {
  res.json(SYMBOLS);
});

// ── GET /api/market-data/ticks ──
marketRouter.get("/ticks", async (req: Request, res: Response) => {
  const ticks = await fetchAllTicks();
  res.json(ticks);
});

// ── GET /api/market-data/ticks/:symbol ──
marketRouter.get("/ticks/:symbol", async (req: Request, res: Response) => {
  const symbol = req.params.symbol.toUpperCase();
  const ticks = await fetchAllTicks();
  if (ticks[symbol]) {
    res.json(ticks[symbol]);
  } else {
    res.status(404).json({ error: "Symbol not found or no tick data" });
  }
});

// ── Handler for Candles (both GET and POST supported) ──
async function handleCandlesRequest(req: Request, res: Response) {
  const symbol = req.params.symbol?.toUpperCase() || (req.query.symbol as string)?.toUpperCase();
  const timeframe = (req.body?.timeframe || req.query.timeframe || req.query.tf || "15m") as string;
  const limit = parseInt((req.body?.limit || req.query.limit || "200") as string, 10);

  if (!symbol) {
    return res.status(400).json({ error: "Symbol is required" });
  }

  const cacheKey = `${symbol}_${timeframe}_${limit}`;
  const cached = candleCache.get(cacheKey);
  const now = Date.now();
  if (cached && now < cached.expiry) {
    return res.json({
      candles: cached.data,
      metadata: {
        historicalCoverageStart: cached.data[0]?.time ?? null,
        isPartial: false,
        backfillQueued: false,
      },
    });
  }

  try {
    let candles: any[] = [];
    if (CRYPTO_MAP[symbol]) {
      // Crypto -> Binance
      const binancePair = CRYPTO_MAP[symbol];
      candles = await fetchBinanceCandles(binancePair, timeframe, limit, symbol);
    } else if (YAHOO_MAP[symbol]) {
      // Forex, Metals, Indices -> Yahoo Finance
      candles = await fetchYahooCandles(symbol, YAHOO_MAP[symbol], timeframe, limit);
    } else {
      // Fallback -> MT5
      candles = await fetchMT5Candles(symbol, timeframe, limit);
    }

    if (candles && candles.length > 0) {
      candleCache.set(cacheKey, { data: candles, expiry: now + 5000 }); // 5s cache
      return res.json({
        candles,
        metadata: {
          historicalCoverageStart: candles[0]?.time ?? null,
          isPartial: false,
          backfillQueued: false,
        },
      });
    }

    // If empty, return cached if available or 404
    if (cached) {
      return res.json({
        candles: cached.data,
        metadata: {
          historicalCoverageStart: cached.data[0]?.time ?? null,
          isPartial: false,
          backfillQueued: false,
        },
      });
    }

    return res.json({
      candles: [],
      metadata: {
        historicalCoverageStart: null,
        isPartial: false,
        backfillQueued: false,
      },
    });
  } catch (err: any) {
    console.error(`Error fetching candles for ${symbol}:`, err.message);
    if (cached) {
      return res.json({
        candles: cached.data,
        metadata: {
          historicalCoverageStart: cached.data[0]?.time ?? null,
          isPartial: false,
          backfillQueued: false,
        },
      });
    }
    return res.status(500).json({ error: "Failed to fetch candles", message: err.message });
  }
}

marketRouter.get("/candles/:symbol", handleCandlesRequest);
marketRouter.post("/candles/:symbol", handleCandlesRequest);
marketRouter.get("/candles", handleCandlesRequest);
marketRouter.post("/candles", handleCandlesRequest);

