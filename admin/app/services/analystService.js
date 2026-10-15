/**
 * @file analystService.js
 * @description Official MT5 Analyst & Technical Analysis Service for FXENGIN Admin Dashboard
 * Connects to core analyst endpoints:
 * - GET  /analyst/state
 * - GET  /analyst/share/{symbol}?lang={lang}
 * - POST /analyst/snapshot/request-fresh/{symbol}
 * - GET  /analyst/share/{symbol}/image
 */

import { API_BASE_URL, adminFetch } from './apiClient.js';

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
    category: 'indices',
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
    category: 'indices',
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
  },
};

export function normalizeSymbol(symbol) {
  if (!symbol) return '';
  return String(symbol).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function formatSymbolPair(symbol) {
  const norm = normalizeSymbol(symbol);
  if (SYMBOL_METADATA[norm]?.pair) return SYMBOL_METADATA[norm].pair;
  if (norm.length === 6) return `${norm.slice(0, 3)}/${norm.slice(3)}`;
  return norm;
}

export function getSymbolInfo(symbol) {
  const norm = normalizeSymbol(symbol);
  if (SYMBOL_METADATA[norm]) {
    return SYMBOL_METADATA[norm];
  }
  return {
    symbol: norm,
    pair: formatSymbolPair(norm),
    nameAr: norm,
    nameEn: norm,
    category: 'forex',
    categoryAr: 'العملات',
    categoryEn: 'Forex',
    precision: 4,
  };
}

export function getAnalystImageUrl(symbol, snapshotId, imageUrl) {
  const norm = normalizeSymbol(symbol);
  const prefix = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

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

export async function fetchAnalystState() {
  try {
    const res = await adminFetch('/analyst/state', { method: 'GET' });
    if (!res.ok) {
      throw new Error(`Failed to fetch analyst state (HTTP ${res.status})`);
    }
    return {
      success: true,
      data: res.data,
    };
  } catch (err) {
    console.warn('Analyst state notice:', err?.message || err);
    return {
      success: false,
      error: err?.message || 'Failed to fetch analyst state',
    };
  }
}

export async function requestFreshSnapshot(symbol) {
  const norm = normalizeSymbol(symbol);
  if (!norm) return { success: false, error: 'Invalid symbol' };

  try {
    const res = await adminFetch(`/analyst/snapshot/request-fresh/${norm}`, {
      method: 'POST',
    });

    if (!res.ok) {
      throw new Error(`Snapshot refresh failed (HTTP ${res.status})`);
    }

    const data = res.data;
    if (data?.detail && (data.detail.toLowerCase().includes('unauthorized') || data.detail.toLowerCase().includes('missing'))) {
      return { success: false, error: data.detail, data };
    }
    if (data?.status === 'ERROR') {
      return { success: false, error: data.message || 'Snapshot refresh failed', data };
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

export async function fetchAnalystShare(symbol, lang = 'ar') {
  const norm = normalizeSymbol(symbol);
  if (!norm) return { success: false, error: 'Invalid symbol' };

  try {
    const queryLang = lang === 'en' ? 'en' : 'ar';
    const res = await adminFetch(`/analyst/share/${norm}?lang=${queryLang}`, {
      method: 'GET',
    });

    if (res.status === 404) {
      return {
        success: false,
        noActiveSignal: true,
        error: `No active signal for ${norm}`,
      };
    }

    if (!res.ok || !res.data) {
      throw new Error(`Analyst share API error (HTTP ${res.status})`);
    }

    const payload = res.data;
    if (payload.status === 'ERROR' || payload.status === 'NO_ACTIVE_SIGNAL') {
      return {
        success: false,
        noActiveSignal: true,
        error: payload?.message || `No active signal for ${norm}`,
      };
    }

    payload.meta = getSymbolInfo(norm);
    return {
      success: true,
      data: payload,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

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

    const analysisPromises = symbols.map(async (sym) => {
      const res = await fetchAnalystShare(sym, lang);
      if (res.success && res.data) {
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
    console.warn('fetchActiveAnalysesList error:', err?.message || err);
    return {
      success: false,
      error: err?.message || 'Failed to fetch active analyses list',
      data: [],
    };
  }
}
