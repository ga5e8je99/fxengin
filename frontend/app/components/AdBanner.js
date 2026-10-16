'use client';
import { useState, useEffect } from 'react';
import { FiX, FiExternalLink, FiTrendingUp, FiZap, FiShield, FiAward, FiPlay } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { fetchActiveAds, fetchAllActiveSidebarAds, trackAdClick } from '../services/adsService';

const SPONSORED_ITEMS_RIGHT = [
  {
    id: 'r1',
    badge: 'VIP SIGNALS',
    badgeColor: 'var(--accent)',
    titleAr: 'إشارات حية 24/5',
    titleEn: 'Live VIP Signals',
    descAr: 'توصيات يومية مدروسة للذهب والعملات',
    descEn: 'Daily setups for Gold & Forex',
    tag: '92% WIN RATE',
    btnAr: 'انضم الآن',
    btnEn: 'Join Now',
    href: '/register',
    icon: <FiTrendingUp size={16} color="var(--accent)" />,
  },
  {
    id: 'r2',
    badge: 'PRO ACADEMY',
    badgeColor: 'var(--primary)',
    titleAr: 'باقة الاحتراف الشاملة',
    titleEn: 'Pro Academy Pass',
    descAr: '+120 دورة وشهادات معتمدة',
    descEn: '120+ Tracks & Certificates',
    tag: 'LIMITED PASS',
    btnAr: 'استكشف',
    btnEn: 'Explore',
    href: '/courses',
    icon: <FiAward size={16} color="var(--primary)" />,
  },
  {
    id: 'r3',
    badge: 'ALGO TRADING',
    badgeColor: '#9333EA',
    titleAr: 'روبوتات الذكاء الاصطناعي',
    titleEn: 'AI Algo Trading Bot',
    descAr: 'تنفيذ صفقات آلي منضبط وسريع',
    descEn: 'Automated 24/5 execution',
    tag: 'AI POWERED',
    btnAr: 'جرب الآن',
    btnEn: 'Try AI',
    href: '/register',
    icon: <FiZap size={16} color="#A855F7" />,
  },
  {
    id: 'r4',
    badge: 'ZERO SPREAD',
    badgeColor: 'var(--success)',
    titleAr: 'سبريد 0.0 نقطة',
    titleEn: 'Zero Raw Spreads',
    descAr: 'تنفيذ فائق السرعة وحسابات إسلامية',
    descEn: 'Ultra-fast execution & Islamic',
    tag: '0.0 PIPS',
    btnAr: 'افتح حساب',
    btnEn: 'Open Account',
    href: '/open-account',
    icon: <FiShield size={16} color="var(--success)" />,
  },
];

const SPONSORED_ITEMS_LEFT = [
  {
    id: 'l1',
    badge: 'GOLD SCALPING',
    badgeColor: 'var(--accent)',
    titleAr: 'استراتيجيات الذهب',
    titleEn: 'Gold Master Scalp',
    descAr: 'قناص نقاط الذهب والنفط اللحظي',
    descEn: 'Intraday setups for XAU/USD',
    tag: 'HOT ASSET',
    btnAr: 'سجل مجاناً',
    btnEn: 'Join Free',
    href: '/register',
    icon: <FiTrendingUp size={16} color="var(--accent)" />,
  },
  {
    id: 'l2',
    badge: 'SMART MONEY',
    badgeColor: '#06B6D4',
    titleAr: 'منهجية SMC الاحترافية',
    titleEn: 'Smart Money SMC',
    descAr: 'تتبع صناع السوق ومناطق السيولة',
    descEn: 'Institutional Order Flow',
    tag: 'ELITE LEVEL',
    btnAr: 'اكتشف الدورة',
    btnEn: 'Learn SMC',
    href: '/courses',
    icon: <FiZap size={16} color="#06B6D4" />,
  },
  {
    id: 'l3',
    badge: 'LIVE STREAMS',
    badgeColor: '#EF4444',
    titleAr: 'جلسات تداول حية',
    titleEn: 'Daily Live Streams',
    descAr: 'تحليل مباشر قبل افتتاح نيويورك',
    descEn: 'New York Open live analysis',
    tag: '24/5 LIVE',
    btnAr: 'شاهد البث',
    btnEn: 'Watch Live',
    href: '/register',
    icon: <FiPlay size={16} color="#EF4444" />,
  },
  {
    id: 'l4',
    badge: 'PRO COMMUNITY',
    badgeColor: 'var(--primary)',
    titleAr: 'مجتمع النخبة المباشر',
    titleEn: 'Elite Pro Network',
    descAr: '+50,000 متداول يشاركون الفرص',
    descEn: '50,000+ Active Traders',
    tag: 'VIP ACCESS',
    btnAr: 'انضم للمجتمع',
    btnEn: 'Join Pro',
    href: '/register',
    icon: <FiAward size={16} color="var(--primary)" />,
  },
];

