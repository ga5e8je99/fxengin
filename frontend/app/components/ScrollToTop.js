'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiArrowUp } from 'react-icons/fi';
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

  // SVG Circular progress bar measurements
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
          width: '3.125rem',
          height: '3.125rem',
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
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          transform: isHovered ? 'translateY(-3px)' : 'none',
        }}
      >
        {/* SVG Progress Ring */}
        <svg
          width="50"
          height="50"
          viewBox="0 0 50 50"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: 'rotate(-90deg)',
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
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
          />

          {/* Animated Progress Circle */}
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
            style={{
              transition: 'stroke-dashoffset 0.15s ease-out',
            }}
          />
        </svg>

        {/* Upward Arrow Icon */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isHovered ? '#FB8704' : '#FFFFFF',
            transition: 'color 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isHovered ? 'translateY(-2px)' : 'none',
          }}
        >
          <FiArrowUp size={19} strokeWidth={2.5} />
        </div>
      </button>
    </div>
  );
}
