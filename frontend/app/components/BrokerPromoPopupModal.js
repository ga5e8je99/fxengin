'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  IoCloseOutline,
  IoShieldCheckmarkOutline,
  IoStar,
  IoSparklesOutline,
  IoArrowForwardOutline,
  IoArrowBackOutline,
  IoFlameOutline,
  IoCheckmarkDoneCircleOutline,
  IoCopyOutline,
  IoCheckmarkOutline,
  IoOpenOutline,
} from 'react-icons/io5';
import { useLanguage } from '../context/LanguageContext';

export const resolveBrokerThemeColor = (broker) => {
  if (!broker) return '#02DA77';
  const brandColors = {
    ywo: '#02DA77',
    xm: '#10B981',
    propxp: '#F59E0B',
    multibank: '#0284C7',
    hfm: '#059669',
  };
  const idLower = String(broker.id || broker.brokerSlug || broker.name || '').toLowerCase();
  for (const [key, color] of Object.entries(brandColors)) {
    if (idLower.includes(key)) return color;
  }
  if (broker.logoBg && !['#000000', '#111827', '#0F172A', '#052E16'].includes(broker.logoBg)) {
    return broker.logoBg;
  }
  return broker.accentColor || broker.badgeColor || '#02DA77';
};

const DEFAULT_BROKERS = [
  {
    id: 'xm',
    name: 'XM Global',
    categoryLabelAr: 'وسيط فوركس وعقود فروقات مرخص فئة أولى',
    categoryLabelEn: 'Multi-Regulated Tier-1 Global Broker',
    badgeAr: 'الأكثر موثوقية عالمياً • فئة أولى Tier-1',
    badgeEn: 'Most Trusted Globally • Tier-1 Regulated',
    badgeColor: '#10B981',
    logo: '/assets/Images/brokers/xm.webp',
    logoBg: '#000000',
    rating: 4.95,
    clientsCount: '10M+ متداول حول العالم',
    clientsCountEn: '10M+ Traders Worldwide',
    accentColor: '#10B981',
    glowBorder: 'rgba(16, 185, 129, 0.35)',
    descriptionAr: 'الوسيط العالمي الرائد الحاصل على تراخيص FCA وCySEC وASIC مع تنفيذ فوري وسبريد يبدأ من 0.6 نقطة وحسابات إسلامية 100%.',
    descriptionEn: 'Industry-leading global broker with Tier-1 regulations (FCA, CySEC, ASIC), zero re-quotes, and 99.35% instant order execution.',
    specs: [
      { labelAr: 'الحد الأدنى للإيداع', labelEn: 'Min Deposit', valueAr: '$5 فقط', valueEn: '$5 Only' },
      { labelAr: 'الرافعة المالية', labelEn: 'Max Leverage', valueAr: 'حتى 1:1000', valueEn: 'Up to 1:1000' },
      { labelAr: 'السبريد', labelEn: 'Spread', valueAr: 'من 0.6 نقطة', valueEn: 'From 0.6 pips' },
      { labelAr: 'الحساب الإسلامي', labelEn: 'Islamic Account', valueAr: 'متوفر بدون فوائد', valueEn: 'Swap-Free Available' },
    ],
    featuresAr: [
      'بونص ترحيبي 100% مضاعف للإيداع حتى 500$',
      'سحب وإيداع فوري بدون أي رسوم عبر البطاقات والمحافظ الرقمية',
      'حسابات إسلامية خالية تماماً من الفوائد الربوية ورسوم التبييت',
    ],
    featuresEn: [
      '100% Welcome Deposit Bonus up to $500',
      'Instant zero-fee deposits & withdrawals via Cards & Digital Wallets',
      'Fully certified swap-free Islamic accounts',
    ],
    couponCode: 'KTW63',
    fxenginPerksAr: 'بونص ترحيبي 100% حتى $500 (كود الشريك: KTW63) + إشارات وتوصيات VIP مجانية فور الإيداع',
    fxenginPerksEn: '100% Welcome Deposit Bonus up to $500 (Partner Code: KTW63) + Free Lifetime VIP Signals access',
    liveUrl: 'https://clicks.pipaffiliates.com/c?c=655286&l=ar&p=0',
    demoUrl: 'https://clicks.pipaffiliates.com/c?c=655286&l=ar&p=0',
  },
  {
    id: 'ywo',
    name: 'YWO Markets',
    categoryLabelAr: 'وسيط ECN حديث بسبريد خام 0.0 نقطة',
    categoryLabelEn: 'Ultra-Low Raw ECN Spread Broker',
    badgeAr: 'سبريد خام 0.0 • رافعة وسرعة فائقة',
    badgeEn: '0.0 Raw Spreads • High Leverage Execution',
    badgeColor: '#00D06C',
    logo: '/assets/Images/brokers/ywo.webp',
    logoBg: '#02DA77',
    rating: 4.88,
    clientsCount: '150K+ متداول نشط',
    clientsCountEn: '150K+ Active Traders',
    accentColor: '#00D06C',
    glowBorder: 'rgba(0, 208, 108, 0.35)',
    descriptionAr: 'بيئة تنفيذ صفقات فائقة السرعة مخصصة لسكالبينج الذهب والعملات والمؤشرات مع سيولة بنكية مباشرة وسبريد خام 0.0.',
    descriptionEn: 'Next-generation broker optimized for scalpers and day traders, offering raw spreads starting from 0.0 pips and direct institutional liquidity.',
    specs: [
      { labelAr: 'الحد الأدنى للإيداع', labelEn: 'Min Deposit', valueAr: '$10 فقط', valueEn: '$10 Only' },
      { labelAr: 'الرافعة المالية', labelEn: 'Max Leverage', valueAr: 'حتى 1:1000', valueEn: 'Up to 1:1000' },
      { labelAr: 'السبريد الخام', labelEn: 'Raw Spread', valueAr: 'يبدأ من 0.0 نقطة', valueEn: 'Starts from 0.0 pips' },
      { labelAr: 'المنصات', labelEn: 'Platforms', valueAr: 'MetaTrader 5 (MT5)', valueEn: 'MetaTrader 5 (MT5)' },
    ],
    featuresAr: [
      'سبريد خام 0.0 نقطة مخصص لسكالبينج الذهب والمؤشرات',
      'إيداع وسحب فوري عبر USDT وجميع وسائل الدفع الرقمية',
      'رافعة مالية مرنة وتنفيذ مباشر فائق السرعة',
    ],
    featuresEn: [
      '0.0 Raw pip spreads tailored for Gold & Indices scalping',
      'Instant USDT & crypto deposits & withdrawals',
      'Flexible high leverage and ultra low latency execution',
    ],
    couponCode: '',
    fxenginPerksAr: 'سبريد خام 0.0 نقطة لحسابات عملاء FXEngin + دعم فني مباشر واسترداد عمولات',
    fxenginPerksEn: '0.0 Raw spread exclusively for FXEngin traders + direct priority support & cashback rebates',
    liveUrl: 'https://user.ywomarkets.com/register?referral=6058',
    demoUrl: 'https://user.ywomarkets.com/register?referral=6058',
  },
  {
    id: 'propxp',
    name: 'PropXP Funding',
    categoryLabelAr: 'شركة تقييم وتمويل متداولين برأس مال حتى $200,000',
    categoryLabelEn: 'Premier Trader Evaluation & Funding Firm',
    badgeAr: 'تمويل حسابات حتى $200K • تقسيم أرباح 90%',
    badgeEn: 'Funded Accounts up to $200K • 90% Profit Split',
    badgeColor: '#F59E0B',
    logo: '/assets/Images/brokers/propxp.webp',
    logoBg: '#F59E0B',
    rating: 4.92,
    clientsCount: '$12M+ سحوبات ممولة',
    clientsCountEn: '$12M+ Funded Payouts',
    accentColor: '#F59E0B',
    glowBorder: 'rgba(245, 158, 11, 0.35)',
    descriptionAr: 'تداول برأس مال الشركة مع قواعد تقييم واقعية بدون حد أقصى للوقت وسحب أرباح كل أسبوعين بنسبة تصل إلى 90%.',
    descriptionEn: 'Trade firm capital with realistic evaluation rules, no time limits, and bi-weekly payouts with up to 90% profit share.',
    specs: [
      { labelAr: 'رأس مال التمويل', labelEn: 'Account Size', valueAr: 'حتى $200,000', valueEn: 'Up to $200,000' },
      { labelAr: 'تقسيم الأرباح', labelEn: 'Profit Split', valueAr: 'حتى 90% للمتداول', valueEn: 'Up to 90% Trader Share' },
      { labelAr: 'وقت التقييم', labelEn: 'Time Limit', valueAr: 'بدون حد زمني', valueEn: 'No Time Limit' },
      { labelAr: 'المنصات', labelEn: 'Platforms', valueAr: 'MT5 / TradeLocker', valueEn: 'MT5 / TradeLocker' },
    ],
    featuresAr: [
      'استرداد رسوم التقييم 100% مع أول سحب للأرباح',
      'سحب أرباح كل 14 يوماً مع خيار السحب الفوري بالكريبتو',
      'كوبون خصم حصري 20% لعملاء وأعضاء أكاديمية FXEngin',
    ],
    featuresEn: [
      '100% Refund of evaluation fee upon first payout',
      'Bi-weekly profit withdrawals with instant Crypto payouts',
      'Exclusive 20% discount coupon for FXEngin academy members',
    ],
    couponCode: 'FXENGIN20',
    fxenginPerksAr: 'خصم حصري 20% بكود (FXENGIN20) + استرداد الرسوم كاملاً مع السحب الأول للأرباح',
    fxenginPerksEn: 'Exclusive 20% Discount with code (FXENGIN20) + 100% Fee Refund on first profit payout',
    liveUrl: 'https://propxp.com?aff=fxengin',
    demoUrl: 'https://propxp.com?aff=fxengin',
  },
  {
    id: 'multibank',
    name: 'MultiBank Group',
    categoryLabelAr: 'مجموعة مالية كبرى حاصلة على أكثر من 14 ترخيصاً',
    categoryLabelEn: 'Global Financial Conglomerate (14+ Regulations)',
    badgeAr: '14+ ترخيص دولي • أمان مصرفي كامل',
    badgeEn: '14+ Regulators • Bank-Grade Safety',
    badgeColor: '#0EA5E9',
    logo: '/assets/Images/brokers/multibank.webp',
    logoBg: '#0284C7',
    rating: 4.86,
    clientsCount: '1M+ عميل عالمي',
    clientsCountEn: '1M+ Global Clients',
    accentColor: '#0EA5E9',
    glowBorder: 'rgba(14, 165, 233, 0.35)',
    descriptionAr: 'من أضخم المؤسسات المالية للتداول عالمياً مع تراخيص ASIC وBaFin وDFSA وسيولة عميقة على أكثر من 20,000 أصل مالي.',
    descriptionEn: 'One of the world’s largest multi-asset institutions with ASIC, BaFin, and DFSA oversight, providing institutional liquidity across 20,000+ assets.',
    specs: [
      { labelAr: 'الحد الأدنى للإيداع', labelEn: 'Min Deposit', valueAr: '$50', valueEn: '$50' },
      { labelAr: 'الرافعة المالية', labelEn: 'Max Leverage', valueAr: 'تصل إلى 1:500', valueEn: 'Up to 1:500' },
      { labelAr: 'السبريد', labelEn: 'Spread', valueAr: 'من 0.0 نقطة', valueEn: 'From 0.0 pips' },
      { labelAr: 'الترخيص', labelEn: 'Regulation', valueAr: 'ASIC, BaFin, DFSA', valueEn: 'ASIC, BaFin, DFSA' },
    ],
    featuresAr: [
      'فصل كامل لأموال العملاء في بنوك الفئة الأولى (Tier-1)',
      'سبريد يبدأ من الصفر مع رافعة مالية مرنة وتنفيذ سريع',
      'تغطية تأمينية لأموال المتداولين تصل إلى مليون دولار',
    ],
    featuresEn: [
      'Segregated client funds in Tier-1 Global Banks',
      'Spreads from 0.0 pips with flexible leverage and instant fill',
      'Excess insurance protection up to $1M per account',
    ],
    couponCode: '',
    fxenginPerksAr: 'ترقية فورية لحساب VIP بدون عمولات إضافية + تحليلات مهندس الفوركس اليومية',
    fxenginPerksEn: 'Instant VIP Account status upgrade with zero fees + Daily Forex Engineer technical forecasts',
    liveUrl: 'https://multibankfx.com/account/live-account?ib=fxengin',
    demoUrl: 'https://multibankfx.com/account/demo-account?ib=fxengin',
  },
  {
    id: 'hfm',
    name: 'HFM (HotForex)',
    categoryLabelAr: 'وسيط عالمي حائز على جوائز متعددة وسبريد منخفض',
    categoryLabelEn: 'Award-Winning Multi-Asset Global Broker',
    badgeAr: 'جوائز عالمية • حسابات بدون فوائد',
    badgeEn: 'Award-Winning • Zero Swap Accounts',
    badgeColor: '#10B981',
    logo: '/assets/Images/brokers/hfm.webp',
    logoBg: '#059669',
    rating: 4.84,
    clientsCount: '3.5M+ حساب نشط',
    clientsCountEn: '3.5M+ Live Accounts',
    accentColor: '#10B981',
    glowBorder: 'rgba(16, 185, 129, 0.35)',
    descriptionAr: 'وسيط شامل للتداول يجمع بين سهولة التطبيق المتقدم وتنوع خيارات الحسابات الإسلامية مع بونص ترحيبي وسحب آلي فوري.',
    descriptionEn: 'Comprehensive multi-asset broker with intuitive mobile trading apps, diverse Islamic accounts, welcome promotions, and automated payouts.',
    specs: [
      { labelAr: 'الحد الأدنى للإيداع', labelEn: 'Min Deposit', valueAr: '$0 (بدون حد)', valueEn: '$0 (No Minimum)' },
      { labelAr: 'الرافعة المالية', labelEn: 'Max Leverage', valueAr: 'حتى 1:2000', valueEn: 'Up to 1:2000' },
      { labelAr: 'السبريد', labelEn: 'Spread', valueAr: 'من 0.2 نقطة', valueEn: 'From 0.2 pips' },
      { labelAr: 'المنصات', labelEn: 'Platforms', valueAr: 'HFM App, MT4, MT5', valueEn: 'HFM App, MT4, MT5' },
    ],
    featuresAr: [
      'حسابات خالية تماماً من رسوم التبييت والفوائد (Swap Free)',
      'تطبيق متكامل وسريع للتداول والتحليل وإدارة الحساب من الجوال',
      'سحب فوري مؤتمت على مدار 24 ساعة طوال أيام الأسبوع',
    ],
    featuresEn: [
      '100% Certified Swap-Free Islamic accounts',
      'Feature-rich mobile trading application with built-in analytics',
      'Automated 24/7 instant withdrawals processing',
    ],
    couponCode: '',
    fxenginPerksAr: 'رافعة مالية مرنة حتى 1:2000 وسحب فوري بدون رسوم لمتداولي FXEngin',
    fxenginPerksEn: 'Flexible leverage up to 1:2000 and instant fee-free withdrawals for FXEngin users',
    liveUrl: 'https://www.hfm.com/sv/en/?refid=fxengin',
    demoUrl: 'https://www.hfm.com/sv/en/demo-account?refid=fxengin',
  },
];

