'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FiCheck, FiX, FiZap, FiActivity } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';

export default function AnalysesPricingPlans() {
  const { isAr } = useLanguage();
  const { user } = useAuth();
  const [fetchedPlans, setFetchedPlans] = useState(null);

  useEffect(() => {
    fetch('/api/subscriptions/plans')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data || data?.plans);
        if (Array.isArray(list) && list.length > 0) {
          setFetchedPlans(list);
        }
      })
      .catch(() => {});
  }, []);

  // 3 Paid Monthly Analysis Groups strictly ordered from smallest to largest: Forex (50 USDT) -> Index (100 USDT) -> Gold (200 USDT)
  const plans = [
    {
      id: 'forex',
      nameEn: 'Forex Analysis Group',
      nameAr: 'مجموعة الفوريكس',
      badgeEn: 'Currency Pairs',
      badgeAr: 'أزواج العملات',
      badgeColor: '#0488F8',
      descEn: 'Institutional coverage and live setups across major and cross FX currency pairs.',
      descAr: 'جروب تحليلات أزواج العملات الأجنبية الرئيسية والتقاطعات اللحظية بمستويات دخول وخروج دقيقة وهيكل السيولة البنكية.',
      priceVal: 50,
      priceStr: '50 USDT',
      isFeatured: false,
      ctaTextEn: 'Join Forex Group',
      ctaTextAr: 'الانضمام إلى مجموعة الفوريكس',
      themeColor: '#0488F8',
      btnGradient: 'linear-gradient(135deg, #0488F8 0%, #0056B3 100%)',
      btnHoverGradient: 'linear-gradient(135deg, #2499FF 0%, #0488F8 100%)',
      btnShadow: '0 4px 18px rgba(4, 136, 248, 0.45)',
      btnHoverShadow: '0 6px 26px rgba(4, 136, 248, 0.65)',
      btnBorder: '1px solid rgba(4, 136, 248, 0.5)',
      btnColor: '#FFFFFF',
      features: [
        { textEn: 'Major FX pairs coverage (EUR/USD, GBP/USD, USD/JPY...)', textAr: 'تغطية أزواج العملات الرئيسية (EUR/USD, GBP/USD, USD/JPY...)', included: true },
        { textEn: 'Verified entry zones, TP1/TP2 targets, and Stop Loss', textAr: 'إحداثيات دخول وخروج لحظية مع مستويات وقف الخسارة والأهداف', included: true },
        { textEn: 'Institutional SMC market structure updates', textAr: 'تحديثات هيكل السوق والسيولة البنكية (SMC Structure)', included: true },
        { textEn: '24/5 push alerts on high-conviction currency setups', textAr: 'تنبيهات فورية عند تشكل فرص التداول اللحظية على مدار 24/5', included: true },
        { textEn: 'Monthly recurring subscription with instant activation', textAr: 'اشتراك شهري مباشر وتفعيل فوري للتحليلات', included: true },
      ],
    },
    {
      id: 'indices',
      nameEn: 'Index & Commodities Group',
      nameAr: 'مجموعة Index',
      badgeEn: 'Energy & Indices',
      badgeAr: 'المؤشرات والسلع',
      badgeColor: '#10B981',
      descEn: 'Institutional coverage for Crude Oil, Natural Gas, Silver (XAG/USD), and global stock indices.',
      descAr: 'جروب التحليلات الخاص بمؤشرات الأسهم الأمريكية (داو جونز US30 وناسداك NAS100) وأسواق الطاقة (النفط والغاز) والمعادن الثمينة (الفضة).',
      priceVal: 100,
      priceStr: '100 USDT',
      isFeatured: false,
      ctaTextEn: 'Join Index Group',
      ctaTextAr: 'الانضمام إلى مجموعة Index',
      themeColor: '#10B981',
      btnGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      btnHoverGradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
      btnShadow: '0 4px 18px rgba(16, 185, 129, 0.45)',
      btnHoverShadow: '0 6px 26px rgba(16, 185, 129, 0.65)',
      btnBorder: '1px solid rgba(16, 185, 129, 0.5)',
      btnColor: '#FFFFFF',
      features: [
        { textEn: 'Wall Street equity benchmarks: US30 Dow & NAS100 Nasdaq', textAr: 'تحليلات مؤشرات وول ستريت العالمية (Dow US30 و NAS100 Nasdaq)', included: true },
        { textEn: 'Energy market setups: US Crude Oil (WTI) and Natural Gas', textAr: 'تغطية صفقات أسواق الطاقة: النفط الأمريكي والغاز الطبيعي', included: true },
        { textEn: 'Precious & industrial metals: Silver (XAG/USD)', textAr: 'إشارات وتحليلات معدن الفضة (XAG/USD)', included: true },
        { textEn: 'Precise coordinates, stop loss, targets, and risk:reward ratios', textAr: 'إحداثيات ومستويات الوقف والأهداف ونسب المخاطرة للعائد', included: true },
        { textEn: 'High-impact alerts for US and European session opens', textAr: 'تنبيهات خاصة بفترات السيولة في افتتاح الجلسات الأمريكية والأوروبية', included: true },
        { textEn: 'Monthly recurring subscription with instant activation', textAr: 'اشتراك شهري مباشر وتفعيل فوري للتحليلات', included: true },
      ],
    },
    {
      id: 'gold',
      nameEn: 'Gold Analysis Group',
      nameAr: 'مجموعة الذهب',
      badgeEn: 'Most Popular • Live on API',
      badgeAr: 'الأكثر طلباً • مجموعة الذهب',
      badgeColor: '#F59E0B',
      descEn: 'The flagship institutional group: Real-time MT5 chart feeds and live trading setups for Gold (XAU/USD).',
      descAr: 'جروب وتغطية حصرية لتحليلات وإشارات الذهب (XAU/USD) الحية لحظة بلحظة من شارتات MT5 مع مناطق الدخول ووقف الخسارة وجني الأرباح ونماذج السيولة الذكية SMC.',
      priceVal: 200,
      priceStr: '200 USDT',
      isFeatured: true, // Elevated with Brand Gradient border & Golden accent button
      ctaTextEn: 'Join Gold Group Now',
      ctaTextAr: 'الانضمام لمجموعة الذهب الان',
      themeColor: '#F59E0B',
      btnGradient: 'linear-gradient(135deg, #FFB800 0%, #D97706 100%)',
      btnHoverGradient: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
      btnShadow: '0 4px 20px rgba(245, 158, 11, 0.5)',
      btnHoverShadow: '0 6px 28px rgba(245, 158, 11, 0.7)',
      btnBorder: '1px solid rgba(255, 184, 0, 0.6)',
      btnColor: '#FFFFFF',
      features: [
        { textEn: 'Live streaming Gold (XAU/USD) analyses directly from official API', textAr: 'تغطية حية ومباشرة لتحليلات صفقات الذهب (XAU/USD)', included: true },
        { textEn: 'Real MT5 chart thumbnail captures synchronized from server', textAr: 'شارتات MT5 لحظية ملتقطة مباشرة من خوادم التداول', included: true },
        { textEn: 'Signal coordinates matrix: Entry, TP1, TP2, and SL levels', textAr: 'مصفوفة إحداثيات رقمية دقيقة: الدخول، TP1، TP2، والوقف', included: true },
        { textEn: 'Smart Money Concepts: Order Blocks & Fair Value Gaps (FVG)', textAr: 'تحليل السيولة البنكية SMC ونماذج Order Blocks و FVG', included: true },
        { textEn: '24/5 push alerts and continuous live updates', textAr: 'تحديثات فورية وتنبيهات مستمرة على مدار 24/5', included: true },
        { textEn: 'On-demand Fresh Snapshot Request button', textAr: 'طلب لقطة شارت جديدة لحظياً (Fresh Snapshot)', included: true },
        { textEn: 'Monthly recurring subscription with instant VIP unlock', textAr: 'اشتراك شهري مباشر وتفعيل فوري للتحليلات', included: true },
      ],
    },
  ];

  const displayPlans = useMemo(() => {
    if (!fetchedPlans || fetchedPlans.length === 0) {
      return plans;
    }

    const activeFromApi = fetchedPlans.filter((p) => p.isActive);
    if (activeFromApi.length === 0) return plans;

    // Prioritize the 3 core analysis plans ordered by price ascending: 50 -> 100 -> 200
    const orderedKeys = ['forex', 'indices', 'gold'];
    const sorted = [...activeFromApi].sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      if (priceA !== priceB) return priceA - priceB;
      const idxA = orderedKeys.indexOf(a.slug);
      const idxB = orderedKeys.indexOf(b.slug);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

    return sorted.map((p) => {
      const defaultMatch = plans.find((d) => d.id === p.slug) || {};
      const isGold = p.slug === 'gold' || p.highlightColor === '#FB8704' || p.highlightColor === '#F59E0B' || (p.badge && p.badge.includes('الأكثر طلباً'));
      const isIndices = p.slug === 'indices';
      const isForex = p.slug === 'forex';

      let mappedFeatures = defaultMatch.features;
      if (Array.isArray(p.features) && p.features.length > 0) {
        mappedFeatures = p.features.map((feat) => {
          if (typeof feat === 'string') {
            return { textAr: feat, textEn: feat, included: true };
          }
          return feat;
        });
      }

      const themeColor = isGold ? '#F59E0B' : isIndices ? '#10B981' : '#0488F8';

      return {
        id: p.slug || p.id,
        nameEn: p.name,
        nameAr: p.name,
        badgeEn: p.badge || (isGold ? 'Most Popular' : isIndices ? 'Energy & Indices' : 'Currency Pairs'),
        badgeAr: p.badge || (isGold ? 'الأكثر طلباً • مجموعة الذهب' : isIndices ? 'المؤشرات والسلع' : 'أزواج العملات'),
        badgeColor: defaultMatch.badgeColor || themeColor,
        descEn: p.description || defaultMatch.descEn || '',
        descAr: p.description || defaultMatch.descAr || '',
        priceVal: Number(p.price) || defaultMatch.priceVal,
        priceStr: `${p.price || defaultMatch.priceVal} USDT`,
        isFeatured: Boolean(isGold),
        ctaTextEn: defaultMatch.ctaTextEn || (isAr ? `الانضمام إلى ${p.name}` : `Join ${p.name}`),
        ctaTextAr: defaultMatch.ctaTextAr || (isGold ? 'الانضمام لمجموعة الذهب الان' : isIndices ? 'الانضمام إلى مجموعة Index' : `الانضمام إلى ${p.name}`),
        features: mappedFeatures || defaultMatch.features || [],
        btnGradient: defaultMatch.btnGradient,
        btnHoverGradient: defaultMatch.btnHoverGradient,
        btnShadow: defaultMatch.btnShadow,
        btnHoverShadow: defaultMatch.btnHoverShadow,
        btnBorder: defaultMatch.btnBorder,
        btnColor: defaultMatch.btnColor || '#FFFFFF',
        themeColor: defaultMatch.themeColor || themeColor,
      };
    });
  }, [fetchedPlans, isAr, plans]);

  return (
    <section
      style={{
        padding: '16px 0 32px',
        position: 'relative',
      }}
    >
      {/* ── 1. Section Header ── */}
      <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 36px' }}>
        <div style={{ display: 'inline-flex', marginBottom: '12px' }}>
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
            {isAr ? 'جروبات ومجموعات التحليلات المعتمدة' : 'Monthly VIP Analysis Groups'}
          </span>
        </div>

        <h2
          style={{
            fontSize: 'clamp(26px, 3.8vw, 40px)',
            fontWeight: 800,
            lineHeight: 1.25,
            margin: '0 0 12px 0',
            color: 'var(--text-primary)',
          }}
        >
          {isAr ? 'اختر مجموعة التحليلات المناسبة ' : 'Select Your Analysis '}
          <span className="text-gradient-brand">
            {isAr ? 'لتداولك اليومي' : 'Trading Group'}
          </span>
        </h2>

        <p
          style={{
            fontSize: 'clamp(14px, 1.8vw, 16px)',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.7,
          }}
        >
          {isAr
            ? 'جميع مجموعات وجروبات التحليلات تعمل بنظام الاشتراك الشهري وتمنحك وصولاً مباشراً وفورياً لشارتات MT5 الحية وإحداثيات الدخول والأهداف ونماذج السيولة الذكية.'
            : 'All analysis groups operate on a monthly recurring basis with instant access to MT5 live chart feeds, entry zones, targets, and SMC liquidity breakdowns.'}
        </p>
      </div>

      {/* ── 2. Three Dark FinTech Pricing Cards Grid (Ordered Smallest to Largest) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '24px',
          alignItems: 'stretch',
        }}
      >
        {displayPlans.map((plan) => {
          const isFeatured = plan.isFeatured;
          const themeColor = plan.themeColor || (isFeatured ? '#F59E0B' : '#0488F8');

          return (
            <div
              key={plan.id}
              style={{
                background: isFeatured ? 'var(--surface-elevated)' : 'var(--surface)',
                border: isFeatured ? '2px solid transparent' : '1px solid var(--border)',
                backgroundImage: isFeatured
                  ? 'linear-gradient(var(--surface-elevated), var(--surface-elevated)), linear-gradient(135deg, #FFB800 0%, #D97706 100%)'
                  : 'none',
                backgroundOrigin: isFeatured ? 'border-box' : 'padding-box',
                backgroundClip: isFeatured ? 'padding-box, border-box' : 'border-box',
                borderRadius: '16px',
                padding: '30px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: isFeatured
                  ? '0 16px 48px rgba(245, 158, 11, 0.22), 0 0 0 1px rgba(245, 158, 11, 0.25)'
                  : '0 8px 28px rgba(0, 3, 13, 0.45)',
              }}
              className={`pricing-fintech-card pricing-card-${plan.id}`}
            >
              {/* Header: Plan Badge & Scope */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: `${plan.badgeColor}22`,
                      border: `1px solid ${plan.badgeColor}50`,
                      color: plan.badgeColor,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: plan.badgeColor,
                        display: 'inline-block',
                        boxShadow: `0 0 6px ${plan.badgeColor}`,
                      }}
                    />
                    {isAr ? plan.badgeAr : plan.badgeEn}
                  </span>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {isAr ? 'اشتراك شهري' : 'Monthly Plan'}
                  </span>
                </div>

                {/* Plan Name */}
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: '0 0 8px 0',
                  }}
                >
                  {isAr ? plan.nameAr : plan.nameEn}
                </h3>

                {/* Plan Description */}
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    minHeight: '42px',
                    margin: '0 0 20px 0',
                  }}
                >
                  {isAr ? plan.descAr : plan.descEn}
                </p>

                {/* Price Display */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(1, 7, 30, 0.65)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginBottom: '22px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '34px',
                        fontWeight: 900,
                        color: isFeatured ? '#F59E0B' : 'var(--text-primary)',
                        fontFamily: 'monospace',
                        lineHeight: 1,
                      }}
                    >
                      {plan.priceVal}
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: themeColor,
                      }}
                    >
                      USDT
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    / {isAr ? 'شهرياً' : 'Month'}
                  </span>
                </div>

                {/* CTA Action Button */}
                <div style={{ marginBottom: '26px' }}>
                  <Link
                    href={user ? getAppRoute(`/checkout?type=package&package=${plan.id}`, user) : `/login?redirect=${encodeURIComponent(`/checkout?type=package&package=${plan.id}`)}`}
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.25s ease',
                      cursor: 'pointer',
                      background: plan.btnGradient,
                      color: plan.btnColor || '#FFFFFF',
                      border: plan.btnBorder || 'none',
                      boxShadow: plan.btnShadow || 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      if (plan.btnHoverGradient) e.currentTarget.style.background = plan.btnHoverGradient;
                      if (plan.btnHoverShadow) e.currentTarget.style.boxShadow = plan.btnHoverShadow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      if (plan.btnGradient) e.currentTarget.style.background = plan.btnGradient;
                      if (plan.btnShadow) e.currentTarget.style.boxShadow = plan.btnShadow;
                    }}
                  >
                    <FiZap size={16} />
                    <span>{isAr ? plan.ctaTextAr : plan.ctaTextEn}</span>
                  </Link>
                </div>

                {/* Checklist Title */}
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                    letterSpacing: '0.5px',
                  }}
                >
                  {isAr ? 'المميزات وصلاحيات الوصول:' : 'Features & Coverage:'}
                </div>

                {/* Feature Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {plan.features.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        fontSize: '13px',
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                          background: feat.included
                            ? 'rgba(22, 199, 132, 0.18)'
                            : 'rgba(255, 255, 255, 0.06)',
                          color: feat.included ? 'var(--success)' : 'var(--text-muted)',
                        }}
                      >
                        {feat.included ? (
                          <FiCheck size={11} strokeWidth={3} />
                        ) : (
                          <FiX size={10} strokeWidth={2.5} />
                        )}
                      </div>

                      {/* Text */}
                      <span
                        style={{
                          color: feat.included ? 'var(--text-primary)' : 'var(--text-muted)',
                          lineHeight: 1.5,
                          fontSize: '12.5px',
                        }}
                      >
                        {isAr ? feat.textAr : feat.textEn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      <style>{`
        .pricing-fintech-card {
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .pricing-card-forex:hover {
          transform: translateY(-4px);
          border-color: rgba(4, 136, 248, 0.55) !important;
          box-shadow: 0 16px 40px rgba(4, 136, 248, 0.22), 0 8px 28px rgba(0, 3, 13, 0.5) !important;
        }
        .pricing-card-indices:hover {
          transform: translateY(-4px);
          border-color: rgba(16, 185, 129, 0.55) !important;
          box-shadow: 0 16px 40px rgba(16, 185, 129, 0.22), 0 8px 28px rgba(0, 3, 13, 0.5) !important;
        }
        .pricing-card-gold:hover {
          transform: translateY(-4px);
          border-color: rgba(245, 158, 11, 0.65) !important;
          box-shadow: 0 20px 48px rgba(245, 158, 11, 0.35), 0 8px 28px rgba(0, 3, 13, 0.5) !important;
        }
      `}</style>
    </section>
  );
}
