'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import {
  FiBriefcase,
  FiTrendingUp,
  FiDollarSign,
  FiCheckCircle,
  FiArrowLeft,
  FiArrowRight,
  FiPieChart,
  FiAward,
  FiShare2,
  FiZap,
  FiHelpCircle,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';

export default function PartnersPage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    fetch('/api/pages?slug=partners')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.page) {
          setPageData(data.page);
        }
      })
      .catch((err) => console.warn('Failed to load partners data:', err.message));
  }, []);

  const ArrowIcon = isAr ? FiArrowLeft : FiArrowRight;

  const title = isAr
    ? pageData?.titleAr || 'برنامج الشركاء والوسطاء المعرفين (IB)'
    : pageData?.titleEn || 'Partners & Introducing Brokers (IB) Program';

  const subtitle = isAr
    ? pageData?.subtitleAr || 'انضم إلى أقوى برنامج شراكة استراتيجي في الشرق الأوسط واحصل على أعلى عمولات وعوائد مستدامة'
    : pageData?.subtitleEn || 'Join the Middle East’s Most Lucrative Partnership Network with Tier-1 Rebates and Institutional Infrastructure';

  const commissionHighlight = isAr
    ? pageData?.commissionHighlightAr || 'خصومات وعمولات تصل إلى 70% من السبريد وحصص أرباح شهرية مستدامة'
    : pageData?.commissionHighlightEn || 'Up to 70% Spread Rebates & Sustainable Monthly Revenue Sharing';

  const tiers = pageData?.tiers || [
    {
      nameAr: 'شريك معتمد (Affiliate Partner)',
      nameEn: 'Affiliate Partner',
      rebateAr: 'حتى 40% عمولة مباشرة',
      rebateEn: 'Up to 40% Direct Commission',
      descAr: 'مثالي لأصحاب المواقع وصناع المحتوى وقنوات التيليجرام المهتمة بأسواق المال.',
      descEn: 'Perfect for financial creators, webmasters, and social trading communities.',
    },
    {
      nameAr: 'وسيط معرّف محترف (Pro IB)',
      nameEn: 'Pro Introducing Broker',
      rebateAr: 'حتى 60% ريبيت مباشر + حوافز VIP',
      rebateEn: 'Up to 60% Direct Rebates + VIP Incentives',
      descAr: 'للمتداولين أصحاب المجتمعات التداولية النشطة ومديري المجموعات الخاصة.',
      descEn: 'For active trading mentors, community leaders, and signal providers.',
    },
    {
      nameAr: 'شريك استراتيجي / White Label',
      nameEn: 'Strategic & Institutional Partner',
      rebateAr: 'تخصيص كامل حتى 75% + واجهات برمجة API',
      rebateEn: 'Fully Customized Up to 75% + API Access',
      descAr: 'للأكاديميات والشركات المالية التي ترغب في دمج حلول وتحليلات FXENGIN المتطورة.',
      descEn: 'For trading academies and financial firms integrating FXENGIN solutions.',
    },
  ];

  const benefits = pageData?.benefits || [
    {
      titleAr: 'دفعات أسبوعية فورية وموثوقة',
      titleEn: 'Automated Weekly Payouts',
      descAr: 'سحب فوري لأرباحك وعمولاتك عبر USDT أو التحويل البنكي دون أي تأخير أو حد أدنى معقد.',
      descEn: 'Instant withdrawal of earnings via USDT or Swift transfer with zero friction.',
      icon: FiDollarSign,
    },
    {
      titleAr: 'لوحة تحكم وتحليلات متقدمة',
      titleEn: 'Advanced Partner Dashboard',
      descAr: 'تتبع دقيق في الوقت الفعلي لنشاط العملاء المسجلين، أحجام التداول باللوت، ونسب التحويل.',
      descEn: 'Real-time tracking of signups, traded volumes (lots), and conversion analytics.',
      icon: FiPieChart,
    },
    {
      titleAr: 'مواد تسويقية ورعايات حصرية',
      titleEn: 'Exclusive Marketing Kits',
      descAr: 'بانرات جاهزة، صفحات هبوط مخصصة باسمك، وكوبونات خصم حصرية لعملائك لزيادة التحويل.',
      descEn: 'High-converting banners, custom co-branded landing pages, and coupon codes.',
      icon: FiShare2,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '5rem' }}>
      {/* ── Hero Section ────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          padding: '6rem 1.5rem 4.5rem',
          borderBottom: '1px solid rgba(18, 49, 92, 0.35)',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        <PageHeroBackground accentGlow="rgba(251, 135, 4, 0.18)" />
        <div className="container" style={{ maxWidth: '52rem', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Anim effect="fade-up">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 1rem',
                borderRadius: '9999px',
                background: 'rgba(251, 135, 4, 0.12)',
                border: '1px solid rgba(251, 135, 4, 0.3)',
                color: 'var(--accent)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
              }}
            >
              <FiBriefcase size={14} />
              <span>{isAr ? pageData?.badgeAr || 'برنامج الشراكة المؤسسي' : pageData?.badgeEn || 'Institutional Alliances'}</span>
            </span>

            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                marginBottom: '1.25rem',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.1875rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                maxWidth: '44rem',
                margin: '0 auto 1.5rem',
              }}
            >
              {subtitle}
            </p>

            <div
              style={{
                display: 'inline-block',
                padding: '0.625rem 1.25rem',
                background: 'rgba(0, 230, 118, 0.12)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                borderRadius: '0.75rem',
                color: '#00E676',
                fontWeight: 800,
                fontSize: '0.9375rem',
                marginBottom: '2.5rem',
              }}
            >
              {commissionHighlight}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <Link
                href={getAppRoute('/contact', user)}
                className="btn-primary"
                style={{ fontSize: '0.9375rem', padding: '0.75rem 1.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>{isAr ? 'قدم طلب الانضمام كشريك' : 'Apply for Partnership'}</span>
                <ArrowIcon size={16} />
              </Link>
              <Link
                href="/brokers/portal/login"
                style={{
                  fontSize: '0.9375rem',
                  padding: '0.75rem 1.5rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(251, 135, 4, 0.2) 0%, rgba(251, 135, 4, 0.1) 100%)',
                  border: '1.5px solid #FB8704',
                  color: '#FB8704',
                  fontWeight: 800,
                  boxShadow: '0 4px 20px rgba(251, 135, 4, 0.2)',
                }}
              >
                <FiBriefcase size={16} />
                <span>{isAr ? 'بوابة الوسطاء والشركاء (تسجيل دخول)' : 'Partner Broker Portal Login'}</span>
              </Link>
              <a
                href="mailto:partners@fxengin.com"
                className="btn-secondary"
                style={{ fontSize: '0.9375rem', padding: '0.75rem 1.5rem', textDecoration: 'none' }}
              >
                <span>partners@fxengin.com</span>
              </a>
            </div>

            {/* Contracted Broker Portal Banner */}
            <div
              style={{
                maxWidth: '44rem',
                margin: '0 auto',
                padding: '1rem 1.5rem',
                borderRadius: '1rem',
                background: 'linear-gradient(90deg, rgba(6, 20, 47, 0.9) 0%, rgba(10, 30, 63, 0.9) 100%)',
                border: '1px solid rgba(4, 136, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                textAlign: isAr ? 'right' : 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '0.5rem',
                    background: 'rgba(4, 136, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0488F8',
                    flexShrink: 0,
                  }}
                >
                  <FiZap size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#FFFFFF' }}>
                    {isAr ? 'للوسطاء وشركاء التداول المتعاقدين مع FXENGIN' : 'For Official Contracted Partner Brokers'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {isAr
                      ? 'إدارة عقود الإعلانات، العروض الترويجية، وطلب تنظيم الإيفينتات والمؤتمرات'
                      : 'Manage ad packages, launch offers, and book sponsored summit events'}
                  </div>
                </div>
              </div>

              <Link
                href="/brokers/portal/login"
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  padding: '0.5rem 1.15rem',
                  borderRadius: '0.5rem',
                  background: 'linear-gradient(135deg, #0488F8 0%, #0056B3 100%)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {isAr ? 'دخول لوحة تحكم الوسيط' : 'Enter Broker Portal'}
              </Link>
            </div>
          </Anim>
        </div>
      </section>

      {/* ── Partner Tiers ───────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '68rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isAr ? 'مستويات الشراكة' : 'Partnership Tiers'}
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
              {isAr ? 'اختر النموذج الذي يناسب حجم نشاطك' : 'Choose The Model That Fits Your Audience'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {tiers.map((tier, idx) => (
              <Anim key={idx} effect="fade-up" delay={idx * 100}>
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(6, 20, 47, 0.85) 0%, rgba(4, 15, 36, 0.85) 100%)',
                    border: idx === 1 ? '1.5px solid var(--accent)' : '1px solid rgba(18, 49, 92, 0.6)',
                    borderRadius: '1.5rem',
                    padding: '2.5rem 2rem',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    boxShadow: idx === 1 ? '0 12px 36px rgba(251, 135, 4, 0.15)' : 'none',
                  }}
                >
                  {idx === 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-0.75rem',
                        insetInlineEnd: '1.5rem',
                        background: 'var(--accent-gradient)',
                        color: '#FFFFFF',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {isAr ? 'الأكثر طلباً' : 'Most Popular'}
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                      {isAr ? tier.nameAr : tier.nameEn}
                    </h3>

                    <div
                      style={{
                        fontSize: '1.375rem',
                        fontWeight: 900,
                        color: idx === 1 ? 'var(--accent)' : 'var(--primary)',
                        marginBottom: '1rem',
                        fontFamily: "'Montserrat', sans-serif",
                      }}
                    >
                      {isAr ? tier.rebateAr : tier.rebateEn}
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '2rem' }}>
                      {isAr ? tier.descAr : tier.descEn}
                    </p>
                  </div>

                  <Link
                    href={getAppRoute('/contact', user)}
                    className={idx === 1 ? 'btn-primary' : 'btn-secondary'}
                    style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', fontSize: '0.875rem' }}
                  >
                    <span>{isAr ? 'طلب التفعيل' : 'Get Started'}</span>
                  </Link>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Partner With FXENGIN ───────────────────────────── */}
      <section style={{ padding: '0 1.5rem 5rem' }}>
        <div className="container" style={{ maxWidth: '68rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isAr ? 'مزايا فريدة' : 'Exclusive Advantages'}
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
              {isAr ? 'لماذا يختار المحترفون شراكة FXENGIN؟' : 'Why Leading Mentors Choose FXENGIN'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
            {benefits.map((b, idx) => {
              const Icon = b.icon || FiZap;
              return (
                <Anim key={idx} effect="fade-up" delay={idx * 100}>
                  <div
                    style={{
                      background: 'rgba(6, 20, 47, 0.65)',
                      border: '1px solid rgba(18, 49, 92, 0.5)',
                      borderRadius: '1.25rem',
                      padding: '2rem 1.75rem',
                      height: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(251, 135, 4, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent)',
                        marginBottom: '1.25rem',
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.1875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                      {isAr ? b.titleAr : b.titleEn}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>
                      {isAr ? b.descAr : b.descEn}
                    </p>
                  </div>
                </Anim>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
