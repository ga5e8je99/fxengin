'use client';
import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import Anim from '../../components/Anim';
import PageHeroBackground from '../../components/PageHeroBackground';
import {
  FiArrowRight,
  FiArrowLeft,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiShield,
  FiTarget,
  FiCheckCircle,
  FiLock,
  FiShare2,
  FiCheck,
  FiActivity,
  FiAlertTriangle,
  FiLayers,
  FiAward,
  FiRotateCcw,
  FiMaximize2,
  FiX,
  FiCheckSquare,
  FiZap,
} from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { usePageLoading } from '../../context/LoadingContext';
import { getAppRoute } from '../../utils/routes';
import {
  fetchAnalystShare,
  fetchActiveAnalysesList,
  requestFreshSnapshot,
  getAnalystImageUrl,
  normalizeSymbol,
  formatSymbolPair,
} from '../../services/analystService';
import { ANALYSIS_PACKAGES } from '../analysesData';

// Map numeric or alias legacy IDs to standard active symbols
const LEGACY_ID_MAP = {
  1: 'XAUUSD',
  2: 'EURUSD',
  3: 'GBPUSD',
  4: 'USDJPY',
  5: 'EURJPY',
  6: 'GBPJPY',
  7: 'AUDUSD',
  8: 'USDCAD',
  9: 'USDCHF',
  10: 'AUDJPY',
  11: 'CADJPY',
  gold: 'XAUUSD',
  euro: 'EURUSD',
};

