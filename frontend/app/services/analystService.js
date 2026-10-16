/**
 * @file analystService.js
 * @description Official Analyst & Technical Analysis Service for FXENGIN
 * Direct integration with core analyst endpoints:
 * - GET  /analyst/state
 * - GET  /analyst/share/{symbol}?lang={lang}
 * - POST /analyst/snapshot/request-fresh/{symbol}
 * - GET  /analyst/share/{symbol}/image
 */

import { API_BASE_URL, apiFetch } from './apiClient.js';

/**
 * Symbol metadata map for localization, categorization, and formatting.
 */
export const SYMBOL_METADATA = {
  XAUUSD: {
    symbol: 'XAUUSD',
    pair: 'XAU/USD',
    nameAr: 'الذهب مقابل الدولار الأمريكي',
    nameEn: 'Gold Spot / US Dollar',
    category: 'commodities',
    categoryAr: 'الذهب والمعادن',
    categoryEn: 'Gold & Commodities',
    precision: 2,
    baseAsset: 'XAU',
    quoteAsset: 'USD',
  },
  EURUSD: {
    symbol: 'EURUSD',
    pair: 'EUR/USD',
    nameAr: 'اليورو مقابل الدولار الأمريكي',
    nameEn: 'Euro / US Dollar',
    category: 'forex',
    categoryAr: 'العملات الرئيسية',
    categoryEn: 'Major FX',
    precision: 5,
    baseAsset: 'EUR',
    quoteAsset: 'USD',
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    pair: 'GBP/USD',
    nameAr: 'الجنيه الإسترليني مقابل الدولار',
    nameEn: 'British Pound / US Dollar',
    category: 'forex',
    categoryAr: 'العملات الرئيسية',
    categoryEn: 'Major FX',
    precision: 5,
    baseAsset: 'GBP',
    quoteAsset: 'USD',
  },
  USDJPY: {
    symbol: 'USDJPY',
    pair: 'USD/JPY',
    nameAr: 'الدولار الأمريكي مقابل الين الياباني',
    nameEn: 'US Dollar / Japanese Yen',
    category: 'forex',
    categoryAr: 'العملات الرئيسية',
    categoryEn: 'Major FX',
    precision: 3,
    baseAsset: 'USD',
    quoteAsset: 'JPY',
  },
  EURJPY: {
    symbol: 'EURJPY',
    pair: 'EUR/JPY',
    nameAr: 'اليورو مقابل الين الياباني',
    nameEn: 'Euro / Japanese Yen',
    category: 'indices', // crosses
    categoryAr: 'تقاطعات الين',
    categoryEn: 'JPY Crosses',
    precision: 3,
    baseAsset: 'EUR',
    quoteAsset: 'JPY',
  },
  GBPJPY: {
    symbol: 'GBPJPY',
    pair: 'GBP/JPY',
    nameAr: 'الجنيه الإسترليني مقابل الين (المجنون)',
    nameEn: 'British Pound / Japanese Yen',
    category: 'indices', // crosses
    categoryAr: 'تقاطعات الين',
    categoryEn: 'JPY Crosses',
    precision: 3,
    baseAsset: 'GBP',
    quoteAsset: 'JPY',
  },
  AUDUSD: {
    symbol: 'AUDUSD',
    pair: 'AUD/USD',
    nameAr: 'الدولار الأسترالي مقابل الدولار الأمريكي',
    nameEn: 'Australian Dollar / US Dollar',
    category: 'forex',
    categoryAr: 'العملات الرئيسية',
    categoryEn: 'Major FX',
    precision: 5,
    baseAsset: 'AUD',
    quoteAsset: 'USD',
  },
  USDCAD: {
    symbol: 'USDCAD',
    pair: 'USD/CAD',
    nameAr: 'الدولار الأمريكي مقابل الدولار الكندي',
    nameEn: 'US Dollar / Canadian Dollar',
    category: 'forex',
    categoryAr: 'العملات الرئيسية',
    categoryEn: 'Major FX',
    precision: 5,
    baseAsset: 'USD',
    quoteAsset: 'CAD',
  },
  USDCHF: {
    symbol: 'USDCHF',
    pair: 'USD/CHF',
    nameAr: 'الدولار الأمريكي مقابل الفرنك السويسري',
    nameEn: 'US Dollar / Swiss Franc',
    category: 'forex',
    categoryAr: 'العملات الرئيسية',
    categoryEn: 'Major FX',
    precision: 5,
    baseAsset: 'USD',
    quoteAsset: 'CHF',
  },
  AUDJPY: {
    symbol: 'AUDJPY',
    pair: 'AUD/JPY',
    nameAr: 'الدولار الأسترالي مقابل الين الياباني',
    nameEn: 'Australian Dollar / Japanese Yen',
    category: 'indices',
    categoryAr: 'تقاطعات الين',
    categoryEn: 'JPY Crosses',
    precision: 3,
    baseAsset: 'AUD',
    quoteAsset: 'JPY',
  },
  CADJPY: {
    symbol: 'CADJPY',
    pair: 'CAD/JPY',
    nameAr: 'الدولار الكندي مقابل الين الياباني',
    nameEn: 'Canadian Dollar / Japanese Yen',
    category: 'indices',
    categoryAr: 'تقاطعات الين',
    categoryEn: 'JPY Crosses',
    precision: 3,
    baseAsset: 'CAD',
    quoteAsset: 'JPY',
  },
  CHFJPY: {
    symbol: 'CHFJPY',
    pair: 'CHF/JPY',
    nameAr: 'الفرنك السويسري مقابل الين الياباني',
    nameEn: 'Swiss Franc / Japanese Yen',
    category: 'indices',
    categoryAr: 'تقاطعات الين',
    categoryEn: 'JPY Crosses',
    precision: 3,
    baseAsset: 'CHF',
    quoteAsset: 'JPY',
    packageKey: 'forex',
  },
  // Indices & Commodities (Oil, Gas, Silver, Indices)
  XAGUSD: {
    symbol: 'XAGUSD',
    pair: 'XAG/USD',
    nameAr: 'الفضة مقابل الدولار الأمريكي',
    nameEn: 'Silver Spot / US Dollar',
    category: 'indices',
    categoryAr: 'المؤشرات والسلع',
    categoryEn: 'Index & Commodities',
    precision: 3,
    baseAsset: 'XAG',
    quoteAsset: 'USD',
    packageKey: 'indices',
  },
  USOIL: {
    symbol: 'USOIL',
    pair: 'USOIL',
    nameAr: 'النفط الخام الأمريكي (WTI)',
    nameEn: 'Crude Oil (WTI)',
    category: 'indices',
    categoryAr: 'المؤشرات والسلع',
    categoryEn: 'Index & Commodities',
    precision: 2,
    baseAsset: 'OIL',
    quoteAsset: 'USD',
    packageKey: 'indices',
  },
  UKOIL: {
    symbol: 'UKOIL',
    pair: 'UKOIL',
    nameAr: 'خام برنت القياسي (Brent)',
    nameEn: 'Brent Crude Oil',
    category: 'indices',
    categoryAr: 'المؤشرات والسلع',
    categoryEn: 'Index & Commodities',
    precision: 2,
    baseAsset: 'BRENT',
    quoteAsset: 'USD',
    packageKey: 'indices',
  },
  NATGAS: {
    symbol: 'NATGAS',
    pair: 'NATGAS',
    nameAr: 'الغاز الطبيعي (Natural Gas)',
    nameEn: 'Natural Gas',
    category: 'indices',
    categoryAr: 'المؤشرات والسلع',
    categoryEn: 'Index & Commodities',
    precision: 3,
    baseAsset: 'GAS',
    quoteAsset: 'USD',
    packageKey: 'indices',
  },
  US30: {
    symbol: 'US30',
    pair: 'US30',
    nameAr: 'مؤشر الداو جونز الصناعي (Dow Jones)',
    nameEn: 'Dow Jones 30 Index',
    category: 'indices',
    categoryAr: 'المؤشرات والسلع',
    categoryEn: 'Index & Commodities',
    precision: 1,
    baseAsset: 'US30',
    quoteAsset: 'USD',
    packageKey: 'indices',
  },
  NAS100: {
    symbol: 'NAS100',
    pair: 'NAS100',
    nameAr: 'مؤشر ناسداك التكنولوجي (Nasdaq)',
    nameEn: 'Nasdaq 100 Index',
    category: 'indices',
    categoryAr: 'المؤشرات والسلع',
    categoryEn: 'Index & Commodities',
    precision: 1,
    baseAsset: 'NAS',
    quoteAsset: 'USD',
    packageKey: 'indices',
  },
  SPX500: {
    symbol: 'SPX500',
    pair: 'SPX500',
    nameAr: 'مؤشر إس آند بي 500 (S&P 500)',
    nameEn: 'S&P 500 Index',
    category: 'indices',
    categoryAr: 'المؤشرات والسلع',
    categoryEn: 'Index & Commodities',
    precision: 1,
    baseAsset: 'SPX',
    quoteAsset: 'USD',
    packageKey: 'indices',
  },
  GER40: {
    symbol: 'GER40',
    pair: 'GER40',
    nameAr: 'مؤشر داكس الألماني (DAX 40)',
    nameEn: 'German DAX 40 Index',
    category: 'indices',
    categoryAr: 'المؤشرات والسلع',
    categoryEn: 'Index & Commodities',
    precision: 1,
    baseAsset: 'DAX',
    quoteAsset: 'EUR',
    packageKey: 'indices',
  },
};

