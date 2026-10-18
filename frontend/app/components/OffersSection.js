'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  FiAward,
  FiShield,
  FiTrendingUp,
  FiClock,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';
import { showToast } from '../utils/toast';
import Anim from './Anim';
import offersData from '../../data/offers.json';

function isOfferLive(o) {
  if (!o || o.isActive === false) return false;
  const now = new Date();
  if (o.startDate) {
    const s = new Date(o.startDate);
    if (!isNaN(s.getTime()) && now < s) return false;
  }
  if (o.endDate) {
    const e = new Date(o.endDate);
    if (!isNaN(e.getTime()) && now > e) return false;
  }
  return true;
}

function getExpiryLabel(endDateStr, isAr) {
  if (!endDateStr) return null;
  const end = new Date(endDateStr);
  if (isNaN(end.getTime())) return null;
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return null;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) {
    return isAr ? `متبقي: ${days} يوم و ${hours} س` : `${days}d ${hours}h left`;
  }
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return isAr ? `متبقي: ${hours} س و ${mins} د` : `${hours}h ${mins}m left`;
}

export default function OffersSection({ limit = 3, showViewAll = true }) {
  const { isAr } = useLanguage();
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [offers, setOffers] = useState(offersData || []);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/offers', { cache: 'no-store' })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setOffers(res.data);
        }
      })
      .catch((err) => console.warn('Offers fetch error:', err))
      .finally(() => setLoaded(true));
  }, []);

  const categories = useMemo(() => {
    return [
      { id: 'all', labelAr: 'جميع العروض', labelEn: 'All Offers' },
      { id: 'bonus', labelAr: 'بونص تداول', labelEn: 'Deposit Bonus' },
      { id: 'signals', labelAr: 'باقات التحليلات', labelEn: 'VIP Analytics' },
      { id: 'prop-firm', labelAr: 'شركات التمويل', labelEn: 'Prop Firms' },
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

  const displayedOffers = useMemo(() => {
    let list = (Array.isArray(offers) ? offers : []).filter(isOfferLive);
    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.category === selectedCategory);
    }
    if (limit && limit > 0) {
      return list.slice(0, limit);
    }
    return list;
  }, [offers, selectedCategory, limit]);

  // If offers were deleted in admin dashboard, do not display the section
  if (loaded && offers.length === 0) {
    return null;
  }

  return (
    <section
      id="offers-section"
      className="section-surface"
      style={{
        background: 'linear-gradient(180deg, #01071E 0%, #06142F 50%, #01071E 100%)',
        padding: 'clamp(3.5rem, 6vw, 6rem) 0',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(18, 49, 92, 0.5)',
        borderBottom: '1px solid rgba(18, 49, 92, 0.5)',
      }}
    >
      {/* Ambient background glows */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: 'clamp(280px, 35vw, 500px)',
          height: 'clamp(280px, 35vw, 500px)',
          background: 'radial-gradient(circle, rgba(251, 135, 4, 0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '5%',
          width: 'clamp(300px, 35vw, 520px)',
          height: 'clamp(300px, 35vw, 520px)',
          background: 'radial-gradient(circle, rgba(4, 136, 248, 0.15) 0%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="container"
        style={{
          maxWidth: '1240px',
          marginInline: 'auto',
          paddingInline: 'clamp(1rem, 2.5vw, 2rem)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header Block */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Anim effect="fade-up">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, rgba(251, 135, 4, 0.16) 0%, rgba(250, 90, 4, 0.08) 100%)',
                border: '1px solid rgba(251, 135, 4, 0.45)',
                color: '#FB8704',
                fontSize: '0.8125rem',
                fontWeight: 800,
                marginBottom: '1rem',
                boxShadow: '0 4px 16px rgba(251, 135, 4, 0.15)',
              }}
            >
              <FiGift size={15} color="#FB8704" />
              <span>{isAr ? 'عروض وخصومات FXENGIN الحصرية' : 'FXENGIN Exclusive Offers & Promos'}</span>
              <span
                style={{
                  background: '#FB8704',
                  color: '#000',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontWeight: 900,
                  fontSize: '0.7rem',
                }}
              >
                PROMO
              </span>
            </div>
          </Anim>

          <Anim effect="fade-up" delay={80}>
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
                fontWeight: 900,
                color: 'var(--text-primary, #FFFFFF)',
                lineHeight: 1.25,
                margin: '0 0 1rem 0',
              }}
            >
              {isAr ? (
                <>
                  باقات تداول استثنائية وخصومات <span className="text-gradient-brand">تصل إلى 100%</span>
                </>
              ) : (
                <>
                  Institutional Trading Perks & <span className="text-gradient-brand">Up to 100% Bonuses</span>
                </>
              )}
            </h2>
          </Anim>

          <Anim effect="fade-up" delay={140}>
            <p
              style={{
                fontSize: 'clamp(0.875rem, 1.2vw, 1.05rem)',
                color: 'var(--text-secondary, #A7AFBF)',
                maxWidth: '680px',
                margin: '0 auto',
                lineHeight: 1.65,
              }}
            >
              {isAr
                ? 'استفد من أقوى العروض الترويجية المصممة لتعزيز أرباحك وتوسيع حجم تداولاتك، من بونص الإيداع المضاعف إلى خصومات باقات التحليلات الفنية والأكاديمية.'
                : 'Accelerate your trading journey with handpicked bonuses, verified coupon codes, deposit matches, and premium analytical passes.'}
            </p>
          </Anim>

          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '1.75rem',
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
                    transition: 'all 0.2s ease',
                    border: active
                      ? '1px solid var(--accent, #FB8704)'
                      : '1px solid rgba(18, 49, 92, 0.7)',
                    background: active
                      ? 'linear-gradient(135deg, rgba(251, 135, 4, 0.22) 0%, rgba(250, 90, 4, 0.12) 100%)'
                      : 'rgba(6, 20, 47, 0.65)',
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

        {/* Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '1.5rem',
          }}
        >
          {displayedOffers.map((offer, idx) => (
            <Anim key={offer.id || idx} delay={idx * 80}>
              <div
                className="offer-card"
                style={{
                  background: 'rgba(6, 20, 47, 0.82)',
                  border: offer.isFeatured
                    ? '1.5px solid rgba(251, 135, 4, 0.55)'
                    : '1px solid rgba(18, 49, 92, 0.8)',
                  borderRadius: '18px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: offer.isFeatured
                    ? '0 16px 40px rgba(0, 3, 13, 0.7), 0 0 24px rgba(251, 135, 4, 0.15)'
                    : '0 12px 32px rgba(0, 3, 13, 0.55)',
                  transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                }}
              >
                {/* Offer Image / Broker Banner */}
                {(offer.image || offer.logo) && (
                  <div
                    style={{
                      width: 'calc(100% + 48px)',
                      margin: '-24px -24px 18px -24px',
                      height: '180px',
                      overflow: 'hidden',
                      background: 'rgba(1, 7, 30, 0.9)',
                      borderBottom: '1px solid rgba(18, 49, 92, 0.6)',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={offer.image || offer.logo}
                      alt={isAr ? offer.titleAr : (offer.titleEn || offer.titleAr)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      loading="lazy"
                      onError={(e) => {
                        e.target.parentElement.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Top Badge Strip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(251, 135, 4, 0.14)',
                        border: '1px solid rgba(251, 135, 4, 0.35)',
                        color: offer.badgeColor || '#FB8704',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                      }}
                    >
                      {isAr ? offer.badgeAr : offer.badgeEn}
                    </span>

                    {offer.endDate && getExpiryLabel(offer.endDate, isAr) && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          background: 'rgba(251, 135, 4, 0.18)',
                          border: '1px solid rgba(251, 135, 4, 0.5)',
                          color: '#FB8704',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                        }}
                      >
                        <FiClock size={11} />
                        <span>{getExpiryLabel(offer.endDate, isAr)}</span>
                      </span>
                    )}
                  </div>

                  {offer.partnerName && (
                    <span
                      style={{
                        fontSize: '0.75rem',
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
                <h3
                  style={{
                    fontSize: '1.18rem',
                    fontWeight: 800,
                    color: 'var(--text-primary, #FFFFFF)',
                    margin: '0 0 10px 0',
                    lineHeight: 1.35,
                  }}
                >
                  {isAr ? offer.titleAr : offer.titleEn}
                </h3>

                {/* Offer Subtitle */}
                <p
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary, #A7AFBF)',
                    lineHeight: 1.55,
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
                      border: '1px dashed rgba(251, 135, 4, 0.5)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '18px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--text-muted, #687287)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {isAr ? 'الكود الترويجي الحصري:' : 'Exclusive Promo Code:'}
                      </div>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '1.05rem',
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
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: copiedCode === offer.code ? 'rgba(22, 199, 132, 0.2)' : 'rgba(4, 136, 248, 0.16)',
                        border: copiedCode === offer.code ? '1px solid #16C784' : '1px solid rgba(4, 136, 248, 0.4)',
                        color: copiedCode === offer.code ? '#16C784' : '#0488F8',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      {copiedCode === offer.code ? (
                        <>
                          <FiCheck size={13} />
                          <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <FiCopy size={13} />
                          <span>{isAr ? 'نسخ الكود' : 'Copy'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Features Checklist (Optional) */}
                {Array.isArray(isAr ? offer.featuresAr : offer.featuresEn) &&
                  (isAr ? offer.featuresAr : offer.featuresEn).filter(Boolean).length > 0 && (
                    <div style={{ flex: 1, marginBottom: '20px' }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {((isAr ? offer.featuresAr : offer.featuresEn) || []).filter(Boolean).slice(0, 4).map((feat, fIdx) => (
                          <li
                            key={fIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              fontSize: '0.8rem',
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
                  )}

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
                        padding: '11px 18px',
                        fontSize: '0.875rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>{isAr ? offer.ctaTextAr : offer.ctaTextEn}</span>
                      <FiExternalLink size={14} />
                    </a>
                  ) : (
                    <Link
                      href={offer.ctaLink.startsWith('/') ? getAppRoute(offer.ctaLink, user) : offer.ctaLink}
                      className="btn-primary"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        padding: '11px 18px',
                        fontSize: '0.875rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>{isAr ? offer.ctaTextAr : offer.ctaTextEn}</span>
                      {isAr ? <FiArrowLeft size={14} /> : <FiArrowRight size={14} />}
                    </Link>
                  )}
                </div>
              </div>
            </Anim>
          ))}
        </div>

        {/* View All Offers Link / Button */}
        {showViewAll && (
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link
              href={getAppRoute('/offers', user)}
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                fontSize: '0.95rem',
                fontWeight: 800,
                textDecoration: 'none',
                borderRadius: '12px',
              }}
            >
              <FiPercent size={16} color="var(--accent)" />
              <span>{isAr ? 'استكشف كافة العروض والبونص المتاح' : 'Explore All Exclusive Offers & Bonuses'}</span>
              {isAr ? <FiArrowLeft size={16} /> : <FiArrowRight size={16} />}
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .offer-card:hover {
          transform: translateY(-4px);
          border-color: rgba(251, 135, 4, 0.7) !important;
          box-shadow: 0 20px 48px rgba(0, 3, 13, 0.75), 0 0 28px rgba(251, 135, 4, 0.22) !important;
        }
      `}</style>
    </section>
  );
}
