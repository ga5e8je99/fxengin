/**
 * @file analysesData.js
 * Centralized packages definition for FXENGIN.
 * Note: Free analyses and mock data have been disabled/deprecated.
 * All technical analyses are powered dynamically by the official core API:
 * - GET /analyst/state
 * - GET /analyst/share/{symbol}
 * - POST /analyst/snapshot/request-fresh/{symbol}
 * - GET /analyst/share/{symbol}/image
 * See: app/services/analystService.js
 */

export const ANALYSIS_PACKAGES = [
  {
    id: 'forex',
    key: 'forex',
    nameAr: 'مجموعة الفوريكس',
    nameEn: 'Forex Analysis Group',
    badgeAr: 'مجموعة الفوريكس',
    badgeEn: 'Forex Group',
    priceVal: 50,
    priceStrAr: '50 USDT',
    priceStrEn: '50 USDT',
    color: '#0488F8',
    scopeAr: 'أزواج العملات الأجنبية',
    scopeEn: 'FX Currency Pairs',
    descAr: 'جروب تحليلات أزواج العملات الأجنبية الرئيسية والتقاطعات اللحظية بمستويات دخول وخروج دقيقة وهيكل السيولة البنكية.',
    descEn: 'Institutional setups across major and cross FX currency pairs (EUR/USD, GBP/USD, USD/JPY...).',
  },
  {
    id: 'indices',
    key: 'indices',
    nameAr: 'مجموعة Index (المؤشرات والسلع)',
    nameEn: 'Index & Commodities Group',
    badgeAr: 'مجموعة Index',
    badgeEn: 'Index Group',
    priceVal: 100,
    priceStrAr: '100 USDT',
    priceStrEn: '100 USDT',
    color: '#10B981',
    scopeAr: 'النفط، الغاز، الفضة والمؤشرات',
    scopeEn: 'Oil, Gas, Silver & Indices',
    descAr: 'جروب التحليلات الخاص بمؤشرات الأسهم الأمريكية (داو جونز US30 وناسداك NAS100) وأسواق الطاقة (النفط والغاز) والمعادن الثمينة (الفضة).',
    descEn: 'Institutional coverage for Crude Oil, Natural Gas, Silver, US30 Dow, NAS100 Nasdaq, and global indices.',
  },
  {
    id: 'gold',
    key: 'gold',
    nameAr: 'مجموعة الذهب',
    nameEn: 'Gold Analysis Group',
    badgeAr: 'مجموعة الذهب',
    badgeEn: 'Gold Group',
    priceVal: 200,
    priceStrAr: '200 USDT',
    priceStrEn: '200 USDT',
    color: '#F59E0B',
    scopeAr: 'الذهب (XAU/USD)',
    scopeEn: 'Gold (XAU/USD)',
    descAr: 'جروب وتغطية حصرية لتحليلات وإشارات الذهب (XAU/USD) الحية لحظة بلحظة من شارتات MT5 مع مناطق الدخول ووقف الخسارة وجني الأرباح ونماذج SMC.',
    descEn: 'Exclusive real-time institutional Gold (XAU/USD) setups with dynamic trailing stops and precise entry targets.',
  },
];

/**
 * @deprecated Static mock data has been disabled. Real analyses are fetched from analystService.
 */
export const ANALYSES_DATA = [];