export default function AnalysisDetailPage({ params }) {
  const unwrappedParams = use(params);
  const rawId = unwrappedParams?.analysisId || unwrappedParams?.id;
  const { isAr } = useLanguage();
  const { user } = useAuth();

  // Normalize target symbol
  const targetSymbol = normalizeSymbol(LEGACY_ID_MAP[rawId] || rawId || 'XAUUSD');

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keep global brand PageLoader visible until single analysis completes
  usePageLoading(loading, 'analysis_detail');
  const [refreshingSnapshot, setRefreshingSnapshot] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [relatedAnalyses, setRelatedAnalyses] = useState([]);

  // Fetch technical analysis from official API
  const loadAnalysis = useCallback(
    async (forceBypassCache = false) => {
      setLoading(true);
      setError(null);
      try {
        const lang = isAr ? 'ar' : 'en';
        const res = await fetchAnalystShare(targetSymbol, lang, true, forceBypassCache);

        if (res.success && res.data) {
          setAnalysis(res.data);
        } else {
          throw new Error(res.error || (isAr ? 'لم يتم العثور على تحليل فني نشط لهذا الرمز' : 'No active technical analysis found for this symbol'));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [targetSymbol, isAr]
  );

  // Manual trigger for fresh snapshot
  const handleRequestFreshSnapshot = async () => {
    if (refreshingSnapshot) return;
    setRefreshingSnapshot(true);
    try {
      const freshRes = await requestFreshSnapshot(targetSymbol);
      if (freshRes.success) {
        // Re-load analysis bypassing cache
        await loadAnalysis(true);
      } else {
        alert(isAr ? 'فشل تحديث اللقطة، يرجى المحاولة لاحقاً' : 'Snapshot refresh failed, please retry shortly');
      }
    } catch (err) {
      console.error('Manual snapshot refresh error:', err);
    } finally {
      setRefreshingSnapshot(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  // Load related real analyses for bottom section
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetchActiveAnalysesList(isAr ? 'ar' : 'en');
        if (isMounted && res.success && Array.isArray(res.data)) {
          const others = res.data.filter((item) => item.symbol !== targetSymbol).slice(0, 3);
          setRelatedAnalyses(others);
        }
      } catch {
        // silent fail for related
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [targetSymbol, isAr]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // State calculations
  const isBuy = analysis?.recommendation === 'BUY';
  const isSell = analysis?.recommendation === 'SELL';
  const recColor = isBuy ? 'var(--success)' : isSell ? 'var(--error)' : '#FB8704';

  const freshness = analysis?.freshness;
  const isOptimal = freshness?.is_optimal && !freshness?.needs_new_snapshot;
  const isDrifted = freshness?.status_code === 'PRICE_DRIFTED';
  const isStale = freshness?.status_code === 'TIME_STALE';

  const pairLabel = analysis?.meta?.pair || formatSymbolPair(targetSymbol);
  const imageUrl = getAnalystImageUrl(targetSymbol, analysis?.snapshot_id, analysis?.image_url);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* ── 1. Hero / Header Breadcrumb Section ── */}
      <section
        style={{
          position: 'relative',
          padding: '36px 0 32px',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <PageHeroBackground />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Breadcrumb Navigation & Share Button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <Link href={getAppRoute('/', user)} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                {isAr ? 'الرئيسية' : 'Home'}
              </Link>
              <span>/</span>
              <Link href={getAppRoute('/analyses', user)} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                {isAr ? 'التحليلات الحية' : 'Live Analyses'}
              </Link>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700, direction: 'ltr' }}>
                {pairLabel}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleShare}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  background: 'rgba(4, 136, 248, 0.12)',
                  border: '1px solid rgba(4, 136, 248, 0.3)',
                  color: 'var(--primary)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                {copied ? <FiCheck size={14} color="var(--success)" /> : <FiShare2 size={14} />}
                <span>{copied ? (isAr ? 'تم نسخ الرابط!' : 'Link Copied!') : (isAr ? 'مشاركة التحليل' : 'Share')}</span>
              </button>

              <Link
                href={getAppRoute('/analyses', user)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                {isAr ? <FiArrowRight size={14} /> : <FiArrowLeft size={14} />}
                <span>{isAr ? 'كل التحليلات' : 'All Analyses'}</span>
              </Link>
            </div>
          </div>

          {/* Loading Skeleton Header */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px 0' }}>
              <div style={{ height: '32px', width: '220px', background: 'rgba(18, 49, 92, 0.4)', borderRadius: '6px' }} />
              <div style={{ height: '24px', width: '60%', background: 'rgba(18, 49, 92, 0.25)', borderRadius: '4px' }} />
            </div>
          )}

          {/* Error State Header */}
          {error && !loading && (
            <div
              style={{
                padding: '24px',
                borderRadius: '12px',
                background: 'rgba(246, 70, 93, 0.08)',
                border: '1px solid rgba(246, 70, 93, 0.3)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                margin: '20px 0',
              }}
            >
              <FiAlertTriangle size={32} color="var(--error)" />
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isAr ? 'تعذر جلب التحليل الفني المطلوب' : 'Could not retrieve technical analysis'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{error}</div>
              <button
                type="button"
                onClick={() => loadAnalysis(true)}
                className="btn-primary"
                style={{ fontSize: '13px', padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FiRotateCcw size={14} />
                <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
              </button>
            </div>
          )}

          {/* Asset & Title Header Block */}
          {!loading && !error && analysis && (
            <Anim>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '24px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 'min(100%, 300px)' }}>
                  {/* Meta Badges Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {/* Real MT5 Capture Status Badge */}
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        background: analysis.is_real_mt5_capture ? 'rgba(22, 199, 132, 0.15)' : 'rgba(4, 136, 248, 0.15)',
                        border: analysis.is_real_mt5_capture ? '1px solid rgba(22, 199, 132, 0.4)' : '1px solid rgba(4, 136, 248, 0.3)',
                        color: analysis.is_real_mt5_capture ? 'var(--success)' : 'var(--primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FiShield size={13} />
                      {analysis.is_real_mt5_capture
                        ? (isAr ? 'لقطة شارت MT5 حقيقية معتمدة' : 'Verified MT5 Terminal Capture')
                        : (isAr ? 'تحليل المحرك المؤسسي' : 'Institutional Core Analysis')}
                    </span>

                    {/* Recommendation Badge */}
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 800,
                        background: `${recColor}18`,
                        border: `1px solid ${recColor}50`,
                        color: recColor,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      {isBuy && <FiTrendingUp size={14} />}
                      {isSell && <FiTrendingDown size={14} />}
                      {!isBuy && !isSell && <FiActivity size={14} />}
                      {analysis.recommendation_label || analysis.recommendation}
                    </span>

                    {/* Package Badge */}
                    {analysis.meta?.packageKey === 'gold' ? (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          background: 'rgba(251, 135, 4, 0.18)',
                          border: '1px solid rgba(251, 135, 4, 0.45)',
                          color: '#FB8704',
                        }}
                      >
                        {isAr ? 'باقة الذهب (الذهب)' : 'Gold Plan (XAU/USD)'}
                      </span>
                    ) : analysis.meta?.packageKey === 'indices' ? (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          background: 'rgba(16, 185, 129, 0.18)',
                          border: '1px solid rgba(16, 185, 129, 0.45)',
                          color: '#10B981',
                        }}
                      >
                        {isAr ? 'باقة المؤشرات والسلع' : 'Index & Commodities'}
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          background: 'rgba(4, 136, 248, 0.18)',
                          border: '1px solid rgba(4, 136, 248, 0.45)',
                          color: 'var(--primary)',
                        }}
                      >
                        {isAr ? 'باقة الفوركس (أزواج العملات)' : 'Forex Plan (Currency Pairs)'}
                      </span>
                    )}

                    {/* Setup Grade */}
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Grade: {analysis.setup_grade || 'A'}
                    </span>

                    {/* Timeframe */}
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: 'rgba(1, 7, 30, 0.8)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {analysis.timeframe || 'M5'}
                    </span>
                  </div>

                  {/* Main Heading */}
                  <h1
                    style={{
                      fontSize: 'clamp(22px, 3vw, 32px)',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.35,
                      margin: '0 0 12px 0',
                    }}
                  >
                    {isAr ? analysis.bias_label || `${pairLabel} — تحليل فني مؤسسي مباشر` : `${pairLabel} — Institutional Market Analysis`}
                  </h1>

                  {/* Subtitle / Descriptive Status */}
                  <p
                    style={{
                      fontSize: '15px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.7,
                      margin: '0 0 20px 0',
                      maxWidth: '820px',
                    }}
                  >
                    {isAr
                      ? analysis.freshness?.description_ar || 'تحليل فني مؤسسي مدعوم بمفاهيم الأموال الذكية (SMC) وتدفقات السيولة البنكية.'
                      : analysis.freshness?.description_en || 'Institutional technical dossier driven by Smart Money Concepts and order blocks.'}
                  </p>

                  {/* Meta Bar: Confidence + UTC Timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent)', fontWeight: 700 }}>
                      <FiAward size={15} />
                      <span>{isAr ? `نسبة الثقة: ${analysis.confidence_score}%` : `Confidence: ${analysis.confidence_score}%`}</span>
                    </div>

                    <div style={{ height: '18px', width: '1px', background: 'var(--border)' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      <FiClock size={14} />
                      <span>{analysis.created_at_utc || 'M5 Live'}</span>
                    </div>

                    {analysis.freshness?.elapsed_minutes !== undefined && (
                      <>
                        <div style={{ height: '18px', width: '1px', background: 'var(--border)' }} />
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                          {isAr
                            ? `مرّت ${Math.round(analysis.freshness.elapsed_minutes)} دقيقة على اللقطة`
                            : `Snapshot taken ${Math.round(analysis.freshness.elapsed_minutes)}m ago`}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Live Current Price Card */}
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '18px 24px',
                    textAlign: isAr ? 'right' : 'left',
                    minWidth: '220px',
                    boxShadow: '0 8px 24px rgba(0, 3, 13, 0.4)',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {isAr ? 'سعر السوق اللحظي' : 'Live Market Price'}
                  </div>
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      direction: 'ltr',
                      marginBottom: '6px',
                    }}
                  >
                    {analysis.freshness?.current_price || analysis.coordinates?.entry_price || '-'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: isOptimal ? 'var(--success)' : '#FB8704',
                        background: isOptimal ? 'rgba(22, 199, 132, 0.12)' : 'rgba(251, 135, 4, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        direction: 'ltr',
                      }}
                    >
                      {freshness?.status_code || 'OPTIMAL'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {freshness?.drift_pips !== undefined
                        ? (isAr ? `${freshness.drift_pips} نقطة انزياح` : `${freshness.drift_pips} pips drift`)
                        : 'M5 Feed'}
                    </span>
                  </div>
                </div>
              </div>
            </Anim>
          )}
        </div>
      </section>

      {/* ── 2. Freshness & Snapshot Alert Banner ── */}
      {!loading && !error && analysis && (
        <div className="container" style={{ marginTop: '24px' }}>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: isOptimal
                ? 'rgba(22, 199, 132, 0.08)'
                : isDrifted
                ? 'rgba(251, 135, 4, 0.08)'
                : 'rgba(4, 136, 248, 0.08)',
              border: isOptimal
                ? '1px solid rgba(22, 199, 132, 0.35)'
                : isDrifted
                ? '1px solid rgba(251, 135, 4, 0.35)'
                : '1px solid rgba(4, 136, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isOptimal
                    ? 'rgba(22, 199, 132, 0.2)'
                    : isDrifted
                    ? 'rgba(251, 135, 4, 0.2)'
                    : 'rgba(4, 136, 248, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isOptimal ? 'var(--success)' : isDrifted ? '#FB8704' : 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                {isOptimal ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
              </div>

              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {isOptimal
                    ? (isAr ? 'حالة التحليل: مباشر ونشط (Optimal Entry Zone)' : 'Setup Status: Active & Optimal')
                    : isDrifted
                    ? (isAr ? 'تنبيه: تحرك السعر عن منطقة الدخول الأصلية (Price Drifted)' : 'Alert: Price Drifted from Original Entry')
                    : (isAr ? 'تنبيه: لقطة غير محدثة (Stale Snapshot)' : 'Alert: Stale Analysis Snapshot')}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  {isAr ? freshness?.description_ar : freshness?.description_en}
                </div>
              </div>
            </div>

            {/* Request Fresh Snapshot CTA Button */}
            <button
              type="button"
              onClick={handleRequestFreshSnapshot}
              disabled={refreshingSnapshot}
              className="btn-primary"
              style={{
                fontSize: '12.5px',
                padding: '8px 16px',
                height: '38px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: refreshingSnapshot ? 'not-allowed' : 'pointer',
                opacity: refreshingSnapshot ? 0.7 : 1,
              }}
            >
              <FiRotateCcw size={14} className={refreshingSnapshot ? 'spin-icon' : ''} />
              <span>
                {refreshingSnapshot
                  ? (isAr ? 'جارٍ التقاط شارت وتحليل جديد...' : 'Capturing fresh snapshot...')
                  : (isAr ? 'طلب التقاط شارت وتحليل جديد' : 'Request Fresh Snapshot')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── 3. Main Content Grid (Chart + Technical Breakdown + Signals) ── */}
      {!loading && !error && analysis && (
        <div className="container" style={{ marginTop: '28px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 1fr',
              gap: '28px',
              alignItems: 'start',
            }}
            className="analysis-detail-grid"
          >
            {/* ── Left Column: Real MT5 Chart & Deep Institutional Dossier ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Real MT5 Chart Capture Card */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 12px 36px rgba(0, 3, 13, 0.4)',
                }}
              >
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: 'rgba(1, 7, 30, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isOptimal ? 'var(--success)' : '#FB8704',
                        boxShadow: isOptimal ? '0 0 8px var(--success)' : 'none',
                      }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {pairLabel} · {analysis.timeframe || 'M5'}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.06)',
                      }}
                    >
                      {analysis.snapshot_id || 'MT5 Live'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <FiMaximize2 size={14} />
                    <span>{isAr ? 'عرض الشارت بكامل الحجم' : 'Full Screen Chart'}</span>
                  </button>
                </div>

                {/* Real MT5 Chart Display */}
                <div
                  style={{
                    position: 'relative',
                    background: '#010514',
                    minHeight: '340px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => setLightboxOpen(true)}
                >
                  <img
                    src={imageUrl}
                    alt={`${targetSymbol} MT5 Institutional Chart`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '520px',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      insetInlineEnd: '12px',
                      background: 'rgba(1, 7, 30, 0.85)',
                      backdropFilter: 'blur(6px)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {isAr ? 'انقر لتكبير الشارت' : 'Click to expand'}
                  </div>
                </div>
              </div>

              {/* SMC Factors & Institutional Liquidity Matrix */}
              {analysis.smc_factors && (
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 10px 30px rgba(0, 3, 13, 0.4)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(4, 136, 248, 0.15)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FiLayers size={18} />
                    </div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {isAr ? 'عوامل الأموال الذكية (Smart Money Concepts - SMC)' : 'Smart Money Concepts (SMC Factors)'}
                    </h3>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '14px',
                    }}
                  >
                    {/* Order Block */}
                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'rgba(1, 7, 30, 0.65)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {isAr ? 'كتلة الأوامر (Order Block)' : 'Order Block'}
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {analysis.smc_factors.order_block || 'N/A'}
                      </div>
                    </div>

                    {/* FVG Status */}
                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'rgba(1, 7, 30, 0.65)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {isAr ? 'الفجوة السعرية (FVG Status)' : 'Fair Value Gap'}
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {analysis.smc_factors.fvg_status || 'N/A'}
                      </div>
                    </div>

                    {/* Liquidity Sweep */}
                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'rgba(1, 7, 30, 0.65)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {isAr ? 'سحب السيولة (Liquidity Sweep)' : 'Liquidity Sweep'}
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {analysis.smc_factors.liquidity_sweep || 'N/A'}
                      </div>
                    </div>

                    {/* MSS Status */}
                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'rgba(1, 7, 30, 0.65)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {isAr ? 'كسر الهيكل (Market Structure Shift)' : 'Structure Shift (MSS)'}
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {analysis.smc_factors.mss_status || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Indicators Ribbon */}
              {analysis.indicators && (
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '14px',
                    boxShadow: '0 10px 30px rgba(0, 3, 13, 0.4)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RSI (14)</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {analysis.indicators.rsi || '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ADX (Trend Strength)</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {analysis.indicators.adx || '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ATR (Volatility)</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {analysis.indicators.atr || '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DXY Bias</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#FB8704', fontFamily: 'monospace' }}>
                      {analysis.indicators.dxy_bias || '-'}
                    </div>
                  </div>
                </div>
              )}

              {/* Deep Technical Analysis Breakdown / Report Text */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '28px 30px',
                  boxShadow: '0 10px 30px rgba(0, 3, 13, 0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(4, 136, 248, 0.15)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiActivity size={18} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {isAr ? 'التقرير الفني والتشريحي الشامل' : 'Comprehensive Institutional Technical Dossier'}
                  </h3>
                </div>

                <div
                  style={{
                    fontSize: '14.5px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.9,
                    whiteSpace: 'pre-line',
                    fontFamily: 'inherit',
                  }}
                >
                  {isAr
                    ? analysis.report_ar || analysis.report
                    : analysis.report_en || analysis.report}
                </div>
              </div>
            </div>

            {/* ── Right Column: Execution Matrix Board & Risk Protocol ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Signal Execution Matrix Board */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 12px 36px rgba(0, 3, 13, 0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiTarget size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: '16.5px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {isAr ? 'لوحة أهداف وإحداثيات الصفقة' : 'Signal Coordinates Matrix'}
                    </h3>
                  </div>

                  {analysis.coordinates?.rr_ratio && (
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(4, 136, 248, 0.12)',
                        color: 'var(--primary)',
                        fontFamily: 'monospace',
                      }}
                    >
                      R:R {analysis.coordinates.rr_ratio}
                    </span>
                  )}
                </div>

                {/* Matrix Levels */}
                {analysis.coordinates && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Entry Price */}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'rgba(1, 7, 30, 0.65)',
                        border: '1px solid rgba(18, 49, 92, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                          {isAr ? 'نقطة الدخول المقترحة (Entry)' : 'Proposed Entry'}
                        </div>
                        <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', direction: 'ltr' }}>
                          {analysis.coordinates.entry_price}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {isAr ? 'أمر محدد Limit' : 'Limit Order'}
                      </span>
                    </div>

                    {/* TP1 */}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'rgba(22, 199, 132, 0.08)',
                        border: '1px solid rgba(22, 199, 132, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11.5px', color: 'var(--success)', marginBottom: '2px', fontWeight: 600 }}>
                          {isAr ? 'الهدف الأول (TP1 - Scalp)' : 'Target 1 (TP1 - Scalp)'}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success)', fontFamily: 'monospace', direction: 'ltr' }}>
                          {analysis.coordinates.tp1_price}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 700 }}>
                        {analysis.coordinates.tp1_pips ? `+${analysis.coordinates.tp1_pips} pips` : 'TP1'}
                      </span>
                    </div>

                    {/* TP2 */}
                    {analysis.coordinates.tp2_price && (
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          background: 'rgba(22, 199, 132, 0.08)',
                          border: '1px solid rgba(22, 199, 132, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '11.5px', color: 'var(--success)', marginBottom: '2px', fontWeight: 600 }}>
                            {isAr ? 'الهدف الثاني الرئيسي (TP2 - Swing)' : 'Target 2 (TP2 - Expansion)'}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success)', fontFamily: 'monospace', direction: 'ltr' }}>
                            {analysis.coordinates.tp2_price}
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 700 }}>
                          {analysis.coordinates.tp2_pips ? `+${analysis.coordinates.tp2_pips} pips` : 'Full TP'}
                        </span>
                      </div>
                    )}

                    {/* Stop Loss (SL) */}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'rgba(246, 70, 93, 0.08)',
                        border: '1px solid rgba(246, 70, 93, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11.5px', color: 'var(--error)', marginBottom: '2px', fontWeight: 600 }}>
                          {isAr ? 'وقف الخسارة الهيكلي (Stop Loss)' : 'Structural Stop Loss (SL)'}
                        </div>
                        <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--error)', fontFamily: 'monospace', direction: 'ltr' }}>
                          {analysis.coordinates.sl_price}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--error)', fontWeight: 700 }}>
                        {analysis.coordinates.sl_pips ? `-${analysis.coordinates.sl_pips} pips` : 'Hard SL'}
                      </span>
                    </div>

                    {/* Suggested Lot Size */}
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(1, 7, 30, 0.45)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>
                        {isAr ? 'حجم اللوت الآمن المقترح (1% مخاطرة):' : 'Suggested Lot (1% Risk):'}
                      </span>
                      <span style={{ color: 'var(--accent)', fontWeight: 800, fontFamily: 'monospace' }}>
                        {analysis.coordinates.suggested_lot || 0.01} Lots
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* VIP Subscription CTA Box */}
              {(() => {
                const currentPkgKey = analysis?.meta?.packageKey || 'gold';
                const currentPkg = ANALYSIS_PACKAGES.find((p) => p.id === currentPkgKey) || ANALYSIS_PACKAGES[0];

                return (
                  <div
                    style={{
                      background: `linear-gradient(145deg, ${currentPkg.color}20 0%, rgba(4, 136, 248, 0.08) 100%)`,
                      border: `1px solid ${currentPkg.color}55`,
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: `0 12px 36px ${currentPkg.color}20`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiLock size={18} color={currentPkg.color} />
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {isAr ? currentPkg.nameAr : currentPkg.nameEn}
                        </h4>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: currentPkg.color, fontFamily: 'monospace' }}>
                        {isAr ? currentPkg.priceStrAr : currentPkg.priceStrEn}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {isAr ? `نطاق التغطية: ${currentPkg.scopeAr}` : `Covers: ${currentPkg.scopeEn}`}
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 16px 0' }}>
                      {isAr ? currentPkg.descAr : currentPkg.descEn}
                    </p>

                    <Link
                      href={getAppRoute(`/checkout?type=package&package=${currentPkg.id}`, user)}
                      className="btn-primary"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        fontWeight: 800,
                        fontSize: '13.5px',
                        height: '42px',
                        background: `linear-gradient(135deg, ${currentPkg.color}, #F6465D)`,
                        boxShadow: `0 4px 18px ${currentPkg.color}40`,
                      }}
                    >
                      <FiZap size={14} />
                      <span>{isAr ? `الاشتراك في ${currentPkg.nameAr}` : `Subscribe to ${currentPkg.nameEn}`}</span>
                    </Link>
                  </div>
                );
              })()}

              {/* Broker Account CTA */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '22px',
                  textAlign: 'center',
                }}
              >
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {isAr ? 'تداول هذه الصفقة مع وسيط موثوق' : 'Trade with Tier-1 Regulated Broker'}
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
                  {isAr
                    ? 'افتح حساب تداول إسلامي مع شركائنا المعتمدين لتنفيذ صفقاتك بأقل سبريد وسرعة تنفيذ فائقة.'
                    : 'Open a zero-swap trading account with our vetted brokers to execute setups at minimal spread.'}
                </p>
                <Link
                  href={getAppRoute('/open-account', user)}
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  {isAr ? 'فتح حساب تداول الآن' : 'Open Broker Account'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Related Analyses Section ── */}
      {!loading && !error && relatedAnalyses.length > 0 && (
        <div className="container" style={{ marginTop: '64px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                {isAr ? 'تحليلات أخرى نشطة حالياً' : 'Other Active Setups from MT5'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                {isAr ? 'فرص تداول مؤسسية إضافية تحت المتابعة' : 'Additional live trade setups currently tracked'}
              </p>
            </div>
            <Link href={getAppRoute('/analyses', user)} className="btn-ghost" style={{ textDecoration: 'none' }}>
              {isAr ? 'عرض الكل' : 'View All'}
              <FiArrowLeft size={14} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: '20px',
            }}
          >
            {relatedAnalyses.map((relItem) => {
              const relIsBuy = relItem.recommendation === 'BUY';
              const relIsSell = relItem.recommendation === 'SELL';
              const relRecColor = relIsBuy ? 'var(--success)' : relIsSell ? 'var(--error)' : '#FB8704';
              const relPair = relItem.meta?.pair || formatSymbolPair(relItem.symbol);

              return (
                <Link
                  key={relItem.symbol}
                  href={getAppRoute(`/analyses/${relItem.symbol}`, user)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                  }}
                  className="related-analysis-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: `${relRecColor}18`,
                        border: `1px solid ${relRecColor}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: relRecColor,
                      }}
                    >
                      {relIsBuy ? <FiTrendingUp size={18} /> : relIsSell ? <FiTrendingDown size={18} /> : <FiActivity size={18} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {relPair}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {relItem.recommendation_label || relItem.recommendation} · Grade {relItem.setup_grade || 'A'}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 700 }}>
                    {isAr ? 'عرض ←' : 'View →'}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. Full Screen Lightbox Modal for MT5 Chart ── */}
      {lightboxOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 3, 13, 0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setLightboxOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '96vw',
              maxHeight: '94vh',
              background: '#010514',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(1, 7, 30, 0.85)',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {pairLabel} — Verified MT5 Chart Capture
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Image */}
            <img
              src={imageUrl}
              alt={`${targetSymbol} Full Resolution Chart`}
              style={{
                width: '100%',
                maxHeight: 'calc(94vh - 60px)',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
        .related-analysis-card:hover {
          border-color: var(--primary) !important;
          transform: translateY(-2px);
        }
        @media (max-width: 991px) {
          .analysis-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
