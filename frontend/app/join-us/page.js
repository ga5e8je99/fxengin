'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiAward, FiLogIn, FiUserPlus, FiArrowLeft, FiArrowRight, FiShield, FiDollarSign, FiZap } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import JoinUsSection from '../components/JoinUsSection';
import PageHeroBackground from '../components/PageHeroBackground';
import Anim from '../components/Anim';

export default function JoinUsPage() {
  const { isAr } = useLanguage();
  const { user, isAuthenticated, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-w-0 w-full overflow-hidden" style={{ background: 'var(--bg-primary, #01071E)', minHeight: '100vh' }}>
      {/* Hero Header */}
      <section
        style={{
          position: 'relative',
          padding: '110px 0 60px',
          textAlign: 'center',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(251, 135, 4, 0.15)',
        }}
      >
        <PageHeroBackground />

        <div className="container" style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.25rem', position: 'relative', zIndex: 1 }}>
          <Anim effect="fade-up">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.45rem 1.1rem',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, rgba(251, 135, 4, 0.16) 0%, rgba(250, 90, 4, 0.08) 100%)',
                border: '1px solid rgba(251, 135, 4, 0.45)',
                color: '#FB8704',
                fontSize: '0.875rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
              }}
            >
              <FiAward size={18} />
              <span>{isAr ? 'برنامج الشركاء والإحالة الرسمي • 10% عمولة فورية' : 'Official Affiliate & Referral Program • 10% Commission'}</span>
              <span style={{ background: '#FB8704', color: '#000', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontWeight: 900, fontSize: '0.75rem' }}>
                10%
              </span>
            </div>
          </Anim>

          <Anim effect="fade-up" delay={80}>
            <h1
              style={{
                fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
                fontWeight: 900,
                color: '#FFFFFF',
                lineHeight: 1.25,
                margin: '0 0 1.25rem',
                letterSpacing: '-0.02em',
              }}
            >
              {isAr ? (
                <>
                  برنامج <span style={{ color: '#FB8704' }}>انضم إلينا</span> والربح من الإحالة
                </>
              ) : (
                <>
                  <span style={{ color: '#FB8704' }}>Join Us</span> & Earn 10% on Every Referral
                </>
              )}
            </h1>
          </Anim>

          <Anim effect="fade-up" delay={140}>
            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: 'rgba(235, 240, 255, 0.78)',
                maxWidth: '780px',
                margin: '0 auto',
                lineHeight: 1.75,
              }}
            >
              {isAr
                ? 'انضم إلى مجتمع شركاء FXENGIN، واحصل على رابط إحالة خاص بك لمشاركته مع المتداولين والمهتمين. اربح 10% عمولة فورية عند أول اشتراك في الجروبات أو أول شراء للكورسات لكل متداول يسجل من خلالك مع سحب فوري لأرباحك.'
                : 'Become an FXENGIN affiliate partner. Share your unique link and earn a 10% cash commission on the first group subscription and first course purchase made by each user referred through your link.'}
            </p>
          </Anim>
        </div>
      </section>

      {/* Main Affiliate Section (Interactive Dashboard for Logged In, Terms & Join for Unjoined) */}
      <JoinUsSection onlyLoggedIn={false} showHeader={false} />

      {/* Guest Invitation Callout if unauthenticated */}
      {mounted && !loading && !user && !isAuthenticated && (
        <section style={{ padding: '40px 1.25rem 80px', maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(8, 26, 61, 0.9) 0%, rgba(4, 16, 42, 0.9) 100%)',
              border: '1.5px solid rgba(251, 135, 4, 0.4)',
              borderRadius: '1.25rem',
              padding: '2.5rem 2rem',
              boxShadow: '0 20px 50px rgba(0, 3, 13, 0.6)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(251, 135, 4, 0.15)',
                border: '1px solid rgba(251, 135, 4, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FB8704',
                margin: '0 auto 1.25rem',
              }}
            >
              <FiAward size={32} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.75rem' }}>
              {isAr ? 'سجل دخولك لتفعيل رابط الإحالة وبدء الأرباح' : 'Sign In to Activate Your Referral Link'}
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'rgba(235, 240, 255, 0.75)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              {isAr
                ? 'برنامج الشركاء والإحالة متاح حصرياً لأعضاء منصة FXENGIN. سجل دخولك أو أنشئ حساباً مجانياً للبدء فوراً في جني العمولات.'
                : 'The partner program is exclusive to FXENGIN members. Sign in or create a free account to generate your link and start earning.'}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href={`/login?redirect=${encodeURIComponent('/join-us?autoJoin=true')}`}
                className="btn-primary"
                style={{
                  height: '46px',
                  padding: '0 24px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #FB8704 0%, #FA5A04 100%)',
                  color: '#000',
                }}
              >
                <FiLogIn size={17} />
                <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
              </Link>
              <Link
                href={`/register?redirect=${encodeURIComponent('/join-us?autoJoin=true')}`}
                className="btn-secondary"
                style={{
                  height: '46px',
                  padding: '0 24px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  gap: '8px',
                }}
              >
                <FiUserPlus size={17} />
                <span>{isAr ? 'إنشاء حساب جديد مجاناً' : 'Create Free Account'}</span>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
