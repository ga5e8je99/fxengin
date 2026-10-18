'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, getAccessToken } from '../services/apiClient';
import CompetitionQualificationGate from '../components/CompetitionQualificationGate';
import {
  FiTrendingUp,
  FiMaximize2,
  FiMinimize2,
  FiShield,
  FiZap,
  FiCheckCircle,
  FiAlertCircle,
  FiHelpCircle,
  FiExternalLink,
  FiAward,
  FiLayers,
  FiArrowRight,
  FiInfo,
} from 'react-icons/fi';

const QUICK_ASSETS = [
  { symbol: 'XAUUSD', nameAr: 'الذهب' },
  { symbol: 'BTCUSD', nameAr: 'البيتكوين' },
  { symbol: 'EURUSD', nameAr: 'اليورو دولار' },
  { symbol: 'US30', nameAr: 'داو جونز' },
  { symbol: 'NAS100', nameAr: 'ناسداك' },
  { symbol: 'ETHUSD', nameAr: 'الإيثريوم' },
];

export default function TradingTerminalPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [accountData, setAccountData] = useState(null);
  const [fundingBreakdown, setFundingBreakdown] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [qualification, setQualification] = useState(null);
  const [loadingQualification, setLoadingQualification] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [activeAsset, setActiveAsset] = useState('XAUUSD');
  const [iframeLoading, setIframeLoading] = useState(true);

  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  // 1. Fetch user competition qualification & prerequisite progress
  const fetchQualification = async () => {
    if (!user?.id) return;
    try {
      setLoadingQualification(true);
      const token = getAccessToken();
      const res = await fetch(`/api/competition/qualification?userId=${user.id}`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.participant) {
          setQualification(data.participant);
        }
      }
    } catch (err) {
      console.warn('Failed to load competition qualification:', err);
    } finally {
      setLoadingQualification(false);
    }
  };

  // 2. Fetch user trading account and calculate demo balance from backend
  const fetchUserAccount = async () => {
    const token = getAccessToken();
    try {
      setLoadingAccount(true);
      const res = await fetch(`${API_BASE_URL}/trading/user-account`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAccountData(data.account);
          setFundingBreakdown(data.fundingBreakdown);
        }
      }
    } catch (err) {
      console.warn('Failed to load user trading account:', err);
    } finally {
      setLoadingAccount(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/trading');
      } else {
        fetchQualification();
        fetchUserAccount();
      }
    }
  }, [authLoading, isAuthenticated, router, user?.id]);

  // Determine qualification status
  const isQualified = Boolean(qualification?.isQualified || qualification?.manualApproval);

  // Determine if user has access to Groups or Courses subscriptions
  const hasGroupOrCourseAccess = Boolean(
    (fundingBreakdown?.hasActiveSubscriptions && Number(fundingBreakdown?.targetCompetitionBalance) > 0) ||
    (fundingBreakdown?.hasEnrolledCourses && Number(fundingBreakdown?.targetCompetitionBalance) > 0) ||
    (qualification?.planCategory && qualification.planCategory !== 'STANDARD')
  );

  // User has trading access if admin, or subscribed to groups/courses, or completed the 4 competition tasks
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const hasTradingAccess = isAdmin || hasGroupOrCourseAccess || isQualified;

  // 2. Post auth and balance synchronization to embedded terminal iframe
  const syncWithIframe = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    const token = getAccessToken();
    // Subscribing to groups or courses provides immediate demo balance to trade with.
    // If not subscribed and not qualified, balance is strictly 0.00 (unless admin).
    const currentBalance = isAdmin
      ? (Number(fundingBreakdown?.targetCompetitionBalance || qualification?.assignedBalance) > 0
          ? Number(fundingBreakdown?.targetCompetitionBalance || qualification?.assignedBalance)
          : 50000)
      : isQualified
        ? (hasGroupOrCourseAccess ? Number(fundingBreakdown?.targetCompetitionBalance || qualification?.assignedBalance || 5000) : 5000)
        : (hasGroupOrCourseAccess ? Number(fundingBreakdown?.targetCompetitionBalance || qualification?.assignedBalance || 5000) : 0);
    const accountName = accountData?.accountName || user?.fullName || 'متداول FXENGIN';

    iframeRef.current.contentWindow.postMessage(
      {
        type: 'FXENGIN_AUTH_SYNC',
        token,
        balance: currentBalance,
        accountName,
        symbol: activeAsset,
      },
      '*'
    );
  };

  // Re-sync whenever account, user, or qualification changes
  useEffect(() => {
    const timer = setTimeout(syncWithIframe, 1500);
    return () => clearTimeout(timer);
  }, [accountData, user, isQualified, qualification, hasTradingAccess]);

  // 3. Toggle Fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const token = getAccessToken();
  const terminalUrl = useMemo(() => {
    let base = process.env.NEXT_PUBLIC_TRADING_URL;
    if (!base) {
      if (
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ) {
        base = 'http://localhost:5173';
      } else {
        base = 'https://trade.fxengen.com';
      }
    }
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    params.set('embedded', '1');
    if (activeAsset) params.set('symbol', activeAsset);
    return `${base}/?${params.toString()}`;
  }, [token, activeAsset]);

  // Determine balance:
  // - If user subscribed to groups or courses: Demo balance is available immediately to trade with
  //   (Gold: 50,000$, Courses: 25,000$, Indices: 10,000$, Forex: 5,000$)
  // - If user completed the 4 competition tasks: Standard 5,000$ competition account is unlocked
  // - If user is NOT subscribed and has NOT completed the 4 tasks: balance is STRICTLY $0.00!
  const balance = isAdmin
    ? (Number(fundingBreakdown?.targetCompetitionBalance || qualification?.assignedBalance) > 0
        ? Number(fundingBreakdown?.targetCompetitionBalance || qualification?.assignedBalance)
        : 50000)
    : isQualified
      ? (hasGroupOrCourseAccess ? Number(fundingBreakdown?.targetCompetitionBalance || qualification?.assignedBalance || 5000) : 5000)
      : (hasGroupOrCourseAccess ? Number(fundingBreakdown?.targetCompetitionBalance || qualification?.assignedBalance || 5000) : 0);

  const equity = hasTradingAccess ? (accountData ? Number(accountData.equity) : balance) : 0;
  const freeMargin = hasTradingAccess ? (accountData ? Number(accountData.freeMargin) : balance) : 0;
  const totalPaid = fundingBreakdown ? Number(fundingBreakdown.totalPaid) : 0;
  const hasActiveBalance = balance > 0;

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[60vh] bg-[#01071E] text-white p-6">
        <div className="w-10 h-10 border-3 border-[#0488F8] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-[#A7AFBF]">جاري التحقق من تسجيل الدخول والوصول للمنصة...</p>
      </div>
    );
  }

  // Calculate tasks completed count for the dedicated conditions badge
  const tgTask = qualification?.tasks?.telegram;
  const igTask = qualification?.tasks?.instagram;
  const fbTask = qualification?.tasks?.facebook;
  const commTask = qualification?.tasks?.community;
  const tasksCompletedCount =
    (tgTask?.completed ? 1 : 0) +
    (igTask?.completed ? 1 : 0) +
    (fbTask?.completed ? 1 : 0) +
    (commTask?.completed ? 1 : 0);

  return (
    <div
      ref={containerRef}
      className={`trading-page-wrapper flex flex-col w-full h-full bg-[#01071E] text-white relative select-none ${
        isFullscreen ? 'fixed inset-0 z-[99999]' : ''
      }`}
      style={{ minHeight: 'calc(100vh - 4.5rem)', height: 'calc(100dvh - var(--top-bars-height, 4.5rem))' }}
    >
      {/* ── Status Bar: Demo Trading vs Competition Qualification ── */}
      <div className="bg-gradient-to-r from-[#06142F] via-[#0A1B3D] to-[#06142F] border-b border-[#12315C] px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-inner ${
            isQualified
              ? 'bg-[#16C784]/20 border border-[#16C784]/40 text-[#16C784]'
              : hasTradingAccess
              ? 'bg-[#0488F8]/20 border border-[#0488F8]/40 text-[#0488F8]'
              : 'bg-[#FB8704]/20 border border-[#FB8704]/40 text-[#FB8704]'
          }`}>
            {isQualified ? <FiAward className="w-4 h-4" /> : hasTradingAccess ? <FiTrendingUp className="w-4 h-4" /> : <FiShield className="w-4 h-4" />}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-white text-xs sm:text-sm">
              {isQualified ? 'مسابقة FXENGIN الرسمية:' : hasTradingAccess ? 'التداول التجريبي (Demo):' : 'منصة FXENGIN:'}
            </span>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#01071E] border border-[#12315C]">
              <span className="text-[11px] text-[#A7AFBF]">
                {isQualified ? 'رصيد المسابقة:' : 'الرصيد التجريبي:'}
              </span>
              <span className={`font-mono font-extrabold text-xs ${hasTradingAccess ? 'text-[#16C784]' : 'text-[#A7AFBF]'}`}>
                ${Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {isQualified ? (
              <span className="text-[#16C784] font-semibold text-[11px] flex items-center gap-1 bg-[#16C784]/10 px-2 py-0.5 rounded-md border border-[#16C784]/30">
                <FiCheckCircle className="w-3.5 h-3.5" /> مشترك مؤهل رسمياً بالمسابقة 🏆
              </span>
            ) : hasTradingAccess ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#FB8704] font-bold text-[11px] flex items-center gap-1 bg-[#FB8704]/10 px-2 py-0.5 rounded-md border border-[#FB8704]/30">
                  <FiAlertCircle className="w-3.5 h-3.5" /> حساب تجريبي (غير مدرج في المسابقة)
                </span>
                <span className="text-[#A7AFBF] hidden lg:inline text-[11px]">
                  • تداولك متاح بحرية، ولحساب صفقاتك في تصنيف المسابقة والمنافسة على الجوائز نفذ الشروط الـ 4
                </span>
              </div>
            ) : (
              <span className="text-[#FB8704] font-bold text-[11px] flex items-center gap-1 bg-[#FB8704]/10 px-2 py-0.5 rounded-md border border-[#FB8704]/30">
                <FiAlertCircle className="w-3.5 h-3.5" /> غير مشترك في أي باقة (الرصيد 0.00$)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isQualified ? (
            <button
              onClick={() => setShowQualificationModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <FiCheckCircle className="w-3.5 h-3.5" />
              <span>شروط المسابقة (مكتملة 4/4 ✓)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowQualificationModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FB8704] to-[#FA5A04] hover:brightness-110 text-black font-extrabold text-xs shadow-md shadow-[#FB8704]/20 transition-all active:scale-95 cursor-pointer animate-pulse"
            >
              <FiAward className="w-3.5 h-3.5" />
              <span>{hasTradingAccess ? 'دخول المسابقة الرسمية' : 'شروط المسابقة والمهام'} ({tasksCompletedCount}/4)</span>
            </button>
          )}

          {!hasGroupOrCourseAccess && !isQualified && (
            <Link
              href="/analyses"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0A1B3D] hover:bg-[#12315C] text-[#FB8704] border border-[#FB8704]/30 text-[11px] font-semibold transition-all"
            >
              <FiZap className="w-3 h-3" /> اشتراك المجموعات الـ 3 والكورسات
            </Link>
          )}
        </div>
      </div>

      {/* ── Non-Subscribed Warning Notice Bar ── */}
      {!hasTradingAccess && (
        <div className="bg-gradient-to-r from-[#06142F] via-[#0A1B3D] to-[#06142F] border-b border-[#FB8704]/40 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs z-20 shrink-0">
          <div className="flex items-center gap-2 text-white">
            <span className="w-2 h-2 rounded-full bg-[#FB8704] animate-ping" />
            <span className="text-[#FB8704] font-extrabold">تنبيه:</span>
            <span className="text-white text-xs">
              رصيد حسابك الحالي <strong>0.00$</strong> لأنك غير مشترك في أي باقة أو كورس ولم تستكمل شروط المسابقة بعد.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowQualificationModal(true)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FB8704] to-[#FA5A04] text-black font-extrabold text-xs shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              استكمال شروط المسابقة للحصول على 5,000$ مجاناً
            </button>
            <Link
              href="/analyses"
              className="px-3 py-1.5 rounded-lg bg-[#01071E] border border-[#0488F8]/40 text-[#0488F8] font-bold text-xs hover:bg-[#0488F8]/10 transition-all"
            >
              الاشتراك في باقات المجموعات الـ 3 (فوركس، اندكس، ذهب)
            </Link>
          </div>
        </div>
      )}

      {/* ── Quick Asset Selector Bar ── */}
      <div className="bg-[#020B24] border-b border-[#12315C] px-3 sm:px-5 py-1.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar z-20 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-[#A7AFBF] hidden sm:inline ml-1">
            الشارت المباشر:
          </span>
          {QUICK_ASSETS.map((asset) => {
            const isActive = activeAsset === asset.symbol;
            return (
              <button
                key={asset.symbol}
                onClick={() => {
                  setActiveAsset(asset.symbol);
                  if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage(
                      {
                        type: 'FXENGIN_SYMBOL_CHANGE',
                        symbol: asset.symbol,
                      },
                      '*'
                    );
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#0488F8] text-white shadow-md shadow-[#0488F8]/30 font-black'
                    : 'bg-[#06142F] text-[#A7AFBF] hover:text-white hover:bg-[#0A1B3D] border border-[#12315C]'
                }`}
              >
                <span>{asset.nameAr}</span>
                <span className={`text-[10px] font-mono ${isActive ? 'text-white/80' : 'text-[#687287]'}`}>
                  {asset.symbol}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowInfoModal(true)}
            className="p-1.5 rounded-lg bg-[#06142F] hover:bg-[#0A1B3D] text-[#A7AFBF] hover:text-white border border-[#12315C] text-xs transition-all"
            title="فئات الرصيد وشروط المسابقة"
          >
            <FiInfo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-[#06142F] hover:bg-[#0A1B3D] text-[#A7AFBF] hover:text-white border border-[#12315C] text-xs transition-all"
            title={isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة للشارت'}
          >
            {isFullscreen ? <FiMinimize2 className="w-3.5 h-3.5" /> : <FiMaximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Main Interactive Trading Terminal Frame ──────────────────── */}
      <main className="flex-1 w-full relative overflow-hidden bg-[#01071E]">
        {iframeLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#01071E] text-white p-6 gap-4 select-none">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 border-3 border-[#0488F8]/20 border-t-[#0488F8] rounded-full animate-spin" />
              <span className="text-[#FB8704] font-black text-sm">FX</span>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-white">جاري تشغيل منصة التداول والشارتات الحية...</p>
              <p className="text-xs text-[#A7AFBF]">يتم مزامنة الأسعار الحية ومحفظة المسابقة</p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={terminalUrl}
          onLoad={() => {
            setIframeLoading(false);
            syncWithIframe();
          }}
          title="FXENGIN Trading Terminal"
          className="w-full h-full border-0 absolute inset-0"
          allow="fullscreen; clipboard-read; clipboard-write; web-share"
        />
      </main>

      {/* ── Competition Tier Rules Modal ──────────────────────────── */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#06142F] border border-[#12315C] rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#12315C]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FB8704]/20 border border-[#FB8704]/30 flex items-center justify-center text-[#FB8704]">
                  <FiZap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-white">
                  فئات الأرصدة التجريبية وشروط مسابقة FXENGIN
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-[#687287] hover:text-white p-1 rounded-lg hover:bg-[#0A1B3D]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#A7AFBF] leading-relaxed">
              <p className="text-[#F5F7FA] font-medium">
                بمجرد اشتراكك في باقات التحليلات أو الكورسات، يتوفر لك رصيد تجريبي (Demo) فوري للتداول واختبار الاستراتيجيات بحرية:
              </p>

              <div className="p-3.5 rounded-xl bg-[#01071E] border border-[#12315C] space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <FiAward className="text-[#FB8704]" /> فئات الرصيد التجريبي المتاح:
                </h4>
                <ul className="space-y-1.5 pr-4 list-disc text-[11px]">
                  <li>
                    <strong className="text-white">جروب الذهب:</strong> يمنحك رصيد تداول تجريبي{' '}
                    <strong className="text-[#16C784]">50,000.00$</strong> فوري.
                  </li>
                  <li>
                    <strong className="text-white">الكورسات التدريبية:</strong> تمنحك رصيد تداول تجريبي{' '}
                    <strong className="text-[#16C784]">25,000.00$</strong> فوري.
                  </li>
                  <li>
                    <strong className="text-white">جروب الاندكس والمؤشرات:</strong> يمنحك رصيد تداول تجريبي{' '}
                    <strong className="text-[#16C784]">10,000.00$</strong> فوري.
                  </li>
                  <li>
                    <strong className="text-white">جروب الفوركس والعملات:</strong> يمنحك رصيد تداول تجريبي{' '}
                    <strong className="text-[#16C784]">5,000.00$</strong> فوري.
                  </li>
                  <li className="text-[#0488F8]">
                    <strong>الحساب المجاني:</strong> استكمال شروط المسابقة الـ 4 يمنحك حساب مسابقة مجاني برصيد <strong>5,000.00$</strong>.
                  </li>
                  <li className="text-[#FB8704]">
                    <strong>المنافسة على جوائز المسابقة:</strong> يتطلب استكمال الشروط الـ 4 لإدراج صفقاتك ونقاطك رسمياً في تصنيف المسابقة.
                  </li>
                </ul>
              </div>

              <p className="text-[11px] text-[#687287]">
                * يمكنك التداول فورياً برصيدك التجريبي دون قيود، وتفعيل الدخول للمسابقة متاح بأي وقت باستكمال الشروط.
              </p>
            </div>

            <div className="pt-3 border-t border-[#12315C] flex items-center justify-end gap-2">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-lg bg-[#0A1B3D] hover:bg-[#12315C] text-[#A7AFBF] text-xs font-semibold"
              >
                فهمت ذلك
              </button>
              <Link
                href="/analyses"
                className="px-4 py-2 rounded-lg bg-[#FB8704] hover:bg-[#FA5A04] text-black text-xs font-bold"
              >
                عرض باقات المجموعات الـ 3 والكورسات
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Persistent Floating Button for Competition Rules / Conditions ── */}
      <button
        onClick={() => setShowQualificationModal(true)}
        className="fixed bottom-6 left-6 z-[80] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#06142F] to-[#0A1B3D] text-white border border-[#FB8704]/60 shadow-2xl hover:border-[#FB8704] transition-all hover:scale-105 active:scale-95 group cursor-pointer"
        title="شروط التأهل للمسابقة"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${isQualified ? 'bg-[#16C784]' : 'bg-[#FB8704] animate-pulse'}`} />
        <span className="text-xs font-bold text-[#F5F7FA]">
          {isQualified ? 'حالة المسابقة' : hasTradingAccess ? 'دخول المسابقة الرسمية' : 'شروط المسابقة'}
        </span>
        <span className="px-1.5 py-0.5 rounded-full bg-[#FB8704]/20 text-[#FB8704] text-[10px] font-extrabold font-mono">
          {tasksCompletedCount}/4
        </span>
      </button>

      {/* ── Dedicated Conditions & Tasks Modal (مكان مخصص للشروط) ── */}
      {showQualificationModal && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQualificationModal(false);
          }}
        >
          <div className="relative w-full max-w-5xl bg-[#01071E] border border-[#12315C] rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col my-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#06142F] border-b border-[#12315C] shrink-0">
              <div className="flex items-center gap-2">
                <FiAward className="w-5 h-5 text-[#FB8704]" />
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  بوابة شروط التأهل لمسابقة FXENGIN الكبرى
                </h3>
              </div>
              <button
                onClick={() => setShowQualificationModal(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0A1B3D] hover:bg-[#12315C] text-[#A7AFBF] hover:text-white border border-[#12315C] text-xs font-bold transition-all cursor-pointer"
              >
                <span>العودة للشارت والتداول</span>
                <span>✕</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <CompetitionQualificationGate
                participant={qualification}
                onRefresh={fetchQualification}
                onEnterCompetition={() => {
                  fetchQualification();
                  fetchUserAccount();
                  setShowQualificationModal(false);
                }}
                onClose={() => setShowQualificationModal(false)}
                isModal={true}
                user={user}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
