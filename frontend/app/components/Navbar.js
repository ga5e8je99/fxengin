'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  FiLogIn,
  FiArrowLeft,
  FiArrowRight,
  FiGlobe,
  FiUser,
  FiLogOut,
  FiBookOpen,
  FiChevronDown,
  FiShield,
  FiMenu,
  FiX,
  FiAward,
  FiTrendingUp,
  FiDollarSign,
  FiCopy,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import { getAppRoute } from '../utils/routes';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, toggleLocale, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [partnerDropdownOpen, setPartnerDropdownOpen] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [partnerData, setPartnerData] = useState(null);
  const userDropdownRef = useRef(null);
  const partnerDropdownRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!userDropdownOpen && !partnerDropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (partnerDropdownRef.current && !partnerDropdownRef.current.contains(e.target)) {
        setPartnerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [userDropdownOpen, partnerDropdownOpen]);

  const activeUser = mounted ? user : null;
  const activeIsAuthenticated = mounted ? isAuthenticated : false;

  // Sync partner / 10% community status
  useEffect(() => {
    if (!mounted) return;

    if (!activeUser?.id) {
      setIsPartner(false);
      setPartnerData(null);
      return;
    }

    // Optimistic read from storage
    try {
      if (localStorage.getItem('fxengin_is_partner') === 'true') {
        setIsPartner(true);
      }
    } catch (e) {}

    let isSubscribed = true;

    const checkPartnerStatus = async () => {
      try {
        const res = await fetch(
          `/api/affiliate?userId=${encodeURIComponent(activeUser.id)}&email=${encodeURIComponent(activeUser.email || '')}&_t=${Date.now()}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.isPartner && json.partner && isSubscribed) {
            setIsPartner(true);
            setPartnerData(json.partner);
            try {
              localStorage.setItem('fxengin_is_partner', 'true');
            } catch (e) {}
            return;
          }
        }

        const compRes = await fetch(
          `/api/competition/qualification?userId=${encodeURIComponent(activeUser.id)}&_t=${Date.now()}`
        );
        if (compRes.ok) {
          const compJson = await compRes.json();
          const comm = compJson.participant?.tasks?.community;
          if ((comm?.completed || comm?.joined) && isSubscribed) {
            setIsPartner(true);
            try {
              localStorage.setItem('fxengin_is_partner', 'true');
            } catch (e) {}
            return;
          }
        }

        if (isSubscribed) {
          setIsPartner(false);
          setPartnerData(null);
          try {
            localStorage.removeItem('fxengin_is_partner');
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Navbar affiliate check error:', err);
      }
    };

    checkPartnerStatus();

    const onPartnerStatusChanged = (e) => {
      if (e.detail?.isPartner) {
        setIsPartner(true);
        if (e.detail.partner) setPartnerData(e.detail.partner);
        try {
          localStorage.setItem('fxengin_is_partner', 'true');
        } catch (e) {}
      } else {
        checkPartnerStatus();
      }
    };

    window.addEventListener('fxengin:partner_status_changed', onPartnerStatusChanged);

    return () => {
      isSubscribed = false;
      window.removeEventListener('fxengin:partner_status_changed', onPartnerStatusChanged);
    };
  }, [mounted, activeUser?.id, activeUser?.email]);

  const authRedirectQuery =
    pathname && pathname !== '/login' && pathname !== '/register'
      ? `?redirect=${encodeURIComponent(pathname)}`
      : '';

  const handleAuthNav = () => {
    if (typeof window !== 'undefined') {
      const fullPath = window.location.pathname + window.location.search;
      if (fullPath && !fullPath.startsWith('/login') && !fullPath.startsWith('/register')) {
        try {
          sessionStorage.setItem('fxengin_return_url', fullPath);
        } catch (e) {}
      }
    }
  };

  const NAV = [
    { key: 'home', label: t.navbar.home, rawHref: '/', href: getAppRoute('/', activeUser) },
    ...(activeIsAuthenticated && activeUser ? [{ key: 'trading', label: locale === 'ar' ? 'مسابقة FX' : 'FX Competition', rawHref: '/trading', href: getAppRoute('/trading', activeUser) }] : []),
    { key: 'courses', label: t.navbar.courses, rawHref: '/courses', href: getAppRoute('/courses', activeUser) },
    { key: 'markets', label: t.navbar.markets, rawHref: '/markets', href: getAppRoute('/markets', activeUser) },
    { key: 'analyses', label: t.navbar.analyses, rawHref: '/analyses', href: getAppRoute('/analyses', activeUser) },
    { key: 'live', label: locale === 'ar' ? 'البث المباشر' : 'Live Streams', rawHref: '/live', href: getAppRoute('/live', activeUser) },
    { key: 'blog', label: t.navbar.blog, rawHref: '/blog', href: getAppRoute('/blog', activeUser) },
    { key: 'offers', label: t.navbar.offers || (locale === 'ar' ? 'عروض' : 'Offers'), rawHref: '/offers', href: getAppRoute('/offers', activeUser) },
    { key: 'openAccount', label: t.navbar.openAccount, rawHref: '/open-account', href: getAppRoute('/open-account', activeUser) },
    ...(isPartner ? [{ key: 'affiliate', label: locale === 'ar' ? 'برنامج الشركاء' : 'Partner Program', rawHref: '/join-us', href: getAppRoute('/join-us', activeUser) }] : []),
    { key: 'contact', label: t.navbar.contact, rawHref: '/contact', href: getAppRoute('/contact', activeUser) },
  ];

  const isLinkActive = (item) => {
    let raw = typeof item === 'object' && item !== null ? (item.rawHref || item.href) : item;
    if (!raw || !pathname) return false;
    if (typeof raw === 'string' && activeUser?.id && raw.startsWith(`/${activeUser.id}`)) {
      raw = raw.replace(`/${activeUser.id}`, '') || '/';
    }
    if (raw === '/') {
      if (pathname === '/') return true;
      if (activeUser?.id && pathname === `/${activeUser.id}`) return true;
      const segments = (pathname || '').split('/').filter(Boolean);
      return (
        segments.length === 1 &&
        !['courses', 'markets', 'analyses', 'live', 'blog', 'offers', 'contact', 'login', 'register', 'profile', 'open-account', 'checkout', 'brokers', 'join-us', 'trading'].includes(segments[0])
      );
    }
    return (
      pathname === raw ||
      pathname.startsWith(`${raw}/`) ||
      pathname.endsWith(raw) ||
      pathname.includes(`${raw}/`)
    );
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          insetInline: 0,
          zIndex: 100,
          height: 'var(--header-height, 4.5rem)',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(18, 49, 92, 0.25)',
          background: scrolled
            ? 'rgba(1, 7, 30, 0.72)'
            : 'rgba(1, 7, 30, 0.52)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: scrolled
            ? '0 12px 36px rgba(0, 3, 13, 0.75), 0 1px 0 rgba(4, 136, 248, 0.12)'
            : '0 4px 20px rgba(0, 3, 13, 0.45)',
          transition: 'all 0.3s ease',
        }}
      >
        <div
          className="container-wide"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 'var(--container-wide-max, 108rem)',
            marginInline: 'auto',
            paddingInline: 'clamp(1rem, 2.5vw, 2.5rem)',
          }}
        >

          {/* ── Brand / Logo ─────────────────────────────── */}
          <Link
            href={getAppRoute('/', activeUser)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.625rem',
              textDecoration: 'none',
              direction: 'ltr',
              flexShrink: 0,
            }}
          >
            <img
              src="/assets/Images/Logo/logo.webp"
              alt="FXENGIN Logo"
              style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain' }}
            />
            <span
              className="hide-mobile"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: '1.25rem',
                letterSpacing: '1px',
                background: 'var(--accent-gradient, linear-gradient(135deg, #FA5A04 0%, #FB8704 100%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block',
              }}
            >
              FXENGIN
            </span>
          </Link>

          {/* ── Desktop Navigation Links ───────────────── */}
          <nav
            className="hide-mobile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(0.2rem, 0.45vw, 0.5rem)',
              flexWrap: 'nowrap',
            }}
          >
            {NAV.map(({ key, label, href, rawHref }) => {
              const isActive = isLinkActive(rawHref || href);
              return (
                <Link
                  key={key}
                  href={href}
                  style={{
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: 'clamp(0.8125rem, 0.85vw, 0.9375rem)',
                    fontWeight: isActive ? 600 : 500,
                    padding: '0.5rem clamp(0.5rem, 0.65vw, 0.875rem)',
                    borderRadius: '0.375rem',
                    background: isActive ? 'rgba(4, 136, 248, 0.08)' : 'transparent',
                    position: 'relative',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s ease, background 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {label}
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      bottom: '0',
                      insetInline: '0.875rem',
                      height: '0.125rem',
                      background: 'var(--primary)',
                      borderRadius: '0.125rem',
                    }} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── CTAs & Language Switcher ─────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
            {/* Language Switcher Toggle */}
            <button
              type="button"
              onClick={toggleLocale}
              aria-label="Toggle Language"
              title={t.navbar.langTitle}
              className="hide-mobile"
              style={{
                height: '2.5rem',
                padding: '0 0.875rem',
                background: 'rgba(6, 20, 47, 0.7)',
                border: '1px solid rgba(4, 136, 248, 0.2)',
                borderRadius: '9999px',
                color: 'var(--text-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Montserrat', sans-serif",
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.background = 'rgba(4, 136, 248, 0.12)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(4, 136, 248, 0.2)';
                e.currentTarget.style.background = 'rgba(6, 20, 47, 0.7)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <FiGlobe size={15} color="var(--primary)" />
              <span>{t.navbar.langLabel}</span>
            </button>

            {/* Auth Actions: Logged In vs Logged Out */}
            {activeIsAuthenticated && activeUser ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem' }}>
                {!isPartner && (
                  <Link
                    href={getAppRoute('/join-us', activeUser)}
                    onClick={() => {
                      if (typeof window !== 'undefined' && pathname?.includes('/join-us')) {
                        const el = document.getElementById('join-us');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    title={locale === 'ar' ? 'انضم إلينا واربح +10% عمولة فورية' : 'Join Us & Earn +10%'}
                    style={{
                      height: '2.5rem',
                      padding: '0.35rem 0.95rem',
                      background: 'linear-gradient(180deg, rgba(10, 27, 61, 0.85) 0%, rgba(6, 20, 47, 0.85) 100%)',
                      border: '1.5px solid rgba(0, 230, 118, 0.55)',
                      borderRadius: '9999px',
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 10px rgba(0, 3, 13, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00E676';
                      e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 230, 118, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.55)';
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 3, 13, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <FiTrendingUp size={15} color="#00E676" />
                    <span>{locale === 'ar' ? 'انضم إلينا' : 'Join Us'}</span>
                    <span
                      style={{
                        background: 'rgba(0, 230, 118, 0.18)',
                        color: '#00E676',
                        border: '1px solid rgba(0, 230, 118, 0.45)',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.6875rem',
                        fontWeight: 900,
                        lineHeight: 1.3,
                      }}
                    >
                      +10%
                    </span>
                  </Link>
                )}
                <div style={{ position: 'relative' }} ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserDropdownOpen((prev) => !prev);
                  }}
                  title={user.fullName || (locale === 'ar' ? 'حسابي' : 'My Account')}
                  style={{
                    height: '2.5rem',
                    paddingBlock: '0.25rem',
                    paddingInlineStart: '0.3125rem',
                    paddingInlineEnd: '0.75rem',
                    background: userDropdownOpen
                      ? 'linear-gradient(180deg, rgba(14, 35, 78, 0.95) 0%, rgba(8, 26, 61, 0.95) 100%)'
                      : 'linear-gradient(180deg, rgba(10, 27, 61, 0.75) 0%, rgba(6, 20, 47, 0.75) 100%)',
                    border: userDropdownOpen
                      ? '1px solid rgba(251, 135, 4, 0.55)'
                      : '1px solid rgba(4, 136, 248, 0.25)',
                    borderRadius: '9999px',
                    color: 'var(--text-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: userDropdownOpen
                      ? '0 4px 18px rgba(251, 135, 4, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                      : '0 2px 10px rgba(0, 3, 13, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(251, 135, 4, 0.55)';
                    e.currentTarget.style.boxShadow = '0 4px 18px rgba(251, 135, 4, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = userDropdownOpen ? 'rgba(251, 135, 4, 0.55)' : 'rgba(4, 136, 248, 0.25)';
                    e.currentTarget.style.boxShadow = userDropdownOpen
                      ? '0 4px 18px rgba(251, 135, 4, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                      : '0 2px 10px rgba(0, 3, 13, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {/* Luxury Avatar Initial with Live Status Dot */}
                  <div style={{ position: 'relative', width: '2rem', height: '2rem', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FB8704 0%, #FA5A04 100%)',
                        color: '#FFFFFF',
                        fontSize: '0.875rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid rgba(255, 255, 255, 0.35)',
                        boxShadow: '0 2px 8px rgba(251, 135, 4, 0.4)',
                      }}
                    >
                      {user.fullName ? user.fullName.trim().charAt(0).toUpperCase() : 'U'}
                    </div>
                    {/* Live Online Indicator Dot */}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-1px',
                        insetInlineEnd: '-1px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#00E676',
                        border: '1.5px solid #06142F',
                        boxShadow: '0 0 6px #00E676',
                      }}
                    />
                  </div>

                  {/* User Name & Tier Badge */}
                  <div
                    className="hide-mobile"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'start',
                      lineHeight: 1.15,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        maxWidth: '5.5rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.fullName ? user.fullName.trim().split(' ')[0] : (locale === 'ar' ? 'حسابي' : 'Account')}
                    </span>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        color: (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isAdmin) ? '#00E676' : 'var(--accent)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isAdmin)
                        ? (locale === 'ar' ? 'مسؤول' : 'Admin')
                        : (locale === 'ar' ? 'متداول' : 'Trader')}
                    </span>
                  </div>

                  {/* Animated Chevron */}
                  <FiChevronDown
                    size={14}
                    style={{
                      color: 'rgba(255, 255, 255, 0.65)',
                      transform: userDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      flexShrink: 0,
                    }}
                  />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 0.625rem)',
                      insetInlineEnd: 0,
                      width: '16.5rem',
                      background: 'linear-gradient(180deg, rgba(8, 25, 59, 0.98) 0%, rgba(4, 15, 36, 0.98) 100%)',
                      border: '1px solid rgba(4, 136, 248, 0.22)',
                      borderRadius: '1rem',
                      boxShadow: '0 1.25rem 3rem rgba(0, 3, 13, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      padding: '0.75rem',
                      zIndex: 200,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    {/* User Card Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.625rem 0.75rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        marginBottom: '0.375rem',
                      }}
                    >
                      <div
                        style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #FB8704 0%, #FA5A04 100%)',
                          color: '#FFFFFF',
                          fontSize: '1rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(251, 135, 4, 0.4)',
                          flexShrink: 0,
                        }}
                      >
                        {user.fullName ? user.fullName.trim().charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {user.fullName || (locale === 'ar' ? 'متداول FXENGIN' : 'FXENGIN Trader')}
                        </div>
                        <div
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {user.email}
                        </div>
                        <div style={{ marginTop: '0.25rem', display: 'inline-flex', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              padding: '0.125rem 0.5rem',
                              borderRadius: '9999px',
                              background: (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isAdmin)
                                ? 'rgba(0, 230, 118, 0.15)'
                                : 'rgba(251, 135, 4, 0.15)',
                              color: (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isAdmin)
                                ? '#00E676'
                                : 'var(--accent)',
                              border: `1px solid ${(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isAdmin)
                                ? 'rgba(0, 230, 118, 0.3)'
                                : 'rgba(251, 135, 4, 0.3)'}`,
                            }}
                          >
                            {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isAdmin)
                              ? (locale === 'ar' ? 'مسؤول النظام' : 'Super Admin')
                              : (locale === 'ar' ? 'حساب نشط' : 'Active Account')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <Link
                      href={getAppRoute('/profile', user)}
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.625rem 0.75rem',
                        borderRadius: '0.625rem',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(4, 136, 248, 0.12)';
                        e.currentTarget.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                    >
                      <div
                        style={{
                          width: '1.875rem',
                          height: '1.875rem',
                          borderRadius: '0.5rem',
                          background: 'rgba(4, 136, 248, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <FiUser size={15} color="var(--primary)" />
                      </div>
                      <span>{t.navbar.profile || (locale === 'ar' ? 'الملف الشخصي والحساب' : 'Profile & Account')}</span>
                    </Link>

                    <Link
                      href={getAppRoute('/courses', user)}
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.625rem 0.75rem',
                        borderRadius: '0.625rem',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(251, 135, 4, 0.12)';
                        e.currentTarget.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                    >
                      <div
                        style={{
                          width: '1.875rem',
                          height: '1.875rem',
                          borderRadius: '0.5rem',
                          background: 'rgba(251, 135, 4, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <FiBookOpen size={15} color="var(--accent)" />
                      </div>
                      <span>{t.navbar.myCourses || (locale === 'ar' ? 'دوراتي التدريبية' : 'My Courses')}</span>
                    </Link>

                    {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isAdmin) && (
                      <a
                        href={process.env.NEXT_PUBLIC_ADMIN_URL || (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') ? 'http://186.240.145.87:3005' : 'http://localhost:3001')}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.625rem 0.75rem',
                          borderRadius: '0.625rem',
                          color: '#00E676',
                          textDecoration: 'none',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 230, 118, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div
                          style={{
                            width: '1.875rem',
                            height: '1.875rem',
                            borderRadius: '0.5rem',
                            background: 'rgba(0, 230, 118, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <FiShield size={15} color="#00E676" />
                        </div>
                        <span>{locale === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Dashboard'}</span>
                      </a>
                    )}

                    {/* Join Us / Partner Program in User Dropdown */}
                    {!isPartner ? (
                      <Link
                        href={getAppRoute('/join-us', activeUser)}
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (typeof window !== 'undefined' && pathname?.includes('/join-us')) {
                            const el = document.getElementById('join-us');
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth' });
                            }
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.625rem 0.75rem',
                          borderRadius: '0.625rem',
                          color: '#00E676',
                          background: 'rgba(0, 230, 118, 0.08)',
                          border: '1px solid rgba(0, 230, 118, 0.3)',
                          textDecoration: 'none',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 230, 118, 0.16)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 230, 118, 0.08)';
                        }}
                      >
                        <div
                          style={{
                            width: '1.875rem',
                            height: '1.875rem',
                            borderRadius: '0.5rem',
                            background: 'rgba(0, 230, 118, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <FiAward size={15} color="#00E676" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span>{locale === 'ar' ? 'انضم لمجتمع 10% أرباح' : 'Join 10% Community'}</span>
                          <span style={{ background: '#00E676', color: '#01071E', padding: '0.05rem 0.35rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900 }}>10%</span>
                        </div>
                      </Link>
                    ) : (
                      <Link
                        href={getAppRoute('/join-us', activeUser)}
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (typeof window !== 'undefined' && pathname?.includes('/join-us')) {
                            const el = document.getElementById('join-us');
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth' });
                            }
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.625rem 0.75rem',
                          borderRadius: '0.625rem',
                          color: '#00E676',
                          background: 'rgba(0, 230, 118, 0.1)',
                          border: '1px solid rgba(0, 230, 118, 0.35)',
                          textDecoration: 'none',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 230, 118, 0.18)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 230, 118, 0.1)';
                        }}
                      >
                        <div
                          style={{
                            width: '1.875rem',
                            height: '1.875rem',
                            borderRadius: '0.5rem',
                            background: 'rgba(0, 230, 118, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <FiTrendingUp size={15} color="#00E676" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span>{locale === 'ar' ? 'برنامج الشركاء (أرباحك)' : 'Partner Program (Profits)'}</span>
                          <span style={{ background: 'rgba(0, 230, 118, 0.2)', color: '#00E676', border: '1px solid rgba(0, 230, 118, 0.4)', padding: '0.05rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, fontFamily: 'monospace' }}>
                            ${Number(partnerData?.availableBalance || 0).toFixed(2)}
                          </span>
                        </div>
                      </Link>
                    )}

                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '0.375rem 0' }} />

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setPartnerDropdownOpen(false);
                        setIsPartner(false);
                        setPartnerData(null);
                        try {
                          localStorage.removeItem('fxengin_is_partner');
                        } catch (e) {}
                        logout();
                        showToast.info('تم تسجيل الخروج بنجاح');
                        router.push('/');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.625rem 0.75rem',
                        borderRadius: '0.625rem',
                        color: 'var(--error)',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'inherit',
                        width: '100%',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(246, 70, 93, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div
                        style={{
                          width: '1.875rem',
                          height: '1.875rem',
                          borderRadius: '0.5rem',
                          background: 'rgba(246, 70, 93, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <FiLogOut size={15} color="var(--error)" />
                      </div>
                      <span>{t.navbar.logout || (locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            ) : (
              <>
                {!isPartner && (
                  <Link
                    href="/join-us"
                    className="hide-mobile"
                    title={locale === 'ar' ? 'انضم إلينا واربح +10% عمولة فورية' : 'Join Us & Earn +10%'}
                    style={{
                      height: '2.5rem',
                      padding: '0.35rem 0.95rem',
                      background: 'linear-gradient(180deg, rgba(10, 27, 61, 0.85) 0%, rgba(6, 20, 47, 0.85) 100%)',
                      border: '1.5px solid rgba(0, 230, 118, 0.55)',
                      borderRadius: '9999px',
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 10px rgba(0, 3, 13, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00E676';
                      e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 230, 118, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.55)';
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 3, 13, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <FiTrendingUp size={15} color="#00E676" />
                    <span>{locale === 'ar' ? 'انضم إلينا' : 'Join Us'}</span>
                    <span
                      style={{
                        background: 'rgba(0, 230, 118, 0.18)',
                        color: '#00E676',
                        border: '1px solid rgba(0, 230, 118, 0.45)',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.6875rem',
                        fontWeight: 900,
                        lineHeight: 1.3,
                      }}
                    >
                      +10%
                    </span>
                  </Link>
                )}

                {/* Login Link */}
                <Link
                  href={`/login${authRedirectQuery}`}
                  onClick={handleAuthNav}
                  className="btn-ghost hide-mobile"
                  style={{ fontSize: '0.875rem', textDecoration: 'none' }}
                >
                  <FiLogIn size={15} />
                  {t.navbar.login}
                </Link>

                {/* Register Primary CTA */}
                <Link
                  href={`/register${authRedirectQuery}`}
                  onClick={handleAuthNav}
                  className="btn-primary"
                  style={{ fontSize: '0.875rem', padding: '0 1.25rem', minHeight: '2.5rem', textDecoration: 'none' }}
                >
                  {t.navbar.register}
                  <FiArrowLeft size={15} />
                </Link>
              </>
            )}

            {/* Hamburger Button (Mobile) */}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
              className="navbar-mobile-toggle"
              aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={menuOpen}
              style={{
                width: '2.625rem',
                height: '2.625rem',
                borderRadius: '0.625rem',
                background: 'rgba(6, 20, 47, 0.85)',
                border: '1px solid rgba(18, 49, 92, 0.6)',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                marginInlineStart: '0.375rem',
              }}
            >
              {menuOpen ? (
                <FiX size={22} color="var(--accent)" />
              ) : (
                <FiMenu size={22} color="var(--text-primary)" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Backdrop ─────────────────────── */}
      {menuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            top: 'var(--top-bars-height, 7rem)',
            background: 'rgba(0, 3, 13, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 98,
          }}
        />
      )}

      {/* ── Mobile Drawer ─────────────────────── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 'var(--top-bars-height, 7rem)',
          height: 'calc(100dvh - var(--top-bars-height, 7rem))',
          maxHeight: 'calc(100dvh - var(--top-bars-height, 7rem))',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          insetInlineEnd: menuOpen ? 0 : '-100%',
          width: '100%',
          maxWidth: '20rem',
          bottom: 0,
          background: 'var(--bg-primary)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 99,
          padding: '1.5rem 1.25rem 3rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          borderInlineStart: '1px solid var(--border)',
          boxShadow: '0 1.25rem 3.75rem rgba(0, 3, 13, 0.85)',
          transition: 'inset-inline-end 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {NAV.map(({ key, label, href, rawHref }) => {
          const isActive = isLinkActive(rawHref || href);
          return (
            <Link
              key={key}
              href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.9375rem',
                fontWeight: isActive ? 600 : 500,
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                background: isActive ? 'rgba(4, 136, 248, 0.1)' : 'transparent',
                display: 'block',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </Link>
          );
        })}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          {/* Mobile Language Switcher */}
          <button
            type="button"
            onClick={() => { toggleLocale(); setMenuOpen(false); }}
            style={{
              height: '2.625rem',
              padding: '0 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiGlobe size={16} color="var(--primary)" />
              <span>Language / اللغة</span>
            </span>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.125rem 0.5rem',
              borderRadius: '0.25rem',
              background: 'rgba(4, 136, 248, 0.15)',
              color: 'var(--primary)',
              fontWeight: 700,
            }}>
              {t.navbar.langLabel}
            </span>
          </button>

          {/* Mobile Join Us (+10%) Button when NOT joined */}
          {!isPartner && (
            <Link
              href={getAppRoute('/join-us', activeUser)}
              onClick={() => setMenuOpen(false)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                background: 'linear-gradient(180deg, rgba(10, 27, 61, 0.85) 0%, rgba(6, 20, 47, 0.85) 100%)',
                border: '1.5px solid rgba(0, 230, 118, 0.55)',
                boxShadow: '0 4px 15px rgba(0, 230, 118, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <FiTrendingUp size={18} color="#00E676" />
                <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.9375rem' }}>
                  {locale === 'ar' ? 'انضم إلينا' : 'Join Us'}
                </span>
              </div>
              <span
                style={{
                  background: 'rgba(0, 230, 118, 0.18)',
                  color: '#00E676',
                  border: '1px solid rgba(0, 230, 118, 0.45)',
                  padding: '0.15rem 0.6rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                }}
              >
                +10%
              </span>
            </Link>
          )}

          {activeIsAuthenticated && activeUser ? (
            <>
              <Link
                href={getAppRoute('/profile', user)}
                onClick={() => setMenuOpen(false)}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', gap: '8px' }}
              >
                <FiUser size={16} />
                <span>{user.fullName || (locale === 'ar' ? 'الملف الشخصي' : 'Profile')}</span>
              </Link>

              {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isAdmin) && (
                <a
                  href={process.env.NEXT_PUBLIC_ADMIN_URL || (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') ? 'http://186.240.145.87:3005' : 'http://localhost:3001')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    gap: '8px',
                    color: '#00E676',
                    borderColor: 'rgba(0, 230, 118, 0.35)',
                    background: 'rgba(0, 230, 118, 0.08)',
                  }}
                >
                  <FiShield size={16} color="#00E676" />
                  <span>{locale === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Dashboard'}</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setUserDropdownOpen(false);
                  setPartnerDropdownOpen(false);
                  setIsPartner(false);
                  setPartnerData(null);
                  try {
                    localStorage.removeItem('fxengin_is_partner');
                  } catch (e) {}
                  logout();
                  showToast.info('تم تسجيل الخروج بنجاح');
                  router.push('/');
                }}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', color: 'var(--error)', borderColor: 'rgba(246, 70, 93, 0.3)' }}
              >
                <FiLogOut size={16} />
                <span>{locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/login${authRedirectQuery}`}
                onClick={() => {
                  handleAuthNav();
                  setMenuOpen(false);
                }}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
              >
                <FiLogIn size={16} />
                {t.navbar.login}
              </Link>
              <Link
                href={`/register${authRedirectQuery}`}
                onClick={() => {
                  handleAuthNav();
                  setMenuOpen(false);
                }}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
              >
                {t.navbar.register}
                <FiArrowLeft size={16} />
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
