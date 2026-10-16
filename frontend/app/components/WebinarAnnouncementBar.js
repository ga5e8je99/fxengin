'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiX, FiLock, FiCreditCard, FiClock, FiVideo, FiArrowLeft, FiArrowRight, FiRadio } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { fetchLiveSessions } from '../services/liveService';

export default function WebinarAnnouncementBar({ isOpen = true, onClose, onOpenModal, onVisibilityChange }) {
  const { isAr } = useLanguage();
  const [session, setSession] = useState(null);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Fetch active or upcoming live session from API (GET /live)
  useEffect(() => {
    let isMounted = true;
    async function loadSessions() {
      try {
        const res = await fetchLiveSessions();
        if (!isMounted) return;
        if (res?.success) {
          const active =
            res.liveNow && res.liveNow.length > 0
              ? res.liveNow[0]
              : res.upcoming && res.upcoming.length > 0
              ? res.upcoming[0]
              : null;
          setSession(active);
          if (onVisibilityChange) onVisibilityChange(Boolean(active));
        } else {
          setSession(null);
          if (onVisibilityChange) onVisibilityChange(false);
        }
      } catch (e) {
        setSession(null);
        if (onVisibilityChange) onVisibilityChange(false);
      }
    }
    loadSessions();
    const interval = setInterval(loadSessions, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [onVisibilityChange]);

  // Ticking countdown timer
  useEffect(() => {
    if (!session?.scheduledStartTime) return;
    const targetDate = new Date(session.scheduledStartTime);
    if (isNaN(targetDate.getTime())) return;

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

  // Do NOT display the bar if closed or if no active/upcoming session is in the database
  if (!isOpen || !session) return null;

  const isLive = session?.status === 'LIVE';
  const isFree = session?.isFree === true || session?.price === 0;
  const sessionPrice = isFree ? 0 : (session?.price || 49);
  const sessionTitle = (isAr ? session?.titleAr : session?.titleEn) || session?.title || (isAr ? 'جلسة بث مباشر' : 'Live Stream');
  const instructor = session?.instructorName || (isAr ? 'محاضر الأكاديمية' : 'Academy Instructor');

  const handleAction = (e) => {
    e.preventDefault();
    if (isLive && (session?.slug || session?.id)) {
      window.location.href = `/live/${session.slug || session.id}`;
      return;
    }
    if (onOpenModal) {
      onOpenModal();
    } else {
      const el = document.getElementById('live-webinar');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <aside
      aria-label={isAr ? 'إعلان البث المباشر القادم' : 'Upcoming Live Webinar Announcement'}
      style={{
        position: 'fixed',
        top: 'calc(var(--header-height, 4.5rem) + var(--ticker-height, 2.75rem))',
        insetInline: 0,
        zIndex: 90,
        height: 'var(--announcement-height, 2.375rem)',
        background: 'linear-gradient(90deg, rgba(6, 20, 47, 0.98) 0%, rgba(14, 38, 77, 0.96) 50%, rgba(6, 20, 47, 0.98) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: 'none',
        borderBottom: isLive ? '1px solid rgba(22, 199, 132, 0.45)' : '1px solid rgba(251, 135, 4, 0.35)',
        boxShadow: '0 4px 16px rgba(0, 3, 13, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 clamp(0.75rem, 2vw, 1.5rem)',
        overflow: 'hidden',
        fontSize: '0.8125rem',
        color: 'var(--text-primary)',
      }}
    >
      {/* Background Subtle Ambient Glow Line */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: isLive
            ? 'linear-gradient(90deg, transparent, rgba(22, 199, 132, 0.7), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(251, 135, 4, 0.6), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Container Content */}
      <div
        style={{
          width: '100%',
          maxWidth: 'var(--container-max, 96rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'clamp(0.5rem, 1.5vw, 1.25rem)',
        }}
      >
        {/* Left Side: Tag Badge & Title Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(0.5rem, 1vw, 0.75rem)',
            minWidth: 0,
            flex: '1 1 auto',
          }}
        >
          {/* Animated Pulsing Dot & Badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: isLive ? 'rgba(22, 199, 132, 0.18)' : 'rgba(246, 70, 93, 0.15)',
              border: isLive ? '1px solid rgba(22, 199, 132, 0.5)' : '1px solid rgba(246, 70, 93, 0.4)',
              color: isLive ? '#16C784' : '#F6465D',
              borderRadius: '1rem',
              padding: '0.125rem 0.5rem',
              fontSize: '0.6875rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: '0.375rem',
                height: '0.375rem',
                borderRadius: '50%',
                background: isLive ? '#16C784' : '#F6465D',
                boxShadow: isLive ? '0 0 8px #16C784' : '0 0 8px #F6465D',
                animation: 'pulse 1.5s infinite',
              }}
            />
            {isLive ? (isAr ? 'بث مباشر حي الآن' : 'LIVE NOW') : (isAr ? 'محاضرة بث مباشر قادمة' : 'LIVE WEBINAR')}
          </span>

          {/* Title & Instructor */}
          <div
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: 'clamp(0.75rem, 0.9vw, 0.8125rem)',
              color: 'var(--text-primary)',
            }}
          >
            <span style={{ fontWeight: 700 }}>
              {sessionTitle}
            </span>
            <span
              className="hide-mobile"
              style={{
                color: 'var(--text-muted)',
                marginInlineStart: '0.5rem',
                fontSize: '0.75rem',
              }}
            >
              • {instructor}
            </span>
          </div>
        </div>

        {/* Center / Right Side: Real-time Countdown Timer + Price + CTA + Close */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(0.5rem, 1vw, 0.875rem)',
            flexShrink: 0,
          }}
        >
          {/* Live Status or Live Countdown Display */}
          {isLive ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: 'rgba(22, 199, 132, 0.15)',
                border: '1px solid rgba(22, 199, 132, 0.35)',
                padding: '0.125rem 0.5rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                color: '#16C784',
                fontWeight: 800,
              }}
            >
              <FiVideo size={12} />
              <span>{isAr ? 'البث شغال الآن' : 'Streaming Now'}</span>
            </div>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(251, 135, 4, 0.25)',
                padding: '0.125rem 0.5rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              <FiClock size={12} color="var(--accent)" />
              <span style={{ color: 'var(--text-secondary)' }} className="hide-mobile">
                {isAr ? 'يبدأ خلال:' : 'Starts in:'}
              </span>
              <span style={{ color: 'var(--accent)' }}>
                {String(timeLeft.days).padStart(2, '0')}{isAr ? 'ي' : 'd'}{' '}
                {String(timeLeft.hours).padStart(2, '0')}{isAr ? 'س' : 'h'}{' '}
                {String(timeLeft.minutes).padStart(2, '0')}{isAr ? 'د' : 'm'}{' '}
                {String(timeLeft.seconds).padStart(2, '0')}{isAr ? 'ث' : 's'}
              </span>
            </div>
          )}

          {/* Price Badge */}
          <span
            className="hide-mobile"
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: isFree ? '#16C784' : 'var(--accent)',
              background: isFree ? 'rgba(22, 199, 132, 0.12)' : 'rgba(251, 135, 4, 0.12)',
              border: isFree ? '1px solid rgba(22, 199, 132, 0.3)' : '1px solid rgba(251, 135, 4, 0.3)',
              padding: '0.125rem 0.45rem',
              borderRadius: '0.25rem',
              fontFamily: 'monospace',
            }}
          >
            {isFree ? (isAr ? 'مجاناً' : 'FREE') : `${sessionPrice} USDT`}
          </span>

          {/* Action CTA Button */}
          <button
            type="button"
            onClick={handleAction}
            style={{
              background: isLive ? 'linear-gradient(135deg, #16C784 0%, #0488F8 100%)' : 'linear-gradient(135deg, #FB8704 0%, #F6465D 100%)',
              border: 'none',
              borderRadius: '0.375rem',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.25rem 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: isLive ? '0 2px 10px rgba(22, 199, 132, 0.4)' : '0 2px 10px rgba(251, 135, 4, 0.35)',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = isLive ? '0 4px 14px rgba(22, 199, 132, 0.6)' : '0 4px 14px rgba(251, 135, 4, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = isLive ? '0 2px 10px rgba(22, 199, 132, 0.4)' : '0 2px 10px rgba(251, 135, 4, 0.35)';
            }}
          >
            {isLive ? <FiVideo size={12} /> : <FiCreditCard size={12} />}
            <span>{isLive ? (isAr ? 'دخول البث الآن' : 'Watch Live') : (isAr ? 'احجز مقعدك' : 'Book Seat')}</span>
            {isAr ? <FiArrowLeft size={11} /> : <FiArrowRight size={11} />}
          </button>

          {/* Dismiss Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={isAr ? 'إغلاق الإعلان' : 'Dismiss announcement'}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.25rem',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <FiX size={14} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
