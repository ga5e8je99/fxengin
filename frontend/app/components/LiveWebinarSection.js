'use client';

import { useState, useEffect } from 'react';
import {
  FiVideo,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiAward,
  FiShield,
  FiCreditCard,
  FiLock,
  FiUsers,
  FiZap,
  FiTrendingUp,
  FiCheck,
  FiRadio,
} from 'react-icons/fi';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import { getAppRoute } from '../utils/routes';
import { fetchLiveSessions } from '../services/liveService';
import WebinarPaymentModal from './WebinarPaymentModal';

function getInitials(name) {
  if (!name) return 'KS';
  const clean = name.replace(/^(د\.|ك\.|م\.|Dr\.|Eng\.|Mr\.)\s*/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'KS';
}

function formatSessionDate(dateStr, isAr) {
  if (!dateStr) return isAr ? 'الخميس القادم • 8:00 مساءً بتوقيت مكة' : 'Next Thursday • 8:00 PM GMT+3';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString(isAr ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function LiveWebinarSection() {
  const { isAr } = useLanguage();
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isRegisteredWebinar, setIsRegisteredWebinar] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 18,
    minutes: 42,
    seconds: 30,
  });

  // Fetch live webinar session from official API (GET /live)
  useEffect(() => {
    let isMounted = true;
    async function loadWebinarData() {
      try {
        const res = await fetchLiveSessions();
        if (!isMounted) return;

        if (res?.success) {
          // Priority: 1. Active LIVE broadcast, 2. Scheduled upcoming session, 3. Replay
          const active =
            res.liveNow && res.liveNow.length > 0
              ? res.liveNow[0]
              : res.upcoming && res.upcoming.length > 0
              ? res.upcoming[0]
              : res.replays && res.replays.length > 0
              ? res.replays[0]
              : null;
          setSession(active);
        }
      } catch (err) {
        console.warn('API Error loading live webinar section:', err);
      } finally {
        if (isMounted) setIsLoadingSession(false);
      }
    }

    loadWebinarData();
    const interval = setInterval(loadWebinarData, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Ticking countdown timer calculated dynamically from scheduledStartTime or fallback
  useEffect(() => {
    let targetDate;
    if (session?.scheduledStartTime) {
      targetDate = new Date(session.scheduledStartTime);
    } else {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 2);
      targetDate.setHours(20, 0, 0, 0);
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, targetDate.getTime() - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session?.scheduledStartTime]);

  // Check saved webinar ticket booking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionKey = session?.id ? `fxengin_webinar_registered_${session.id}` : 'fxengin_webinar_registered';
      const booked = localStorage.getItem(sessionKey) === 'true' || localStorage.getItem('fxengin_webinar_registered') === 'true';
      const params = new URLSearchParams(window.location.search);
      if (booked || params.get('webinar_booked') === 'true') {
        setIsRegisteredWebinar(true);
        if (params.get('webinar_booked') === 'true') {
          try {
            localStorage.setItem(sessionKey, 'true');
            localStorage.setItem('fxengin_webinar_registered', 'true');
          } catch (e) {}
        }
      }
    }
  }, [session?.id]);

  // Dynamic session properties
  const hasSession = Boolean(session);
  const isLive = session?.status === 'LIVE';
  const isFree = session?.isFree === true || session?.price === 0;
  const sessionPrice = isFree ? 0 : (session?.price || 0);
  const originalPrice = session?.originalPrice || (session?.price ? Math.round(session.price * 1.3) : 0);
  const instructorName = session?.instructorName || (isAr ? 'فريق كبار المحللين' : 'Senior Market Analysts');
  const instructorTitle =
    session?.instructorTitle ||
    session?.instructorRole ||
    (isAr ? 'فريق التحليل الفني والسيولة المؤسسية' : 'Technical & Institutional Analysis Team');
  const instructorInitials = hasSession ? getInitials(instructorName) : 'FX';
  const formattedDate = hasSession ? formatSessionDate(session?.scheduledStartTime, isAr) : (isAr ? 'مواعيد دورية أسبوعية' : 'Weekly Live Broadcasts');
  const sessionSlugOrId = session?.slug || session?.id || '';
  const liveRoomUrl = sessionSlugOrId ? `/live/${sessionSlugOrId}` : '/live';

  const titleText = (isAr ? session?.titleAr : session?.titleEn) || session?.title;
  const descText =
    (isAr ? session?.descriptionAr : session?.descriptionEn) ||
    session?.description ||
    (isAr
      ? 'انضم إلى جلسات البث الحي وورش العمل التفاعلية لتغطية افتتاح الأسواق العالمية، صفقات السكالبينج، والبيانات الاقتصادية العاجلة مع نخبة من الخبراء.'
      : 'Join our live interactive market analysis sessions and workshops covering major market opens, institutional scalping setups, and breaking macro events.');

  const maxParticipants = session?.maxParticipants || 100;
  const seatsRemaining = session?.seatsRemaining || Math.max(5, Math.floor(maxParticipants * 0.12));
  const bookedPercent = Math.min(96, Math.max(50, Math.round(((maxParticipants - seatsRemaining) / maxParticipants) * 100)));

  const features = [
    {
      icon: <FiVideo size={20} color="var(--primary)" />,
      titleAr: session?.streamType ? `جلسة تفاعلية حية (${session.streamType})` : 'جلسة تفاعلية حية بدقة HD (Zoom)',
      titleEn: session?.streamType ? `Live Interactive Session (${session.streamType})` : 'Live Interactive HD Session (Zoom)',
      descAr: 'مشاركة شاشة وتطبيق حي على الشارت، مع إمكانية توجيه الأسئلة والمداخلات الصوتية والنصية لحظياً.',
      descEn: 'Live screen sharing and real-time chart application with interactive Q&A directly with the instructor.',
    },
    {
      icon: <FiAward size={20} color="var(--accent)" />,
      titleAr: 'مؤشرات السيولة الحصرية المرفقة',
      titleEn: 'Proprietary Liquidity Indicators Included',
      descAr: 'احصل مجاناً على حزمة مؤشرات رصد مناطق التجميع والتصريف وفخاخ السيولة لبرامج MT4/MT5 و TradingView.',
      descEn: 'Receive custom institutional liquidity and order block indicator packages for MT4/MT5 and TradingView.',
    },
    {
      icon: <FiTrendingUp size={20} color="#00F0FF" />,
      titleAr: 'تطبيقات عملية على صفقات حية',
      titleEn: 'Hands-on Real Market Case Studies',
      descAr: 'تحليل دقيق لفرص حقيقية قائمة على الذهب (XAU/USD) والعملات الرئيسية وفق نماذج صانع السوق بنسب عائد 1:3+.',
      descEn: 'Deep-dive analysis on active Gold and Major currency setups with 1:3+ Risk-to-Reward institutional rules.',
    },
  ];

  return (
    <section
      id="live-webinar"
      style={{
        position: 'relative',
        padding: 'clamp(2.5rem, 5vw, 4.25rem) 0',
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(251, 135, 4, 0.08) 0%, transparent 60%), #06142F',
        overflow: 'hidden',
      }}
    >
      {/* Background Ambient Glows */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '20%',
          right: '5%',
          width: 'clamp(15rem, 30vw, 24rem)',
          height: 'clamp(15rem, 30vw, 24rem)',
          background: 'radial-gradient(circle, rgba(251, 135, 4, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: 'clamp(15rem, 30vw, 22rem)',
          height: 'clamp(15rem, 30vw, 22rem)',
          background: 'radial-gradient(circle, rgba(4, 136, 248, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '48rem', margin: '0 auto 2.75rem auto' }}>
          {/* Live Status Badge */}
          <div style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <span
              style={{
                background: isLive ? 'rgba(22, 199, 132, 0.15)' : 'rgba(246, 70, 93, 0.15)',
                border: isLive ? '1px solid rgba(22, 199, 132, 0.5)' : '1px solid rgba(246, 70, 93, 0.4)',
                color: isLive ? '#16C784' : '#F6465D',
                fontSize: '0.8125rem',
                fontWeight: 800,
                padding: '0.35rem 0.875rem',
                borderRadius: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: isLive ? '0 0 16px rgba(22, 199, 132, 0.25)' : '0 0 16px rgba(246, 70, 93, 0.15)',
              }}
            >
              <span
                style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '50%',
                  background: isLive ? '#16C784' : '#F6465D',
                  boxShadow: isLive ? '0 0 8px #16C784' : '0 0 8px #F6465D',
                  animation: isLive ? 'pulse 1.5s infinite' : 'none',
                }}
              />
              {isLive
                ? isAr
                  ? 'بث مباشر حي الآن • ورشة عمل حصرية'
                  : 'LIVE STREAMING RIGHT NOW • EXCLUSIVE'
                : isAr
                ? 'محاضرة بث مباشر قادمة • ورشة عمل حصرية'
                : 'UPCOMING LIVE MASTERCLASS & WEBINAR'}
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3.2vw, 2.75rem)',
              fontWeight: 800,
              lineHeight: 1.25,
              color: 'var(--text-primary)',
              margin: '0 0 1rem 0',
              letterSpacing: '-0.02em',
            }}
          >
            {titleText ? (
              titleText
            ) : isAr ? (
              <>
                غرفة التداول المباشر <span className="text-gradient-brand">والتحليلات الحية</span> للأسواق المالية
              </>
            ) : (
              <>
                Live Trading Floor & <span className="text-gradient-brand">Market Analysis</span> Masterclasses
              </>
            )}
          </h2>

          <p
            style={{
              fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            {descText}
          </p>
        </div>

        {/* 2-Column Grid: Left Details & Right VIP Booking Box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 'clamp(1.5rem, 3vw, 2.5rem)',
            alignItems: 'stretch',
          }}
        >
          {/* Left Column: Speaker Info & Curriculum Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', height: '100%' }}>
            {/* Instructor Profile Card */}
            <div
              className="card"
              style={{
                background: 'rgba(6, 20, 47, 0.75)',
                border: '1px solid rgba(4, 136, 248, 0.25)',
                borderRadius: '1rem',
                padding: '1.15rem 1.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '3.25rem',
                    height: '3.25rem',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    padding: '2px',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: 'var(--bg-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent)',
                      fontWeight: 800,
                      fontSize: '1.125rem',
                    }}
                  >
                    {instructorInitials}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {instructorName}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                    {instructorTitle}
                  </div>
                </div>
              </div>

              {/* Date & Time Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  padding: '0.375rem 0.875rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8125rem',
                  color: 'var(--text-primary)',
                }}
              >
                <FiCalendar size={14} color="var(--accent)" />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Features List Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', flex: 1 }}>
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="card"
                  style={{
                    background: 'rgba(6, 20, 47, 0.6)',
                    border: '1px solid rgba(18, 49, 92, 0.35)',
                    borderRadius: '0.875rem',
                    padding: '1.15rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flex: 1,
                    transition: 'border-color 0.2s ease, transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(251, 135, 4, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(18, 49, 92, 0.35)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div
                    style={{
                      width: '2.625rem',
                      height: '2.625rem',
                      borderRadius: '0.625rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {feat.icon}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: '0 0 0.25rem 0',
                        lineHeight: 1.3,
                      }}
                    >
                      {isAr ? feat.titleAr : feat.titleEn}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        lineHeight: 1.55,
                      }}
                    >
                      {isAr ? feat.descAr : feat.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: High-Impact VIP Pass Booking Card */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.96) 0%, rgba(1, 7, 30, 0.98) 100%)',
              border: isLive ? '1px solid rgba(22, 199, 132, 0.6)' : '1px solid rgba(251, 135, 4, 0.45)',
              borderRadius: '1.25rem',
              padding: 'clamp(1.25rem, 2.5vw, 1.875rem)',
              boxShadow: isLive
                ? '0 1.25rem 3rem rgba(0, 3, 13, 0.8), 0 0 30px rgba(22, 199, 132, 0.2)'
                : '0 1.25rem 3rem rgba(0, 3, 13, 0.8), 0 0 30px rgba(251, 135, 4, 0.12)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            {/* Ambient Corner Flare */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '-20%',
                right: '-20%',
                width: '12rem',
                height: '12rem',
                background: isLive
                  ? 'radial-gradient(circle, rgba(22, 199, 132, 0.3) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(251, 135, 4, 0.25) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />

            {!hasSession ? (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', gap: '1.5rem' }}>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: 'var(--accent)',
                        background: 'rgba(251, 135, 4, 0.15)',
                        border: '1px solid rgba(251, 135, 4, 0.4)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.5rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <FiRadio size={12} />
                      {isAr ? 'استوديو البث الحي' : 'LIVE STUDIO'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#16C784',
                        background: 'rgba(22, 199, 132, 0.12)',
                        border: '1px solid rgba(22, 199, 132, 0.3)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '0.375rem',
                        fontWeight: 700,
                      }}
                    >
                      {isAr ? 'جلسات أسبوعية' : 'Weekly Live'}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      margin: '0 0 1rem 0',
                      lineHeight: 1.4,
                    }}
                  >
                    {isAr
                      ? 'غرفة التداول المباشر والتحليلات الحية'
                      : 'Live Trading Floor & Market Sessions'}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.65,
                      marginBottom: '1.5rem',
                    }}
                  >
                    {isAr
                      ? 'تبث جلساتنا الحية دورياً عبر منصة FXENGIN مع افتتاح أسواق لندن ونيويورك لتغطية صفقات السكالبينج، السيولة البنكية، والبيانات الاقتصادية العاجلة.'
                      : 'Interactive live market sessions broadcast regularly during London and NY sessions to cover institutional setups and breaking news.'}
                  </p>
                </div>

                <div>
                  <Link
                    href={getAppRoute('/live', user)}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      height: '3.125rem',
                      fontSize: '0.9375rem',
                      justifyContent: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      textDecoration: 'none',
                      background: 'linear-gradient(135deg, var(--accent), #F6465D)',
                      boxShadow: '0 6px 24px rgba(251, 135, 4, 0.45)',
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      borderRadius: '0.625rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <FiVideo size={18} />
                    <span>{isAr ? 'استعراض جدول قاعة البث المباشر ←' : 'Explore Live Broadcast Schedule →'}</span>
                  </Link>

                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isAr ? 'يتم إشعار المتداولين بمواعيد البث فور جدولتها في المنصة' : 'Traders are notified immediately upon session scheduling'}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Header / Ticket Badge & Price */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: isLive ? '#16C784' : '#FB8704',
                  background: isLive ? 'rgba(22, 199, 132, 0.15)' : 'rgba(251, 135, 4, 0.15)',
                  border: isLive ? '1px solid rgba(22, 199, 132, 0.4)' : '1px solid rgba(251, 135, 4, 0.4)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                {isLive ? <FiRadio size={12} /> : <FiLock size={12} />}
                {isLive
                  ? isAr
                    ? 'بث مباشر حي نشط'
                    : 'LIVE NOW'
                  : isAr
                  ? 'تذكرة VIP حصرية للحضور'
                  : 'EXCLUSIVE VIP PASS'}
              </span>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                {!isFree && (
                  <span
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-muted)',
                      textDecoration: 'line-through',
                      fontFamily: 'monospace',
                    }}
                  >
                    {originalPrice} USDT
                  </span>
                )}
                <span
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: isFree ? '#16C784' : 'var(--accent)',
                    fontFamily: 'monospace',
                    lineHeight: 1,
                  }}
                >
                  {isFree ? (isAr ? 'مجاناً' : 'FREE') : `${sessionPrice} USDT`}
                </span>
              </div>
            </div>

            <h3
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 1.25rem 0',
                lineHeight: 1.4,
              }}
            >
              {isLive
                ? isAr
                  ? 'الجلسة المباشرة منعقدة الآن • انضم للقاعة'
                  : 'Live Session in Progress • Join the Floor'
                : isAr
                ? 'احجز مقعدك الآن في البث المباشر التفاعلي القادم'
                : 'Secure Your Seat in the Upcoming Live Interactive Session'}
            </h3>

            {/* If LIVE: Show Live Status Box, Else: Show Live Countdown Grid */}
            {isLive ? (
              <div
                style={{
                  background: 'rgba(22, 199, 132, 0.1)',
                  border: '1px solid rgba(22, 199, 132, 0.35)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  textAlign: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px',
                    color: '#16C784',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                  }}
                >
                  <span
                    style={{
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      background: '#16C784',
                      boxShadow: '0 0 10px #16C784',
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                  <span>{isAr ? 'البث المباشر على الهواء الآن' : 'Streaming Live Right Now'}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#A7AFBF' }}>
                  {session?.streamType && (
                    <span style={{ marginInlineEnd: '8px', color: '#0488F8', fontWeight: 700 }}>
                      [{session.streamType}]
                    </span>
                  )}
                  {isAr ? 'يمكنك التفاعل مباشرة وطرح أسئلتك على الشارت' : 'Interact in chat and ask questions live on chart'}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <FiClock size={13} color="var(--accent)" />
                  <span>{isAr ? 'الوقت المتبقي حتى انطلاق البث المباشر:' : 'Time remaining until live kickoff:'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem' }}>
                  {[
                    { val: timeLeft.days, label: isAr ? 'أيام' : 'Days' },
                    { val: timeLeft.hours, label: isAr ? 'ساعات' : 'Hours' },
                    { val: timeLeft.minutes, label: isAr ? 'دقائق' : 'Mins' },
                    { val: timeLeft.seconds, label: isAr ? 'ثواني' : 'Secs' },
                  ].map(({ val, label }) => (
                    <div
                      key={label}
                      style={{
                        background: 'rgba(0, 0, 0, 0.55)',
                        border: '1px solid rgba(251, 135, 4, 0.25)',
                        borderRadius: '0.625rem',
                        padding: '0.75rem 0.25rem',
                        textAlign: 'center',
                        boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 800,
                          color: 'var(--accent)',
                          fontFamily: 'monospace',
                          lineHeight: 1.1,
                        }}
                      >
                        {String(val).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scarcity Progress Bar */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  marginBottom: '0.375rem',
                }}
              >
                <span style={{ color: 'var(--error)', fontWeight: 700 }}>
                  {isAr ? `المقاعد المتبقية: ${seatsRemaining} مقعد فقط!` : `Only ${seatsRemaining} seats remaining!`}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {isAr ? `تم حجز ${bookedPercent}%` : `${bookedPercent}% Claimed`}
                </span>
              </div>
              <div
                style={{
                  height: '0.375rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '0.25rem',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${bookedPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #FB8704, #F6465D)',
                    borderRadius: '0.25rem',
                  }}
                />
              </div>
            </div>

            {/* Booking CTA Button */}
            {isLive ? (
              <Link
                href={getAppRoute(liveRoomUrl, user)}
                className="btn-primary"
                style={{
                  width: '100%',
                  height: '3.125rem',
                  fontSize: '0.9375rem',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #16C784 0%, #0488F8 100%)',
                  boxShadow: '0 6px 24px rgba(22, 199, 132, 0.45)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  borderRadius: '0.625rem',
                  marginBottom: '1rem',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                }}
              >
                <FiVideo size={18} />
                <span>{isAr ? 'دخول قاعة البث المباشر الآن ←' : 'Enter Live Broadcast Room Now →'}</span>
              </Link>
            ) : isRegisteredWebinar ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '100%',
                    height: '3rem',
                    fontSize: '0.9375rem',
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(22, 199, 132, 0.2)',
                    border: '1px solid var(--success)',
                    color: 'var(--success)',
                    borderRadius: '0.625rem',
                    fontWeight: 700,
                  }}
                >
                  <FiCheckCircle size={18} />
                  <span>{isAr ? 'تم تأكيد حجز مقعدك بنجاح ✓' : 'Your Seat is Confirmed ✓'}</span>
                </div>
                <Link
                  href={getAppRoute(liveRoomUrl, user)}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    height: '2.875rem',
                    fontSize: '0.875rem',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #16C784, #0488F8)',
                  }}
                >
                  <span>{isAr ? 'دخول قاعة البث المباشر الآن ←' : 'Enter Live Broadcast Room →'}</span>
                </Link>
              </div>
            ) : isFree ? (
              <button
                type="button"
                onClick={() => {
                  setIsRegisteredWebinar(true);
                  try {
                    const sessionKey = session?.id ? `fxengin_webinar_registered_${session.id}` : 'fxengin_webinar_registered';
                    localStorage.setItem(sessionKey, 'true');
                  } catch (e) {}
                  showToast.success(isAr ? 'تم تأكيد حجز مقعدك المجاني بنجاح!' : 'Free seat confirmed successfully!');
                }}
                className="btn-primary"
                style={{
                  width: '100%',
                  height: '3.125rem',
                  fontSize: '0.9375rem',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #16C784 0%, #0488F8 100%)',
                  boxShadow: '0 6px 24px rgba(22, 199, 132, 0.45)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  borderRadius: '0.625rem',
                  marginBottom: '1rem',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                }}
              >
                <FiCheckCircle size={18} />
                <span>{isAr ? 'حجز مقعدك مجاناً الآن' : 'Claim Your Free Seat Now'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary"
                style={{
                  width: '100%',
                  height: '3.125rem',
                  fontSize: '0.9375rem',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #FB8704 0%, #F6465D 100%)',
                  boxShadow: '0 6px 24px rgba(251, 135, 4, 0.45)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  borderRadius: '0.625rem',
                  marginBottom: '1rem',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(251, 135, 4, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(251, 135, 4, 0.45)';
                }}
              >
                <FiCreditCard size={18} />
                <span>
                  {isAr
                    ? `دفع الرسوم وحجز المقعد في الكورس المباشر (${sessionPrice} USDT)`
                    : `Pay Fees & Book Seat (${sessionPrice} USDT)`}
                </span>
                <FiLock size={14} style={{ opacity: 0.8 }} />
              </button>
            )}
            </>
            )}

            {/* Trust & Guarantee Micro-Badges */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiCheck size={14} color="var(--success)" />
                <span>{isAr ? 'سداد مباشر وآمن ومؤكد عبر USDT (شبكة TRC-20)' : 'Secure Direct Payment via USDT (TRC-20 Network)'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiCheck size={14} color="var(--success)" />
                <span>{isAr ? 'إرسال رابط حضور الجلسة المباشرة وبيانات الدخول لبريدك فوراً' : 'Instant live session access link and credentials sent to your email'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <WebinarPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        session={session}
        onSuccess={() => {
          setIsRegisteredWebinar(true);
          setShowPaymentModal(false);
          showToast.success(
            isAr
              ? 'تم استلام الدفعة وسداد الرسوم وتأكيد حجز مقعدك بنجاح!'
              : 'Payment received & webinar seat confirmed successfully!'
          );
        }}
        user={user}
      />
    </section>
  );
}
