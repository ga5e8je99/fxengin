import type { Symbol } from "../schemas.ts";

/**
 * Demo instruments. These mirror the crypto pairs whose real historical OHLC
 * is bundled under ./data (see scripts/fetch-demo-data.mjs). Quoted in USD.
 */
function crypto(name: string, displayName: string, tickSize: number): Symbol {
  return {
    id: name,
    name,
    displayName,
    category: "CRYPTO",
    contractSize: 1,
    tickSize,
    tickValue: tickSize,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 0,
    swapLong: 0,
    swapShort: 0,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  };
}

function forex(name: string, displayName: string, tickSize: number, contractSize = 100000): Symbol {
  return {
    id: name,
    name,
    displayName,
    category: "FOREX",
    contractSize,
    tickSize,
    tickValue: tickSize * contractSize,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 7,
    swapLong: -2.5,
    swapShort: 0.5,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  };
}

function index(name: string, displayName: string, tickSize = 1, contractSize = 1): Symbol {
  return {
    id: name,
    name,
    displayName,
    category: "INDICES",
    contractSize,
    tickSize,
    tickValue: tickSize * contractSize,
    marginPercent: 1,
    maxLeverage: 100,
    commission: 0,
    swapLong: -1,
    swapShort: -1,
    tradingHoursStart: null,
    tradingHoursEnd: null,
    isActive: true,
  };
}

export const DEMO_SYMBOLS: Symbol[] = [
  // Forex & Gold
  forex("XAUUSD", "Gold / USD", 0.01, 100),
  forex("EURUSD", "EUR/USD", 0.00001),
  forex("GBPUSD", "GBP/USD", 0.00001),
  forex("USDJPY", "USD/JPY", 0.001),

  // Indices
  index("US30", "Dow Jones 30", 1),
  index("NAS100", "Nasdaq 100", 0.25),

  // Crypto
  crypto("BTCUSD", "Bitcoin", 0.01),
  crypto("ETHUSD", "Ethereum", 0.01),
  crypto("SOLUSD", "Solana", 0.01),
  crypto("BNBUSD", "BNB", 0.01),
  crypto("XRPUSD", "XRP", 0.0001),
  crypto("ADAUSD", "Cardano", 0.0001),
];

export const DEMO_SYMBOL_NAMES = DEMO_SYMBOLS.map((s) => s.name);

export function getDemoSymbol(name: string): Symbol | undefined {
  return DEMO_SYMBOLS.find((s) => s.name === name);
}
