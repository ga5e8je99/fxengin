'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FiShield,
  FiAward,
  FiExternalLink,
  FiCheckCircle,
  FiDollarSign,
  FiZap,
  FiArrowRight,
  FiArrowLeft,
  FiGlobe,
  FiTrendingUp,
  FiLayers,
  FiCpu,
  FiHelpCircle,
  FiInfo,
  FiCopy,
  FiCheck,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import { getAppRoute } from '../utils/routes';
import DEFAULT_BROKERS from '../../data/brokers.json';

export default function OpenAccountPage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();

  // Active filter tab: 'all' | 'forex' | 'prop'
  const [filter, setFilter] = useState('all');
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  const [selectedBrokerModal, setSelectedBrokerModal] = useState(null);
  const [brokersList, setBrokersList] = useState(DEFAULT_BROKERS);

  const normalizeBrokerData = (b) => {
    if (!b) return null;
    const specs = Array.isArray(b.specs)
      ? b.specs
      : (Array.isArray(b.specsData) ? b.specsData : []);

    return {
      ...b,
      id: b.id || b.brokerSlug,
      name: b.name || 'Broker',
      category: b.category || 'forex',
      badgeAr: b.badgeAr || b.categoryLabelAr || 'وسيط معتمد وموثوق',
      badgeEn: b.badgeEn || b.categoryLabelEn || 'Verified Official Partner',
      badgeColor: b.badgeColor || '#0488F8',
      logo: b.logo || b.logoUrl || '/assets/Images/brokers/xm.webp',
      logoBg: b.logoBg || '#000000',
      rating: b.rating ?? 4.9,
      clientsCount: b.clientsCount || b.tradersCount || '100K+ متداول',
      clientsCountEn: b.clientsCountEn || b.tradersCountEn || '100K+ Traders',
      accentColor: b.accentColor || '#0488F8',
      glowBorder: b.glowBorder || 'rgba(4, 136, 248, 0.25)',
      descriptionAr: b.descriptionAr || b.descAr || '',
      descriptionEn: b.descriptionEn || b.descEn || '',
      specs,
      specsData: specs,
      fxenginPerksAr: b.fxenginPerksAr || b.perksAr || '',
      fxenginPerksEn: b.fxenginPerksEn || b.perksEn || '',
      featuresAr: Array.isArray(b.featuresAr) ? b.featuresAr : [],
      featuresEn: Array.isArray(b.featuresEn) ? b.featuresEn : [],
      liveUrl: b.liveUrl || '#',
      demoUrl: b.demoUrl || '#',
    };
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/brokers?activeOnly=true')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const rawList = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : null);
        if (isMounted && rawList && rawList.length > 0) {
          setBrokersList(rawList.map(normalizeBrokerData).filter(Boolean));
        }
      })
      .catch((err) => console.warn('Failed to load dynamic brokers, using fallback:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2200);
  };

  const filteredBrokers = filter === 'all' ? brokersList : brokersList.filter((b) => b.category === filter);

  return (
    <div
      style={{
        background: 'var(--bg-dark)',
        color: 'var(--text-primary)',
        minHeight: '100vh',
        paddingBottom: '80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ══════════════ 1. HEADER HERO SECTION ══════════════ */}
      <section
        style={{
          position: 'relative',
          padding: '56px 0 44px',
          borderBottom: '1px solid rgba(18, 49, 92, 0.35)',
          marginBottom: '36px',
          overflow: 'hidden',
        }}
      >
        <PageHeroBackground />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
            <Anim>
              <div style={{ display: 'inline-flex', marginBottom: '14px' }}>
              <span
                style={{
                  background: 'rgba(4, 136, 248, 0.12)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(4, 136, 248, 0.3)',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '6px 14px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  letterSpacing: '0.4px',
                }}
              >
                <FiShield size={14} color="var(--accent)" />
                {isAr ? 'شركاء التداول الرسميون المعتمدون لـ FXENGIN' : 'FXENGIN Verified Official Trading Partners'}
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 900,
                lineHeight: 1.25,
                margin: '0 0 16px 0',
                color: 'var(--text-primary)',
              }}
            >
              {isAr ? 'افتح حساب تداولك مع ' : 'Open Your Trading Account with '}
              <span className="text-gradient-brand">
                {isAr ? 'أقوى الوسطاء الموثوقين' : 'Top Regulated Brokers'}
              </span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(14px, 1.6vw, 16px)',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                margin: '0 auto 28px',
              }}
            >
              {isAr
                ? 'اختر الوسيط أو شركة التمويل الأنسب لخطتك الاستثمارية. احصل على أفضل شروط تداول، سبريد خام 0.0، وسحب فوري، بالإضافة إلى مزايا وعروض كاش باك حصرية عند فتح حسابك من خلال روابط شراكة FXENGIN.'
                : 'Select the broker or prop firm best aligned with your strategy. Enjoy ultra-tight spreads, instant withdrawals, and exclusive VIP access when you open via FXENGIN partnership links.'}
            </p>

            {/* Filter Tabs */}
            <div className="broker-filters-container">
              <div className="broker-filters-pill">
              <button
                onClick={() => setFilter('all')}
                style={{
                  background: filter === 'all' ? 'var(--accent-gradient)' : 'transparent',
                  color: filter === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {isAr ? `جميع الشركاء (${brokersList.length})` : `All Partners (${brokersList.length})`}
              </button>

              <button
                onClick={() => setFilter('forex')}
                style={{
                  background: filter === 'forex' ? 'var(--accent-gradient)' : 'transparent',
                  color: filter === 'forex' ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {isAr
                  ? `وسطاء الفوركس والسلع (${brokersList.filter((b) => b.category === 'forex').length})`
                  : `Forex & CFD Brokers (${brokersList.filter((b) => b.category === 'forex').length})`}
              </button>

              <button
                onClick={() => setFilter('prop')}
                style={{
                  background: filter === 'prop' ? 'var(--accent-gradient)' : 'transparent',
                  color: filter === 'prop' ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {isAr
                  ? `شركات التمويل Prop Firms (${brokersList.filter((b) => b.category === 'prop').length})`
                  : `Prop Trading Firms (${brokersList.filter((b) => b.category === 'prop').length})`}
              </button>
            </div>
          </div>
        </Anim>
        </div>
      </div>
    </section>

    {/* Background Ambient Glows */}
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: '400px',
        left: '-150px',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }}
    />
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: '700px',
        right: '-150px',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(0, 240, 255, 0.07) 0%, transparent 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
      }}
    />

    <div className="container" style={{ position: 'relative', zIndex: 1 }}>
      {/* ══════════════ 2. BROKER CARDS GRID ══════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '64px' }}>
          {filteredBrokers.map((broker, idx) => (
            <Anim key={broker.id} delay={idx * 0.12}>
              <div
                className="broker-card"
                style={{
                  background: 'var(--surface-elevated)',
                  borderRadius: '22px',
                  border: `1px solid ${broker.glowBorder}`,
                  boxShadow: `0 18px 45px rgba(0, 3, 13, 0.75), inset 0 1px 0 rgba(255,255,255,0.05)`,
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                }}
              >
                {/* Top Accent Line */}
                <div
                  style={{
                    height: '3.5px',
                    width: '100%',
                    background: `linear-gradient(90deg, transparent, ${broker.accentColor}, transparent)`,
                  }}
                />

                <div className="broker-card-body">
                  <div className="broker-grid-responsive">
                    {/* ── Left Column: Logo & Broker Identity ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Logo Container */}
                      <div
                        style={{
                          background: broker.logoBg,
                          border: broker.id === 'multibank' ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid var(--border)',
                          borderRadius: '16px',
                          padding: '10px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '84px',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={broker.logo || broker.logoUrl || '/assets/Images/brokers/xm.webp'}
                          alt={`${broker.name} Official Logo`}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '68px',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                      </div>

                      {/* Badges & Trust Metrics */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <span
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${broker.accentColor}`,
                              color: broker.accentColor,
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '3px 10px',
                              borderRadius: '6px',
                            }}
                          >
                            {isAr ? broker.badgeAr : broker.badgeEn}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontWeight: 800 }}>
                            ★ {broker.rating}
                          </span>
                          <span>•</span>
                          <span>{isAr ? broker.clientsCount : broker.clientsCountEn}</span>
                        </div>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                        {isAr ? broker.descriptionAr : broker.descriptionEn}
                      </p>
                    </div>

                    {/* ── Center Column: Specifications Grid & Perks ── */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        borderInline: '1px solid var(--border)',
                        paddingInline: '24px',
                      }}
                      className="broker-center-col"
                    >
                      {/* Specs 2x3 Grid */}
                      <div className="broker-specs-grid">
                        {(broker.specs || broker.specsData || []).map((spec, i) => (
                          <div
                            key={i}
                            style={{
                              background: 'rgba(1, 7, 30, 0.5)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '10px',
                              padding: '10px 14px',
                            }}
                          >
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                              {isAr ? (spec.labelAr || spec.label) : (spec.labelEn || spec.label)}
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {isAr ? (spec.valueAr || spec.val) : (spec.valueEn || spec.val)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* FXENGIN Exclusive Perk Box */}
                      <div className="broker-perk-box">
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'var(--accent-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            flexShrink: 0,
                          }}
                        >
                          <FiAward size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--accent)' }}>
                            {isAr ? 'عرض وحصريات أعضاء FXENGIN:' : 'FXENGIN Exclusive Partner Advantage:'}
                          </div>
                          <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 600 }}>
                            {isAr ? (broker.fxenginPerksAr || broker.perksAr) : (broker.fxenginPerksEn || broker.perksEn)}
                          </div>
                        </div>

                        {/* Coupon copy button if available */}
                        {broker.couponCode && (
                          <button
                            onClick={() => copyCoupon(broker.couponCode)}
                            title={isAr ? 'نسخ كود الشريك / الخصم' : 'Copy Partner Code / Coupon'}
                            style={{
                              background: copiedCoupon === broker.couponCode ? 'var(--success)' : 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: '#FFFFFF',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              flexShrink: 0,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {copiedCoupon === broker.couponCode ? <FiCheck size={14} /> : <FiCopy size={14} />}
                            <span>{broker.couponCode}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── Right Column: CTA Actions ── */}
                    <div className="broker-actions-col">
                      <a
                        href={broker.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{
                          height: '46px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: 800,
                          textDecoration: 'none',
                          borderRadius: '10px',
                          boxShadow: '0 8px 20px rgba(251, 135, 4, 0.3)',
                        }}
                      >
                        <span>
                          {broker.category === 'prop'
                            ? isAr ? 'ابدأ التحدي في PropXP' : 'Start PropXP Challenge'
                            : isAr ? `افتح حسابك في ${broker.name}` : `Open Live Account at ${broker.name}`}
                        </span>
                        <FiExternalLink size={16} />
                      </a>

                      <a
                        href={broker.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{
                          height: '42px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          borderRadius: '10px',
                        }}
                      >
                        <span>
                          {broker.category === 'prop'
                            ? isAr ? 'استكشف برامج التمويل' : 'Explore Funding Models'
                            : isAr ? 'افتح حساب تجريبي (Demo)' : 'Open Free Demo Account'}
                        </span>
                      </a>

                      <button
                        onClick={() => setSelectedBrokerModal(broker)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '6px',
                          marginTop: '4px',
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <FiInfo size={14} />
                        <span>{isAr ? 'عرض كافة المميزات والشروط' : 'View Full Features & Terms'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Anim>
          ))}
        </div>

        {/* ══════════════ 3. WHY OPEN THROUGH FXENGIN? ══════════════ */}
        <Anim>
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              padding: '40px 32px',
              marginBottom: '60px',
              boxShadow: '0 16px 40px rgba(0, 3, 13, 0.5)',
            }}
          >
            <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 36px' }}>
              <div style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 800, marginBottom: '6px', letterSpacing: '1px' }}>
                {isAr ? 'مزايا حصرية لا تجدها في مكان آخر' : 'EXCLUSIVE COMMUNITY BENEFITS'}
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 2.8vw, 30px)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {isAr ? 'لماذا تفتح حساب تداولك عبر شراكة FXENGIN؟' : 'Why Open Your Account Through FXENGIN?'}
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
              }}
            >
              {[
                {
                  icon: <FiAward size={24} color="var(--accent)" />,
                  titleAr: 'إشارات VIP وكورسات مجانية',
                  titleEn: 'Free VIP Signals & Courses',
                  descAr: 'بمجرد توثيق حسابك وإيداع أول مبلغ، تحصل على وصول دائم لمجتمع توصيات الفوركس والذهب وقسم الأكاديمية كاملاً.',
                  descEn: 'Instant lifetime access to our VIP setups, daily market briefings, and comprehensive academy courses.',
                },
                {
                  icon: <FiDollarSign size={24} color="var(--primary)" />,
                  titleAr: 'استرداد عمولات وكاش باك (Rebates)',
                  titleEn: 'Spread Rebates & Cashback',
                  descAr: 'وفر في كل لوت تتداوله بفضل خصومات السبريد الحصرية واسترداد جزء من العمولات مباشرة إلى محفظتك.',
                  descEn: 'Save on every traded lot with our partner rebate agreements, directly credited to your balance.',
                },
                {
                  icon: <FiShield size={24} color="var(--success)" />,
                  titleAr: 'حماية ودعم فني مخصص',
                  titleEn: 'Dedicated Priority Support',
                  descAr: 'فريق FXENGIN يتدخل لمساعدتك مباشرة وتسريع إجراءات التحقق من الوثائق، وتسهيل عمليات الإيداع والسحب.',
                  descEn: 'Our liaison desk assists with priority verification, swift deposits, and resolving technical queries.',
                },
                {
                  icon: <FiCpu size={24} color="#A855F7" />,
                  titleAr: 'أدوات تحليل وخوارزميات مجانية',
                  titleEn: 'Free AI Algo & Indicators',
                  descAr: 'استمتع بمؤشرات الذكاء الاصطناعي الحصرية الخاصة بنا ومحدد مناطق السيولة الذكية (SMC) مجاناً.',
                  descEn: 'Complimentary access to proprietary AI market sentiment trackers and institutional liquidity tools.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {isAr ? item.titleAr : item.titleEn}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Anim>

        {/* ══════════════ 4. HOW IT WORKS (3 SIMPLE STEPS) ══════════════ */}
        <Anim>
          <div
            style={{
              background: 'radial-gradient(ellipse at center, rgba(4, 136, 248, 0.08) 0%, rgba(1, 7, 30, 0.95) 100%)',
              border: '1px solid rgba(4, 136, 248, 0.2)',
              borderRadius: '20px',
              padding: '36px 32px',
              marginBottom: '40px',
            }}
          >
            <h2 style={{ fontSize: '22px', fontWeight: 800, textAlign: 'center', marginBottom: '32px', color: 'var(--text-primary)' }}>
              {isAr ? 'كيف تبدأ في 3 خطوات بسيطة؟' : 'How to Get Started in 3 Simple Steps?'}
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '24px',
              }}
            >
              {[
                {
                  num: '01',
                  titleAr: 'اختر الوسيط وافتح حسابك',
                  titleEn: 'Choose Broker & Register',
                  descAr: 'اضغط على زر "افتح حسابك" الخاص بأي من الشركاء المعتمدين (XM، YWO، PropXP، MultiBank، أو HFM) للتسجيل عبر رابط الشراكة.',
                  descEn: 'Click the open account button for your preferred partner (XM, YWO, PropXP, MultiBank, or HFM) via our official partner link.',
                },
                {
                  num: '02',
                  titleAr: 'وثّق الحساب وقم بالإيداع',
                  titleEn: 'Verify & Make a Deposit',
                  descAr: 'أكمل توثيق هويتك (KYC) السريع وقم بإيداع المبلغ الذي يناسبك، أو اختر حجم باقة التمويل في PropXP.',
                  descEn: 'Complete rapid identity verification and deposit your chosen capital or select your PropXP evaluation tier.',
                },
                {
                  num: '03',
                  titleAr: 'فعّل مزايا VIP في FXENGIN',
                  titleEn: 'Claim FXENGIN VIP Perks',
                  descAr: 'تواصل مع الدعم الفني وأرسل رقم حساب التداول الخاص بك، ليتم تفعيل اشتراكك في إشارات VIP وكورساتنا فوراً.',
                  descEn: 'Submit your trading account number to our support team to unlock VIP signals, rebates, and academy access instantly.',
                },
              ].map((step, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(1, 7, 30, 0.7)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '24px',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      fontSize: '36px',
                      fontWeight: 900,
                      background: 'var(--accent-gradient)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontFamily: "'Montserrat', sans-serif",
                      marginBottom: '8px',
                      display: 'inline-block',
                      lineHeight: 1.1,
                    }}
                  >
                    {step.num}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                    {isAr ? step.titleAr : step.titleEn}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {isAr ? step.descAr : step.descEn}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <Link
                href={getAppRoute('/contact', user)}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <FiHelpCircle size={16} color="var(--accent)" />
                <span>{isAr ? 'هل تحتاج مساعدة في فتح أو ربط الحساب؟ تواصل معنا' : 'Need help opening or linking your account? Contact Us'}</span>
                {isAr ? <FiArrowLeft size={14} /> : <FiArrowRight size={14} />}
              </Link>
            </div>
          </div>
        </Anim>

        {/* ══════════════ 5. REGULATORY RISK DISCLAIMER ══════════════ */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '24px',
            textAlign: 'center',
            fontSize: '11.5px',
            color: 'var(--text-muted)',
            lineHeight: 1.7,
            maxWidth: '900px',
            margin: '0 auto',
          }}
        >
          <p style={{ margin: 0 }}>
            {isAr
              ? 'إخلاء مسؤولية المخاطر: تداول العملات الأجنبية (الفوركس) وعقود الفروقات (CFDs) والسلع ينطوي على مخاطر عالية لخسارة رأس المال بسبب الرافعة المالية، وقد لا يكون مناسباً لجميع فئات المستثمرين. منصة FXENGIN تقدم خدمات تعليمية وتحليلية، ولا تقدم نصائح استثمارية مباشرة. تأكد من قراءة شروط كل وسيط وفهم المخاطر الكاملة قبل إيداع أي أموال حقيقية.'
              : 'Risk Disclosure: Trading foreign exchange (Forex), CFDs, and leveraged instruments carries a high level of risk and may not be suitable for all investors. FXENGIN operates as an educational and analytical portal and does not provide financial or portfolio advice. Please ensure you understand all risks and terms before funding any live account.'}
          </p>
        </div>
      </div>

      {/* ══════════════ 6. INTERACTIVE BROKER DETAILS MODAL ══════════════ */}
      {selectedBrokerModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(0, 3, 13, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedBrokerModal(null)}
        >
          <div
            style={{
              background: 'var(--surface-elevated)',
              border: `1px solid ${selectedBrokerModal.glowBorder}`,
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '30px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  background: selectedBrokerModal.logoBg,
                  borderRadius: '12px',
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: selectedBrokerModal.id === 'multibank' ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid var(--border)',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={selectedBrokerModal.logo || selectedBrokerModal.logoUrl || '/assets/Images/brokers/xm.webp'}
                  alt={selectedBrokerModal.name}
                  style={{ height: '44px', maxWidth: '150px', objectFit: 'contain', display: 'block' }}
                />
              </div>
              <button
                onClick={() => setSelectedBrokerModal(null)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border)',
                  color: '#FFF',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              {isAr ? `أبرز مميزات وحسابات ${selectedBrokerModal.name}` : `Key Features of ${selectedBrokerModal.name}`}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              {isAr ? selectedBrokerModal.descriptionAr : selectedBrokerModal.descriptionEn}
            </p>

            {/* Features Checkpoints */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {((isAr ? selectedBrokerModal.featuresAr : selectedBrokerModal.featuresEn) || selectedBrokerModal.featuresAr || []).map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <FiCheckCircle size={16} color="var(--success)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Specs Summary */}
            <div style={{ background: 'rgba(1, 7, 30, 0.7)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {(selectedBrokerModal.specs || selectedBrokerModal.specsData || []).map((spec, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {isAr ? (spec.labelAr || spec.label) : (spec.labelEn || spec.label)}
                    </div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {isAr ? (spec.valueAr || spec.val) : (spec.valueEn || spec.val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal CTA */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <a
                href={selectedBrokerModal.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{
                  flex: 1,
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  borderRadius: '10px',
                }}
              >
                <span>{isAr ? 'فتح الحساب الآن' : 'Open Account Now'}</span>
                <FiExternalLink size={15} />
              </a>
              <button
                onClick={() => setSelectedBrokerModal(null)}
                className="btn-secondary"
                style={{
                  padding: '0 20px',
                  height: '44px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Styles */}
      <style>{`
        /* Filter tabs responsive scroll */
        .broker-filters-container {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 6px;
          display: flex;
          justify-content: center;
        }
        .broker-filters-container::-webkit-scrollbar {
          display: none;
        }
        .broker-filters-pill {
          display: inline-flex;
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 4px;
          borderRadius: 12px;
          gap: 6px;
          white-space: nowrap;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }

        /* Broker Card Body */
        .broker-card-body {
          padding: 32px 28px;
        }

        /* Desktop layout */
        .broker-grid-responsive {
          display: grid;
          grid-template-columns: minmax(240px, 290px) 1fr minmax(210px, 240px);
          gap: 28px;
          align-items: center;
        }
        .broker-specs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .broker-perk-box {
          background: linear-gradient(135deg, rgba(4, 136, 248, 0.12) 0%, rgba(251, 135, 4, 0.12) 100%);
          border: 1px solid rgba(251, 135, 4, 0.3);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .broker-actions-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Laptop & Medium Screens (920px - 1179px) */
        @media (max-width: 1179px) and (min-width: 920px) {
          .broker-card-body {
            padding: 26px 22px;
          }
          .broker-grid-responsive {
            grid-template-columns: 240px 1fr 210px;
            gap: 20px;
          }
          .broker-center-col {
            padding-inline: 16px !important;
          }
          .broker-specs-grid {
            gap: 8px;
          }
        }

        /* Tablets Landscape / Medium (720px - 919px) */
        @media (max-width: 919px) and (min-width: 720px) {
          .broker-card-body {
            padding: 24px 20px;
          }
          .broker-grid-responsive {
            grid-template-columns: 1fr 220px;
            gap: 20px;
          }
          .broker-center-col {
            grid-column: span 2;
            border-inline: none !important;
            padding-inline: 0 !important;
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            padding-block: 20px;
          }
        }

        /* Mobile & Small Tablets (< 720px) */
        @media (max-width: 719px) {
          .broker-card-body {
            padding: 20px 16px !important;
          }
          .broker-grid-responsive {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .broker-center-col {
            border-inline: none !important;
            padding-inline: 0 !important;
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            padding-block: 18px;
          }
          .broker-specs-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .broker-actions-col {
            width: 100%;
          }
          .broker-actions-col a,
          .broker-actions-col button {
            width: 100% !important;
          }
          .broker-filters-container {
            justify-content: flex-start;
          }
        }

        /* Extra Small Phones (< 440px) */
        @media (max-width: 440px) {
          .broker-card-body {
            padding: 16px 12px !important;
          }
          .broker-specs-grid {
            grid-template-columns: 1fr !important;
          }
          .broker-perk-box {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .broker-perk-box button {
            width: 100% !important;
            justify-content: center !important;
          }
        }

        .broker-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 60px rgba(0, 3, 13, 0.9), 0 0 30px rgba(4, 136, 248, 0.15) !important;
        }
      `}</style>
    </div>
  );
}
