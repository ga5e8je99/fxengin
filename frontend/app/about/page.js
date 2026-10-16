'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import {
  FiAward,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiCheckCircle,
  FiArrowLeft,
  FiArrowRight,
  FiTarget,
  FiEye,
  FiCompass,
  FiActivity,
  FiZap,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';

export default function AboutPage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    fetch('/api/pages?slug=about')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.page) {
          setPageData(data.page);
        }
      })
      .catch((err) => console.error('Failed to load about page data:', err));
  }, []);

  const ArrowIcon = isAr ? FiArrowLeft : FiArrowRight;

  const title = isAr
    ? pageData?.titleAr || 'عن منصة FXENGIN'
    : pageData?.titleEn || 'About FXENGIN Platform';

  const subtitle = isAr
    ? pageData?.subtitleAr || 'المنظومة المالية المتكاملة للتعليم والتداول الاحترافي وتقنيات تحليل الأسواق الذكية'
    : pageData?.subtitleEn || 'The Integrated Ecosystem for Professional Trading, Market Intelligence, and Quantitative Education';

  const stats = pageData?.stats || [
    { labelAr: 'متداول نشط في المجتمع', labelEn: 'Active Community Traders', value: '+25,000' },
    { labelAr: 'نسبة دقة إشارات SMC', labelEn: 'SMC Signal Precision', value: '88.4%' },
    { labelAr: 'ساعة تدريبية معتمدة', labelEn: 'Accredited Training Hours', value: '+450' },
    { labelAr: 'دولة يدعمها النظام', labelEn: 'Global Countries Supported', value: '42' },
  ];

  const mission = isAr
    ? pageData?.missionAr || 'تمكين المتداولين العرب والمستثمرين من الوصول إلى أحدث أدوات التحليل المؤسسي وهياكل السيولة (Smart Money Concepts)، وتوفير بيئة تعليمية احترافية خالية من العشوائية، تدعم المتداول في رحلته من المبتدئ إلى الاحتراف وإدارة المحافظ.'
    : pageData?.missionEn || 'Empowering traders and investors with institutional-grade liquidity frameworks (Smart Money Concepts) and professional education, eliminating guesswork to guide market participants from beginners to elite funded portfolio managers.';

  const vision = isAr
    ? pageData?.visionAr || 'أن نكون المحطة المرجعية الأولى في الشرق الأوسط وشمال أفريقيا في هندسة استراتيجيات التداول الخوارزمي والتحليل المؤسسي، عبر بنية تحتية تقنية فائقة السرعة ومجتمع معرفي رائد.'
    : pageData?.visionEn || 'To stand as the premier MENA authority in algorithmic trading engineering and institutional market analytics, backed by ultra-low-latency infrastructure and a world-class knowledge community.';

  const values = pageData?.values || [
    {
      titleAr: 'الشفافية المطلقة والنزاهة',
      titleEn: 'Absolute Transparency',
      descAr: 'نوثق جميع التحليلات والإشارات بدقة ونقدم تقارير أداء حقيقية بلا وعود زائفة أو مضاربات وهمية.',
      descEn: 'We audit and record all analyses and signals with zero false promises or unrealistic claims.',
      icon: FiEye,
    },
    {
      titleAr: 'التعليم المؤسسي المستند للأدلة',
      titleEn: 'Institutional Evidence-Based Learning',
      descAr: 'مناهجنا مبنية على تدفق أوامر البنوك وصناع السوق ومفاهيم السيولة الفعلية وليس المؤشرات المتأخرة.',
      descEn: 'Curriculums engineered around order flow, liquidity pools, and interbank dynamics.',
      icon: FiAward,
    },
    {
      titleAr: 'الأمان وحماية رأس المال',
      titleEn: 'Capital Protection & Risk Control',
      descAr: 'نضع إدارة المخاطر وقواعد الحفاظ على الحساب قبل أي اعتبارات ربحية لضمان استدامة المتداول.',
      descEn: 'Strict risk parameters and drawdown management prioritized above all short-term returns.',
      icon: FiShield,
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
        <PageHeroBackground />
        <div className="container" style={{ maxWidth: '52rem', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Anim effect="fade-up">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 1rem',
                borderRadius: '9999px',
                background: 'rgba(4, 136, 248, 0.12)',
                border: '1px solid rgba(4, 136, 248, 0.3)',
                color: 'var(--primary)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
              }}
            >
              <FiCompass size={14} />
              <span>{isAr ? pageData?.badgeAr || 'نبذة عن المنصة' : pageData?.badgeEn || 'Platform Overview'}</span>
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
                margin: '0 auto 2.5rem',
              }}
            >
              {subtitle}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                href={getAppRoute('/courses', user)}
                className="btn-primary"
                style={{ fontSize: '0.9375rem', padding: '0.75rem 1.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>{isAr ? 'استكشف مسارات التدريب' : 'Explore Courses'}</span>
                <ArrowIcon size={16} />
              </Link>
              <Link
                href={getAppRoute('/contact', user)}
                className="btn-secondary"
                style={{ fontSize: '0.9375rem', padding: '0.75rem 1.5rem', textDecoration: 'none' }}
              >
                <span>{isAr ? 'تواصل مع الإدارة' : 'Contact Leadership'}</span>
              </Link>
            </div>
          </Anim>
        </div>
      </section>

      {/* ── Key Metrics Section ─────────────────────────────────── */}
      <section style={{ padding: '3.5rem 1.5rem', borderBottom: '1px solid rgba(18, 49, 92, 0.3)' }}>
        <div className="container" style={{ maxWidth: '68rem', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {stats.map((s, idx) => (
              <Anim key={idx} effect="fade-up" delay={idx * 80}>
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(6, 20, 47, 0.7) 0%, rgba(4, 15, 36, 0.7) 100%)',
                    border: '1px solid rgba(4, 136, 248, 0.2)',
                    borderRadius: '1.25rem',
                    padding: '1.75rem 1.5rem',
                    textAlign: 'center',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '2.5rem',
                      fontWeight: 900,
                      background: 'var(--accent-gradient)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontFamily: "'Montserrat', sans-serif",
                      lineHeight: 1.1,
                      marginBottom: '0.5rem',
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {isAr ? s.labelAr : s.labelEn}
                  </div>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '68rem', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Mission */}
            <Anim effect="fade-up">
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(6, 20, 47, 0.85) 0%, rgba(4, 15, 36, 0.85) 100%)',
                  border: '1px solid rgba(4, 136, 248, 0.25)',
                  borderRadius: '1.5rem',
                  padding: '2.5rem 2rem',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '3.25rem',
                    height: '3.25rem',
                    borderRadius: '1rem',
                    background: 'rgba(4, 136, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <FiTarget size={26} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isAr ? 'رسالتنا المؤسسية' : 'Our Mission'}
                </h2>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                  {mission}
                </p>
              </div>
            </Anim>

            {/* Vision */}
            <Anim effect="fade-up" delay={120}>
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(6, 20, 47, 0.85) 0%, rgba(4, 15, 36, 0.85) 100%)',
                  border: '1px solid rgba(251, 135, 4, 0.25)',
                  borderRadius: '1.5rem',
                  padding: '2.5rem 2rem',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '3.25rem',
                    height: '3.25rem',
                    borderRadius: '1rem',
                    background: 'rgba(251, 135, 4, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                  }}
                >
                  <FiActivity size={26} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isAr ? 'رؤيتنا المستقبلية' : 'Our Vision'}
                </h2>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                  {vision}
                </p>
              </div>
            </Anim>
          </div>
        </div>
      </section>

      {/* ── Core Values ─────────────────────────────────────────── */}
      <section style={{ padding: '0 1.5rem 5rem' }}>
        <div className="container" style={{ maxWidth: '68rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isAr ? 'المبادئ التوجيهية' : 'Guiding Principles'}
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
              {isAr ? 'القيم الأساسية التي تقود كل قرار نتخذه' : 'Core Values Driving Every Decision'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
            {values.map((v, idx) => {
              const Icon = v.icon || FiZap;
              return (
                <Anim key={idx} effect="fade-up" delay={idx * 100}>
                  <div
                    style={{
                      background: 'rgba(6, 20, 47, 0.65)',
                      border: '1px solid rgba(18, 49, 92, 0.5)',
                      borderRadius: '1.25rem',
                      padding: '2rem 1.75rem',
                      height: '100%',
                      transition: 'all 0.25s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(18, 49, 92, 0.5)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div
                      style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(4, 136, 248, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        marginBottom: '1.25rem',
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.1875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                      {isAr ? v.titleAr : v.titleEn}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>
                      {isAr ? v.descAr : v.descEn}
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
