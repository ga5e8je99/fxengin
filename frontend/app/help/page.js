'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import {
  FiHelpCircle,
  FiSearch,
  FiChevronDown,
  FiUser,
  FiBookOpen,
  FiStar,
  FiCreditCard,
  FiMessageSquare,
  FiMail,
  FiArrowLeft,
  FiArrowRight,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';

export default function HelpCenterPage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();
  const [pageData, setPageData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  useEffect(() => {
    fetch('/api/pages?slug=help')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.page) {
          setPageData(data.page);
        }
      })
      .catch((err) => console.error('Failed to load help page data:', err));
  }, []);

  const title = isAr
    ? pageData?.titleAr || 'مركز المساعدة والدعم الفني'
    : pageData?.titleEn || 'Help Center & Knowledge Base';

  const subtitle = isAr
    ? pageData?.subtitleAr || 'إجابات وافية وشاملة لجميع استفساراتك حول الدورات، التوصيات، الحسابات، والدفع'
    : pageData?.subtitleEn || 'Instant Answers, Guides, and Support for Your Account, Courses, and Subscriptions';

  const categories = pageData?.categories || [
    { id: 'account', nameAr: 'الحساب والتسجيل', nameEn: 'Account & Profile', icon: 'user' },
    { id: 'courses', nameAr: 'الكورسات والشهادات', nameEn: 'Courses & Certification', icon: 'book' },
    { id: 'vip', nameAr: 'باقة VIP والتحليلات', nameEn: 'VIP Pass & Market Insights', icon: 'star' },
    { id: 'billing', nameAr: 'الاشتراكات وطرق الدفع', nameEn: 'Billing & Payments', icon: 'card' },
  ];

  const faqs = pageData?.faqs || [
    {
      category: 'account',
      qAr: 'كيف يمكنني إنشاء حساب والبدء في المنصة؟',
      qEn: 'How do I create an account and get started?',
      aAr: 'يمكنك النقر على زر "حساب جديد" في أعلى الموقع، إدخال اسمك وبريدك الإلكتروني وكلمة المرور. بعد تفعيل الحساب ستتمكن فوراً من الوصول إلى الدروس التمهيدية المجانية وقسم التحليلات العامة.',
      aEn: 'Click "Create Account" in the header, enter your credentials, and verify your email for immediate free access to introductory modules.',
    },
    {
      category: 'courses',
      qAr: 'هل يحصل المتدرب على شهادة إتمام معتمدة بعد إنهاء الكورس؟',
      qEn: 'Do I receive an accredited certificate upon course completion?',
      aAr: 'نعم، فور إتمامك لجميع مقاطع الفيديو واجتياز الاختبار النهائي بنجاح بنسبة 80% أو أعلى، يقوم النظام بإصدار شهادة إتمام رقمية معتمدة برقم تسلسلي فريد يمكن توثيقها ومشاركتها على LinkedIn.',
      aEn: 'Yes, completing all modules and scoring 80%+ on the final assessment unlocks a verified digital certificate with a unique verification code.',
    },
    {
      category: 'vip',
      qAr: 'ما الذي تشمله باقة VIP الاحترافية؟',
      qEn: 'What does the VIP Pro subscription include?',
      aAr: 'تشمل الباقة وصولاً كاملاً لجميع الكورسات الحالية والمستقبلية، التحليلات اليومية الحصرية لـ SMC، التنبيهات اللحظية عبر تليجرام VIP، وحضور جلسات التداول المباشرة الأسبوعية مع المدربين.',
      aEn: 'Full access to all course tracks, daily proprietary SMC market setups, instant Telegram VIP alerts, and private live trading sessions.',
    },
    {
      category: 'billing',
      qAr: 'ما هي وسائل الدفع المدعومة للاشتراك؟',
      qEn: 'What payment methods are supported?',
      aAr: 'ندعم الدفع المباشر عبر العملات الرقمية المستقرة USDT (شبكة TRC20 و BEP20) بشكل آمن وموثوق، بالإضافة إلى البطاقات الائتمانية والتحويلات البنكية المباشرة.',
      aEn: 'We support USDT (TRC20 / BEP20 network) crypto payments, credit/debit cards, and direct bank wire transfers.',
    },
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (item.qAr && item.qAr.toLowerCase().includes(q)) ||
        (item.qEn && item.qEn.toLowerCase().includes(q)) ||
        (item.aAr && item.aAr.toLowerCase().includes(q)) ||
        (item.aEn && item.aEn.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [faqs, activeCategory, searchQuery]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '5rem' }}>
      {/* ── Hero Section with Search ────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          padding: '6rem 1.5rem 4.5rem',
          borderBottom: '1px solid rgba(18, 49, 92, 0.35)',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        <PageHeroBackground />
        <div className="container" style={{ maxWidth: '48rem', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Anim effect="fade-up">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 1rem',
                borderRadius: '9999px',
                background: 'rgba(4, 136, 248, 0.12)',
                border: '1px solid rgba(4, 136, 248, 0.3)',
                color: 'var(--primary)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
              }}
            >
              <FiHelpCircle size={14} />
              <span>{isAr ? pageData?.badgeAr || 'قاعدة المعرفة والمساندة' : pageData?.badgeEn || 'Knowledge Base'}</span>
            </span>

            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                marginBottom: '1.25rem',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                margin: '0 auto 2.5rem',
              }}
            >
              {subtitle}
            </p>

            {/* Live Search Input */}
            <div
              style={{
                position: 'relative',
                maxWidth: '36rem',
                margin: '0 auto',
              }}
            >
              <FiSearch
                size={18}
                style={{
                  position: 'absolute',
                  insetInlineStart: '1.25rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder={isAr ? 'ابحث عن سؤالك أو المشكلة التي تواجهك...' : 'Search for questions, keywords, guides...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '3.5rem',
                  paddingInlineStart: '3.25rem',
                  paddingInlineEnd: '1.25rem',
                  background: 'rgba(6, 20, 47, 0.85)',
                  border: '1.5px solid rgba(4, 136, 248, 0.35)',
                  borderRadius: '1rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem',
                  backdropFilter: 'blur(16px)',
                  outline: 'none',
                  boxShadow: '0 8px 32px rgba(0, 3, 13, 0.6)',
                }}
              />
            </div>
          </Anim>
        </div>
      </section>

      {/* ── Category Filters & FAQ Accordion ───────────────────── */}
      <section style={{ padding: '4rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '56rem', margin: '0 auto' }}>
          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '3rem',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '9999px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: activeCategory === 'all' ? '1px solid var(--primary)' : '1px solid rgba(18, 49, 92, 0.6)',
                background: activeCategory === 'all' ? 'var(--primary)' : 'rgba(6, 20, 47, 0.6)',
                color: activeCategory === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              {isAr ? 'جميع الأسئلة' : 'All Topics'}
            </button>

            {categories.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '9999px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: active ? '1px solid var(--primary)' : '1px solid rgba(18, 49, 92, 0.6)',
                    background: active ? 'var(--primary)' : 'rgba(6, 20, 47, 0.6)',
                    color: active ? '#FFFFFF' : 'var(--text-secondary)',
                  }}
                >
                  {isAr ? cat.nameAr : cat.nameEn}
                </button>
              );
            })}
          </div>

          {/* FAQ List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredFaqs.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  background: 'rgba(6, 20, 47, 0.5)',
                  borderRadius: '1rem',
                  border: '1px solid rgba(18, 49, 92, 0.4)',
                }}
              >
                <FiHelpCircle size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: 700 }}>
                  {isAr ? 'لم نجد أي إجابة مطابقة لبحثك' : 'No matching answers found'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {isAr ? 'يمكنك التواصل مباشرة مع فريق الدعم الفني لمساعدتك فورياً.' : 'Contact our support team directly for instant assistance.'}
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <Anim key={idx} effect="fade-up" delay={idx * 60}>
                    <div
                      style={{
                        background: 'linear-gradient(180deg, rgba(6, 20, 47, 0.85) 0%, rgba(4, 15, 36, 0.85) 100%)',
                        border: isOpen ? '1.5px solid var(--primary)' : '1px solid rgba(18, 49, 92, 0.5)',
                        borderRadius: '1.25rem',
                        overflow: 'hidden',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        style={{
                          width: '100%',
                          padding: '1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontSize: '1.0625rem',
                          fontWeight: 700,
                          textAlign: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        <span>{isAr ? faq.qAr : faq.qEn}</span>
                        <FiChevronDown
                          size={18}
                          style={{
                            color: isOpen ? 'var(--primary)' : 'var(--text-muted)',
                            transform: isOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.25s ease',
                            flexShrink: 0,
                          }}
                        />
                      </button>

                      {isOpen && (
                        <div
                          style={{
                            padding: '0 1.5rem 1.5rem',
                            fontSize: '0.9375rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.8,
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                            paddingTop: '1rem',
                          }}
                        >
                          {isAr ? faq.aAr : faq.aEn}
                        </div>
                      )}
                    </div>
                  </Anim>
                );
              })
            )}
          </div>

          {/* ── Still need help? Card ────────────────────────────── */}
          <div
            style={{
              marginTop: '4rem',
              padding: '2.5rem 2rem',
              background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(4, 136, 248, 0.15) 0%, transparent 80%), rgba(6, 20, 47, 0.8)',
              border: '1px solid rgba(4, 136, 248, 0.25)',
              borderRadius: '1.5rem',
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {isAr ? 'لم تجد إجابة لاستفسارك؟' : 'Still Need Assistance?'}
            </h3>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: '32rem', margin: '0 auto 1.5rem' }}>
              {isAr ? 'فريق الدعم الفني متواجد للإجابة على جميع تساؤلاتك ومساعدتك في تفعيل حسابك.' : 'Our live support desk is ready to assist you 24/7 with instant setup and technical guidance.'}
            </p>
            <Link
              href={getAppRoute('/contact', user)}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.75rem 1.75rem' }}
            >
              <FiMessageSquare size={16} />
              <span>{isAr ? 'تواصل مع الدعم الفني' : 'Open Support Ticket'}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
