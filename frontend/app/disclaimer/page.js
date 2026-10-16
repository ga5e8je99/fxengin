'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import {
  FiAlertOctagon,
  FiTrendingDown,
  FiShield,
  FiInfo,
  FiArrowRight,
  FiArrowLeft,
  FiPrinter,
  FiFileText,
  FiAlertTriangle,
  FiCheckCircle,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';

export default function RiskDisclaimerPage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();
  const [pageData, setPageData] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    fetch('/api/pages?slug=disclaimer')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.page) {
          setPageData(data.page);
        }
      })
      .catch((err) => console.warn('Failed to load disclaimer data:', err.message));
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const title = isAr
    ? pageData?.titleAr || 'إخلاء المسؤولية والتحذير من مخاطر التداول'
    : pageData?.titleEn || 'Risk Disclaimer & Legal Regulatory Notice';

  const subtitle = isAr
    ? pageData?.subtitleAr || 'بيان قانوني وتنظيمي إلزامي حول طبيعة المحتوى التعليمي ومخاطر المشتقات والرافعة المالية في أسواق المال'
    : pageData?.subtitleEn || 'Mandatory Regulatory Disclosure Regarding High-Risk Financial Derivatives, Leverage, and Capital Exposure';

  const badge = isAr
    ? pageData?.badgeAr || 'إفصاح المخاطر التنظيمي'
    : pageData?.badgeEn || 'Risk Disclosure Notice';

  const lastUpdated = pageData?.lastUpdated || '2026-09-20';

  const highRiskWarning = isAr
    ? pageData?.highRiskWarningAr || 'تحذير عالي الأهمية بشأن الرافعة المالية: ينطوي تداول العملات الأجنبية (Forex) وعقود الفروقات (CFDs) والعملات المشفرة على درجة عالية جداً من المخاطرة برأس المال بسبب استخدام الرافعة المالية. قد لا يكون هذا النوع من الاستثمار مناسباً لجميع المستثمرين، وقد يؤدي إلى خسارة جزء كبير أو كامل رأس مالك المستثمر.'
    : pageData?.highRiskWarningEn || 'High Leverage Risk Warning: Trading Foreign Exchange (Forex), Contracts for Difference (CFDs), and digital assets involves substantial risk of loss due to leverage dynamics. These instruments may not be suitable for all investors, and rapid market fluctuations can result in losing part or all of your invested capital.';

  const highlights = pageData?.highlights || [
    {
      titleAr: 'طبيعة المحتوى التعليمي والتدريبي',
      titleEn: 'Educational Nature',
      descAr: 'كافة التحليلات والدورات والمعلومات هي لأغراض تعليمية بحتة وليست استشارة مالية أو دعوة للاستثمار.',
      descEn: 'All technical setups and courses are compiled strictly for academic enrichment and do not constitute tailored investment advice.',
    },
    {
      titleAr: 'مخاطر الرافعة المالية العالية',
      titleEn: 'High Leverage Risk',
      descAr: 'الرافعة المالية تضاعف الخسائر كما تضاعف الأرباح، ويجب استخدام أحجام صفقات مدروسة وصارمة.',
      descEn: 'Leverage can work against you as well as for you, magnifying both gains and catastrophic capital drawdowns.',
    },
    {
      titleAr: 'المسؤولية الاستثمارية الشخصية',
      titleEn: 'Personal Responsibility',
      descAr: 'القرارات التداولية والتنفيذية يتخذها المتداول بمحض إرادته وتحت مسؤوليته المالية الكاملة.',
      descEn: 'Clients maintain exclusive discretion and individual liability for all trade positioning and execution outcomes.',
    },
  ];

  const sections = pageData?.sections || [
    {
      id: 'disc-1',
      number: '1',
      titleAr: 'المحتوى التعليمي والتحليلي العام',
      titleEn: 'Educational Content & Market Insights',
      contentAr: 'جميع التحليلات والرسوم البيانية والإشارات الفنية والندوات المباشرة المعروضة على منصة FXENGIN تُقدم لغرض التدريب ومشاركة وجهات نظر المحللين الفنية فقط. لا تشكل هذه المعلومات بأي حال من الأحوال توصية مباشرة أو دعوة لشراء أو بيع أي أداة مالية أو عقد استثماري.',
      contentEn: 'All technical charts, algorithmic models, setup ideas, and video commentaries disseminated on FXENGIN are compiled strictly for academic enrichment. None of the disseminated materials constitute individualized investment advice or a solicitation to execute financial positions.',
    },
    {
      id: 'disc-2',
      number: '2',
      titleAr: 'الأداء السابق لا يضمن النتائج المستقبلية',
      titleEn: 'Past Performance Disclaimer',
      contentAr: 'أي نتائج سابقة معلنة لصفقات أو مؤشرات أو نسب نجاح (Win Rate) تمثل تحليلات تاريخية لا تضمن بأي شكل من الأشكال تكرارها مستقبلاً. أسواق المال تخضع لتقلبات جيوسياسية واقتصادية غير متوقعة تؤثر على تدفق السيولة والأسعار.',
      contentEn: 'Hypothetical or historical trade tracking and win rates do not signify or guarantee future trading performance. Currency and index markets are continually shaped by unforeseen macroeconomic shifts and sovereign policy announcements.',
    },
    {
      id: 'disc-3',
      number: '3',
      titleAr: 'المسؤولية الفردية للمتداول',
      titleEn: 'Individual Financial Accountability',
      contentAr: 'يتحمل المتداول منفرداً كامل المسؤولية المالية والقانونية المترتبة على قراراته التداولية. تخلي منصة FXENGIN وإدارتها ومحللوها أي مسؤولية مباشرة أو غير مباشرة عن أي خسائر أو أضرار مالية قد تلحق بالمستخدم جراء اعتماده على محتويات المنصة.',
      contentEn: 'Every client assumes full financial and legal responsibility for their market engagements. FXENGIN, its directors, developers, and analysts decline all liability for direct or consequential capital losses stemming from reliance on platform materials.',
    },
    {
      id: 'disc-4',
      number: '4',
      titleAr: 'المخاطر التقنية وزمن الاستجابة',
      titleEn: 'Technological & Latency Risks',
      contentAr: 'تعتمد أدوات التداول اللحظية على شبكات الإنترنت وخوادم الربط. لا تضمن المنصة انعدام الأعطال التقنية الخارجة عن إرادتها أو تأخر وصول التنبيهات نتيجة ضعف الاتصال لدى المستخدم أو مزودي خدمة الطرف الثالث.',
      contentEn: 'Digital execution feeds depend on global telecom links. FXENGIN cannot warrant against network latency, packet loss, or internet disruptions originating on local end-user devices or third-party cloud infrastructure.',
    },
    {
      id: 'disc-5',
      number: '5',
      titleAr: 'الامتثال للقوانين والأنظمة المحلية',
      titleEn: 'Jurisdictional Regulatory Compliance',
      contentAr: 'يقع على عاتق المستخدم واجب التأكد من أن استخدام خدمات المنصة وتداول عقود الفروقات والعملات لا يتعارض مع القوانين والأنظمة واللوائح المالية السارية في بلده أو محل إقامته القانونية.',
      contentEn: 'Users are personally responsible for verifying that their engagement with financial learning and CFD analysis conforms to the statutory guidelines and financial regulations of their respective domicile or citizenship.',
    },
  ];

  return (
    <div style={{ background: 'var(--bg-primary)', paddingBottom: '2.5rem' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Hero Section ── */}
      <section
        style={{
          position: 'relative',
          padding: '70px 20px 50px',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
          textAlign: 'center',
        }}
      >
        <PageHeroBackground accentGlow="rgba(239, 68, 68, 0.16)" />
        <div className="container" style={{ maxWidth: '860px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Anim>
            <div style={{ marginBottom: '16px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 18px',
                  borderRadius: '9999px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                <FiAlertOctagon size={15} />
                <span>{badge}</span>
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(30px, 5vw, 46px)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1.25,
                margin: '0 0 16px',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontSize: '16.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                margin: '0 auto 20px',
                maxWidth: '720px',
              }}
            >
              {subtitle}
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '12.5px',
                color: 'var(--text-muted)',
              }}
            >
              <span>
                {isAr ? 'بيان تنظيمي معتمد:' : 'Regulatory Status:'}{' '}
                <strong style={{ color: '#EF4444', fontFamily: 'monospace' }}>{lastUpdated}</strong>
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <FiPrinter size={14} />
                <span>{isAr ? 'طباعة الإفصاح' : 'Print Disclaimer'}</span>
              </button>
            </div>
          </Anim>
        </div>
      </section>

      {/* ── High Risk Regulatory Warning Banner ── */}
      <section style={{ marginTop: '-28px', position: 'relative', zIndex: 10, padding: '0 20px' }}>
        <div className="container" style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.08) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '18px',
              padding: '28px',
              boxShadow: '0 16px 36px rgba(0, 3, 13, 0.65)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '18px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                flexShrink: 0,
              }}
            >
              <FiTrendingDown size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#FCA5A5', margin: '0 0 8px' }}>
                {isAr ? 'تحذير عالي الأهمية بشأن الرافعة المالية والمشتقات' : 'Crucial Warning Concerning Leverage & Derivatives'}
              </h2>
              <p style={{ fontSize: '14px', color: '#FEE2E2', lineHeight: 1.7, margin: 0, opacity: 0.95 }}>
                {highRiskWarning}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Highlights Cards ── */}
      <section style={{ padding: '28px 20px 0' }}>
        <div className="container" style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {highlights.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 12px 30px rgba(0, 3, 13, 0.55)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#EF4444';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#EF4444',
                      flexShrink: 0,
                    }}
                  >
                    <FiAlertTriangle size={16} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {isAr ? item.titleAr : item.titleEn}
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {isAr ? item.descAr : item.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Body with Navigation Index ── */}
      <section style={{ padding: '48px 20px 0' }}>
        <div className="container" style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '280px 1fr',
              gap: '36px',
            }}
            className="privacy-layout-grid"
          >
            {/* Left/Sidebar: Table of Contents */}
            <aside
              style={{
                position: 'sticky',
                top: 'calc(var(--top-bars-height, 9.5rem) + 1.25rem)',
                height: 'fit-content',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '18px',
                padding: '24px 20px',
                boxShadow: '0 12px 30px rgba(0, 3, 13, 0.4)',
                textAlign: isAr ? 'right' : 'left',
              }}
              className="hide-mobile"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FiFileText style={{ color: '#EF4444' }} />
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {isAr ? 'بنود إفصاح المخاطر' : 'Risk Articles Index'}
                </h4>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={() => setActiveSection(sec.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: activeSection === sec.id ? '#EF4444' : 'var(--text-secondary)',
                      background: activeSection === sec.id ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      textAlign: isAr ? 'right' : 'left',
                    }}
                  >
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: '#EF4444',
                      }}
                    >
                      {sec.number}
                    </span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isAr ? sec.titleAr : sec.titleEn}
                    </span>
                  </a>
                ))}
              </nav>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(18, 49, 92, 0.4)', margin: '20px 0' }} />

              {/* Regulatory Direct Box */}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, textAlign: isAr ? 'right' : 'left' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {isAr ? 'الامتثال التنظيمي' : 'Regulatory Compliance'}
                </div>
                <div>compliance@fxengin.com</div>
              </div>
            </aside>

            {/* Right: Disclaimer Articles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Sections List */}
              {sections.map((sec) => (
                <article
                  key={sec.id}
                  id={sec.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '18px',
                    padding: '30px',
                    boxShadow: '0 10px 30px rgba(0, 3, 13, 0.4)',
                    scrollMarginTop: 'calc(var(--top-bars-height, 9.5rem) + 1.5rem)',
                    textAlign: isAr ? 'right' : 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#EF4444',
                        fontWeight: 900,
                        fontSize: '14px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {sec.number}
                    </span>
                    <h2 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? sec.titleAr : sec.titleEn}
                    </h2>
                  </div>

                  <p
                    style={{
                      fontSize: '14.5px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.8,
                      margin: 0,
                      textAlign: isAr ? 'right' : 'left',
                    }}
                  >
                    {isAr ? sec.contentAr : sec.contentEn}
                  </p>
                </article>
              ))}

              {/* Responsible Trading Checklist */}
              <div
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid rgba(18, 49, 92, 0.5)',
                  borderRadius: '18px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  marginTop: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiShield className="text-primary" size={20} />
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textAlign: isAr ? 'right' : 'left' }}>
                    {isAr ? 'إرشادات التداول المسؤول وحماية رأس المال' : 'Responsible Trading Guidelines & Checklist'}
                  </h3>
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, textAlign: isAr ? 'right' : 'left' }}>
                  {isAr
                    ? 'نحث جميع المتداولين على عدم المخاطرة بأموال لا يمكنهم تحمل خسارتها، واستخدام أوامر وقف الخسارة (Stop Loss) الصارمة في كل صفقة تنفيذية.'
                    : 'We strongly advise all market participants never to risk risk-capital they cannot afford to lose and strictly deploy Stop-Loss parameters on all live positions.'}
                </p>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <Link
                    href={getAppRoute('/courses', user)}
                    className="btn-accent"
                    style={{ textDecoration: 'none', fontSize: '13px', padding: '10px 22px' }}
                  >
                    <span>{isAr ? 'كورس إدارة المخاطر المؤسسية' : 'Risk Management Course'}</span>
                  </Link>
                  <Link
                    href={getAppRoute('/contact', user)}
                    className="btn-secondary"
                    style={{ textDecoration: 'none', fontSize: '13px', padding: '10px 22px' }}
                  >
                    <span>{isAr ? 'تواصل مع فريق الدعم' : 'Contact Support'}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer Navigation Quick Actions ── */}
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <Link
          href={getAppRoute('/', user)}
          className="btn-secondary"
          style={{ textDecoration: 'none', fontSize: '13.5px', padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          {isAr ? <FiArrowRight /> : <FiArrowLeft />}
          <span>{isAr ? 'العودة للصفحة الرئيسية' : 'Return to Home'}</span>
        </Link>
      </div>
    </div>
  );
}
