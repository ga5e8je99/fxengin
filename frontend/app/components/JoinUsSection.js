'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiShare2,
  FiCopy,
  FiCheck,
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
  FiMousePointer,
  FiAward,
  FiShield,
  FiCheckCircle,
  FiArrowRight,
  FiArrowLeft,
  FiInfo,
  FiExternalLink,
  FiClock,
  FiZap,
  FiBookOpen,
  FiLayers,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiAlertCircle,
  FiImage,
  FiDownload,
  FiEye,
  FiX,
} from 'react-icons/fi';
import { FaWhatsapp, FaTelegramPlane, FaFacebook, FaTwitter } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from '../utils/toast';
import Anim from './Anim';

export default function JoinUsSection({ onlyLoggedIn = true, showHeader = true }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { locale, isAr } = useLanguage();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPartner, setIsPartner] = useState(false);
  const [partnerData, setPartnerData] = useState(null);
  const [conversions, setConversions] = useState([]);
  const [referredUsers, setReferredUsers] = useState([]);
  const [payouts, setPayouts] = useState([]);

  // Creatives (المواد التسويقية والإعلانات) State
  const [creatives, setCreatives] = useState([]);
  const [showCreativesModal, setShowCreativesModal] = useState(false);
  const [copiedCreativeId, setCopiedCreativeId] = useState(null);
  const [creativeFilter, setCreativeFilter] = useState('ALL');
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

  // Active Tab: 'subscriptions' (المشتركون في الكورسات والجروبات) | 'leads' (المسجلون عبر رابطك) | 'mechanism' (آلية العمل) | 'payouts' (السحوبات)
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [subFilter, setSubFilter] = useState('ALL'); // 'ALL' | 'COURSE' | 'GROUP'
  const [searchQuery, setSearchQuery] = useState('');

  // Join flow state
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Link copy state
  const [copied, setCopied] = useState(false);

  // Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('USDT_TRC20');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Calculator State (for Mechanism Tab)
  const [calcReferrals, setCalcReferrals] = useState(15);
  const [calcAvgPrice, setCalcAvgPrice] = useState(150);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchCreatives = useCallback(async () => {
    try {
      const res = await fetch(`/api/affiliate?creatives=true&_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.creatives)) {
          setCreatives(json.creatives);
        }
      }
    } catch (e) {
      console.warn('Failed to load creatives:', e);
    }
  }, []);

  useEffect(() => {
    fetchCreatives();
  }, [fetchCreatives]);

  const fetchPartnerStatus = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const url = `/api/affiliate?userId=${encodeURIComponent(user.id || '')}&email=${encodeURIComponent(user.email || '')}&_t=${Date.now()}`;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.isPartner && json.partner) {
          setIsPartner(true);
          setPartnerData(json.partner);
          setConversions(json.conversions || []);
          setReferredUsers(json.referredUsers || []);
          setPayouts(json.payouts || []);
          if (Array.isArray(json.creatives) && json.creatives.length > 0) {
            setCreatives(json.creatives);
          }
          try {
            localStorage.setItem('fxengin_is_partner', 'true');
            window.dispatchEvent(
              new CustomEvent('fxengin:partner_status_changed', {
                detail: { isPartner: true, partner: json.partner },
              })
            );
          } catch (e) {}
        } else {
          setIsPartner(false);
          setPartnerData(null);
          setConversions([]);
          setReferredUsers([]);
          setPayouts([]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch partner info:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      fetchPartnerStatus();
      const interval = setInterval(fetchPartnerStatus, 10000);
      const onFocus = () => fetchPartnerStatus();
      window.addEventListener('focus', onFocus);
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', onFocus);
      };
    } else {
      setLoading(false);
    }
  }, [mounted, isAuthenticated, user, fetchPartnerStatus]);

  const currentOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://fxengen.com';

  const referralCode = partnerData?.referralCode || '';
  const referralLink = `${currentOrigin}/?ref=${referralCode}`;

  const copyReferralLink = () => {
    if (!referralLink) return;
    try {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      showToast.success(isAr ? 'تم نسخ رابط الإحالة بنجاح!' : 'Referral link copied!');
      setTimeout(() => setCopied(false), 2400);
    } catch (e) {
      showToast.error(isAr ? 'تعذر نسخ الرابط' : 'Failed to copy link');
    }
  };

  const handleCopyCaption = (rawCaption, creativeId) => {
    const cleanLink = referralLink || `${currentOrigin}/?ref=${referralCode}`;
    let finalCaption = rawCaption || '';
    if (finalCaption.includes('{LINK}')) {
      finalCaption = finalCaption.replace(/\{LINK\}/g, cleanLink);
    } else {
      finalCaption = `${finalCaption}\n\n${isAr ? 'رابط التسجيل والاشتراك:' : 'Registration link:'}\n${cleanLink}`;
    }

    try {
      navigator.clipboard.writeText(finalCaption);
      setCopiedCreativeId(creativeId);
      showToast.success(isAr ? 'تم نسخ المنشور مع رابط إحالتك بنجاح!' : 'Post caption copied with your link!');
      setTimeout(() => setCopiedCreativeId(null), 2500);
    } catch {
      showToast.error(isAr ? 'تعذر نسخ النص' : 'Failed to copy text');
    }
  };

  const handleDownloadImage = async (url, title = 'ad') => {
    if (!url) return;
    try {
      showToast.info(isAr ? 'جاري تجهيز الصورة للتحميل...' : 'Preparing image download...');
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanName = (title || 'fxengin-ad').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_');
      link.download = `${cleanName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast.success(isAr ? 'تم تنزيل الصورة بنجاح!' : 'Image downloaded successfully!');
    } catch {
      window.open(url, '_blank');
    }
  };

  const getCreativeShareUrls = (rawCaption) => {
    const cleanLink = referralLink || `${currentOrigin}/?ref=${referralCode}`;
    let finalCaption = rawCaption || '';
    if (finalCaption.includes('{LINK}')) {
      finalCaption = finalCaption.replace(/\{LINK\}/g, cleanLink);
    } else {
      finalCaption = `${finalCaption}\n\n${cleanLink}`;
    }

    const encodedText = encodeURIComponent(finalCaption);
    const encodedUrl = encodeURIComponent(cleanLink);

    return {
      whatsapp: `https://api.whatsapp.com/send?text=${encodedText}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    };
  };

  const filteredCreatives = useMemo(() => {
    if (creativeFilter === 'ALL') return creatives;
    return creatives.filter((c) => (c.badge || '').includes(creativeFilter) || creativeFilter.includes(c.badge || ''));
  }, [creatives, creativeFilter]);

  const handleJoin = useCallback(async () => {
    // If not authenticated, redirect to login with return target
    if (!user?.id || !isAuthenticated) {
      try {
        localStorage.setItem('fxengin_pending_affiliate_join', 'true');
        sessionStorage.setItem('fxengin_pending_affiliate_join', 'true');
      } catch (e) {}
      showToast.info(
        isAr
          ? 'يرجى تسجيل الدخول أولاً لتفعيل حساب الشريك ورابط الإحالة الخاص بك'
          : 'Please sign in first to activate your partner link'
      );
      const returnTarget = typeof window !== 'undefined'
        ? (window.location.pathname.includes('/profile') ? '/profile?tab=affiliate&autoJoin=true' : '/join-us?autoJoin=true')
        : '/join-us?autoJoin=true';
      if (typeof window !== 'undefined') {
        window.location.href = `/login?redirect=${encodeURIComponent(returnTarget)}`;
      } else {
        router.push(`/login?redirect=${encodeURIComponent(returnTarget)}`);
      }
      return;
    }

    if (!agreedToTerms) {
      setAgreedToTerms(true);
    }

    setIsJoining(true);
    try {
      const res = await fetch('/api/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          userId: user.id,
          userName: user.fullName || '',
          userEmail: user.email || '',
          userPhone: user.phoneNumber || '',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast.success(
          isAr
            ? 'مرحباً بك كشريك مع FXENGIN! تم تفعيل رابط الإحالة الخاص بك بنجاح (10% عمولة).'
            : 'Welcome to FXENGIN Partners! Your referral link is now active.'
        );
        setIsPartner(true);
        setPartnerData(data.partner);
        try {
          localStorage.removeItem('fxengin_pending_affiliate_join');
          sessionStorage.removeItem('fxengin_pending_affiliate_join');
          localStorage.setItem('fxengin_is_partner', 'true');
          window.dispatchEvent(
            new CustomEvent('fxengin:partner_status_changed', {
              detail: { isPartner: true, partner: data.partner },
            })
          );
        } catch (e) {}
        fetchPartnerStatus();
      } else {
        showToast.error(data?.message || data?.error || (isAr ? 'فشل الانضمام' : 'Failed to join'));
      }
    } catch (err) {
      console.error('Join partner error:', err);
      showToast.error(isAr ? 'حدث خطأ أثناء الانضمام' : 'An error occurred');
    } finally {
      setIsJoining(false);
    }
  }, [user, isAuthenticated, agreedToTerms, isAr, router, fetchPartnerStatus]);

  // Auto-join effect when returning after login
  useEffect(() => {
    if (mounted && isAuthenticated && user?.id && !loading && !isPartner) {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const isAutoJoin = urlParams?.get('autoJoin') === 'true' ||
        (typeof window !== 'undefined' && localStorage.getItem('fxengin_pending_affiliate_join') === 'true');

      if (isAutoJoin && !isJoining) {
        try {
          localStorage.removeItem('fxengin_pending_affiliate_join');
          sessionStorage.removeItem('fxengin_pending_affiliate_join');
        } catch (e) {}
        setAgreedToTerms(true);
        handleJoin();
      }
    }
  }, [mounted, isAuthenticated, user, loading, isPartner, isJoining, handleJoin]);

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(payoutAmount);
    const available = parseFloat(partnerData?.availableBalance || 0);

    if (isNaN(amountNum) || amountNum <= 0) {
      showToast.error(isAr ? 'يرجى إدخال مبلغ صحيح للسحب' : 'Please enter a valid amount');
      return;
    }

    if (amountNum > available) {
      showToast.error(isAr ? 'المبلغ المطلوب أكبر من رصيدك المتاح' : 'Amount exceeds available balance');
      return;
    }

    if (amountNum < 100) {
      showToast.error(isAr ? 'الحد الأدنى لطلب السحب هو 100 دولار' : 'Minimum payout is $100');
      return;
    }

    if (!payoutDetails.trim()) {
      showToast.error(isAr ? 'يرجى إدخال بيانات تحويل وسيلة السحب' : 'Please provide payout account details');
      return;
    }

    setSubmittingPayout(true);
    try {
      const res = await fetch('/api/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_payout',
          userId: user.id,
          amount: amountNum,
          method: payoutMethod,
          accountDetails: payoutDetails.trim(),
          notes: payoutNotes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast.success(
          isAr
            ? 'تم استلام طلب السحب بنجاح! سيتم التحويل والمراجعة خلال 24-48 ساعة عمل.'
            : 'Payout request submitted successfully!'
        );
        setShowPayoutModal(false);
        setPayoutAmount('');
        setPayoutDetails('');
        setPayoutNotes('');
        fetchPartnerStatus();
      } else {
        showToast.error(data?.error || data?.message || (isAr ? 'فشل إرسال طلب السحب' : 'Payout request failed'));
      }
    } catch (err) {
      console.error('Payout request error:', err);
      showToast.error(isAr ? 'حدث خطأ أثناء إرسال طلب السحب' : 'An error occurred');
    } finally {
      setSubmittingPayout(false);
    }
  };

  const shareTextAr = encodeURIComponent(
    `انضم لمنصة FXENGIN للتعليم والتداول المالي الاحترافي، واستفد من أقوى الدورات وتحليلات السوق اللحظية وتوصيات VIP!\nسجل الآن عبر الرابط:\n${referralLink}`
  );
  const shareTextEn = encodeURIComponent(
    `Elevate your trading with FXENGIN! Join top-tier courses, VIP signals, and market analysis.\nRegister now:\n${referralLink}`
  );
  const shareText = isAr ? shareTextAr : shareTextEn;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${isAr ? encodeURIComponent('انضم الآن لمنصة FXENGIN للتعليم والتداول المالي') : encodeURIComponent('Join FXENGIN Trading Platform')}`;

  // Filtered subscriptions (Conversions)
  const filteredConversions = useMemo(() => {
    if (!Array.isArray(conversions)) return [];
    return conversions.filter((c) => {
      if (!c) return false;
      const pName = String(c.productName || '').toLowerCase();
      // Product type filter
      if (subFilter === 'COURSE') {
        const isCourse =
          c.productType === 'COURSE' ||
          (!c.productType &&
            !pName.includes('group') &&
            !pName.includes('جروب') &&
            !pName.includes('توصيات') &&
            !pName.includes('signals'));
        if (!isCourse) return false;
      }
      if (subFilter === 'GROUP') {
        const isGroup =
          c.productType === 'GROUP' ||
          pName.includes('group') ||
          pName.includes('جروب') ||
          pName.includes('توصيات') ||
          pName.includes('signals') ||
          pName.includes('إشارات');
        if (!isGroup) return false;
      }
      // Status filter
      if (subFilter === 'CONFIRMED') {
        if (c.status !== 'CONFIRMED') return false;
      }
      if (subFilter === 'PENDING') {
        if (c.status === 'CONFIRMED' || c.status === 'REJECTED' || c.status === 'CANCELLED') return false;
      }
      // Text search
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = String(c.buyerName || '').toLowerCase().includes(q);
        const matchesProduct = pName.includes(q);
        const matchesOrder = String(c.orderNumber || '').toLowerCase().includes(q);
        if (!matchesName && !matchesProduct && !matchesOrder) return false;
      }
      return true;
    });
  }, [conversions, subFilter, searchQuery]);

  // Filtered referred users ("المسجلون عبر رابطك")
  const filteredReferredUsers = useMemo(() => {
    if (!Array.isArray(referredUsers)) return [];
    if (!searchQuery || !searchQuery.trim()) return referredUsers;
    const q = searchQuery.toLowerCase().trim();
    return referredUsers.filter(
      (u) =>
        (u?.userName && String(u.userName).toLowerCase().includes(q)) ||
        (u?.userEmail && String(u.userEmail).toLowerCase().includes(q)) ||
        (u?.userPhone && String(u.userPhone).toLowerCase().includes(q))
    );
  }, [referredUsers, searchQuery]);

  // Counts for courses vs groups
  const coursesCount = useMemo(() => {
    if (!Array.isArray(conversions)) return 0;
    return conversions.filter((c) => {
      if (!c) return false;
      const pName = String(c.productName || '').toLowerCase();
      return (
        c.productType === 'COURSE' ||
        (!c.productType &&
          !pName.includes('group') &&
          !pName.includes('جروب') &&
          !pName.includes('توصيات') &&
          !pName.includes('signals'))
      );
    }).length;
  }, [conversions]);

  const groupsCount = useMemo(() => {
    if (!Array.isArray(conversions)) return 0;
    return conversions.filter((c) => {
      if (!c) return false;
      const pName = String(c.productName || '').toLowerCase();
      return (
        c.productType === 'GROUP' ||
        pName.includes('group') ||
        pName.includes('جروب') ||
        pName.includes('توصيات') ||
        pName.includes('signals') ||
        pName.includes('إشارات')
      );
    }).length;
  }, [conversions]);

  // Counts for confirmed vs unconfirmed subscriptions
  const confirmedCount = useMemo(() => {
    if (!Array.isArray(conversions)) return 0;
    return conversions.filter((c) => c?.status === 'CONFIRMED').length;
  }, [conversions]);

  const pendingCount = useMemo(() => {
    if (!Array.isArray(conversions)) return 0;
    return conversions.filter(
      (c) => c && c.status !== 'CONFIRMED' && c.status !== 'REJECTED' && c.status !== 'CANCELLED'
    ).length;
  }, [conversions]);

  const pendingEarnings = useMemo(() => {
    if (!Array.isArray(conversions)) return 0;
    return conversions
      .filter((c) => c && c.status !== 'CONFIRMED' && c.status !== 'REJECTED' && c.status !== 'CANCELLED')
      .reduce((sum, c) => sum + (Number(c.commissionAmount) || 0), 0);
  }, [conversions]);

  // Don't render until mounted or if unauthenticated when onlyLoggedIn is true
  if (!mounted) return null;
  if (onlyLoggedIn && (!isAuthenticated || !user)) return null;

  return (
    <section
      id="join-us"
      className="section-surface"
      style={{
        background: 'linear-gradient(180deg, #020A1D 0%, #06142F 50%, #01071E 100%)',
        padding: showHeader ? '76px 0' : '36px 0 76px',
        position: 'relative',
        overflow: 'hidden',
        borderTop: showHeader ? '1px solid rgba(251, 135, 4, 0.18)' : 'none',
        borderBottom: '1px solid rgba(4, 136, 248, 0.18)',
      }}
    >
      {/* Background glow effects */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-15%',
          right: '8%',
          width: '520px',
          height: '520px',
          background: 'radial-gradient(circle, rgba(251, 135, 4, 0.14) 0%, transparent 70%)',
          filter: 'blur(75px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '8%',
          width: '520px',
          height: '520px',
          background: 'radial-gradient(circle, rgba(4, 136, 248, 0.14) 0%, transparent 70%)',
          filter: 'blur(75px)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1.25rem', position: 'relative', zIndex: 1 }}>
        {/* Header Title & Badges */}
        {showHeader && (
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Anim effect="fade-up">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.45rem 1.15rem',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, rgba(251, 135, 4, 0.16) 0%, rgba(250, 90, 4, 0.08) 100%)',
                  border: '1px solid rgba(251, 135, 4, 0.45)',
                  color: '#FB8704',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  boxShadow: '0 4px 16px rgba(251, 135, 4, 0.2)',
                }}
              >
                <FiAward size={18} color="#FB8704" />
                <span>{isAr ? 'برنامج الشركاء والإحالة الرسمي • 10% عمولة فورية' : 'Official Partner & Affiliate Program • 10% Instant Commission'}</span>
                <span
                  style={{
                    background: '#FB8704',
                    color: '#000',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                  }}
                >
                  10%
                </span>
              </div>
            </Anim>

            <Anim effect="fade-up" delay={80}>
              <h2
                style={{
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  lineHeight: 1.25,
                  margin: '0 0 1rem',
                  letterSpacing: '-0.02em',
                }}
              >
                {isAr ? (
                  <>
                    برنامج <span style={{ color: '#FB8704' }}>انضم إلينا</span> — شارك واربح 10% من كل كورس أو جروب
                  </>
                ) : (
                  <>
                    Join Us & Earn <span style={{ color: '#FB8704' }}>10%</span> on Every Course & Group Referral
                  </>
                )}
              </h2>
            </Anim>

            <Anim effect="fade-up" delay={140}>
              <p
                style={{
                  fontSize: 'clamp(0.95rem, 1.8vw, 1.125rem)',
                  color: 'rgba(235, 240, 255, 0.78)',
                  maxWidth: '780px',
                  margin: '0 auto',
                  lineHeight: 1.7,
                }}
              >
                {isAr
                  ? 'شارك رابطك الخاص مع مجتمعك؛ وكل شخص يسجل ويشترك في أي دورة تدريبية أو باقة توصيات VIP، تحصل فوراً على 10% عمولة نقدية مباشرة في محفظتك مع سحب فوري.'
                  : 'Share your unique link. When someone joins and subscribes to any course or VIP signals group, you instantly get 10% cash commission with fast withdrawals.'}
              </p>
            </Anim>
          </div>
        )}

        {/* ── STATE 1: NOT YET JOINED (Show Highlights, Mechanism, Terms, and Join Button) ── */}
        {!isPartner ? (
          <Anim effect="fade-up" delay={180}>
            <div
              style={{
                maxWidth: '960px',
                margin: '0 auto',
                background: 'linear-gradient(180deg, rgba(8, 26, 61, 0.85) 0%, rgba(4, 16, 42, 0.85) 100%)',
                border: '1px solid rgba(251, 135, 4, 0.35)',
                borderRadius: '1.25rem',
                padding: 'clamp(1.5rem, 4vw, 2.75rem)',
                boxShadow: '0 20px 50px rgba(0, 3, 13, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* 3 Pillars / Highlights */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '2.5rem',
                }}
              >
                <div
                  style={{
                    background: 'rgba(251, 135, 4, 0.06)',
                    border: '1px solid rgba(251, 135, 4, 0.25)',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    textAlign: isAr ? 'right' : 'left',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #FB8704 0%, #FA5A04 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      marginBottom: '0.875rem',
                      fontWeight: 800,
                    }}
                  >
                    <FiDollarSign size={22} />
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.5rem' }}>
                    {isAr ? '10% عمولة نقدية مباشرة' : '10% Cash Commission'}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(235, 240, 255, 0.72)', lineHeight: 1.6, margin: 0 }}>
                    {isAr
                      ? 'تحصل على 10% من قيمة أي اشتراك في أي دورة تدريبية أو جروب توصيات VIP يدفعها المشترك المحال عبر رابطك.'
                      : 'Earn 10% on every payment made by users subscribing to any course or VIP group through your link.'}
                  </p>
                </div>

                <div
                  style={{
                    background: 'rgba(4, 136, 248, 0.06)',
                    border: '1px solid rgba(4, 136, 248, 0.25)',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    textAlign: isAr ? 'right' : 'left',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0488F8 0%, #0056B3 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF',
                      marginBottom: '0.875rem',
                    }}
                  >
                    <FiShare2 size={22} />
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.5rem' }}>
                    {isAr ? 'رابط دائم وتتبع ذكي 30 يوماً' : '30-Day Cookie Tracking'}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(235, 240, 255, 0.72)', lineHeight: 1.6, margin: 0 }}>
                    {isAr
                      ? 'رابط مخصص باسمك مع كوكيز تدوم 30 يوماً، وتتبع مباشر للأعضاء المسجلين والاشتراكات الناجحة.'
                      : 'Dedicated link with 30-day cookie retention and live dashboard analytics for signups and orders.'}
                  </p>
                </div>

                <div
                  style={{
                    background: 'rgba(0, 230, 118, 0.06)',
                    border: '1px solid rgba(0, 230, 118, 0.25)',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    textAlign: isAr ? 'right' : 'left',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #00E676 0%, #00B359 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      marginBottom: '0.875rem',
                    }}
                  >
                    <FiZap size={22} />
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.5rem' }}>
                    {isAr ? 'سحب فوري ومرن (الحد الأدنى $100)' : 'Fast Flexible Payouts (Min $100)'}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(235, 240, 255, 0.72)', lineHeight: 1.6, margin: 0 }}>
                    {isAr
                      ? 'اسحب أرباحك فوراً عبر USDT (شبكة TRC-20) خلال 24 ساعة.'
                      : 'Withdraw anytime via USDT TRC-20 within 24 hours.'}
                  </p>
                </div>
              </div>

              {/* ── ALYAT AL-AMAL (آلية العمل خطوة بخطوة) ── */}
              <div
                style={{
                  background: 'rgba(3, 13, 34, 0.75)',
                  border: '1px solid rgba(4, 136, 248, 0.25)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
                  <FiLayers size={22} color="#FB8704" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {isAr ? 'آلية عمل برنامج الشركاء والإحالة خطوة بخطوة:' : 'How the Affiliate Program Works Step-by-Step:'}
                  </h3>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <div style={{ background: 'rgba(2, 8, 24, 0.6)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ color: '#FB8704', fontWeight: 900, fontSize: '0.85rem', marginBottom: '0.35rem' }}>1. انسخ رابطك وكودك</div>
                    <div style={{ fontSize: '0.825rem', color: 'rgba(235, 240, 255, 0.75)', lineHeight: 1.5 }}>
                      تحصل على رابط مخصص وكود فريد لمشاركته مع أصدقائك أو على السوشيال ميديا.
                    </div>
                  </div>

                  <div style={{ background: 'rgba(2, 8, 24, 0.6)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ color: '#0488F8', fontWeight: 900, fontSize: '0.85rem', marginBottom: '0.35rem' }}>2. تسجيل العضو (المسجلون عبر رابطك)</div>
                    <div style={{ fontSize: '0.825rem', color: 'rgba(235, 240, 255, 0.75)', lineHeight: 1.5 }}>
                      أي شخص يضغط على رابطك وينشئ حساباً يتم ربطه بك تلقائياً ويظهر في لوحة تحكمك.
                    </div>
                  </div>

                  <div style={{ background: 'rgba(2, 8, 24, 0.6)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ color: '#A855F7', fontWeight: 900, fontSize: '0.85rem', marginBottom: '0.35rem' }}>3. أول اشتراك أو شراء</div>
                    <div style={{ fontSize: '0.825rem', color: 'rgba(235, 240, 255, 0.75)', lineHeight: 1.5 }}>
                      تحتسب العمولة لمرة واحدة عند أول اشتراك في الجروبات أو أول شراء للكورسات (لا تشمل التجديدات أو الجروبات اللاحقة).
                    </div>
                  </div>

                  <div style={{ background: 'rgba(2, 8, 24, 0.6)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ color: '#00E676', fontWeight: 900, fontSize: '0.85rem', marginBottom: '0.35rem' }}>4. استلام 10% وسحب فوري</div>
                    <div style={{ fontSize: '0.825rem', color: 'rgba(235, 240, 255, 0.75)', lineHeight: 1.5 }}>
                      تضاف 10% من قيمة الدفع فوراً لمحفظتك وتطلب سحبها في أي وقت (الحد الأدنى $100).
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions Accordion / Box */}
              <div
                style={{
                  background: 'rgba(3, 13, 34, 0.75)',
                  border: '1px solid rgba(4, 136, 248, 0.25)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                  <FiShield size={20} color="#FB8704" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {isAr ? 'شروط وأحكام برنامج الشركاء والإحالة:' : 'Affiliate Program Terms & Conditions:'}
                  </h3>
                </div>

                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    fontSize: '0.875rem',
                    color: 'rgba(235, 240, 255, 0.75)',
                  }}
                >
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <FiCheckCircle size={16} color="#00E676" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                    <span>{isAr ? 'العمولة ثابتة بنسبة 10% نقدية من القيمة الصافية لكل عملية اشتراك مدفوعة ومؤكدة عبر رابطك.' : 'Fixed 10% cash commission on every confirmed paid course or group order.'}</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <FiCheckCircle size={16} color="#00E676" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                    <span>{isAr ? 'تتبع الإحالة يدوم 30 يوماً عبر كوكيز المتصفح من تاريخ أول زيارة للرابط.' : 'Referral tracking lasts 30 days via cookies from first link visit.'}</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <FiCheckCircle size={16} color="#00E676" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                    <span>{isAr ? 'الحد الأدنى لطلب سحب الأرباح هو 100 دولار أمريكي عبر محفظة USDT (شبكة TRC-20).' : 'Minimum withdrawal request is $100 via USDT TRC-20.'}</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <FiCheckCircle size={16} color="#00E676" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                    <span>{isAr ? 'يمنع الاحتيال أو التسجيل الذاتي للحصول على عمولات من حسابات شخصية لنفس المستخدم.' : 'Self-referral or fraudulent accounts strictly prohibited.'}</span>
                  </li>
                </ul>

                {/* Agreement Checkbox */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginTop: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#FB8704',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>
                    {isAr
                      ? 'أوافق وأقر بجميع شروط وأحكام برنامج الشركاء والإحالة لدى FXENGIN'
                      : 'I agree to the FXENGIN Partner & Affiliate Terms & Conditions'}
                  </span>
                </label>
              </div>

              {/* Join Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={isAuthenticated ? (!agreedToTerms || isJoining) : isJoining}
                  style={{
                    padding: '0.85rem 2.5rem',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    borderRadius: '9999px',
                    border: 'none',
                    background: (!isAuthenticated || agreedToTerms)
                      ? 'linear-gradient(135deg, #FB8704 0%, #FA5A04 100%)'
                      : 'rgba(255, 255, 255, 0.1)',
                    color: (!isAuthenticated || agreedToTerms) ? '#000000' : 'rgba(255, 255, 255, 0.4)',
                    cursor: (!isAuthenticated || (agreedToTerms && !isJoining)) ? 'pointer' : 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: (!isAuthenticated || agreedToTerms) ? '0 6px 25px rgba(251, 135, 4, 0.45)' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <FiAward size={20} />
                  <span>
                    {!user || !isAuthenticated
                      ? (isAr ? 'تسجيل الدخول لتفعيل رابط الإحالة (10% عمولة)' : 'Sign In to Activate Referral Link (10%)')
                      : isJoining
                      ? (isAr ? 'جارٍ تفعيل الحساب...' : 'Activating...')
                      : (isAr ? 'انضم الآن وتفعيل رابط الإحالة (10% عمولة)' : 'Join Now & Activate My Link')}
                  </span>
                  {isAr ? <FiArrowLeft size={18} /> : <FiArrowRight size={18} />}
                </button>
              </div>
            </div>
          </Anim>
        ) : (
          /* ── STATE 2: ACTIVE PARTNER DASHBOARD ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Top Partner Banner with Share Link Box */}
            <Anim effect="fade-up" delay={180}>
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(14, 35, 78, 0.85) 0%, rgba(6, 20, 47, 0.95) 100%)',
                  border: '1.5px solid rgba(251, 135, 4, 0.45)',
                  borderRadius: '1.25rem',
                  padding: 'clamp(1.5rem, 3.5vw, 2.25rem)',
                  boxShadow: '0 16px 45px rgba(0, 3, 13, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        background: 'rgba(0, 230, 118, 0.15)',
                        border: '1px solid rgba(0, 230, 118, 0.4)',
                        color: '#00E676',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        marginBottom: '0.5rem',
                      }}
                    >
                      ● {isAr ? 'حساب الشريك نشط • نسبة العمولة 10% فورية' : 'Active Partner • 10% Commission'}
                    </span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {isAr ? 'رابط الإحالة الحصري الخاص بك (شارك واربح 10% من كل كورس أو جروب)' : 'Your Exclusive Referral Link'}
                    </h3>
                  </div>

                  <div
                    style={{
                      background: 'rgba(251, 135, 4, 0.1)',
                      border: '1px dashed rgba(251, 135, 4, 0.5)',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      color: '#FB8704',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                    }}
                  >
                    {isAr ? 'كود الإحالة:' : 'Code:'} <span style={{ letterSpacing: '1px' }}>{referralCode}</span>
                  </div>
                </div>

                {/* Referral Link Bar */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: 'rgba(2, 8, 24, 0.85)',
                    border: '1px solid rgba(4, 136, 248, 0.35)',
                    borderRadius: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      background: 'transparent',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                      direction: 'ltr',
                    }}
                    onClick={(e) => e.target.select()}
                  />

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={copyReferralLink}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.55rem 1.1rem',
                      background: copied ? '#00E676' : 'linear-gradient(135deg, #FB8704 0%, #FA5A04 100%)',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 10px rgba(251, 135, 4, 0.3)',
                    }}
                  >
                    {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
                    <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرابط' : 'Copy Link')}</span>
                  </button>
                </div>

                {/* Quick Share Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(235, 240, 255, 0.7)', fontWeight: 600 }}>
                    {isAr ? 'مشاركة فورية:' : 'Quick Share:'}
                  </span>

                  {/* WhatsApp */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 1rem',
                      borderRadius: '9999px',
                      background: 'rgba(37, 211, 102, 0.15)',
                      border: '1px solid rgba(37, 211, 102, 0.4)',
                      color: '#25D366',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <FaWhatsapp size={16} />
                    <span>{isAr ? 'مشاركة عبر واتساب' : 'WhatsApp'}</span>
                  </a>

                  {/* Telegram */}
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 1rem',
                      borderRadius: '9999px',
                      background: 'rgba(34, 158, 217, 0.15)',
                      border: '1px solid rgba(34, 158, 217, 0.4)',
                      color: '#229ED9',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <FaTelegramPlane size={16} />
                    <span>{isAr ? 'مشاركة عبر تيليجرام' : 'Telegram'}</span>
                  </a>

                  {/* Button: Our Creatives & Ads (إعلاناتنا ومواد التسويق) */}
                  <button
                    type="button"
                    onClick={() => setShowCreativesModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 1.15rem',
                      borderRadius: '9999px',
                      background: 'linear-gradient(135deg, rgba(251, 135, 4, 0.25) 0%, rgba(250, 90, 4, 0.35) 100%)',
                      border: '1px solid rgba(251, 135, 4, 0.7)',
                      color: '#FFB054',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 0 16px rgba(251, 135, 4, 0.25)',
                    }}
                  >
                    <FiImage size={16} />
                    <span>{isAr ? 'إعلاناتنا وبوستات الترويج الجاهزة' : 'Our Ready-to-Use Ads'}</span>
                    <span
                      style={{
                        background: '#FB8704',
                        color: '#000',
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        padding: '0.1rem 0.5rem',
                        borderRadius: '9999px',
                      }}
                    >
                      {creatives.length > 0 ? creatives.length : (isAr ? 'جديد' : 'New')}
                    </span>
                  </button>
                </div>
              </div>
            </Anim>

            {/* Promotional Creatives Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(251, 135, 4, 0.12) 0%, rgba(4, 136, 248, 0.08) 100%)',
                border: '1px solid rgba(251, 135, 4, 0.35)',
                borderRadius: '1rem',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.5rem',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'rgba(251, 135, 4, 0.2)',
                      border: '1px solid rgba(251, 135, 4, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FB8704',
                      flexShrink: 0,
                    }}
                  >
                    <FiImage size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#FFFFFF' }}>
                        {isAr ? 'إعلاناتنا ومواد التسويق الجاهزة للشركاء' : 'Ready Promotional Ads & Creatives'}
                      </h4>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', background: '#00E676', color: '#000' }}>
                        {isAr ? 'مُحدثة دورياً' : 'Updated'}
                      </span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.825rem', color: 'rgba(235, 240, 255, 0.75)', lineHeight: 1.4 }}>
                      {isAr
                        ? 'وفرنا لك صوراً احترافية ونصوصاً تسويقية (كابشن) جاهزة مع رابط إحالتك الفريد للمشاركة فوراً على وسائل التواصل وزيادة مبيعاتك وأرباحك.'
                        : 'Ready marketing copy and high-converting banners with your referral link automatically embedded.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreativesModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.4rem',
                    borderRadius: '0.65rem',
                    background: 'linear-gradient(135deg, #FB8704 0%, #FA5A04 100%)',
                    color: '#000000',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 14px rgba(251, 135, 4, 0.35)',
                  }}
                >
                  <FiEye size={17} />
                  <span>{isAr ? 'عرض إعلاناتنا وبوستات الترويج' : 'View Creatives & Posts'}</span>
                  <span
                    style={{
                      background: '#000000',
                      color: '#FB8704',
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      padding: '0.1rem 0.5rem',
                      borderRadius: '9999px',
                    }}
                  >
                    {creatives.length}
                  </span>
                </button>
              </div>
            </div>

            {/* 5 Live Stats Metrics Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {/* Stat 1: Total Earnings */}
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(8, 26, 61, 0.8) 0%, rgba(4, 16, 42, 0.8) 100%)',
                  border: '1px solid rgba(251, 135, 4, 0.35)',
                  borderRadius: '1rem',
                  padding: '1.35rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.7)', fontWeight: 600 }}>
                    {isAr ? 'إجمالي الأرباح المكتسبة' : 'Total Earnings'}
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(251, 135, 4, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FB8704',
                    }}
                  >
                    <FiDollarSign size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FB8704' }}>
                  ${Number(partnerData?.totalEarnings || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(235, 240, 255, 0.5)', marginTop: '0.25rem' }}>
                  {pendingEarnings > 0 ? (
                    <span style={{ color: '#FB8704', fontWeight: 700 }}>
                      {isAr ? `+ $${pendingEarnings.toFixed(2)} أرباح قيد التأكيد والتفعيل` : `+ $${pendingEarnings.toFixed(2)} pending verification`}
                    </span>
                  ) : (
                    <span>{isAr ? '10% من الاشتراكات المدفوعة' : '10% from paid referrals'}</span>
                  )}
                </div>
              </div>

              {/* Stat 2: Available Balance */}
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(8, 26, 61, 0.8) 0%, rgba(4, 16, 42, 0.8) 100%)',
                  border: '1px solid rgba(0, 230, 118, 0.35)',
                  borderRadius: '1rem',
                  padding: '1.35rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.7)', fontWeight: 600 }}>
                    {isAr ? 'الرصيد المتاح للسحب' : 'Available Balance'}
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(0, 230, 118, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00E676',
                    }}
                  >
                    <FiAward size={18} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#00E676' }}>
                    ${Number(partnerData?.availableBalance || 0).toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(true)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      background: 'linear-gradient(135deg, #00E676 0%, #00B359 100%)',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isAr ? 'طلب سحب' : 'Withdraw'}
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(235, 240, 255, 0.5)', marginTop: '0.25rem' }}>
                  {isAr ? 'الحد الأدنى للسحب $100' : 'Min withdrawal $100'}
                </div>
              </div>

              {/* Stat 3: Referred Signups ("المسجلون عبر رابطك") */}
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(8, 26, 61, 0.8) 0%, rgba(4, 16, 42, 0.8) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: '1rem',
                  padding: '1.35rem',
                  cursor: 'pointer',
                }}
                onClick={() => setActiveTab('leads')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.7)', fontWeight: 600 }}>
                    {isAr ? 'المسجلون عبر رابطك' : 'Referred Signups'}
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#3B82F6',
                    }}
                  >
                    <FiUsers size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#3B82F6' }}>
                  {referredUsers.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(235, 240, 255, 0.5)', marginTop: '0.25rem' }}>
                  {isAr ? 'عضو مسجل عبر رابطك' : 'Registered members'}
                </div>
              </div>

              {/* Stat 4: Total Course & Group Subscriptions ("اشتركت في كورس أو جروب") */}
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(8, 26, 61, 0.8) 0%, rgba(4, 16, 42, 0.8) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  borderRadius: '1rem',
                  padding: '1.35rem',
                  cursor: 'pointer',
                }}
                onClick={() => setActiveTab('subscriptions')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.7)', fontWeight: 600 }}>
                    {isAr ? 'الاشتراكات في الكورسات والجروبات' : 'Courses & Groups Orders'}
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#A855F7',
                    }}
                  >
                    <FiTrendingUp size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#A855F7' }}>
                  {conversions.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(235, 240, 255, 0.5)', marginTop: '0.25rem' }}>
                  {pendingCount > 0
                    ? (isAr ? `${confirmedCount} مؤكد • ${pendingCount} قيد التأكيد` : `${confirmedCount} confirmed • ${pendingCount} pending`)
                    : (isAr ? `${coursesCount} كورسات • ${groupsCount} جروبات VIP` : `${coursesCount} courses • ${groupsCount} VIP groups`)}
                </div>
              </div>

              {/* Stat 5: Total Clicks */}
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(8, 26, 61, 0.8) 0%, rgba(4, 16, 42, 0.8) 100%)',
                  border: '1px solid rgba(4, 136, 248, 0.35)',
                  borderRadius: '1rem',
                  padding: '1.35rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.7)', fontWeight: 600 }}>
                    {isAr ? 'الزيارات عبر رابطك' : 'Link Clicks'}
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(4, 136, 248, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0488F8',
                    }}
                  >
                    <FiMousePointer size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0488F8' }}>
                  {partnerData?.totalClicks || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(235, 240, 255, 0.5)', marginTop: '0.25rem' }}>
                  {isAr ? 'زيارة مسجلة' : 'Tracked clicks'}
                </div>
              </div>
            </div>

            {/* ── INTERACTIVE TABS BAR ── */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.625rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                paddingBottom: '0.75rem',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {/* Tab 1: Subscriptions in Courses & Groups */}
                <button
                  type="button"
                  onClick={() => setActiveTab('subscriptions')}
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '0.5rem',
                    border: activeTab === 'subscriptions' ? '1px solid #FB8704' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: activeTab === 'subscriptions' ? 'rgba(251, 135, 4, 0.18)' : 'rgba(8, 26, 61, 0.5)',
                    color: activeTab === 'subscriptions' ? '#FB8704' : 'rgba(235, 240, 255, 0.75)',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <FiTrendingUp size={16} />
                  <span>{isAr ? 'المشتركون في الكورسات والجروبات' : 'Course & Group Subscriptions'}</span>
                  <span
                    style={{
                      background: activeTab === 'subscriptions' ? '#FB8704' : 'rgba(255, 255, 255, 0.15)',
                      color: activeTab === 'subscriptions' ? '#000' : '#FFF',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 900,
                    }}
                  >
                    {conversions.length}
                  </span>
                </button>

                {/* Tab 2: People who registered ("المسجلون عبر رابطك") */}
                <button
                  type="button"
                  onClick={() => setActiveTab('leads')}
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '0.5rem',
                    border: activeTab === 'leads' ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: activeTab === 'leads' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(8, 26, 61, 0.5)',
                    color: activeTab === 'leads' ? '#60A5FA' : 'rgba(235, 240, 255, 0.75)',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <FiUsers size={16} />
                  <span>{isAr ? 'المسجلون عبر رابطك' : 'Referred Signups'}</span>
                  <span
                    style={{
                      background: activeTab === 'leads' ? '#3B82F6' : 'rgba(255, 255, 255, 0.15)',
                      color: '#FFF',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 900,
                    }}
                  >
                    {referredUsers.length}
                  </span>
                </button>

                {/* Tab 3: Mechanism & How It Works ("آلية العمل") */}
                <button
                  type="button"
                  onClick={() => setActiveTab('mechanism')}
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '0.5rem',
                    border: activeTab === 'mechanism' ? '1px solid #00E676' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: activeTab === 'mechanism' ? 'rgba(0, 230, 118, 0.18)' : 'rgba(8, 26, 61, 0.5)',
                    color: activeTab === 'mechanism' ? '#00E676' : 'rgba(235, 240, 255, 0.75)',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <FiLayers size={16} />
                  <span>{isAr ? 'آلية العمل ونظام الأرباح (10%)' : 'How It Works (10%)'}</span>
                </button>

                {/* Tab 4: Payout Requests */}
                <button
                  type="button"
                  onClick={() => setActiveTab('payouts')}
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '0.5rem',
                    border: activeTab === 'payouts' ? '1px solid #EAB308' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: activeTab === 'payouts' ? 'rgba(234, 179, 8, 0.18)' : 'rgba(8, 26, 61, 0.5)',
                    color: activeTab === 'payouts' ? '#FACC15' : 'rgba(235, 240, 255, 0.75)',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <FiAward size={16} />
                  <span>{isAr ? 'سجل السحوبات المالية' : 'Payout History'}</span>
                  {payouts.length > 0 && (
                    <span
                      style={{
                        background: 'rgba(234, 179, 8, 0.3)',
                        color: '#FACC15',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                      }}
                    >
                      {payouts.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Refresh button */}
              <button
                type="button"
                onClick={fetchPartnerStatus}
                title={isAr ? 'تحديث البيانات' : 'Refresh'}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'rgba(235, 240, 255, 0.8)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                }}
              >
                <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>{isAr ? 'تحديث' : 'Refresh'}</span>
              </button>
            </div>

            {/* ── TAB 1 CONTENT: المشتركون في الكورسات والجروبات ── */}
            {activeTab === 'subscriptions' && (
              <div
                style={{
                  background: 'rgba(8, 26, 61, 0.65)',
                  border: '1px solid rgba(4, 136, 248, 0.25)',
                  borderRadius: '1.25rem',
                  padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.25rem' }}>
                      {isAr ? 'سجل المشتركين في الكورسات والجروبات (عمولة 10%)' : 'Course & VIP Group Referrals'}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(235, 240, 255, 0.6)', margin: 0 }}>
                      {isAr
                        ? 'كل عملية شراء تمت عبر رابطك لكورس تدريبي أو اشتراك في جروب توصيات تظهر هنا مباشرة'
                        : 'Every course and VIP group purchase made via your link is logged here'}
                    </p>
                  </div>

                  {/* Filter Pills for Course vs Group vs Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSubFilter('ALL')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: subFilter === 'ALL' ? '1px solid #FB8704' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: subFilter === 'ALL' ? 'rgba(251, 135, 4, 0.2)' : 'transparent',
                        color: subFilter === 'ALL' ? '#FB8704' : 'rgba(235, 240, 255, 0.7)',
                      }}
                    >
                      {isAr ? 'الكل' : 'All'} ({conversions.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubFilter('CONFIRMED')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: subFilter === 'CONFIRMED' ? '1px solid #00E676' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: subFilter === 'CONFIRMED' ? 'rgba(0, 230, 118, 0.2)' : 'transparent',
                        color: subFilter === 'CONFIRMED' ? '#00E676' : 'rgba(235, 240, 255, 0.7)',
                      }}
                    >
                      {isAr ? 'المؤكدة' : 'Confirmed'} ({confirmedCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubFilter('PENDING')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: subFilter === 'PENDING' ? '1px solid #FB8704' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: subFilter === 'PENDING' ? 'rgba(251, 135, 4, 0.2)' : 'transparent',
                        color: subFilter === 'PENDING' ? '#FB8704' : 'rgba(235, 240, 255, 0.7)',
                      }}
                    >
                      {isAr ? 'غير مؤكدة' : 'Unconfirmed'} ({pendingCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubFilter('COURSE')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: subFilter === 'COURSE' ? '1px solid #0488F8' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: subFilter === 'COURSE' ? 'rgba(4, 136, 248, 0.2)' : 'transparent',
                        color: subFilter === 'COURSE' ? '#60A5FA' : 'rgba(235, 240, 255, 0.7)',
                      }}
                    >
                      {isAr ? 'الكورسات التدريبية' : 'Courses'} ({coursesCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubFilter('GROUP')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: subFilter === 'GROUP' ? '1px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: subFilter === 'GROUP' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                        color: subFilter === 'GROUP' ? '#C084FC' : 'rgba(235, 240, 255, 0.7)',
                      }}
                    >
                      {isAr ? 'جروبات التوصيات VIP' : 'VIP Groups'} ({groupsCount})
                    </button>
                  </div>
                </div>

                {/* Subscriptions Table */}
                {filteredConversions.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem 1rem',
                      background: 'rgba(2, 8, 24, 0.5)',
                      borderRadius: '0.75rem',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <FiTrendingUp size={36} color="rgba(251, 135, 4, 0.6)" style={{ marginBottom: '0.75rem' }} />
                    <p style={{ fontSize: '0.95rem', color: 'rgba(235, 240, 255, 0.8)', margin: '0 0 0.5rem', fontWeight: 700 }}>
                      {isAr ? 'لم يتم العثور على اشتراكات مطابقة' : 'No matching subscriptions recorded'}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.5)', margin: '0 0 1.25rem' }}>
                      {isAr
                        ? 'شارك رابطك المخصص على واتساب وتيليجرام لتحقيق أول 10% عمولة من أي كورس أو جروب يشترك به معارفك!'
                        : 'Share your referral link on WhatsApp & Telegram to earn 10% commission on every course or group subscription!'}
                    </p>
                    <button
                      type="button"
                      onClick={copyReferralLink}
                      style={{
                        padding: '0.45rem 1.25rem',
                        borderRadius: '9999px',
                        background: 'linear-gradient(135deg, #FB8704 0%, #FA5A04 100%)',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                      }}
                    >
                      <FiCopy size={15} />
                      <span>{isAr ? 'نسخ رابط الإحالة الآن' : 'Copy Link Now'}</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(235, 240, 255, 0.6)', fontSize: '0.8rem' }}>
                          <th style={{ padding: '0.75rem 0.5rem' }}>{isAr ? 'التاريخ' : 'Date'}</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>{isAr ? 'المشترك' : 'Subscriber'}</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>{isAr ? 'نوع الاشتراك' : 'Type'}</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>{isAr ? 'الكورس / الجروب' : 'Course / Group'}</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>{isAr ? 'رقم الطلب' : 'Order #'}</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>{isAr ? 'مبلغ الدفع' : 'Amount'}</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>{isAr ? 'عمولتك (10%)' : 'Commission (10%)'}</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>{isAr ? 'الحالة' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredConversions.map((conv) => {
                          const pName = String(conv.productName || '').toLowerCase();
                          const isGroup =
                            conv.productType === 'GROUP' ||
                            pName.includes('group') ||
                            pName.includes('جروب') ||
                            pName.includes('توصيات') ||
                            pName.includes('signals');

                          const rawProd = String(conv.productName || '').trim();
                          const isRawId = /^c[a-z0-9]{20,}$/i.test(rawProd);
                          const cleanDisplayName = isRawId
                            ? (isGroup ? (isAr ? 'جروب توصيات VIP' : 'VIP Signals Group') : (isAr ? 'كورس تدريبي' : 'Training Course'))
                            : (rawProd || (isGroup ? (isAr ? 'جروب توصيات VIP' : 'VIP Signals Group') : (isAr ? 'كورس تدريبي' : 'Training Course')));

                          const isConfirmed = conv.status === 'CONFIRMED';
                          const isRejected = conv.status === 'REJECTED' || conv.status === 'CANCELLED';

                          return (
                            <tr
                              key={conv.id}
                              style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                fontSize: '0.875rem',
                                color: '#FFFFFF',
                              }}
                            >
                              <td style={{ padding: '0.75rem 0.5rem', color: 'rgba(235, 240, 255, 0.7)' }}>
                                {new Date(conv.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>
                                {conv.buyerName || 'مشترك FXENGIN'}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: isGroup ? 'rgba(168, 85, 247, 0.15)' : 'rgba(4, 136, 248, 0.15)',
                                    color: isGroup ? '#C084FC' : '#60A5FA',
                                    border: isGroup ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(4, 136, 248, 0.3)',
                                  }}
                                >
                                  {isGroup ? 'جروب توصيات' : 'كورس تدريبي'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }} title={isRawId ? rawProd : undefined}>
                                {cleanDisplayName}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', color: '#0488F8' }}>
                                {conv.orderNumber}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                                ${Number(conv.orderAmount).toFixed(2)}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 900, fontSize: '0.95rem' }}>
                                {isConfirmed ? (
                                  <span style={{ color: '#00E676' }}>
                                    +${Number(conv.commissionAmount).toFixed(2)}
                                  </span>
                                ) : (
                                  <span style={{ color: '#FB8704', fontSize: '0.88rem' }}>
                                    ${Number(conv.commissionAmount).toFixed(2)}
                                    <span style={{ fontSize: '0.72rem', opacity: 0.85, marginInlineStart: '0.3rem' }}>
                                      {isAr ? '(معلقة)' : '(Pending)'}
                                    </span>
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                {isConfirmed ? (
                                  <span
                                    style={{
                                      background: 'rgba(0, 230, 118, 0.15)',
                                      color: '#00E676',
                                      border: '1px solid rgba(0, 230, 118, 0.35)',
                                      padding: '0.22rem 0.65rem',
                                      borderRadius: '9999px',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                    }}
                                  >
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E676' }} />
                                    {isAr ? 'مؤكدة' : 'Confirmed'}
                                  </span>
                                ) : isRejected ? (
                                  <span
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.15)',
                                      color: '#EF4444',
                                      border: '1px solid rgba(239, 68, 68, 0.35)',
                                      padding: '0.22rem 0.65rem',
                                      borderRadius: '9999px',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                    }}
                                  >
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
                                    {isAr ? 'ملغية' : 'Cancelled'}
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      background: 'rgba(251, 135, 4, 0.15)',
                                      color: '#FB8704',
                                      border: '1px solid rgba(251, 135, 4, 0.35)',
                                      padding: '0.22rem 0.65rem',
                                      borderRadius: '9999px',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                    }}
                                  >
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FB8704' }} />
                                    {isAr ? 'غير مؤكد' : 'Unconfirmed'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Clarification tip */}
                    <div
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1rem',
                        background: 'rgba(2, 8, 24, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.78rem',
                        color: 'rgba(235, 240, 255, 0.65)',
                      }}
                    >
                      <FiInfo size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                      <span>
                        {isAr
                          ? 'يظهر الطلب بحالة (غير مؤكد) فور إتمامه، ويتحول إلى (مؤكدة) وتضاف عمولة 10% إلى رصيدك المتاح للسحب فور تأكيد الدفع واعتماد كود التفعيل من الإدارة.'
                          : 'Orders appear as (Unconfirmed) upon creation and switch to (Confirmed) with 10% commission credited to your balance as soon as payment is verified and activated by admin.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2 CONTENT: المسجلون عبر رابطك (Leads & Signups) ── */}
            {activeTab === 'leads' && (
              <div
                style={{
                  background: 'rgba(8, 26, 61, 0.65)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '1.25rem',
                  padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.25rem' }}>
                      {isAr ? 'قائمة المسجلين عبر رابطك (الإحالات المباشرة)' : 'Referred Signups List'}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(235, 240, 255, 0.6)', margin: 0 }}>
                      {isAr
                        ? 'قائمة الأعضاء الذين أنشأوا حساباتهم في المنصة عبر رابط الإحالة الخاص بك (مرتبطون بك لمدة 30 يوماً)'
                        : 'Users who registered on FXENGIN via your referral link'}
                    </p>
                  </div>

                  <span style={{ fontSize: '0.85rem', color: '#60A5FA', fontWeight: 700 }}>
                    {referredUsers.length} {isAr ? 'عضو مسجل' : 'members'}
                  </span>
                </div>

                {filteredReferredUsers.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem 1rem',
                      background: 'rgba(2, 8, 24, 0.5)',
                      borderRadius: '0.75rem',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <FiUsers size={36} color="rgba(59, 130, 246, 0.6)" style={{ marginBottom: '0.75rem' }} />
                    <p style={{ fontSize: '0.95rem', color: 'rgba(235, 240, 255, 0.8)', margin: '0 0 0.5rem', fontWeight: 700 }}>
                      {isAr ? 'لم يسجل أي عضو عبر رابطك حتى الآن' : 'No signups through your link yet'}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.5)', margin: '0 0 1.25rem' }}>
                      {isAr
                        ? 'شارك رابطك الآن مع المتداولين والمهتمين بالتحليل الفني والفوركس لبدء بناء شبكتك التسويقية!'
                        : 'Share your link with traders to start growing your referral network!'}
                    </p>
                    <button
                      type="button"
                      onClick={copyReferralLink}
                      style={{
                        padding: '0.45rem 1.25rem',
                        borderRadius: '9999px',
                        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                        color: '#FFF',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                      }}
                    >
                      <FiCopy size={15} />
                      <span>{isAr ? 'نسخ رابط الإحالة' : 'Copy Referral Link'}</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(235, 240, 255, 0.6)', fontSize: '0.8rem' }}>
                          <th style={{ padding: '0.75rem 0.5rem' }}>{isAr ? 'اسم العضو' : 'Member'}</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>{isAr ? 'البريد / الاتصال' : 'Email / Contact'}</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>{isAr ? 'تاريخ الانضمام' : 'Join Date'}</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>{isAr ? 'الاشتراكات' : 'Subscriptions'}</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>{isAr ? 'أرباحك منه' : 'Commission'}</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>{isAr ? 'حالة العضوية' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReferredUsers.map((lead) => (
                          <tr
                            key={lead.id}
                            style={{
                              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                              fontSize: '0.875rem',
                              color: '#FFFFFF',
                            }}
                          >
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>
                              {lead.userName || 'عضو جديد'}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'rgba(235, 240, 255, 0.7)', fontSize: '0.825rem' }}>
                              {lead.userEmail || lead.userPhone || '—'}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'rgba(235, 240, 255, 0.7)' }}>
                              {lead.registeredAt
                                ? new Date(lead.registeredAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : '—'}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span
                                style={{
                                  background: (lead.subscriptionsCount || 0) > 0 ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                  color: (lead.subscriptionsCount || 0) > 0 ? '#00E676' : 'rgba(235, 240, 255, 0.6)',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                }}
                              >
                                {lead.subscriptionsCount || 0} {isAr ? 'اشتراك' : 'orders'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: '#00E676', fontWeight: 800 }}>
                              ${Number(lead.totalCommission || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              {(lead.subscriptionsCount || 0) > 0 ? (
                                <span
                                  style={{
                                    background: 'rgba(0, 230, 118, 0.15)',
                                    color: '#00E676',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {isAr ? 'مشترك نشط' : 'Subscribed'}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    background: 'rgba(251, 135, 4, 0.15)',
                                    color: '#FB8704',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {isAr ? 'مسجل جديد' : 'Registered'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3 CONTENT: آلية العمل ونظام الأرباح (How It Works & Mechanism) ── */}
            {activeTab === 'mechanism' && (
              <div
                style={{
                  background: 'rgba(8, 26, 61, 0.75)',
                  border: '1px solid rgba(0, 230, 118, 0.3)',
                  borderRadius: '1.25rem',
                  padding: 'clamp(1.5rem, 3.5vw, 2.25rem)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #00E676 0%, #00B359 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontWeight: 900,
                    }}
                  >
                    <FiLayers size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {isAr ? 'آلية عمل برنامج الشركاء والإحالة (FXENGIN Affiliate Engine)' : 'How the Affiliate Engine Works'}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.65)', margin: 0 }}>
                      {isAr ? 'دليلك الشامل لكيفية احتساب العمولات، تتبع المشتركين، وسحب الأرباح' : 'Complete guide on referral tracking, commissions, and withdrawals'}
                    </p>
                  </div>
                </div>

                {/* 5 Step Roadmap */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '2rem',
                  }}
                >
                  <div style={{ background: 'rgba(2, 8, 24, 0.7)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(251, 135, 4, 0.3)' }}>
                    <div style={{ display: 'inline-flex', padding: '0.2rem 0.6rem', borderRadius: '6px', background: '#FB8704', color: '#000', fontWeight: 900, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                      خطوة 1
                    </div>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.5rem' }}>رابط وكود دائم</h5>
                    <p style={{ fontSize: '0.825rem', color: 'rgba(235, 240, 255, 0.75)', lineHeight: 1.5, margin: 0 }}>
                      انسخ رابطك المخصص <span style={{ color: '#FB8704' }}>{referralCode}</span> وشاركه عبر واتساب، تيليجرام، أو قنوات التداول.
                    </p>
                  </div>

                  <div style={{ background: 'rgba(2, 8, 24, 0.7)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(4, 136, 248, 0.3)' }}>
                    <div style={{ display: 'inline-flex', padding: '0.2rem 0.6rem', borderRadius: '6px', background: '#0488F8', color: '#FFF', fontWeight: 900, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                      خطوة 2
                    </div>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.5rem' }}>تتبع كوكيز 30 يوماً</h5>
                    <p style={{ fontSize: '0.825rem', color: 'rgba(235, 240, 255, 0.75)', lineHeight: 1.5, margin: 0 }}>
                      أي شخص ينقر على رابطك يتم حفظ إحالته في المتصفح تلقائياً لمدة 30 يوماً متواصلة.
                    </p>
                  </div>

                  <div style={{ background: 'rgba(2, 8, 24, 0.7)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <div style={{ display: 'inline-flex', padding: '0.2rem 0.6rem', borderRadius: '6px', background: '#3B82F6', color: '#FFF', fontWeight: 900, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                      خطوة 3
                    </div>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.5rem' }}>تسجيل العضو في شبكتك</h5>
                    <p style={{ fontSize: '0.825rem', color: 'rgba(235, 240, 255, 0.75)', lineHeight: 1.5, margin: 0 }}>
                      عندما يقوم العضو بإنشاء حسابه يظهر فوراً في تبويب "المسجلون عبر رابطك".
                    </p>
                  </div>

                  <div style={{ background: 'rgba(2, 8, 24, 0.7)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                    <div style={{ display: 'inline-flex', padding: '0.2rem 0.6rem', borderRadius: '6px', background: '#A855F7', color: '#FFF', fontWeight: 900, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                      خطوة 4
                    </div>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.5rem' }}>
                      {isAr ? 'أول اشتراك كورس أو جروب' : 'First Course or Group'}
                    </h5>
                    <p style={{ fontSize: '0.825rem', color: 'rgba(235, 240, 255, 0.75)', lineHeight: 1.5, margin: 0 }}>
                      {isAr
                        ? 'عند أول اشتراك للمحال في جروب توصيات أو أول شراء لكورس، تحتسب لك 10% فورية لمرة واحدة فقط (لا تشمل التجديدات أو الجروبات اللاحقة).'
                        : 'On the referral\'s first group subscription or first course purchase, earn a 10% one-time commission (does not apply to renewals or subsequent groups).'}
                    </p>
                  </div>

                  <div style={{ background: 'rgba(2, 8, 24, 0.7)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(0, 230, 118, 0.3)' }}>
                    <div style={{ display: 'inline-flex', padding: '0.2rem 0.6rem', borderRadius: '6px', background: '#00E676', color: '#000', fontWeight: 900, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                      خطوة 5
                    </div>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.5rem' }}>سحب أرباحك فوراً</h5>
                    <p style={{ fontSize: '0.825rem', color: 'rgba(235, 240, 255, 0.75)', lineHeight: 1.5, margin: 0 }}>
                      اطلب سحب أرباحك عند وصولك إلى $100 عبر محفظة USDT (شبكة TRC-20).
                    </p>
                  </div>
                </div>

                {/* First-Time Only Policy Callout */}
                <div
                  style={{
                    background: 'rgba(251, 135, 4, 0.08)',
                    border: '1px solid rgba(251, 135, 4, 0.35)',
                    borderRadius: '0.85rem',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.75rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  <FiInfo size={20} color="#FB8704" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.88)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#FB8704' }}>
                      {isAr ? 'قاعدة احتساب العمولات (لمرة واحدة فقط لكل فئة):' : 'Commission Rule (One-Time Per Category):'}
                    </strong>
                    <br />
                    {isAr
                      ? 'تُحتسب عمولة الـ 10% للشريك لمرة واحدة فقط عند اشتراك المستخدم المحال في أول جروب (مثل جروب الذهب). وإذا قام المستخدم لاحقاً بتجديد اشتراكه أو بالاشتراك في جروب آخر (كالفوركس أو المؤشرات)، لا تُحتسب عمولة إضافية. ينطبق نفس المبدأ تماماً على الكورسات (تُحتسب عند شراء أول كورس فقط).'
                      : 'The 10% commission is credited once on the referred user\'s first group subscription (e.g. Gold group). Renewals or subsequent subscriptions to other groups do not generate additional commissions. The exact same rule applies to courses (awarded on the first course purchase only).'}
                  </div>
                </div>

                {/* Practical Earning Examples Table */}
                <div style={{ background: 'rgba(2, 8, 24, 0.8)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1.75rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 1rem' }}>
                    {isAr ? 'أمثلة توضيحية لحساب عمولة الـ 10%:' : 'Commission Examples (10%):'}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '0.5rem', borderLeft: '3px solid #FB8704' }}>
                      <div style={{ color: '#FB8704', fontWeight: 800, fontSize: '0.9rem' }}>دورة أساسيات الفوركس للمبتدئين</div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.7)', margin: '0.35rem 0' }}>سعر الكورس: <strong>$100</strong></div>
                      <div style={{ fontSize: '0.95rem', color: '#00E676', fontWeight: 900 }}>عمولتك الفورية: $10 (10%)</div>
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '0.5rem', borderLeft: '3px solid #A855F7' }}>
                      <div style={{ color: '#C084FC', fontWeight: 800, fontSize: '0.9rem' }}>اشتراك جروب توصيات VIP (ربع سنوي)</div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.7)', margin: '0.35rem 0' }}>سعر الباقة: <strong>$250</strong></div>
                      <div style={{ fontSize: '0.95rem', color: '#00E676', fontWeight: 900 }}>عمولتك الفورية: $25 (10%)</div>
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '0.5rem', borderLeft: '3px solid #00E676' }}>
                      <div style={{ color: '#00E676', fontWeight: 800, fontSize: '0.9rem' }}>الباقة الاحترافية الشاملة (كورس + VIP)</div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.7)', margin: '0.35rem 0' }}>سعر الباقة: <strong>$500</strong></div>
                      <div style={{ fontSize: '0.95rem', color: '#00E676', fontWeight: 900 }}>عمولتك الفورية: $50 (10%)</div>
                    </div>
                  </div>
                </div>

                {/* Interactive Commission Calculator */}
                <div style={{ background: 'linear-gradient(135deg, rgba(251, 135, 4, 0.1) 0%, rgba(4, 136, 248, 0.1) 100%)', border: '1px solid rgba(251, 135, 4, 0.3)', padding: '1.5rem', borderRadius: '1rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 1rem' }}>
                    {isAr ? 'حاسبة أرباحك التقديرية:' : 'Commission Estimator:'}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.8)', display: 'block', marginBottom: '0.35rem' }}>
                        {isAr ? 'عدد المشتركين المتوقعين عبر رابطك:' : 'Estimated Referrals:'} <strong>{calcReferrals}</strong>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={calcReferrals}
                        onChange={(e) => setCalcReferrals(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#FB8704' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.8)', display: 'block', marginBottom: '0.35rem' }}>
                        {isAr ? 'متوسط سعر الكورس أو الجروب ($):' : 'Average Price ($):'} <strong>${calcAvgPrice}</strong>
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="1000"
                        step="25"
                        value={calcAvgPrice}
                        onChange={(e) => setCalcAvgPrice(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#00E676' }}
                      />
                    </div>

                    <div style={{ textAlign: isAr ? 'left' : 'right', background: 'rgba(2, 8, 24, 0.7)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(0, 230, 118, 0.4)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(235, 240, 255, 0.7)' }}>{isAr ? 'أرباحك التقديرية (10% كاش):' : 'Estimated Earnings (10%):'}</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#00E676' }}>
                        ${Math.round(calcReferrals * calcAvgPrice * 0.10).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4 CONTENT: سجل السحوبات المالية (Payouts) ── */}
            {activeTab === 'payouts' && (
              <div
                style={{
                  background: 'rgba(8, 26, 61, 0.65)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  borderRadius: '1.25rem',
                  padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.25rem' }}>
                      {isAr ? 'سجل طلبات سحب الأرباح' : 'Payout Requests History'}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(235, 240, 255, 0.6)', margin: 0 }}>
                      {isAr ? 'تتبع حالة طلبات تحويل الأرباح إلى حسابك البنكي أو محفظتك' : 'Track your withdrawal transfers and status'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(true)}
                    style={{
                      padding: '0.5rem 1.25rem',
                      background: 'linear-gradient(135deg, #00E676 0%, #00B359 100%)',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {isAr ? '+ طلب سحب جديد' : '+ Request Withdrawal'}
                  </button>
                </div>

                {payouts.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem 1rem',
                      background: 'rgba(2, 8, 24, 0.5)',
                      borderRadius: '0.75rem',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <FiAward size={36} color="rgba(234, 179, 8, 0.6)" style={{ marginBottom: '0.75rem' }} />
                    <p style={{ fontSize: '0.95rem', color: 'rgba(235, 240, 255, 0.8)', margin: '0 0 0.5rem', fontWeight: 700 }}>
                      {isAr ? 'لا توجد طلبات سحب سابقة' : 'No payout requests yet'}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(235, 240, 255, 0.5)', margin: 0 }}>
                      {isAr
                        ? `رصيدك الحالي المتاح هو $${Number(partnerData?.availableBalance || 0).toFixed(2)}. يمكنك طلب سحب بمجرد وصول رصيدك إلى 100 دولار.`
                        : `Your current balance is $${Number(partnerData?.availableBalance || 0).toFixed(2)}. You can request payout once balance reaches $100.`}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {payouts.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          background: 'rgba(2, 8, 24, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '0.75rem',
                          padding: '0.85rem 1rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#00E676' }}>
                              ${Number(p.amount).toFixed(2)}
                            </span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: '#FFFFFF',
                                fontWeight: 700,
                              }}
                            >
                              {p.method}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(235, 240, 255, 0.6)' }}>
                            {p.accountDetails} {p.notes ? `• (${p.notes})` : ''}
                          </div>
                        </div>

                        <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background:
                                p.status === 'COMPLETED'
                                  ? 'rgba(0, 230, 118, 0.15)'
                                  : p.status === 'REJECTED'
                                  ? 'rgba(244, 67, 54, 0.15)'
                                  : 'rgba(251, 135, 4, 0.15)',
                              color:
                                p.status === 'COMPLETED'
                                  ? '#00E676'
                                  : p.status === 'REJECTED'
                                  ? '#F44336'
                                  : '#FB8704',
                            }}
                          >
                            {p.status === 'COMPLETED'
                              ? (isAr ? 'تم التحويل بنجاح' : 'Completed')
                              : p.status === 'REJECTED'
                              ? (isAr ? 'مرفوض' : 'Rejected')
                              : (isAr ? 'قيد المراجعة والتحويل' : 'Under Review')}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(235, 240, 255, 0.4)', marginTop: '0.25rem' }}>
                            {new Date(p.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PAYOUT MODAL ── */}
      {showPayoutModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 3, 13, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setShowPayoutModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #0A1C3E 0%, #04102A 100%)',
              border: '1.5px solid rgba(251, 135, 4, 0.5)',
              borderRadius: '1.25rem',
              padding: '2rem',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
              color: '#FFFFFF',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {isAr ? 'طلب سحب الأرباح (10% عمولة)' : 'Request Payout'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'rgba(235, 240, 255, 0.7)' }}>{isAr ? 'الرصيد المتاح للسحب:' : 'Available Balance:'}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#00E676' }}>
                ${Number(partnerData?.availableBalance || 0).toFixed(2)}
              </div>
            </div>

            <form onSubmit={handlePayoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  {isAr ? 'المبلغ المطلوب سحبه ($ بالدولار):' : 'Amount to Withdraw ($):'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="100"
                  max={partnerData?.availableBalance || 0}
                  required
                  placeholder="مثال: 100"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(2, 8, 24, 0.8)',
                    border: '1px solid rgba(4, 136, 248, 0.3)',
                    color: '#FFFFFF',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'rgba(235, 240, 255, 0.5)', marginTop: '0.2rem', display: 'block' }}>
                  {isAr ? 'الحد الأدنى لطلب السحب هو 100 دولار أمريكي' : 'Minimum payout is $100'}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  {isAr ? 'وسيلة استلام الأرباح:' : 'Payout Method:'}
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(2, 8, 24, 0.8)',
                    border: '1px solid rgba(4, 136, 248, 0.3)',
                    color: '#FFFFFF',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                >
                  <option value="USDT_TRC20">USDT (شبكة Tron TRC-20)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  {isAr ? 'بيانات الحساب / رقم المحفظة:' : 'Account Details / Wallet Address:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'عنوان محفظة TRC-20 (يبدأ بحرف T)' : 'USDT TRC-20 Address (starts with T)'}
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(2, 8, 24, 0.8)',
                    border: '1px solid rgba(4, 136, 248, 0.3)',
                    color: '#FFFFFF',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  {isAr ? 'ملاحظات إضافية (اختياري):' : 'Notes (Optional):'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'اسم المستلم أو أي تفاصيل مساعدة' : 'Beneficiary name, etc.'}
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(2, 8, 24, 0.8)',
                    border: '1px solid rgba(4, 136, 248, 0.2)',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: 'linear-gradient(135deg, #00E676 0%, #00B359 100%)',
                    border: 'none',
                    color: '#000000',
                    fontWeight: 800,
                    cursor: submittingPayout ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submittingPayout ? (isAr ? 'جارٍ الإرسال...' : 'Submitting...') : (isAr ? 'تأكيد طلب السحب' : 'Confirm Payout')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: OUR CREATIVES & READY ADS ══════════════ */}
      {showCreativesModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(1, 6, 18, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreativesModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '960px',
              maxHeight: '90vh',
              background: 'linear-gradient(180deg, #071530 0%, #030A1C 100%)',
              border: '1px solid rgba(251, 135, 4, 0.35)',
              borderRadius: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 30px rgba(251, 135, 4, 0.15)',
              overflow: 'hidden',
              direction: isAr ? 'rtl' : 'ltr',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(8, 26, 61, 0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(251, 135, 4, 0.2)',
                    border: '1px solid rgba(251, 135, 4, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FB8704',
                  }}
                >
                  <FiImage size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF' }}>
                      {isAr ? 'إعلاناتنا ومواد التسويق الجاهزة' : 'Our Marketing Creatives & Ads'}
                    </h3>
                    <span
                      style={{
                        background: '#FB8704',
                        color: '#000',
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        padding: '0.1rem 0.5rem',
                        borderRadius: '9999px',
                      }}
                    >
                      {creatives.length} {isAr ? 'إعلان جاهز' : 'Ads'}
                    </span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'rgba(235, 240, 255, 0.7)' }}>
                    {isAr
                      ? 'اختر الإعلان، حمّل الصورة، وانسخ المنشور المرفق برابط إحالتك الفريد بنقرة واحدة.'
                      : 'Choose an ad, download the image, and 1-click copy caption with your unique referral link.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreativesModal(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Filter Pills */}
            <div
              style={{
                padding: '0.75rem 1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                overflowX: 'auto',
                background: 'rgba(4, 16, 42, 0.5)',
              }}
            >
              {[
                { id: 'ALL', label: isAr ? 'جميع الإعلانات' : 'All Ads' },
                { id: 'فيسبوك', label: isAr ? 'فيسبوك وانستغرام' : 'Facebook & IG' },
                { id: 'تيليجرام', label: isAr ? 'تيليجرام وواتساب' : 'Telegram & WhatsApp' },
                { id: 'تويتر', label: isAr ? 'تويتر / X' : 'Twitter / X' },
              ].map((tab) => {
                const isSelected = creativeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCreativeFilter(tab.id)}
                    style={{
                      padding: '0.35rem 0.9rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: isSelected ? '1px solid #FB8704' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: isSelected ? 'rgba(251, 135, 4, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? '#FB8704' : 'rgba(235, 240, 255, 0.75)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Creatives Scrollable Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.25rem 1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {filteredCreatives.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem' }}>
                  <FiImage size={48} style={{ color: 'rgba(255, 255, 255, 0.3)', marginBottom: '0.75rem' }} />
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem', fontWeight: 600 }}>
                    {isAr ? 'لا توجد إعلانات مطابقة للتصنيف حالياً' : 'No ads found in this category'}
                  </p>
                </div>
              ) : (
                filteredCreatives.map((crt) => {
                  const shareUrls = getCreativeShareUrls(crt.caption);
                  const isCopied = copiedCreativeId === crt.id;

                  // Rendered caption with link replaced
                  const displayCaption = (crt.caption || '').includes('{LINK}')
                    ? crt.caption.replace(/\{LINK\}/g, referralLink || `${currentOrigin}/?ref=${referralCode}`)
                    : `${crt.caption || ''}\n\n${isAr ? 'رابط التسجيل والاشتراك:' : 'Registration link:'}\n${referralLink || `${currentOrigin}/?ref=${referralCode}`}`;

                  return (
                    <div
                      key={crt.id}
                      style={{
                        background: 'rgba(8, 26, 61, 0.75)',
                        border: '1px solid rgba(251, 135, 4, 0.3)',
                        borderRadius: '1.15rem',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Image Area - Explicit height for 100% cross-browser reliability */}
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '210px',
                          minHeight: '210px',
                          background: '#040d21',
                          overflow: 'hidden',
                          display: 'block',
                          borderBottom: '1px solid rgba(251, 135, 4, 0.25)',
                        }}
                      >
                        <img
                          src={crt.imageUrl || '/assets/Images/Main/login-visual.webp'}
                          alt={crt.title || 'Creative Image'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/Images/Main/login-visual.webp';
                          }}
                        />

                        {/* Dark Gradient Overlay for Readability */}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(4, 13, 33, 0.92) 0%, rgba(4, 13, 33, 0.2) 45%, rgba(0,0,0,0) 100%)',
                            pointerEvents: 'none',
                          }}
                        />

                        {/* Badge */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '0.75rem',
                            right: '0.75rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            background: 'rgba(0, 0, 0, 0.85)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(251, 135, 4, 0.4)',
                            color: '#FB8704',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            zIndex: 3,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                          }}
                        >
                          <FiImage size={11} />
                          <span>{crt.badge || (isAr ? 'عام' : 'General')}</span>
                        </div>

                        {/* Download & Preview Actions on Image */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '0.65rem',
                            left: '0.65rem',
                            right: '0.65rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.5rem',
                            zIndex: 4,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedPreviewImage(crt.imageUrl || '/assets/Images/Main/login-visual.webp')}
                            style={{
                              padding: '0.35rem 0.7rem',
                              borderRadius: '0.45rem',
                              background: 'rgba(0, 0, 0, 0.82)',
                              backdropFilter: 'blur(6px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              color: '#FFFFFF',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <FiEye size={13} />
                            <span>{isAr ? 'معاينة' : 'Preview'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadImage(crt.imageUrl || '/assets/Images/Main/login-visual.webp', crt.title)}
                            style={{
                              padding: '0.35rem 0.85rem',
                              borderRadius: '0.45rem',
                              background: 'linear-gradient(135deg, #00E676 0%, #00C853 100%)',
                              color: '#000000',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: '0 2px 10px rgba(0, 230, 118, 0.35)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <FiDownload size={13} />
                            <span>{isAr ? 'تحميل الصورة' : 'Download'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div
                        style={{
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          flex: 1,
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              margin: '0 0 0.5rem 0',
                              fontSize: '0.925rem',
                              fontWeight: 800,
                              color: '#FFFFFF',
                              lineHeight: 1.35,
                            }}
                          >
                            {crt.title || (isAr ? 'إعلان ترويجي' : 'Promotional Ad')}
                          </h4>

                          {/* Caption Preview Box */}
                          <div
                            style={{
                              background: 'rgba(2, 8, 24, 0.7)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '0.75rem',
                              padding: '0.75rem',
                              maxHeight: '140px',
                              overflowY: 'auto',
                              fontSize: '0.775rem',
                              color: 'rgba(235, 240, 255, 0.9)',
                              lineHeight: 1.5,
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'inherit',
                            }}
                          >
                            {displayCaption}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          {/* 1-Click Copy Caption Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyCaption(crt.caption, crt.id)}
                            style={{
                              width: '100%',
                              padding: '0.6rem',
                              borderRadius: '0.65rem',
                              border: 'none',
                              background: isCopied
                                ? '#00E676'
                                : 'linear-gradient(135deg, #FB8704 0%, #FA5A04 100%)',
                              color: '#000000',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.45rem',
                              transition: 'all 0.2s ease',
                              boxShadow: isCopied
                                ? '0 0 16px rgba(0, 230, 118, 0.4)'
                                : '0 2px 10px rgba(251, 135, 4, 0.3)',
                            }}
                          >
                            {isCopied ? <FiCheck size={16} /> : <FiCopy size={16} />}
                            <span>
                              {isCopied
                                ? (isAr ? 'تم نسخ المنشور بالرابط!' : 'Post Copied!')
                                : (isAr ? 'نسخ المنشور مع رابطي' : 'Copy Post with My Link')}
                            </span>
                          </button>

                          {/* Quick Social Shares */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: '0.4rem',
                              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', color: 'rgba(235, 240, 255, 0.6)', fontWeight: 600 }}>
                              {isAr ? 'مشاركة فورية:' : 'Share now:'}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              {/* WhatsApp */}
                              <a
                                href={shareUrls.whatsapp}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="WhatsApp"
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  background: 'rgba(37, 211, 102, 0.15)',
                                  border: '1px solid rgba(37, 211, 102, 0.4)',
                                  color: '#25D366',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textDecoration: 'none',
                                }}
                              >
                                <FaWhatsapp size={15} />
                              </a>

                              {/* Telegram */}
                              <a
                                href={shareUrls.telegram}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Telegram"
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  background: 'rgba(34, 158, 217, 0.15)',
                                  border: '1px solid rgba(34, 158, 217, 0.4)',
                                  color: '#229ED9',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textDecoration: 'none',
                                }}
                              >
                                <FaTelegramPlane size={15} />
                              </a>

                              {/* Facebook */}
                              <a
                                href={shareUrls.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Facebook"
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  background: 'rgba(24, 119, 242, 0.15)',
                                  border: '1px solid rgba(24, 119, 242, 0.4)',
                                  color: '#1877F2',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textDecoration: 'none',
                                }}
                              >
                                <FaFacebook size={15} />
                              </a>

                              {/* Twitter / X */}
                              <a
                                href={shareUrls.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="X (Twitter)"
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.3)',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textDecoration: 'none',
                                }}
                              >
                                <FaTwitter size={14} />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '0.9rem 1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(8, 26, 61, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: 'rgba(235, 240, 255, 0.7)' }}>
                {isAr
                  ? 'يتم تحديث هذه المواد الإعلانية بانتظام لمساعدتك على تحقيق أعلى معدل مبيعات.'
                  : 'Creatives are updated periodically to ensure maximum conversion.'}
              </span>
              <button
                type="button"
                onClick={() => setShowCreativesModal(false)}
                style={{
                  padding: '0.45rem 1.25rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {selectedPreviewImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={selectedPreviewImage}
              alt="معاينة كاملة"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              }}
            />
            <button
              type="button"
              onClick={() => setSelectedPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#FB8704',
                color: '#000000',
                border: 'none',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
