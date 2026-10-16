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
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiShield,
  FiKey,
  FiRefreshCw,
  FiEdit2,
  FiAlertCircle,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from '../utils/toast';
import { requestPasswordReset, verifyResetOtp, resetPassword } from '../services/authService';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isAr, toggleLanguage } = useLanguage();

  // Multi-step state: 1 = Email, 2 = OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2: 6-digit OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Step 3: Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 4: Auto-redirect countdown
  const [countdown, setCountdown] = useState(5);

  // Read URL query params (e.g. ?email=user@example.com&otp=123456)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      const otpParam = params.get('otp');
      if (emailParam) {
        setEmail(emailParam);
      }
      if (otpParam && otpParam.length === 6) {
        setOtp(otpParam.split(''));
        setStep(2);
      }
    }
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Step 4 Auto-redirect countdown
  useEffect(() => {
    let interval = null;
    if (step === 4 && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (step === 4 && countdown === 0) {
      router.push(`/login${email ? `?email=${encodeURIComponent(email)}` : ''}`);
    }
    return () => clearInterval(interval);
  }, [step, countdown, email, router]);

  // Password Strength Calculation (0 - 4 score)
  const passwordCriteria = {
    length: newPassword.length >= 8,
    mixedCase: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    symbol: /[^a-zA-Z0-9]/.test(newPassword),
    match: newPassword && newPassword === confirmPassword,
  };

  const strengthScore = [
    passwordCriteria.length,
    passwordCriteria.mixedCase,
    passwordCriteria.number,
    passwordCriteria.symbol,
  ].filter(Boolean).length;

  const strengthLabels = {
    1: { labelAr: 'ضعيفة', labelEn: 'Weak', color: 'var(--error)' },
    2: { labelAr: 'متوسطة', labelEn: 'Fair', color: 'var(--accent)' },
    3: { labelAr: 'جيدة', labelEn: 'Good', color: 'var(--primary)' },
    4: { labelAr: 'قوية جداً', labelEn: 'Strong', color: 'var(--success)' },
  };

  // ── Step 1: Submit Email Request ──
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      const msg = isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address';
      setError(msg);
      showToast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(cleanEmail);
      if (res.success) {
        showToast.success(isAr ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' : 'Verification code sent to your email');
        setStep(2);
        setResendTimer(60);
        setCanResend(false);
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 300);
      } else {
        const msg = res.message || (isAr ? 'فشل إرسال رمز التحقق' : 'Failed to send verification code');
        setError(msg);
        showToast.error(msg);
      }
    } catch (err) {
      const msg = isAr ? 'حدث خطأ في الاتصال' : 'Connection error';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Handle OTP Input & Verification ──
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle multi-character paste or autofill
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) newOtp[index + i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    setError('');
    try {
      await requestPasswordReset(email);
      showToast.success(isAr ? 'تمت إعادة إرسال رمز التحقق' : 'Verification code resent successfully');
      setResendTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      showToast.error(isAr ? 'فشلت إعادة الإرسال' : 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      const msg = isAr ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام' : 'Please enter the complete 6-digit code';
      setError(msg);
      showToast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const res = await verifyResetOtp(email, fullOtp);
      if (res.success) {
        showToast.success(isAr ? 'تم التحقق من الرمز بنجاح' : 'Code verified successfully');
        setStep(3);
      } else {
        const msg = res.message || (isAr ? 'رمز التحقق غير صحيح أو منتهي الصلاحية' : 'Invalid or expired code');
        setError(msg);
        showToast.error(msg);
      }
    } catch (err) {
      const msg = isAr ? 'خطأ في التحقق من الرمز' : 'Verification error';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Submit New Password ──
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!passwordCriteria.length || !passwordCriteria.mixedCase || !passwordCriteria.number) {
      const msg = isAr
        ? 'يرجى استيفاء جميع متطلبات كلمة المرور'
        : 'Please fulfill all password requirements';
      setError(msg);
      showToast.error(msg);
      return;
    }

    if (!passwordCriteria.match) {
      const msg = isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';
      setError(msg);
      showToast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({
        email,
        otp: otp.join(''),
        newPassword,
      });

      if (res.success) {
        showToast.success(isAr ? 'تم تحديث كلمة المرور بنجاح!' : 'Password updated successfully!');
        setStep(4);
        setCountdown(5);
      } else {
        const msg = res.message || (isAr ? 'فشل إعادة تعيين كلمة المرور' : 'Failed to reset password');
        setError(msg);
        showToast.error(msg);
      }
    } catch (err) {
      const msg = isAr ? 'حدث خطأ أثناء حفظ كلمة المرور' : 'Error saving password';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="forgot-page-root"
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
      {/* ── Background Blurred Visual for Responsive Small Screens ── */}
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
            background: 'radial-gradient(ellipse at center, rgba(1, 7, 30, 0.4) 0%, rgba(0, 3, 13, 0.75) 100%)',
          }}
        />
      </div>

      {/* ── Full Screen 2-Column Container (100vw x 100vh on Desktop) ── */}
      <div
        className="forgot-main-container"
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
        {/* ── Column 1: Left Visual Artwork Panel ── */}
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
          <img
            src="/assets/Images/Main/login-visual.webp"
            alt="Security & Recovery"
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

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              padding: '40px 48px 24px',
              background: 'radial-gradient(ellipse at center, rgba(0, 3, 13, 0.65) 0%, rgba(0, 3, 13, 0.9) 100%)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100vh',
              width: '100%',
            }}
          >
            {/* Top Security Pill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <FiShield size={12} color="var(--accent)" />
                <span>{isAr ? 'بروتوكول أمان واستعادة مشفر' : 'Encrypted Recovery Protocol'}</span>
              </span>
            </div>

            {/* Middle Feature Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '440px' }}>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    letterSpacing: '1.2px',
                    fontWeight: 800,
                    color: 'var(--primary)',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  {isAr ? 'حماية الحسابات المالية' : 'ACCOUNT SECURITY ASSURANCE'}
                </span>
                <h2
                  style={{
                    fontSize: 'clamp(24px, 2.5vw, 34px)',
                    fontWeight: 900,
                    color: '#F5F7FA',
                    lineHeight: 1.25,
                    margin: '0 0 12px 0',
                  }}
                >
                  {isAr ? 'استعادة وصول آمنة ' : 'Secure Access Recovery for '}
                  <span className="text-gradient-brand">
                    {isAr ? 'لمحفظتك وتداولاتك' : 'Your Trading Portfolio'}
                  </span>
                </h2>
                <p style={{ fontSize: '13.5px', color: 'rgba(245, 247, 250, 0.75)', lineHeight: 1.6, margin: 0 }}>
                  {isAr
                    ? 'نطبق أعلى معايير التشفير المصرفي لحماية بياناتك وأصولك المالية مع استعادة سريعة لحسابك.'
                    : 'We apply bank-grade SSL encryption to protect your financial assets with fast, secure multi-factor account restoration.'}
                </p>
              </div>

              {/* Security Bullet Points */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(22, 199, 132, 0.15)',
                      color: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                    }}
                  >
                    ✓
                  </div>
                  <span style={{ fontSize: '12.5px', color: '#E2E8F0' }}>
                    {isAr ? 'رمز تحقق مؤقت لمرة واحدة (Time-based OTP)' : 'Single-use Time-based OTP Verification'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(22, 199, 132, 0.15)',
                      color: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                    }}
                  >
                    ✓
                  </div>
                  <span style={{ fontSize: '12.5px', color: '#E2E8F0' }}>
                    {isAr ? 'تشفير فوري لكلمات المرور بمعايير SHA-256' : 'Instant SHA-256 Secure Password Hash'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(22, 199, 132, 0.15)',
                      color: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                    }}
                  >
                    ✓
                  </div>
                  <span style={{ fontSize: '12.5px', color: '#E2E8F0' }}>
                    {isAr ? 'إنهاء كافة الجلسات النشطة المشبوهة تلقائياً' : 'Automated Revocation of Stale Remote Sessions'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Brand Watermark */}
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'monospace' }}>
              FXENGIN CORE SECURITY ENGINE © 2026
            </div>
          </div>
        </div>

        {/* ── Column 2: Right Form & Wizard Panel ── */}
        <div
          className="form-panel-scroll"
          style={{
            height: '100vh',
            overflowY: 'auto',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 'clamp(24px, 4vw, 44px) clamp(24px, 5vw, 56px)',
          }}
        >
          {/* Top Bar: Logo & Language Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src="/assets/Images/Logo/logo.webp"
                alt="FXENGIN Logo"
                style={{ width: '38px', height: '38px', objectFit: 'contain' }}
              />
              <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                FX<span style={{ color: 'var(--accent)' }}>ENGIN</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={toggleLanguage}
              className="lang-switcher"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                background: 'rgba(6, 20, 47, 0.7)',
                border: '1px solid var(--border)',
                padding: '5px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {isAr ? 'English' : 'عربي'}
            </button>
          </div>

          {/* Wizard Center Content Container */}
          <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
            {/* ── Visual 4-Step Progress Indicator ── */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                {/* Connecting background line */}
                <div
                  style={{
                    position: 'absolute',
                    top: '15px',
                    left: '12%',
                    right: '12%',
                    height: '2px',
                    background: 'rgba(18, 49, 92, 0.7)',
                    zIndex: 1,
                  }}
                />
                {/* Connecting active progress line */}
                <div
                  style={{
                    position: 'absolute',
                    top: '15px',
                    left: '12%',
                    width: `${((step - 1) / 3) * 76}%`,
                    height: '2px',
                    background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                    zIndex: 2,
                    transition: 'width 0.35s ease',
                  }}
                />

                {[
                  { num: 1, labelAr: 'البريد', labelEn: 'Email', icon: FiMail },
                  { num: 2, labelAr: 'الرمز', labelEn: 'Code', icon: FiKey },
                  { num: 3, labelAr: 'المرور', labelEn: 'Password', icon: FiLock },
                  { num: 4, labelAr: 'اكتمال', labelEn: 'Done', icon: FiCheckCircle },
                ].map((s) => {
                  const isCompleted = step > s.num;
                  const isCurrent = step === s.num;
                  const Icon = s.icon;

                  return (
                    <div
                      key={s.num}
                      style={{
                        position: 'relative',
                        zIndex: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isCompleted
                            ? 'var(--success)'
                            : isCurrent
                            ? 'var(--primary-gradient)'
                            : 'var(--surface)',
                          border: isCompleted
                            ? '2px solid var(--success)'
                            : isCurrent
                            ? '2px solid var(--primary)'
                            : '2px solid var(--border)',
                          color: isCompleted || isCurrent ? '#FFF' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 800,
                          boxShadow: isCurrent ? '0 0 14px rgba(4, 136, 248, 0.5)' : 'none',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {isCompleted ? <FiCheck size={14} /> : s.num}
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: isCurrent ? 800 : 500,
                          color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                          transition: 'color 0.2s ease',
                        }}
                      >
                        {isAr ? s.labelAr : s.labelEn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Alert Box */}
            {error && (
              <div
                style={{
                  background: 'rgba(246, 70, 93, 0.12)',
                  border: '1px solid rgba(246, 70, 93, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--error)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                }}
              >
                <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 1: REQUEST OTP (ENTER EMAIL)
            ══════════════════════════════════════════════════ */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                    {isAr ? 'استعادة كلمة المرور' : 'Reset Your Password'}
                  </h1>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {isAr
                      ? 'أدخل بريدك الإلكتروني المسجل وسنرسل لك رمز أمان مكوّناً من 6 أرقام لإعادة تعيين كلمة المرور.'
                      : 'Enter your registered email address and we will send a 6-digit security code to reset your password.'}
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      autoFocus
                      dir="ltr"
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 40px 0 40px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        textAlign: 'left',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
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

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: loading ? 0.75 : 1,
                  }}
                >
                  {loading ? (isAr ? 'جارٍ الإرسال...' : 'Sending...') : (isAr ? 'إرسال رمز التحقق' : 'Send Verification Code')}
                  {isAr ? <FiArrowLeft size={16} /> : <FiArrowRight size={16} />}
                </button>

                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  <Link
                    href="/login"
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 600,
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    {isAr ? <FiArrowRight size={13} /> : <FiArrowLeft size={13} />}
                    <span>{isAr ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}</span>
                  </Link>
                </div>
              </form>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 2: ENTER 6-DIGIT OTP
            ══════════════════════════════════════════════════ */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                    {isAr ? 'أدخل رمز التحقق (OTP)' : 'Enter Security Code'}
                  </h1>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {isAr ? 'تم إرسال كود التحقق المكون من 6 أرقام إلى بريدك:' : 'We sent a 6-digit code to:'}{' '}
                    <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{email}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '6px',
                      fontWeight: 600,
                    }}
                  >
                    <FiEdit2 size={12} />
                    <span>{isAr ? 'تعديل البريد الإلكتروني' : 'Edit Email Address'}</span>
                  </button>
                </div>

                {/* 6 OTP Input Boxes */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', direction: 'ltr' }}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      style={{
                        width: '48px',
                        height: '52px',
                        borderRadius: '10px',
                        background: 'var(--bg-primary)',
                        border: digit ? '2px solid var(--primary)' : '1px solid var(--border)',
                        color: '#FFF',
                        fontSize: '20px',
                        fontWeight: 800,
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        outline: 'none',
                        boxShadow: digit ? '0 0 12px rgba(4, 136, 248, 0.25)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={(e) => (e.target.style.borderColor = digit ? 'var(--primary)' : 'var(--border)')}
                    />
                  ))}
                </div>

                {/* Resend Timer Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {isAr ? 'لم يصلك الرمز؟' : "Didn't receive the code?"}
                  </span>

                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <FiRefreshCw size={13} />
                      <span>{isAr ? 'إعادة إرسال الرمز' : 'Resend Code'}</span>
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {isAr ? `إعادة الإرسال بعد (${resendTimer}s)` : `Resend in (${resendTimer}s)`}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || otp.join('').length < 6}
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: loading || otp.join('').length < 6 ? 0.7 : 1,
                  }}
                >
                  {loading ? (isAr ? 'جارٍ التحقق...' : 'Verifying...') : (isAr ? 'التحقق والمتابعة' : 'Verify & Continue')}
                  {isAr ? <FiArrowLeft size={16} /> : <FiArrowRight size={16} />}
                </button>
              </form>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 3: ENTER NEW PASSWORD
            ══════════════════════════════════════════════════ */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                    {isAr ? 'تعيين كلمة المرور الجديدة' : 'Create New Password'}
                  </h1>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {isAr
                      ? 'اختر كلمة مرور قوية وغير مستخدمة لحماية حسابك الاستثماري.'
                      : 'Create a strong, unique password to secure your trading account.'}
                  </p>
                </div>

                {/* New Password Input */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoFocus
                      dir="ltr"
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 40px 0 40px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        textAlign: 'left',
                        outline: 'none',
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
                </div>

                {/* Password Strength 4-Bar Meter */}
                {newPassword && (
                  <div style={{ marginTop: '-8px' }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '2px',
                            background:
                              strengthScore >= bar
                                ? strengthLabels[strengthScore]?.color || 'var(--primary)'
                                : 'rgba(18, 49, 92, 0.5)',
                            transition: 'background 0.25s ease',
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {isAr ? 'قوة كلمة المرور:' : 'Strength:'}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: strengthLabels[strengthScore]?.color || 'var(--text-muted)',
                        }}
                      >
                        {strengthScore > 0 ? (isAr ? strengthLabels[strengthScore]?.labelAr : strengthLabels[strengthScore]?.labelEn) : '—'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Confirm Password Input */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      dir="ltr"
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 40px 0 40px',
                        background: 'var(--bg-primary)',
                        border:
                          confirmPassword && !passwordCriteria.match
                            ? '1px solid var(--error)'
                            : confirmPassword && passwordCriteria.match
                            ? '1px solid var(--success)'
                            : '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        textAlign: 'left',
                        outline: 'none',
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                      {showConfirmPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Requirements Checklist */}
                <div
                  style={{
                    background: 'rgba(6, 20, 47, 0.7)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: passwordCriteria.length ? 'var(--success)' : 'var(--text-muted)' }}>
                    <span>{passwordCriteria.length ? '✓' : '○'}</span>
                    <span>{isAr ? '8 أحرف على الأقل' : 'At least 8 characters'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: passwordCriteria.mixedCase ? 'var(--success)' : 'var(--text-muted)' }}>
                    <span>{passwordCriteria.mixedCase ? '✓' : '○'}</span>
                    <span>{isAr ? 'أحرف كبيرة وصغيرة (A-Z, a-z)' : 'Uppercase and lowercase letters'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: passwordCriteria.number ? 'var(--success)' : 'var(--text-muted)' }}>
                    <span>{passwordCriteria.number ? '✓' : '○'}</span>
                    <span>{isAr ? 'رقم واحد على الأقل (0-9)' : 'At least one number (0-9)'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: passwordCriteria.match ? 'var(--success)' : 'var(--text-muted)' }}>
                    <span>{passwordCriteria.match ? '✓' : '○'}</span>
                    <span>{isAr ? 'تطابق كلمتي المرور' : 'Passwords match'}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !passwordCriteria.length || !passwordCriteria.match}
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: loading || !passwordCriteria.length || !passwordCriteria.match ? 0.7 : 1,
                  }}
                >
                  {loading ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'حفظ كلمة المرور الجديدة' : 'Save New Password')}
                  <FiCheck size={16} />
                </button>
              </form>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 4: CELEBRATION SUCCESS & REDIRECT
            ══════════════════════════════════════════════════ */}
            {step === 4 && (
              <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '50%',
                    background: 'rgba(22, 199, 132, 0.15)',
                    border: '2px solid var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--success)',
                    boxShadow: '0 0 24px rgba(22, 199, 132, 0.4)',
                    animation: 'pulse 2s infinite',
                  }}
                >
                  <FiCheckCircle size={44} />
                </div>

                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                    {isAr ? 'تم تغيير كلمة المرور بنجاح!' : 'Password Reset Complete!'}
                  </h1>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {isAr
                      ? 'تم تحديث كلمة المرور الخاصة بحسابك بأمان. يمكنك الآن تسجيل الدخول والمتابعة.'
                      : 'Your password has been successfully updated. You can now sign in with your new credentials.'}
                  </p>
                </div>

                <div
                  style={{
                    background: 'rgba(6, 20, 47, 0.7)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 18px',
                    width: '100%',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {isAr ? (
                    <span>
                      سيتم تحويلك تلقائياً إلى صفحة تسجيل الدخول خلال{' '}
                      <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{countdown}</strong> ثوانٍ
                    </span>
                  ) : (
                    <span>
                      Auto-redirecting to login in{' '}
                      <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{countdown}</strong> seconds
                    </span>
                  )}
                </div>

                <Link
                  href={`/login${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    justifyContent: 'center',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{isAr ? 'تسجيل الدخول الآن' : 'Sign In Now'}</span>
                  {isAr ? <FiArrowLeft size={16} /> : <FiArrowRight size={16} />}
                </Link>
              </div>
            )}
          </div>

          {/* Bottom Security Footer */}
          <div
            style={{
              marginTop: '32px',
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <FiShield size={14} color="var(--accent)" />
            <span>{isAr ? 'تشفير آمن بنسبة 100% مدعوم بأنظمة FXENGIN' : '100% Encrypted & Protected by FXENGIN'}</span>
          </div>
        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 900px) {
          .desktop-visual-panel {
            display: none !important;
          }
          .forgot-main-container {
            grid-template-columns: 1fr !important;
          }
          .full-blurred-bg {
            display: block !important;
          }
          .form-panel-scroll {
            background: rgba(1, 7, 30, 0.88) !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
          }
        }
      `}</style>
    </div>
  );
}
