'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FiTrendingUp,
  FiActivity,
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiUser,
  FiClock,
  FiVideo,
  FiCheckCircle,
  FiAward,
  FiShield,
  FiPlayCircle,
  FiCalendar,
  FiLock,
  FiCreditCard,
  FiStar,
  FiUsers,
} from 'react-icons/fi';
import { LuGraduationCap } from 'react-icons/lu';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import { getAppRoute } from '../utils/routes';

const HERO_IMAGES = [
  { src: '/assets/Images/Main/hero1.webp?v=20261005', alt: 'FXENGIN 1' },
  { src: '/assets/Images/Main/hero2.webp?v=20261005', alt: 'FXENGIN 2' },
  { src: '/assets/Images/Main/hero3.webp?v=20261005', alt: 'FXENGIN 3' },
];

const EXPERT_SLIDES = [
  {
    id: 'ecosystem',
    image: '/assets/Images/Main/expert-slide1.webp?v=20261005',
    badgeAr: 'رؤية المنظومة والتداول',
    badgeEn: 'Market Vision & Strategy',
    badgeColor: '#0488f8',
    titleAr: 'التداول المؤسسي القائم على الانضباط والسيولة',
    titleEn: 'Institutional Trading Built on Liquidity & Discipline',
    speechAr:
      'في FXENGIN نركز على تمكينك من قراءة حركة السيولة الحقيقية وتدفق أوامر البنوك بدقة، مع الالتزام الصارم بقواعد إدارة رأس المال لحماية محفظتك وضمان استمراريتك في الأسواق.',
    speechEn:
      'At FXENGIN, we empower you to track authentic market liquidity and institutional order flow with precision, while upholding strict risk parameters to safeguard your capital.',
    highlightAr: 'تحليلات يومية للذهب والعملات • إدارة رأس مال صارمة',
    highlightEn: 'Daily Gold & FX Analytics • Strict Risk Control',
  },
  {
    id: 'academy',
    image: '/assets/Images/Main/expert-slide2.webp?v=20261005',
    badgeAr: 'الأكاديمية والتدريب التطبيقي',
    badgeEn: 'Accredited Academy',
    badgeColor: '#16C784',
    titleAr: 'مسارات تعليمية متدرجة من الصفر إلى الاحتراف',
    titleEn: 'Structured Curriculums: Beginner to Pro',
    speechAr:
      'صممنا دورات الأكاديمية لتمنحك المعرفة العملية في التحليل الفني، سلوك السعر، والتحليل الأساسي، مدعومة باختبارات وتطبيقات مباشرة وشهادات إتمام موثقة.',
    speechEn:
      'Our structured academy curriculums deliver hands-on technical, price action, and macroeconomic training, reinforced by practical assessments and verified certificates.',
    highlightAr: 'دورات شاملة • شهادات معتمدة • تطبيق عملي مباشر',
    highlightEn: 'Comprehensive Tracks • Verified Certificates • Hands-on Practice',
  },
  {
    id: 'smart-tools',
    image: '/assets/Images/Main/expert-slide3.webp?v=20261005',
    badgeAr: 'البث المباشر والشركاء',
    badgeEn: 'Live Streaming & Partners',
    badgeColor: '#FB8704',
    titleAr: 'جلسات تداول حي يومية وشركاء وساطة مرخصون',
    titleEn: 'Daily Live Trading Rooms & Regulated Brokers',
    speechAr:
      'انضم يومياً لجلسات البث المباشر لمتابعة افتتاح جلستي لندن ونيويورك والأخبار الاقتصادية لحظياً، واستفد من عروض شركات الوساطة المرخصة والحسابات الإسلامية.',
    speechEn:
      'Join daily live trading rooms covering London and New York market opens and high-impact economic data, backed by regulated broker partnerships and swap-free Islamic accounts.',
    highlightAr: 'بث حي تفاعلي • وسطاء مرخصون • حسابات إسلامية',
    highlightEn: 'Interactive Live Rooms • Regulated Brokers • Swap-Free Accounts',
  },
];