/**
 * Duplicates and repeats ad items so that even if there is only 1 or 2 ads,
 * they repeat smoothly and fill the marquee track for continuous seamless motion.
 */
function buildRepeatingMarqueeList(sourceItems, minCount = 4) {
  if (!Array.isArray(sourceItems) || sourceItems.length === 0) return [];
  let base = [...sourceItems];
  while (base.length < minCount) {
    base = [...base, ...sourceItems];
  }
  // Duplicate for seamless 0% -> -50% loop
  return [...base, ...base];
}

/**
 * Professional Auto-Scrolling Side Gutter Ad Partitions & In-Page Banners
 */
export default function AdBanner({
  type = 'skyscraper-right', // 'skyscraper-left' | 'skyscraper-right' | 'horizontal'
  imgSrc = '/assets/Images/test/leftAds.webp',
  href = '#',
  alt = 'Advertisement',
  title = 'FXENGIN Pro Partner',
  desc = 'تداول واحتراف أسواق المال بأفضل الأدوات',
}) {
  const { isAr } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [dynamicAds, setDynamicAds] = useState([]);

  useEffect(() => {
    if (type === 'skyscraper-right' || type === 'skyscraper-left') {
      fetchAllActiveSidebarAds().then((ads) => {
        if (Array.isArray(ads) && ads.length > 0) {
          setDynamicAds(ads);
        }
      });
    } else if (type === 'horizontal') {
      fetchActiveAds('HORIZONTAL_BANNER').then((ads) => {
        if (Array.isArray(ads) && ads.length > 0) {
          setDynamicAds(ads);
        }
      });
    }
  }, [type]);

  if (!visible) return null;

  // ── 1. Skyscraper Side Gutter Ad Partition (Left & Right) ──
  if (type === 'skyscraper-right' || type === 'skyscraper-left') {
    const isRight = type === 'skyscraper-right';
    const fallbackItems = isRight ? SPONSORED_ITEMS_RIGHT : SPONSORED_ITEMS_LEFT;
    const baseList = dynamicAds.length > 0
      ? dynamicAds.map((ad) => ({
          id: ad.id,
          badge: ad.badge || (isRight ? 'EXCLUSIVE PARTNER' : 'VIP PARTNER'),
          badgeColor: ad.badgeColor || '#EF4444',
          titleAr: ad.titleAr,
          titleEn: ad.titleEn || ad.titleAr,
          descAr: ad.descAr || '',
          descEn: ad.descEn || '',
          tag: ad.tag || 'SPECIAL OFFER',
          btnAr: ad.btnTextAr || (isAr ? 'فتح حساب تداول حقيقي' : 'Open Live Account'),
          btnEn: ad.btnTextEn || 'Open Live Account',
          href: ad.targetUrl || '#',
          imageUrl: ad.imageUrl || null,
          icon: <FiTrendingUp size={16} color={ad.badgeColor || 'var(--accent)'} />,
        }))
      : fallbackItems;

    // What appears on the Right is in forward order.
    // What appears on the Left is the exact SAME ads in REVERSE order!
    const items = isRight ? baseList : [...baseList].reverse();

    // Repeat ads smoothly even if there is only 1 or 2, filling track for seamless infinite scroll
    const displayItems = buildRepeatingMarqueeList(items, 4);

    return (
      <aside
        aria-label={isRight ? 'Right Side Ad Partition' : 'Left Side Ad Partition'}
        className="w-full transition-all duration-300 pointer-events-auto select-none"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            position: 'relative',
            background: 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(4, 136, 248, 0.08) 0%, transparent 70%), var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: isRight ? '12px 0 0 12px' : '0 12px 12px 0',
            borderRight: isRight ? 'none' : '1px solid var(--border)',
            borderLeft: !isRight ? 'none' : '1px solid var(--border)',
            boxShadow: isRight
              ? '-8px 16px 40px rgba(0, 3, 13, 0.85)'
              : '8px 16px 40px rgba(0, 3, 13, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(4, 136, 248, 0.45)';
            e.currentTarget.style.boxShadow = '0 20px 48px rgba(4, 136, 248, 0.18)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 3, 13, 0.75)';
          }}
        >
          {/* Partition Header Bar with Close Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              background: 'rgba(1, 7, 30, 0.95)',
              borderBottom: '1px solid var(--border)',
              position: 'relative',
              zIndex: 10,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 6px var(--accent)',
                }}
              />
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.6px',
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                {isAr ? 'إعلانات مميزة' : 'SPONSORED'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setVisible(false)}
              aria-label="Dismiss Ad Partition"
              title={isAr ? 'إغلاق الإعلانات' : 'Close ads'}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <FiX size={13} />
            </button>
          </div>

          {/* ── Auto-Scrolling Vertical Ticker Viewport (Full Height) ── */}
          <div
            className="vertical-ad-viewport"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            style={{
              flex: 1,
              height: '100%',
              overflow: 'hidden',
              position: 'relative',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)',
            }}
          >
            {/* Animated Track */}
            <div
              className="vertical-ad-track"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '10px 8px',
                animation: isRight ? 'verticalScrollUp 34s linear infinite' : 'verticalScrollUp 30s linear infinite',
                animationPlayState: isPaused ? 'paused' : 'running',
              }}
            >
              {displayItems.map((item, idx) => (
                <a
                  key={`${item.id}-${idx}`}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackAdClick(item.id)}
                  className="ad-item-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '10px',
                    background: 'rgba(6, 20, 47, 0.85)',
                    border: '1px solid rgba(18, 49, 92, 0.75)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.background = 'rgba(8, 26, 60, 0.98)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(4, 136, 248, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(18, 49, 92, 0.75)';
                    e.currentTarget.style.background = 'rgba(6, 20, 47, 0.85)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
                  }}
                >
                  {/* Top Badge & Tag */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span
                      style={{
                        fontSize: '8.5px',
                        fontWeight: 800,
                        color: item.badgeColor,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: `1px solid ${item.badgeColor}66`,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        letterSpacing: '0.4px',
                        fontFamily: "'Montserrat', monospace",
                      }}
                    >
                      {item.badge}
                    </span>
                    {item.tag && (
                      <span
                        style={{
                          fontSize: '8px',
                          fontWeight: 700,
                          color: 'var(--accent)',
                          background: 'rgba(251, 135, 4, 0.12)',
                          border: '1px solid rgba(251, 135, 4, 0.3)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                        }}
                      >
                        {item.tag}
                      </span>
                    )}
                  </div>

                  {/* Ad Image / Banner */}
                  {item.imageUrl && (
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '76px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: 'rgba(2, 6, 18, 0.92)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        margin: '3px 0 5px 0',
                      }}
                    >
                      <img
                        src={item.imageUrl}
                        alt={isAr ? item.titleAr : item.titleEn}
                        loading="lazy"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          borderRadius: '6px',
                        }}
                        onError={(e) => {
                          if (e.currentTarget?.parentElement) {
                            e.currentTarget.parentElement.style.display = 'none';
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Title */}
                  <div
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      lineHeight: 1.35,
                      marginTop: '2px',
                    }}
                  >
                    {isAr ? item.titleAr : item.titleEn}
                  </div>

                  {/* Short Description */}
                  {Boolean(isAr ? item.descAr : item.descEn) && (
                    <div
                      style={{
                        fontSize: '9.5px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        maxHeight: '42px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {isAr ? item.descAr : item.descEn}
                    </div>
                  )}

                  {/* CTA Micro Button */}
                  <div
                    style={{
                      marginTop: '4px',
                      padding: '5px 0',
                      background: 'linear-gradient(135deg, rgba(251, 135, 4, 0.2) 0%, rgba(4, 136, 248, 0.2) 100%)',
                      border: '1px solid rgba(251, 135, 4, 0.4)',
                      borderRadius: '6px',
                      color: '#FFFFFF',
                      fontSize: '10px',
                      fontWeight: 700,
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{isAr ? item.btnAr : item.btnEn}</span>
                    <FiExternalLink size={10} />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Bottom subtle indicator */}
          <div
            style={{
              padding: '4px 8px',
              textAlign: 'center',
              background: 'rgba(1, 7, 30, 0.85)',
              borderTop: '1px solid var(--border)',
              fontSize: '8.5px',
              color: 'var(--text-muted)',
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            {isPaused ? (isAr ? 'موقف مؤقتاً' : 'PAUSED') : (isAr ? 'تمرير تلقائي' : 'AUTO SCROLL')}
          </div>
        </div>

        {/* Global Keyframes for Vertical Continuous Auto-scroll */}
        <style>{`
          @keyframes verticalScrollUp {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(-50%);
            }
          }
        `}</style>
      </aside>
    );
  }

  // ── 2. In-Page Horizontal Leaderboard Banner (e.g. 728x90 or responsive wide) ──
  const activeHorizontalAd = dynamicAds.length > 0 ? dynamicAds[0] : null;
  const hTitle = activeHorizontalAd ? (isAr ? activeHorizontalAd.titleAr : (activeHorizontalAd.titleEn || activeHorizontalAd.titleAr)) : title;
  const hDesc = activeHorizontalAd ? (isAr ? activeHorizontalAd.descAr : (activeHorizontalAd.descEn || activeHorizontalAd.descAr)) : desc;
  const hHref = activeHorizontalAd ? activeHorizontalAd.targetUrl : href;
  const hBadge = activeHorizontalAd?.badge || (isAr ? 'مساحة إعلانية' : 'SPONSORED');
  const hBadgeColor = activeHorizontalAd?.badgeColor || 'var(--text-muted)';
  const hBtnText = activeHorizontalAd ? (isAr ? activeHorizontalAd.btnTextAr : activeHorizontalAd.btnTextEn) : (isAr ? 'اكتشف المزيد' : 'Learn More');

  return (
    <div
      className="container"
      style={{
        margin: '40px auto',
        padding: '0 24px',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.7) 0%, rgba(1, 7, 30, 0.9) 100%)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 30px rgba(0, 3, 13, 0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 0.25s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(4, 136, 248, 0.4)';
          e.currentTarget.style.boxShadow = '0 14px 40px rgba(4, 136, 248, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 3, 13, 0.4)';
        }}
      >
        {/* Ad Tag Badge */}
        <span
          style={{
            position: 'absolute',
            top: '8px',
            [isAr ? 'left' : 'right']: '12px',
            fontSize: '9px',
            fontWeight: 700,
            color: hBadgeColor,
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${hBadgeColor}`,
            padding: '2px 6px',
            borderRadius: '4px',
            letterSpacing: '0.5px',
          }}
        >
          {hBadge}
        </span>

        {/* Content Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '240px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(251, 135, 4, 0.12)',
              border: '1px solid rgba(251, 135, 4, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {activeHorizontalAd?.imageUrl ? (
              <img
                src={activeHorizontalAd.imageUrl}
                alt="Ad Banner"
                style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px' }}
              />
            ) : (
              <img
                src="/assets/Images/Logo/logo.webp"
                alt="Logo"
                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
              />
            )}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
              {hTitle}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              {hDesc}
            </div>
          </div>
        </div>

        {/* CTA Button & Dismiss */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href={hHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAdClick(activeHorizontalAd?.id)}
            className="btn-primary"
            style={{
              height: '38px',
              padding: '0 16px',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              gap: '6px',
            }}
          >
            <span>{hBtnText}</span>
            <FiExternalLink size={14} />
          </a>
          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Dismiss banner"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <FiX size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile & Small-Screen Responsive Sponsored Bar & Floating Drawer
 * Displays all side-ad partners (both left and right partitions) when screen is resized or on mobile
 */
export function MobileSponsoredBar() {
  const { isAr } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mobileAds, setMobileAds] = useState([]);

  useEffect(() => {
    fetchAllActiveSidebarAds().then((ads) => {
      if (Array.isArray(ads) && ads.length > 0) {
        setMobileAds(ads);
      }
    });
  }, []);

  if (!visible) return null;

  const dynamicItems = mobileAds.map((ad) => ({
    id: ad.id,
    badge: ad.badge || 'EXCLUSIVE PARTNER',
    badgeColor: ad.badgeColor || '#EF4444',
    titleAr: ad.titleAr,
    titleEn: ad.titleEn || ad.titleAr,
    descAr: ad.descAr || '',
    descEn: ad.descEn || '',
    tag: ad.tag || 'SPECIAL OFFER',
    btnAr: ad.btnTextAr || (isAr ? 'فتح حساب' : 'Open Live'),
    btnEn: ad.btnTextEn || 'Open Live',
    href: ad.targetUrl || '#',
    imageUrl: ad.imageUrl || null,
    icon: <FiTrendingUp size={16} color={ad.badgeColor || 'var(--accent)'} />,
  }));

  const defaultItems = [...SPONSORED_ITEMS_RIGHT, ...SPONSORED_ITEMS_LEFT];
  const allItems = dynamicItems.length > 0 ? dynamicItems : defaultItems;
  // Repeat ads smoothly even if there is only 1 or 2, filling track for seamless horizontal marquee
  const infiniteMarqueeItems = buildRepeatingMarqueeList(allItems, 4);

  return (
    <div className="flex flex-col w-full min-[1200px]:hidden mb-3 relative z-20">
      {/* 1. Horizontal Auto-Scrolling Sponsored Strip */}
      <div
        style={{
          background: 'rgba(6, 20, 47, 0.88)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          margin: '0.375rem 0',
          overflow: 'hidden',
          boxShadow: '0 0.5rem 1.5rem rgba(0, 3, 13, 0.5)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Strip Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.375rem 0.75rem',
            background: 'rgba(1, 7, 30, 0.95)',
            borderBottom: '1px solid rgba(18, 49, 92, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span
              style={{
                width: '0.375rem',
                height: '0.375rem',
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 0.375rem var(--accent)',
              }}
            />
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', fontFamily: "'Montserrat', sans-serif" }}>
              {isAr ? 'إعلانات مميزة (يمين ويسار)' : 'SPONSORED PARTNERS'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--primary)',
                background: 'rgba(4, 136, 248, 0.1)',
                border: '1px solid rgba(4, 136, 248, 0.25)',
                padding: '0.125rem 0.5rem',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              {isAr ? `عرض الكل (${allItems.length})` : `View All (${allItems.length})`}
            </button>
            <button
              type="button"
              onClick={() => setVisible(false)}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0.125rem',
              }}
            >
              <FiX size={13} />
            </button>
          </div>
        </div>

        {/* Marquee Track (Seamless Continuous Loop) */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          style={{
            overflow: 'hidden',
            width: '100%',
            position: 'relative',
            padding: '0.5rem 0',
            direction: 'ltr',
            maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
          }}
        >
          <div
            className="mobile-ads-marquee-track"
            style={{
              display: 'flex',
              gap: '0.625rem',
              width: 'max-content',
              animation: 'mobileAdsScroll 30s linear infinite',
              animationPlayState: isPaused ? 'paused' : 'running',
              willChange: 'transform',
            }}
          >
            {infiniteMarqueeItems.map((item, idx) => (
              <a
                key={`m-ad-${item.id}-${idx}`}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackAdClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.375rem 0.625rem',
                  background: 'rgba(1, 7, 30, 0.85)',
                  border: '1px solid rgba(18, 49, 92, 0.75)',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  direction: isAr ? 'rtl' : 'ltr',
                }}
              >
                {item.imageUrl ? (
                  <div
                    style={{
                      width: '38px',
                      height: '28px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      background: 'rgba(0, 0, 0, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      padding: '2px',
                    }}
                  >
                    <img
                      src={item.imageUrl}
                      alt=""
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        if (e.currentTarget?.parentElement) {
                          e.currentTarget.parentElement.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 800, color: item.badgeColor, fontFamily: 'monospace' }}>
                      {item.badge}
                    </span>
                    {item.tag && (
                      <span style={{ fontSize: '0.5625rem', color: 'var(--accent)', fontFamily: 'monospace', fontWeight: 700 }}>
                        ● {item.tag}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                    {isAr ? item.titleAr : item.titleEn}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    background: 'rgba(251, 135, 4, 0.12)',
                    border: '1px solid rgba(251, 135, 4, 0.3)',
                    padding: '0.2rem 0.45rem',
                    borderRadius: '0.25rem',
                    whiteSpace: 'nowrap',
                    marginInlineStart: '0.25rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  {isAr ? item.btnAr : item.btnEn}
                  <FiExternalLink size={9} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Floating Quick Mobile Button (Fixed at Bottom-Corner) */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open sponsored items drawer"
        className="min-[1200px]:hidden"
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          insetInlineEnd: '1rem',
          zIndex: 85,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.5rem 0.875rem',
          background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.95) 0%, rgba(1, 7, 30, 0.98) 100%)',
          border: '1px solid rgba(251, 135, 4, 0.5)',
          borderRadius: '2rem',
          boxShadow: '0 0.5rem 1.5rem rgba(0, 3, 13, 0.8), 0 0 0.75rem rgba(251, 135, 4, 0.25)',
          color: '#F5F7FA',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <FiTrendingUp size={14} color="var(--accent)" />
        <span>{isAr ? `عروض وإعلانات (${allItems.length})` : `Featured Ads (${allItems.length})`}</span>
      </button>

      {/* 3. Interactive Slide-Up Bottom Drawer / Modal */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 3, 13, 0.78)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '38rem',
              maxHeight: '85dvh',
              background: 'var(--surface-elevated, #0A1B3D)',
              borderTop: '2px solid var(--accent)',
              borderTopLeftRadius: '1.25rem',
              borderTopRightRadius: '1.25rem',
              padding: '1.25rem 1rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -1rem 3rem rgba(0, 3, 13, 0.9)',
              overflowY: 'auto',
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {isAr ? 'العروض والإعلانات المميزة (اليمين واليسار)' : 'Sponsored & Partner Highlights'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                  {isAr ? 'كافة شركاء FXENGIN المعتمدين وإشارات التداول والخدمات' : 'All official partner features & active signals'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close drawer"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: 'var(--text-primary)',
                  borderRadius: '50%',
                  width: '1.75rem',
                  height: '1.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Cards Grid (Both Left & Right sponsored items) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 15rem), 1fr))', gap: '0.625rem' }}>
              {allItems.map((item) => (
                <a
                  key={`drawer-ad-${item.id}`}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackAdClick(item.id);
                    setDrawerOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                    padding: '0.75rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.625rem',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: item.badgeColor, background: 'rgba(255, 255, 255, 0.05)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>
                      {item.badge}
                    </span>
                    {item.icon}
                  </div>

                  {item.imageUrl && (
                    <div
                      style={{
                        width: '100%',
                        height: '74px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: 'rgba(2, 6, 18, 0.92)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        margin: '3px 0',
                      }}
                    >
                      <img
                        src={item.imageUrl}
                        alt=""
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        onError={(e) => {
                          if (e.currentTarget?.parentElement) {
                            e.currentTarget.parentElement.style.display = 'none';
                          }
                        }}
                      />
                    </div>
                  )}

                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FFFFFF' }}>
                    {isAr ? item.titleAr : item.titleEn}
                  </div>
                  {Boolean(isAr ? item.descAr : item.descEn) && (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.4, maxHeight: '38px', overflow: 'hidden' }}>
                      {isAr ? item.descAr : item.descEn}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>
                      ● {item.tag}
                    </span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span>{isAr ? item.btnAr : item.btnEn}</span>
                      <FiExternalLink size={11} />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Marquee Keyframes */}
      <style>{`
        @keyframes mobileAdsScroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}
