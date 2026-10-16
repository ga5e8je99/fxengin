'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import {
  FiSearch,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiClock,
  FiTarget,
  FiAlertCircle,
  FiSliders,
  FiLayers,
  FiX,
  FiRotateCcw,
  FiCheck,
  FiArrowLeft,
  FiArrowRight,
  FiLock,
  FiZap,
  FiAward,
  FiShield,
  FiInfo,
  FiCheckCircle,
  FiUnlock,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';
import {
  fetchActiveAnalysesList,
  getAnalystImageUrl,
  formatSymbolPair,
  getPackageForSymbol,
} from '../services/analystService';
import { ANALYSIS_PACKAGES } from './analysesData';
import { fetchUserSubscription } from '../services/subscriptionService';
import AnalysesPricingPlans from '../components/AnalysesPricingPlans';
import { usePageLoading } from '../context/LoadingContext';

/* Real MT5 Chart Thumbnail Banner */
function RealChartBanner({ item, isAr }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getAnalystImageUrl(item.symbol, item.snapshot_id, item.image_url);
  const isOptimal = item.freshness?.is_optimal && !item.freshness?.needs_new_snapshot;

  return (
    <div
      style={{
        width: '100%',
        height: '160px',
        background: 'linear-gradient(145deg, #0A1B3D 0%, #06142F 60%, #01071E 100%)',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {!imgError ? (
        <img
          src={imageUrl}
          alt={`${item.symbol} MT5 Chart`}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
          loading="lazy"
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '12px',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <FiActivity size={24} color="var(--primary)" />
          <span>{isAr ? 'شارت MT5 المباشر' : 'MT5 Live Chart'}</span>
        </div>
      )}

      {/* Dark overlay for readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(1, 7, 30, 0.25) 0%, rgba(1, 7, 30, 0.75) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Freshness Status Pill */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: isAr ? 'auto' : '12px',
          right: isAr ? '12px' : 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(1, 7, 30, 0.85)',
          backdropFilter: 'blur(6px)',
          border: isOptimal ? '1px solid rgba(22, 199, 132, 0.5)' : '1px solid rgba(251, 135, 4, 0.4)',
          borderRadius: '20px',
          padding: '3px 9px',
          fontSize: '11px',
          fontWeight: 700,
          color: isOptimal ? 'var(--success)' : '#FB8704',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isOptimal ? 'var(--success)' : '#FB8704',
            boxShadow: isOptimal ? '0 0 6px var(--success)' : 'none',
          }}
        />
        <span>
          {isOptimal
            ? (isAr ? 'مباشر نشط' : 'Live Active')
            : (isAr ? 'تحرك السعر' : 'Price Drifted')}
        </span>
      </div>

      {/* Timeframe Tag */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: isAr ? '12px' : 'auto',
          right: isAr ? 'auto' : '12px',
          background: 'rgba(1, 7, 30, 0.85)',
          backdropFilter: 'blur(6px)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '2px 7px',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          fontFamily: 'monospace',
        }}
      >
        {item.timeframe || 'M5'}
      </div>
    </div>
  );
}

const PACKAGE_FILTERS = [
  { key: 'all', labelAr: 'جميع المجموعات', labelEn: 'All Groups' },
  { key: 'forex', labelAr: 'مجموعة الفوريكس (أزواج العملات)', labelEn: 'Forex Group (Currency Pairs)', color: '#0488F8' },
  { key: 'indices', labelAr: 'مجموعة Index (المؤشرات والسلع)', labelEn: 'Index Group (Oil, Gas, Silver...)', color: '#10B981' },
  { key: 'gold', labelAr: 'مجموعة الذهب (الذهب)', labelEn: 'Gold Group (XAU/USD)', color: '#F59E0B' },
];

