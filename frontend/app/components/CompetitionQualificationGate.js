'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FaTelegramPlane,
  FaInstagram,
  FaFacebookF,
  FaWhatsapp,
  FaTwitter,
  FaCheckCircle,
  FaLock,
  FaCopy,
  FaExternalLinkAlt,
  FaSyncAlt,
  FaTrophy,
  FaUsers,
  FaAward,
  FaShieldAlt,
  FaArrowRight,
  FaBolt,
} from 'react-icons/fa';
import { showToast } from '../utils/toast';

export default function CompetitionQualificationGate({
  participant,
  onRefresh,
  onEnterCompetition,
  onClose,
  isModal = false,
  user,
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingCommunity, setConfirmingCommunity] = useState(false);

  if (!participant) return null;

  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://fxengen.com';

  const tgTask = participant.tasks?.telegram || { required: 10, current: 0, completed: false };
  const igTask = participant.tasks?.instagram || { required: 10, current: 0, completed: false };
  const fbTask = participant.tasks?.facebook || { required: 10, current: 0, completed: false };
  const commTask = participant.tasks?.community || { required: 1, current: 0, completed: false, joined: false };

  const tgUrl = `${siteOrigin}/c/tg/${participant.userId}`;
  const igUrl = `${siteOrigin}/c/ig/${participant.userId}`;
  const fbUrl = `${siteOrigin}/c/fb/${participant.userId}`;
  const commUrl = `${siteOrigin}/c/community/${participant.userId}`;

  // Calculate overall progress
  const tasksCompletedCount =
    (tgTask.completed ? 1 : 0) +
    (igTask.completed ? 1 : 0) +
    (fbTask.completed ? 1 : 0) +
    (commTask.completed ? 1 : 0);

  const progressPercent = Math.round((tasksCompletedCount / 4) * 100);
  const isFullyQualified = Boolean(participant.isQualified || participant.manualApproval);

  const handleCopy = (text, key) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast.success('تم نسخ الرابط الفرعي بنجاح!');
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
      showToast.info('تم تحديث حالة العدادات والزيارات!');
    } finally {
      setRefreshing(false);
    }
  };

  const handleConfirmCommunity = async () => {
    setConfirmingCommunity(true);
    try {
      const res = await fetch('/api/competition/qualification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_community', userId: participant.userId }),
      });
      if (res.ok) {
        showToast.success('تم تأكيد الانضمام لمجتمع 10% بنجاح!');
        try {
          localStorage.setItem('fxengin_is_partner', 'true');
          window.dispatchEvent(
            new CustomEvent('fxengin:partner_status_changed', {
              detail: { isPartner: true },
            })
          );
        } catch (e) {}
        await onRefresh?.();
      }
    } catch {
      showToast.error('حدث خطأ أثناء التأكيد');
    } finally {
      setConfirmingCommunity(false);
    }
  };

  return (
    <div
      className={`relative w-full ${isModal ? 'min-h-0 py-6' : 'min-h-screen pt-6 pb-32'} px-4 sm:px-6 lg:px-8 flex flex-col items-center bg-cover bg-center bg-no-repeat bg-fixed`}
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(1, 7, 30, 0.88), rgba(1, 7, 30, 0.72) 40%, rgba(1, 7, 30, 0.95)), url('/assets/Images/Main/competition-bg.webp')`
      }}
    >
      <div className="relative z-10 w-full max-w-5xl space-y-6">
        
        {/* Modal Top Bar Return Button */}
        {onClose && (
          <div className="flex items-center justify-between pb-3 border-b border-[#12315C] mb-2">
            <div className="flex items-center gap-2">
              <FaTrophy className="w-5 h-5 text-[#FB8704]" />
              <span className="font-bold text-white text-sm sm:text-base">بوابة شروط التأهل لمسابقة FXENGIN</span>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0A1B3D] hover:bg-[#12315C] text-[#A7AFBF] hover:text-white border border-[#12315C] text-xs font-bold transition-all shadow-sm"
            >
              <span>العودة للشارت</span>
              <span>✕</span>
            </button>
          </div>
        )}

        {/* ── 1. Header Banner ────────────────────────────────────────── */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FB8704]/20 backdrop-blur-md border border-[#FB8704]/40 text-[#FB8704] text-xs font-bold shadow-lg shadow-[#FB8704]/10">
            <FaTrophy className="w-3.5 h-3.5 text-[#FB8704]" />
            <span>بوابة شروط التأهل لمسابقة FXENGIN الرسمية</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-mono drop-shadow-md">
            شروط الدخول في تصنيف مسابقة FXENGIN الرسمية
          </h1>

          <p className="text-xs sm:text-sm text-[#A7AFBF] max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            إذا كنت مشتركاً في باقات التحليلات أو الكورسات، رصيدك التجريبي متاح للتداول فوراً! استكمال هذه الشروط الـ 4 يتيح لك إدراج تداولاتك ونقاطك رسمياً في تصنيف المسابقة للمنافسة على الجوائز الكبرى. للمشتركين الجدد، استكمال الشروط يمنحك حساب مسابقة مجاني معتمد برصيد 5,000$.
          </p>
        </div>

        {/* ── 2. Category & Assigned Balance Card ──────────────────────── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#06142F]/85 backdrop-blur-xl border border-[#12315C]/90 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#0488F8]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#12315C]/80 pb-3">
            <div>
              <span className="text-[11px] text-[#687287] font-semibold">فئة حسابك والرصيد التجريبي المخصص:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base sm:text-lg font-black text-white">
                  {participant.categoryTitleAr || 'حساب المسابقة المعتمد'}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#0488F8]/25 border border-[#0488F8]/50 text-[#0488F8] text-[11px] font-bold">
                  {participant.planCategory}
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 bg-[#0A1B3D]/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#12315C] self-start md:self-auto shadow-inner">
              <span className="text-xs text-[#A7AFBF]">رصيد الحساب:</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#16C784] font-mono tabular-nums">
                ${Number(participant.assignedBalance || 5000).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Tier Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 text-center">
            <div className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${participant.planCategory === 'GOLD' ? 'bg-[#FB8704]/20 border-[#FB8704] text-white shadow-lg shadow-[#FB8704]/20' : 'bg-[#01071E]/60 border-[#12315C] text-[#A7AFBF]'}`}>
              <div className="text-xs font-bold text-[#FB8704]">جروب الذهب</div>
              <div className="text-base font-black text-[#16C784] font-mono mt-0.5">$50,000</div>
              <span className="text-[10px] opacity-75">رصيد تجريبي فوري</span>
            </div>

            <div className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${participant.planCategory === 'COURSES' ? 'bg-[#0488F8]/20 border-[#0488F8] text-white shadow-lg shadow-[#0488F8]/20' : 'bg-[#01071E]/60 border-[#12315C] text-[#A7AFBF]'}`}>
              <div className="text-xs font-bold text-[#0488F8]">الكورسات</div>
              <div className="text-base font-black text-[#16C784] font-mono mt-0.5">$25,000</div>
              <span className="text-[10px] opacity-75">رصيد تجريبي فوري</span>
            </div>

            <div className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${participant.planCategory === 'INDICES' ? 'bg-[#0488F8]/20 border-[#0488F8] text-white shadow-lg shadow-[#0488F8]/20' : 'bg-[#01071E]/60 border-[#12315C] text-[#A7AFBF]'}`}>
              <div className="text-xs font-bold text-sky-400">الاندكس</div>
              <div className="text-base font-black text-[#16C784] font-mono mt-0.5">$10,000</div>
              <span className="text-[10px] opacity-75">رصيد تجريبي فوري</span>
            </div>

            <div className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${participant.planCategory === 'FOREX' ? 'bg-[#0488F8]/20 border-[#0488F8] text-white shadow-lg shadow-[#0488F8]/20' : 'bg-[#01071E]/60 border-[#12315C] text-[#A7AFBF]'}`}>
              <div className="text-xs font-bold text-emerald-400">الفوركس</div>
              <div className="text-base font-black text-[#16C784] font-mono mt-0.5">$5,000</div>
              <span className="text-[10px] opacity-75">رصيد تجريبي فوري</span>
            </div>
          </div>
        </div>

        {/* ── 3. Overall Progress Bar & Actions ───────────────────────── */}
        <div className="p-3.5 rounded-xl bg-[#06142F]/85 backdrop-blur-xl border border-[#12315C]/90 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 w-full space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#A7AFBF]">نسبة إنجاز شروط التأهل:</span>
              <span className={isFullyQualified ? 'text-[#16C784]' : 'text-[#FB8704]'}>
                {isFullyQualified ? 'مكتمل بنسبة 100% (مؤهل للبدء)' : `${progressPercent}% (${tasksCompletedCount} من 4 مهام)`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#01071E] border border-[#12315C] overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isFullyQualified
                    ? 'bg-gradient-to-r from-[#16C784] to-[#0488F8]'
                    : 'bg-gradient-to-r from-[#FB8704] to-[#FA5A04]'
                }`}
                style={{ width: `${isFullyQualified ? 100 : progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A1B3D] hover:bg-[#12315C] text-xs font-bold text-[#A7AFBF] hover:text-white border border-[#12315C] transition-all"
              title="تحديث وفحص العدادات لحظياً"
            >
              <FaSyncAlt className={`w-3 h-3 ${refreshing ? 'animate-spin text-[#0488F8]' : ''}`} />
              <span>تحديث الحالة</span>
            </button>

            {isFullyQualified && (
              <button
                onClick={onEnterCompetition}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#16C784] to-[#0488F8] text-white font-extrabold text-sm shadow-lg shadow-[#16C784]/25 hover:opacity-95 active:scale-95 transition-all animate-pulse"
              >
                <span>دخول منصة المسابقة الآن</span>
                <FaArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── 4. The 4 Mandatory Tasks Cards ──────────────────────────── */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <FaShieldAlt className="text-[#0488F8]" />
              <span>الشروط الـ 4 الواجب استيفاؤها للدخول:</span>
            </h2>

            {/* Quick Task Navigation Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <a
                href="#task-telegram"
                className={`px-2.5 py-1 rounded-full font-bold border transition-all flex items-center gap-1 ${
                  tgTask.completed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-[#06142F] text-blue-400 border-blue-500/30'
                }`}
              >
                <FaTelegramPlane className="w-3 h-3" />
                <span>1. تليجرام ({tgTask.current}/10)</span>
              </a>

              <a
                href="#task-instagram"
                className={`px-2.5 py-1 rounded-full font-bold border transition-all flex items-center gap-1 ${
                  igTask.completed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-[#06142F] text-pink-400 border-pink-500/30'
                }`}
              >
                <FaInstagram className="w-3 h-3" />
                <span>2. إنستجرام ({igTask.current}/10)</span>
              </a>

              <a
                href="#task-facebook"
                className={`px-2.5 py-1 rounded-full font-bold border transition-all flex items-center gap-1 ${
                  fbTask.completed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-[#1877F2]/20 text-[#1877F2] border-[#1877F2]/50 font-black'
                }`}
              >
                <FaFacebookF className="w-3 h-3" />
                <span>3. فيسبوك ({fbTask.current}/10)</span>
              </a>

              <a
                href="#task-community"
                className={`px-2.5 py-1 rounded-full font-bold border transition-all flex items-center gap-1 ${
                  commTask.completed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-[#06142F] text-amber-400 border-amber-500/30'
                }`}
              >
                <FaBolt className="w-3 h-3" />
                <span>4. مجتمع ربح 10%</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* TASK 1: TELEGRAM LINK SHARE (10 USERS) */}
            <div id="task-telegram" className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xl flex flex-col justify-between transition-all shadow-xl ${tgTask.completed ? 'bg-[#16C784]/10 border-[#16C784]/40' : 'bg-[#06142F]/85 border-blue-500/40 hover:border-blue-400'}`}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#24A1DE]/20 border border-[#24A1DE]/40 flex items-center justify-center text-[#24A1DE] shrink-0">
                      <FaTelegramPlane className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">1. مشاركة لينك التليجرام لـ 10 مستخدمين</h3>
                      <p className="text-[11px] text-[#A7AFBF]">لينك قناة تيليجرام الرسمية الموجود في الفوتر</p>
                    </div>
                  </div>

                  {tgTask.completed ? (
                    <span className="px-2.5 py-1 rounded bg-[#16C784]/20 border border-[#16C784]/40 text-[#16C784] text-xs font-bold flex items-center gap-1 shrink-0">
                      <FaCheckCircle className="w-3 h-3" /> تم الإنجاز
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-[#FB8704]/20 border border-[#FB8704]/40 text-[#FB8704] text-xs font-bold font-mono shrink-0">
                      {tgTask.current} / 10
                    </span>
                  )}
                </div>

                {/* Sub Link Box */}
                <div className="space-y-1.5 pt-2 border-t border-[#12315C]">
                  <span className="text-[11px] text-[#687287]">رابطك الفرعي المخصص (Sub-Link):</span>
                  <div className="flex items-center gap-1.5 bg-[#01071E] p-1.5 rounded-lg border border-[#12315C]">
                    <input
                      type="text"
                      readOnly
                      value={tgUrl}
                      className="bg-transparent text-xs text-white px-2 py-1 flex-1 outline-none font-mono selection:bg-[#0488F8]"
                    />
                    <button
                      onClick={() => handleCopy(tgUrl, 'tg')}
                      className="p-1.5 rounded bg-[#0A1B3D] hover:bg-[#12315C] text-[#A7AFBF] hover:text-white transition-colors"
                      title="نسخ الرابط"
                    >
                      <FaCopy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={tgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-[#0A1B3D] hover:bg-[#12315C] text-[#24A1DE] transition-colors"
                      title="فتح الرابط"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Share Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#12315C]">
                <span className="text-[11px] text-[#687287]">مشاركة سريعة:</span>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`انضم إلى قناة تليجرام FXENGIN الرسمية وشارك في مسابقة التداول الكبرى:\n${tgUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <FaWhatsapp className="w-3 h-3" /> واتساب
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(tgUrl)}&text=${encodeURIComponent('انضم لقناة FXENGIN للمسابقة والتحليلات:')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-[#24A1DE]/15 hover:bg-[#24A1DE]/25 text-[#24A1DE] text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <FaTelegramPlane className="w-3 h-3" /> تيليجرام
                </a>
              </div>
            </div>

            {/* TASK 2: INSTAGRAM SHARE (10 USERS) */}
            <div id="task-instagram" className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xl flex flex-col justify-between transition-all shadow-xl ${igTask.completed ? 'bg-[#16C784]/10 border-[#16C784]/40' : 'bg-[#06142F]/85 border-pink-500/40 hover:border-pink-400'}`}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#E4405F]/20 border border-[#E4405F]/40 flex items-center justify-center text-[#E4405F] shrink-0">
                      <FaInstagram className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">2. مشاركة حساب الانستجرام لـ 10 مستخدمين</h3>
                      <p className="text-[11px] text-[#A7AFBF]">رابط حساب انستجرام الرسمي من الفوتر</p>
                    </div>
                  </div>

                  {igTask.completed ? (
                    <span className="px-2.5 py-1 rounded bg-[#16C784]/20 border border-[#16C784]/40 text-[#16C784] text-xs font-bold flex items-center gap-1 shrink-0">
                      <FaCheckCircle className="w-3 h-3" /> تم الإنجاز
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-[#FB8704]/20 border border-[#FB8704]/40 text-[#FB8704] text-xs font-bold font-mono shrink-0">
                      {igTask.current} / 10
                    </span>
                  )}
                </div>

                {/* Sub Link Box */}
                <div className="space-y-1.5 pt-2 border-t border-[#12315C]">
                  <span className="text-[11px] text-[#687287]">رابطك الفرعي المخصص (Sub-Link):</span>
                  <div className="flex items-center gap-1.5 bg-[#01071E] p-1.5 rounded-lg border border-[#12315C]">
                    <input
                      type="text"
                      readOnly
                      value={igUrl}
                      className="bg-transparent text-xs text-white px-2 py-1 flex-1 outline-none font-mono"
                    />
                    <button
                      onClick={() => handleCopy(igUrl, 'ig')}
                      className="p-1.5 rounded bg-[#0A1B3D] hover:bg-[#12315C] text-[#A7AFBF] hover:text-white transition-colors"
                      title="نسخ الرابط"
                    >
                      <FaCopy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={igUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-[#0A1B3D] hover:bg-[#12315C] text-[#E4405F] transition-colors"
                      title="فتح الرابط"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Share Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#12315C]">
                <span className="text-[11px] text-[#687287]">مشاركة سريعة:</span>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`تابع حساب FXENGIN على انستجرام للحصول على أحدث تحليلات التداول:\n${igUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <FaWhatsapp className="w-3 h-3" /> واتساب
                </a>
              </div>
            </div>

            {/* TASK 3: FACEBOOK SHARE (10 USERS) */}
            <div id="task-facebook" className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xl flex flex-col justify-between transition-all shadow-xl ${fbTask.completed ? 'bg-[#16C784]/10 border-[#16C784]/40' : 'bg-[#06142F]/85 border-blue-500/40 hover:border-[#1877F2]'}`}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#1877F2]/25 border border-[#1877F2]/50 flex items-center justify-center text-[#1877F2] shrink-0 shadow-md">
                      <FaFacebookF className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>3. مشاركة صفحة الفيسبوك لـ 10 مستخدمين</span>
                      </h3>
                      <p className="text-[11px] text-[#A7AFBF]">رابط صفحة فيسبوك الرسمية من الفوتر</p>
                    </div>
                  </div>

                  {fbTask.completed ? (
                    <span className="px-2.5 py-1 rounded bg-[#16C784]/20 border border-[#16C784]/40 text-[#16C784] text-xs font-bold flex items-center gap-1 shrink-0">
                      <FaCheckCircle className="w-3 h-3" /> تم الإنجاز
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-[#1877F2]/20 border border-[#1877F2]/40 text-[#1877F2] text-xs font-black font-mono shrink-0">
                      {fbTask.current} / 10
                    </span>
                  )}
                </div>

                {/* Sub Link Box */}
                <div className="space-y-1.5 pt-2 border-t border-[#12315C]">
                  <span className="text-[11px] text-[#687287]">رابطك الفرعي المخصص لفيسبوك (Sub-Link):</span>
                  <div className="flex items-center gap-1.5 bg-[#01071E] p-1.5 rounded-lg border border-[#12315C] focus-within:border-[#1877F2]">
                    <input
                      type="text"
                      readOnly
                      value={fbUrl}
                      className="bg-transparent text-xs text-white px-2 py-1 flex-1 outline-none font-mono"
                    />
                    <button
                      onClick={() => handleCopy(fbUrl, 'fb')}
                      className="p-1.5 rounded bg-[#0A1B3D] hover:bg-[#12315C] text-[#A7AFBF] hover:text-white transition-colors"
                      title="نسخ الرابط"
                    >
                      <FaCopy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={fbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-[#0A1B3D] hover:bg-[#12315C] text-[#1877F2] transition-colors"
                      title="فتح الرابط"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Share Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#12315C]">
                <span className="text-[11px] text-[#687287]">مشاركة سريعة:</span>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fbUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] border border-[#1877F2]/30 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <FaFacebookF className="w-3 h-3" /> فيسبوك
                </a>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`تابع صفحة FXENGIN الرسمية على فيسبوك وشارك في مسابقة التداول الكبرى:\n${fbUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <FaWhatsapp className="w-3 h-3" /> واتساب
                </a>
              </div>
            </div>

            {/* TASK 4: JOIN 10% PROFIT COMMUNITY & SHARE LINK */}
            <div id="task-community" className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xl flex flex-col justify-between transition-all shadow-xl ${commTask.completed ? 'bg-[#16C784]/10 border-[#16C784]/40' : 'bg-[#06142F]/85 border-emerald-500/40 hover:border-emerald-400'}`}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FB8704]/20 border border-[#FB8704]/40 flex items-center justify-center text-[#FB8704] shrink-0">
                      <FaBolt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">4. الدخول لمجتمعنا (ربح 10%) ومشاركة اللينك</h3>
                      <p className="text-[11px] text-[#A7AFBF]">الانضمام لبرنامج الشركاء والحصول على رابط الإحالة</p>
                    </div>
                  </div>

                  {commTask.completed ? (
                    <span className="px-2.5 py-1 rounded bg-[#16C784]/20 border border-[#16C784]/40 text-[#16C784] text-xs font-bold flex items-center gap-1 shrink-0">
                      <FaCheckCircle className="w-3 h-3" /> تم الانضمام
                    </span>
                  ) : (
                    <button
                      onClick={handleConfirmCommunity}
                      disabled={confirmingCommunity}
                      className="px-3 py-1 rounded bg-gradient-to-r from-[#FB8704] to-[#FA5A04] hover:opacity-90 text-black text-xs font-extrabold shrink-0 shadow-sm"
                    >
                      {confirmingCommunity ? 'جاري التحقق...' : 'تأكيد الانضمام'}
                    </button>
                  )}
                </div>

                {/* Sub Link Box */}
                <div className="space-y-1.5 pt-2 border-t border-[#12315C]">
                  <span className="text-[11px] text-[#687287]">رابط مجتمع الشركاء (10% عمولة):</span>
                  <div className="flex items-center gap-1.5 bg-[#01071E] p-1.5 rounded-lg border border-[#12315C]">
                    <input
                      type="text"
                      readOnly
                      value={commUrl}
                      className="bg-transparent text-xs text-white px-2 py-1 flex-1 outline-none font-mono"
                    />
                    <button
                      onClick={() => handleCopy(commUrl, 'comm')}
                      className="p-1.5 rounded bg-[#0A1B3D] hover:bg-[#12315C] text-[#A7AFBF] hover:text-white transition-colors"
                      title="نسخ الرابط"
                    >
                      <FaCopy className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      href="/join-us"
                      target="_blank"
                      className="p-1.5 rounded bg-[#0A1B3D] hover:bg-[#12315C] text-[#FB8704] transition-colors"
                      title="فتح صفحة انضم إلينا"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[#12315C]">
                <Link
                  href="/join-us"
                  target="_blank"
                  className="text-xs text-[#0488F8] hover:underline font-bold flex items-center gap-1"
                >
                  <span>استعراض تفاصيل مجتمع الـ 10% أرباح</span>
                  <FaExternalLinkAlt className="w-2.5 h-2.5" />
                </Link>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`انضم لبرنامج شركاء FXENGIN واربح 10% عمولة فورية من كل كورس أو باقة:\n${commUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <FaWhatsapp className="w-3 h-3" /> مشاركة
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* ── 5. Bottom Help / Notification ───────────────────────────── */}
        <div className="p-4 rounded-xl bg-[#0A1B3D]/80 backdrop-blur-xl border border-[#12315C]/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A7AFBF] shadow-lg">
          <div className="flex items-center gap-2">
            <FaShieldAlt className="w-4 h-4 text-[#0488F8] shrink-0" />
            <span>
              يتم رصد الزيارات والإحالات عبر روابطك الفرعية (Sub-Links) تلقائياً وفورياً. يمكنك مشاركة الروابط مع أصدقائك في أي وقت لتسريع تأهلك.
            </span>
          </div>

          <a
            href="https://t.me/FXENGIN1NEWS"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0488F8] hover:underline font-bold shrink-0"
          >
            تواصل مع الدعم الفني
          </a>
        </div>

        {onClose && (
          <div className="flex justify-center pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0488F8] to-[#0458EC] hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-[#0488F8]/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <span>العودة لمنصة التداول والشارت</span>
              <FaArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