export default function BrokerPromoPopupModal() {
  const { isAr } = useLanguage();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [brokersList, setBrokersList] = useState(DEFAULT_BROKERS);
  const [currentBrokerIndex, setCurrentBrokerIndex] = useState(0);
  const [config, setConfig] = useState({
    isEnabled: true,
    showOnce: true,
    modalBgTheme: 'broker_logo',
    intervalSeconds: 60,
    initialDelaySeconds: 15,
    mode: 'rotate', // 'rotate' | 'specific'
    selectedBrokerId: 'xm',
    headlineAr: 'فرصة تداول حصرية عبر شركاء FXEngin المعتمدين',
    headlineEn: 'Exclusive Trading Opportunity via FXEngin Verified Partners',
    subheadlineAr: 'احصل على بونص إيداع 100% وحسابات إسلامية خالية من الفوائد مع وصول فوري لتوصيات وتحليلات مهندس الفوركس',
    subheadlineEn: 'Claim 100% deposit bonus and swap-free Islamic accounts with instant access to VIP signals',
    badgeAr: 'شريك وساطة رسمي معتمد • فئة أولى Tier-1',
    badgeEn: 'Official Verified Partner • Tier-1 Regulated',
    ctaTextAr: 'افتح حساب حقيقي الآن',
    ctaTextEn: 'Open Live Account Now',
    demoBtnTextAr: 'حساب تجريبي مجاني',
    demoBtnTextEn: 'Free Demo Account',
    allowDismissMinutes: 1,
  });

  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const isClosingRef = useRef(false);
  const isOpenRef = useRef(isOpen);
  const configRef = useRef(config);
  const pathnameRef = useRef(pathname);
  const brokersListRef = useRef(brokersList);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    brokersListRef.current = brokersList;
  }, [brokersList]);

  // Load config and active brokers from API
  const loadPopupConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/brokers/popup-config', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.config) {
          setConfig((prev) => ({ ...prev, ...json.config }));
        }
        if (Array.isArray(json?.brokers) && json.brokers.length > 0) {
          // Merge with defaults to ensure complete specs and links
          const merged = json.brokers.map((b) => {
            const match = DEFAULT_BROKERS.find((d) => d.id === b.id || d.name?.toLowerCase() === b.name?.toLowerCase());
            return {
              ...match,
              ...b,
              logo: b.logo || b.logoUrl || match?.logo || '/assets/Images/brokers/xm.webp',
              specs: Array.isArray(b.specs) && b.specs.length > 0 ? b.specs : (match?.specs || []),
              featuresAr: Array.isArray(b.featuresAr) && b.featuresAr.length > 0 ? b.featuresAr : (match?.featuresAr || []),
              featuresEn: Array.isArray(b.featuresEn) && b.featuresEn.length > 0 ? b.featuresEn : (match?.featuresEn || []),
              fxenginPerksAr: b.fxenginPerksAr || b.perksAr || match?.fxenginPerksAr || '',
              fxenginPerksEn: b.fxenginPerksEn || b.perksEn || match?.fxenginPerksEn || '',
              liveUrl: b.liveUrl || match?.liveUrl || '#',
              demoUrl: b.demoUrl || match?.demoUrl || '#',
            };
          });
          setBrokersList(merged);
        }
      }
    } catch {
      // Fallback to defaults
    }
  }, []);

  useEffect(() => {
    loadPopupConfig();

    // Re-check config when window gains focus
    const handleFocus = () => {
      loadPopupConfig();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadPopupConfig]);

  // Determine which broker is currently active
  const activeBroker = React.useMemo(() => {
    if (!brokersList || brokersList.length === 0) return DEFAULT_BROKERS[0];
    if (config.mode === 'specific' && config.selectedBrokerId) {
      const found = brokersList.find(
        (b) => b.id === config.selectedBrokerId || b.brokerSlug === config.selectedBrokerId
      );
      if (found) return found;
    }
    return brokersList[currentBrokerIndex % brokersList.length] || brokersList[0];
  }, [brokersList, config.mode, config.selectedBrokerId, currentBrokerIndex]);

  // Support direct test preview via URL (?preview_broker_popup=true) or custom event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('preview_broker_popup') === 'true') {
        sessionStorage.removeItem('fx_broker_main_modal_seen');
        localStorage.removeItem('fx_broker_main_modal_seen');
        setIsOpen(true);
      }
    } catch {}

    const handleCustomOpen = () => {
      sessionStorage.removeItem('fx_broker_main_modal_seen');
      localStorage.removeItem('fx_broker_main_modal_seen');
      setIsOpen(true);
    };
    window.addEventListener('fx-open-broker-popup', handleCustomOpen);
    return () => window.removeEventListener('fx-open-broker-popup', handleCustomOpen);
  }, []);

  // Robust Heartbeat Timer: Persistent across route changes and respects showOnce setting
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const STORAGE_SESSION_START = 'fx_broker_popup_session_start';
    const STORAGE_LAST_SHOWN = 'fx_broker_popup_last_shown';
    const STORAGE_MODAL_SEEN = 'fx_broker_main_modal_seen';

    // Record session start timestamp on first visit
    if (!sessionStorage.getItem(STORAGE_SESSION_START)) {
      sessionStorage.setItem(STORAGE_SESSION_START, String(Date.now()));
    }

    const checkAndTrigger = () => {
      const currentConfig = configRef.current;
      if (!currentConfig || !currentConfig.isEnabled) return;
      if (isOpenRef.current || isClosingRef.current) return;

      // If showOnce is enabled, do NOT show if already seen in this session or user visit
      const isShowOnce = currentConfig.showOnce !== false;
      if (isShowOnce) {
        const modalSeen =
          sessionStorage.getItem(STORAGE_MODAL_SEEN) === 'true' ||
          localStorage.getItem(STORAGE_MODAL_SEEN) === 'true';
        if (modalSeen) return;
      }

      const currentPath = pathnameRef.current || '';
      // Do NOT trigger on checkout, payment, or auth pages
      if (
        currentPath.includes('/checkout') ||
        currentPath.includes('/login') ||
        currentPath.includes('/register') ||
        currentPath.includes('/forgot-password')
      ) {
        return;
      }

      const now = Date.now();
      const intervalSec = Math.max(15, Number(currentConfig.intervalSeconds) || 60);
      const initialDelaySec = Math.max(5, Number(currentConfig.initialDelaySeconds) || 15);

      const lastShownStr = sessionStorage.getItem(STORAGE_LAST_SHOWN);
      let shouldOpen = false;

      if (!lastShownStr) {
        // Initial entry in this browsing session: wait for initialDelaySec
        const sessionStart = Number(sessionStorage.getItem(STORAGE_SESSION_START) || now);
        if ((now - sessionStart) / 1000 >= initialDelaySec) {
          shouldOpen = true;
        }
      } else {
        // Recurring: wait for intervalSec (e.g. 60 seconds)
        const lastShownTime = Number(lastShownStr);
        if ((now - lastShownTime) / 1000 >= intervalSec) {
          shouldOpen = true;
        }
      }

      if (shouldOpen) {
        if (isShowOnce) {
          sessionStorage.setItem(STORAGE_MODAL_SEEN, 'true');
          localStorage.setItem(STORAGE_MODAL_SEEN, 'true');
        }
        sessionStorage.setItem(STORAGE_LAST_SHOWN, String(now));
        const listLen = brokersListRef.current?.length || 1;
        setCurrentBrokerIndex((prevIdx) => (prevIdx + 1) % listLen);
        setIsOpen(true);
      }
    };

    // Run check on mount and then every 1000ms
    checkAndTrigger();
    const intervalId = setInterval(checkAndTrigger, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleClose = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    isOpenRef.current = false;
    isClosingRef.current = false;
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('fx_broker_popup_last_shown', String(Date.now()));
      sessionStorage.setItem('fx_broker_main_modal_seen', 'true');
      localStorage.setItem('fx_broker_main_modal_seen', 'true');
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('preview_broker_popup')) {
          url.searchParams.delete('preview_broker_popup');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
      } catch {}
    }
  };

  const handleCopyCoupon = (code, e) => {
    e.stopPropagation();
    if (!code) return;
    try {
      navigator.clipboard.writeText(code);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2500);
    } catch {}
  };

  const handleNextBroker = (e) => {
    e.stopPropagation();
    setCurrentBrokerIndex((prev) => (prev + 1) % brokersList.length);
  };

  const handlePrevBroker = (e) => {
    e.stopPropagation();
    setCurrentBrokerIndex((prev) => (prev - 1 + brokersList.length) % brokersList.length);
  };

  if (!isOpen) return null;

  const brokerThemeColor = resolveBrokerThemeColor(activeBroker);
  const accentColor = activeBroker?.accentColor || brokerThemeColor;
  const glowBorder = `${brokerThemeColor}55`;
  const brokerPerks = isAr
    ? activeBroker?.fxenginPerksAr || activeBroker?.perksAr
    : activeBroker?.fxenginPerksEn || activeBroker?.perksEn;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(1, 4, 11, 0.82)',
        backgroundImage: `radial-gradient(circle at 50% 50%, ${brokerThemeColor}20 0%, transparent 60%)`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        direction: isAr ? 'rtl' : 'ltr',
        animation: 'fxFadeIn 0.3s ease-out forwards',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <style jsx>{`
        @keyframes fxFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fxScaleUp {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes fxShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fxPulseGlow {
          0%, 100% { box-shadow: 0 0 25px ${glowBorder}; }
          50% { box-shadow: 0 0 45px ${glowBorder}; }
        }
      `}</style>

      {/* Main Modal Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '38rem',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '1.25rem',
          background: `radial-gradient(ellipse 90% 65% at 50% -15%, ${brokerThemeColor}50 0%, transparent 75%), linear-gradient(155deg, ${brokerThemeColor}30 0%, #06111f 40%, #02060e 100%)`,
          border: `2px solid ${brokerThemeColor}`,
          boxShadow: `0 25px 75px -15px rgba(0, 0, 0, 0.95), 0 0 50px ${brokerThemeColor}50`,
          color: '#ffffff',
          padding: '1.75rem',
          animation: 'fxScaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Top Floating Glow Pill */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            height: '3px',
            width: '45%',
            background: `linear-gradient(90deg, transparent, ${brokerThemeColor}, transparent)`,
            borderRadius: '0 0 8px 8px',
          }}
        />

        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          {/* Top Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: `${brokerThemeColor}20`,
              border: `1px solid ${brokerThemeColor}55`,
              color: brokerThemeColor,
              letterSpacing: '0.02em',
            }}
          >
            <IoSparklesOutline size={14} />
            <span>{isAr ? config.badgeAr : config.badgeEn}</span>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => handleClose(e)}
            onPointerDown={(e) => {
              e.stopPropagation();
              handleClose(e);
            }}
            aria-label="Close"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94A3B8',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#EF4444';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            <IoCloseOutline size={22} />
          </button>
        </div>

        {/* Broker Identification Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            padding: '1rem',
            borderRadius: '1rem',
            background: `linear-gradient(135deg, ${brokerThemeColor}35 0%, rgba(8, 20, 42, 0.85) 100%)`,
            border: `1.5px solid ${brokerThemeColor}70`,
            marginBottom: '1.25rem',
          }}
        >
          {/* Logo Container */}
          <div
            style={{
              position: 'relative',
              width: '4.75rem',
              height: '4.75rem',
              borderRadius: '0.85rem',
              overflow: 'hidden',
              background: activeBroker?.logoBg || '#000000',
              border: `1.5px solid ${accentColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              padding: '0.4rem',
            }}
          >
            <Image
              src={activeBroker?.logo || '/assets/Images/brokers/xm.webp'}
              alt={activeBroker?.name || 'Broker Partner'}
              width={68}
              height={68}
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
              unoptimized
            />
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  margin: 0,
                }}
              >
                {activeBroker?.name}
              </h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <IoShieldCheckmarkOutline size={12} />
                <span>{isAr ? 'مرخص ومعتمد' : 'Regulated'}</span>
              </span>
            </div>

            <p
              style={{
                fontSize: '0.8125rem',
                color: '#94A3B8',
                marginTop: '0.25rem',
                marginBottom: '0.4rem',
                lineHeight: 1.4,
              }}
            >
              {isAr ? activeBroker?.categoryLabelAr : activeBroker?.categoryLabelEn}
            </p>

            {/* Rating & Client Count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#F59E0B' }}>
                <IoStar size={13} />
                <span style={{ fontWeight: 700 }}>{activeBroker?.rating || 4.9}</span>
                <span style={{ color: '#64748B' }}>/ 5.0</span>
              </div>
              <span style={{ color: '#475569' }}>•</span>
              <span style={{ color: '#38BDF8', fontWeight: 600 }}>
                {isAr ? activeBroker?.clientsCount : activeBroker?.clientsCountEn}
              </span>
            </div>
          </div>
        </div>

        {/* Custom Headline & Subtitle */}
        <div style={{ marginBottom: '1.25rem', textAlign: isAr ? 'right' : 'left' }}>
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              background: 'linear-gradient(90deg, #FFFFFF, #E2E8F0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.35rem',
              lineHeight: 1.35,
            }}
          >
            {isAr ? config.headlineAr : config.headlineEn}
          </h2>
          <p
            style={{
              fontSize: '0.8125rem',
              color: '#94A3B8',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {isAr ? config.subheadlineAr : config.subheadlineEn}
          </p>
        </div>

        {/* Special FXEngin Perks Banner (Gold Shimmer Box) */}
        {brokerPerks && (
          <div
            style={{
              position: 'relative',
              padding: '0.85rem 1rem',
              borderRadius: '0.875rem',
              background: 'linear-gradient(135deg, rgba(251, 135, 4, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%)',
              border: '1.5px solid rgba(251, 135, 4, 0.45)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '0.5rem',
                background: 'rgba(251, 135, 4, 0.2)',
                color: '#FB8704',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '0.1rem',
              }}
            >
              <IoFlameOutline size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#FB8704',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  marginBottom: '0.2rem',
                }}
              >
                {isAr ? 'امتيازات حصرية لمشتركي FXEngin' : 'Exclusive FXEngin Member Perks'}
              </div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: '#FEF08A',
                  lineHeight: 1.45,
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {brokerPerks}
              </p>

              {/* Coupon / Partner Code with One-Click Copy */}
              {activeBroker?.couponCode && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '0.375rem',
                    border: '1px dashed rgba(251, 135, 4, 0.5)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {isAr ? 'كود الشريك:' : 'Partner Code:'}
                  </span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#FB8704', fontFamily: 'monospace' }}>
                    {activeBroker.couponCode}
                  </span>
                  <button
                    onClick={(e) => handleCopyCoupon(activeBroker.couponCode, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copiedCoupon ? '#10B981' : '#E2E8F0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      fontSize: '0.6875rem',
                      padding: 0,
                    }}
                  >
                    {copiedCoupon ? <IoCheckmarkOutline size={14} /> : <IoCopyOutline size={14} />}
                    <span>{copiedCoupon ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Specs Highlights Grid (4 Key Features) */}
        {Array.isArray(activeBroker?.specs) && activeBroker.specs.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '0.625rem',
              marginBottom: '1.25rem',
            }}
          >
            {activeBroker.specs.slice(0, 4).map((spec, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '0.75rem',
                  padding: '0.625rem 0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                  {isAr ? spec.labelAr : spec.labelEn}
                </span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#E2E8F0', fontFamily: 'monospace' }}>
                  {isAr ? spec.valueAr : spec.valueEn}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {/* Primary CTA (Affiliate Live Account) */}
          <a
            href={activeBroker?.liveUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              width: '100%',
              padding: '0.95rem 1.5rem',
              borderRadius: '0.875rem',
              background: `linear-gradient(135deg, ${brokerThemeColor} 0%, ${accentColor} 100%)`,
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.9375rem',
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: `0 6px 25px ${brokerThemeColor}55`,
              transition: 'all 0.25s ease',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 30px ${glowBorder}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 20px ${glowBorder}`;
            }}
          >
            <span>{isAr ? config.ctaTextAr : config.ctaTextEn}</span>
            {isAr ? <IoArrowBackOutline size={18} /> : <IoArrowForwardOutline size={18} />}
          </a>

          {/* Secondary Button Row: Demo Account + Dismiss */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {activeBroker?.demoUrl && activeBroker.demoUrl !== '#' && (
              <a
                href={activeBroker.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#CBD5E1',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#CBD5E1';
                }}
              >
                <span>{isAr ? config.demoBtnTextAr : config.demoBtnTextEn}</span>
                <IoOpenOutline size={14} />
              </a>
            )}

            <button
              type="button"
              onClick={(e) => handleClose(e)}
              style={{
                flex: activeBroker?.demoUrl ? '0 0 auto' : 1,
                padding: '0.75rem 1.25rem',
                borderRadius: '0.75rem',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#64748B',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#94A3B8';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748B';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              {isAr ? 'تخطي الآن' : 'Dismiss'}
            </button>
          </div>
        </div>

        {/* Footer Navigation & Interval Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.6875rem',
            color: '#64748B',
          }}
        >
          {/* Active Partner Indicator */}
          <div>
            <span>
              {isAr ? 'شريك الوساطة' : 'Partner'}{' '}
              <strong style={{ color: '#94A3B8' }}>{activeBroker?.name}</strong> (
              {(currentBrokerIndex % brokersList.length) + 1} / {brokersList.length})
            </span>
          </div>

          {/* Quick Carousel Controls */}
          {config.mode === 'rotate' && brokersList.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={handlePrevBroker}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.375rem',
                  color: '#94A3B8',
                  padding: '0.2rem 0.4rem',
                  cursor: 'pointer',
                  fontSize: '0.6875rem',
                }}
              >
                {isAr ? 'السابق' : 'Prev'}
              </button>
              <button
                onClick={handleNextBroker}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.375rem',
                  color: '#94A3B8',
                  padding: '0.2rem 0.4rem',
                  cursor: 'pointer',
                  fontSize: '0.6875rem',
                }}
              >
                {isAr ? 'التالي' : 'Next'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
