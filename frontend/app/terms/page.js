'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import {
  FiFileText,
  FiAlertTriangle,
  FiCheckCircle,
  FiShield,
  FiArrowRight,
  FiArrowLeft,
  FiPrinter,
  FiLock,
  FiUserCheck,
  FiHelpCircle,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';

export default function TermsOfServicePage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();
  const [pageData, setPageData] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    fetch('/api/pages?slug=terms')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.page) {
          setPageData(data.page);
        }
      })
      .catch((err) => console.error('Failed to load terms data:', err));
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const title = isAr
    ? pageData?.titleAr || 'الشروط والأحكام واتفاقية الاستخدام'
    : pageData?.titleEn || 'Terms of Service & User Agreement';

  const subtitle = isAr
    ? pageData?.subtitleAr || 'القواعد المنظمة لاستخدام منصة FXENGIN وحقوق الملكية الفكرية والتزامات المستخدم'
    : pageData?.subtitleEn || 'Governing Regulations, User Obligations, and Intellectual Property Protection';

  const badge = isAr
    ? pageData?.badgeAr || 'اتفاقية الاستخدام المعتمدة'
    : pageData?.badgeEn || 'Terms & Conditions Agreement';

  const lastUpdated = pageData?.lastUpdated || '2026-09-20';

  const highlights = pageData?.highlights || [
    {
      titleAr: 'حماية الملكية الفكرية الصارمة',
      titleEn: 'Strict Intellectual Property Rights',
      descAr: 'جميع المواد التدريبية، التحليلات، والشروحات مسجلة ومحمية ويحظر قطعياً نسخها أو تسجيلها أو إعادة نشرها.',
      descEn: 'All training media, charts, and strategies are protected; unauthorized recording or mirroring is strictly forbidden.',
    },
    {
      titleAr: 'الحسابات الفردية الشخصية',
      titleEn: 'Single-User Account Access',
      descAr: 'الاشتراك مخصص لمستخدم واحد فقط، ويحظر مشاركة بيانات الحساب مع أطراف أخرى تحت طائلة الإيقاف الفوري.',
      descEn: 'Subscriptions are strictly individual; sharing credentials with third parties results in instant account termination.',
    },
    {
      titleAr: 'سياسة الاشتراك والفوترة الواضحة',
      titleEn: 'Clear Billing & Cancellation Terms',
      descAr: 'شروط شفافة لرسوم الاشتراك وتجديد الخدمات وضمان استمرارية الوصول لكافة الميزات المشتراة.',
      descEn: 'Transparent terms for subscription renewal, service access, and course feature guarantees.',
    },
  ];

  const sections = pageData?.sections || [
    {
      id: 'term-1',
      number: '1',
      titleAr: 'قبول الشروط والامتثال',
      titleEn: 'Acceptance of Terms',
      contentAr: 'بمجرد إنشاء حساب أو تصفح موقع FXENGIN أو الاشتراك في أي باقة أو كورس تدريبي، فإنك تقر بأنك قرأت وفهمت ووافقت تماماً على الالتزام بكافة الشروط والأحكام الواردة هنا وسياسة الخصوصية الخاصة بالمنصة.',
      contentEn: 'By registering, browsing, or subscribing to any courses or membership packages on FXENGIN, you irrevocably acknowledge and agree to abide by all operational terms and policies established herein.',
    },
    {
      id: 'term-2',
      number: '2',
      titleAr: 'طبيعة الخدمات التعليمية والتحليلية',
      titleEn: 'Educational & Analytical Nature',
      contentAr: 'كافة المواد التعليمية، التحليلات الفنية، صفقات المتابعة، والندوات المباشرة المعروضة في FXENGIN هي لأغراض تعليمية وتدريبية بحتة. المنصة لا تقدم أي نصائح استثمارية شخصية أو إدارة أموال أو وساطة مالية، وتقع مسؤولية اتخاذ قرارات التداول على عاتق المستخدم منفرداً.',
      contentEn: 'All content, algorithmic signals, course material, and live streams are compiled strictly for academic and educational purposes. FXENGIN is not an asset manager, broker, or financial advisor. All executions remain under the user\'s sole discretion.',
    },
    {
      id: 'term-3',
      number: '3',
      titleAr: 'حقوق الملكية الفكرية وحظر النسخ',
      titleEn: 'Intellectual Property & Anti-Piracy',
      contentAr: 'جميع المقاطع المصورة، المذكرات التدريبية، التصاميم، والخوارزميات محمية بموجب قوانين حقوق النشر والملكية الفكرية الدولية. يُحظر تماماً تصوير الشاشة أو تسجيل الفيديوهات أو إعادة بيعها، ويترتب على ذلك حظر فوري للحساب مع الملاحقة القانونية.',
      contentEn: 'All curricula, visual animations, indicators, and texts represent proprietary FXENGIN intellectual property. Screen capture, video ripping, unauthorized mirroring, or illicit resale will lead to immediate account termination and legal proceedings.',
    },
    {
      id: 'term-4',
      number: '4',
      titleAr: 'سياسة الاشتراكات والمدفوعات',
      titleEn: 'Subscriptions, Billing & Refunds',
      contentAr: 'يتم دفع رسوم الدورات والاشتراكات مسبقاً عبر الطرق المعتمدة. نظراً لأن المحتوى الرقمي يتم منحه وتفعيله فورياً للمتدرب، فإن المبيعات نهائية ما لم ينص صراحة على ضمان استرداد محدد ضمن شروط الباقة.',
      contentEn: 'Course tuition and VIP fees are billed upfront. Because direct digital delivery of proprietary assets takes place immediately upon confirmation, fees are final and non-refundable unless specified otherwise in an active guarantee tier.',
    },
    {
      id: 'term-5',
      number: '5',
      titleAr: 'إيقاف الخدمة وإنهاء الحسابات',
      titleEn: 'Account Suspension & Termination',
      contentAr: 'تحتفظ إدارة FXENGIN بالحق الكامل في إيقاف أو إلغاء أي حساب ينتهك قواعد السلوك الأخلاقي، يشارك بيانات الدخول مع الغير، أو يستخدم أدوات غير قانونية لمحاولة العبث بخوادم المنصة.',
      contentEn: 'FXENGIN reserves the unilateral prerogative to restrict or terminate accounts found violating community guidelines, credential sharing prohibitions, or engaging in hostile cybersecurity exploits.',
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
          borderBottom: '1px solid rgba(18, 49, 92, 0.4)',
          textAlign: 'center',
        }}
      >
        <PageHeroBackground accentGlow="rgba(251, 135, 4, 0.16)" />
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
                  background: 'rgba(251, 135, 4, 0.12)',
                  border: '1px solid rgba(251, 135, 4, 0.35)',
                  color: 'var(--accent)',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                <FiFileText size={15} />
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
                {isAr ? 'تاريخ السريان المعتمد:' : 'Effective Date:'}{' '}
                <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{lastUpdated}</strong>
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
                <span>{isAr ? 'طباعة الاتفاقية' : 'Print Agreement'}</span>
              </button>
            </div>
          </Anim>
        </div>
      </section>

      {/* ── Key Highlights Cards ── */}
      <section style={{ marginTop: '-28px', position: 'relative', zIndex: 10, padding: '0 20px' }}>
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
                  e.currentTarget.style.borderColor = 'var(--accent)';
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
                      background: 'rgba(251, 135, 4, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent)',
                      flexShrink: 0,
                    }}
                  >
                    <FiShield size={16} />
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
                <FiFileText className="text-accent" />
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {isAr ? 'بنود اتفاقية الاستخدام' : 'Agreement Clauses'}
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
                      color: activeSection === sec.id ? 'var(--accent)' : 'var(--text-secondary)',
                      background: activeSection === sec.id ? 'rgba(251, 135, 4, 0.12)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
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
                        color: 'var(--accent)',
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

              {/* Legal Support Direct Box */}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {isAr ? 'الشؤون القانونية والعقود' : 'Legal & Contracts Office'}
                </div>
                <div>legal@fxengin.com</div>
              </div>
            </aside>

            {/* Right: Terms Articles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Important IP Warning Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 135, 4, 0.08) 0%, rgba(220, 38, 38, 0.06) 100%)',
                  border: '1px solid rgba(251, 135, 4, 0.35)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(251, 135, 4, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                    flexShrink: 0,
                  }}
                >
                  <FiAlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    {isAr ? 'تنبيه تنظيمي بشأن حسابات المستخدمين والملكية الفكرية' : 'Regulatory Notice on Intellectual Property & User Integrity'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {isAr
                      ? 'جميع المواد، الإشارات، واستراتيجيات التداول المقدمة على المنصة مسجلة ومحمية. تسجيل الجلسات أو توزيع المواد أو مشاركة الحسابات يعرض الفاعل للإيقاف الدائم والملاحقة القضائية بموجب قوانين الملكية الفكرية الدولية.'
                      : 'All instructional video streams, algorithmic strategies, and curriculum texts remain proprietary to FXENGIN. Unauthorized recording, mirroring, or account sharing is strictly prohibited under international copyright conventions.'}
                  </p>
                </div>
              </div>

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
                        background: 'rgba(251, 135, 4, 0.15)',
                        border: '1px solid rgba(251, 135, 4, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent)',
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

              {/* Questions Box */}
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
                  <FiCheckCircle className="text-primary" size={20} />
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {isAr ? 'لديك استفسار حول بنود الاتفاقية أو الاشتراكات؟' : 'Have Inquiries Regarding Terms or Billing?'}
                  </h3>
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                  {isAr
                    ? 'فريق الدعم الفني والاستشارات القانونية متاح للإجابة على استفساراتك وتوضيح كافة بنود الاستخدام.'
                    : 'Our team is available 24/7 to provide clarity on all contractual policies, rights, and responsibilities.'}
                </p>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <Link
                    href={getAppRoute('/contact', user)}
                    className="btn-accent"
                    style={{ textDecoration: 'none', fontSize: '13px', padding: '10px 22px' }}
                  >
                    <span>{isAr ? 'تواصل مع الدعم القانوني' : 'Contact Support'}</span>
                  </Link>
                  <Link
                    href={getAppRoute('/help', user)}
                    className="btn-secondary"
                    style={{ textDecoration: 'none', fontSize: '13px', padding: '10px 22px' }}
                  >
                    <span>{isAr ? 'مركز المساعدة وقاعدة المعرفة' : 'Knowledge Base'}</span>
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
