'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  IoCloseOutline,
  IoStar,
  IoArrowForwardOutline,
  IoArrowBackOutline,
} from 'react-icons/io5';
import { useLanguage } from '../context/LanguageContext';
import { resolveBrokerThemeColor } from './BrokerPromoPopupModal';

const DEFAULT_BROKERS = [
  {
    id: 'hfm',
    name: 'HFM (HF Markets)',
    categoryLabelAr: 'وسيط عالمي رائد حائز على أكثر من 60 جائزة دولية',
    categoryLabelEn: 'Multi-Award Winning Global Broker (FCA, CySEC, DFSA)',
    badgeAr: 'شريك وساطة رسمي معتمد',
    badgeEn: 'Official Verified Partner',
    logo: '/assets/Images/brokers/hfm.webp',
    logoBg: '#000000',
    rating: 4.9,
    clientsCount: '3.5M+ حساب',
    clientsCountEn: '3.5M+ Accounts',
    accentColor: '#10B981',
    highlightAr: 'استرداد كاش باك حتى $2 لكل لوت + بونص تداول 20% ووصول كامل لجميع كورسات الأكاديمية',
    highlightEn: 'Up to $2/lot cashback rebate + 20% Top-Up bonus and full FXENGIN Academy access',
    liveUrl: 'https://www.hfm.com',
    demoUrl: 'https://www.hfm.com',
  },
  {
    id: 'xm',
    name: 'XM Global',
    categoryLabelAr: 'وسيط فوركس وعقود فروقات مرخص فئة أولى',
    categoryLabelEn: 'Multi-Regulated Tier-1 Global Broker',
    badgeAr: 'فئة أولى Tier-1',
    badgeEn: 'Tier-1 Regulated',
    logo: '/assets/Images/brokers/xm.webp',
    logoBg: '#000000',
    rating: 4.95,
    clientsCount: '10M+ متداول',
    clientsCountEn: '10M+ Traders',
    accentColor: '#10B981',
    highlightAr: 'بونص إيداع 100% حتى 500$ + حسابات إسلامية بدون فوائد',
    highlightEn: '100% Deposit Bonus up to $500 + Swap-Free Islamic Accounts',
    liveUrl: 'https://clicks.pipaffiliates.com/c?c=655286&l=ar&p=0',
    demoUrl: 'https://clicks.pipaffiliates.com/c?c=655286&l=ar&p=0',
  },
  {
    id: 'ywo',
    name: 'YWO Markets',
    categoryLabelAr: 'وسيط ECN بسبريد خام 0.0 نقطة',
    categoryLabelEn: 'Ultra-Low Raw ECN Spread Broker',
    badgeAr: 'سبريد خام 0.0',
    badgeEn: '0.0 Raw Spread',
    logo: '/assets/Images/brokers/ywo.webp',
    logoBg: '#02DA77',
    rating: 4.88,
    clientsCount: '150K+ متداول',
    clientsCountEn: '150K+ Traders',
    accentColor: '#00D06C',
    highlightAr: 'سبريد خام 0.0 نقطة لسكالبينج الذهب والعملات + رافعة 1:1000',
    highlightEn: '0.0 Raw Spreads for Gold & FX Scalping + 1:1000 Leverage',
    liveUrl: 'https://user.ywomarkets.com/register?referral=6058',
    demoUrl: 'https://user.ywomarkets.com/register?referral=6058',
  },
  {
    id: 'propxp',
    name: 'PropXP Funding',
    categoryLabelAr: 'تمويل حسابات حتى $200,000',
    categoryLabelEn: 'Funded Accounts up to $200,000',
    badgeAr: 'تقسيم أرباح 90%',
    badgeEn: '90% Profit Split',
    logo: '/assets/Images/brokers/propxp.webp',
    logoBg: '#F59E0B',
    rating: 4.92,
    clientsCount: '$12M+ سحوبات',
    clientsCountEn: '$12M+ Payouts',
    accentColor: '#F59E0B',
    highlightAr: 'كوبون خصم 20% (FXENGIN20) واسترداد 100% للرسوم',
    highlightEn: '20% Discount with (FXENGIN20) + 100% Fee Refund',
    liveUrl: 'https://propxp.com?aff=fxengin',
    demoUrl: 'https://propxp.com?aff=fxengin',
  },
  {
    id: 'multibank',
    name: 'MultiBank Group',
    categoryLabelAr: 'مجموعة مالية عالمية بـ 14+ ترخيصاً',
    categoryLabelEn: 'Global Conglomerate (14+ Regulations)',
    badgeAr: 'أمان مصرفي كامل',
    badgeEn: 'Bank-Grade Safety',
    logo: '/assets/Images/brokers/multibank.webp',
    logoBg: '#0284C7',
    rating: 4.86,
    clientsCount: '1M+ عميل',
    clientsCountEn: '1M+ Clients',
    accentColor: '#0EA5E9',
    highlightAr: 'سيولة مؤسسية عميقة وسبريد يبدأ من الصفر',
    highlightEn: 'Deep Institutional Liquidity & Zero Spreads',
    liveUrl: 'https://multibankfx.com/account/live-account?ib=fxengin',
    demoUrl: 'https://multibankfx.com/account/demo-account?ib=fxengin',
  },
];

