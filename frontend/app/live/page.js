'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FiRadio,
  FiPlay,
  FiCalendar,
  FiClock,
  FiUsers,
  FiUser,
  FiArrowRight,
  FiArrowLeft,
  FiVideo,
  FiCheckCircle,
  FiTrendingUp,
  FiShield,
  FiLayers,
} from 'react-icons/fi';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import { fetchLiveSessions } from '../services/liveService';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePageLoading } from '../context/LoadingContext';
import { getAppRoute } from '../utils/routes';

export default function LiveStreamsPage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();

  const [liveData, setLiveData] = useState({
    liveNow: [],
    upcoming: [],
    replays: [],
    totalActiveCount: 0,
    totalUpcomingCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Keep global brand PageLoader visible until live sessions complete
  usePageLoading(loading, 'live_page');

  useEffect(() => {
    let isMounted = true;
    async function loadSessions() {
      try {
        const res = await fetchLiveSessions();
        if (isMounted && res.success) {
          setLiveData(res);
        }
      } catch (err) {
        console.warn('Failed to load live sessions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSessions();

    // Recheck live status every 30 seconds
    const interval = setInterval(loadSessions, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const hasLiveNow = liveData.liveNow && liveData.liveNow.length > 0;
  const primaryLive = hasLiveNow ? liveData.liveNow[0] : null;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        background: 'var(--bg-primary, #01071E)',
        color: '#F5F7FA',
        minHeight: '100vh',
        paddingBottom: '100px',
      }}
    >
      {/* ── 1. Hero Header Section ── */}
      <section
        style={{
          position: 'relative',
          padding: '60px 0 50px',
          overflow: 'hidden',
          borderBottom: '1px solid #12315C',
        }}
      >
        <PageHeroBackground />
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 }}>
          <Anim>
            <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
              {/* Pulsing Live Pill */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(246, 70, 93, 0.15)', border: '1px solid rgba(246, 70, 93, 0.4)', borderRadius: '30px', marginBottom: '18px' }}>
                <span
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: '#F6465D',
                    boxShadow: '0 0 10px #F6465D',
                    display: 'inline-block',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#F6465D', letterSpacing: '0.5px' }}>
                  {isAr ? 'البث المباشر وغرفة التداول الحية' : 'LIVE TRADING DESK & BROADCASTS'}
                </span>
              </div>

              <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, lineHeight: 1.25, margin: '0 0 16px 0', color: '#FFF' }}>
                {isAr ? 'جلسات التداول الحية والتحليل المؤسسي المباشر' : 'Institutional Live Streams & Market Floor'}
              </h1>
              <p style={{ fontSize: '15.5px', color: '#A7AFBF', lineHeight: 1.7, margin: '0 auto 28px', maxWidth: '720px' }}>
                {isAr
                  ? 'انضم إلى كبار المحللين الماليين يومياً أثناء افتتاح الجلسات العالمية (لندن ونيويورك) لمتابعة تدفق السيولة، صفقات الذهب، واقتناص الفرص اللحظية مباشرة.'
                  : 'Join institutional strategists live during London & New York session opens to track order flow, gold liquidity, and real-time trade setups.'}
              </p>
            </div>
          </Anim>
        </div>
      </section>

      {/* ── 2. Active Live Now Session (Featured Hero Card) ── */}
      <section style={{ padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          {hasLiveNow ? (
            <Anim>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.95), rgba(1, 7, 30, 0.98))',
                  border: '1px solid rgba(251, 135, 4, 0.4)',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(251, 135, 4, 0.15)',
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.8fr',
                  gap: '36px',
                  alignItems: 'center',
                }}
                className="live-featured-grid"
              >
                {/* Left Side: Video Preview Thumbnail */}
                <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', aspectRatio: '16 / 9', background: '#000', boxShadow: '0 12px 30px rgba(0,0,0,0.8)' }}>
                  <img
                    src={primaryLive.coverImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80'}
                    alt={primaryLive.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                  />
                  {/* Floating Badges */}
                  <div style={{ position: 'absolute', top: '14px', right: isAr ? '14px' : 'auto', left: isAr ? 'auto' : '14px', display: 'flex', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F6465D', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFF', display: 'inline-block' }} />
                      LIVE NOW
                    </span>
                    <span style={{ background: 'rgba(0,0,0,0.75)', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, backdropFilter: 'blur(8px)' }}>
                      {primaryLive.streamType || 'STREAM'}
                    </span>
                  </div>

                  {/* Play Trigger */}
                  <Link
                    href={user ? getAppRoute(`/live/${primaryLive.slug || primaryLive.id}`, user) : `/login?redirect=${encodeURIComponent(`/live/${primaryLive.slug || primaryLive.id}`)}`}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      background: 'rgba(0,0,0,0.3)',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(251, 135, 4, 0.95)',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 25px rgba(251, 135, 4, 0.8)',
                        transform: 'scale(1)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <FiPlay size={28} style={{ marginInlineStart: '4px' }} />
                    </div>
                  </Link>
                </div>

                {/* Right Side: Session Details & CTA */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--accent)', background: 'rgba(251, 135, 4, 0.15)', padding: '3px 10px', borderRadius: '6px' }}>
                      {isAr ? 'جلسة بث مباشر نشطة حالياً' : 'Active Session'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#A7AFBF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiUsers size={13} color="#16C784" />
                      {primaryLive.maxParticipants || 500} {isAr ? 'متداول متصل' : 'viewers'}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.35, margin: '0 0 14px 0', color: '#F5F7FA' }}>
                    {primaryLive.title}
                  </h2>
                  <p style={{ fontSize: '14px', color: '#A7AFBF', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                    {primaryLive.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#01071E', border: '1px solid #12315C', borderRadius: '10px', marginBottom: '24px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(4, 136, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0488F8' }}>
                      <FiUser size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFF' }}>
                        {primaryLive.instructorName || (isAr ? 'كبير المحللين الفنيين' : 'Senior Market Analyst')}
                      </div>
                      <div style={{ fontSize: '11px', color: '#687287' }}>
                        {isAr ? 'غرفة التحليل الحي • شات مباشر' : 'Live Floor • Interactive Chat'}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={user ? getAppRoute(`/live/${primaryLive.slug || primaryLive.id}`, user) : `/login?redirect=${encodeURIComponent(`/live/${primaryLive.slug || primaryLive.id}`)}`}
                    className="btn-primary"
                    style={{
                      height: '50px',
                      fontSize: '15px',
                      fontWeight: 800,
                      textDecoration: 'none',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, var(--accent), #F6465D)',
                      boxShadow: '0 6px 25px rgba(251, 135, 4, 0.45)',
                      width: '100%',
                    }}
                  >
                    <FiRadio size={18} />
                    <span>{isAr ? 'دخول قاعة البث المباشر والشات الآن ←' : 'Enter Live Broadcast Room & Chat →'}</span>
                  </Link>
                </div>
              </div>
            </Anim>
          ) : (
            /* Standby Banner when no stream is live right now */
            <Anim>
              <div
                style={{
                  background: '#06142F',
                  border: '1px solid #12315C',
                  borderRadius: '16px',
                  padding: '40px 32px',
                  textAlign: 'center',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(4, 136, 248, 0.15)',
                    border: '1px solid rgba(4, 136, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0488F8',
                    margin: '0 auto 16px',
                  }}
                >
                  <FiRadio size={28} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 8px 0' }}>
                  {isAr ? 'لا يوجد بث مباشر نشط في هذه اللحظة' : 'No Live Stream Currently Active'}
                </h3>
                <p style={{ fontSize: '14px', color: '#A7AFBF', maxWidth: '600px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                  {isAr
                    ? 'تبدأ جلساتنا الحية يومياً مع افتتاح بورصة نيويورك في تمام الساعة 2:30 ظهراً بتوقيت غرينتش. راجع الجدول أدناه للمواعيد القادمة.'
                    : 'Our daily live analysis kicks off during the New York session open at 14:30 UTC. Check upcoming scheduled sessions below.'}
                </p>
                <Link
                  href={getAppRoute('/courses', user)}
                  className="btn-secondary"
                  style={{
                    height: '42px',
                    padding: '0 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                  }}
                >
                  {isAr ? 'استكشف مسارات الكورسات التدريبية' : 'Explore Certified Courses'}
                </Link>
              </div>
            </Anim>
          )}
        </div>
      </section>

      {/* ── 3. Upcoming Scheduled Sessions ── */}
      <section style={{ padding: '30px 0 60px' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 6px 0' }}>
                {isAr ? 'الجلسات والورشات القادمة' : 'Upcoming Live Sessions'}
              </h3>
              <p style={{ fontSize: '13.5px', color: '#A7AFBF', margin: 0 }}>
                {isAr ? 'احجز موعدك مع نخبة المتداولين ولا تفوت افتتاح الأسواق الكبرى' : 'Add to calendar and catch high-impact market openings'}
              </p>
            </div>
          </div>

          {liveData.upcoming && liveData.upcoming.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {liveData.upcoming.map((session, idx) => (
                <Anim key={session.id || idx} delay={idx * 60}>
                  <div
                    style={{
                      background: '#06142F',
                      border: '1px solid #12315C',
                      borderRadius: '14px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0488F8';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#12315C';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0488F8', background: 'rgba(4, 136, 248, 0.12)', padding: '3px 8px', borderRadius: '4px' }}>
                            {session.streamType || 'LIVE'}
                          </span>
                          {!session.isFree || Number(session.price) > 0 ? (
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#FB8704', background: 'rgba(251, 135, 4, 0.15)', border: '1px solid rgba(251, 135, 4, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                              ${Number(session.price) || 0} {session.currency || 'USDT'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#16C784', background: 'rgba(22, 199, 132, 0.15)', border: '1px solid rgba(22, 199, 132, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                              {isAr ? 'مجاني' : 'FREE'}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiClock size={13} />
                          {session.scheduledStartTime ? (
                            !isNaN(new Date(session.scheduledStartTime).getTime())
                              ? new Date(session.scheduledStartTime).toLocaleString(isAr ? 'ar-SA' : 'en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : session.scheduledStartTime
                          ) : '—'}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#F5F7FA', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                        {session.title}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#A7AFBF', marginBottom: '20px' }}>
                        <FiUser size={14} color="#0488F8" />
                        <span>{session.instructorName || (isAr ? 'محاضر الأكاديمية' : 'Academy Instructor')}</span>
                      </div>
                    </div>

                    <Link
                      href={user ? getAppRoute(`/live/${session.slug || session.id}`, user) : `/login?redirect=${encodeURIComponent(`/live/${session.slug || session.id}`)}`}
                      className="btn-secondary"
                      style={{
                        height: '40px',
                        fontSize: '13px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        justifyContent: 'center',
                        gap: '6px',
                        width: '100%',
                      }}
                    >
                      <FiCalendar size={14} />
                      <span>{isAr ? 'دخول قاعة البث' : 'Join Room'}</span>
                    </Link>
                  </div>
                </Anim>
              ))}
            </div>
          ) : (
            <Anim>
              <div
                style={{
                  background: '#06142F',
                  border: '1px solid #12315C',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  maxWidth: '640px',
                  margin: '0 auto',
                  boxShadow: '0 8px 32px rgba(0, 3, 13, 0.4)',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(251, 135, 4, 0.12)',
                    border: '1px solid rgba(251, 135, 4, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent, #FB8704)',
                    margin: '0 auto 16px',
                  }}
                >
                  <FiCalendar size={26} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 8px' }}>
                  {isAr ? 'لا توجد جلسات بث مباشر مجدولة حالياً' : 'No Upcoming Live Sessions Scheduled'}
                </h4>
                <p style={{ fontSize: '13.5px', color: '#A7AFBF', lineHeight: 1.6, margin: '0 0 20px' }}>
                  {isAr
                    ? 'يقوم فريق المحللين بجدولة الجلسات الحية والورشات دورياً. يمكنك متابعة التحديثات أو استعراض الكورسات والتحليلات الفنية المتاحة.'
                    : 'Our senior analysts schedule live sessions periodically. Check back soon or explore our certified courses and market analyses.'}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link
                    href={getAppRoute('/courses', user)}
                    className="btn-primary"
                    style={{
                      height: '42px',
                      padding: '0 20px',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{isAr ? 'استعراض الكورسات' : 'Explore Courses'}</span>
                  </Link>
                  <Link
                    href={getAppRoute('/analyses', user)}
                    className="btn-secondary"
                    style={{
                      height: '42px',
                      padding: '0 20px',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{isAr ? 'استعراض التحليلات' : 'View Analyses'}</span>
                  </Link>
                </div>
              </div>
            </Anim>
          )}
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 960px) {
          .live-featured-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
