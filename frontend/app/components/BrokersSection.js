'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FiShield,
  FiExternalLink,
  FiAward,
  FiCheckCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCopy,
  FiCheck,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Anim from './Anim';
import { getAppRoute } from '../utils/routes';

const DEFAULT_BROKERS = [
    {
      id: 'xm',
      name: 'XM Global',
      categoryBadgeAr: 'وسيط مرخص عالمياً • Tier-1',
      categoryBadgeEn: 'Tier-1 Regulated Global Broker',
      logo: '/assets/Images/brokers/xm.webp',
      logoBg: '#000000',
      rating: 4.95,
      tradersCount: '10M+ متداول',
      tradersCountEn: '10M+ Global Traders',
      accentColor: '#10B981',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      descAr: 'الوسيط الأوسع انتشاراً وأماناً مع تراخيص بريطانية وأسترالية (FCA, ASIC)، بدون عمولات خفية وسرعة تنفيذ فائقة.',
      descEn: 'Industry-leading safety with FCA & ASIC regulations, 0% commissions, and 99.35% sub-second execution speed.',
      specs: [
        { labelAr: 'الحد الأدنى', labelEn: 'Min Deposit', val: '$5' },
        { labelAr: 'الرافعة', labelEn: 'Max Leverage', val: '1:1000' },
        { labelAr: 'السبريد', labelEn: 'Spread', val: '0.6 Pip' },
        { labelAr: 'المنصات', labelEn: 'Platforms', val: 'MT4 / MT5' },
      ],
      couponCode: 'KTW63',
      perkAr: 'بونص ترحيبي 100% حتى $500 (كود: KTW63) + إشارات وتوصيات VIP مجانية فور الإيداع',
      perkEn: '100% Deposit Bonus up to $500 (Code: KTW63) + Instant VIP Signals access',
      liveUrl: 'https://clicks.pipaffiliates.com/c?c=655286&l=ar&p=0',
      demoUrl: 'https://clicks.pipaffiliates.com/c?c=655286&l=ar&p=0',
    },
    {
      id: 'ywo',
      name: 'YWO Markets',
      categoryBadgeAr: 'سبريد خام 0.0 • ECN مباشر',
      categoryBadgeEn: '0.0 Raw Spreads • Direct ECN',
      logo: '/assets/Images/brokers/ywo.webp',
      logoBg: '#02DA77',
      rating: 4.88,
      tradersCount: '150K+ متداول',
      tradersCountEn: '150K+ Active Traders',
      accentColor: '#00D06C',
      glowColor: 'rgba(0, 208, 108, 0.25)',
      descAr: 'بيئة تنفيذ مباشرة مع كبرى بنوك السيولة (STP/ECN)، مصممة لمتداولي السكالبينج والذهب بأسعار وفروقات خام منعدمة.',
      descEn: 'Institutional-grade liquidity (STP/ECN) with 0.0 raw pips tailored specifically for Gold and high-frequency scalpers.',
      specs: [
        { labelAr: 'الحد الأدنى', labelEn: 'Min Deposit', val: '$10' },
        { labelAr: 'الرافعة', labelEn: 'Max Leverage', val: '1:1000' },
        { labelAr: 'السبريد', labelEn: 'Raw Spread', val: '0.0 Pip' },
        { labelAr: 'التنفيذ', labelEn: 'Latency', val: '< 35ms' },
      ],
      perkAr: 'خصم 25% على العمولات مدى الحياة + توصيات قناص الذهب اللحظية',
      perkEn: '25% Lifetime commission rebate + Intraday Gold Scalper setups',
      liveUrl: 'https://portal.ywo.com/links/go/5583',
      demoUrl: 'https://portal.ywo.com/links/go/5583',
    },
    {
      id: 'propxp',
      name: 'PropXP',
      categoryBadgeAr: 'شركة تمويل • حتى $200K',
      categoryBadgeEn: 'Prop Firm • Up to $200K',
      logo: '/assets/Images/brokers/propxp.webp',
      logoBg: '#0E1528',
      rating: 4.92,
      tradersCount: '50K+ حساب ممول',
      tradersCountEn: '50,000+ Funded Traders',
      accentColor: '#00A3FF',
      glowColor: 'rgba(0, 163, 255, 0.22)',
      descAr: 'احصل على حساب ممول وتداول برؤوس أموال حقيقية واحتفظ بنسبة تصل إلى 95% من أرباحك، مع خيارات تمويل فوري وسحب يومي.',
      descEn: 'Manage funded capital up to $200K without risking personal funds. Retain up to 95% profit splits with daily payouts.',
      specs: [
        { labelAr: 'التمويل', labelEn: 'Funding', val: '$5K - $200K' },
        { labelAr: 'نسبة الأرباح', labelEn: 'Split', val: '80% - 95%' },
        { labelAr: 'النماذج', labelEn: 'Models', val: '1-Step / Instant' },
        { labelAr: 'السحب', labelEn: 'Payouts', val: '< 24 Hours' },
      ],
      couponCode: 'ENG',
      perkAr: 'خصم 15% على جميع التحديات (كود: ENG) + استرداد 100% للرسوم',
      perkEn: 'Exclusive 15% discount (Code: ENG) + 100% Fee Refund',
      liveUrl: 'https://app.propxp.com/register?referral_id=85fdc2fcf727',
      demoUrl: 'https://app.propxp.com/register?referral_id=85fdc2fcf727',
    },
    {
      id: 'multibank',
      name: 'MultiBank Group',
      categoryBadgeAr: 'مجموعة مالية كبرى • تأسست 2005',
      categoryBadgeEn: 'Global Financial Group • EST. 2005',
      logo: '/assets/Images/brokers/multibank.webp',
      logoBg: '#FFFFFF',
      rating: 4.93,
      tradersCount: '1M+ متداول',
      tradersCountEn: '1M+ Global Clients',
      accentColor: '#C5A059',
      glowColor: 'rgba(197, 160, 89, 0.25)',
      descAr: 'واحدة من أكبر المؤسسات المالية في العالم مع أكثر من 14 ترخيصاً رقابياً (ASIC, BaFin, SCA) وأمان مصرفي فائق للمحافظ.',
      descEn: 'One of the world’s largest derivatives providers regulated by 14+ top authorities (ASIC, BaFin, SCA) with bank-grade security.',
      specs: [
        { labelAr: 'الحد الأدنى', labelEn: 'Min Deposit', val: '$50' },
        { labelAr: 'الرافعة', labelEn: 'Max Leverage', val: '1:500' },
        { labelAr: 'السبريد', labelEn: 'Spread', val: '0.0 Pip' },
        { labelAr: 'المنصات', labelEn: 'Platforms', val: 'MT4 / MT5' },
      ],
      couponCode: '7711309',
      perkAr: 'بونص إيداع 20% إضافي (كود الشريك: 7711309) + حماية كاملة لرأس المال وتوصيات VIP مجانية',
      perkEn: '20% Deposit Bonus (Partner Code: 7711309) + Complete capital insurance & free VIP signals',
      liveUrl: 'https://multibankfx.com/account/live-account?ibNum=7711309',
      demoUrl: 'https://multibankfx.com/account/live-account?ibNum=7711309',
    },
    {
      id: 'hfm',
      name: 'HFM (HF Markets)',
      categoryBadgeAr: 'وسيط عالمي حائز على جوائز • FCA',
      categoryBadgeEn: 'Award-Winning Global Broker • FCA',
      logo: '/assets/Images/brokers/hfm.webp',
      logoBg: '#000000',
      rating: 4.90,
      tradersCount: '3.5M+ حساب نشط',
      tradersCountEn: '3.5M+ Active Accounts',
      accentColor: '#10B981',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      descAr: 'وسيط حاصل على أكثر من 60 جائزة عالمية، يتيح فتح الحساب بدون حد أدنى للإيداع، مع سبريد منعدم وسحب فوري متعدد القنوات.',
      descEn: 'Multi-award winning global brokerage with zero minimum deposit, zero spread accounts, and instant multi-channel withdrawals.',
      specs: [
        { labelAr: 'الحد الأدنى', labelEn: 'Min Deposit', val: '$0' },
        { labelAr: 'الرافعة', labelEn: 'Max Leverage', val: '1:2000' },
        { labelAr: 'السبريد', labelEn: 'Spread', val: '0.0 Pip' },
        { labelAr: 'المنصات', labelEn: 'Platforms', val: 'MT4 / MT5 / App' },
      ],
      perkAr: 'استرداد كاش باك حتى 2$ لكل لوت + بونص تداول 20% وإشارات VIP فورية',
      perkEn: 'Up to $2/lot cashback rebate + 20% Top-Up bonus and instant VIP access',
      liveUrl: 'https://www.hfm.com',
      demoUrl: 'https://www.hfm.com',
    },
    {
      id: 'doo-prime',
      name: 'Doo Prime',
      categoryBadgeAr: 'الأكثر موثوقية عالمياً • فئة أولى Tier-1',
      categoryBadgeEn: 'Most Trusted Globally • Tier-1 Regulated',
      badgeAr: 'الأكثر موثوقية عالمياً • فئة أولى Tier-1',
      badgeEn: 'Most Trusted Globally • Tier-1 Regulated',
      logo: '/assets/Images/brokers/dooprime.svg',
      logoBg: '#FFFFFF',
      rating: 4.95,
      tradersCount: 'تنوع ضخم +10,000 أداة • دعم TradingView وبونص 100%',
      tradersCountEn: '10,000+ Instruments • TradingView & 100% Bonus',
      clientsCount: 'تنوع ضخم +10,000 أداة • دعم TradingView وبونص 100%',
      clientsCountEn: '10,000+ Instruments • TradingView & 100% Bonus',
      accentColor: '#10B981',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      descAr: 'وسيط مالي دولي رائد منذ 2014 مع أكثر من 130,000 عميل وتراخيص كبرى من بريطانيا (FCA)، أستراليا (ASIC)، وسيشيل (FSA). يوفر سبريد فائق الانخفاض يبدأ من 0.0 نقطة ورافعة مالية تصل إلى 1:1000 مع ربط مباشر بمنصة TradingView.',
      descEn: 'Leading international broker established in 2014, multi-regulated by FCA, ASIC, and FSA. Features raw spreads from 0.0 pips, up to 1:1000 leverage, and direct TradingView platform integration.',
      specs: [
        { labelAr: 'الحد الأدنى', labelEn: 'Min Deposit', val: '$10' },
        { labelAr: 'الرافعة', labelEn: 'Max Leverage', val: '1:1000' },
        { labelAr: 'السبريد', labelEn: 'Spread', val: '0.0 Pip' },
        { labelAr: 'المنصات', labelEn: 'Platforms', val: 'MT4 / MT5 / TV' },
      ],
      couponCode: 'DOO-FXENG',
      perkAr: 'بونص إيداع إضافي + إشارات وتوصيات VIP مجانية فور الإيداع (كود: DOO-FXENG)',
      perkEn: 'Exclusive Deposit Bonus + Instant VIP Signals access (Code: DOO-FXENG)',
      liveUrl: 'https://user.dooprime.com/register',
      demoUrl: 'https://user.dooprime.com/register',
    },
  ];

