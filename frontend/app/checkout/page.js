'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FiShield,
  FiLock,
  FiCheckCircle,
  FiCreditCard,
  FiCopy,
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiSend,
  FiAward,
  FiZap,
  FiKey,
  FiHeadphones,
  FiMail,
  FiClock,
  FiPhone,
  FiAlertCircle,
  FiPlayCircle,
} from 'react-icons/fi';
import { FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePageLoading } from '../context/LoadingContext';
import { getAppRoute } from '../utils/routes';
import { showToast } from '../utils/toast';
import { ANALYSIS_PACKAGES } from '../analyses/analysesData';
import { getSymbolInfo } from '../services/analystService';
import { apiFetch } from '../services/apiClient';
import { updateUserProfile } from '../services/authService';
import { getCoursePricing, isUserEnrolledInCourse } from '../utils/coursePricing';
import { fetchCourseBySlug } from '../services/coursesService';

/* Main Content Component consuming SearchParams */
function CheckoutContent() {
  const router = useRouter();
  const { isAr } = useLanguage();
  const { user, isAuthenticated, loading: authLoading, enrollUserCourse, refetchUser } = useAuth();
  const searchParams = useSearchParams();

  const [authTimedOut, setAuthTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAuthTimedOut(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Keep global brand PageLoader visible ONLY while user is not yet loaded and auth is actively resolving
  usePageLoading(!user && authLoading, 'checkout_auth');

  const type = searchParams.get('type') || 'package'; // 'package' | 'analysis' | 'course' | 'live'
  const packageKey = searchParams.get('package') || 'gold';
  const itemId = searchParams.get('id');

  // Enforce Login: If user is not authenticated, redirect to /login with redirect URL
  useEffect(() => {
    if ((!authLoading || authTimedOut) && !user && !isAuthenticated) {
      if (typeof window !== 'undefined') {
        const fullCurrentPath = window.location.pathname + window.location.search;
        showToast.info(isAr ? 'يرجى تسجيل الدخول أولاً لإتمام الاشتراك' : 'Please sign in first to complete your subscription');
        router.replace(`/login?redirect=${encodeURIComponent(fullCurrentPath)}`);
      }
    }
  }, [authLoading, authTimedOut, user, isAuthenticated, isAr, router]);

  const [liveSessionData, setLiveSessionData] = useState(null);
  const [dbPlanData, setDbPlanData] = useState(null);
  const [dbCourseData, setDbCourseData] = useState(null);
  const [isCourseLoading, setIsCourseLoading] = useState(type === 'course');
  const [generatedAccessCode, setGeneratedAccessCode] = useState('');
  const [copiedTicketCode, setCopiedTicketCode] = useState(false);

  useEffect(() => {
    if (type === 'course' && itemId) {
      setIsCourseLoading(true);
      fetchCourseBySlug(itemId)
        .then((res) => {
          if (res?.success && res?.data) {
            setDbCourseData(res.data);
          }
        })
        .catch((e) => console.warn('Checkout course fetch error:', e))
        .finally(() => setIsCourseLoading(false));
    } else {
      setIsCourseLoading(false);
    }
  }, [type, itemId]);

  useEffect(() => {
    if (type === 'live' && itemId) {
      import('../services/liveService').then(({ fetchLiveRoom }) => {
        fetchLiveRoom(itemId).then((res) => {
          if (res.success && res.session) {
            setLiveSessionData(res.session);
          }
        }).catch(() => {});
      });
    }
  }, [type, itemId]);

  useEffect(() => {
    if (type === 'package' && packageKey) {
      fetch('/api/subscriptions/plans')
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((res) => {
          const list = Array.isArray(res) ? res : (res?.data || []);
          const match = list.find((p) => p.slug === packageKey || p.id === packageKey);
          if (match) {
            setDbPlanData(match);
          }
        })
        .catch(() => {});
    }
  }, [type, packageKey]);

  // Resolve Product Data
  const product = useMemo(() => {
    if (type === 'live') {
      const title = liveSessionData?.title || 'كورس التداول المباشر وغرفة البث الحي';
      const instructor = liveSessionData?.instructorName || 'كبير المحللين الماليين';
      const price = liveSessionData?.price !== undefined ? Number(liveSessionData.price) : 99;
      const currency = liveSessionData?.currency || 'USDT';

      return {
        kind: 'live',
        titleAr: title,
        titleEn: title,
        subtitleAr: `كورس تدريبي حي على الهواء • المحاضر: ${instructor} • يشمل كود دخول فريد`,
        subtitleEn: `Live Trading Masterclass • Instructor: ${instructor} • Includes Unique Passcode`,
        priceVal: price,
        priceStr: `${price} ${currency}`,
        currency,
        badgeAr: 'كورس بث مباشر (مدفوع)',
        badgeEn: 'Live Masterclass Pass',
        badgeColor: '#FB8704',
        perksAr: [
          'توليد كود دخول فريد ومؤمن خاص بك فور إتمام الدفع مباشرة',
          'حضور جلسة البث المباشر التفاعلية بجودة فائقة وخالية من التقطيع',
          'طرح الأسئلة ومشاركة التحليلات في الشات المباشر مع المحاضر',
          'الحصول على التسجيل الكامل للمحاضرة للرجوع إليه في أي وقت',
        ],
        perksEn: [
          'Instant generation of your unique, tamper-proof room passcode',
          'Interactive live stream access with low-latency ultra-clear HD feed',
          'Live chat privileges and direct Q&A interaction with instructor',
          'Full on-demand replay access to review setups anytime',
        ],
        redirectUrl: generatedAccessCode
          ? `/live/${itemId}?code=${encodeURIComponent(generatedAccessCode)}`
          : `/live/${itemId}`,
        ctaLabelAr: 'دخول قاعة البث المباشر الآن',
        ctaLabelEn: 'Enter Live Classroom Now',
      };
    }
    if (type === 'course') {
      const pricing = getCoursePricing(dbCourseData, 'usdt');
      const title = dbCourseData ? dbCourseData.title : 'كورس تدريبي معتمد';
      const cSlug = dbCourseData?.slug || itemId;
      const subtitleAr = dbCourseData?.subtitle || (dbCourseData?.totalDurationMinutes ? `كورس تدريبي متخصص • ${Math.round(dbCourseData.totalDurationMinutes / 60)} ساعة تدريبية` : 'كورس تدريبي متخصص');
      const subtitleEn = dbCourseData?.subtitle || (dbCourseData?.totalDurationMinutes ? `Professional Masterclass • ${Math.round(dbCourseData.totalDurationMinutes / 60)} Hours` : 'Professional Masterclass');
      return {
        kind: 'course',
        courseId: dbCourseData?.id || itemId,
        slug: cSlug,
        titleAr: title,
        titleEn: title,
        subtitleAr: subtitleAr,
        subtitleEn: subtitleEn,
        priceVal: pricing.currentPrice,
        originalPriceVal: pricing.originalPrice,
        hasDiscount: pricing.hasDiscount,
        discountPercent: pricing.discountPercent,
        priceStr: pricing.isFree ? 'مجاني' : `${pricing.currentPrice} USDT`,
        originalPriceStr: pricing.originalPriceStr,
        isFree: pricing.isFree,
        badgeAr: 'كورس تدريبي',
        badgeEn: 'Course Pass',
        badgeColor: 'var(--primary)',
        perksAr: [
          'وصول غير محدود مدى الحياة لكافة دروس الكورس',
          'تحميل ملفات العمل ومؤشرات التحليل الفني المرفقة',
          'شهادة إتمام معتمدة بعد إنهاء الاختبار النهائي',
          'انضمام لمجتمع المتدربين المغلق على تيليجرام',
        ],
        perksEn: [
          'Lifetime unlimited access to all course modules',
          'Downloadable worksheets & custom MT4/TradingView indicators',
          'Accredited Certificate of Completion upon finishing',
          'Private student community Discord & Telegram access',
        ],
        redirectUrl: `/courses/${cSlug}/learn`,
        ctaLabelAr: 'ابدأ مشاهدة الكورس الآن',
        ctaLabelEn: 'Start Course Now',
      };
    }

    if (type === 'analysis') {
      const symInfo = getSymbolInfo(itemId || 'XAUUSD');
      const pkg = ANALYSIS_PACKAGES.find((p) => p.id === packageKey) || ANALYSIS_PACKAGES[0];
      return {
        kind: 'analysis',
        titleAr: `${symInfo.pair} — ${pkg.nameAr}`,
        titleEn: `${symInfo.pair} — ${pkg.nameEn}`,
        subtitleAr: `تحليل فني وهيكلي وإشارات لحظية مباشرة (${symInfo.pair})`,
        subtitleEn: `Institutional technical analysis & live signal triggers (${symInfo.pair})`,
        priceVal: pkg.priceVal || 49,
        priceStr: `${pkg.priceVal || 49} USDT`,
        badgeAr: pkg.nameAr,
        badgeEn: pkg.nameEn,
        badgeColor: pkg.color || '#FB8704',
        perksAr: [
          'فتح التحليل الفني ومصفوفة نقاط الدخول والأهداف ووقف الخسارة',
          'اشتراك لمدة 30 يوماً في قناة تيليجرام VIP للإشارات اللحظية',
          'تنبيهات فورية عند وصول السعر للهدف الأول وتأمين الأرباح',
          'إدارة وقف الخسارة المتحرك (Trailing Stop Management)',
        ],
        perksEn: [
          'Full technical setup breakdown with entry, SL, and TP matrix',
          '30-day VIP Telegram access with real-time execution alerts',
          'Automated breakeven & trailing stop guidance',
          'Live institutional sentiment updates',
        ],
        redirectUrl: `/analyses/${symInfo.symbol}`,
        ctaLabelAr: 'عرض التحليل المفتوح الآن',
        ctaLabelEn: 'View Unlocked Analysis',
      };
    }

    if (type === 'webinar') {
      return {
        kind: 'webinar',
        titleAr: 'محاضرة البث المباشر التفاعلية: أسرار قراءة السيولة البنكية ومناطق العرض والطلب',
        titleEn: 'Live Masterclass: Institutional Liquidity & Advanced Supply/Demand',
        subtitleAr: 'محاضرة تفاعلية خاصة مغلقة عبر Zoom مع خبير الأسواق د. كريم الشناوي • غير مجانية (تذكرة VIP)',
        subtitleEn: 'Exclusive Closed Interactive Masterclass via Zoom with Dr. Karim • Paid VIP Ticket',
        priceVal: 49,
        priceStr: '49 USDT',
        badgeAr: 'محاضرة VIP مباشرة (مدفوعة)',
        badgeEn: 'VIP Paid Masterclass',
        badgeColor: '#FB8704',
        perksAr: [
          'حضور الجلسة المباشرة التفاعلية عبر Zoom بجودة 4K/HD مع إمكانية التحدث وطرح الأسئلة',
          'مراجعة حية لصفقاتك واستفساراتك الفنية مباشرة مع المحاضر د. كريم الشناوي',
          'الحصول على التسجيل الكامل للمحاضرة فيديو عالي الدقة لمشاهدته في أي وقت مدى الحياة',
          'تحميل قالب مؤشرات رصد السيولة البنكية المطور حصرياً لمنصتي TradingView و MT5',
        ],
        perksEn: [
          'Interactive live Zoom HD access with open mic Q&A and live trade setup reviews',
          'Direct Q&A with Senior Strategist Dr. Karim to analyze your current setups',
          'Lifetime on-demand access to the full unedited video recording of the webinar',
          'Downloadable proprietary institutional liquidity templates for MT5 & TradingView',
        ],
        redirectUrl: '/?webinar_booked=true',
        ctaLabelAr: 'تأكيد حجز التذكرة والعودة للمنصة',
        ctaLabelEn: 'Confirm Ticket & Return',
      };
    }

    // Default: VIP Package (Dynamic from DB / Seeded Plans)
    const pkg = ANALYSIS_PACKAGES.find((p) => p.id === packageKey) || ANALYSIS_PACKAGES[1];

    let nameAr = pkg.nameAr;
    let nameEn = pkg.nameEn;
    if (dbPlanData?.name) {
      if (typeof dbPlanData.name === 'string' && dbPlanData.name.includes(':::')) {
        const [ar, en] = dbPlanData.name.split(':::').map((s) => s.trim());
        nameAr = ar || pkg.nameAr;
        nameEn = en || pkg.nameEn || ar;
      } else {
        nameAr = dbPlanData.name;
        nameEn = pkg.nameEn || dbPlanData.name;
      }
    }

    let badgeAr = pkg.badgeAr;
    let badgeEn = pkg.badgeEn;
    if (dbPlanData?.badge) {
      if (typeof dbPlanData.badge === 'string' && dbPlanData.badge.includes(':::')) {
        const [ar, en] = dbPlanData.badge.split(':::').map((s) => s.trim());
        badgeAr = ar || pkg.badgeAr;
        badgeEn = en || pkg.badgeEn || ar;
      } else {
        badgeAr = dbPlanData.badge;
        badgeEn = pkg.badgeEn || dbPlanData.badge;
      }
    }

    let descAr = pkg.descAr;
    let descEn = pkg.descEn;
    if (dbPlanData?.description) {
      if (typeof dbPlanData.description === 'string' && dbPlanData.description.includes(':::')) {
        const [ar, en] = dbPlanData.description.split(':::').map((s) => s.trim());
        descAr = ar || pkg.descAr;
        descEn = en || pkg.descEn || ar;
      } else {
        descAr = dbPlanData.description;
        descEn = pkg.descEn || dbPlanData.description;
      }
    }

    const planPrice = dbPlanData?.price !== undefined ? Number(dbPlanData.price) : (pkg.priceVal || 49);
    const planColor = dbPlanData?.highlightColor || pkg.color || '#FB8704';

    let perksAr = [
      'وصول فوري وشامل لكافة تحليلات وإشارات هذه المجموعة',
      'تنبيهات تيليجرام VIP فورية على مدار 24/5',
      'نقاط دخول وخروج محددة بدقة مع إدارة المخاطر',
      'جلسات بث صوتي ومتابعة حية خلال الأخبار الاقتصادية القوية',
    ];
    let perksEn = [
      'Instant institutional access to all setups in this analysis group',
      'Real-time 24/5 VIP Telegram alerts and notifications',
      'Precise entry, stop loss, and multiple target levels (TP1, TP2)',
      'Live voice and text coverage during high-impact economic news',
    ];

    if (Array.isArray(dbPlanData?.features) && dbPlanData.features.length > 0) {
      perksAr = dbPlanData.features.map((f) => {
        if (typeof f === 'string' && f.includes(':::')) {
          return f.split(':::')[0].trim();
        }
        return f;
      });
      perksEn = dbPlanData.features.map((f) => {
        if (typeof f === 'string' && f.includes(':::')) {
          return f.split(':::')[1]?.trim() || f.split(':::')[0].trim();
        }
        return f;
      });
    }

    return {
      kind: 'package',
      packageKey,
      planId: dbPlanData?.id || packageKey,
      titleAr: nameAr,
      titleEn: nameEn,
      subtitleAr: `${descAr} • اشتراك شهري متجدد`,
      subtitleEn: `${descEn} • Monthly recurring subscription`,
      priceVal: planPrice,
      priceStr: isAr ? `${planPrice} USDT / شهرياً` : `${planPrice} USDT / Month`,
      badgeAr,
      badgeEn,
      badgeColor: planColor,
      perksAr,
      perksEn,
      redirectUrl: '/analyses',
      ctaLabelAr: 'تصفح كافة تحليلات المجموعة',
      ctaLabelEn: 'Explore Group Setups',
    };
  }, [type, packageKey, itemId, liveSessionData, dbPlanData, dbCourseData, isAr, generatedAccessCode]);

  // Form & Checkout States
  const [paymentMethod, setPaymentMethod] = useState('support'); // 'support' | 'code'
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmountVal, setDiscountAmountVal] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Customer Details Form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [telegramHandle, setTelegramHandle] = useState('');
  const [txid, setTxid] = useState('');

  // Existing Live Course Access Verification State
  const [existingLiveAccess, setExistingLiveAccess] = useState(null);
  const [isCheckingLiveEmail, setIsCheckingLiveEmail] = useState(false);

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
    if (user?.fullName && !fullName) {
      setFullName(user.fullName);
    }
    if (user?.phoneNumber && !phone) {
      setPhone(user.phoneNumber);
    }
  }, [user]);

  // Capture affiliate ref on checkout page mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const ref =
        sp.get('ref') ||
        sp.get('referral') ||
        sp.get('affiliate') ||
        sp.get('aff') ||
        sp.get('avalid') ||
        sp.get('partner') ||
        sp.get('code');
      if (ref) {
        const cleanRef = ref.trim().toUpperCase();
        localStorage.setItem('fxengin_affiliate_ref', cleanRef);
        sessionStorage.setItem('fxengin_affiliate_ref', cleanRef);
        document.cookie = `fxengin_affiliate_ref=${encodeURIComponent(cleanRef)}; path=/; max-age=7776000; SameSite=Lax`;
      }
    } catch (e) {}
  }, []);

  const getStoredAffiliateRef = () => {
    if (typeof window === 'undefined') return '';
    try {
      const sp = new URLSearchParams(window.location.search);
      const urlRef =
        sp.get('ref') ||
        sp.get('referral') ||
        sp.get('affiliate') ||
        sp.get('aff') ||
        sp.get('avalid') ||
        sp.get('partner') ||
        sp.get('code');
      if (urlRef) return urlRef.trim().toUpperCase();

      const lsRef =
        localStorage.getItem('fxengin_affiliate_ref') ||
        sessionStorage.getItem('fxengin_affiliate_ref');
      if (lsRef) return lsRef.trim().toUpperCase();

      const m = document.cookie.match(/fxengin_affiliate_ref=([^;]+)/);
      if (m) return decodeURIComponent(m[1]).trim().toUpperCase();
    } catch (e) {}
    return '';
  };

  useEffect(() => {
    if ((type === 'live' || type === 'webinar') && email && email.includes('@') && email.includes('.')) {
      const targetSessionId = itemId || liveSessionData?.slug || liveSessionData?.id || 'current';
      const timer = setTimeout(() => {
        setIsCheckingLiveEmail(true);
        fetch(`/api/live/${encodeURIComponent(targetSessionId)}/check-email-access?email=${encodeURIComponent(email.trim().toLowerCase())}`)
          .then((r) => r.json())
          .then((data) => {
            if (data?.hasAccess && data?.accessCode) {
              setExistingLiveAccess(data);
            } else {
              setExistingLiveAccess(null);
            }
          })
          .catch(() => setExistingLiveAccess(null))
          .finally(() => setIsCheckingLiveEmail(false));
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setExistingLiveAccess(null);
    }
  }, [type, itemId, liveSessionData, email]);

  // Duplicate Order and Active Entitlement Prevention State
  const [existingOrderInfo, setExistingOrderInfo] = useState(null);
  const [hasActiveEntitlement, setHasActiveEntitlement] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);

  // Check if current course is enrolled in user profile or backend
  const isCourseEnrolledLocally = Boolean(
    product.kind === 'course' && (
      isUserEnrolledInCourse(user, dbCourseData || { id: itemId, slug: itemId }) ||
      Boolean(dbCourseData?.isEnrolled)
    )
  );

  const isAlreadyEnrolled = Boolean(hasActiveEntitlement || isCourseEnrolledLocally);

  useEffect(() => {
    const targetEmail = email?.trim() || user?.email || '';
    const targetPhone = phone?.trim() || user?.phoneNumber || '';

    const resolvedProductType =
      product.kind === 'course'
        ? 'RECORDED_COURSE'
        : (product.kind === 'live' || product.kind === 'webinar')
        ? 'LIVE_COURSE'
        : 'COMMUNITY_GROUP';

    const resolvedProductId =
      product.kind === 'course'
        ? (product.courseId || product.slug || itemId)
        : (product.kind === 'live' || product.kind === 'webinar')
        ? (itemId || liveSessionData?.id || liveSessionData?.slug || 'current')
        : (dbPlanData?.id || packageKey || 'gold');

    if (!resolvedProductId) return;
    if (!user && !targetEmail) return;

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setIsCheckingExisting(true);
        const queryParams = new URLSearchParams({
          productId: resolvedProductId,
          productType: resolvedProductType,
        });
        if (targetEmail) queryParams.set('email', targetEmail);
        if (targetPhone) queryParams.set('phone', targetPhone);

        const res = await apiFetch(`/orders/check-status?${queryParams.toString()}`);
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          if (data.hasActiveAccess) {
            setHasActiveEntitlement(true);
            setExistingOrderInfo(null);
          } else if (data.hasPendingOrder && data.order) {
            setExistingOrderInfo(data.order);
            setHasActiveEntitlement(false);
          } else {
            setExistingOrderInfo(null);
            setHasActiveEntitlement(false);
          }
        }
      } catch (err) {
        console.warn('Could not check existing order status:', err);
      } finally {
        if (isMounted) setIsCheckingExisting(false);
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user, email, phone, product.kind, product.courseId, product.slug, itemId, liveSessionData, dbPlanData, packageKey]);

  // Manual Code Input State
  const [manualAccessCode, setManualAccessCode] = useState('');
  const [manualCodeError, setManualCodeError] = useState('');

  // Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderSummaryMessage, setOrderSummaryMessage] = useState('');
  const [hasCopiedMessage, setHasCopiedMessage] = useState(false);

  const buildTelegramMessage = ({ orderNum, amount, cur, isExisting = false }) => {
    const buyerName = fullName?.trim() || user?.fullName || (isAr ? 'مشترك جديد' : 'New Subscriber');
    const buyerEmail = email?.trim() || user?.email || '—';
    const cleanedPhone = phone?.trim() || user?.phoneNumber || '';
    const buyerPhone = cleanedPhone || (isAr ? 'غير محدد' : 'Not specified');
    const buyerTelegram = telegramHandle?.trim() || (isAr ? 'غير محدد' : 'Not specified');
    const itemTitle = (isAr ? product?.titleAr : product?.titleEn) || product?.titleAr || (isAr ? 'الخدمة' : 'Service');
    const itemType =
      product.kind === 'course'
        ? (isAr ? 'كورس تدريبي معتمد' : 'Accredited Training Course')
        : product.kind === 'live'
        ? (isAr ? 'كورس بث مباشر تفاعلي' : 'Interactive Live Masterclass')
        : product.kind === 'webinar'
        ? (isAr ? 'محاضرة VIP مباشرة (Zoom)' : 'VIP Live Webinar')
        : (isAr ? 'باقة تحليلات وتوصيات VIP' : 'VIP Analysis & Signals Package');

    const usedCurrency = cur || product?.currency || 'USDT';
    const usedAmount = amount ?? finalPrice;
    const couponLine = couponApplied && couponCode
      ? (isAr
          ? `كود الخصم المطبق: ${couponCode.trim().toUpperCase()} (${discountAmountVal > 0 ? `خصم ${discountAmountVal} ${usedCurrency}` : `${discountPercent}%`})\n`
          : `Coupon Applied: ${couponCode.trim().toUpperCase()}\n`)
      : '';

    const txLine = txid?.trim()
      ? (isAr ? `بيانات تحويل USDT (TxID / المحفظة): ${txid.trim()}\n` : `USDT Transfer / TxID: ${txid.trim()}\n`)
      : (isAr ? `وسيلة السداد: عملة رقمية USDT (شبكة TRC-20)\n` : `Payment Method: USDT (TRC-20)\n`);

    const dateStr = new Date().toLocaleString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return isAr
      ? `مرحباً فريق الدعم المالي FXENGIN،\nأود تأكيد سداد وتفعيل ${isExisting ? 'طلبي السابق' : 'اشتراكي'}:\n\nرقم الطلب: #${orderNum}\nالخدمة: ${itemTitle}\nنوع الاشتراك: ${itemType}\nالمبلغ المستحق: ${usedAmount} ${usedCurrency}\n${couponLine}\nاسم المشترك: ${buyerName}\nالبريد الإلكتروني: ${buyerEmail}\nرقم الهاتف / واتساب: ${buyerPhone}\nمعرف تيليجرام: ${buyerTelegram}\n${txLine}تاريخ وتوقيت الطلب: ${dateStr}\n\nيرجى مراجعة إيصال السداد واعتماد الطلب وتزويدي بكود التفعيل. شكراً لكم!`
      : `Hello FXENGIN Finance & Support Team,\nI would like to confirm payment for my ${isExisting ? 'existing order' : 'order'}:\n\nOrder Number: #${orderNum}\nService: ${itemTitle}\nSubscription Type: ${itemType}\nTotal Amount: ${usedAmount} ${usedCurrency}\n${couponLine}\nFull Name: ${buyerName}\nEmail: ${buyerEmail}\nPhone / WhatsApp: ${buyerPhone}\nTelegram: ${buyerTelegram}\n${txLine}Date & Time: ${dateStr}\n\nPlease verify my payment receipt and activate my access / issue activation code. Thank you!`;
  };

  const dispatchToTelegram = async (msgText) => {
    setOrderSummaryMessage(msgText);

    // Auto-copy order message to user clipboard as quick backup
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(msgText);
        setHasCopiedMessage(true);
      } catch (clipErr) {
        console.warn('Clipboard auto-copy failed:', clipErr);
      }
    }

    const telegramTarget = (product.kind === 'course' || type === 'course') ? 'FXENGINEducation' : 'FXenginsignals';
    const telegramUrl = `https://t.me/${telegramTarget}?text=${encodeURIComponent(msgText)}`;

    // Attempt to open in a new tab so checkout page stays visible with confirmation details
    let openedNewTab = false;
    try {
      const newWin = window.open(telegramUrl, '_blank');
      if (newWin && !newWin.closed && typeof newWin.closed !== 'undefined') {
        openedNewTab = true;
      }
    } catch (e) {
      openedNewTab = false;
    }

    // Fallback: If popup was blocked by browser or on mobile, redirect current window
    if (!openedNewTab) {
      window.location.href = telegramUrl;
    }
  };

  const handleApplyCoupon = async (e) => {
    e?.preventDefault?.();
    setCouponError('');
    setCouponMessage('');
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError(isAr ? 'يرجى إدخال رمز الكوبون' : 'Please enter a coupon code');
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const { validateCoupon } = await import('../services/couponService');
      const res = await validateCoupon(
        code,
        product.priceVal,
        product.kind === 'course' ? (product.slug || itemId) : null
      );
      if (res.valid) {
        setDiscountAmountVal(res.discountAmount || 0);
        setDiscountPercent(res.discountType === 'PERCENTAGE' ? res.discountValue : 0);
        setCouponApplied(true);
        setCouponMessage(res.message || (isAr ? 'تم تطبيق الخصم بنجاح!' : 'Coupon applied successfully!'));
      } else {
        setCouponApplied(false);
        setDiscountAmountVal(0);
        setDiscountPercent(0);
        setCouponError(res.error || (isAr ? 'كوبون الخصم غير صالح أو منتهي الصلاحية' : 'Invalid or expired discount code'));
      }
    } catch {
      setCouponError(isAr ? 'تعذر التحقق من الكوبون' : 'Failed to validate coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const finalPrice = useMemo(() => {
    if (!product.priceVal) return 0;
    if (discountAmountVal > 0) {
      return Math.max(0, Math.round(product.priceVal - discountAmountVal));
    }
    if (discountPercent > 0) {
      const discounted = product.priceVal * (1 - discountPercent / 100);
      return Math.max(0, Math.round(discounted));
    }
    return product.priceVal;
  }, [product.priceVal, discountAmountVal, discountPercent]);

  const handleCompleteOrder = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!user) {
      const fullCurrentPath = window.location.pathname + window.location.search;
      showToast.info(isAr ? 'يرجى تسجيل الدخول أولاً لإتمام الطلب' : 'Please sign in first to complete your order');
      router.push(`/login?redirect=${encodeURIComponent(fullCurrentPath)}`);
      return;
    }

    if (isAlreadyEnrolled) {
      showToast.error(isAr ? 'أنت مشترك ومفعّل بالفعل في هذه الدورة التدريبية!' : 'You already have active access to this course!');
      return;
    }

    // Case 1: Manual Code Verification / Activation
    if (paymentMethod === 'code') {
      setManualCodeError('');
      const cleanCode = manualAccessCode.trim().toUpperCase();
      if (!cleanCode) {
        setManualCodeError(isAr ? 'يرجى إدخال كود التفعيل أو التذكرة' : 'Please enter the access code');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await apiFetch('/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: cleanCode }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          setManualCodeError(data?.message || (isAr ? 'كود التفعيل غير صالح أو منتهي' : 'Invalid activation code'));
          setIsSubmitting(false);
          return;
        }

        try {
          await refetchUser();
        } catch (e) {}
        if (enrollUserCourse) {
          enrollUserCourse(product);
        }
        setHasActiveEntitlement(true);

        setOrderId(`ACT-${cleanCode}`);
        setGeneratedAccessCode(cleanCode);
        setIsSuccess(true);
        setIsSubmitting(false);
        showToast.success(data.message || (isAr ? 'تم تفعيل الكود بنجاح!' : 'Activated!'));
        return;
      } catch (err) {
        setManualCodeError(isAr ? 'تعذر التحقق من كود التفعيل' : 'Failed to verify activation code');
        setIsSubmitting(false);
        return;
      }
    }

    // Case 2: Existing Order under review -> Redirect directly to Telegram
    if (existingOrderInfo) {
      const existingMsg = buildTelegramMessage({
        orderNum: existingOrderInfo.orderNumber,
        amount: existingOrderInfo.finalAmount,
        cur: existingOrderInfo.currency,
        isExisting: true,
      });

      setOrderId(existingOrderInfo.orderNumber);
      setIsSuccess(true);
      showToast.info(
        isAr
          ? `جارٍ تحويلك إلى تيليجرام لمتابعة وتأكيد طلبك السابق (#${existingOrderInfo.orderNumber})...`
          : `Redirecting to Telegram for order #${existingOrderInfo.orderNumber}...`
      );
      await dispatchToTelegram(existingMsg);
      return;
    }

    // Case 3: Create Server-side Order and Redirect to Telegram with Full Details
    setIsSubmitting(true);

    const resolvedProductType =
      product.kind === 'course'
        ? 'RECORDED_COURSE'
        : (product.kind === 'live' || product.kind === 'webinar')
        ? 'LIVE_COURSE'
        : 'COMMUNITY_GROUP';

    const resolvedProductId =
      product.kind === 'course'
        ? (product.courseId || product.slug || itemId)
        : (product.kind === 'live' || product.kind === 'webinar')
        ? (itemId || liveSessionData?.id || liveSessionData?.slug || 'current')
        : (dbPlanData?.id || packageKey || 'gold');

    const mappedPaymentMethod = 'CRYPTO_USDT_TRC20';

    try {
      // 0. Auto-save phone to user profile in database if missing or updated
      const cleanedPhone = phone?.trim() || '';
      const finalPhone = cleanedPhone || user?.phoneNumber || '';

      if (finalPhone && (!user?.phoneNumber || finalPhone !== user.phoneNumber)) {
        try {
          await updateUserProfile({ phoneNumber: finalPhone });
          if (typeof refetchUser === 'function') {
            await refetchUser();
          }
        } catch (profileErr) {
          console.warn('Could not auto-save phone to user profile:', profileErr);
        }
      }

      // 1. Create real order on backend
      const orderRes = await apiFetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: resolvedProductType,
          productId: resolvedProductId,
          paymentMethod: mappedPaymentMethod,
          couponCode: couponApplied ? couponCode.trim().toUpperCase() : null,
          customerNotes: `${fullName || user?.fullName || ''} | هاتف: ${finalPhone || '—'} | تيليجرام: ${telegramHandle || '—'}`,
          email: email || user?.email || undefined,
          fullName: fullName || user?.fullName || undefined,
          phone: finalPhone || undefined,
        }),
      });

      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData?.message || (isAr ? 'فشل إنشاء الطلب في النظام' : 'Failed to create order'));
      }

      const newOrder = orderData.order;
      setOrderId(newOrder.orderNumber);

      // Affiliate Referral Attribution: Record 10% commission conversion for the referrer
      try {
        const affiliateRef = getStoredAffiliateRef();

        const isGroupProduct =
          Boolean(product?.title && (
            product.title.toLowerCase().includes('group') ||
            product.title.toLowerCase().includes('signal') ||
            product.title.includes('جروب') ||
            product.title.includes('توصيات') ||
            product.title.includes('vip')
          ));

        fetch('/api/affiliate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'record_conversion',
            referralCode: affiliateRef ? affiliateRef.trim().toUpperCase() : '',
            orderNumber: newOrder.orderNumber,
            orderAmount: newOrder.finalAmount || finalPrice,
            currency: newOrder.currency || product.currency || 'USDT',
            productName:
              product?.title ||
              newOrder?.productTitle ||
              (isGroupProduct ? 'جروب توصيات VIP' : 'دورة تدريبية متقدمة'),
            productType: isGroupProduct ? 'GROUP' : 'COURSE',
            buyerName: fullName || user?.fullName || 'مشترك جديد',
            buyerEmail: email || user?.email || '',
            buyerPhone: finalPhone || user?.phoneNumber || '',
            buyerId: user?.id,
          }),
        }).catch((affErr) => console.warn('Affiliate conversion record warning:', affErr));
      } catch (refCheckErr) {
        console.warn('Referral check error:', refCheckErr);
      }

      // 2. Submit payment proof/txId to mark as UNDER_REVIEW and record customer notes
      try {
        await apiFetch(`/orders/${newOrder.id}/submit-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethod: mappedPaymentMethod,
            txId: txid?.trim() || null,
            customerNotes: `المشتري: ${fullName || user?.fullName || ''} - هاتف: ${finalPhone || '—'} - تيليجرام: ${telegramHandle || '—'}`,
          }),
        });
      } catch (submitErr) {
        console.warn('Submit payment proof warning:', submitErr);
      }

      // 3. Prepare Comprehensive Telegram Summary Message
      const msgText = buildTelegramMessage({
        orderNum: newOrder.orderNumber,
        amount: newOrder.finalAmount,
        cur: newOrder.currency,
      });

      setIsSuccess(true);
      setIsSubmitting(false);

      showToast.success(
        isAr
          ? 'تم تسجيل طلبك بنجاح! جارٍ تحويلك إلى تيليجرام لإرسال التفاصيل مباشرة...'
          : 'Order recorded! Redirecting to Telegram to send details...'
      );

      // 4. Redirect to Telegram with the pre-filled message
      await dispatchToTelegram(msgText);
    } catch (err) {
      console.error('Order checkout error:', err);

      // Fallback: If backend had an issue, create client reference and still forward to Telegram so user isn't stuck
      const fallbackOrderNum = 'FX-' + Math.floor(100000 + Math.random() * 900000);
      const fallbackMsg = buildTelegramMessage({
        orderNum: fallbackOrderNum,
        amount: finalPrice,
        cur: product.currency || 'USDT',
      });

      setOrderId(fallbackOrderNum);
      setIsSuccess(true);
      setIsSubmitting(false);

      try {
        const affiliateRef = getStoredAffiliateRef();

        const isGroupProduct =
          Boolean(product?.title && (
            product.title.toLowerCase().includes('group') ||
            product.title.toLowerCase().includes('signal') ||
            product.title.includes('جروب') ||
            product.title.includes('توصيات') ||
            product.title.includes('vip')
          ));

        fetch('/api/affiliate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'record_conversion',
            referralCode: affiliateRef ? affiliateRef.trim().toUpperCase() : '',
            orderNumber: fallbackOrderNum,
            orderAmount: finalPrice,
            currency: product.currency || 'USDT',
            productName:
              product?.title ||
              (isGroupProduct ? 'جروب توصيات VIP' : 'دورة تدريبية متقدمة'),
            productType: isGroupProduct ? 'GROUP' : 'COURSE',
            buyerName: fullName || user?.fullName || 'مشترك جديد',
            buyerEmail: email || user?.email || '',
            buyerPhone: finalPhone || user?.phoneNumber || '',
            buyerId: user?.id,
          }),
        }).catch(() => {});
      } catch (e) {}

      showToast.info(
        isAr
          ? 'تم تجهيز بيانات طلبك! جارٍ تحويلك لدعم تيليجرام لتأكيد الدفع...'
          : 'Order details prepared! Redirecting to Telegram support...'
      );

      await dispatchToTelegram(fallbackMsg);
    }
  };

  if (!user && !authTimedOut && (authLoading || !isAuthenticated)) {
    return (
      <div
        style={{
          minHeight: '85vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          color: 'var(--text-secondary)',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '3px solid rgba(4, 136, 248, 0.2)',
            borderTopColor: 'var(--primary)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ fontSize: '14px', fontWeight: 600 }}>
          {isAr ? 'جاري التحقق من الحساب وتسجيل الدخول...' : 'Checking authentication & redirecting...'}
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '40px 0 90px' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>

        {/* Back Link */}
        <div style={{ marginBottom: '24px' }}>
            <Link
            href={getAppRoute(type === 'live' ? '/live' : type === 'course' ? '/courses' : type === 'webinar' ? '/' : '/analyses', user)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-muted)',
              fontSize: '13px',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            {isAr ? <FiArrowRight size={14} /> : <FiArrowLeft size={14} />}
            <span>
              {type === 'live'
                ? (isAr ? 'العودة إلى البث المباشر' : 'Back to Live Streams')
                : type === 'course'
                ? (isAr ? 'العودة إلى الكورسات' : 'Back to Courses')
                : type === 'webinar'
                ? (isAr ? 'العودة إلى الصفحة الرئيسية' : 'Back to Home')
                : (isAr ? 'العودة إلى التحليلات' : 'Back to Analyses')}
            </span>
          </Link>
        </div>

        {/* Success Modal / Screen */}
        {isSuccess ? (
          <div
            className="card"
            style={{
              background: 'var(--surface)',
              border: '1px solid rgba(22, 199, 132, 0.4)',
              borderRadius: '20px',
              padding: '48px 24px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 3, 13, 0.8), 0 0 40px rgba(22, 199, 132, 0.15)',
              maxWidth: '680px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: 'rgba(22, 199, 132, 0.15)',
                border: '2px solid var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)',
                margin: '0 auto 24px',
                boxShadow: '0 0 30px rgba(22, 199, 132, 0.35)',
              }}
            >
              <FiCheckCircle size={38} />
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '5px 14px',
                borderRadius: '20px',
                background: paymentMethod === 'code' ? 'rgba(22, 199, 132, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                color: paymentMethod === 'code' ? 'var(--success)' : 'var(--warning)',
                border: paymentMethod === 'code' ? '1px solid rgba(22, 199, 132, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)',
                display: 'inline-block',
                marginBottom: '12px',
                letterSpacing: '1px',
              }}
            >
              {paymentMethod === 'code'
                ? (isAr ? 'تم تفعيل الاشتراك بنجاح • ACTIVATED' : 'ACTIVATION SUCCESSFUL')
                : (isAr ? 'قيد المراجعة والتحقق المالي • UNDER REVIEW' : 'ORDER UNDER REVIEW')}
            </span>

            <h2 style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
              {paymentMethod === 'code'
                ? (isAr ? 'مبروك! تم تفعيل اشتراكك بنجاح' : 'Congratulations! Subscription Active')
                : (isAr ? 'تم استلام وتسجيل طلبك بنجاح!' : 'Order Received Successfully!')}
            </h2>

            <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 20px', lineHeight: 1.65 }}>
              {paymentMethod === 'code'
                ? (isAr
                  ? `تم تفعيل طلبك بنجاح برقم (${orderId}). أصبحت كافة الدروس مفتوحة بحسابك.`
                  : `Your access has been activated under reference (${orderId}).`)
                : (isAr
                  ? `تم تسجيل طلبك برقم مرجعي (${orderId}) وهو الآن قيد التدقيق المالي من قبل الإدارة.`
                  : `Your order has been registered under reference (${orderId}) and is currently under financial review.`)}
            </p>

            <div
              style={{
                background: 'rgba(1, 7, 30, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13.5px',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{isAr ? 'الخدمة / المنتج المطلوب:' : 'Item Requested:'}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{isAr ? product.titleAr : product.titleEn}</span>
            </div>

            {/* Financial Review Notice & Activation Guidance */}
            {paymentMethod !== 'code' && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 135, 4, 0.08) 0%, rgba(4, 136, 248, 0.05) 100%)',
                  border: '1px solid rgba(251, 135, 4, 0.3)',
                  borderRadius: '16px',
                  padding: '24px 20px',
                  marginBottom: '24px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    background: 'rgba(251, 191, 36, 0.12)',
                    border: '1px solid rgba(251, 191, 36, 0.35)',
                    color: 'var(--warning)',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '14px',
                  }}
                >
                  <FiClock size={14} />
                  <span>
                    {isAr
                      ? 'تم تسجيل طلب الدفع وتوجيه إشعار فوري للإدارة المالية!'
                      : 'Payment logged and dispatched to finance team!'}
                  </span>
                </div>

                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {isAr ? 'خطوات التفعيل بعد اعتماد السداد' : 'Activation Next Steps'}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 auto 18px', maxWidth: '520px', lineHeight: 1.65 }}>
                  {isAr
                    ? `بمجرد مراجعة إيصال السداد واعتماده من قبل الإدارة، سيتم توليد كود التفعيل الفريد الخاص بك (Activation Code) تلقائياً وإرساله إلى بريدك الإلكتروني (${user?.email || 'المسجل لدينا'}). يمكنك بعدها إدخال الكود في صفحة التفعيل لفك القفل ودخول المحتوى مباشرة.`
                    : `Once your payment proof is verified by the finance team, a unique Activation Code will be dispatched to your email (${user?.email}). You will then enter the code on the activation page to unlock access.`}
                </p>

                {/* Direct Telegram Support Button for fast verification */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <a
                    href={`https://t.me/${(product.kind === 'course' || type === 'course') ? 'FXENGINEducation' : 'FXenginsignals'}?text=${encodeURIComponent(orderSummaryMessage || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      height: '48px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0088cc 0%, #0488F8 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 800,
                      fontSize: '13.5px',
                      textDecoration: 'none',
                      boxShadow: '0 6px 20px rgba(0, 136, 204, 0.45)',
                    }}
                  >
                    <FaTelegramPlane size={18} />
                    <span>{isAr ? 'فتح محادثة تيليجرام وإرسال التفاصيل الآن' : 'Open Telegram & Send Details Now'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={async () => {
                      if (orderSummaryMessage && typeof navigator !== 'undefined' && navigator.clipboard) {
                        try {
                          await navigator.clipboard.writeText(orderSummaryMessage);
                          setHasCopiedMessage(true);
                          showToast.success(isAr ? 'تم نسخ نص الرسالة بالكامل!' : 'Message copied to clipboard!');
                        } catch (e) {}
                      }
                    }}
                    style={{
                      height: '48px',
                      borderRadius: '10px',
                      background: hasCopiedMessage ? 'rgba(22, 199, 132, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                      border: hasCopiedMessage ? '1px solid var(--success)' : '1px solid var(--border)',
                      color: hasCopiedMessage ? 'var(--success)' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {hasCopiedMessage ? <FiCheck size={16} /> : <FiCopy size={16} />}
                    <span>{hasCopiedMessage ? (isAr ? 'تم نسخ الرسالة بنجاح' : 'Message Copied') : (isAr ? 'نسخ نص الرسالة' : 'Copy Message Text')}</span>
                  </button>
                </div>

                {/* Message preview snippet */}
                {orderSummaryMessage && (
                  <div
                    style={{
                      marginTop: '16px',
                      textAlign: isAr ? 'right' : 'left',
                      background: 'rgba(0, 3, 13, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      maxHeight: '180px',
                      overflowY: 'auto',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '6px', fontSize: '11.5px' }}>
                      {isAr ? 'نص الرسالة المجهز للإرسال عبر تيليجرام:' : 'Draft message for Telegram:'}
                    </div>
                    {orderSummaryMessage}
                  </div>
                )}
              </div>
            )}

            {/* Primary Action Button */}
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {paymentMethod === 'code' ? (
                <Link
                  href={product.redirectUrl || '/courses'}
                  className="btn-primary"
                  style={{
                    height: '50px',
                    padding: '0 32px',
                    fontSize: '14.5px',
                    fontWeight: 900,
                    gap: '10px',
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    boxShadow: '0 6px 24px rgba(16, 185, 129, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                  }}
                >
                  <FiPlayCircle size={18} />
                  <span>{isAr ? 'ادخل الكورس الآن ←' : 'Enter Course Now →'}</span>
                </Link>
              ) : (
                <Link
                  href="/activate"
                  className="btn-primary"
                  style={{
                    height: '50px',
                    padding: '0 32px',
                    fontSize: '14.5px',
                    fontWeight: 900,
                    gap: '10px',
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #FB8704 0%, #FF5500 100%)',
                    boxShadow: '0 6px 24px rgba(251, 135, 4, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                  }}
                >
                  <FiKey size={18} />
                  <span>{isAr ? 'الانتقال إلى صفحة تفعيل الكود (/activate)' : 'Go to Activation Page (/activate)'}</span>
                </Link>
              )}
            </div>
          </div>
        ) : isAlreadyEnrolled ? (
          /* Dedicated Screen When User Already Has Active Course Access (No duplicate purchase request) */
          <div
            className="card"
            style={{
              background: 'var(--surface)',
              border: '1px solid rgba(22, 199, 132, 0.4)',
              borderRadius: '24px',
              padding: '48px 28px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 3, 13, 0.8), 0 0 40px rgba(22, 199, 132, 0.15)',
              maxWidth: '680px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: 'rgba(22, 199, 132, 0.15)',
                border: '2px solid var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)',
                margin: '0 auto 24px',
                boxShadow: '0 0 30px rgba(22, 199, 132, 0.35)',
              }}
            >
              <FiCheckCircle size={38} />
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '5px 14px',
                borderRadius: '20px',
                background: 'rgba(22, 199, 132, 0.15)',
                color: 'var(--success)',
                border: '1px solid rgba(22, 199, 132, 0.3)',
                display: 'inline-block',
                marginBottom: '14px',
                letterSpacing: '1px',
              }}
            >
              {isAr ? 'تم الاشتراك والتفعيل بنجاح • ACTIVE ACCESS' : 'SUBSCRIPTION ACTIVE'}
            </span>

            <h2 style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
              {isAr ? 'أنت مشترك ومفعّل بالفعل في هذا الكورس!' : 'You already have active access to this course!'}
            </h2>

            <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.65 }}>
              {isAr
                ? `حسابك يمتلك صلاحية الوصول الكاملة وغير المحدودة لكافة دروس ومواد (${product.titleAr}). لا داعي لإعادة الدفع أو إرسال أي طلب شراء جديد.`
                : `Your account already possesses full lifetime access to (${product.titleEn}). No further payment or purchase request is needed.`}
            </p>

            <div
              style={{
                background: 'rgba(1, 7, 30, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13.5px',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{isAr ? 'الخدمة / الكورس:' : 'Item / Course:'}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{isAr ? product.titleAr : product.titleEn}</span>
            </div>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href={product.redirectUrl || `/courses/${product.slug || itemId}/learn`}
                className="btn-primary"
                style={{
                  height: '50px',
                  padding: '0 32px',
                  fontSize: '15px',
                  fontWeight: 900,
                  gap: '10px',
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: '0 6px 24px rgba(16, 185, 129, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                }}
              >
                <FiPlayCircle size={18} />
                <span>{isAr ? 'ادخل الكورس الآن ←' : 'Enter Course Now →'}</span>
              </Link>

              <Link
                href={getAppRoute(`/courses/${product.slug || itemId}`, user)}
                className="btn-secondary"
                style={{
                  height: '50px',
                  padding: '0 24px',
                  fontSize: '14px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                }}
              >
                <span>{isAr ? 'تفاصيل ومنهاج الكورس' : 'Course Syllabus'}</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Banner if already active or has pending order */}
            {hasActiveEntitlement && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(22, 199, 132, 0.12) 0%, rgba(22, 199, 132, 0.04) 100%)',
                  border: '1px solid rgba(22, 199, 132, 0.4)',
                  borderRadius: '16px',
                  padding: '18px 22px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  boxShadow: '0 8px 30px rgba(0, 3, 13, 0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(22, 199, 132, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--success)',
                    }}
                  >
                    <FiCheckCircle size={22} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {isAr ? 'أنت مشترك ومفعّل بالفعل في هذا المحتوى!' : 'You already have active access!'}
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {isAr
                        ? 'حسابك يمتلك صلاحية الوصول الكاملة لكافة دروس وتحليلات هذه الدورة التدريبية.'
                        : 'Your account is already active with full lifetime access to this content.'}
                    </p>
                  </div>
                </div>
                <Link
                  href={product.redirectUrl || '/courses'}
                  className="btn-primary"
                  style={{
                    textDecoration: 'none',
                    padding: '10px 20px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    borderRadius: '10px',
                  }}
                >
                  {isAr ? 'الانتقال إلى المحتوى الآن ←' : 'Go to Course Now →'}
                </Link>
              </div>
            )}

            {!hasActiveEntitlement && existingOrderInfo && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(251, 135, 4, 0.05) 100%)',
                  border: '1px solid rgba(251, 191, 36, 0.45)',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  marginBottom: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 8px 30px rgba(0, 3, 13, 0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'rgba(251, 191, 36, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--warning)',
                      }}
                    >
                      <FiAlertCircle size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {isAr
                          ? `لديك طلب سابق مسجل برقم #${existingOrderInfo.orderNumber}`
                          : `You have an existing order #${existingOrderInfo.orderNumber}`}
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {isAr
                          ? 'طلبك قيد المراجعة والتحقق المالي حالياً لدى الإدارة. لا يمكن إرسال أكثر من طلب لنفس الخدمة لتجنب الازدواجية.'
                          : 'Your order is currently under financial review. Duplicate orders for the same item are blocked.'}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 800,
                      padding: '5px 12px',
                      borderRadius: '20px',
                      background: 'rgba(251, 191, 36, 0.2)',
                      color: 'var(--warning)',
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                    }}
                  >
                    {isAr ? 'قيد المراجعة المالية' : 'UNDER REVIEW'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingTop: '4px' }}>
                  <a
                    href={`https://wa.me/201012345678?text=${encodeURIComponent(
                      `مرحباً، أود الاستفسار عن حالة طلبي رقم #${existingOrderInfo.orderNumber} لكورس (${product.titleAr || ''})`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      background: '#25D366',
                      color: '#FFFFFF',
                      padding: '9px 16px',
                      borderRadius: '9px',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <FaWhatsapp size={16} />
                    <span>{isAr ? 'متابعة الطلب عبر واتساب' : 'Follow up via WhatsApp'}</span>
                  </a>
                  <a
                    href={`https://t.me/${(product.kind === 'course' || type === 'course') ? 'FXENGINEducation' : 'FXenginsignals'}?text=${encodeURIComponent(
                      buildTelegramMessage({
                        orderNum: existingOrderInfo.orderNumber,
                        amount: existingOrderInfo.finalAmount,
                        cur: existingOrderInfo.currency,
                        isExisting: true,
                      })
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      background: '#229ED9',
                      color: '#FFFFFF',
                      padding: '9px 16px',
                      borderRadius: '9px',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <FaTelegramPlane size={16} />
                    <span>{isAr ? 'متابعة الطلب عبر تيليجرام' : 'Follow up via Telegram'}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderId(existingOrderInfo.orderNumber);
                      setIsSuccess(true);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      padding: '9px 16px',
                      borderRadius: '9px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isAr ? 'عرض بيانات الطلب وتأكيد السداد' : 'View Order Details'}
                  </button>
                </div>
              </div>
            )}

            {/* Main 2-Column Balanced Checkout Form */}
            <form
              onSubmit={handleCompleteOrder}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '24px',
                alignItems: 'start',
              }}
            >
          {/* ── Column 1 (Right in RTL): Subscriber Details & Payment Method ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Secure Checkout Header Banner */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(4, 136, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <FiShield size={20} />
                </div>
                <div>
                  <h1 style={{ fontSize: '16.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {isAr ? 'إتمام الدفع والاشتراك الآمن' : 'Secure Checkout & Activation'}
                  </h1>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    {isAr ? 'دفع يدوي آمن ومؤكد عبر الدعم الفني وتفعيل مباشر' : 'Manual verified payment via support desk with fast activation'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--success)', fontWeight: 700 }}>
                <FiLock size={13} />
                <span>{isAr ? 'دفع آمن 100%' : '100% Secure'}</span>
              </div>
            </div>

            {/* 1. Customer Account & Activation Form */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '20px 22px',
                boxShadow: '0 8px 30px rgba(0, 3, 13, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {isAr ? '1. بيانات المشترك للتفعيل' : '1. Subscriber Activation Details'}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    {isAr ? 'الاسم بالكامل:' : 'Full Name:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isAr ? 'مثال: طارق المنصور' : 'e.g. John Doe'}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      background: 'rgba(1, 7, 30, 0.6)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {isAr ? 'البريد الإلكتروني (Gmail / البريد المعتمد):' : 'Email Address (Gmail / Account):'}
                    </label>
                    {isCheckingLiveEmail && (
                      <span style={{ fontSize: '11px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="animate-spin" style={{ display: 'inline-block', width: '8px', height: '8px', border: '1.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                        {isAr ? 'جاري فحص الاشتراك...' : 'Checking access...'}
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@gmail.com"
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      background: 'rgba(1, 7, 30, 0.6)',
                      border: existingLiveAccess ? '1.5px solid var(--success)' : '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      direction: 'ltr',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {isAr ? 'رقم الهاتف / الواتساب:' : 'Phone / WhatsApp Number:'}
                    </label>
                    {!user?.phoneNumber && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          color: '#FBBF24',
                          background: 'rgba(251, 191, 36, 0.12)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          fontWeight: 600,
                        }}
                      >
                        {isAr ? 'مطلوب إدخاله' : 'Required'}
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+20 10 1234 5678"
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 12px',
                        paddingInlineStart: '36px',
                        borderRadius: '8px',
                        background: 'rgba(1, 7, 30, 0.6)',
                        border: !phone?.trim() && !user?.phoneNumber ? '1.5px solid rgba(251, 191, 36, 0.6)' : '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        direction: 'ltr',
                      }}
                    />
                    <FiPhone
                      size={14}
                      color="var(--primary)"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        [isAr ? 'right' : 'left']: '12px',
                      }}
                    />
                  </div>
                  {!user?.phoneNumber && (
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      {isAr ? 'غير مسجل بقاعدة البيانات: سيتم حفظه تلقائياً بحسابك لتفعيل الطلب' : 'Not on file: will be saved to your profile upon order submission'}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    {isAr ? 'معرف حساب تيليجرام (اختياري للـ VIP):' : 'Telegram Handle (Optional for VIP):'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={telegramHandle}
                      onChange={(e) => setTelegramHandle(e.target.value)}
                      placeholder="@your_telegram"
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 12px',
                        paddingInlineStart: '36px',
                        borderRadius: '8px',
                        background: 'rgba(1, 7, 30, 0.6)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        direction: 'ltr',
                      }}
                    />
                    <FaTelegramPlane
                      size={14}
                      color="#0488F8"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        [isAr ? 'right' : 'left']: '12px',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Condition: If existingLiveAccess is present for live/webinar, cancel payment UI and display code only */}
            {existingLiveAccess ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(22, 199, 132, 0.12) 0%, rgba(6, 20, 47, 0.95) 100%)',
                  border: '2px solid var(--success)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 12px 40px rgba(0, 3, 13, 0.5), 0 0 30px rgba(22, 199, 132, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  animation: 'fadeIn 0.25s ease-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(22, 199, 132, 0.2)',
                      border: '2px solid var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--success)',
                      flexShrink: 0,
                    }}
                  >
                    <FiCheckCircle size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--success)', margin: '0 0 2px 0' }}>
                      {isAr ? 'تم التحقق: حسابك مسجل مسبقاً ولديك كود دخول نشط!' : 'Verified: Active Passcode Found!'}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      {isAr
                        ? `البريد الإلكتروني (${existingLiveAccess.email}) يملك كود دخول معتمد لهذا الكورس المباشر. تم إلغاء صفحة الدفع لتفادي السداد المزدوج.`
                        : `Email (${existingLiveAccess.email}) already holds an active passcode. Payment form has been dismissed.`}
                    </p>
                  </div>
                </div>

                {/* Passcode Card */}
                <div
                  style={{
                    background: '#00030D',
                    border: '1px dashed rgba(251, 135, 4, 0.6)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#A7AFBF', display: 'block', marginBottom: '4px' }}>
                      {isAr ? 'كود الدخول المعتمد الخاص بك (Access Code):' : 'Your Approved Access Code:'}
                    </span>
                    <span
                      style={{
                        fontSize: '22px',
                        fontWeight: 900,
                        fontFamily: 'monospace',
                        color: '#FFFFFF',
                        letterSpacing: '2px',
                      }}
                    >
                      {existingLiveAccess.accessCode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(existingLiveAccess.accessCode);
                      setCopiedTicketCode(true);
                      setTimeout(() => setCopiedTicketCode(false), 2000);
                    }}
                    style={{
                      background: copiedTicketCode ? 'var(--success)' : 'rgba(251, 135, 4, 0.2)',
                      border: '1px solid var(--accent)',
                      color: copiedTicketCode ? '#000' : 'var(--accent)',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {copiedTicketCode ? <FiCheck size={15} /> : <FiCopy size={15} />}
                    <span>{copiedTicketCode ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ كود الدخول' : 'Copy Code')}</span>
                  </button>
                </div>

                {/* Enter Live Classroom Button */}
                <Link
                  href={getAppRoute(
                    `/live/${encodeURIComponent(existingLiveAccess.session?.slug || existingLiveAccess.session?.id || itemId || 'current')}?code=${encodeURIComponent(existingLiveAccess.accessCode)}`,
                    user
                  )}
                  onClick={() => {
                    try {
                      localStorage.setItem('fxengin_webinar_registered', 'true');
                      const targetId = existingLiveAccess.session?.id || itemId || 'current';
                      localStorage.setItem(`fxengin_live_code_${targetId}`, existingLiveAccess.accessCode);
                    } catch {}
                  }}
                  className="btn-primary"
                  style={{
                    height: '48px',
                    fontSize: '14.5px',
                    fontWeight: 800,
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--accent-gradient)',
                    boxShadow: '0 6px 24px rgba(251, 135, 4, 0.45)',
                    textDecoration: 'none',
                    color: '#FFFFFF',
                  }}
                >
                  <FiKey size={18} />
                  <span>{isAr ? 'الدخول لقاعة البث المباشر بالكود الآن' : 'Enter Live Classroom With Code'}</span>
                  {isAr ? <FiArrowLeft size={16} /> : <FiArrowRight size={16} />}
                </Link>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('');
                      setExistingLiveAccess(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '11.5px',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    {isAr ? 'استخدام بريد إلكتروني آخر للدفع وحجز مقعد جديد' : 'Use a different email address'}
                  </button>
                </div>
              </div>
            ) : (
              /* 2. Payment Methods Selector */
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  boxShadow: '0 8px 30px rgba(0, 3, 13, 0.35)',
                }}
              >
                <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 14px 0' }}>
                  {isAr ? '2. اختر وسيلة الدفع' : '2. Select Payment Method'}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                  {/* Support Desk Manual Tab */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('support')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '12px',
                      border: paymentMethod === 'support' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: paymentMethod === 'support' ? 'rgba(4, 136, 248, 0.15)' : 'rgba(1, 7, 30, 0.5)',
                      color: paymentMethod === 'support' ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <FaTelegramPlane size={20} color="#0488F8" />
                    <span style={{ fontSize: '12.5px', fontWeight: 800 }}>{isAr ? 'الدفع عبر USDT' : 'Pay via USDT'}</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>{isAr ? 'شبكة TRC-20 حصراً' : 'TRC-20 Network'}</span>
                  </button>

                  {/* Enter Code Tab */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('code')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '12px',
                      border: paymentMethod === 'code' ? '2px solid #FB8704' : '1px solid var(--border)',
                      background: paymentMethod === 'code' ? 'rgba(251, 135, 4, 0.15)' : 'rgba(1, 7, 30, 0.5)',
                      color: paymentMethod === 'code' ? '#FB8704' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <FiKey size={20} color="#FB8704" />
                    <span style={{ fontSize: '12.5px', fontWeight: 800 }}>{isAr ? 'تفعيل كود الدفع' : 'Enter Access Code'}</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>{isAr ? 'كود معتمد من الدعم' : 'Manual Ticket Code'}</span>
                  </button>
                </div>

                {/* ── Tab 1: Manual Payment via Support Desk ── */}
                {paymentMethod === 'support' && (
                  <div
                    style={{
                      background: 'rgba(1, 7, 30, 0.7)',
                      border: '1px solid var(--border)',
                      borderRadius: '14px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiHeadphones size={17} color="var(--primary)" />
                        <span>{isAr ? 'وسيلة الدفع المعتمدة: USDT (شبكة TRC-20)' : 'Exclusive Payment Method: USDT (TRC-20)'}</span>
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                        {isAr
                          ? 'طريقة الدفع المقبولة والمعتمدة رسمياً هي عملة USDT المشفرة عبر شبكة Tron (TRC-20) فقط:'
                          : 'The only accepted payment method is USDT cryptocurrency on the Tron (TRC-20) network:'}
                      </p>
                    </div>

                    {/* Supported Methods Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {[
                        isAr ? 'عملة USDT (شبكة TRC-20)' : 'USDT (TRC-20)',
                        isAr ? 'سداد مشفر فوري وآمن' : 'Instant & Secure Crypto',
                        isAr ? 'التحويل الوحيد المعتمد' : 'Exclusive Approved Method',
                      ].map((m, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'rgba(251, 135, 4, 0.12)',
                            border: '1px solid rgba(251, 135, 4, 0.3)',
                            color: '#FB8704',
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>

                    {/* USDT TRC-20 Wallet Box */}
                    <div
                      style={{
                        background: 'rgba(2, 8, 24, 0.85)',
                        border: '1px solid rgba(251, 135, 4, 0.35)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: '#FB8704', fontWeight: 800 }}>
                          {isAr ? 'عنوان محفظة USDT (شبكة TRC-20):' : 'USDT TRC-20 Official Wallet Address:'}
                        </span>
                        <span style={{ fontSize: '10px', background: 'rgba(251, 135, 4, 0.2)', color: '#FB8704', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                          Tron TRC-20
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code
                          style={{
                            background: 'rgba(0, 0, 0, 0.5)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#38bdf8',
                            fontFamily: 'monospace',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          TYDzsxdCzrG8d9V616h2UoXN589146L2f7
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== 'undefined') {
                              navigator.clipboard.writeText('TYDzsxdCzrG8d9V616h2UoXN589146L2f7');
                              alert(isAr ? 'تم نسخ عنوان محفظة USDT بنجاح!' : 'USDT Wallet address copied!');
                            }
                          }}
                          style={{
                            background: 'rgba(4, 136, 248, 0.2)',
                            border: '1px solid rgba(4, 136, 248, 0.4)',
                            color: '#38bdf8',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isAr ? 'نسخ' : 'Copy'}
                        </button>
                      </div>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        {isAr
                          ? 'يرجى التأكد من التحويل عبر شبكة TRC-20 حصراً وإرسال إجمالي المبلغ المطلوب.'
                          : 'Please ensure you send via Tron (TRC-20) network only.'}
                      </span>
                    </div>

                    {/* Support Desk Direct Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <a
                        href={`https://t.me/${(product.kind === 'course' || type === 'course') ? 'FXENGINEducation' : 'FXenginsignals'}?text=${encodeURIComponent(
                          isAr
                            ? `مرحباً فريق دعم ${(product.kind === 'course' || type === 'course') ? 'أكاديمية ودورات' : ''} FXENGIN،\nأود الاستفسار عن وسائل الدفع والتسجيل المتاحة في (${product.titleAr || 'الدورة'}).`
                            : `Hello FXENGIN ${(product.kind === 'course' || type === 'course') ? 'Academy' : 'Support'} Team,\nI would like to inquire about payment and enrollment options for (${product.titleEn || 'this course'}).`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '11px',
                          borderRadius: '8px',
                          background: 'rgba(4, 136, 248, 0.15)',
                          border: '1px solid rgba(4, 136, 248, 0.4)',
                          color: '#38bdf8',
                          textDecoration: 'none',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <FaTelegramPlane size={17} />
                        <span>{isAr ? 'دعم تيليجرام' : 'Telegram Desk'}</span>
                      </a>

                      <a
                        href="mailto:fxengin519@gmail.com"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '11px',
                          borderRadius: '8px',
                          background: 'rgba(4, 136, 248, 0.15)',
                          border: '1px solid rgba(4, 136, 248, 0.4)',
                          color: '#38bdf8',
                          textDecoration: 'none',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <FiMail size={17} />
                        <span>{isAr ? 'بريد الدعم' : 'Support Email'}</span>
                      </a>
                    </div>

                    {/* Receipt / Notes Field */}
                    <div>
                      <label style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                        {isAr ? 'ملاحظات التحويل أو رقم العملية / اسم صاحب الحساب (اختياري لتسريع التفعيل):' : 'Transfer Notes / Ref / Sender Name (optional):'}
                      </label>
                      <input
                        type="text"
                        value={txid}
                        onChange={(e) => setTxid(e.target.value)}
                        placeholder={isAr ? 'أدخل هاش التحويل (TxID) أو عنوان محفظة USDT' : 'e.g. USDT TxID / Hash / Wallet Address'}
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          background: 'rgba(0, 3, 13, 0.7)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                        }}
                      />
                    </div>

                    {/* Link to Enter Code */}
                    <div
                      style={{
                        background: 'rgba(251, 135, 4, 0.08)',
                        border: '1px solid rgba(251, 135, 4, 0.25)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {isAr ? 'هل أتممت الدفع مسبقاً واستلمت كود الحجز من الدعم؟' : 'Already paid and received your activation code?'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('code')}
                        style={{
                          background: 'var(--accent)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {isAr ? 'ادخل الكود هنا' : 'Enter Code Here'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Tab 2: Enter Manual Code ── */}
                {paymentMethod === 'code' && (
                  <div
                    style={{
                      background: 'rgba(1, 7, 30, 0.7)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiKey size={15} />
                      <span>{isAr ? 'تفعيل الاشتراك بكود الدفع اليدوي' : 'Manual Payment Code Activation'}</span>
                    </h4>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {isAr
                      ? 'إذا أتممت الدفع يدوياً عبر الدعم أو تمتلك كود تفعيل معتمد، أدخله هنا لتفعيل طلبك فوراً:'
                      : 'If you completed payment via support or hold an access code, enter it below for instant activation:'}
                  </p>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '5px' }}>
                      {isAr ? 'كود التفعيل / رقم التذكرة (Access Code):' : 'Access Code / Ticket Number:'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isAr ? 'مثال: FX-LIVE-1234 أو كود الدعم...' : 'e.g. FX-LIVE-1234 or Support Code...'}
                      value={manualAccessCode}
                      onChange={(e) => {
                        setManualAccessCode(e.target.value);
                        setManualCodeError('');
                      }}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        background: 'rgba(0, 3, 13, 0.8)',
                        border: manualCodeError ? '1px solid var(--error)' : '1px solid var(--border)',
                        color: 'var(--accent)',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                      }}
                    />
                    {manualCodeError && (
                      <span style={{ fontSize: '11px', color: 'var(--error)', display: 'block', marginTop: '4px' }}>
                        {manualCodeError}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          </div>

          {/* ── Column 2 (Left in RTL): Order Summary & Confirm Payment ── */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '22px 24px',
              boxShadow: '0 12px 36px rgba(0, 3, 13, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {isAr ? 'ملخص الفاتورة وتأكيد الدفع' : 'Order Summary & Payment'}
            </h3>

            {/* Selected Product Box */}
            <div
              style={{
                background: 'rgba(1, 7, 30, 0.65)',
                border: `1px solid ${product.badgeColor}40`,
                borderRadius: '12px',
                padding: '14px 16px',
              }}
            >
              {type === 'course' && isCourseLoading && !dbCourseData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '6px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: '85px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ width: '70px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }} />
                  </div>
                  <div style={{ width: '80%', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                  <div style={{ width: '50%', height: '13px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }} />
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '5px',
                        background: `${product.badgeColor}22`,
                        border: `1px solid ${product.badgeColor}50`,
                        color: product.badgeColor,
                      }}
                    >
                      {isAr ? product.badgeAr : product.badgeEn}
                    </span>
                    {product.hasDiscount ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospace' }}>
                          {product.priceStr}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'line-through', fontFamily: 'monospace' }}>
                          {product.originalPriceStr}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {product.priceStr}
                      </span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    {isAr ? product.titleAr : product.titleEn}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {isAr ? product.subtitleAr : product.subtitleEn}
                  </p>
                </>
              )}
            </div>

            {/* Perks Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(isAr ? product.perksAr : product.perksEn).map((perk, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                  <FiCheckCircle size={14} color="var(--success)" style={{ flexShrink: 0 }} />
                  <span>{perk}</span>
                </div>
              ))}
            </div>

            {existingLiveAccess ? (
              <div
                style={{
                  background: 'rgba(22, 199, 132, 0.1)',
                  border: '1.5px solid rgba(22, 199, 132, 0.35)',
                  borderRadius: '12px',
                  padding: '18px 16px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--success)' }}>
                  {isAr ? 'حالة التذكرة: معتمدة ومسجلة' : 'Ticket Status: Confirmed & Paid'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {isAr
                    ? 'تم التحقق من كودك بنجاح ولا يتطلب هذا الحساب أي عملية دفع أو سداد إضافي.'
                    : 'Account verified. No further payment is required for this ticket.'}
                </span>
              </div>
            ) : (
              <>
                {/* Promo Code Box */}
                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                    {isAr ? 'كوبون الخصم:' : 'Discount Promo Code:'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder={isAr ? 'رمز الكوبون (مثال: FXENGIN)' : 'Code (e.g., FXENGIN)'}
                      style={{
                        flex: 1,
                        height: '36px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        background: 'rgba(1, 7, 30, 0.6)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        fontFamily: 'monospace',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon}
                      style={{
                        padding: '0 14px',
                        borderRadius: '8px',
                        background: 'var(--primary)',
                        color: '#FFF',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: isValidatingCoupon ? 'wait' : 'pointer',
                        opacity: isValidatingCoupon ? 0.7 : 1,
                      }}
                    >
                      {isValidatingCoupon ? (isAr ? 'جاري الفحص...' : 'Validating...') : (isAr ? 'تطبيق' : 'Apply')}
                    </button>
                  </div>
                  {couponApplied && (
                    <span style={{ fontSize: '11px', color: 'var(--success)', display: 'block', marginTop: '4px', fontWeight: 600 }}>
                      {couponMessage || (isAr ? `تم تطبيق خصم بقيمة ${discountAmountVal} USDT بنجاح!` : `Discount applied!`)}
                    </span>
                  )}
                  {couponError && (
                    <span style={{ fontSize: '11px', color: 'var(--error)', display: 'block', marginTop: '4px' }}>
                      {couponError}
                    </span>
                  )}
                </div>

                {/* Price Breakdown */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {type === 'course' && isCourseLoading && !dbCourseData ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        {isAr ? 'جاري تحميل تفاصيل السعر...' : 'Loading pricing details...'}
                      </span>
                      <span style={{ fontSize: '14px', color: 'var(--accent)', fontFamily: 'monospace' }}>...</span>
                    </div>
                  ) : (
                    <>
                      {product.hasDiscount ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                            <span>{isAr ? 'السعر الأصلي (قبل الخصم):' : 'Original Price:'}</span>
                            <span style={{ fontFamily: 'monospace', textDecoration: 'line-through' }}>{product.originalPriceStr}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#F6465D', fontWeight: 600 }}>
                            <span>{isAr ? `خصم الكورس المباشر (${product.discountPercent}%):` : `Course Discount (${product.discountPercent}%):`}</span>
                            <span style={{ fontFamily: 'monospace' }}>
                              -{product.originalPriceVal - product.priceVal} USDT
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 600 }}>
                            <span>{isAr ? 'السعر بعد الخصم:' : 'Discounted Price:'}</span>
                            <span style={{ fontFamily: 'monospace' }}>{product.priceVal} USDT</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                          <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                          <span style={{ fontFamily: 'monospace' }}>{product.priceVal} USDT</span>
                        </div>
                      )}

                      {(discountAmountVal > 0 || discountPercent > 0) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--success)', fontWeight: 600 }}>
                          <span>{isAr ? (discountPercent > 0 ? `خصم الكوبون (${discountPercent}%):` : 'قيمة خصم الكوبون:') : 'Discount:'}</span>
                          <span style={{ fontFamily: 'monospace' }}>
                            -{discountAmountVal > 0 ? discountAmountVal : Math.round(product.priceVal * (discountPercent / 100))} USDT
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          fontSize: '15px',
                          fontWeight: 900,
                          color: 'var(--text-primary)',
                          paddingTop: '6px',
                          borderTop: '1px dashed var(--border)',
                        }}
                      >
                        <span>{isAr ? 'المبلغ المستحق للدفع:' : 'Total Due:'}</span>
                        <span style={{ fontSize: '22px', color: 'var(--accent)', fontFamily: 'monospace' }}>
                          {finalPrice} USDT
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Big Action Submit Button */}
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (type === 'course' && isCourseLoading && !dbCourseData) ||
                    (paymentMethod !== 'code' && (Boolean(existingOrderInfo) || hasActiveEntitlement))
                  }
                  className="btn-primary"
                  style={{
                    height: '48px',
                    fontSize: '14.5px',
                    fontWeight: 800,
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background:
                      paymentMethod !== 'code' && hasActiveEntitlement
                        ? 'rgba(255, 255, 255, 0.1)'
                        : paymentMethod === 'code'
                        ? 'linear-gradient(135deg, #FB8704 0%, #E67600 100%)'
                        : 'linear-gradient(135deg, #0488F8 0%, #0370CE 100%)',
                    boxShadow:
                      paymentMethod !== 'code' && hasActiveEntitlement
                        ? 'none'
                        : paymentMethod === 'code'
                        ? '0 6px 24px rgba(251, 135, 4, 0.4)'
                        : '0 6px 24px rgba(4, 136, 248, 0.4)',
                    cursor:
                      isSubmitting || (paymentMethod !== 'code' && hasActiveEntitlement)
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      isSubmitting || (paymentMethod !== 'code' && hasActiveEntitlement)
                        ? 0.7
                        : 1,
                    marginTop: '4px',
                    width: '100%',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                  }}
                >
                  {isSubmitting ? (
                    <span>{isAr ? 'جارٍ تسجيل الطلب والتحويل للتليجرام...' : 'Processing & Redirecting to Telegram...'}</span>
                  ) : paymentMethod !== 'code' && hasActiveEntitlement ? (
                    <>
                      <FiCheckCircle size={17} />
                      <span>{isAr ? 'أنت مشترك بالفعل في هذه الدورة' : 'Already Enrolled'}</span>
                    </>
                  ) : paymentMethod !== 'code' && existingOrderInfo ? (
                    <>
                      <FaTelegramPlane size={17} />
                      <span>
                        {isAr
                          ? `تأكيد الدفع ومتابعة الطلب عبر تيليجرام (#${existingOrderInfo.orderNumber}) ←`
                          : `Confirm & Follow up on Telegram (#${existingOrderInfo.orderNumber}) →`}
                      </span>
                    </>
                  ) : paymentMethod === 'code' ? (
                    <>
                      <FiKey size={16} />
                      <span>{isAr ? 'تأكيد وتفعيل الكود الآن ←' : 'Verify & Activate Code Now →'}</span>
                    </>
                  ) : (
                    <>
                      <FaTelegramPlane size={17} />
                      <span>{isAr ? 'تأكيد الدفع والتواصل عبر تيليجرام ←' : 'Confirm Payment & Chat on Telegram →'}</span>
                    </>
                  )}
                </button>

                {paymentMethod !== 'code' && !hasActiveEntitlement && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11.5px',
                      color: '#38bdf8',
                      background: 'rgba(4, 136, 248, 0.08)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(4, 136, 248, 0.2)',
                      marginTop: '6px',
                      lineHeight: 1.5,
                    }}
                  >
                    <FaTelegramPlane size={14} style={{ flexShrink: 0 }} />
                    <span>
                      {isAr
                        ? 'سيتم تحويلك مباشرة إلى تيليجرام مع رسالة جاهزة تتضمن كافة تفاصيل طلبك لتأكيد السداد فوراً.'
                        : 'You will be redirected to Telegram with a pre-filled message of your order details for instant review.'}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Trust Seal */}
            <div
              style={{
                paddingTop: '10px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}
            >
              <FiAward size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>
                {isAr
                  ? 'ضمان الرضا 100% — تفعيل ومتابعة مستمرة ودعم مباشر على مدار الساعة عبر فريق FXENGIN.'
                  : '100% Satisfaction Guarantee — Continuous dedicated support by FXENGIN financial specialists.'}
              </span>
            </div>

          </div>

        </form>
        </>
        )}

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#fff' }}>Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
