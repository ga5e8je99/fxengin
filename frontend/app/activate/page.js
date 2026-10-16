'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiKey,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiArrowLeft,
  FiLock,
  FiUnlock,
  FiShield,
  FiPlay,
  FiHelpCircle,
  FiCopy,
} from 'react-icons/fi';
import { FaTelegramPlane } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import { apiFetch } from '../services/apiClient';

export default function ActivatePage() {
  const router = useRouter();
  const { isAr } = useLanguage();
  const { user, isAuthenticated, loading: authLoading, refetchUser } = useAuth();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  // Format code as user types: FXG-XXXX-XXXX-XXXX
  const handleCodeChange = (e) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setCode(val);
    if (error) setError('');
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast.info(isAr ? 'يرجى تسجيل الدخول أولاً لتفعيل الكود' : 'Please log in first to activate your code');
      router.push(`/login?redirect=${encodeURIComponent('/activate')}`);
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError(isAr ? 'يرجى كتابة كود التفعيل' : 'Please enter the activation code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessResult(null);

    try {
      const res = await apiFetch('/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const msg = data?.message || (isAr ? 'كود التفعيل غير صالح أو منتهي الصلاحية' : 'Invalid or expired activation code');
        setError(msg);
        showToast.error(msg);
      } else {
        setSuccessResult(data);
        showToast.success(data.message || (isAr ? 'تم تفعيل الكود بنجاح!' : 'Code activated successfully!'));
        try {
          if (refetchUser) await refetchUser();
        } catch (authErr) {
          console.warn('Failed to refresh user profile post-activation:', authErr);
        }
        if (data.orderNumber) {
          fetch('/api/affiliate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'confirm_conversion_by_order',
              orderNumber: data.orderNumber,
            }),
          }).catch(() => {});
        }
      }
    } catch (err) {
      const msg = isAr ? 'تعذر الاتصال بخادم التفعيل، يرجى المحاولة لاحقاً' : 'Connection error, please try again';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '60px 0 100px' }}>
      <div className="container" style={{ maxWidth: '720px' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            href="/courses"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-muted)',
              fontSize: '13px',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
          >
            {isAr ? <FiArrowRight size={14} /> : <FiArrowLeft size={14} />}
            <span>{isAr ? 'العودة إلى دليل الكورسات والأكاديمية' : 'Back to Academy Courses'}</span>
          </Link>
        </div>

        {/* Main Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '44px 32px',
            boxShadow: '0 20px 60px rgba(0, 3, 13, 0.7)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top Glow Accent */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '300px',
              height: '140px',
              background: 'radial-gradient(ellipse at center, rgba(251, 135, 4, 0.25) 0%, transparent 70%)',
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 18px',
                borderRadius: '50%',
                background: successResult ? 'rgba(22, 199, 132, 0.15)' : 'rgba(251, 135, 4, 0.12)',
                border: successResult ? '2px solid var(--success)' : '2px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: successResult ? 'var(--success)' : 'var(--primary)',
                boxShadow: successResult ? '0 0 30px rgba(22, 199, 132, 0.3)' : '0 0 30px rgba(251, 135, 4, 0.25)',
                transition: 'all 0.3s ease',
              }}
            >
              {successResult ? <FiUnlock size={30} /> : <FiKey size={30} />}
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 14px',
                borderRadius: '20px',
                background: 'rgba(251, 135, 4, 0.15)',
                color: 'var(--primary)',
                display: 'inline-block',
                marginBottom: '10px',
                letterSpacing: '1px',
              }}
            >
              {isAr ? 'بوابة التفعيل الآمنة • ACTIVATION GATEWAY' : 'SECURE ACTIVATION GATEWAY'}
            </span>

            <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 30px)', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
              {isAr ? 'تفعيل الكورس أو الاشتراك' : 'Activate Course or Subscription'}
            </h1>
            <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
              {isAr
                ? 'أدخل كود التفعيل المستلم على بريدك الإلكتروني لفك القفل والوصول الفوري للمحتوى التدريبي أو الجلسات المباشرة.'
                : 'Enter your unique activation code received via email to instantly unlock your masterclass content or VIP community access.'}
            </p>
          </div>

          {/* If Activation Succeeded */}
          {successResult ? (
            <div
              style={{
                background: 'rgba(22, 199, 132, 0.08)',
                border: '1px solid rgba(22, 199, 132, 0.3)',
                borderRadius: '18px',
                padding: '30px 24px',
                textAlign: 'center',
                animation: 'fadeIn 0.4s ease',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--success)',
                  fontSize: '13px',
                  fontWeight: 800,
                  marginBottom: '12px',
                }}
              >
                <FiCheckCircle size={18} />
                <span>{isAr ? 'تم فك القفل بنجاح!' : 'UNLOCKED SUCCESSFULLY!'}</span>
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {successResult.productTitle}
              </h3>

              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                {isAr
                  ? 'تم ربط ترخيص هذا الكورس بحسابك بنجاح. أصبحت كافة الدروس وقاعات البث والملفات التدريبية مفتوحة لك بالكامل.'
                  : 'Your entitlement has been permanently bound to your account. All lectures, live sessions, and materials are now unlocked.'}
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  href={successResult.redirectUrl || '/courses'}
                  style={{
                    height: '48px',
                    padding: '0 32px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #16C784 0%, #0E9F6E 100%)',
                    color: '#000000',
                    fontSize: '14.5px',
                    fontWeight: 900,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    boxShadow: '0 6px 24px rgba(22, 199, 132, 0.35)',
                  }}
                >
                  <FiPlay size={16} />
                  <span>{isAr ? 'دخول قاعة المحاضرات الآن' : 'Enter Classroom Now'}</span>
                </Link>

                <button
                  onClick={() => {
                    setSuccessResult(null);
                    setCode('');
                  }}
                  style={{
                    height: '48px',
                    padding: '0 20px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isAr ? 'تفعيل كود آخر' : 'Activate Another Code'}
                </button>
              </div>
            </div>
          ) : (
            /* Activation Input Form */
            <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 800,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                  }}
                >
                  {isAr ? 'كود التفعيل (Activation Code):' : 'Activation Code:'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="FXG-XXXX-XXXX-XXXX"
                    value={code}
                    onChange={handleCodeChange}
                    style={{
                      width: '100%',
                      height: '56px',
                      padding: '0 48px 0 20px',
                      background: 'rgba(1, 7, 30, 0.8)',
                      border: error ? '2px solid var(--danger)' : '2px solid var(--border)',
                      borderRadius: '14px',
                      color: 'var(--text-primary)',
                      fontSize: '18px',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      letterSpacing: '3px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      if (!error) e.target.style.borderColor = 'var(--primary)';
                    }}
                    onBlur={(e) => {
                      if (!error) e.target.style.borderColor = 'var(--border)';
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <FiShield size={20} />
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--danger)',
                      fontSize: '12.5px',
                      marginTop: '8px',
                      fontWeight: 700,
                    }}
                  >
                    <FiAlertCircle size={15} />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  height: '54px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #FB8704 0%, #FF5500 100%)',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 900,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 30px rgba(251, 135, 4, 0.4)',
                  transition: 'opacity 0.2s, transform 0.1s',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <span>{isAr ? 'جاري التحقق من الكود...' : 'Verifying Code...'}</span>
                ) : (
                  <>
                    <FiUnlock size={18} />
                    <span>{isAr ? 'تفعيل المحتوى وفك القفل الآن' : 'Unlock & Activate Content Now'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Notice */}
          <div
            style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              fontSize: '12.5px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
            }}
          >
            <FiHelpCircle size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>
                {isAr ? 'هل تواجه صعوبة أو لم تستلم الكود بعد؟' : 'Haven’t received your code yet?'}
              </strong>
              <div style={{ marginTop: '2px' }}>
                {isAr
                  ? 'يتم إصدار الأكواد تلقائياً بعد تأكيد ومراجعة إيصال السداد من قبل الإدارة المالية. يمكنك مراسلة الدعم مباشرة عبر '
                  : 'Activation codes are generated once payment verification is approved. Contact support on '}
                <a
                  href="https://t.me/FXenginsignals"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0488F8', fontWeight: 800, textDecoration: 'none' }}
                >
                  تيليجرام @FXenginsignals
                </a>{' '}
                {isAr ? 'لتأكيد السداد السريع.' : 'for instant verification.'}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