export default function BrokerSidePopup() {
  const { isAr } = useLanguage();
  const pathname = usePathname();

  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [brokersList, setBrokersList] = useState(DEFAULT_BROKERS);
  const [currentBrokerIndex, setCurrentBrokerIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [progressPercent, setProgressPercent] = useState(100);

  const [config, setConfig] = useState({
    sidePopupEnabled: true,
    sidePopupIntervalSeconds: 45,
    sidePopupDurationSeconds: 12,
    sidePopupInitialDelaySeconds: 10,
    sidePopupPosition: 'bottom-left',
    sidePopupShowOnce: false,
    sidePopupMode: 'broker',
    sidePopupBrokerId: 'hfm',
    sidePopupBadgeAr: 'شريك وساطة رسمي معتمد',
    sidePopupBadgeEn: 'Official Verified Partner',
    sidePopupCustomTitleAr: 'HFM (HF Markets)',
    sidePopupCustomTitleEn: 'HFM (HF Markets)',
    sidePopupCustomSubtitleAr: 'وسيط عالمي رائد حائز على أكثر من 60 جائزة دولية',
    sidePopupCustomSubtitleEn: 'Multi-Award Winning Global Broker (FCA, CySEC, DFSA)',
    sidePopupRating: 4.9,
    sidePopupHighlightAr: 'استرداد كاش باك حتى $2 لكل لوت + بونص تداول 20% ووصول كامل لجميع كورسات الأكاديمية',
    sidePopupHighlightEn: 'Up to $2/lot cashback rebate + 20% Top-Up bonus and full FXENGIN Academy access',
    sidePopupLiveBtnTextAr: 'فتح حساب مباشر',
    sidePopupLiveBtnTextEn: 'Open Live Account',
    sidePopupLiveUrl: '',
    sidePopupShowDemo: true,
    sidePopupDemoBtnTextAr: 'تجريبي',
    sidePopupDemoBtnTextEn: 'Demo',
    sidePopupDemoUrl: '',
    sidePopupAccentColor: '#10B981',
    sidePopupCustomLogo: '',
  });

  const isClosingRef = useRef(false);
  const isVisibleRef = useRef(isVisible);
  const isExitingRef = useRef(isExiting);
  const isHoveredRef = useRef(isHovered);
  const configRef = useRef(config);
  const pathnameRef = useRef(pathname);
  const brokersListRef = useRef(brokersList);
  const durationTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const exitTimeoutRef = useRef(null);
  const remainingMsRef = useRef(12000);
  const totalDurationMsRef = useRef(12000);

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  useEffect(() => {
    isExitingRef.current = isExiting;
  }, [isExiting]);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    brokersListRef.current = brokersList;
  }, [brokersList]);

  // Load config from API
  const loadConfig = useCallback(async () => {
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
          const merged = json.brokers.map((b) => {
            const match = DEFAULT_BROKERS.find(
              (d) => d.id === b.id || d.name?.toLowerCase() === b.name?.toLowerCase()
            );
            return {
              ...match,
              ...b,
              logo: b.logo || b.logoUrl || match?.logo || '/assets/Images/brokers/hfm.webp',
              highlightAr: b.fxenginPerksAr || b.perksAr || match?.highlightAr || '',
              highlightEn: b.fxenginPerksEn || b.perksEn || match?.highlightEn || '',
              liveUrl: b.liveUrl || match?.liveUrl || '#',
              demoUrl: b.demoUrl || match?.demoUrl || '#',
            };
          });
          setBrokersList(merged);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadConfig();
    const handleFocus = () => loadConfig();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadConfig]);

  // Active Content & Broker Resolution from Dashboard Settings
  const activeContent = useMemo(() => {
    const list = brokersList && brokersList.length > 0 ? brokersList : DEFAULT_BROKERS;
    const mode = config.sidePopupMode || 'cards';
    const brokerId = config.sidePopupBrokerId || config.selectedBrokerId || 'hfm';

    // 0. Multi-Popup Cards Mode (Default when cards are configured)
    const activeCards = Array.isArray(config.popupCards)
      ? config.popupCards.filter((c) => c.isActive !== false)
      : [];

    if (activeCards.length > 0 && (mode === 'cards' || mode === 'rotate' || !mode || mode === 'broker')) {
      const currentCard = activeCards[currentBrokerIndex % activeCards.length];
      if (currentCard) {
        const brokerMatch = list.find((b) => b.id === currentCard.brokerId || b.brokerSlug === currentCard.brokerId) || list[0];
        const accent = currentCard.accentColor || brokerMatch?.accentColor || '#10B981';
        return {
          id: currentCard.id || `card_${currentBrokerIndex}`,
          brokerId: currentCard.brokerId || brokerMatch?.id,
          name: isAr ? (currentCard.titleAr || brokerMatch?.name) : (currentCard.titleEn || currentCard.titleAr || brokerMatch?.name),
          categoryLabelAr: currentCard.subtitleAr || brokerMatch?.categoryLabelAr || '',
          categoryLabelEn: currentCard.subtitleEn || brokerMatch?.categoryLabelEn || '',
          badgeAr: currentCard.badgeAr || brokerMatch?.badgeAr || 'شريك وساطة رسمي معتمد',
          badgeEn: currentCard.badgeEn || brokerMatch?.badgeEn || 'Official Verified Partner',
          rating: Number(currentCard.rating) || brokerMatch?.rating || 4.9,
          highlightAr: currentCard.highlightAr || brokerMatch?.fxenginPerksAr || brokerMatch?.highlightAr || '',
          highlightEn: currentCard.highlightEn || brokerMatch?.fxenginPerksEn || brokerMatch?.highlightEn || '',
          liveUrl: currentCard.liveUrl || brokerMatch?.liveUrl || '#',
          demoUrl: currentCard.demoUrl || brokerMatch?.demoUrl || '',
          showDemo: currentCard.showDemo !== false && Boolean(currentCard.demoUrl && currentCard.demoUrl !== '#'),
          liveBtnTextAr: currentCard.liveBtnTextAr || 'فتح حساب مباشر',
          liveBtnTextEn: currentCard.liveBtnTextEn || 'Open Live Account',
          demoBtnTextAr: currentCard.demoBtnTextAr || 'تجريبي',
          demoBtnTextEn: currentCard.demoBtnTextEn || 'Demo',
          logo: currentCard.customLogo || brokerMatch?.logo || '/assets/Images/brokers/hfm.webp',
          logoBg: brokerMatch?.logoBg || '#000000',
          accentColor: accent,
          themeColor: accent,
          durationSeconds: Number(currentCard.durationSeconds) > 0 ? Number(currentCard.durationSeconds) : (Number(config.sidePopupDurationSeconds) || 12),
        };
      }
    }

    // 1. Fully Custom Mode
    if (mode === 'custom') {
      const accent = config.sidePopupAccentColor || '#10B981';
      return {
        id: 'custom',
        name: isAr ? (config.sidePopupCustomTitleAr || 'شريك معتمد') : (config.sidePopupCustomTitleEn || config.sidePopupCustomTitleAr || 'Verified Partner'),
        categoryLabelAr: config.sidePopupCustomSubtitleAr || 'شريك تداول رسمي معتمد لـ FXEngin',
        categoryLabelEn: config.sidePopupCustomSubtitleEn || 'FXEngin Verified Official Partner',
        badgeAr: config.sidePopupBadgeAr || 'شريك وساطة رسمي معتمد',
        badgeEn: config.sidePopupBadgeEn || 'Official Verified Partner',
        rating: Number(config.sidePopupRating) || 4.9,
        highlightAr: config.sidePopupHighlightAr || 'استرداد كاش باك حتى $2 لكل لوت + بونص تداول 20% ووصول كامل لجميع كورسات الأكاديمية',
        highlightEn: config.sidePopupHighlightEn || 'Up to $2/lot cashback rebate + 20% Top-Up bonus and full FXENGIN Academy access',
        liveUrl: config.sidePopupLiveUrl || '#',
        demoUrl: config.sidePopupDemoUrl || '',
        showDemo: config.sidePopupShowDemo !== false && Boolean(config.sidePopupDemoUrl),
        liveBtnTextAr: config.sidePopupLiveBtnTextAr || 'فتح حساب مباشر',
        liveBtnTextEn: config.sidePopupLiveBtnTextEn || 'Open Live Account',
        demoBtnTextAr: config.sidePopupDemoBtnTextAr || 'تجريبي',
        demoBtnTextEn: config.sidePopupDemoBtnTextEn || 'Demo',
        logo: config.sidePopupCustomLogo || '/assets/Images/brokers/hfm.webp',
        logoBg: '#000000',
        accentColor: accent,
        themeColor: accent,
      };
    }

    // 2. Specific Broker or Rotating Broker (Fallback)
    let targetBroker = null;
    if (mode === 'rotate') {
      targetBroker = list[currentBrokerIndex % list.length] || list[0];
    } else {
      targetBroker = list.find((b) => b.id === brokerId || b.brokerSlug === brokerId) || list.find((b) => b.id === 'hfm') || list[0];
    }

    const themeCol = resolveBrokerThemeColor(targetBroker);
    const accent = config.sidePopupAccentColor || targetBroker.accentColor || themeCol;

    // Use broker properties with optional admin dashboard overrides
    const isBrokerMode = mode === 'broker';
    const brokerName = isBrokerMode && config.sidePopupCustomTitleAr ? (isAr ? config.sidePopupCustomTitleAr : (config.sidePopupCustomTitleEn || config.sidePopupCustomTitleAr)) : targetBroker.name;
    const catAr = isBrokerMode && config.sidePopupCustomSubtitleAr ? config.sidePopupCustomSubtitleAr : (targetBroker.categoryLabelAr || '');
    const catEn = isBrokerMode && config.sidePopupCustomSubtitleEn ? config.sidePopupCustomSubtitleEn : (targetBroker.categoryLabelEn || '');
    const badgeAr = config.sidePopupBadgeAr || targetBroker.badgeAr || 'شريك وساطة رسمي معتمد';
    const badgeEn = config.sidePopupBadgeEn || targetBroker.badgeEn || 'Official Verified Partner';
    const ratingVal = isBrokerMode && config.sidePopupRating !== undefined && config.sidePopupRating !== null && String(config.sidePopupRating).trim() !== '' ? Number(config.sidePopupRating) : (targetBroker.rating || 4.9);
    const highlightAr = isBrokerMode && config.sidePopupHighlightAr ? config.sidePopupHighlightAr : (targetBroker.highlightAr || targetBroker.fxenginPerksAr || '');
    const highlightEn = isBrokerMode && config.sidePopupHighlightEn ? config.sidePopupHighlightEn : (targetBroker.highlightEn || targetBroker.fxenginPerksEn || '');
    const liveLink = config.sidePopupLiveUrl || targetBroker.liveUrl || '#';
    const demoLink = config.sidePopupDemoUrl || targetBroker.demoUrl || '';
    const showDemo = config.sidePopupShowDemo !== false && Boolean(demoLink && demoLink !== '#');
    const logoImg = config.sidePopupCustomLogo || targetBroker.logo || '/assets/Images/brokers/hfm.webp';

    return {
      ...targetBroker,
      name: brokerName,
      categoryLabelAr: catAr,
      categoryLabelEn: catEn,
      badgeAr,
      badgeEn,
      rating: ratingVal,
      highlightAr,
      highlightEn,
      liveUrl: liveLink,
      demoUrl: demoLink,
      showDemo,
      liveBtnTextAr: config.sidePopupLiveBtnTextAr || 'فتح حساب مباشر',
      liveBtnTextEn: config.sidePopupLiveBtnTextEn || 'Open Live Account',
      demoBtnTextAr: config.sidePopupDemoBtnTextAr || 'تجريبي',
      demoBtnTextEn: config.sidePopupDemoBtnTextEn || 'Demo',
      logo: logoImg,
      accentColor: accent,
      themeColor: themeCol,
    };
  }, [brokersList, config, currentBrokerIndex, isAr]);

  // Smooth Toast Exit Function
  const closeSidePopup = useCallback((e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (isClosingRef.current || isExitingRef.current) return;

    isClosingRef.current = true;
    setIsExiting(true);

    // Stop active timer intervals
    if (durationTimerRef.current) clearTimeout(durationTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('fx_side_popup_last_shown', String(Date.now()));
      if (configRef.current?.sidePopupShowOnce) {
        sessionStorage.setItem('fx_side_popup_seen', 'true');
        localStorage.setItem('fx_side_popup_seen', 'true');
      }
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('preview_side_popup')) {
          url.searchParams.delete('preview_side_popup');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
      } catch {}
    }

    // Wait for smooth toast exit animation to complete (400ms)
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    exitTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      isVisibleRef.current = false;
      isClosingRef.current = false;
    }, 400);
  }, []);

  // Duration countdown and progress bar handler (pauses smoothly on hover)
  const startDurationTimer = useCallback((durationSec) => {
    if (durationTimerRef.current) clearTimeout(durationTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    if (!durationSec || durationSec <= 0) {
      // 0 means permanent until user manually closes
      setProgressPercent(100);
      return;
    }

    const totalMs = durationSec * 1000;
    totalDurationMsRef.current = totalMs;
    remainingMsRef.current = totalMs;
    setProgressPercent(100);

    const stepMs = 50;
    progressIntervalRef.current = setInterval(() => {
      // Pause countdown while mouse hovers over the toast notification
      if (isHoveredRef.current) return;

      remainingMsRef.current -= stepMs;
      if (remainingMsRef.current <= 0) {
        clearInterval(progressIntervalRef.current);
        closeSidePopup();
      } else {
        const pct = Math.max(0, (remainingMsRef.current / totalDurationMsRef.current) * 100);
        setProgressPercent(pct);
      }
    }, stepMs);
  }, [closeSidePopup]);

  // Smooth Toast Entrance
  const openSidePopup = useCallback((customDuration) => {
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    const currentCfg = configRef.current;
    const activeCards = (currentCfg?.popupCards || []).filter((c) => c.isActive !== false);
    const currentCard = activeCards.length > 0 ? activeCards[currentBrokerIndex % activeCards.length] : null;
    const durationSec = typeof customDuration === 'number'
      ? customDuration
      : (currentCard?.durationSeconds ? Number(currentCard.durationSeconds) : (Math.max(0, Number(currentCfg?.sidePopupDurationSeconds) ?? 12)));
    isClosingRef.current = false;
    setIsExiting(false);
    setIsVisible(true);
    isVisibleRef.current = true;
    startDurationTimer(durationSec);
  }, [currentBrokerIndex, startDurationTimer]);

  // Direct test preview via URL (?preview_side_popup=true) or custom event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('preview_side_popup') === 'true') {
        sessionStorage.removeItem('fx_side_popup_seen');
        localStorage.removeItem('fx_side_popup_seen');
        openSidePopup();
      }
    } catch {}

    const handleCustomOpen = () => {
      sessionStorage.removeItem('fx_side_popup_seen');
      localStorage.removeItem('fx_side_popup_seen');
      openSidePopup();
    };
    window.addEventListener('fx-open-side-popup', handleCustomOpen);
    return () => window.removeEventListener('fx-open-side-popup', handleCustomOpen);
  }, [openSidePopup]);

  // Heartbeat Timer for Side Toast Popup Frequency (يظهر كل أد إيه)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const STORAGE_SESSION_START = 'fx_side_popup_session_start';
    const STORAGE_LAST_SHOWN = 'fx_side_popup_last_shown';
    const STORAGE_SEEN = 'fx_side_popup_seen';

    if (!sessionStorage.getItem(STORAGE_SESSION_START)) {
      sessionStorage.setItem(STORAGE_SESSION_START, String(Date.now()));
    }

    const checkAndTrigger = () => {
      const currentCfg = configRef.current;
      if (!currentCfg || currentCfg.sidePopupEnabled === false) return;
      if (isVisibleRef.current || isClosingRef.current || isExitingRef.current) return;

      if (currentCfg.sidePopupShowOnce) {
        const seen =
          sessionStorage.getItem(STORAGE_SEEN) === 'true' ||
          localStorage.getItem(STORAGE_SEEN) === 'true';
        if (seen) return;
      }

      const currentPath = pathnameRef.current || '';
      if (
        currentPath.includes('/checkout') ||
        currentPath.includes('/login') ||
        currentPath.includes('/register') ||
        currentPath.includes('/forgot-password')
      ) {
        return;
      }

      const now = Date.now();
      const intervalSec = Math.max(5, Number(currentCfg.sidePopupIntervalSeconds) || 45);
      const initialDelaySec = Math.max(1, Number(currentCfg.sidePopupInitialDelaySeconds) || 10);

      const lastShownStr = sessionStorage.getItem(STORAGE_LAST_SHOWN);
      let shouldOpen = false;

      if (!lastShownStr) {
        const sessionStart = Number(sessionStorage.getItem(STORAGE_SESSION_START) || now);
        if ((now - sessionStart) / 1000 >= initialDelaySec) {
          shouldOpen = true;
        }
      } else {
        const lastShownTime = Number(lastShownStr);
        if ((now - lastShownTime) / 1000 >= intervalSec) {
          shouldOpen = true;
        }
      }

      if (shouldOpen) {
        sessionStorage.setItem(STORAGE_LAST_SHOWN, String(now));
        const activeCards = (configRef.current?.popupCards || []).filter((c) => c.isActive !== false);
        const totalItems = activeCards.length > 0 ? activeCards.length : (brokersListRef.current?.length || 1);
        setCurrentBrokerIndex((prevIdx) => (prevIdx + 1) % totalItems);
        openSidePopup();
      }
    };

    checkAndTrigger();
    const intervalId = setInterval(checkAndTrigger, 1000);
    return () => clearInterval(intervalId);
  }, [openSidePopup]);

  if (!isVisible && !isExiting) return null;

  const brokerThemeColor = activeContent.themeColor || resolveBrokerThemeColor(activeContent);
  const accentColor = activeContent.accentColor || brokerThemeColor;
  const position = config.sidePopupPosition || 'bottom-left';
  const isLeft = position === 'bottom-left';

  return (
    <aside
      role="complementary"
      aria-label="Broker Partner Special Offer Toast"
      onMouseEnter={() => {
        setIsHovered(true);
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        isHoveredRef.current = false;
      }}
      style={{
        position: 'fixed',
        zIndex: 9999,
        bottom: '1.25rem',
        ...(isLeft ? { left: '1.25rem' } : { right: '1.25rem' }),
        width: 'calc(100% - 2.5rem)',
        maxWidth: '24rem',
        borderRadius: '1rem',
        background: `radial-gradient(ellipse 90% 70% at 50% -10%, ${brokerThemeColor}35 0%, transparent 80%), linear-gradient(150deg, ${brokerThemeColor}20 0%, #06121f 50%, #02070f 100%)`,
        border: `1.5px solid ${brokerThemeColor}`,
        boxShadow: `0 20px 48px -8px rgba(0, 0, 0, 0.9), 0 0 32px ${brokerThemeColor}40`,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        color: '#FFFFFF',
        direction: isAr ? 'rtl' : 'ltr',
        overflow: 'hidden',
        willChange: 'transform, opacity, filter',
        opacity: isExiting ? 0 : 1,
        transform: isExiting
          ? isLeft
            ? 'translateY(45px) translateX(-60px) scale(0.85)'
            : 'translateY(45px) translateX(60px) scale(0.85)'
          : isHovered
            ? 'translateY(-2px)'
            : 'translateY(0) translateX(0) scale(1)',
        filter: isExiting ? 'blur(10px)' : 'none',
        pointerEvents: isExiting ? 'none' : 'auto',
        transition: isExiting
          ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease'
          : isHovered
            ? 'transform 0.2s ease, box-shadow 0.2s ease'
            : 'box-shadow 0.2s ease',
        animation: isExiting
          ? isLeft
            ? 'fxToastBounceOutLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            : 'fxToastBounceOutRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          : isLeft
            ? 'fxToastBounceInLeft 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            : 'fxToastBounceInRight 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fxToastBounceInLeft {
          0% {
            opacity: 0;
            transform: translateY(40px) translateX(-35px) scale(0.88);
            filter: blur(8px);
          }
          60% {
            opacity: 1;
            transform: translateY(-5px) translateX(4px) scale(1.02);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1);
            filter: blur(0px);
          }
        }
        @keyframes fxToastBounceOutLeft {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1);
            filter: blur(0px);
          }
          20% {
            opacity: 1;
            transform: translateY(-6px) translateX(4px) scale(1.02);
            filter: blur(0px);
          }
          100% {
            opacity: 0;
            transform: translateY(45px) translateX(-60px) scale(0.85);
            filter: blur(10px);
          }
        }
        @keyframes fxToastBounceInRight {
          0% {
            opacity: 0;
            transform: translateY(40px) translateX(35px) scale(0.88);
            filter: blur(8px);
          }
          60% {
            opacity: 1;
            transform: translateY(-5px) translateX(-4px) scale(1.02);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1);
            filter: blur(0px);
          }
        }
        @keyframes fxToastBounceOutRight {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1);
            filter: blur(0px);
          }
          20% {
            opacity: 1;
            transform: translateY(-6px) translateX(-4px) scale(1.02);
            filter: blur(0px);
          }
          100% {
            opacity: 0;
            transform: translateY(45px) translateX(60px) scale(0.85);
            filter: blur(10px);
          }
        }
        @keyframes fxPulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.55; }
        }
      `,
        }}
      />

      {/* Top Bar with Live Indicator & Dismiss Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 0.85rem 0.35rem 0.85rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.6875rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: brokerThemeColor,
              display: 'inline-block',
              animation: 'fxPulseDot 1.8s infinite ease-in-out',
              boxShadow: `0 0 8px ${brokerThemeColor}`,
            }}
          />
          <span style={{ fontWeight: 800, color: brokerThemeColor, letterSpacing: '0.02em' }}>
            {isAr ? (activeContent.badgeAr || 'شريك وساطة رسمي معتمد') : (activeContent.badgeEn || 'Official Verified Partner')}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => closeSidePopup(e)}
          onPointerDown={(e) => {
            e.stopPropagation();
            closeSidePopup(e);
          }}
          aria-label={isAr ? 'إغلاق الإشعار' : 'Close'}
          title={isAr ? 'إغلاق' : 'Close'}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#CBD5E1',
            cursor: 'pointer',
            width: '26px',
            height: '26px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.18s ease',
            zIndex: 20,
            touchAction: 'manipulation',
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.35)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#CBD5E1';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <IoCloseOutline size={19} />
        </button>
      </div>

      {/* Main Toast Content Body */}
      <div style={{ padding: '0.75rem 0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
          {/* Logo Box */}
          <div
            style={{
              position: 'relative',
              width: '3.1rem',
              height: '3.1rem',
              borderRadius: '0.65rem',
              overflow: 'hidden',
              background: activeContent.logoBg || '#000000',
              border: `1.5px solid ${brokerThemeColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              padding: '0.25rem',
            }}
          >
            <Image
              src={activeContent.logo || '/assets/Images/brokers/hfm.webp'}
              alt={activeContent.name || 'Broker Partner'}
              width={48}
              height={48}
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
              unoptimized
            />
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
              <h4
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeContent.name}
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: '#F59E0B', fontSize: '0.7rem' }}>
                <IoStar size={11} />
                <span style={{ fontWeight: 700 }}>{activeContent.rating || 4.9}</span>
              </div>
            </div>

            <p
              style={{
                fontSize: '0.725rem',
                color: '#94A3B8',
                margin: '0.15rem 0 0 0',
                lineHeight: 1.35,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {isAr ? activeContent.categoryLabelAr : activeContent.categoryLabelEn}
            </p>
          </div>
        </div>

        {/* Highlight Perks Text Box */}
        {(activeContent.highlightAr || activeContent.highlightEn) && (
          <div
            style={{
              padding: '0.45rem 0.65rem',
              borderRadius: '0.5rem',
              background: 'rgba(0, 0, 0, 0.35)',
              border: `1px dashed ${brokerThemeColor}60`,
              marginBottom: '0.65rem',
            }}
          >
            <p
              style={{
                fontSize: '0.725rem',
                color: '#F1F5F9',
                margin: 0,
                lineHeight: 1.4,
                fontWeight: 600,
              }}
            >
              {isAr ? activeContent.highlightAr : activeContent.highlightEn}
            </p>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a
            href={activeContent.liveUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeSidePopup}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.55rem 0.85rem',
              borderRadius: '0.55rem',
              background: `linear-gradient(135deg, ${brokerThemeColor} 0%, ${accentColor} 100%)`,
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.775rem',
              textDecoration: 'none',
              boxShadow: `0 4px 14px ${brokerThemeColor}50`,
              transition: 'transform 0.15s ease, filter 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            <span>{isAr ? (activeContent.liveBtnTextAr || 'فتح حساب مباشر') : (activeContent.liveBtnTextEn || 'Open Live Account')}</span>
            {isAr ? <IoArrowBackOutline size={13} /> : <IoArrowForwardOutline size={13} />}
          </a>

          {activeContent.showDemo && activeContent.demoUrl && activeContent.demoUrl !== '#' && (
            <a
              href={activeContent.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeSidePopup}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                padding: '0.55rem 0.75rem',
                borderRadius: '0.55rem',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#CBD5E1',
                fontWeight: 600,
                fontSize: '0.725rem',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#CBD5E1';
              }}
            >
              <span>{isAr ? (activeContent.demoBtnTextAr || 'تجريبي') : (activeContent.demoBtnTextEn || 'Demo')}</span>
            </a>
          )}
        </div>
      </div>

      {/* Bottom Progress Countdown Bar */}
      {Number(config.sidePopupDurationSeconds) > 0 && (
        <div
          style={{
            height: '3px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
          }}
          title={isHovered ? (isAr ? 'تم إيقاف العداد مؤقتاً لتمرير الماوس' : 'Paused on hover') : ''}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, ${brokerThemeColor}, ${accentColor})`,
              transition: isHovered ? 'none' : 'width 0.05s linear',
            }}
          />
        </div>
      )}
    </aside>
  );
}
