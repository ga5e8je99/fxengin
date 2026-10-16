'use client';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import MarketOverview from '../components/MarketOverview';
import EconomicCalendar from '../components/EconomicCalendar';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';
import { FiTrendingUp, FiActivity, FiGlobe, FiLayers, FiCalendar } from 'react-icons/fi';
import Link from 'next/link';

export default function MarketsPage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* ── Markets Hero Header ── */}
      <section
        style={{
          position: 'relative',
          padding: '56px 0 44px',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(18, 49, 92, 0.35)',
        }}
      >
        <PageHeroBackground />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <Anim>
            <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ marginBottom: '14px' }}>
                <span
                  className="badge badge-orange"
                  style={{
                    fontSize: '12.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                  }}
                >
                  <FiActivity size={14} />
                  {isAr ? 'نظرة الأسواق العالمية والتقويم اللحظي' : 'Global Markets & Real-Time Pulse'}
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(28px, 4vw, 42px)',
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  lineHeight: 1.25,
                  margin: '0 0 16px 0',
                }}
              >
                {isAr ? 'بيانات الأسواق، مصفوفة الارتباط ' : 'Real-Time Market Data, Matrices & '}
                <span className="text-gradient-brand">
                  {isAr ? 'والتقويم الاقتصادي' : 'Economic Calendar'}
                </span>
              </h1>

              <p
                style={{
                  fontSize: '16px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.75,
                  margin: '0 auto 32px',
                  maxWidth: '660px',
                }}
              >
                {isAr
                  ? 'متابعة حية لقوة وضعف العملات الرئيسية، مصفوفة الارتباط اللحظية، والأجندة الاقتصادية المباشرة لمساعدتك في اقتناص أقوى الفرص.'
                  : 'Live currency strength meter, real-time correlation matrix, and economic releases to empower your trading edge.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <a href="#economic-calendar-section" className="btn-primary" style={{ textDecoration: 'none', height: '46px', padding: '0 24px', fontSize: '14px', gap: '8px' }}>
                  <FiCalendar size={16} />
                  <span>{isAr ? 'التقويم الاقتصادي اللحظي' : 'Economic Calendar'}</span>
                </a>
                <Link href={getAppRoute('/analyses', user)} className="btn-secondary" style={{ textDecoration: 'none', height: '46px', padding: '0 24px', fontSize: '14px', gap: '8px' }}>
                  <FiTrendingUp size={16} />
                  <span>{isAr ? 'تحليلات وتوصيات اليوم' : 'Daily Setups'}</span>
                </Link>
              </div>
            </div>
          </Anim>
        </div>
      </section>

      {/* ── 1. Real-Time Economic Calendar Section ── */}
      <EconomicCalendar />

      {/* ── 2. Currency Strength & Correlation Overview ── */}
      <MarketOverview />
    </div>
  );
}
