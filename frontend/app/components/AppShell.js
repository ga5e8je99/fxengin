'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Navbar from './Navbar';
import TickerBar from './TickerBar';
import Footer from './Footer';
import PageLoader from './PageLoader';
import AdBanner, { MobileSponsoredBar } from './AdBanner';
import WebinarAnnouncementBar from './WebinarAnnouncementBar';
import WebinarPaymentModal from './WebinarPaymentModal';
import BrokerPromoPopupModal from './BrokerPromoPopupModal';
import BrokerSidePopup from './BrokerSidePopup';
import ScrollToTop from './ScrollToTop';
import ScrollAnimationObserver from './ScrollAnimationObserver';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LoadingProvider, useLoading } from '../context/LoadingContext';
import { ToastContainer } from 'react-toastify';
import { showToast } from '../utils/toast';
import { reportErrorTelemetry } from '../services/apiClient';

function RouteNavigationTracker({ onNavigate }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onNavigate(pathname, searchParams ? searchParams.toString() : '');
  }, [pathname, searchParams, onNavigate]);

  return null;
}

function ShellContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const currentPath = useRef(pathname);
  const { dir, isAr } = useLanguage();

  const [activeUserId, setActiveUserId] = useState(user?.id || null);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [hasActiveWebinar, setHasActiveWebinar] = useState(false);
  const [showWebinarModal, setShowWebinarModal] = useState(false);

  const isAnnouncementActive = showAnnouncement && hasActiveWebinar;

  useEffect(() => {
    if (user?.id) {
      setActiveUserId(user.id);
    } else if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('fxengin_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.id) setActiveUserId(parsed.id);
        } else {
          setActiveUserId(null);
        }
      } catch (e) {}
    }
  }, [user]);

  // Telemetry client error listener
  useEffect(() => {
    const handleGlobalError = (event) => {
      reportErrorTelemetry({
        errorCode: '500',
        path: window.location.pathname,
        message: event.message || event.error?.message || 'Uncaught client error',
      });
    };

    const handleUnhandledRejection = (event) => {
      reportErrorTelemetry({
        errorCode: '500',
        path: window.location.pathname,
        message: event.reason?.message || String(event.reason) || 'Unhandled promise rejection',
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Track inbound affiliate referral codes (?ref=..., ?referral=..., ?affiliate=..., ?avalid=..., etc.)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const refCode =
        params.get('ref') ||
        params.get('referral') ||
        params.get('affiliate') ||
        params.get('aff') ||
        params.get('avalid') ||
        params.get('partner') ||
        params.get('code');
      let activeRef = refCode ? refCode.trim().toUpperCase() : null;

      if (activeRef) {
        localStorage.setItem('fxengin_affiliate_ref', activeRef);
        sessionStorage.setItem('fxengin_affiliate_ref', activeRef);
        document.cookie = `fxengin_affiliate_ref=${encodeURIComponent(activeRef)}; path=/; max-age=7776000; SameSite=Lax`;

        // Ping backend to register the click once per session
        const sessionKey = `fx_ref_tracked_${activeRef}`;
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, '1');
          fetch('/api/affiliate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'track_click',
              referralCode: activeRef,
              path: window.location.pathname,
            }),
          }).catch((err) => console.warn('Affiliate click track warning:', err));
        }
      } else {
        activeRef =
          localStorage.getItem('fxengin_affiliate_ref') ||
          sessionStorage.getItem('fxengin_affiliate_ref');
        if (!activeRef) {
          const cookieMatch = document.cookie.match(/fxengin_affiliate_ref=([^;]+)/);
          if (cookieMatch) activeRef = decodeURIComponent(cookieMatch[1]).trim().toUpperCase();
        }
      }

      // If user is authenticated and visited via affiliate link, bind them as a lead immediately!
      const effectiveUserId = user?.id || activeUserId;
      if (activeRef && effectiveUserId) {
        const leadSyncKey = `fx_lead_synced_${activeRef}_${effectiveUserId}`;
        if (!sessionStorage.getItem(leadSyncKey)) {
          sessionStorage.setItem(leadSyncKey, '1');
          fetch('/api/affiliate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'track_registration',
              referralCode: activeRef,
              userId: effectiveUserId,
              fullName: user?.fullName || '',
              email: user?.email || '',
              phone: user?.phoneNumber || '',
            }),
          }).catch((err) => console.warn('Affiliate auto-lead sync warning:', err));
        }
      }
    } catch (e) {}
  }, [pathname, activeUserId, user]);

  // Automatic user-scoped route sync: if authenticated, every page URL is /[id]/[page]
  useEffect(() => {
    if (!activeUserId) return;

    // Special pages that shouldn't be user-scoped
    if (
      pathname === '/login' ||
      pathname.endsWith('/login') ||
      pathname === '/register' ||
      pathname.endsWith('/register') ||
      pathname === '/forgot-password' ||
      pathname.includes('/forgot-password') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next')
    ) {
      return;
    }

    const search = typeof window !== 'undefined' ? window.location.search : '';

    // If on guest home page ('/'), redirect to /:id while preserving query parameters (e.g. ?ref=...)
    if (pathname === '/' || pathname === '') {
      router.replace(`/${activeUserId}${search}`);
      return;
    }

    // If pathname does not already begin with /[activeUserId]
    if (!pathname.startsWith(`/${activeUserId}`)) {
      router.replace(`/${activeUserId}${pathname}${search}`);
    }
  }, [pathname, activeUserId, router]);

  // Sync global CSS custom variables to documentElement for full-page layout consistency
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--announcement-height', isAnnouncementActive ? '2.375rem' : '0rem');
      document.documentElement.style.setProperty(
        '--top-bars-height',
        isAnnouncementActive
          ? 'calc(var(--header-height, 4.5rem) + var(--ticker-height, 2.75rem) + 2.375rem)'
          : 'calc(var(--header-height, 4.5rem) + var(--ticker-height, 2.75rem))'
      );
    }
  }, [isAnnouncementActive]);

  const scrollToPageTop = () => {
    if (typeof window === 'undefined') return;
    try {
      const prevBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      setTimeout(() => {
        window.scrollTo(0, 0);
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        document.documentElement.style.scrollBehavior = prevBehavior || '';
      }, 50);
    } catch (e) {
      window.scrollTo(0, 0);
    }
  };

  // Handle route completion: dismissed dynamically once the target page is mounted & painted
  const handleRouteComplete = useCallback(
    (newPath, newQuery) => {
      const fullNewPath = newQuery ? `${newPath}?${newQuery}` : newPath;
      if (currentPath.current !== fullNewPath) {
        currentPath.current = fullNewPath;
        scrollToPageTop();
        // Target page has mounted & rendered: allow smooth transition then dismiss
        setTimeout(() => {
          stopLoading(300);
          scrollToPageTop();
        }, 550);
      }
    },
    [stopLoading]
  );

  // Intercept inter-page link clicks for instant transition feedback & user route scoping
  useEffect(() => {
    const handleLinkClick = (e) => {
      const target = e.target.closest('a');
      if (!target) return;

      // Ignore open in new tab / download / non-primary mouse click
      if (target.target === '_blank' || target.getAttribute('download') !== null) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Ignore hash in-page jumps like #courses, #market
      if (href.startsWith('#')) return;
      if (href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;

      // If user is authenticated, ensure all internal link targets are prefixed with /:id
      if (activeUserId && (href.startsWith('/') || href === '/')) {
        const isExcluded =
          href === '/login' ||
          href.endsWith('/login') ||
          href === '/register' ||
          href.endsWith('/register') ||
          href === '/forgot-password' ||
          href.includes('/forgot-password') ||
          href.startsWith('/api') ||
          href.startsWith('/_next') ||
          href.startsWith(`/${activeUserId}`);

        if (!isExcluded) {
          const scopedHref = href === '/' ? `/${activeUserId}` : `/${activeUserId}${href}`;
          target.setAttribute('href', scopedHref);
        }
      }

      const finalHref = target.getAttribute('href') || href;
      try {
        const url = new URL(finalHref, window.location.origin);
        if (url.origin === window.location.origin) {
          const targetPath = url.pathname + url.search;
          const currentFullPath = window.location.pathname + window.location.search;
          if (targetPath !== currentFullPath) {
            scrollToPageTop();
            startLoading();
          }
        }
      } catch (err) {
        if ((finalHref.startsWith('/') || finalHref === '/') && finalHref !== pathname) {
          scrollToPageTop();
          startLoading();
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, [pathname, activeUserId, startLoading]);

  const isStandalonePage =
    pathname === '/login' ||
    pathname.endsWith('/login') ||
    pathname === '/register' ||
    pathname.endsWith('/register') ||
    pathname === '/forgot-password' ||
    pathname.includes('/forgot-password') ||
    pathname.includes('/learn');

  const isTradingPage =
    pathname === '/trading' ||
    pathname.endsWith('/trading') ||
    pathname.startsWith('/trading') ||
    pathname.includes('/trading');

  return (
    <div
      dir={dir}
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        '--announcement-height': isAnnouncementActive ? '2.375rem' : '0rem',
        '--top-bars-height': isAnnouncementActive
          ? 'calc(var(--header-height, 4.5rem) + var(--ticker-height, 2.75rem) + 2.375rem)'
          : 'calc(var(--header-height, 4.5rem) + var(--ticker-height, 2.75rem))',
      }}
    >
      {/* Dynamic Page Transition Loader */}
      <PageLoader isLoading={isLoading} />

      {/* Global Scroll Animation Observer */}
      <ScrollAnimationObserver />

      {/* Global Route Navigation Tracker for Dynamic Loading Dismissal */}
      <Suspense fallback={null}>
        <RouteNavigationTracker onNavigate={handleRouteComplete} />
      </Suspense>

      {isStandalonePage ? (
        <main className="min-h-screen w-full flex flex-col justify-center relative">
          {children}
        </main>
      ) : isTradingPage ? (
        <>
          <Navbar />
          <main
            style={{
              paddingTop: 'var(--header-height, 4.5rem)',
              minHeight: '100dvh',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              overflowX: 'hidden',
              background: 'var(--bg-primary, #01071E)',
            }}
          >
            {children}
          </main>
        </>
      ) : (
        <>
          {/* Fixed Header: Navbar + TickerBar + Live Webinar Announcement */}
          <Navbar />
          <TickerBar />
          <WebinarAnnouncementBar
            isOpen={isAnnouncementActive}
            onClose={() => setShowAnnouncement(false)}
            onOpenModal={() => setShowWebinarModal(true)}
            onVisibilityChange={setHasActiveWebinar}
          />

          {/* Main Website Content (Full Screen Width Across All Sections) */}
          <div
            className="flex-1 flex flex-col w-full relative"
            style={{
              background: 'var(--bg-primary)',
              paddingTop: 'var(--header-height, 4.5rem)',
              minHeight: 'calc(100dvh - var(--header-height, 4.5rem))',
              width: '100%',
              maxWidth: '100%',
            }}
          >
            <main
              className="site-main-content w-full"
              style={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
                position: 'relative',
                zIndex: 10,
                padding: 0,
                margin: 0,
              }}
            >
              {children}
            </main>
          </div>

          <Footer />
        </>
      )}

      {/* FXENGIN Toast Notification Container */}
      <ToastContainer
        position={isAr ? "top-left" : "top-right"}
        autoClose={4500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={isAr}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {/* Global Webinar Payment Modal accessible from top announcement bar */}
      <WebinarPaymentModal
        isOpen={showWebinarModal}
        onClose={() => setShowWebinarModal(false)}
        onSuccess={() => {
          setShowWebinarModal(false);
          try {
            localStorage.setItem('fxengin_webinar_registered', 'true');
          } catch (e) {}
          showToast.success(
            isAr
              ? 'تم استلام الدفعة وسداد الرسوم وتأكيد حجز مقعدك بنجاح!'
              : 'Payment received & webinar seat confirmed successfully!'
          );
        }}
        user={user}
      />

      {/* Global Broker Partner Promotional Popup Modal (Appears periodically) */}
      <BrokerPromoPopupModal />

      {/* Global Broker Partner Floating Side Popup (Drawer / Corner Notification) */}
      <BrokerSidePopup />

      {/* Global Scroll To Top Button with Circular Progress Ring */}
      <ScrollToTop />
    </div>
  );
}

export default function AppShell({ children }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <LoadingProvider>
          <ShellContent>{children}</ShellContent>
        </LoadingProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