export default function BrokersSection({ onlyLoggedIn = false }) {
  const { isAr } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  const [brokers, setBrokers] = useState(DEFAULT_BROKERS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/brokers')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const rawList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : data?.brokers);
        if (Array.isArray(rawList) && rawList.length > 0) {
          const activeList = rawList.filter(
            (b) => b.active !== false && b.isActive !== false && b.status !== 'INACTIVE'
          );
          if (activeList.length > 0) {
            setBrokers(activeList);
          }
        }
      })
      .catch((err) => console.warn('Failed to load brokers:', err.message));
  }, []);

  // If onlyLoggedIn is requested and user is not authenticated, do not render
  if (onlyLoggedIn && (!isAuthenticated || !user)) {
    return null;
  }

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2200);
  };

  return (
    <section
      id="open-account-section"
      className="section-surface"
      style={{
        background: 'var(--surface)',
        padding: '68px 0',
        position: 'relative',
        boxShadow: '0 24px 60px rgba(0, 3, 13, 0.5), 0 -24px 60px rgba(0, 3, 13, 0.5)',
        overflow: 'hidden',
      }}
    >
      {/* Background Accent Gradients */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(4, 136, 248, 0.1) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '5%',
          width: '420px',
          height: '420px',
          background: 'radial-gradient(circle, rgba(251, 135, 4, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <Anim>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '36px',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontSize: '12.5px', fontWeight: 800, marginBottom: '8px', letterSpacing: '0.5px' }}>
                <FiShield size={16} />
                <span>{isAr ? 'شركاء التداول الرسميون المعتمدون لـ FXENGIN' : 'FXENGIN Official Verified Trading Partners'}</span>
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 900, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                {isAr ? 'افتح حساب تداولك مع ' : 'Open Your Trading Account with '}
                <span className="text-gradient-brand">
                  {isAr ? 'الوسطاء وشركات التمويل المعتمدة' : 'Top Verified Partners'}
                </span>
              </h2>
            </div>

            <Link
              href={getAppRoute('/open-account', user)}
              className="btn-secondary"
              style={{
                height: '42px',
                padding: '0 20px',
                fontSize: '13.5px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '10px',
              }}
            >
              <span>{isAr ? 'صفحة فتح الحساب الكاملة والمقارنة' : 'Full Partner Comparison Page'}</span>
              <FiArrowLeft size={15} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
            </Link>
          </div>
        </Anim>

        {/* Broker Cards Grid / Flex Container */}
        <div className="brokers-cards-grid">
          {brokers.map((broker, idx) => (
            <Anim
              key={broker.id}
              delay={idx * 0.1}
              className={`broker-card-col ${idx === brokers.length - 1 ? 'broker-card-last' : ''}`}
            >
              <div
                suppressHydrationWarning
                className="broker-home-card"
                style={{
                  background: 'var(--surface-elevated)',
                  borderRadius: '18px',
                  border: `1px solid rgba(255, 255, 255, 0.08)`,
                  boxShadow: '0 12px 32px rgba(0, 3, 13, 0.65)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.25s ease',
                  height: '100%',
                }}
              >
                {/* Top Accent Gradient Line */}
                <div
                  suppressHydrationWarning
                  style={{
                    height: '3.5px',
                    width: '100%',
                    background: `linear-gradient(90deg, transparent, ${broker.accentColor}, transparent)`,
                  }}
                />

                {/* Full-width Product Image Showcase Banner at the Top */}
                <div
                  className="broker-card-image-banner"
                  style={{
                    width: '100%',
                    height: '205px',
                    position: 'relative',
                    background: broker.logoBg || 'var(--surface-container, #06142F)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 16px 42px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Subtle radial glow */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `radial-gradient(circle at center, ${broker.glowColor || 'rgba(255,255,255,0.06)'} 0%, transparent 75%)`,
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Rating Pill (Kept at the Top in its Place) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      [isAr ? 'left' : 'right']: '12px',
                      zIndex: 2,
                    }}
                  >
                    <span
                      suppressHydrationWarning
                      style={{
                        background: 'rgba(1, 7, 30, 0.88)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.45)',
                      }}
                    >
                      <span style={{ color: 'var(--accent)' }}>★ {broker.rating}</span>
                    </span>
                  </div>

                  {/* Centered Product / Broker Logo */}
                  <img
                    src={broker.logo || broker.logoUrl || '/assets/Images/brokers/xm.webp'}
                    alt={`${broker.name} Logo`}
                    className="broker-hero-logo"
                    style={{
                      maxHeight: '70px',
                      maxWidth: '78%',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      position: 'relative',
                      zIndex: 1,
                      filter: 'drop-shadow(0 4px 14px rgba(0, 0, 0, 0.25))',
                      transition: 'transform 0.3s ease',
                    }}
                  />

                  {/* Category Text (At the bottom of image section - 100% visible, fully wrapped, zero cut-off) */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      right: '8px',
                      display: 'flex',
                      justifyContent: 'center',
                      zIndex: 2,
                    }}
                  >
                    <span
                      suppressHydrationWarning
                      style={{
                        background: 'rgba(1, 7, 30, 0.94)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${broker.accentColor || 'var(--primary)'}`,
                        color: broker.accentColor || 'var(--primary)',
                        fontSize: '11px',
                        fontWeight: 800,
                        lineHeight: 1.35,
                        padding: '5px 12px',
                        borderRadius: '10px',
                        display: 'block',
                        textAlign: 'center',
                        width: '100%',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      {isAr ? (broker.categoryBadgeAr || broker.badgeAr) : (broker.categoryBadgeEn || broker.badgeEn)}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                  {/* Broker Name & Clients Count Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                      {broker.name}
                    </h3>
                    <div suppressHydrationWarning style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                      {isAr ? (broker.tradersCount || broker.clientsCount) : (broker.tradersCountEn || broker.clientsCountEn)}
                    </div>
                  </div>

                  {/* Description */}
                  <p suppressHydrationWarning style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {isAr ? (broker.descAr || broker.descriptionAr) : (broker.descEn || broker.descriptionEn)}
                  </p>

                  {/* Specs 2x2 Pills Grid */}
                  <div
                    suppressHydrationWarning
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                      background: 'rgba(1, 7, 30, 0.6)',
                      borderRadius: '10px',
                      padding: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    {(broker.specs || broker.specsData || []).map((s, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{isAr ? s.labelAr : s.labelEn}</span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>{s.val || (isAr ? s.valueAr : s.valueEn) || ''}</span>
                      </div>
                    ))}
                  </div>

                  {/* Exclusive Perk Box */}
                  <div
                    suppressHydrationWarning
                    style={{
                      background: 'rgba(251, 135, 4, 0.08)',
                      border: '1px solid rgba(251, 135, 4, 0.25)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      marginTop: 'auto',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiAward size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {isAr ? (broker.perkAr || broker.perksAr || broker.fxenginPerksAr) : (broker.perkEn || broker.perksEn || broker.fxenginPerksEn)}
                      </span>
                    </div>

                    {broker.couponCode && (
                      <button
                        onClick={() => copyCoupon(broker.couponCode)}
                        title={isAr ? 'نسخ كود الشريك / الخصم' : 'Copy Partner Code / Coupon'}
                        style={{
                          background: copiedCoupon === broker.couponCode ? 'var(--success)' : 'rgba(255, 255, 255, 0.12)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          color: '#FFF',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          fontSize: '11px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {copiedCoupon === broker.couponCode ? <FiCheck size={12} /> : <FiCopy size={12} />}
                        <span>{broker.couponCode}</span>
                      </button>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
                    <a
                      href={broker.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{
                        flex: 1,
                        height: '40px',
                        fontSize: '13px',
                        fontWeight: 800,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        borderRadius: '8px',
                      }}
                    >
                      <span>
                        {broker.id === 'propxp'
                          ? isAr ? 'بدء التحدي' : 'Start Challenge'
                          : isAr ? 'فتح حساب حقيقي' : 'Open Live Account'}
                      </span>
                      <FiExternalLink size={14} />
                    </a>

                    <a
                      href={broker.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{
                        height: '40px',
                        padding: '0 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        flexShrink: 0,
                      }}
                    >
                      <span>Demo</span>
                    </a>
                  </div>
                </div>
              </div>
            </Anim>
          ))}
        </div>

        {/* Bottom VIP Activation Notice */}
        <Anim delay={0.3}>
          <div
            style={{
              background: 'linear-gradient(90deg, rgba(4, 136, 248, 0.1) 0%, rgba(251, 135, 4, 0.1) 100%)',
              border: '1px solid rgba(4, 136, 248, 0.25)',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--brand-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <FiZap size={18} />
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                <span style={{ fontWeight: 800, color: 'var(--accent)' }}>
                  {isAr ? 'تفعيل مزايا VIP المجانية: ' : 'VIP Free Activation: '}
                </span>
                <span>
                  {isAr
                    ? 'بعد فتح حسابك لدى أي وسيط، أرسل رقم الحساب لدعم FXENGIN ليتم تفعيل إشارات الـ VIP وكورسات الأكاديمية تلقائياً.'
                    : 'After opening your account, send your account number to FXENGIN support to unlock instant VIP signals and academy pass.'}
                </span>
              </div>
            </div>

            <Link
              href={getAppRoute('/contact', user)}
              className="btn-secondary"
              style={{
                height: '34px',
                padding: '0 16px',
                fontSize: '12.5px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '6px',
              }}
            >
              <span>{isAr ? 'تواصل مع الدعم لربط الحساب' : 'Contact Support to Link'}</span>
              {isAr ? <FiArrowLeft size={13} /> : <FiArrowRight size={13} />}
            </Link>
          </div>
        </Anim>
      </div>

      <style>{`
        .brokers-cards-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 24px;
          margin-bottom: 32px;
          width: 100%;
        }

        .broker-card-col {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 100%;
          flex: 0 0 100%;
        }

        @media (min-width: 680px) {
          .broker-card-col {
            width: calc((100% - 24px) / 2);
            max-width: calc((100% - 24px) / 2);
            flex: 0 0 calc((100% - 24px) / 2);
          }
        }

        @media (min-width: 1024px) {
          .broker-card-col {
            width: calc((100% - 48px) / 3);
            max-width: calc((100% - 48px) / 3);
            flex: 0 0 calc((100% - 48px) / 3);
          }
        }

        .broker-home-card {
          width: 100%;
        }

        .broker-home-card:hover {
          transform: translateY(-5px);
          border-color: rgba(4, 136, 248, 0.4) !important;
          box-shadow: 0 20px 48px rgba(0, 3, 13, 0.9), 0 0 24px rgba(4, 136, 248, 0.2) !important;
        }

        .broker-home-card:hover .broker-hero-logo {
          transform: scale(1.08);
        }
      `}</style>
    </section>
  );
}
