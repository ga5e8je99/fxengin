'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function ScrollToTop() {
  const { isAr } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined') return;

    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (totalHeight > 0) {
      const progress = Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100));
      setScrollProgress(progress);
    }

    if (currentScroll > 280) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted, handleScroll]);

  const scrollToTop = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Prevent any server-client hydration mismatch for browser floating window component
  if (!mounted) {
    return null;
  }

  // SVG Circular progress bar measurements (Exact 50x50 coordinate system)
  const strokeWidth = 2.75;
  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className="scroll-to-top-btn-wrapper"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: 'opacity 0.35s cubic-bezier(0.25, 1, 0.5, 1), transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
      }}
    >
      <button
        type="button"
        onClick={scrollToTop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={isAr ? 'الرجوع إلى أعلى الصفحة' : 'Scroll to top of page'}
        title={isAr ? 'الرجوع للأعلى' : 'Back to top'}
        style={{
          position: 'relative',
          width: '50px',
          height: '50px',
          minWidth: '50px',
          minHeight: '50px',
          borderRadius: '50%',
          border: 'none',
          padding: 0,
          background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.94) 0%, rgba(1, 7, 30, 0.98) 100%)',
          boxShadow: isHovered
            ? '0 0 25px rgba(251, 135, 4, 0.45), 0 10px 28px rgba(0, 3, 13, 0.85)'
            : '0 8px 24px rgba(0, 3, 13, 0.75), 0 0 12px rgba(4, 136, 248, 0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          transform: isHovered ? 'translateY(-3px)' : 'none',
          overflow: 'hidden',
        }}
      >
        {/* Unified SVG: Progress Ring and 100% Centered Arrow in Exact Same Coordinate System */}
        <svg
          width="50"
          height="50"
          viewBox="0 0 50 50"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <linearGradient id="scrollProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FB8704" />
              <stop offset="60%" stopColor="#FFAE35" />
              <stop offset="100%" stopColor="#0488F8" />
            </linearGradient>
          </defs>

          {/* Background Track Circle */}
          <circle
            cx="25"
            cy="25"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={strokeWidth}
          />

          {/* Animated Progress Circle (Starts at 12 o'clock, rotates around exact center 25, 25) */}
          <circle
            cx="25"
            cy="25"
            r={radius}
            fill="none"
            stroke="url(#scrollProgressGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 25 25)"
            style={{
              transition: 'stroke-dashoffset 0.15s ease-out',
            }}
          />

          {/* Mathematically & Optically Centered Upward Arrow (Center X=25.0, Center Y=25.0) */}
          <g
            stroke={isHovered ? '#FB8704' : '#FFFFFF'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: 'stroke 0.2s ease',
            }}
          >
            {/* Center vertical stem: from Y=16.5 to Y=33.5, midpoint = 25.0 */}
            <line x1="25" y1="16.5" x2="25" y2="33.5" />
            {/* Symmetrical chevron wings: Left (X=18, Y=23.5) -> Tip (X=25, Y=16.5) -> Right (X=32, Y=23.5) */}
            <polyline points="18 23.5 25 16.5 32 23.5" fill="none" />
          </g>
        </svg>
      </button>
    </div>
  );
}
