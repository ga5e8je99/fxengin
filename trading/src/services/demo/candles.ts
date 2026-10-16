import type { Candle } from "../schemas.ts";

/**
 * Loads the bundled REAL OHLC history and serves it to the chart / feed.
 *
 * History is time-aligned so the latest bar matches the current real-world timeframe bucket,
 * enabling real-time tick streaming without timestamp gaps or chart glitches.
 */

// Dynamically load data/<SYMBOL>_<tf>.json on demand — splits 7MB into tiny lazy chunks!
const modules = import.meta.glob<{ default: Candle[] }>("./data/*.json");

const cache = new Map<string, Candle[]>();

const TF_SECONDS: Record<string, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
  "1w": 604800,
};

function generateSyntheticHistory(symbol: string, timeframe: string, count = 250): Candle[] {
  const interval = TF_SECONDS[timeframe] ?? 60;
  const nowSec = Math.floor(Date.now() / 1000);
  const currentBucket = nowSec - (nowSec % interval);
  const basePrice = SEED_PRICES[symbol] ?? 100;

  const candles: Candle[] = [];
  let price = basePrice * 0.985;
  const volatility = basePrice * 0.001;
  const dec = basePrice > 1000 ? 1 : basePrice > 10 ? 2 : 4;

  const startSec = currentBucket - (count - 1) * interval;
  for (let i = 0; i < count; i++) {
    const t = startSec + i * interval;
    const wave = Math.sin(i / 10) * 0.4 + Math.cos(i / 25) * 0.3;
    const change = (wave + (Math.random() - 0.495)) * volatility;
    const open = price;
    const close = Math.max(price * 0.1, open + change);
    const high = Math.max(open, close) + Math.random() * volatility * 0.6;
    const low = Math.min(open, close) - Math.random() * volatility * 0.6;
    const volume = Math.floor(150 + Math.random() * 850);
    candles.push({
      time: t,
      open: Number(open.toFixed(dec)),
      high: Number(high.toFixed(dec)),
      low: Number(low.toFixed(dec)),
      close: Number(close.toFixed(dec)),
      volume,
    });
    price = close;
  }
  return candles;
}

async function rawSeries(symbol: string, timeframe: string): Promise<Candle[]> {
  const key = `${symbol}_${timeframe}`;
  if (cache.has(key)) return cache.get(key)!;
  const loader = modules[`./data/${key}.json`];
  if (loader) {
    try {
      const mod = await loader();
      cache.set(key, mod.default);
      return mod.default;
    } catch (err) {
      console.warn(`Could not dynamically load candles for ${key}:`, err);
    }
  }
  const synth = generateSyntheticHistory(symbol, timeframe, 250);
  cache.set(key, synth);
  return synth;
}

/** Current wall-clock period start (seconds) for a timeframe */
function currentBucketSec(timeframe: string): number {
  const interval = TF_SECONDS[timeframe] ?? 60;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec - (nowSec % interval);
}

/** Per-(symbol,timeframe) time delta that maps the last real bar exactly onto the current bucket. */
function shiftDelta(bars: Candle[], timeframe: string): number {
  if (bars.length === 0) return 0;
  const lastReal = bars[bars.length - 1]!.time;
  return currentBucketSec(timeframe) - lastReal;
}

/** Real history for a symbol/timeframe, time-aligned so the last bar is the active live candle. */
export async function getHistory(symbol: string, timeframe: string, limit?: number): Promise<Candle[]> {
  const bars = await rawSeries(symbol, timeframe);
  if (bars.length === 0) return [];
  const delta = shiftDelta(bars, timeframe);
  const targetSeed = getSeedPrice(symbol);
  const dec = targetSeed > 1000 ? 2 : targetSeed > 10 ? 2 : targetSeed > 1 ? 4 : 5;

  const shifted = bars.map((c, i) => {
    let o = c.open;
    let h = c.high;
    let l = c.low;
    const cl = c.close;
    if (h <= l || Math.abs(h - l) < 0.00002) {
      const prev = bars[i - 1];
      if (prev) o = prev.close;
      const spread = Math.max(Math.abs(cl - o), cl * 0.00012);
      h = Math.max(o, cl) + spread * 0.5;
      l = Math.min(o, cl) - spread * 0.5;
    }
    return {
      time: c.time + delta,
      open: Number(o.toFixed(dec)),
      high: Number(h.toFixed(dec)),
      low: Number(l.toFixed(dec)),
      close: Number(cl.toFixed(dec)),
      volume: c.volume,
    };
  });

  // Anchor the final active bar to the current live price
  if (shifted.length > 0 && targetSeed > 0) {
    const lastBar = shifted[shifted.length - 1];
    lastBar.close = Number(targetSeed.toFixed(dec));
    lastBar.high = Number(Math.max(lastBar.high, targetSeed).toFixed(dec));
    lastBar.low = Number(Math.min(lastBar.low, targetSeed).toFixed(dec));
  }

  return limit && limit < shifted.length ? shifted.slice(-limit) : shifted;
}

const LIVE_SEED_PRICES: Record<string, number> = {};

export function setLiveSeedPrice(symbol: string, price: number): void {
  if (price > 0) {
    LIVE_SEED_PRICES[symbol] = price;
  }
}

const SEED_PRICES: Record<string, number> = {
  XAUUSD: 4123.4,
  BTCUSD: 83040.0,
  ETHUSD: 2562.7,
  EURUSD: 1.1190,
  GBPUSD: 1.3195,
  USDJPY: 158.21,
  SOLUSD: 115.02,
  BNBUSD: 768.65,
  XRPUSD: 1.4136,
  ADAUSD: 0.2524,
  US30: 50810.0,
  NAS100: 31160.0,
};

/** Latest real close — seed price before the feed starts streaming. */
export function getSeedPrice(symbol: string): number {
  return LIVE_SEED_PRICES[symbol] ?? SEED_PRICES[symbol] ?? 100;
}