/**
 * Determine package key for a given symbol:
 * - 'gold': الذهب (XAUUSD)
 * - 'forex': أزواج العملات (EURUSD, GBPUSD, etc.)
 * - 'indices': النفط والغاز والفضة والمؤشرات (USOIL, UKOIL, NATGAS, XAGUSD, US30, NAS100...)
 * @param {string} symbol
 * @returns {'gold' | 'forex' | 'indices'}
 */
export function getPackageForSymbol(symbol) {
  const norm = normalizeSymbol(symbol);
  if (norm === 'XAUUSD' || norm === 'GOLD' || norm.startsWith('XAU')) {
    return 'gold';
  }
  if (
    [
      'XAGUSD',
      'SILVER',
      'USOIL',
      'UKOIL',
      'WTI',
      'BRENT',
      'NATGAS',
      'GAS',
      'OIL',
      'US30',
      'NAS100',
      'SPX500',
      'GER40',
      'DAX',
    ].includes(norm)
  ) {
    return 'indices';
  }
  return 'forex';
}

/**
 * Clean & normalize any symbol format to uppercase unslashed format (e.g. 'xau/usd' -> 'XAUUSD')
 * @param {string} symbol
 * @returns {string}
 */
export function normalizeSymbol(symbol) {
  if (!symbol) return '';
  return String(symbol).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Format symbol for UI display (e.g. 'XAUUSD' -> 'XAU/USD')
 * @param {string} symbol
 * @returns {string}
 */
export function formatSymbolPair(symbol) {
  const norm = normalizeSymbol(symbol);
  if (SYMBOL_METADATA[norm]?.pair) return SYMBOL_METADATA[norm].pair;
  if (norm.length === 6) return `${norm.slice(0, 3)}/${norm.slice(3)}`;
  return norm;
}

/**
 * Get localized symbol information
 * @param {string} symbol
 * @returns {object}
 */
export function getSymbolInfo(symbol) {
  const norm = normalizeSymbol(symbol);
  const pkgKey = getPackageForSymbol(norm);
  if (SYMBOL_METADATA[norm]) {
    return {
      ...SYMBOL_METADATA[norm],
      packageKey: SYMBOL_METADATA[norm].packageKey || pkgKey,
    };
  }
  return {
    symbol: norm,
    pair: formatSymbolPair(norm),
    nameAr: norm,
    nameEn: norm,
    category: pkgKey,
    categoryAr: pkgKey === 'gold' ? 'الذهب' : pkgKey === 'indices' ? 'المؤشرات والسلع' : 'العملات',
    categoryEn: pkgKey === 'gold' ? 'Gold' : pkgKey === 'indices' ? 'Index & Commodities' : 'Forex',
    precision: 4,
    packageKey: pkgKey,
  };
}

/**
 * Resolve direct or proxied image URL for MT5 chart capture
 * @param {string} symbol
 * @param {string} [snapshotId]
 * @param {string} [imageUrl]
 * @returns {string}
 */
export function getAnalystImageUrl(symbol, snapshotId, imageUrl) {
  const norm = normalizeSymbol(symbol);
  const prefix = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

  // Endpoint: GET /analyst/share/{symbol}/image delivers live MT5 chart directly with HTTP 200
  if (norm) {
    return `${prefix}/analyst/share/${norm}/image`;
  }
  if (snapshotId) {
    return `${prefix}/analyst/share/${snapshotId}/image`;
  }
  if (imageUrl) {
    const cleanPath = imageUrl.replace(/^\/api\/v1/, '');
    return `${prefix}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  }
  return '';
}

/**
 * Fetch analyst state from GET /analyst/state
 * Returns active symbols, live prices, market regime, currency power, etc.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function fetchAnalystState() {
  try {
    const res = await apiFetch('/analyst/state', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch analyst state (HTTP ${res.status})`);
    }

    const data = await res.json();
    return {
      success: true,
      data,
    };
  } catch (err) {
    console.warn('Analyst state notice:', err?.message || err);
    return {
      success: false,
      error: err?.message || 'Failed to fetch analyst state',
    };
  }
}

