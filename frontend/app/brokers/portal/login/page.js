'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  FiLock,
  FiUser,
  FiShield,
  FiArrowRight,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiBriefcase,
  FiZap,
} from 'react-icons/fi';
import { useLanguage } from '../../../context/LanguageContext';
import {
  loginBroker,
  getCurrentBrokerSession,
  fetchContractedBrokers,
} from '../../../services/brokerPortalService';

export default function BrokerPortalLoginPage() {
  const router = useRouter();
  const { isAr } = useLanguage();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contractedBrokers, setContractedBrokers] = useState([]);

  // Check if already logged in
  useEffect(() => {
    const session = getCurrentBrokerSession();
    if (session && session.broker) {
      router.push('/brokers/portal');
    }
    // Load brokers for fast demo switch
    fetchContractedBrokers().then((list) => setContractedBrokers(list || []));
  }, [router]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    const res = await loginBroker({ usernameOrEmail, password });
    if (res.success) {
      router.push('/brokers/portal');
    } else {
      setError(res.error || (isAr ? 'فشل تسجيل الدخول' : 'Login failed'));
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (brokerId) => {
    setError('');
    setLoading(true);
    const res = await loginBroker({ demoBrokerId: brokerId });
    if (res.success) {
      router.push('/brokers/portal');
    } else {
      setError(res.error || 'تعذر تسجيل الدخول بالحساب التجريبي');
      setLoading(false);
    }
  };

  const ArrowIcon = isAr ? FiArrowLeft : FiArrowRight;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #0A1E3F 0%, #030B1A 70%, #01060E 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2.5rem 1.25rem',
        position: 'relative',
        overflow: 'hidden',
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Background Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          insetInlineStart: '15%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(4, 136, 248, 0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          insetInlineEnd: '10%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251, 135, 4, 0.15) 0%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Container */}
      <div style={{ width: '100%', maxWidth: '30rem', position: 'relative', zIndex: 2 }}>
        {/* Brand & Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.625rem',
              textDecoration: 'none',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #0488F8 0%, #0050B3 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(4, 136, 248, 0.4)',
              }}
            >
              <FiBriefcase color="#FFFFFF" size={22} />
            </div>
            <div style={{ textAlign: isAr ? 'right' : 'left' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                FXENGIN
              </div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#FB8704', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Institutional Portal
              </div>
            </div>
          </Link>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(251, 135, 4, 0.12)',
              border: '1px solid rgba(251, 135, 4, 0.3)',
              color: '#FB8704',
              fontSize: '0.75rem',
              fontWeight: 800,
              marginBottom: '0.85rem',
            }}
          >
            <FiShield size={14} />
            <span>{isAr ? 'بوابة الوسطاء والشركاء المتعاقدين الرسميين' : 'Official Contracted Brokers Portal'}</span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.5rem' }}>
            {isAr ? 'تسجيل دخول الوسيط الشريك' : 'Partner Broker Login'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
            {isAr
              ? 'إدارة عقود الإعلانات والرعايات، إطلاق العروض الترويجية، وطلب تنظيم الإيفينتات والمؤتمرات'
              : 'Manage advertising contracts, promotional offers, and submit custom event hosting requests'}
          </p>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(10, 30, 63, 0.85) 0%, rgba(5, 17, 39, 0.95) 100%)',
            border: '1px solid rgba(4, 136, 248, 0.25)',
            borderRadius: '1.25rem',
            padding: '2rem 1.75rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#F87171',
                fontSize: '0.8125rem',
                marginBottom: '1.25rem',
              }}
            >
              <FiAlertCircle size={18} style={{ shrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Username / Email */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#CBD5E1',
                  marginBottom: '0.5rem',
                }}
              >
                {isAr ? 'اسم المستخدم أو البريد الإلكتروني للوسيط' : 'Broker Username or Partner Email'}
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    insetInlineStart: '1rem',
                    color: '#64748B',
                    pointerEvents: 'none',
                    display: 'flex',
                  }}
                >
                  <FiUser size={18} />
                </span>
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder={isAr ? 'مثال: xm_partner أو partner@xm.com' : 'e.g. xm_partner or partner@xm.com'}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    paddingInlineStart: '2.75rem',
                    background: 'rgba(2, 9, 23, 0.75)',
                    border: '1px solid rgba(18, 49, 92, 0.8)',
                    borderRadius: '0.75rem',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0488F8')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(18, 49, 92, 0.8)')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1' }}>
                  {isAr ? 'كلمة المرور المشفرة' : 'Secure Access Key / Password'}
                </label>
                <a
                  href="mailto:partners@fxengin.com?subject=استعادة%20بيانات%20دخول%20الوسيط%20الشريك"
                  style={{ fontSize: '0.75rem', color: '#0488F8', textDecoration: 'none' }}
                >
                  {isAr ? 'نسيت كلمة المرور؟' : 'Need Support?'}
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    insetInlineStart: '1rem',
                    color: '#64748B',
                    pointerEvents: 'none',
                    display: 'flex',
                  }}
                >
                  <FiLock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    paddingInlineStart: '2.75rem',
                    paddingInlineEnd: '2.75rem',
                    background: 'rgba(2, 9, 23, 0.75)',
                    border: '1px solid rgba(18, 49, 92, 0.8)',
                    borderRadius: '0.75rem',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0488F8')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(18, 49, 92, 0.8)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    insetInlineEnd: '1rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #0488F8 0%, #0056B3 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.9375rem',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 24px rgba(4, 136, 248, 0.35)',
                marginTop: '0.5rem',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              <span>{loading ? (isAr ? 'جاري التحقق...' : 'Authenticating...') : (isAr ? 'دخول بوابة الوسيط' : 'Sign In to Broker Portal')}</span>
              {!loading && <ArrowIcon size={16} />}
            </button>
          </form>

          {/* Quick Demo Access (for testing and partner evaluation) */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(18, 49, 92, 0.6)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#FB8704',
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <FiZap size={14} />
              <span>{isAr ? 'دخول تجريبي سريع بحسابات الوسطاء المتعاقدين (1-Click Demo)' : '1-Click Quick Demo Partner Access'}</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5rem',
              }}
            >
              {[
                { id: 'xm', name: 'XM Global', badge: 'Tier-1 Partner', color: '#10B981' },
                { id: 'ywo', name: 'YWO Markets', badge: 'ECN 0.0 Spread', color: '#00D06C' },
                { id: 'propxp', name: 'PropXP', badge: 'Prop Firm Partner', color: '#00A3FF' },
                { id: 'multibank', name: 'MultiBank Group', badge: '14+ Regulators', color: '#D4AF37' },
              ].map((partner) => (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(partner.id)}
                  disabled={loading}
                  style={{
                    padding: '0.6rem 0.75rem',
                    background: 'rgba(6, 20, 47, 0.7)',
                    border: '1px solid rgba(18, 49, 92, 0.8)',
                    borderRadius: '0.625rem',
                    color: '#E2E8F0',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textAlign: isAr ? 'right' : 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = partner.color;
                    e.currentTarget.style.background = 'rgba(6, 20, 47, 0.95)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(18, 49, 92, 0.8)';
                    e.currentTarget.style.background = 'rgba(6, 20, 47, 0.7)';
                  }}
                >
                  <span style={{ color: '#FFFFFF' }}>{partner.name}</span>
                  <span style={{ fontSize: '0.6875rem', color: partner.color }}>{partner.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1.5rem',
            fontSize: '0.8125rem',
          }}
        >
          <Link href="/partners" style={{ color: '#94A3B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>{isAr ? 'برنامج الشركاء (IB)' : 'Partners Program'}</span>
          </Link>
          <Link href="/login" style={{ color: '#0488F8', textDecoration: 'none' }}>
            <span>{isAr ? 'تسجيل دخول المتداولين' : 'Trader Login'}</span>
          </Link>
          <Link href="/" style={{ color: '#94A3B8', textDecoration: 'none' }}>
            <span>{isAr ? 'الرئيسية' : 'Home'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
