'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiCalendar,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiX,
  FiPause,
  FiPlay,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiShield,
  FiAward,
  FiCopy,
} from 'react-icons/fi';
import { FaGoogle, FaApple } from 'react-icons/fa6';
import { LuGraduationCap } from 'react-icons/lu';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import { getSocialConfig } from '../services/authService';

export default function RegisterPage() {
  const router = useRouter();
  const { t, isAr } = useLanguage();
  const { register, socialLogin, user, isAuthenticated, loading: authLoading } = useAuth();

  // Multi-step state: 1 (Personal Info) or 2 (Trading & Security)
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('BEGINNER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // UI / Action states
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorList, setErrorList] = useState([]);
  const [success, setSuccess] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');

  // Helper to determine the target page to return to after registration/login
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
            ? 'خاصية التسجيل المباشر عبر Google تتطلب إعداد Google Client ID في إعدادات المنصة. يرجى إتمام التسجيل عبر البريد الإلكتروني حالياً.'
            : 'Google registration requires Google Client ID configuration. Please register with email.'
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
                try {
                  let refCode = typeof window !== 'undefined' ? localStorage.getItem('fxengin_affiliate_ref') : null;
                  if (!refCode && typeof document !== 'undefined') {
                    const m = document.cookie.match(/fxengin_affiliate_ref=([^;]+)/);
                    if (m) refCode = decodeURIComponent(m[1]);
                  }
                  if (refCode && refCode.trim()) {
                    fetch('/api/affiliate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'track_registration',
                        referralCode: refCode.trim().toUpperCase(),
                        userId: res.user?.id || '',
                        fullName: uData.name || uData.given_name || '',
                        email: uData.email || '',
                      }),
                    }).catch(() => {});
                  }
                } catch (e) {}
                showToast.success(isAr ? `مرحباً ${res.user?.fullName || ''}! تم التسجيل بنجاح عبر Google` : `Welcome! Registered with Google`);
                const dest = getDestinationUrl();
                router.push(dest);
              } else {
                showToast.error(res.message || (isAr ? 'فشل التسجيل عبر Google' : 'Google sign-up failed'));
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
            ? 'خاصية التسجيل المباشر عبر Apple تتطلب تفعيل حساب Apple Developer. يرجى إتمام التسجيل عبر البريد الإلكتروني حالياً.'
            : 'Apple registration requires Apple Developer configuration. Please register with email.'
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
        redirectURI: window.location.origin + '/register',
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
          showToast.success(isAr ? 'تم إنشاء الحساب عبر Apple بنجاح' : 'Registered with Apple');
          router.push('/profile');
        } else {
          showToast.error(res.message || 'فشل التسجيل عبر Apple');
        }
      }
    } catch {
      showToast.error(isAr ? 'تم إلغاء أو فشل التسجيل عبر Apple' : 'Apple sign up failed or cancelled');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redir = params.get('redirect') || params.get('returnUrl');
      const otpParam = params.get('otp');
      const emailParam = params.get('email');
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
        setOtpCode(otpParam.slice(0, 6));
        setShowOtpStep(true);
      }
    }
  }, []);

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

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumberOrSymbol = /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumberOrSymbol;

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (hasMinLength) score += 1;
    if (hasUpperCase) score += 1;
    if (hasLowerCase) score += 1;
    if (hasNumberOrSymbol) score += 1;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthLabels = isAr
    ? ['ضعيفة جداً', 'ضعيفة', 'مقبولة', 'جيدة', 'ممتازة وقوية']
    : ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong & Secure'];
  const strengthColors = ['#F6465D', '#F6465D', '#FBBF24', '#0488F8', '#16C784'];

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
      const res = await sendOtp(email.trim().toLowerCase(), 'REGISTER');
      if (res.success) {
        showToast.success(isAr ? 'تمت إعادة إرسال كود التحقق بنجاح إلى بريدك' : 'Verification code resent successfully');
        setResendCountdown(60);
      } else {
        showToast.error(res.message || 'فشل إرسال كود التحقق');
      }
    } catch (err) {
      showToast.error(isAr ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  // Validate Step 1 before proceeding
  const handleNextStep = (e) => {
    e?.preventDefault();
    setError('');
    setErrorList([]);

    if (!fullName || !email || !phoneNumber || !dateOfBirth) {
      const msg = t.register.errors?.requiredFields || (isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
      setError(msg);
      showToast.error(msg);
      return;
    }

    if (fullName.trim().length < 3 || fullName.trim().length > 70) {
      const msg = t.register.errors?.fullNameLength || (isAr ? 'يجب أن يكون الاسم الكامل بين 3 و 70 حرفاً' : 'Full name must be between 3 and 70 characters');
      setError(msg);
      showToast.error(msg);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      const msg = t.register.errors?.validEmail || (isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      setError(msg);
      showToast.error(msg);
      return;
    }

    // All Step 1 checks passed -> Move to Step 2
    setCurrentStep(2);
  };

  // Submit on Step 2
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorList([]);

    if (!isPasswordValid) {
      const msg = t.register.errors?.passwordWeak || (isAr ? 'يجب ألا تقل كلمة المرور عن 8 خانات وتحتوي على حرف كبير وحرف صغير ورقم أو رمز' : 'Password must be at least 8 characters long and contain uppercase, lowercase, and a number or symbol');
      setError(msg);
      showToast.error(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = t.register.errors?.passwordMismatch || (isAr ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      setError(msg);
      showToast.error(msg);
      return;
    }

    if (!agreeTerms) {
      const msg = t.register.errors?.termsRequired || (isAr ? 'يرجى الموافقة على الشروط والأحكام للمتابعة' : 'Please agree to the terms and conditions to proceed');
      setError(msg);
      showToast.error(msg);
      return;
    }

    // Format dateOfBirth: from YYYY-MM-DD to D-M-YYYY (e.g., 30-6-2002)
    let formattedDob = dateOfBirth;
    if (dateOfBirth && dateOfBirth.includes('-')) {
      const parts = dateOfBirth.split('-');
      if (parts[0].length === 4) {
        formattedDob = `${parseInt(parts[2], 10)}-${parseInt(parts[1], 10)}-${parts[0]}`;
      }
    }

    const payload = {
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      experienceLevel,
      dateOfBirth: formattedDob,
      password,
      confirmPassword,
    };

    // If OTP step is not active yet, send OTP to user's email first
    if (!showOtpStep) {
      setLoading(true);
      try {
        const { sendOtp } = await import('../services/authService');
        const res = await sendOtp(payload.email, 'REGISTER');
        if (res.success) {
          setShowOtpStep(true);
          setResendCountdown(60);
          showToast.info(isAr ? 'تم إرسال كود التحقق لتفعيل الحساب إلى بريدك الإلكتروني' : 'Verification code sent to your email');
          setLoading(false);
          return;
        } else {
          const isConflict = res.statusCode === 409 || res.message?.includes('مسجل مسبقاً');
          const errorMsg = isConflict
            ? (isAr ? 'هذا البريد الإلكتروني مسجل لدينا بالفعل في المنصة. يرجى تسجيل الدخول مباشرة.' : 'This email is already registered on the platform. Please log in.')
            : (res.message || 'فشل إرسال كود التحقق');
          setError(errorMsg);
          showToast.error(errorMsg);
          setLoading(false);
          return;
        }
      } catch (otpErr) {
        showToast.error(isAr ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
        setLoading(false);
        return;
      }
    }

    if (!otpCode || otpCode.trim().length !== 6) {
      const msg = isAr ? 'يرجى إدخال كود التحقق المكون من 6 أرقام' : 'Please enter the 6-digit OTP code';
      setError(msg);
      showToast.error(msg);
      return;
    }

    payload.otpCode = otpCode.trim();
    setLoading(true);

    try {
      const result = await register(payload);

      if (result.success) {
        setSuccess(true);

        // Track affiliate referral registration (الناس اللي دخلت عبر الرابط)
        try {
          let refCode = typeof window !== 'undefined' ? localStorage.getItem('fxengin_affiliate_ref') : null;
          if (!refCode && typeof document !== 'undefined') {
            const m = document.cookie.match(/fxengin_affiliate_ref=([^;]+)/);
            if (m) refCode = decodeURIComponent(m[1]);
          }
          if (refCode && refCode.trim()) {
            fetch('/api/affiliate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'track_registration',
                referralCode: refCode.trim().toUpperCase(),
                userId: result.data?.id || result.data?.user?.id || '',
                fullName: payload.fullName || '',
                email: payload.email || '',
                phone: payload.phoneNumber || '',
              }),
            }).catch(() => {});
          }
        } catch (refErr) {}

        if (result.autoLoggedIn) {
          const successMsg = isAr
            ? 'تم إنشاء الحساب وتسجيل الدخول بنجاح! جاري تحويلك...'
            : 'Account registered and signed in successfully! Redirecting...';
          showToast.success(successMsg);
          setTimeout(() => {
            const dest = getDestinationUrl();
            router.push(dest);
          }, 1000);
        } else {
          const successMsg = isAr
            ? 'تم إنشاء الحساب بنجاح! يرجى إدخال كلمة المرور لتسجيل الدخول...'
            : 'Account registered successfully! Please sign in to activate your session...';
          showToast.success(successMsg);
          setTimeout(() => {
            const target = getDestinationUrl();
            const redirectParam = target && target !== '/' ? `&redirect=${encodeURIComponent(target)}` : '';
            router.push(`/login?registered=true&email=${encodeURIComponent(payload.email)}${redirectParam}`);
          }, 1400);
        }
      } else {
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          setErrorList(result.errors);
          setError(result.errors[0]);
          result.errors.forEach((err) => showToast.error(err));
        } else {
          const errMsg = result.message || (isAr ? 'حدث خطأ أثناء إنشاء الحساب' : 'Registration failed');
          setError(errMsg);
          showToast.error(errMsg);
        }
      }
    } catch (err) {
      const errMsg = isAr ? 'تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى' : 'Failed to connect to the server. Please try again.';
      setError(errMsg);
      showToast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="register-page-root"
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
        className="register-main-container"
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
        {/* ── Left Column: Visual Artwork & Academy Proposition ── */}
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
            alt="FXENGIN Academy"
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

          {/* Content Area with Smooth Shadow Overlay */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              padding: '36px 44px 20px',
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
            {/* Top Tagline & Live Stats Pill */}
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
                {isAr ? 'مجتمع يضم +50,000 متداول' : '+50,000 Active Community'}
              </span>
            </div>

            {/* Main Academy Content Block */}
            <div
              style={{
                maxWidth: '560px',
                margin: 'auto 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
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
                  {isAr ? 'انضم لأكاديمية FXENGIN التعليمية' : 'Join FXENGIN Trading Academy'}
                </span>
              </div>

              <h2
                style={{
                  fontSize: 'clamp(20px, 2vw, 28px)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1.3,
                  margin: 0,
                  textShadow: '0 2px 12px rgba(0,0,0,0.8)',
                }}
              >
                {isAr ? (
                  <>
                    خطوتان فقط تفصلك عن عالم{' '}
                    <span className="text-gradient-brand">التداول الاحترافي</span>
                  </>
                ) : (
                  <>
                    Only two steps away from{' '}
                    <span className="text-gradient-brand">Professional Trading</span>
                  </>
                )}
              </h2>

              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(245, 247, 250, 0.88)',
                  lineHeight: 1.6,
                  margin: 0,
                  maxWidth: '540px',
                  textShadow: '0 1px 6px rgba(0,0,0,0.7)',
                }}
              >
                {isAr
                  ? 'أنشئ حسابك المجاني في أقل من دقيقة لتصل إلى مكتبة الكورسات، التحليلات الحية، وأقوى أدوات إدارة رأس المال.'
                  : 'Create your free account in under 60 seconds to access comprehensive courses, live analysis, and advanced risk tools.'}
              </p>

              {/* 4 Focused Highlights */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px 16px',
                  marginTop: '4px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                {[
                  {
                    title: isAr ? '120+ دورة تدريبية' : '120+ Pro Courses',
                    desc: isAr ? 'محتوى متدرج من الصفر للاحتراف' : 'Progressive tracks from beginner to pro',
                  },
                  {
                    title: isAr ? 'تحليلات سوقية حية' : 'Live Market Analysis',
                    desc: isAr ? 'تغطية يومية للعملات والذهب' : 'Daily forex, gold & commodities',
                  },
                  {
                    title: isAr ? 'أدوات وإشارات ذكية' : 'Smart Trading Tools',
                    desc: isAr ? 'حاسبات متقدمة وتنبيهات فورية' : 'Risk calculators & real-time alerts',
                  },
                  {
                    title: isAr ? 'شهادات إتمام معتمدة' : 'Verified Certificates',
                    desc: isAr ? 'توثيق رسمي لرحلتك التعليمية' : 'Credentials upon course completion',
                  },
                ].map(({ title, desc }) => (
                  <div key={title} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(22, 199, 132, 0.2)',
                        border: '1px solid rgba(22, 199, 132, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}
                    >
                      <FiCheck size={12} color="var(--success)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF', marginBottom: '1px' }}>
                        {title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.4 }}>
                        {desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ fontSize: '11.5px', color: 'rgba(245, 247, 250, 0.75)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#FBBF24' }}>★★★★★</span>
                <span>{isAr ? 'تقييم 4.9/5 من أكثر من 18,000 متدرب' : 'Rated 4.9/5 by 18,000+ traders'}</span>
              </div>


            </div>
          </div>
        </div>

        {/* ── Right Column: Multi-Step Sign Up Form Panel (No-Scroll Optimized) ── */}
        <div
          className="register-form-panel"
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 36px',
            background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(4, 136, 248, 0.07) 0%, transparent 60%), radial-gradient(ellipse 70% 40% at 85% 100%, rgba(251, 135, 4, 0.05) 0%, transparent 60%), linear-gradient(180deg, #02091A 0%, #010512 40%, #00030A 100%)',
            overflowY: 'auto',
            position: 'relative',
            borderInlineStart: '1px solid var(--border)',
          }}
        >
          {/* Ambient Lighting */}
          <div aria-hidden style={{
            position: 'absolute',
            top: '0',
            right: '10%',
            width: '240px',
            height: '240px',
            background: 'radial-gradient(circle, rgba(4, 136, 248, 0.06) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(45px)',
            pointerEvents: 'none',
          }} />

          {/* Top Bar: Brand Logo & Close Button */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '40px',
              flexShrink: 0,
            }}
          >
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                direction: 'ltr',
              }}
            >
              <img
                src="/assets/Images/Logo/logo.webp"
                alt="FXENGIN Logo"
                style={{ width: '38px', height: '38px', objectFit: 'contain' }}
              />
              <span
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 900,
                  fontSize: '22px',
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

            <Link
              href="/"
              aria-label="Close"
              style={{
                position: 'absolute',
                insetInlineEnd: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <FiX size={17} />
            </Link>
          </div>

          {/* Form Content Wrapper */}
          <div
            className="form-inner-content"
            style={{
              width: '100%',
              maxWidth: '520px',
              margin: 'auto',
              padding: '8px 0',
            }}
          >
            {/* Title & Subtitle */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 4px 0',
                }}
              >
                {t.register.title}
              </h1>
              <p
                style={{
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  margin: 0,
                }}
              >
                {showOtpStep
                  ? (isAr ? 'التحقق الثنائي: أدخل الرمز المرسل لتفعيل حسابك' : 'Two-Factor Verification: Enter the code sent to activate your account')
                  : currentStep === 1
                  ? (t.register.steps?.step1Desc || (isAr ? 'الخطوة 1 من 2: أدخل بياناتك الأساسية' : 'Step 1 of 2: Basic details'))
                  : (t.register.steps?.step2Desc || (isAr ? 'الخطوة 2 من 2: مستوى التداول وكلمة المرور' : 'Step 2 of 2: Trading level & credentials'))}
              </p>
            </div>

            {/* ── STEPPER PROGRESS BAR ── */}
            {!showOtpStep && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {/* Step 1 Pill */}
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: currentStep === 1 ? 'rgba(4, 136, 248, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                    border: currentStep === 1 ? '1px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: isAr ? 'right' : 'left',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: currentStep > 1 ? 'var(--success)' : currentStep === 1 ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {currentStep > 1 ? <FiCheck size={13} /> : '1'}
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: currentStep === 1 ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.register.steps?.step1 || (isAr ? 'البيانات الشخصية' : 'Personal Info')}
                    </div>
                  </div>
                </button>

                {/* Step 2 Pill */}
                <button
                  type="button"
                  onClick={() => {
                    if (fullName && email && phoneNumber && dateOfBirth) {
                      handleNextStep();
                    }
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: currentStep === 2 ? 'rgba(251, 135, 4, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                    border: currentStep === 2 ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: isAr ? 'right' : 'left',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: currentStep === 2 ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: currentStep === 2 ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.register.steps?.step2 || (isAr ? 'الخبرة والأمان' : 'Security & Level')}
                    </div>
                  </div>
                </button>
              </div>

              {/* Smooth Progress Line */}
              <div style={{ width: '100%', height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: currentStep === 1 ? '50%' : '100%',
                    background: currentStep === 1 ? 'var(--primary-gradient)' : 'var(--accent-gradient)',
                    transition: 'all 0.3s ease',
                  }}
                />
              </div>
            </div>
            )}

            {/* Error Banner */}
            {error && (
              <div
                style={{
                  background: 'rgba(246, 70, 93, 0.12)',
                  border: '1px solid var(--error)',
                  color: 'var(--error)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  lineHeight: 1.4,
                }}
              >
                <FiAlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  {errorList.length > 1 ? (
                    <ul style={{ margin: 0, paddingInlineStart: '16px' }}>
                      {errorList.map((errItem, idx) => (
                        <li key={idx}>{errItem}</li>
                      ))}
                    </ul>
                  ) : (
                    <span>{error}</span>
                  )}
                </div>
              </div>
            )}

            {/* Success Banner */}
            {success && (
              <div
                style={{
                  background: 'rgba(22, 199, 132, 0.16)',
                  border: '1px solid var(--success)',
                  color: 'var(--success)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FiCheckCircle size={16} />
                <span>{t.register.successMsg || (isAr ? 'تم إنشاء الحساب بنجاح! جاري تحويلك...' : 'Account created successfully! Redirecting...')}</span>
              </div>
            )}

            {/* ══════════════ OTP VERIFICATION STEP ══════════════ */}
            {showOtpStep ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    {isAr ? 'رمز التحقق لتفعيل الحساب (OTP)' : 'Account Activation Security Code (OTP)'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {isAr ? 'تم إرسال كود التحقق لمرة واحدة من fxengin519@gmail.com إلى بريدك:' : 'A one-time security code was sent from fxengin519@gmail.com to:'}
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
                  {loading ? (
                    <>
                      <FiLoader size={16} className="animate-spin" />
                      <span>{isAr ? 'جاري التحقق وتفعيل الحساب...' : 'Verifying & Activating...'}</span>
                    </>
                  ) : (
                    <span>{isAr ? 'تأكيد الرمز وتفعيل الحساب ←' : 'Confirm Code & Activate Account →'}</span>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowOtpStep(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    {isAr ? '← العودة وتعديل البيانات' : '← Back & Edit Details'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* ══════════════ STEP 1: PERSONAL DETAILS ══════════════ */}
                {currentStep === 1 && (
              <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                {/* 1. Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                    {t.register.fullName} <span style={{ color: 'var(--accent)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isAr ? 'محمد أحمد' : 'John Doe'}
                      required
                      minLength={3}
                      maxLength={70}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: isAr ? '0 12px 0 36px' : '0 36px 0 12px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        [isAr ? 'left' : 'right']: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <FiUser size={14} />
                    </div>
                  </div>
                </div>

                {/* 2. Email Address */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                    {t.register.email} <span style={{ color: 'var(--accent)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      dir="ltr"
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 12px 0 36px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        textAlign: 'left',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <FiMail size={14} />
                    </div>
                  </div>
                </div>

                {/* 3. Phone Number & Date of Birth in 2 Columns Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {/* Phone */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                      {t.register.phone} <span style={{ color: 'var(--accent)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+966 50 000 0000"
                        required
                        dir="ltr"
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 8px 0 32px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '12.5px',
                          textAlign: 'left',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <FiPhone size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                      {t.register.dateOfBirth || (isAr ? 'تاريخ الميلاد' : 'Date of Birth')} <span style={{ color: 'var(--accent)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        required
                        max={new Date().toISOString().split('T')[0]}
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: isAr ? '0 8px 0 32px' : '0 32px 0 8px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '12.5px',
                          colorScheme: 'dark',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          [isAr ? 'left' : 'right']: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <FiCalendar size={13} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Step Button */}
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    width: '100%',
                    height: '42px',
                    fontSize: '14px',
                    fontWeight: 700,
                    marginTop: '6px',
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <span>{t.register.steps?.next || (isAr ? 'المتابعة للخطوة التالية' : 'Continue to Next Step')}</span>
                  <FiArrowLeft size={15} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
                </button>

                {/* Social Quick Login Row */}
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.register.or || (isAr ? 'أو التسجيل السريع' : 'or quick signup')}</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                </div>

                {/* Google Social Register Button */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                  {/* Google */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    style={{
                      height: '38px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.background = 'rgba(4, 136, 248, 0.12)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(4, 136, 248, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.2)';
                    }}
                  >
                    <FaGoogle size={14} color="#EA4335" />
                    <span>{isAr ? 'إنشاء حساب عبر Google' : (t.register.googleBtn || 'Continue with Google')}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ══════════════ STEP 2: TRADING & SECURITY ══════════════ */}
            {currentStep === 2 && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                {/* 1. Experience Level Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {t.register.tradingLevel}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {[
                      { key: 'BEGINNER', label: t.register.levels?.beginner || (isAr ? 'مبتدئ' : 'Beginner') },
                      { key: 'INTERMEDIATE', label: t.register.levels?.intermediate || (isAr ? 'متوسط' : 'Intermediate') },
                      { key: 'ADVANCED', label: t.register.levels?.advanced || (isAr ? 'محترف' : 'Pro / Advanced') },
                    ].map(({ key, label: lvlName }) => {
                      const isSel = experienceLevel === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setExperienceLevel(key)}
                          disabled={loading}
                          style={{
                            height: '34px',
                            background: isSel ? 'rgba(251, 135, 4, 0.16)' : 'var(--bg-primary)',
                            border: isSel ? '1px solid var(--accent)' : '1px solid var(--border)',
                            color: isSel ? 'var(--accent)' : 'var(--text-secondary)',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: isSel ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                        >
                          {isSel && <FiCheck size={11} />}
                          {lvlName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Password & Confirm Password (2 Column Grid) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {/* Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                      {t.register.password} <span style={{ color: 'var(--accent)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                        dir="ltr"
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 30px 0 30px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '12.5px',
                          textAlign: 'left',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: '9px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <FiLock size={13} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password"
                        style={{
                          position: 'absolute',
                          right: '9px',
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
                        {showPassword ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                      {t.register.confirmPassword} <span style={{ color: 'var(--accent)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                        dir="ltr"
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 30px 0 30px',
                          background: 'var(--bg-primary)',
                          border: confirmPassword && confirmPassword !== password ? '1px solid var(--error)' : '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '12.5px',
                          textAlign: 'left',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: '9px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <FiLock size={13} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label="Toggle confirm password"
                        style={{
                          position: 'absolute',
                          right: '9px',
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
                        {showConfirmPassword ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Password Strength Meter & Real-time Checklist */}
                {password && (
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', gap: '4px', height: '3px', marginBottom: '4px' }}>
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          style={{
                            flex: 1,
                            borderRadius: '2px',
                            background: strength >= step ? strengthColors[strength] : 'var(--border)',
                            transition: 'all 0.2s ease',
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', marginBottom: '4px' }}>
                      <span style={{ color: strengthColors[strength], fontWeight: 600 }}>
                        {isAr ? 'القوة:' : 'Strength:'} {strengthLabels[strength]}
                      </span>
                      {confirmPassword && (
                        <span style={{ color: confirmPassword === password ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                          {confirmPassword === password ? (isAr ? '✓ متطابقة' : '✓ Matching') : (isAr ? '✗ غير متطابقة' : '✗ Mismatch')}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 8px', fontSize: '10px' }}>
                      <span style={{ color: hasMinLength ? 'var(--success)' : 'var(--text-muted)' }}>
                        {hasMinLength ? '✓' : '•'} {isAr ? '8+ خانات' : '8+ chars'}
                      </span>
                      <span style={{ color: hasUpperCase ? 'var(--success)' : 'var(--text-muted)' }}>
                        {hasUpperCase ? '✓' : '•'} {isAr ? 'حرف كبير' : 'Uppercase'}
                      </span>
                      <span style={{ color: hasLowerCase ? 'var(--success)' : 'var(--text-muted)' }}>
                        {hasLowerCase ? '✓' : '•'} {isAr ? 'حرف صغير' : 'Lowercase'}
                      </span>
                      <span style={{ color: hasNumberOrSymbol ? 'var(--success)' : 'var(--text-muted)' }}>
                        {hasNumberOrSymbol ? '✓' : '•'} {isAr ? 'رقم/رمز' : 'Number/Symbol'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Terms Checkbox */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '2px' }}>
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    disabled={loading}
                    style={{
                      width: '15px',
                      height: '15px',
                      marginTop: '2px',
                      accentColor: 'var(--accent)',
                      cursor: 'pointer',
                    }}
                  />
                  <label
                    htmlFor="agree"
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.35,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    {t.register.agreeTerms}
                  </label>
                </div>

                {/* 5. Navigation Buttons: Back & Submit */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    disabled={loading}
                    style={{
                      width: '90px',
                      height: '42px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <FiArrowRight size={14} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
                    <span>{t.register.steps?.back || (isAr ? 'السابق' : 'Back')}</span>
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading || success}
                    style={{
                      flex: 1,
                      height: '42px',
                      fontSize: '14px',
                      fontWeight: 700,
                      justifyContent: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: loading ? 'wait' : 'pointer',
                      opacity: loading ? 0.8 : 1,
                    }}
                  >
                    {loading ? (
                      <>
                        <FiLoader size={16} className="animate-spin" />
                        <span>{t.register.submittingBtn || (isAr ? 'جاري إنشاء الحساب...' : 'Creating Account...')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t.register.submitBtn}</span>
                        <FiArrowLeft size={15} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
            </>
          )}

            {/* Bottom Switcher */}
            <div
              style={{
                marginTop: '12px',
                textAlign: 'center',
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
              }}
            >
              {t.register.hasAccount}{' '}
              <Link
                href={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
                style={{
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                {t.register.signInLink}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Responsive Mobile Styling ── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 992px) {
          .register-page-root {
            padding: 16px !important;
            min-height: 100vh !important;
            height: auto !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .full-blurred-bg {
            display: block !important;
          }
          .register-main-container {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            max-width: 480px !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            margin: auto !important;
          }
          .desktop-visual-panel {
            display: none !important;
          }
          .register-form-panel {
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            background: rgba(6, 20, 47, 0.92) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(18, 49, 92, 0.75) !important;
            border-radius: 20px !important;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.88) !important;
            padding: 24px 18px !important;
          }
        }
      `}</style>
    </div>
  );
}