/**
 * Request fresh snapshot from POST /analyst/snapshot/request-fresh/{symbol}
 * @param {string} symbol
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function requestFreshSnapshot(symbol) {
  const norm = normalizeSymbol(symbol);
  if (!norm) return { success: false, error: 'Invalid symbol' };

  try {
    const res = await apiFetch(`/analyst/snapshot/request-fresh/${norm}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Snapshot refresh failed (HTTP ${res.status})`);
    }

    const data = await res.json();
    // Validate response payload to catch microservice unauthorized details (e.g. HTTP 201 detail messages)
    if (data?.detail && (data.detail.toLowerCase().includes('unauthorized') || data.detail.toLowerCase().includes('missing'))) {
      return {
        success: false,
        error: data.detail,
        data,
      };
    }
    if (data?.status === 'ERROR') {
      return {
        success: false,
        error: data.message || 'Snapshot refresh failed',
        data,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error(`Snapshot refresh error for ${norm}:`, err);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * In-flight cache for fetchAnalystShare to avoid duplicate requests during page loads
 */
const shareCache = new Map();
const CACHE_TTL_MS = 15000; // 15 seconds

/**
 * Fetch technical analysis for a specific symbol: GET /analyst/share/{symbol}?lang={lang}
 * Automatically triggers POST /analyst/snapshot/request-fresh/{symbol} if freshness.needs_new_snapshot is true
 * (with loop protection).
 *
 * @param {string} symbol - e.g. 'XAUUSD' or 'EUR/USD'
 * @param {string} [lang='ar'] - 'ar' or 'en'
 * @param {boolean} [autoRefreshSnapshot=true] - automatically request fresh snapshot if needed
 * @param {boolean} [forceBypassCache=false]
 * @returns {Promise<{success: boolean, data?: object, error?: string, wasRefreshed?: boolean}>}
 */
