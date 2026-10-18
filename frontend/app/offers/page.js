'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FiTag,
  FiCopy,
  FiCheck,
  FiExternalLink,
  FiArrowLeft,
  FiArrowRight,
  FiGift,
  FiPercent,
  FiSearch,
  FiHelpCircle,
  FiChevronDown,
  FiShield,
  FiAward,
  FiZap,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from '../utils/toast';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import offersData from '../../data/offers.json';

export default function OffersPage() {
  const { isAr } = useLanguage();
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const categories = useMemo(() => {
    return [
      { id: 'all', labelAr: 'جميع العروض (6)', labelEn: 'All Offers (6)' },
      { id: 'bonus', labelAr: 'بونص تداول', labelEn: 'Deposit Bonus' },
      { id: 'signals', labelAr: 'باقات التحليلات', labelEn: 'VIP Analytics' },
      { id: 'prop-firm', labelAr: 'شركات التمويل', labelEn: 'Prop Firms' },
      { id: 'spread', labelAr: 'سبريد خام ECN', labelEn: 'Raw Spreads' },
      { id: 'academy', labelAr: 'الأكاديمية', labelEn: 'Academy' },
    ];
  }, []);

  const handleCopyCode = (code, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!code) return;
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      showToast.success(
        isAr ? `تم نسخ الكود الترويجي (${code}) بنجاح!` : `Promo code (${code}) copied!`
      );
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      showToast.error(isAr ? 'تعذر نسخ الكود' : 'Failed to copy code');
    }
  };

  const filteredOffers = useMemo(() => {
    let list = Array.isArray(offersData) ? offersData : [];

    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const title = (isAr ? item.titleAr : item.titleEn) || '';
        const sub = (isAr ? item.subtitleAr : item.subtitleEn) || '';
        const partner = item.partnerName || '';
        const code = item.code || '';
        return (
          title.toLowerCase().includes(q) ||
          sub.toLowerCase().includes(q) ||
          partner.toLowerCase().includes(q) ||
          code.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [selectedCategory, searchQuery, isAr]);

  const faqs = [
    {
      qAr: 'كيف أقوم بتفعيل كود الخصم أو بونص الإيداع؟',
      qEn: 'How do I activate the promo code or deposit bonus?',
      aAr: 'قم بنسخ الكود الترويجي الظاهر في بطاقة العرض بالضغط على "نسخ الكود"، ثم اضغط على زر تفعيل العرض. عند التسجيل أو الدفع لدى الوسيط أو في منصة FXENGIN، الصق الكود في خانة (Promo Code / Coupon Code) وسيتم تطبيق الخصم أو البونص تلقائياً.',
      aEn: 'Click the "Copy Code" button on the offer card, then click the CTA button. Paste the code into the Promo/Coupon field during registration or checkout to have your discount or bonus applied automatically.',
    },
    {
      qAr: 'هل البونص الترحيبي 100% قابل للتداول وسحب الأرباح؟',
      qEn: 'Is the 100% deposit bonus tradeable and are profits withdrawable?',
      aAr: 'نعم، البونص المعتمد من شركائنا المرخصين (مثل XM Global) يُضاف فوراً إلى رصيد الـ Equity ويمكنك التداول به وفتح صفقات بأحجام مضاعفة، وكافة الأرباح الناتجة عنه قابلة للسحب الفوري في أي وقت دون أي قيود.',
      aEn: 'Yes! The bonus is added directly to your trading equity to boost your margin. All realized profits generated from trading with the bonus can be withdrawn immediately at any time.',
    },
    {
      qAr: 'كيف أحصل على اشتراك جروب إشارات وتوصيات VIP مجاناً؟',
      qEn: 'How do I get free VIP signals and daily analytics access?',
      aAr: 'بمجرد فتح حساب تداول حقيقي وتفعيله عبر أي من وسطائنا المعتمدين (XM، YWO، DooPrime) من خلال روابط FXENGIN وإيداع الحد الأدنى، يُرسل لك فريق الدعم دعوة فورية وتلقائية للوصول لغرفة توصيات الذهب والعملات مجاناً مدى الحياة.',
      aEn: 'Simply open and verify a live account with our regulated partners (XM, YWO, DooPrime) via FXENGIN links and make your deposit. Our support team will grant you instant lifetime access to the VIP Signals channel.',
    },
    {
      qAr: 'هل أكواد الخصم صالحة لأكثر من مرة؟',
      qEn: 'Can promo codes be used multiple times?',
      aAr: 'تختلف الأكواد حسب نوع العرض؛ فبونص الإيداع الترحيبي يُطبق على الإيداع الأول أو الإيداعات المؤهلة، بينما أكواد خصم باقات التحليلات والأكاديمية وشركات التمويل مثل PropXP يمكن استخدامها في كل عملية شراء جديدة خلال فترة سريان العرض.',
      aEn: 'Deposit match codes typically apply to your first deposit or qualifying funding rounds, while analytics, course passes, and Prop firm challenge discount codes can be applied to new transactions during the active promotion window.',
    },
  ];

  return (
    <div className="min-w-0 w-full" style={{ background: 'var(--bg-primary, #01071E)' }}>
      {/* ── Page Hero Header ─────────────────────────── */}
      <section
        style={{
          position: 'relative',
          padding: 'clamp(4rem, 8vw, 6.5rem) 0 clamp(2.5rem, 5vw, 4rem)',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #01071E 0%, #06142F 60%, #01071E 100%)',
          borderBottom: '1px solid rgba(18, 49, 92, 0.45)',
        }}
      >
        <PageHeroBackground />

        {/* Ambient Top Glows */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'clamp(320px, 50vw, 700px)',
            height: 'clamp(200px, 30vw, 360px)',
            background: 'radial-gradient(ellipse, rgba(251, 135, 4, 0.16) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(70px)',
          }}
        />

        <div
          className="container"
          style={{
            maxWidth: '1240px',
            marginInline: 'auto',
            paddingInline: 'clamp(1rem, 2.5vw, 2rem)',
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
          }}
        >
          <Anim effect="fade-up">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 18px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, rgba(251, 135, 4, 0.18) 0%, rgba(250, 90, 4, 0.08) 100%)',
                border: '1px solid rgba(251, 135, 4, 0.45)',
                color: '#FB8704',
                fontSize: '0.85rem',
                fontWeight: 800,
                marginBottom: '1.25rem',
                boxShadow: '0 4px 18px rgba(251, 135, 4, 0.18)',
              }}
            >
              <FiGift size={16} color="#FB8704" />
              <span>{isAr ? 'مركز العروض والخصومات الحصرية' : 'Exclusive Offers & Promo Center'}</span>
            </div>
          </Anim>

          <Anim effect="fade-up" delay={80}>
            <h1
              style={{
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                fontWeight: 900,
                color: 'var(--text-primary, #FFFFFF)',
                lineHeight: 1.25,
                margin: '0 0 1.25rem 0',
              }}
            >
              {isAr ? (
                <>
                  عروض وباقات <span className="text-gradient-brand">FXENGIN الرسمية</span>
                </>
              ) : (
                <>
                  Official <span className="text-gradient-brand">FXENGIN Offers & Promos</span>
                </>
              )}
            </h1>
          </Anim>

          <Anim effect="fade-up" delay={140}>
            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.3vw, 1.15rem)',
                color: 'var(--text-secondary, #A7AFBF)',
                maxWidth: '720px',
                margin: '0 auto 2rem auto',
                lineHeight: 1.7,
              }}
            >
              {isAr
                ? 'استمتع بأقوى باقات بونص التداول المضاعف، أكواد خصم باقات تحليلات الذهب والعملات، وتخفيضات تقييمات الحسابات الممولة المعتمدة.'
                : 'Unlock maximum value with double deposit bonuses, verified coupon codes for VIP institutional analytics, and discounts on prop firm evaluations.'}
            </p>
          </Anim>

          {/* Quick Highlight Metrics */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(1rem, 2.5vw, 2.5rem)',
              flexWrap: 'wrap',
              marginTop: '1.5rem',
            }}
          >
            <div
              style={{
                padding: '10px 20px',
                background: 'rgba(6, 20, 47, 0.75)',
                border: '1px solid rgba(18, 49, 92, 0.8)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>
                100%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #687287)', fontWeight: 700 }}>
                {isAr ? 'أعلى بونص إيداع' : 'Max Deposit Bonus'}
              </div>
            </div>

            <div
              style={{
                padding: '10px 20px',
                background: 'rgba(6, 20, 47, 0.75)',
                border: '1px solid rgba(18, 49, 92, 0.8)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FB8704', fontFamily: 'monospace' }}>
                50% OFF
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #687287)', fontWeight: 700 }}>
                {isAr ? 'خصومات الأكاديمية' : 'Academy Discounts'}
              </div>
            </div>

            <div
              style={{
                padding: '10px 20px',
                background: 'rgba(6, 20, 47, 0.75)',
                border: '1px solid rgba(18, 49, 92, 0.8)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#00F0FF', fontFamily: 'monospace' }}>
                0.0 Pips
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #687287)', fontWeight: 700 }}>
                {isAr ? 'سبريد خام بنكي' : 'Raw Zero Spreads'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content: Search, Filters & Cards Grid ── */}
      <section
        style={{
          padding: 'clamp(2.5rem, 5vw, 4.5rem) 0',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '1240px',
            marginInline: 'auto',
            paddingInline: 'clamp(1rem, 2.5vw, 2rem)',
          }}
        >
          {/* Controls Bar: Search & Category Filter */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              marginBottom: '2.5rem',
              background: 'rgba(6, 20, 47, 0.65)',
              border: '1px solid rgba(18, 49, 92, 0.7)',
              borderRadius: '16px',
              padding: '18px 24px',
              boxShadow: '0 8px 24px rgba(0, 3, 13, 0.4)',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'ابحث باسم العرض، الوسيط، كود الخصم، أو الكلمة الدلالية...'
                    : 'Search offers by title, broker name, promo code...'
                }
                style={{
                  width: '100%',
                  background: 'rgba(1, 7, 30, 0.85)',
                  border: '1px solid rgba(18, 49, 92, 0.8)',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  paddingInlineStart: '42px',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  [isAr ? 'right' : 'left']: '14px',
                  color: 'var(--text-muted, #687287)',
                  pointerEvents: 'none',
                }}
              >
                <FiSearch size={16} />
              </span>
            </div>

            {/* Filter Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              {categories.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    type="button"
                    style={{
                      padding: '7px 16px',
                      borderRadius: '9999px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      border: active
                        ? '1px solid var(--accent, #FB8704)'
                        : '1px solid rgba(18, 49, 92, 0.7)',
                      background: active
                        ? 'linear-gradient(135deg, rgba(251, 135, 4, 0.22) 0%, rgba(250, 90, 4, 0.12) 100%)'
                        : 'rgba(1, 7, 30, 0.65)',
                      color: active ? '#FB8704' : 'var(--text-secondary, #A7AFBF)',
                      boxShadow: active ? '0 4px 14px rgba(251, 135, 4, 0.25)' : 'none',
                    }}
                  >
                    {isAr ? cat.labelAr : cat.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Offers Cards Grid */}
          {filteredOffers.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                background: 'rgba(6, 20, 47, 0.4)',
                border: '1px dashed rgba(18, 49, 92, 0.8)',
                borderRadius: '16px',
              }}
            >
              <FiGift size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                {isAr ? 'لم يتم العثور على عروض مطابقة' : 'No matching offers found'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {isAr
                  ? 'جرب البحث بكلمة أخرى أو اختر تصنيفاً مختلفاً'
                  : 'Try adjusting your search query or selecting a different category'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="btn-secondary"
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
              >
                {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
                gap: '1.75rem',
              }}
            >
              {filteredOffers.map((offer, idx) => (
                <Anim key={offer.id || idx} delay={idx * 60}>
                  <div
                    className="offer-card"
                    style={{
                      background: 'rgba(6, 20, 47, 0.85)',
                      border: offer.isFeatured
                        ? '1.5px solid rgba(251, 135, 4, 0.6)'
                        : '1px solid rgba(18, 49, 92, 0.85)',
                      borderRadius: '20px',
                      padding: '26px',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: offer.isFeatured
                        ? '0 18px 45px rgba(0, 3, 13, 0.75), 0 0 28px rgba(251, 135, 4, 0.16)'
                        : '0 12px 32px rgba(0, 3, 13, 0.6)',
                      transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                    }}
                  >
                    {/* Top Badge Strip */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        marginBottom: '16px',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          background: 'rgba(251, 135, 4, 0.15)',
                          border: '1px solid rgba(251, 135, 4, 0.38)',
                          color: offer.badgeColor || '#FB8704',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                        }}
                      >
                        {isAr ? offer.badgeAr : offer.badgeEn}
                      </span>

                      {offer.partnerName && (
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: 'var(--text-muted, #687287)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {offer.partnerName}
                        </span>
                      )}
                    </div>

                    {/* Offer Title */}
                    <h2
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: 'var(--text-primary, #FFFFFF)',
                        margin: '0 0 10px 0',
                        lineHeight: 1.35,
                      }}
                    >
                      {isAr ? offer.titleAr : offer.titleEn}
                    </h2>

                    {/* Offer Subtitle */}
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary, #A7AFBF)',
                        lineHeight: 1.6,
                        margin: '0 0 18px 0',
                      }}
                    >
                      {isAr ? offer.subtitleAr : offer.subtitleEn}
                    </p>

                    {/* Promo Code Box */}
                    {offer.code && (
                      <div
                        style={{
                          background: 'linear-gradient(135deg, rgba(1, 7, 30, 0.95) 0%, rgba(6, 20, 47, 0.95) 100%)',
                          border: '1px dashed rgba(251, 135, 4, 0.55)',
                          borderRadius: '12px',
                          padding: '11px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '20px',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--text-muted, #687287)',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {isAr ? 'الكود الترويجي المعتمد:' : 'Verified Coupon Code:'}
                          </div>
                          <div
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '1.12rem',
                              fontWeight: 900,
                              color: '#00F0FF',
                              letterSpacing: '1px',
                            }}
                          >
                            {offer.code}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(offer.code, e)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '7px 14px',
                            borderRadius: '8px',
                            background:
                              copiedCode === offer.code
                                ? 'rgba(22, 199, 132, 0.22)'
                                : 'rgba(4, 136, 248, 0.18)',
                            border:
                              copiedCode === offer.code
                                ? '1px solid #16C784'
                                : '1px solid rgba(4, 136, 248, 0.45)',
                            color: copiedCode === offer.code ? '#16C784' : '#0488F8',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.18s ease',
                          }}
                        >
                          {copiedCode === offer.code ? (
                            <>
                              <FiCheck size={14} />
                              <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
                            </>
                          ) : (
                            <>
                              <FiCopy size={14} />
                              <span>{isAr ? 'نسخ الكود' : 'Copy'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Features Checklist */}
                    <div style={{ flex: 1, marginBottom: '22px' }}>
                      <ul
                        style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '9px',
                        }}
                      >
                        {(isAr ? offer.featuresAr : offer.featuresEn || []).map((feat, fIdx) => (
                          <li
                            key={fIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              fontSize: '0.82rem',
                              color: '#E2E8F0',
                              lineHeight: 1.45,
                            }}
                          >
                            <span
                              style={{
                                color: '#16C784',
                                marginTop: '2px',
                                display: 'inline-flex',
                                flexShrink: 0,
                              }}
                            >
                              <FiCheck size={14} />
                            </span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action CTA Button */}
                    <div style={{ marginTop: 'auto' }}>
                      {offer.isExternal ? (
                        <a
                          href={offer.ctaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary"
                          style={{
                            width: '100%',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            padding: '12px 20px',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>{isAr ? offer.ctaTextAr : offer.ctaTextEn}</span>
                          <FiExternalLink size={15} />
                        </a>
                      ) : (
                        <Link
                          href={offer.ctaLink}
                          className="btn-primary"
                          style={{
                            width: '100%',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            padding: '12px 20px',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>{isAr ? offer.ctaTextAr : offer.ctaTextEn}</span>
                          {isAr ? <FiArrowLeft size={15} /> : <FiArrowRight size={15} />}
                        </Link>
                      )}
                    </div>
                  </div>
                </Anim>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ Section on Offers ────────────────────── */}
      <section
        style={{
          padding: 'clamp(3rem, 5vw, 5rem) 0',
          background: 'linear-gradient(180deg, #01071E 0%, #06142F 100%)',
          borderTop: '1px solid rgba(18, 49, 92, 0.45)',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '900px',
            marginInline: 'auto',
            paddingInline: 'clamp(1rem, 2.5vw, 2rem)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--accent)',
                fontSize: '0.85rem',
                fontWeight: 800,
                marginBottom: '0.5rem',
              }}
            >
              <FiHelpCircle size={16} />
              <span>{isAr ? 'الأسئلة الشائعة حول العروض' : 'Frequently Asked Questions'}</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              {isAr ? 'كل ما تحتاج معرفته عن كيفية الاستفادة من العروض' : 'Everything You Need to Know About Offers'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(6, 20, 47, 0.75)',
                    border: isOpen
                      ? '1px solid var(--primary, #0488F8)'
                      : '1px solid rgba(18, 49, 92, 0.7)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      background: 'none',
                      border: 'none',
                      color: isOpen ? 'var(--primary, #0488F8)' : 'var(--text-primary, #FFFFFF)',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: isAr ? 'right' : 'left',
                    }}
                  >
                    <span>{isAr ? faq.qAr : faq.qEn}</span>
                    <FiChevronDown
                      size={18}
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.25s ease',
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 20px 18px 20px',
                        color: 'var(--text-secondary, #A7AFBF)',
                        fontSize: '0.875rem',
                        lineHeight: 1.65,
                      }}
                    >
                      {isAr ? faq.aAr : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Bottom Support CTA ───────────────────────── */}
      <section
        style={{
          padding: 'clamp(2.5rem, 4vw, 4rem) 0',
          background: 'var(--bg-primary, #01071E)',
          borderTop: '1px solid rgba(18, 49, 92, 0.4)',
          textAlign: 'center',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '800px',
            marginInline: 'auto',
            paddingInline: 'clamp(1rem, 2.5vw, 2rem)',
          }}
        >
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.75rem' }}>
            {isAr ? 'تريد باقة مخصصة أو لديك استفسار عن العروض؟' : 'Need a custom package or offer assistance?'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            {isAr
              ? 'فريق الدعم الفني والمستشارون الماليون متاحون 24/5 للإجابة على كافة استفساراتك ومساعدتك في اختيار العرض الأنسب لأهدافك.'
              : 'Our support team and trading specialists are available 24/5 to assist you in selecting the ideal tier.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href="/contact"
              className="btn-primary"
              style={{ textDecoration: 'none', padding: '10px 24px', fontWeight: 800 }}
            >
              {isAr ? 'تواصل مع الدعم الفني' : 'Contact Support'}
            </Link>
            <a
              href="https://t.me/FXENGIN1NEWS"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ textDecoration: 'none', padding: '10px 24px', fontWeight: 700 }}
            >
              {isAr ? 'قناة التليجرام الرسمية' : 'Official Telegram'}
            </a>
          </div>
        </div>
      </section>

      <style>{`
        .offer-card:hover {
          transform: translateY(-5px);
          border-color: rgba(251, 135, 4, 0.75) !important;
          box-shadow: 0 22px 50px rgba(0, 3, 13, 0.8), 0 0 30px rgba(251, 135, 4, 0.22) !important;
        }
      `}</style>
    </div>
  );
}
