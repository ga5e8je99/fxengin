'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiCheck,
  FiX,
  FiPause,
  FiPlay,
  FiCheckCircle,
  FiCopy,
  FiShield,
  FiKey,
} from 'react-icons/fi';
import {
  FaGoogle,
  FaApple,
} from 'react-icons/fa6';
import { LuGraduationCap } from 'react-icons/lu';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import { getSocialConfig } from '../services/authService';

export default function LoginPage() {
  const router = useRouter();
  const { t, isAr } = useLanguage();
  const { login, loginOtp, socialLogin, user, isAuthenticated, loading: authLoading } = useAuth();
  const passwordInputRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isNewlyRegistered, setIsNewlyRegistered] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');

  // Helper to determine the target page to return to after login
  const getDestinationUrl = () => {
    if (typeof window === 'undefined') return '/';

    // 1. URL Query parameter (?redirect=... or ?returnUrl=...)
    const params = new URLSearchParams(window.location.search);
    const target = params.get('redirect') || params.get('returnUrl') || redirectUrl;
    if (target && target.startsWith('/') && !target.startsWith('//') && target !== '/login' && target !== '/register') {
      return target;
    }

    // 2. SessionStorage saved return URL
    try {
      const stored = sessionStorage.getItem('fxengin_return_url');
      if (stored && stored.startsWith('/') && !stored.startsWith('//') && stored !== '/login' && stored !== '/register') {
        sessionStorage.removeItem('fxengin_return_url');
        return stored;
      }
    } catch (e) {}

    // 3. Document referrer if on the same domain
    if (typeof document !== 'undefined' && document.referrer) {
      try {
        const ref = new URL(document.referrer);
        if (
          ref.origin === window.location.origin &&
          ref.pathname &&
          !ref.pathname.includes('/login') &&
          !ref.pathname.includes('/register')
        ) {
          return ref.pathname + ref.search;
        }
      } catch (e) {}
    }

    // 4. Default: Homepage
    return '/';
  };

  const syncAffiliateLead = (loggedUser) => {
    try {
      let refCode = typeof window !== 'undefined' ? localStorage.getItem('fxengin_affiliate_ref') : null;
      if (!refCode && typeof document !== 'undefined') {
        const m = document.cookie.match(/fxengin_affiliate_ref=([^;]+)/);
        if (m) refCode = decodeURIComponent(m[1]);
      }
      if (refCode && refCode.trim() && loggedUser) {
        fetch('/api/affiliate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'track_registration',
            referralCode: refCode.trim().toUpperCase(),
            userId: loggedUser.id || '',
            fullName: loggedUser.fullName || '',
            email: loggedUser.email || '',
            phone: loggedUser.phoneNumber || '',
          }),
        }).catch(() => {});
      }
    } catch (e) {}
  };

  // OTP Verification States
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);

  const handleGoogleSignIn = async () => {
    if (typeof window === 'undefined') return;

    try {
      setLoading(true);
      let clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
        try {
          const config = await getSocialConfig();
          if (config?.googleClientId && !config.googleClientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
            clientId = config.googleClientId;
          }
        } catch (e) {
          console.warn('Failed to load social config', e);
        }
      }

      if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
        setLoading(false);
        showToast.info(
          isAr
            ? 'خاصية تسجيل الدخول المباشر عبر Google تتطلب إعداد Google Client ID في إعدادات المنصة. يرجى تسجيل الدخول عبر البريد الإلكتروني وكلمة المرور حالياً.'
            : 'Google sign-in requires Google Client ID configuration. Please sign in with email and password.'
        );
        return;
      }

      if (!window.google?.accounts?.id && !window.google?.accounts?.oauth2) {
        await new Promise((resolve, reject) => {
          const existing = document.getElementById('google-gsi-client');
          if (existing) {
            existing.onload = resolve;
            return;
          }
          const script = document.createElement('script');
          script.id = 'google-gsi-client';
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load Google SDK'));
          document.head.appendChild(script);
        });
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse?.access_token) {
            try {
              const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const uData = await uRes.json();
              const res = await socialLogin({
                provider: 'GOOGLE',
                idToken: tokenResponse.access_token,
                email: uData.email,
                fullName: uData.name || uData.given_name,
              });
              if (res.success) {
                if (res.user) syncAffiliateLead(res.user);
                if (res.isNewUser) {
                  showToast.success(isAr ? `مرحباً ${res.user?.fullName || ''}! تم إنشاء حسابك الجديد وتسجيل الدخول عبر Google` : `Welcome! Account created with Google`);
                } else {
                  showToast.success(isAr ? `مرحباً بعودتك ${res.user?.fullName || ''}! تم تسجيل الدخول عبر Google` : `Welcome back! Logged in with Google`);
                }
                const dest = getDestinationUrl();
                router.push(dest);
              } else {
                showToast.error(res.message || (isAr ? 'فشل تسجيل الدخول عبر Google' : 'Google sign-in failed'));
              }
            } catch {
              showToast.error(isAr ? 'خطأ أثناء معالجة بيانات Google' : 'Error processing Google data');
            } finally {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        },
        error_callback: () => {
          setLoading(false);
        },
      });
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch {
      setLoading(false);
      showToast.error(isAr ? 'تعذر تشغيل مصادقة Google' : 'Failed to launch Google auth');
    }
  };

  const handleAppleSignIn = async () => {
    if (typeof window === 'undefined') return;

    try {
      setLoading(true);
      let clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

      if (!clientId || clientId.includes('YOUR_APPLE_CLIENT_ID') || clientId === 'com.fxengin.app.service') {
        try {
          const config = await getSocialConfig();
          if (config?.appleClientId && !config.appleClientId.includes('YOUR_APPLE_CLIENT_ID') && config.appleClientId !== 'com.fxengin.app.service') {
            clientId = config.appleClientId;
          }
        } catch (e) {
          console.warn('Failed to load social config', e);
        }
      }

      if (!clientId || clientId.includes('YOUR_APPLE_CLIENT_ID') || clientId === 'com.fxengin.app.service') {
        setLoading(false);
        showToast.info(
          isAr
            ? 'خاصية تسجيل الدخول المباشر عبر Apple تتطلب تفعيل حساب Apple Developer. يرجى تسجيل الدخول عبر البريد الإلكتروني وكلمة المرور حالياً.'
            : 'Apple sign-in requires an active Apple Developer configuration. Please sign in with email and password.'
        );
        return;
      }

      if (!window.AppleID) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/auth/1/en_US/appleid.auth.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      window.AppleID.auth.init({
        clientId,
        scope: 'name email',
        redirectURI: window.location.origin + '/login',
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      if (response?.authorization?.id_token) {
        const res = await socialLogin({
          provider: 'APPLE',
          idToken: response.authorization.id_token,
          fullName: response.user?.name ? `${response.user.name.firstName} ${response.user.name.lastName}` : undefined,
        });
        if (res.success) {
          showToast.success(isAr ? 'تم تسجيل الدخول عبر Apple' : 'Logged in with Apple');
          router.push('/profile');
        } else {
          showToast.error(res.message || 'فشل تسجيل الدخول عبر Apple');
        }
      }
    } catch {
      showToast.error(isAr ? 'تم إلغاء أو فشل تسجيل الدخول عبر Apple' : 'Apple sign in failed or cancelled');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      const registeredParam = params.get('registered');
      const otpParam = params.get('otp');
      const redir = params.get('redirect') || params.get('returnUrl');
      if (redir) {
        setRedirectUrl(redir);
      } else {
        try {
          const stored = sessionStorage.getItem('fxengin_return_url');
          if (stored && stored.startsWith('/') && !stored.startsWith('//') && stored !== '/login' && stored !== '/register') {
            setRedirectUrl(stored);
          } else if (document.referrer) {
            const ref = new URL(document.referrer);
            if (
              ref.origin === window.location.origin &&
              ref.pathname &&
              !ref.pathname.includes('/login') &&
              !ref.pathname.includes('/register')
            ) {
              setRedirectUrl(ref.pathname + ref.search);
            }
          }
        } catch (e) {}
      }
      if (emailParam) {
        setEmail(emailParam);
      }
      if (otpParam) {
        setOtpCode(otpParam);
        setShowOtpStep(true);
      }
      if (registeredParam === 'true') {
        setIsNewlyRegistered(true);
        showToast.success(isAr ? 'تم إنشاء حسابك بنجاح! أدخل كلمة المرور لتسجيل الدخول وتفعيل التوكن' : 'Account created! Enter your password to sign in and activate your session.');
        // Auto-focus password input after short delay
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 300);
      }
    }
  }, [isAr]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (showOtpStep && resendCountdown > 0) {
      const timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showOtpStep, resendCountdown]);

  // If already authenticated, redirect immediately to intended page or homepage
  useEffect(() => {
    if (!authLoading && user && isAuthenticated) {
      const target = getDestinationUrl();
      router.replace(target);
    }
  }, [authLoading, user, isAuthenticated, redirectUrl, router]);

  const handlePasteOtp = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        const cleaned = text.trim().replace(/\D/g, '').slice(0, 6);
        if (cleaned) {
          setOtpCode(cleaned);
          showToast.success(isAr ? 'تم لصق الكود بنجاح' : 'Code pasted successfully');
        }
      }
    } catch (e) {
      showToast.info(isAr ? 'يرجى كتابة الكود يدوياً' : 'Please type the code manually');
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setLoading(true);
    try {
      const { sendOtp } = await import('../services/authService');
      const res = await sendOtp(email.trim().toLowerCase(), 'LOGIN');
      if (res.success) {
        showToast.success(isAr ? 'تمت إعادة إرسال كود التحقق بنجاح إلى بريدك' : 'Verification code resent successfully');
        setResendCountdown(60);
      } else {
        showToast.error(res.message || 'فشل إعادة إرسال الكود');
      }
    } catch (err) {
      showToast.error(isAr ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      const msg = isAr ? 'يرجى إدخال كود التحقق المكون من 6 أرقام' : 'Please enter the 6-digit OTP code';
      setError(msg);
      showToast.error(msg);
      return;
    }
    setLoading(true);
    try {
      let result;
      if (password) {
        result = await login({ email: email.trim().toLowerCase(), password, otpCode: cleanCode });
      } else {
        result = await loginOtp(email.trim().toLowerCase(), cleanCode);
      }

      if (result.success && (result.user || result.data?.user || result.data)) {
        const u = result.user || result.data?.user || result.data;
        if (u) syncAffiliateLead(u);
        setSuccess(true);
        showToast.success(isAr ? 'تم تأكيد الرمز وتسجيل الدخول بنجاح! مرحباً بك' : 'Signed in successfully! Welcome back');
        const targetRedirect = getDestinationUrl();
        setTimeout(() => {
          router.push(targetRedirect);
        }, 800);
      } else {
        const msg = result.message || (isAr ? 'كود التحقق غير صحيح أو منتهي الصلاحية' : 'Invalid or expired OTP code');
        setError(msg);
        showToast.error(msg);
      }
    } catch (err) {
      const msg = isAr ? 'حدث خطأ أثناء تأكيد الرمز' : 'Verification failed. Please try again.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      const msg = isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields';
      setError(msg);
      showToast.error(msg);
      return;
    }
    setLoading(true);
    try {
      const result = await login({ email: email.trim().toLowerCase(), password });
      if (result.requireOtp) {
        setShowOtpStep(true);
        setResendCountdown(60);
        showToast.info(isAr ? 'تم إرسال كود التحقق (OTP) إلى بريدك الإلكتروني' : 'Verification code (OTP) sent to your email');
        return;
      }

      if (result.success) {
        const u = result.user || result.data?.user || result.data;
        if (u) syncAffiliateLead(u);
        setSuccess(true);
        showToast.success(isAr ? 'تم تسجيل الدخول بنجاح! مرحباً بك' : 'Signed in successfully! Welcome back');
        const targetRedirect = getDestinationUrl();
        setTimeout(() => {
          router.push(targetRedirect);
        }, 800);
      } else {
        const msg = result.message || (isAr ? 'فشل تسجيل الدخول، يرجى التحقق من البيانات' : 'Failed to sign in. Please verify your credentials.');
        setError(msg);
        showToast.error(msg);
      }
    } catch (err) {
      const msg = isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Server connection error';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page-root"
      style={{
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: '#000208',
        display: 'flex',
      }}
    >
      {/* ── Background Blurred Artwork (for Mobile & Responsive View) ── */}
      <div
        className="full-blurred-bg"
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          overflow: 'hidden',
          display: 'none',
        }}
      >
        <img
          src="/assets/Images/Main/login-visual.webp"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            filter: 'blur(5px) brightness(0.85) saturate(1.15)',
            transform: 'scale(1.06)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(1, 7, 30, 0.3) 0%, rgba(0, 3, 13, 0.6) 100%)',
          }}
        />
      </div>

      {/* ── Full Screen Edge-to-Edge Container (100vw x 100vh on Desktop) ── */}
      <div
        className="login-main-container"
        style={{
          width: '100vw',
          height: '100vh',
          maxWidth: 'none',
          maxHeight: 'none',
          margin: 0,
          padding: 0,
          background: 'var(--surface)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          position: 'relative',
          zIndex: 10,
          overflow: 'hidden',
        }}
      >
        {/* ── Left Column: Inspirational Visual Panel with Soft Shadow Overlay ── */}
        <div
          className="desktop-visual-panel"
          style={{
            position: 'relative',
            width: '100%',
            height: '100vh',
            overflow: 'hidden',
            background: '#1A0E05',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Full Bleed Background Artwork Image */}
          <img
            src="/assets/Images/Main/login-visual.webp"
            alt="Look first / Then leap."
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
              display: 'block',
              zIndex: 1,
            }}
          />

          {/* Content Area with Soft Shadow Overlay & Centered Content */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              padding: '40px 48px 24px',
              background: 'radial-gradient(ellipse at center, rgba(0, 3, 13, 0.65) 0%, rgba(0, 3, 13, 0.88) 100%)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100vh',
              width: '100%',
            }}
          >
            {/* Top Tagline & Live Status Pill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>


              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  background: 'rgba(251, 135, 4, 0.12)',
                  border: '1px solid rgba(251, 135, 4, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  backdropFilter: 'blur(8px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
                {isAr ? 'المنصة النشطة لـ +50,000 متداول' : 'Trusted by +50,000 Traders'}
              </span>
            </div>

            {/* Centered Content Block */}
            <div
              style={{
                maxWidth: '560px',
                margin: 'auto 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* VIP Welcome Badge */}
              <div>
                <span
                  className="badge badge-vip"
                  style={{
                    fontSize: '11.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                  }}
                >
                  <LuGraduationCap size={15} />
                  {isAr ? 'مرحباً بك مجدداً في FXENGIN' : 'Welcome Back to FXENGIN'}
                </span>
              </div>

              {/* Main Headline */}
              <h2
                style={{
                  fontSize: 'clamp(22px, 2.2vw, 30px)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1.35,
                  margin: 0,
                  textShadow: '0 2px 12px rgba(0,0,0,0.8)',
                }}
              >
                {isAr ? (
                  <>
                    منصتك المتكاملة للتحليلات و{' '}
                    <span className="text-gradient-brand">التداول الذكي</span>
                  </>
                ) : (
                  <>
                    Your Pro Ecosystem for{' '}
                    <span className="text-gradient-brand">Smart Trading</span>
                  </>
                )}
              </h2>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: '13.5px',
                  color: 'rgba(245, 247, 250, 0.88)',
                  lineHeight: 1.65,
                  margin: 0,
                  maxWidth: '560px',
                  textShadow: '0 1px 6px rgba(0,0,0,0.7)',
                }}
              >
                {isAr
                  ? 'سجّل دخولك الآن لمتابعة أحدث التحليلات الفنية والأساسية، وإشارات السوق الحية، وإدارة مسيرتك التعليمية والتداولية باحتراف.'
                  : 'Sign in to access real-time technical analysis, live market setups, and advanced educational intelligence designed for serious traders.'}
              </p>

              {/* 4 Highlights Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px 20px',
                  marginTop: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                {[
                  {
                    title: isAr ? 'تحليلات حية لحظية' : 'Live Market Setups',
                    desc: isAr ? 'تحديثات فنية وأساسية للعملات والذهب' : 'Real-time forex, gold & oil coverage',
                  },
                  {
                    title: isAr ? 'إشارات وتوصيات مدروسة' : 'Smart Signals',
                    desc: isAr ? 'مستويات دعم ومقاومة واستراتيجيات دقيقة' : 'Data-driven entry and exit zones',
                  },
                  {
                    title: isAr ? 'متابعة أداء الحساب' : 'Performance Tracking',
                    desc: isAr ? 'إحصائيات متقدمة لإدارة المخاطر' : 'Advanced risk management metrics',
                  },
                  {
                    title: isAr ? 'مجتمع النخبة المباشر' : 'Elite Trader Network',
                    desc: isAr ? 'مناقشات وتواصل مباشر مع الخبراء' : '24/7 expert community support',
                  },
                ].map(({ title, desc }) => (
                  <div key={title} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'rgba(22, 199, 132, 0.2)',
                        border: '1px solid rgba(22, 199, 132, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <FiCheck size={13} color="var(--success)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
                        {title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.45 }}>
                        {desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Bar: Trust Rating + Pause/Play Control */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'rgba(245, 247, 250, 0.75)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#FBBF24' }}>★★★★★</span>
                <span>{isAr ? '98% نسبة رضا المتداولين وأعلى معايير الأمان' : '98% Trader Satisfaction & High Security'}</span>
              </div>


            </div>
          </div>
        </div>

        {/* ── Right Column: Sign In Form Panel (Full Height with Deep Dark Brand Gradient) ── */}
        <div
          className="login-form-panel"
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '40px 56px',
            background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(4, 136, 248, 0.07) 0%, transparent 60%), radial-gradient(ellipse 70% 40% at 85% 100%, rgba(251, 135, 4, 0.05) 0%, transparent 60%), linear-gradient(180deg, #02091A 0%, #010512 40%, #00030A 100%)',
            overflowY: 'auto',
            position: 'relative',
            borderInlineStart: '1px solid var(--border)',
          }}
        >
          {/* Subtle Ambient Lighting Orbs */}
          <div aria-hidden style={{
            position: 'absolute',
            top: '0',
            right: '10%',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(4, 136, 248, 0.06) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(45px)',
            pointerEvents: 'none',
          }} />
          <div aria-hidden style={{
            position: 'absolute',
            bottom: '5%',
            left: '5%',
            width: '220px',
            height: '220px',
            background: 'radial-gradient(circle, rgba(251, 135, 4, 0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(45px)',
            pointerEvents: 'none',
          }} />
          {/* Top Bar: Brand Logo Centered & Close (X) Button on Corner */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '52px',
              marginBottom: '20px',
            }}
          >
            {/* Centered Brand Logo (Enlarged) */}
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                direction: 'ltr',
              }}
            >
              <img
                src="/assets/Images/Logo/logo.webp"
                alt="FXENGIN Logo"
                style={{ width: '48px', height: '48px', objectFit: 'contain' }}
              />
              <span
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 900,
                  fontSize: '26px',
                  letterSpacing: '1.2px',
                  background: 'var(--accent-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1,
                }}
              >
                FXENGIN
              </span>
            </Link>

            {/* Close Button at the corner */}
            <Link
              href="/"
              aria-label="Close"
              style={{
                position: 'absolute',
                insetInlineEnd: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <FiX size={19} />
            </Link>
          </div>

          {/* Centered Form Section */}
          <div
            className="form-inner-content"
            style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}
          >
            {/* Title */}
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                textAlign: 'center',
                margin: '0 0 24px 0',
              }}
            >
              {t.login.title}
            </h1>

            {/* Google Social Login Button */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                style={{
                  height: '46px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.background = 'rgba(4, 136, 248, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(4, 136, 248, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.25)';
                }}
              >
                <FaGoogle size={16} color="#EA4335" />
                <span>{isAr ? 'تسجيل الدخول عبر Google' : (t.login.googleBtn || 'Continue with Google')}</span>
              </button>
            </div>

            {/* 'or' Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '0 0 20px 0',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {t.login.or}
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* Newly Registered Celebration Banner */}
            {isNewlyRegistered && !success && !error && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(22, 199, 132, 0.18) 0%, rgba(4, 136, 248, 0.12) 100%)',
                  border: '1px solid var(--success)',
                  color: 'var(--text-primary)',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  boxShadow: '0 4px 16px rgba(22, 199, 132, 0.15)',
                }}
              >
                <FiCheckCircle size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: '2px' }}>
                    {isAr ? 'تم إنشاء الحساب بنجاح!' : 'Account Created Successfully!'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {isAr
                      ? 'تم تعبئة بريدك الإلكتروني، يرجى كتابة كلمة المرور لتسجيل الدخول وتفعيل التوكن.'
                      : 'Your email is pre-filled. Enter your password to sign in and activate your session.'}
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                style={{
                  background: 'rgba(246, 70, 93, 0.12)',
                  border: '1px solid var(--error)',
                  color: 'var(--error)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div
                style={{
                  background: 'rgba(22, 199, 132, 0.15)',
                  border: '1px solid var(--success)',
                  color: 'var(--success)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FiCheckCircle size={16} />
                {isAr ? 'تم تسجيل الدخول بنجاح! جاري تحويلك...' : 'Signed in successfully! Redirecting...'}
              </div>
            )}

            {/* ══════════ IF OTP VERIFICATION STEP ══════════ */}
            {showOtpStep ? (
              <form
                onSubmit={handleVerifyOtp}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'rgba(4, 136, 248, 0.12)',
                      border: '1px solid #0488F8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      boxShadow: '0 0 24px rgba(4, 136, 248, 0.3)',
                    }}
                  >
                    <FiShield size={26} color="#0488F8" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
                    {isAr ? 'رمز التحقق لتسجيل الدخول (OTP)' : 'Security Verification Code (OTP)'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {isAr ? 'تم إرسال كود التحقق المكون من 6 أرقام إلى:' : 'A 6-digit verification code was sent to:'}
                    <br />
                    <strong style={{ color: '#0488F8', direction: 'ltr', display: 'inline-block' }}>{email}</strong>
                  </p>
                </div>

                <div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="● ● ● ● ● ●"
                      required
                      maxLength={6}
                      dir="ltr"
                      autoFocus
                      style={{
                        width: '100%',
                        height: '56px',
                        padding: '0 16px',
                        background: 'rgba(4, 136, 248, 0.06)',
                        border: '2px solid #0488F8',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        fontSize: '26px',
                        fontWeight: 800,
                        letterSpacing: '10px',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        boxShadow: '0 0 16px rgba(4, 136, 248, 0.15)',
                      }}
                    />
                  </div>

                  {/* Paste & Resend Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handlePasteOtp}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 0',
                      }}
                    >
                      <FiCopy size={14} />
                      <span>{isAr ? 'لصق الكود' : 'Paste Code'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCountdown > 0 || loading}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: resendCountdown > 0 ? 'var(--text-muted)' : 'var(--accent)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: resendCountdown > 0 ? 'default' : 'pointer',
                        padding: '4px 0',
                      }}
                    >
                      {resendCountdown > 0
                        ? (isAr ? `إعادة الإرسال بعد (${resendCountdown}) ث` : `Resend in (${resendCountdown})s`)
                        : (isAr ? 'إعادة إرسال الكود' : 'Resend Code')}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || otpCode.trim().length !== 6}
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '15px',
                    fontWeight: 700,
                    marginTop: '6px',
                    opacity: loading || otpCode.trim().length !== 6 ? 0.65 : 1,
                    cursor: loading || otpCode.trim().length !== 6 ? 'not-allowed' : 'pointer',
                    justifyContent: 'center',
                  }}
                >
                  <span>{loading ? (isAr ? 'جاري التحقق...' : 'Verifying...') : (isAr ? 'تأكيد الدخول والمتابعة ←' : 'Verify & Sign In →')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowOtpStep(false); setOtpCode(''); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    marginTop: '-4px',
                  }}
                >
                  {isAr ? '← العودة لتعديل البريد الإلكتروني' : '← Back to change email'}
                </button>
              </form>
            ) : (
              /* ══════════ EMAIL & PASSWORD FORM ══════════ */
              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.login.emailPlaceholder}
                      required
                      dir="ltr"
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 14px 0 40px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        textAlign: 'left',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <FiMail size={16} />
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={passwordInputRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.login.passwordPlaceholder}
                      required
                      dir="ltr"
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 40px 0 40px',
                        background: 'var(--bg-primary)',
                        border: isNewlyRegistered && !password ? '1px solid var(--accent)' : '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        textAlign: 'left',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <FiLock size={16} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  {/* ── Forgot Password Link ── */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: '8px',
                      marginBottom: '2px',
                    }}
                  >
                    <Link
                      href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        fontWeight: 600,
                        transition: 'color 0.15s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                    >
                      {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </Link>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '15px',
                    fontWeight: 700,
                    marginTop: '4px',
                    opacity: loading ? 0.75 : 1,
                    justifyContent: 'center',
                  }}
                >
                  {loading ? '...' : t.login.submitBtn}
                  <FiArrowLeft size={15} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
                </button>
              </form>
            )}
          </div>

          {/* Bottom Switcher */}
          <div
            style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            {t.login.noAccount}{' '}
            <Link
              href={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
              style={{
                color: 'var(--accent)',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              {t.login.signUpLink}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Responsive Mobile & Tablet Styling ── */}
      <style>{`
        @media (max-width: 992px) {
          .login-page-root {
            padding: 20px 16px !important;
            min-height: 100vh !important;
            height: 100% !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .full-blurred-bg {
            display: block !important;
          }
          .login-main-container {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            max-width: 440px !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            margin: auto !important;
          }
          .desktop-visual-panel {
            display: none !important;
          }
          .login-form-panel {
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            background: rgba(6, 20, 47, 0.84) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(18, 49, 92, 0.75) !important;
            border-radius: 24px !important;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.88) !important;
            padding: 32px 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