export async function fetchAnalystShare(
  symbol,
  lang = 'ar',
  autoRefreshSnapshot = true,
  forceBypassCache = false
) {
  const norm = normalizeSymbol(symbol);
  if (!norm) {
    return { success: false, error: 'Invalid symbol format' };
  }

  const cacheKey = `${norm}:${lang}`;
  const now = Date.now();

  if (!forceBypassCache && shareCache.has(cacheKey)) {
    const cached = shareCache.get(cacheKey);
    if (now - cached.time < CACHE_TTL_MS) {
      return { success: true, data: cached.data };
    }
  }

  try {
    const queryLang = lang === 'en' ? 'en' : 'ar';
    const res = await apiFetch(`/analyst/share/${norm}?lang=${queryLang}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (res.status === 404) {
      // Normal state when algorithmic engine has no active confirmed setup for this symbol
      return {
        success: false,
        noActiveSignal: true,
        error: `No active signal for ${norm}`,
      };
    }

    if (!res.ok) {
      throw new Error(`Analyst share API error (HTTP ${res.status})`);
    }

    let payload = await res.json();

    if (!payload || payload.status === 'ERROR' || payload.status === 'NO_ACTIVE_SIGNAL') {
      return {
        success: false,
        noActiveSignal: true,
        error: payload?.message || `No active signal for ${norm}`,
      };
    }

    let wasRefreshed = false;

    // Requirement 6: If freshness.needs_new_snapshot = true, trigger request-fresh then reload analysis
    if (autoRefreshSnapshot && payload.freshness?.needs_new_snapshot) {
      try {
        const freshRes = await requestFreshSnapshot(norm);
        if (freshRes.success) {
          // Re-fetch updated analysis with autoRefresh = false to prevent infinite loops
          const updatedRes = await apiFetch(`/analyst/share/${norm}?lang=${queryLang}`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
          });
          if (updatedRes.ok) {
            const updatedPayload = await updatedRes.json();
            if (updatedPayload && updatedPayload.status !== 'ERROR' && updatedPayload.status !== 'NO_ACTIVE_SIGNAL') {
              payload = updatedPayload;
              wasRefreshed = true;
            }
          }
        }
      } catch (refreshErr) {
        console.warn(`Auto fresh snapshot failed for ${norm}, proceeding with current payload:`, refreshErr);
      }
    }

    // Attach metadata
    const meta = getSymbolInfo(norm);
    payload.meta = meta;

    shareCache.set(cacheKey, { data: payload, time: now });

    return {
      success: true,
      data: payload,
      wasRefreshed,
    };
  } catch (err) {
    console.warn(`fetchAnalystShare notice for ${norm}:`, err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Fetch analyses for all currently active symbols
 * @param {string} [lang='ar']
 * @returns {Promise<{success: boolean, data?: object[], state?: object, error?: string}>}
 */
export async function fetchActiveAnalysesList(lang = 'ar') {
  try {
    const stateRes = await fetchAnalystState();
    let symbols = [
      'XAUUSD',
      'EURUSD',
      'GBPUSD',
      'USDJPY',
      'EURJPY',
      'GBPJPY',
      'AUDUSD',
      'USDCAD',
      'USDCHF',
      'AUDJPY',
      'CADJPY',
    ];

    let stateData = null;
    if (stateRes.success && stateRes.data?.active_symbols && stateRes.data.active_symbols.length > 0) {
      symbols = stateRes.data.active_symbols;
      stateData = stateRes.data;
    }

    // Fetch individual symbol analyses concurrently
    const analysisPromises = symbols.map(async (sym) => {
      const res = await fetchAnalystShare(sym, lang, false);
      if (res.success && res.data) {
        // augment with live price from state if available
        if (stateData?.live_prices?.[sym]) {
          res.data.live_price = stateData.live_prices[sym];
        }
        return res.data;
      }
      return null;
    });

    const results = await Promise.all(analysisPromises);
    const validAnalyses = results.filter(Boolean);

    return {
      success: true,
      data: validAnalyses,
      state: stateData,
    };
  } catch (err) {
    console.warn('fetchActiveAnalysesList notice:', err?.message || err);
    return {
      success: false,
      error: err?.message || 'Failed to fetch active analyses list',
      data: [],
    };
  }
}