const BIAS_OPTIONS = [
  { key: 'all', labelAr: 'جميع الاتجاهات', labelEn: 'All Sentiments' },
  { key: 'BUY', labelAr: '▲ شراء (Buy)', labelEn: '▲ Buy', color: 'var(--success)' },
  { key: 'SELL', labelAr: '▼ بيع (Sell)', labelEn: '▼ Sell', color: 'var(--error)' },
  { key: 'HOLD', labelAr: 'انتظار (Hold)', labelEn: 'Hold', color: '#FB8704' },
];

const SORT_OPTIONS = [
  { key: 'latest', labelAr: 'الأحدث أولاً', labelEn: 'Latest First' },
  { key: 'confidenceHigh', labelAr: 'الأعلى نسبة ثقة', labelEn: 'Highest Confidence' },
];

export default function AnalysesPage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();

  const [analysesList, setAnalysesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keep global brand PageLoader visible until analyses data completes
  usePageLoading(loading, 'analyses_page');

  // Subscription State ('gold' | 'forex' | 'indices' | 'all' | null)
  const [subscription, setSubscription] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('all');
  const [selectedBias, setSelectedBias] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  // التحقق الأمني من اشتراك المستخدم الحقيقي ورتبته عبر الـ API
  useEffect(() => {
    setMounted(true);
    if (user) {
      const isDirectPrivileged = ['VIP', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
      if (isDirectPrivileged) {
        setSubscription('all');
      } else {
        fetchUserSubscription().then((res) => {
          if (res?.success && res?.data?.hasActiveSubscription) {
            setSubscription(res.data.primaryPlan?.slug || 'gold');
          } else {
            setSubscription(null);
          }
        });
      }
    } else {
      setSubscription(null);
    }
  }, [user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchActiveAnalysesList(isAr ? 'ar' : 'en');
      if (res.success && Array.isArray(res.data)) {
        setAnalysesList(res.data);
      } else {
        throw new Error(res.error || 'No active analyses available from engine');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter and Sort Analyses
  const filteredAnalyses = useMemo(() => {
    let result = analysesList.filter((item) => {
      // 1. Package Filter (Gold / Forex / Indices)
      if (selectedPackage !== 'all') {
        const itemPkg = item.meta?.packageKey || getPackageForSymbol(item.symbol);
        if (itemPkg !== selectedPackage) return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSymbol = item.symbol?.toLowerCase().includes(q);
        const matchPair = item.meta?.pair?.toLowerCase().includes(q);
        const matchNameAr = item.meta?.nameAr?.toLowerCase().includes(q);
        const matchNameEn = item.meta?.nameEn?.toLowerCase().includes(q);
        const matchRec = item.recommendation?.toLowerCase().includes(q);
        if (!matchSymbol && !matchPair && !matchNameAr && !matchNameEn && !matchRec) return false;
      }

      // 3. Trade Bias / Recommendation Filter
      if (selectedBias !== 'all') {
        if (item.recommendation !== selectedBias) return false;
      }

      return true;
    });

    // 4. Sorting (Always prioritize XAUUSD Gold first, then by sort criteria)
    result.sort((a, b) => {
      if (a.symbol === 'XAUUSD') return -1;
      if (b.symbol === 'XAUUSD') return 1;

      if (sortBy === 'confidenceHigh') {
        return (b.confidence_score || 0) - (a.confidence_score || 0);
      }
      return (a.freshness?.elapsed_minutes || 0) - (b.freshness?.elapsed_minutes || 0);
    });

    return result;
  }, [analysesList, selectedPackage, searchQuery, selectedBias, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPackage('all');
    setSelectedBias('all');
    setSortBy('latest');
  };

  const hasActiveFilters = searchQuery !== '' || selectedPackage !== 'all' || selectedBias !== 'all' || sortBy !== 'latest';

  // Count setups available for each package
  const packageCounts = useMemo(() => {
    const counts = { all: analysesList.length, gold: 0, forex: 0, indices: 0 };
    analysesList.forEach((item) => {
      const pkg = item.meta?.packageKey || getPackageForSymbol(item.symbol);
      counts[pkg] = (counts[pkg] || 0) + 1;
    });
    return counts;
  }, [analysesList]);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* ── 1. Hero Header Section ── */}
      <section
        style={{
          position: 'relative',
          padding: '56px 0 36px',
          borderBottom: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <PageHeroBackground />
        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <Anim>
            <div style={{ display: 'inline-flex', marginBottom: '14px' }}>
              <span
                className="badge badge-orange"
                style={{
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                }}
              >
                <FiActivity size={14} />
                {isAr ? 'غرفة التحليلات الفنية اللحظية المعتمدة' : 'Live Institutional Technical Setups'}
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(26px, 3.6vw, 44px)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.25,
                margin: '0 0 14px 0',
              }}
            >
              {isAr ? 'تحليلات مباشرة من ' : 'Real-time MT5 Analyses & '}
              <span className="text-gradient-brand">
                {isAr ? 'محرك التداول المؤسسي' : 'Institutional Setups'}
              </span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(14px, 1.8vw, 17px)',
                color: 'var(--text-secondary)',
                maxWidth: '720px',
                margin: '0 auto 20px',
                lineHeight: 1.7,
              }}
            >
              {isAr
                ? 'إشارات وإحداثيات ونماذج السيولة الذكية (SMC) المأخوذة مباشرة من منصات MT5 الحقيقية مع نسب الثقة ومستويات الدخول والأهداف.'
                : 'Direct institutional SMC structural breakdowns, MT5 terminal captures, verified entry zones, targets, and risk parameters.'}
            </p>

            {/* Live Stream Engine Status Banner */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '20px',
                background: 'rgba(251, 135, 4, 0.12)',
                border: '1px solid rgba(251, 135, 4, 0.4)',
                color: '#FB8704',
                fontSize: '12.5px',
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FB8704', boxShadow: '0 0 8px #FB8704' }} />
              <span>
                {isAr
                  ? 'بث التحليلات اللحظي المتاح حالياً من الـAPI: صفقات الذهب (XAU/USD)'
                  : 'Currently Active Live Stream from API: Gold (XAU/USD) Setups'}
              </span>
            </div>
          </Anim>
        </div>
      </section>

      {/* ── CONDITIONAL SECTION: PRICING PLANS (UNSUBSCRIBED) VS LIVE CARDS (SUBSCRIBED) ── */}
      {!subscription ? (
        /* 1. Unsubscribed Visitor: Show Pricing Plans Matching Reference Image & Hide Analysis Cards */
        <div className="container" style={{ marginTop: '32px' }}>
          <Anim>
            <AnalysesPricingPlans />
          </Anim>

          {/* Locked Notice */}
          <Anim delay={60}>
            <div
              style={{
                margin: '28px auto 40px',
                textAlign: 'center',
                padding: '36px 24px',
                borderRadius: '16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                maxWidth: '860px',
                boxShadow: '0 8px 28px rgba(0, 3, 13, 0.45)',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(4, 136, 248, 0.12)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  marginBottom: '14px',
                }}
              >
                <FiLock size={22} />
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
                {isAr ? 'جميع كروت التحليلات الفنية اللحظية مقفلة لغير المشتركين' : 'All live institutional analysis cards are locked'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto 24px', lineHeight: 1.7 }}>
                {isAr
                  ? 'بمجرد الاشتراك في مجموعة الذهب VIP أو أي مجموعة من مجموعات المنصة أعلاه، ستفتح لك كافة كروت الصفقات والشارتات الحية ونقاط الدخول والأهداف ونماذج السيولة الذكية فوراً.'
                  : 'Subscribe to the Gold VIP plan or any package above to unlock all live MT5 setups, coordinates matrix, SMC liquidity models, and alerts.'}
              </p>
              <a
                href="#pricing"
                className="btn-primary"
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  padding: '11px 26px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 18px rgba(4, 136, 248, 0.4)',
                }}
              >
                <FiZap size={16} />
                <span>{isAr ? 'اختر باقتك الشهرية وابدأ الآن' : 'Choose Your Plan & Get Started'}</span>
              </a>
            </div>
          </Anim>
        </div>
      ) : (
        /* 2. Subscribed VIP Member: Show VIP Banner + Filters Ribbon + All Detailed Cards */
        <>
          {/* VIP Active Ribbon */}
          <div className="container" style={{ marginTop: '28px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(22, 199, 132, 0.15) 0%, rgba(4, 136, 248, 0.12) 100%)',
                border: '1px solid rgba(22, 199, 132, 0.4)',
                borderRadius: '16px',
                padding: '16px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'rgba(22, 199, 132, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--success)',
                  }}
                >
                  <FiCheckCircle size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'var(--success)',
                        color: '#01071E',
                      }}
                    >
                      {isAr ? 'اشتراك VIP نشط' : 'VIP ACTIVE'}
                    </span>
                    <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {isAr
                        ? `أهلاً بك! مجموعة ${subscription === 'gold' ? 'الذهب' : subscription === 'forex' ? 'الفوريكس' : 'Index والمؤشرات'} مفعلة لحسابك`
                        : `Welcome! Your ${subscription.toUpperCase()} VIP group is active`}
                    </h3>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    {isAr
                      ? 'تم فتح كافة كروت التحليلات اللحظية وشارتات MT5 وإحداثيات الدخول والأهداف ونماذج السيولة بالتفصيل.'
                      : 'All live MT5 charts, SMC coordinates, targets, and setups are unlocked in full detail.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link
                  href="/profile"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'var(--text-primary)',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FiCheckCircle size={13} color="var(--success)" />
                  <span>{isAr ? 'إدارة الاشتراك والبروفايل' : 'Manage Subscription'}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ── 2. Filters & Search Controls Ribbon ── */}
          <div className="container" style={{ marginTop: '28px' }}>
        <Anim>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 8px 30px rgba(0, 3, 13, 0.45)',
              flexWrap: 'wrap',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
              <FiSearch
                size={16}
                color="var(--text-muted)"
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  insetInlineStart: '12px',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث بالرمز (مثال: XAUUSD)...' : 'Search symbol (e.g. XAUUSD)...'}
                style={{
                  width: '100%',
                  height: '40px',
                  paddingInlineStart: '36px',
                  paddingInlineEnd: '12px',
                  background: 'rgba(1, 7, 30, 0.65)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            {/* 3 Packages Selector Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {PACKAGE_FILTERS.map((pkg) => {
                const isSelected = selectedPackage === pkg.key;
                return (
                  <button
                    key={pkg.key}
                    type="button"
                    onClick={() => setSelectedPackage(pkg.key)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: isSelected ? 800 : 600,
                      background: isSelected
                        ? pkg.color
                          ? `${pkg.color}25`
                          : 'var(--primary)'
                        : 'rgba(1, 7, 30, 0.65)',
                      color: isSelected && pkg.color ? pkg.color : isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                      border: isSelected && pkg.color ? `1px solid ${pkg.color}` : isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isAr ? pkg.labelAr : pkg.labelEn}
                  </button>
                );
              })}
            </div>

            {/* Bias Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {BIAS_OPTIONS.map((bias) => {
                const isSelected = selectedBias === bias.key;
                return (
                  <button
                    key={bias.key}
                    type="button"
                    onClick={() => setSelectedBias(bias.key)}
                    style={{
                      padding: '6px 11px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 500,
                      background: isSelected
                        ? bias.color
                          ? `${bias.color}30`
                          : 'rgba(255,255,255,0.15)'
                        : 'rgba(1, 7, 30, 0.65)',
                      color: isSelected && bias.color ? bias.color : isSelected ? '#FFFFFF' : 'var(--text-muted)',
                      border: isSelected && bias.color ? `1px solid ${bias.color}` : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isAr ? bias.labelAr : bias.labelEn}
                  </button>
                );
              })}
            </div>

            {/* Sort Option */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  height: '40px',
                  padding: '0 12px',
                  background: 'rgba(1, 7, 30, 0.65)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  fontSize: '12.5px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {isAr ? opt.labelAr : opt.labelEn}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  title={isAr ? 'إلغاء الفلاتر' : 'Reset filters'}
                  style={{
                    height: '40px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    background: 'rgba(251, 135, 4, 0.12)',
                    border: '1px solid rgba(251, 135, 4, 0.3)',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FiRotateCcw size={14} />
                </button>
              )}
            </div>
          </div>
        </Anim>
      </div>

      {/* ── 3. Main Analyses Grid ── */}
      <div className="container" style={{ marginTop: '28px' }}>
        {/* Results Count Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {isAr ? 'عرض ' : 'Showing '}
            <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{filteredAnalyses.length}</span>{' '}
            {isAr ? 'تحليلاً حياً معتمداً' : 'live setups'}
          </div>

          <button
            type="button"
            onClick={loadData}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FiRotateCcw size={13} />
            <span>{isAr ? 'تحديث البيانات الحية' : 'Refresh Live Feeds'}</span>
          </button>
        </div>

        {/* Error State Banner */}
        {error && !loading && (
          <div
            style={{
              padding: '32px',
              borderRadius: '16px',
              background: 'rgba(246, 70, 93, 0.08)',
              border: '1px solid rgba(246, 70, 93, 0.3)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              margin: '30px 0',
            }}
          >
            <FiAlertCircle size={32} color="var(--error)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {isAr ? 'تعذر الاتصال بمحرك التحليل الفني' : 'Unable to connect to technical analysis engine'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '500px' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={loadData}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                padding: '8px 20px',
              }}
            >
              <FiRotateCcw size={14} />
              <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
            </button>
          </div>
        )}

        {/* Special Notice when Index & Commodities is selected and API only serves Gold */}
        {!loading && !error && selectedPackage === 'indices' && filteredAnalyses.length === 0 && (
          <div
            style={{
              padding: '40px 28px',
              borderRadius: '16px',
              background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.12) 0%, rgba(1, 7, 30, 0.6) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              textAlign: 'center',
              margin: '20px 0 40px',
              boxShadow: '0 8px 30px rgba(0, 3, 13, 0.45)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10B981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <FiLayers size={24} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
              {isAr
                ? 'مجموعة Index (المؤشرات والسلع)'
                : 'Index & Commodities VIP Group (Oil, Gas, Silver & Indices)'}
            </h3>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto 20px', lineHeight: 1.7 }}>
              {isAr
                ? 'المحرك الرسمي للـAPI يبث حالياً صفقات وتحليلات الذهب (XAU/USD) بشكل مباشر. جاري ربط وتفعيل إشارات النفط الخام الأمريكي (WTI)، خام برنت، الغاز الطبيعي، الفضة، ومؤشرات الأسهم (US30، ناسداك) تباعاً.'
                : 'The official API live stream currently prioritizes Gold (XAU/USD). Direct automated feeds for Crude Oil (WTI/Brent), Natural Gas, Silver (XAGUSD), and stock indices (US30, Nasdaq) are being synchronized from the trading engine.'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedPackage('gold')}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #FB8704, #F6465D)',
                  padding: '10px 22px',
                  fontSize: '13px',
                }}
              >
                {isAr ? 'عرض تحليلات الذهب المتاحة الآن' : 'View Available Gold Setups'}
              </button>

              <Link
                href={getAppRoute('/checkout?type=package&package=indices', user)}
                className="btn-secondary"
                style={{ padding: '10px 22px', fontSize: '13px', textDecoration: 'none' }}
              >
                {isAr ? 'الاشتراك المسبق في مجموعة Index' : 'Pre-Subscribe to Index Group'}
              </Link>
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))',
              gap: '24px',
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  height: '380px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ height: '160px', background: 'rgba(18, 49, 92, 0.25)' }} />
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                  <div style={{ height: '22px', width: '50%', background: 'rgba(18, 49, 92, 0.3)', borderRadius: '4px' }} />
                  <div style={{ height: '40px', width: '100%', background: 'rgba(18, 49, 92, 0.2)', borderRadius: '6px' }} />
                  <div style={{ height: '32px', width: '80%', background: 'rgba(18, 49, 92, 0.15)', borderRadius: '4px', marginTop: 'auto' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty Search / Filter State (excluding indices notice above) */}
        {!loading && !error && filteredAnalyses.length === 0 && selectedPackage !== 'indices' && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              margin: '30px 0',
              boxShadow: '0 8px 30px rgba(0, 3, 13, 0.45)',
            }}
          >
            <FiActivity size={40} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.85 }} />
            {analysesList.length === 0 ? (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
                  {isAr ? 'لا توجد تحليلات أو إشارات تداول نشطة حالياً' : 'No Active Trade Setups at the Moment'}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 auto 22px', maxWidth: '520px', lineHeight: 1.7 }}>
                  {isAr
                    ? 'روبوتات التحليل الفني الذكية تراقب حركة السيولة المؤسسية (SMC) على مدار الساعة، وسيتم بث أي فرصة تداول مؤكدة فور اكتمال شروطها.'
                    : 'The automated algorithmic engine is actively scanning the markets 24/5. Verified high-probability setups will be published dynamically as they form.'}
                </p>
                <button
                  type="button"
                  onClick={loadData}
                  className="btn-primary"
                  style={{
                    fontSize: '13px',
                    padding: '9px 24px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto',
                  }}
                >
                  <FiRotateCcw size={14} />
                  <span>{isAr ? 'فحص التحليلات الآن' : 'Check Setups Now'}</span>
                </button>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  {isAr ? 'لم يتم العثور على تحليلات تطابق بحثك' : 'No analyses matched your filter criteria'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
                  {isAr ? 'جرّب اختيار مجموعة أخرى أو إعادة ضبط الفلاتر.' : 'Try adjusting the group filter or search term.'}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn-secondary"
                  style={{ fontSize: '13px', padding: '8px 20px' }}
                >
                  {isAr ? 'إعادة ضبط الفلاتر' : 'Clear All Filters'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Cards Grid */}
        {!loading && !error && filteredAnalyses.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))',
              gap: '24px',
            }}
          >
            {filteredAnalyses.map((item, idx) => {
              const isBuy = item.recommendation === 'BUY';
              const isSell = item.recommendation === 'SELL';
              const isHold = !isBuy && !isSell;
              const recColor = isBuy ? 'var(--success)' : isSell ? 'var(--error)' : '#FB8704';

              const pairLabel = item.meta?.pair || formatSymbolPair(item.symbol);
              const confidence = item.confidence_score || 78;
              const grade = item.setup_grade || 'A';
              const itemPkg = item.meta?.packageKey || getPackageForSymbol(item.symbol);

              // Extract clean preview summary
              let summary = isAr
                ? item.freshness?.description_ar || item.report_ar || ''
                : item.freshness?.description_en || item.report_en || '';
              summary = summary.replace(/[📌1️⃣2️⃣3️⃣4️⃣5️⃣#*•]/g, '').trim();
              if (summary.length > 120) {
                summary = summary.substring(0, 120) + '...';
              }

              return (
                <Anim key={item.symbol || idx} delay={idx * 40}>
                  <article
                    className="card analysis-card-item"
                    style={{
                      background: 'var(--surface)',
                      border: item.symbol === 'XAUUSD' ? '1px solid rgba(251, 135, 4, 0.45)' : '1px solid var(--border)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      boxShadow: '0 10px 30px rgba(0, 3, 13, 0.45)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    {/* 1. Real MT5 Chart Thumbnail */}
                    <RealChartBanner item={item} isAr={isAr} />

                    {/* 2. Card Content Body */}
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1 }}>
                      {/* Pair + Package + Recommendation Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                            {pairLabel}
                          </span>

                          {/* Package Badge */}
                          {itemPkg === 'gold' ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(251, 135, 4, 0.18)',
                                color: '#FB8704',
                                border: '1px solid rgba(251, 135, 4, 0.4)',
                              }}
                            >
                              {isAr ? 'الذهب' : 'Gold'}
                            </span>
                          ) : itemPkg === 'indices' ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(16, 185, 129, 0.18)',
                                color: '#10B981',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                              }}
                            >
                              {isAr ? 'المؤشرات' : 'Indices'}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(4, 136, 248, 0.18)',
                                color: 'var(--primary)',
                                border: '1px solid rgba(4, 136, 248, 0.4)',
                              }}
                            >
                              {isAr ? 'فوركس' : 'Forex'}
                            </span>
                          )}

                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            Grade {grade}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: `${recColor}18`,
                            border: `1px solid ${recColor}40`,
                            color: recColor,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {isBuy && <FiTrendingUp size={12} />}
                          {isSell && <FiTrendingDown size={12} />}
                          {isHold && <FiActivity size={12} />}
                          {item.recommendation_label || (isBuy ? 'شراء BUY' : isSell ? 'بيع SELL' : 'انتظار HOLD')}
                        </span>
                      </div>

                      {/* Coordinates Matrix */}
                      {item.coordinates && (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '6px',
                            background: 'rgba(1, 7, 30, 0.55)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '8px 6px',
                            textAlign: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {isAr ? 'الدخول' : 'Entry'}
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                              {item.coordinates.entry_price || '-'}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--success)' }}>
                              TP1
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--success)' }}>
                              {item.coordinates.tp1_price || '-'}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--error)' }}>
                              SL
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--error)' }}>
                              {item.coordinates.sl_price || '-'}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--primary)' }}>
                              R:R
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>
                              {item.coordinates.rr_ratio || '-'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Summary */}
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                          margin: 0,
                          flexGrow: 1,
                        }}
                      >
                        {summary}
                      </p>

                      {/* SMC Factors Badges */}
                      {item.smc_factors && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {item.smc_factors.order_block && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(18, 49, 92, 0.5)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              OB: {item.smc_factors.order_block}
                            </span>
                          )}
                          {item.smc_factors.fvg_status && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(18, 49, 92, 0.5)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              FVG: {item.smc_factors.fvg_status}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Confidence & Elapsed Time */}
                      <div
                        style={{
                          paddingTop: '10px',
                          borderTop: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--accent)', fontWeight: 700 }}>
                          <FiAward size={13} />
                          <span>{isAr ? `ثقة: ${confidence}%` : `Conf: ${confidence}%`}</span>
                        </span>

                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <FiClock size={12} />
                          <span>
                            {item.freshness?.elapsed_minutes !== undefined
                              ? (isAr ? `منذ ${Math.round(item.freshness.elapsed_minutes)} د` : `${Math.round(item.freshness.elapsed_minutes)}m ago`)
                              : 'Live'}
                          </span>
                        </span>
                      </div>

                      {/* CTA Button */}
                      <div style={{ paddingTop: '4px' }}>
                        <Link
                          href={getAppRoute(`/analyses/${item.symbol}`, user)}
                          className="btn-primary"
                          style={{
                            width: '100%',
                            height: '38px',
                            fontSize: '13px',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            fontWeight: 700,
                          }}
                        >
                          {isAr ? 'عرض الشارت والتقرير الفني' : 'View Chart & Technical Dossier'}
                          <FiArrowLeft size={14} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
                        </Link>
                      </div>
                    </div>
                  </article>
                </Anim>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}

      <style>{`
        .analysis-card-item:hover {
          transform: translateY(-4px);
          border-color: rgba(4, 136, 248, 0.5) !important;
          box-shadow: 0 14px 36px rgba(0, 3, 13, 0.6) !important;
        }
      `}</style>
    </div>
  );
}