function StatBadge({ label, value, change, positive, icon }) {
  return (
    <div style={{
      background: 'rgba(10, 27, 61, 0.85)',
      border: '1px solid var(--border)',
      borderRadius: '0.625rem',
      padding: '0.375rem 0.625rem',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: '0 0.375rem 1.25rem rgba(0, 3, 13, 0.6)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      zIndex: 10,
    }}>
      {icon && (
        <div style={{
          width: '1.5rem',
          height: '1.5rem',
          borderRadius: '0.375rem',
          background: 'rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
      <div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: '0.0625rem', fontWeight: 500, lineHeight: 1 }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', lineHeight: 1.1 }}>
            {value}
          </span>
          {change && (
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: positive ? 'var(--success)' : 'var(--error)',
              background: positive ? 'rgba(22, 199, 132, 0.15)' : 'rgba(246, 70, 93, 0.15)',
              padding: '0.0625rem 0.25rem',
              borderRadius: '0.2rem',
              fontFamily: 'monospace',
              lineHeight: 1,
            }}>
              {positive ? '▲' : '▼'} {change}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const { t, isAr } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [expertSlideIdx, setExpertSlideIdx] = useState(0);

  // Typewriter effect state for expert speech
  const [displayedSpeech, setDisplayedSpeech] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [typingComplete, setTypingComplete] = useState(false);



  const activeSlide = EXPERT_SLIDES[expertSlideIdx];
  const speechTargetText = isAr ? activeSlide.speechAr : activeSlide.speechEn;

  // Typewriter effect: types out characters when slide changes or language changes
  useEffect(() => {
    if (!isAuthenticated) return;
    setDisplayedSpeech('');
    setIsTyping(true);
    setTypingComplete(false);

    let charIdx = 0;
    const textToType = speechTargetText;
    const timer = setInterval(() => {
      charIdx++;
      if (charIdx <= textToType.length) {
        setDisplayedSpeech(textToType.slice(0, charIdx));
      } else {
        clearInterval(timer);
        setIsTyping(false);
        setTypingComplete(true);
      }
    }, 18);

    return () => clearInterval(timer);
  }, [expertSlideIdx, isAr, isAuthenticated, speechTargetText]);

  // Auto-cycle expert speech slides after typing is complete (wait 6s for reading & clicking)
  useEffect(() => {
    if (!isAuthenticated || !typingComplete) return;
    const timer = setTimeout(() => {
      setExpertSlideIdx((prev) => (prev + 1) % EXPERT_SLIDES.length);
    }, 6000);
    return () => clearTimeout(timer);
  }, [typingComplete, expertSlideIdx, isAuthenticated]);

  // Rotate images for guest hero
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);



  const getLevelLabel = (level) => {
    switch (level) {
      case 'ADVANCED':
        return isAr ? 'محترف / متقدم' : 'Pro / Advanced';
      case 'INTERMEDIATE':
        return isAr ? 'متوسط' : 'Intermediate';
      default:
        return isAr ? 'مبتدئ' : 'Beginner';
    }
  };

  return (
    <section
      className="hero-section"
      style={{
        minHeight: 'calc(100dvh - var(--header-height, 4.5rem))',
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        alignItems: 'stretch',
        position: 'relative',
        overflow: 'hidden',
        padding: 0,
        paddingTop: 'var(--ticker-height, 2.75rem)',
        background: 'radial-gradient(ellipse 80% 60% at 50% 10%, rgba(4, 136, 248, 0.1) 0%, transparent 70%), #010A19',
      }}
    >
      {/* Background ambient lighting */}
      <div aria-hidden style={{
        position: 'absolute',
        top: '10%',
        right: '5%',
        width: 'clamp(15rem, 30vw, 24rem)',
        height: 'clamp(15rem, 30vw, 24rem)',
        background: 'radial-gradient(circle, rgba(251, 135, 4, 0.14) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        pointerEvents: 'none',
      }} />

      <div aria-hidden style={{
        position: 'absolute',
        bottom: '10%',
        left: '5%',
        width: 'clamp(12rem, 25vw, 20rem)',
        height: 'clamp(12rem, 25vw, 20rem)',
        background: 'radial-gradient(circle, rgba(4, 136, 248, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(45px)',
        pointerEvents: 'none',
      }} />


      {/* ═══════════════════════════════════════════════════════════════════
          LOGGED-IN USER PERSONALIZED HERO VIEW
      ═══════════════════════════════════════════════════════════════════ */}
      {isAuthenticated && user ? (
        <div className="container" style={{ position: 'relative', zIndex: 1, width: '100%', paddingTop: 'clamp(0.75rem, 2vw, 1.25rem)', paddingBottom: 'clamp(2rem, 3.5vw, 3rem)' }}>
          <div className="hero-grid" style={{ gridTemplateColumns: '1.08fr 0.92fr', gap: '32px', alignItems: 'center' }}>
            {/* Right Column (in RTL): Personalized Cockpit Greeting + Bento Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Top Greeting Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    background: 'rgba(251, 135, 4, 0.12)',
                    border: '1px solid rgba(251, 135, 4, 0.35)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 12px rgba(251, 135, 4, 0.25)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      boxShadow: '0 0 8px var(--accent)',
                      animation: 'livePulse 1.8s infinite',
                    }}
                  />
                  {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                    ? (isAr ? 'الإدارة العليا • FXENGIN' : 'Executive Command • FXENGIN')
                    : user.role === 'VIP'
                    ? (isAr ? 'مركز التداول المتقدم VIP' : 'VIP Trading Cockpit')
                    : (isAr ? 'مركز المتداول الذكي' : 'Smart Trader Cockpit')}
                </span>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--primary)',
                    background: 'rgba(4, 136, 248, 0.1)',
                    border: '1px solid rgba(4, 136, 248, 0.28)',
                    padding: '4px 11px',
                    borderRadius: '20px',
                  }}
                >
                  {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                    ? (isAr ? 'محلل مالي معتمد' : 'Certified Market Analyst')
                    : user.role === 'VIP'
                    ? (isAr ? 'عضوية VIP الماسية' : 'VIP Diamond Member')
                    : (isAr ? `المستوى: ${getLevelLabel(user.experienceLevel)}` : `Level: ${getLevelLabel(user.experienceLevel)}`)}
                </span>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#16C784',
                    background: 'rgba(22, 199, 132, 0.1)',
                    border: '1px solid rgba(22, 199, 132, 0.28)',
                    padding: '4px 11px',
                    borderRadius: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <FiCheckCircle size={12} />
                  {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                    ? (isAr ? 'حساب رسمي موثق' : 'Official Verified Admin')
                    : (isAr ? 'حساب نشط وموثق' : 'Verified Account')}
                </span>
              </div>

              {/* Main Welcome Headline & Subtitle */}
              <div>
                <h1
                  style={{
                    fontSize: 'clamp(24px, 2.5vw, 34px)',
                    fontWeight: 800,
                    lineHeight: 1.25,
                    margin: '0 0 8px 0',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {isAr ? (
                    <>
                      مرحباً بك،{' '}
                      <span
                        style={{
                          background: 'linear-gradient(135deg, #FFB03A 0%, #FB8704 60%, #FA5A04 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          display: 'inline-block',
                          filter: 'drop-shadow(0 2px 10px rgba(251, 135, 4, 0.35))',
                        }}
                      >
                        {user.fullName || 'متداولنا العزيز'}
                      </span>
                    </>
                  ) : (
                    <>
                      Welcome back,{' '}
                      <span
                        style={{
                          background: 'linear-gradient(135deg, #FFB03A 0%, #FB8704 60%, #FA5A04 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          display: 'inline-block',
                          filter: 'drop-shadow(0 2px 10px rgba(251, 135, 4, 0.35))',
                        }}
                      >
                        {user.fullName || 'Trader'}
                      </span>
                    </>
                  )}
                </h1>
                <p
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.65,
                    color: 'var(--text-secondary)',
                    margin: 0,
                    maxWidth: '580px',
                  }}
                >
                  {isAr
                    ? 'منصتك المركزية للوصول المباشر إلى تحليلات أسواق الذهب والعملات اليومية، غرف البث الحي، الدورات التدريبية المعتمدة، وعروض شركات الوساطة المرخصة.'
                    : 'Your central hub for instant access to daily Gold & FX analyses, interactive live trading rooms, certified curriculums, and regulated broker partnerships.'}
                </p>

                {/* Quick Action CTAs (Orange Primary Glow + Blue Glass Outline) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                  <Link
                    href="/analyses"
                    style={{
                      background: 'linear-gradient(135deg, #FA5A04 0%, #FB8704 100%)',
                      color: '#FFFFFF',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      boxShadow: '0 6px 22px rgba(251, 135, 4, 0.42)',
                      transition: 'all 0.25s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 26px rgba(251, 135, 4, 0.55)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 6px 22px rgba(251, 135, 4, 0.42)';
                    }}
                  >
                    {isAr ? 'استعراض التحليلات المباشرة' : 'Explore Live Analyses'}
                    <FiArrowLeft size={14} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
                  </Link>

                  <Link
                    href="/live"
                    style={{
                      background: 'rgba(4, 136, 248, 0.12)',
                      border: '1px solid rgba(4, 136, 248, 0.38)',
                      color: 'var(--text-primary)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      backdropFilter: 'blur(8px)',
                      transition: 'all 0.25s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.background = 'rgba(4, 136, 248, 0.22)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(4, 136, 248, 0.38)';
                      e.currentTarget.style.background = 'rgba(4, 136, 248, 0.12)';
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#16C784',
                        boxShadow: '0 0 8px #16C784',
                        animation: 'livePulse 1.5s infinite',
                      }}
                    />
                    <FiVideo size={14} color="var(--primary)" />
                    {isAr ? 'غرفة البث المباشر' : 'Live Trading Room'}
                  </Link>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  FINTECH BENTO GRID (4 Authentic FXENGIN Services: Orange & Blue)
              ═══════════════════════════════════════════════════════════════ */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
                  gap: '12px',
                  marginTop: '4px',
                }}
              >
                {/* ── Bento Widget 1: Daily Market Analyses (Blue & Orange Accent) ── */}
                <Link
                  href="/analyses"
                  style={{
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.88) 0%, rgba(10, 27, 61, 0.65) 100%)',
                    border: '1px solid rgba(4, 136, 248, 0.28)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 6px 20px rgba(0, 3, 13, 0.6)',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(4, 136, 248, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'rgba(4, 136, 248, 0.28)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 3, 13, 0.6)';
                  }}
                >
                  {/* Top Bar: Icon + Title + Update Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'rgba(4, 136, 248, 0.16)',
                          border: '1px solid rgba(4, 136, 248, 0.32)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: 'var(--primary)',
                        }}
                      >
                        <FiTrendingUp size={14} />
                      </div>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {isAr ? 'تحليلات الأسواق والسيولة' : 'Daily Market Analyses'}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '10.5px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: '#16C784',
                        background: 'rgba(22, 199, 132, 0.12)',
                        border: '1px solid rgba(22, 199, 132, 0.25)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {isAr ? 'تحديث يومي' : 'Daily Updates'}
                    </span>
                  </div>

                  {/* Micro Candlestick & Sparkline Chart Vector (Blue + Orange Retracement) */}
                  <div style={{ position: 'relative', width: '100%', height: '38px', margin: '2px 0' }}>
                    <svg viewBox="0 0 200 42" fill="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="bentoSparkGradOrange" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(4, 136, 248, 0.28)" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                      <path d="M 0 36 Q 30 28, 60 30 T 110 20 T 155 12 T 200 4 L 200 42 L 0 42 Z" fill="url(#bentoSparkGradOrange)" />
                      <path
                        d="M 0 36 Q 30 28, 60 30 T 110 20 T 155 12 T 200 4"
                        stroke="#0488F8"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                      <line x1="45" y1="22" x2="45" y2="36" stroke="#16C784" strokeWidth="1" />
                      <rect x="42.5" y="25" width="5" height="8" rx="1" fill="#16C784" />
                      <line x1="85" y1="18" x2="85" y2="32" stroke="#FB8704" strokeWidth="1" />
                      <rect x="82.5" y="21" width="5" height="7" rx="1" fill="#FB8704" />
                      <line x1="135" y1="8" x2="135" y2="24" stroke="#16C784" strokeWidth="1" />
                      <rect x="132.5" y="11" width="5" height="10" rx="1" fill="#16C784" />
                      <circle cx="200" cy="4" r="5" fill="rgba(251, 135, 4, 0.3)" />
                      <circle cx="200" cy="4" r="3" fill="#FB8704" />
                    </svg>
                  </div>

                  {/* Micro Meta Tag */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: '#94A3B8' }}>
                      {isAr ? 'الذهب XAU/USD والعملات الرئيسية' : 'Gold & Major FX Pairs'}
                    </span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      {isAr ? 'استعراض التحليلات ←' : 'View Analyses →'}
                    </span>
                  </div>
                </Link>

                {/* ── Bento Widget 2: Live Trading Stream (Orange Theme & Alternating Equalizer) ── */}
                <Link
                  href="/live"
                  style={{
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.88) 0%, rgba(10, 27, 61, 0.65) 100%)',
                    border: '1px solid rgba(251, 135, 4, 0.28)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 6px 20px rgba(0, 3, 13, 0.6)',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(251, 135, 4, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'rgba(251, 135, 4, 0.28)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 3, 13, 0.6)';
                  }}
                >
                  {/* Top Bar: Icon + Title + Live Pulse Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'rgba(251, 135, 4, 0.16)',
                          border: '1px solid rgba(251, 135, 4, 0.32)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: 'var(--accent)',
                        }}
                      >
                        <FiVideo size={14} />
                      </div>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {isAr ? 'غرفة التداول والبث الحي' : 'Live Trading Rooms'}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        background: 'rgba(251, 135, 4, 0.14)',
                        border: '1px solid rgba(251, 135, 4, 0.35)',
                        padding: '2px 7px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: '#EF4444',
                          boxShadow: '0 0 6px #EF4444',
                          animation: 'livePulse 1.4s infinite',
                        }}
                      />
                      {isAr ? 'جلسات مباشرة' : 'LIVE'}
                    </span>
                  </div>

                  {/* General Static Live Coverage Display (No Animation) */}
                  <div
                    style={{
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(251, 135, 4, 0.08)',
                      borderRadius: '6px',
                      padding: '0 10px',
                      border: '1px solid rgba(251, 135, 4, 0.18)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '5px',
                          background: 'rgba(251, 135, 4, 0.16)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <FiPlayCircle size={12} color="var(--accent)" />
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#E2E8F0',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isAr ? 'جلسات تداول وتغطية شاملة للأسواق' : 'Live Trading & Market Coverage'}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--accent)',
                        background: 'rgba(251, 135, 4, 0.12)',
                        border: '1px solid rgba(251, 135, 4, 0.25)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {isAr ? 'بث تفاعلي' : 'Interactive'}
                    </span>
                  </div>

                  {/* Micro Meta Tag */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: '#94A3B8' }}>
                      {isAr ? 'تغطية حية مع كبار المحللين' : 'Real-time Expert Sessions'}
                    </span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                      {isAr ? 'دخول الغرفة ←' : 'Join Room →'}
                    </span>
                  </div>
                </Link>

                {/* ── Bento Widget 3: Certified Pro Academy Track (Blue to Orange Track) ── */}
                <Link
                  href="/courses"
                  style={{
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.88) 0%, rgba(10, 27, 61, 0.65) 100%)',
                    border: '1px solid rgba(4, 136, 248, 0.28)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 6px 20px rgba(0, 3, 13, 0.6)',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(4, 136, 248, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'rgba(4, 136, 248, 0.28)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 3, 13, 0.6)';
                  }}
                >
                  {/* Top Bar: Icon + Title + Accreditation Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'rgba(4, 136, 248, 0.16)',
                          border: '1px solid rgba(4, 136, 248, 0.32)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: 'var(--primary)',
                        }}
                      >
                        <LuGraduationCap size={15} />
                      </div>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {isAr ? 'الأكاديمية والتدريب المالي' : 'FXENGIN Academy'}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--primary)',
                        background: 'rgba(4, 136, 248, 0.1)',
                        border: '1px solid rgba(4, 136, 248, 0.28)',
                        padding: '2px 7px',
                        borderRadius: '10px',
                      }}
                    >
                      {isAr ? 'شهادات معتمدة' : 'Accredited'}
                    </span>
                  </div>

                  {/* Visual Curriculum Path Component (Blue to Orange Gradient) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', height: '38px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: '#CBD5E1', fontWeight: 500 }}>{isAr ? 'مسارات من الصفر حتى الاحتراف' : 'Beginner to Pro Curriculums'}</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '10.5px' }}>{isAr ? 'دورات تطبيقية' : 'Curriculums'}</span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '5px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, #0458EC 0%, #0488F8 50%, #FB8704 100%)',
                          boxShadow: '0 0 10px rgba(251, 135, 4, 0.4)',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Micro Meta Tag */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: '#94A3B8' }}>
                      {isAr ? 'سلوك السعر، التحليل الفني والأساسي' : 'Price Action, Technical & Macro'}
                    </span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      {isAr ? 'استكشاف الدورات ←' : 'Explore Courses →'}
                    </span>
                  </div>
                </Link>

                {/* ── Bento Widget 4: Licensed Brokers & Exclusive Offers (Orange Theme) ── */}
                <Link
                  href="/offers"
                  style={{
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.88) 0%, rgba(10, 27, 61, 0.65) 100%)',
                    border: '1px solid rgba(251, 135, 4, 0.28)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 6px 20px rgba(0, 3, 13, 0.6)',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(251, 135, 4, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'rgba(251, 135, 4, 0.28)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 3, 13, 0.6)';
                  }}
                >
                  {/* Top Bar: Icon + Title + Regulated Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'rgba(251, 135, 4, 0.16)',
                          border: '1px solid rgba(251, 135, 4, 0.32)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: 'var(--accent)',
                        }}
                      >
                        <FiAward size={14} />
                      </div>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {isAr ? 'شركاء الوساطة والعروض' : 'Licensed Brokers & Offers'}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#16C784',
                        background: 'rgba(22, 199, 132, 0.1)',
                        border: '1px solid rgba(22, 199, 132, 0.25)',
                        padding: '2px 7px',
                        borderRadius: '10px',
                      }}
                    >
                      {isAr ? 'مرخص وموثوق' : 'Regulated'}
                    </span>
                  </div>

                  {/* Dual Highlight Box: Islamic Accounts & Deposit Bonus */}
                  <div
                    style={{
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(251, 135, 4, 0.08)',
                      borderRadius: '6px',
                      padding: '0 10px',
                      border: '1px solid rgba(251, 135, 4, 0.18)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>{isAr ? 'حسابات التداول' : 'Trading Accounts'}</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#16C784' }}>{isAr ? 'إسلامية 100%' : '100% Islamic'}</div>
                    </div>
                    <div style={{ height: '20px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                    <div>
                      <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>{isAr ? 'عروض التداول' : 'Exclusive Deals'}</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--accent)' }}>{isAr ? 'بونص إيداع مضاعف' : 'Deposit Match'}</div>
                    </div>
                  </div>

                  {/* Micro Meta Tag */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: '#94A3B8' }}>
                      {isAr ? 'أفضل الشركات المعتمدة' : 'Regulated Partner Brokers'}
                    </span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                      {isAr ? 'استعراض العروض ←' : 'View Offers →'}
                    </span>
                  </div>
                </Link>
              </div>

            </div>

            {/* Left Column (in RTL): Expert Holographic Mentorship HUD & Cutout Showcase */}
            <div
              className="expert-showcase-column"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                width: '100%',
                minHeight: '520px',
              }}
            >
              {/* 1. Holographic Glass Mentorship Card (Orange & Blue Accents) */}
              <div
                className="expert-speech-bubble"
                style={{
                  width: '100%',
                  maxWidth: '430px',
                  height: '160px',
                  minHeight: '160px',
                  maxHeight: '160px',
                  background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.94) 0%, rgba(1, 7, 30, 0.98) 100%)',
                  border: '1px solid rgba(4, 136, 248, 0.35)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  boxShadow: '0 16px 40px rgba(0, 3, 13, 0.85), 0 0 25px rgba(251, 135, 4, 0.15)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  zIndex: 10,
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                {/* Header row: Badge + Slide Indicators */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: EXPERT_SLIDES[expertSlideIdx].badgeColor || 'var(--primary)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${EXPERT_SLIDES[expertSlideIdx].badgeColor || 'var(--primary)'}50`,
                      padding: '2px 9px',
                      borderRadius: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: EXPERT_SLIDES[expertSlideIdx].badgeColor || 'var(--primary)',
                        boxShadow: `0 0 6px ${EXPERT_SLIDES[expertSlideIdx].badgeColor || 'var(--primary)'}`,
                      }}
                    />
                    {isAr ? EXPERT_SLIDES[expertSlideIdx].badgeAr : EXPERT_SLIDES[expertSlideIdx].badgeEn}
                  </span>

                  {/* 3 Slide Progress Indicator Bars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {EXPERT_SLIDES.map((_, i) => (
                      <span
                        key={i}
                        style={{
                          width: i === expertSlideIdx ? '16px' : '6px',
                          height: '4px',
                          borderRadius: '2px',
                          background: i === expertSlideIdx ? 'var(--accent)' : 'rgba(255, 255, 255, 0.2)',
                          boxShadow: i === expertSlideIdx ? '0 0 8px var(--accent)' : 'none',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                  {isAr ? EXPERT_SLIDES[expertSlideIdx].titleAr : EXPERT_SLIDES[expertSlideIdx].titleEn}
                </h3>

                {/* Speech text with typewriter typing animation & blinking cursor */}
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                    margin: 0,
                    height: '56px',
                    overflow: 'hidden',
                  }}
                >
                  {displayedSpeech}
                  {isTyping && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '2px',
                        height: '12px',
                        background: 'var(--accent)',
                        marginInlineStart: '4px',
                        verticalAlign: 'middle',
                        boxShadow: '0 0 6px var(--accent)',
                        animation: 'cursorBlink 0.6s infinite',
                      }}
                    />
                  )}
                </p>

                {/* Bottom Highlight Chip (Brand Orange) */}
                <div
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--accent)',
                    background: 'rgba(251, 135, 4, 0.1)',
                    border: '1px solid rgba(251, 135, 4, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '5px',
                    fontWeight: 600,
                    width: 'fit-content',
                  }}
                >
                  {isAr ? EXPERT_SLIDES[expertSlideIdx].highlightAr : EXPERT_SLIDES[expertSlideIdx].highlightEn}
                </div>

                {/* Speech Bubble Pointer Arrow */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-9px',
                    [isAr ? 'right' : 'left']: '44px',
                    width: 0,
                    height: 0,
                    borderLeft: '9px solid transparent',
                    borderRight: '9px solid transparent',
                    borderTop: '9px solid rgba(4, 136, 248, 0.6)',
                    filter: 'drop-shadow(0 4px 6px rgba(0,3,13,0.8))',
                  }}
                />
              </div>

              {/* 2. Expert Cutout Visual with Volumetric Orange & Blue Backlight + Floating Cockpit HUD */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '520px',
                  height: '450px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  marginTop: '8px',
                }}
              >
                {/* Dual Ambient Volumetric Lighting (Orange & Blue) */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: '15% 15% 0 15%',
                    background: 'radial-gradient(circle, rgba(251, 135, 4, 0.22) 0%, rgba(4, 136, 248, 0.18) 55%, transparent 80%)',
                    borderRadius: '50%',
                    filter: 'blur(36px)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Floating Holographic HUD Pill 1: Certified Analyst (Green Pulse Glow) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '25%',
                    [isAr ? 'left' : 'right']: '8px',
                    background: 'rgba(6, 20, 47, 0.92)',
                    border: '1px solid rgba(22, 199, 132, 0.45)',
                    boxShadow: '0 8px 24px rgba(0, 3, 13, 0.8), 0 0 16px rgba(22, 199, 132, 0.25)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '20px',
                    padding: '5px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 12,
                    animation: 'hudFloat 4s ease-in-out infinite',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#16C784',
                      boxShadow: '0 0 8px #16C784',
                      animation: 'livePulse 1.6s infinite',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#E2E8F0', fontWeight: 700 }}>
                    {isAr ? 'محلل أسواق معتمد' : 'Certified Market Analyst'}
                  </span>
                </div>

                {/* Floating Holographic HUD Pill 2: Capital Protection (Blue Glow) */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '22%',
                    [isAr ? 'right' : 'left']: '4px',
                    background: 'rgba(6, 20, 47, 0.92)',
                    border: '1px solid rgba(4, 136, 248, 0.45)',
                    boxShadow: '0 8px 24px rgba(0, 3, 13, 0.8), 0 0 16px rgba(4, 136, 248, 0.25)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '20px',
                    padding: '5px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 12,
                    animation: 'hudFloat 4s ease-in-out infinite 2s',
                  }}
                >
                  <FiShield size={12} color="var(--primary)" />
                  <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>
                    {isAr ? 'إدارة مخاطر صارمة' : 'Strict Risk Management'}
                  </span>
                </div>

                {/* Cutout Container with Soft Feathered Bottom Mask */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    maskImage: 'linear-gradient(to bottom, black 0%, black 72%, transparent 98%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 72%, transparent 98%)',
                  }}
                >
                  {/* Cutout Images (Stationary In-Place Cross-Fade) */}
                  {EXPERT_SLIDES.map((slide, idx) => (
                    <img
                      key={slide.id}
                      src={slide.image}
                      alt={isAr ? slide.titleAr : slide.titleEn}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        height: '100%',
                        maxHeight: '450px',
                        objectFit: 'contain',
                        opacity: idx === expertSlideIdx ? 1 : 0,
                        transform: isAr ? 'scaleX(-1)' : 'none',
                        transition: 'opacity 0.5s ease',
                        willChange: 'opacity',
                        filter: 'drop-shadow(0 20px 40px rgba(0, 3, 13, 0.95)) drop-shadow(0 0 20px rgba(4, 136, 248, 0.22))',
                        pointerEvents: 'none',
                      }}
                    />
                  ))}

                  {/* Soft bottom vignette shadow fade */}
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '80px',
                      background: 'linear-gradient(to top, var(--bg-dark) 0%, rgba(0, 3, 13, 0.75) 45%, transparent 100%)',
                      pointerEvents: 'none',
                      zIndex: 10,
                    }}
                  />
                </div>

              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
           GUEST / UNAUTHENTICATED HERO VIEW (FULL BLEED SCREEN WIDTH & HEIGHT)
        ═══════════════════════════════════════════════════════════════════ */
        <div
          className="hero-reference-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
            width: '100%',
            minHeight: 'calc(100dvh - var(--header-height, 4.5rem) - var(--ticker-height, 2.75rem))',
            alignItems: 'stretch',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* ── Right Column (in RTL): Content ──────── */}
          <div
            className="hero-reference-content"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 'clamp(1rem, 1.8vw, 1.5rem)',
              textAlign: isAr ? 'right' : 'left',
              paddingInlineEnd: 'clamp(1.5rem, 5vw, 5rem)',
              paddingInlineStart: 'clamp(1rem, 2.5vw, 3rem)',
              paddingBlock: 'clamp(2rem, 3.5vw, 4rem)',
              zIndex: 3,
            }}
          >
              {/* Main Headline matching reference exactly */}
              <h1
                style={{
                  fontSize: 'clamp(2.35rem, 4.4vw, 4.25rem)',
                  fontWeight: 900,
                  lineHeight: 1.18,
                  margin: 0,
                  letterSpacing: '-0.025em',
                  fontFamily: isAr ? "'Alyama', sans-serif" : "'Montserrat', sans-serif",
                }}
              >
                <span
                  style={{
                    display: 'block',
                    color: '#FFFFFF',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {isAr ? 'افهم السوق.' : (t.hero.titleLine1 || 'Understand the Market.')}
                </span>
                <span
                  style={{
                    display: 'block',
                    color: '#FB8704',
                    marginTop: '0.12em',
                    textShadow: '0 0 35px rgba(251, 135, 4, 0.4), 0 2px 10px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {isAr ? 'أتقن استراتيجيتك.' : (t.hero.titleLine2 || 'Master Your Strategy.')}
                </span>
              </h1>

              {/* Supporting Copy */}
              <p
                style={{
                  fontSize: 'clamp(1rem, 1.2vw, 1.15rem)',
                  lineHeight: 1.85,
                  color: 'rgba(245, 247, 250, 0.82)',
                  maxWidth: '38rem',
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                {t.hero.desc}
              </p>

              {/* Two Prominent CTA Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  marginTop: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                {/* 1. Primary Orange CTA Button */}
                <Link
                  href="/register"
                  style={{
                    background: '#FB8704',
                    color: '#FFFFFF',
                    padding: '0.875rem 1.85rem',
                    borderRadius: '0.625rem',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 20px rgba(251, 135, 4, 0.45)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 28px rgba(251, 135, 4, 0.65)';
                    e.currentTarget.style.background = '#FA5A04';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(251, 135, 4, 0.45)';
                    e.currentTarget.style.background = '#FB8704';
                  }}
                >
                  <span>{t.hero.startFree}</span>
                  <FiArrowLeft size={18} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
                </Link>

                {/* 2. Secondary Cyan Outline CTA Button */}
                <a
                  href="#courses"
                  style={{
                    background: 'rgba(4, 136, 248, 0.08)',
                    border: '1.5px solid #0488F8',
                    color: '#0488F8',
                    padding: '0.85rem 1.75rem',
                    borderRadius: '0.625rem',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    textDecoration: 'none',
                    boxShadow: '0 0 18px rgba(4, 136, 248, 0.22)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(4, 136, 248, 0.18)';
                    e.currentTarget.style.borderColor = '#38A2FF';
                    e.currentTarget.style.color = '#38A2FF';
                    e.currentTarget.style.boxShadow = '0 0 24px rgba(4, 136, 248, 0.45)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(4, 136, 248, 0.08)';
                    e.currentTarget.style.borderColor = '#0488F8';
                    e.currentTarget.style.color = '#0488F8';
                    e.currentTarget.style.boxShadow = '0 0 18px rgba(4, 136, 248, 0.22)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <FiBookOpen size={18} color="currentColor" />
                  <span>{t.hero.exploreCourses}</span>
                </a>
              </div>

              {/* Three Horizontally Aligned Statistics */}
              <div
                className="hero-reference-stats"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(1rem, 2.2vw, 2.5rem)',
                  paddingTop: '1.75rem',
                  borderTop: '1px solid rgba(18, 49, 92, 0.55)',
                  marginTop: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                {/* Stat 1: 98% */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: 'clamp(1.5rem, 2.2vw, 2.1rem)',
                        fontWeight: 800,
                        color: '#FB8704',
                        fontFamily: 'monospace',
                        lineHeight: 1.1,
                      }}
                    >
                      {t.hero.stat1Val}
                    </span>
                    <FiStar size={19} color="#0488F8" style={{ filter: 'drop-shadow(0 0 6px rgba(4, 136, 248, 0.65))' }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', color: '#FFFFFF', fontWeight: 500 }}>
                    {t.hero.stat1Label}
                  </span>
                </div>

                {/* Subtle vertical separator */}
                <div
                  aria-hidden
                  className="hide-mobile"
                  style={{ width: '1px', height: '2.5rem', background: 'rgba(18, 49, 92, 0.8)' }}
                />

                {/* Stat 2: 50,000+ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: 'clamp(1.5rem, 2.2vw, 2.1rem)',
                        fontWeight: 800,
                        color: '#FB8704',
                        fontFamily: 'monospace',
                        lineHeight: 1.1,
                      }}
                    >
                      {t.hero.stat2Val}
                    </span>
                    <FiUsers size={19} color="#0488F8" style={{ filter: 'drop-shadow(0 0 6px rgba(4, 136, 248, 0.65))' }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', color: '#FFFFFF', fontWeight: 500 }}>
                    {t.hero.stat2Label}
                  </span>
                </div>

                {/* Subtle vertical separator */}
                <div
                  aria-hidden
                  className="hide-mobile"
                  style={{ width: '1px', height: '2.5rem', background: 'rgba(18, 49, 92, 0.8)' }}
                />

                {/* Stat 3: 120+ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: 'clamp(1.5rem, 2.2vw, 2.1rem)',
                        fontWeight: 800,
                        color: '#FB8704',
                        fontFamily: 'monospace',
                        lineHeight: 1.1,
                      }}
                    >
                      {t.hero.stat3Val}
                    </span>
                    <LuGraduationCap size={21} color="#0488F8" style={{ filter: 'drop-shadow(0 0 6px rgba(4, 136, 248, 0.65))' }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', color: '#FFFFFF', fontWeight: 500 }}>
                    {t.hero.stat3Label}
                  </span>
                </div>
              </div>
            </div>

                        {/* ── Left Column (in RTL): Visual Composition ─────── */}
            <div
              className="hero-reference-visual"
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: isAr ? 'flex-start' : 'flex-end',
                alignItems: 'flex-end',
                width: '100%',
                height: '100%',
                minHeight: 'calc(100dvh - var(--header-height, 4.5rem) - var(--ticker-height, 2.75rem))',
                overflow: 'visible',
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                zIndex: 2,
              }}
            >
              {/* Atmospheric cyan/blue ambient glow */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: '-10% -15% -10% -15%',
                  background: 'radial-gradient(ellipse 75% 65% at 38% 65%, rgba(4, 136, 248, 0.16) 0%, rgba(4, 88, 236, 0.08) 42%, transparent 70%)',
                  borderRadius: '50%',
                  filter: 'blur(50px)',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />

              {/* Main Visual Image container with radial gradient mask */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '740px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: isAr ? 'flex-start' : 'flex-end',
                  zIndex: 2,
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  WebkitMaskImage: 'radial-gradient(ellipse 90% 86% at 40% 62%, #000 52%, rgba(0, 0, 0, 0.65) 74%, transparent 97%)',
                  maskImage: 'radial-gradient(ellipse 90% 86% at 40% 62%, #000 52%, rgba(0, 0, 0, 0.65) 74%, transparent 97%)',
                }}
              >
                <picture
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: isAr ? 'flex-start' : 'flex-end',
                    background: 'transparent',
                  }}
                >
                  <source srcSet="/assets/Images/Main/hero_fintech_visual@2x.webp?v=6" type="image/webp" />
                  <img
                    src="/assets/Images/Main/hero_fintech_visual.png?v=6"
                    alt="FXENGIN - مهندس الفوركس Gamal Ahmed SMC Trading Platform"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: 'calc(100dvh - var(--header-height, 4.5rem) - var(--ticker-height, 2.75rem))',
                      objectFit: 'contain',
                      objectPosition: isAr ? 'left bottom' : 'right bottom',
                      display: 'block',
                      userSelect: 'none',
                      pointerEvents: 'none',
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  />
                </picture>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

