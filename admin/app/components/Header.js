'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAdmin } from '../context/AdminContext';
import { toast } from 'react-toastify';
import SuperAdminDossierModal from './auth/SuperAdminDossierModal';
import AdminLoginModal from './auth/AdminLoginModal';

import TickerBar from './TickerBar';

export default function Header() {
  const {
    lang,
    toggleLanguage,
    setIsCommandPaletteOpen,
    setIsMobileMenuOpen,
    adminUser,
    superAdminDossier,
    setIsDossierModalOpen,
    setIsLoginModalOpen,
    logoutSuperAdmin,
    isAuthenticated,
  } = useAdmin();

  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    {
      id: 1,
      title: 'تحقيق الهدف TP2 لصفقة الذهب',
      detail: 'حقق زوج XAU/USD الهدف الثاني (+140 Pips)',
      time: 'منذ دقيقتين',
      type: 'success',
    },
    {
      id: 2,
      title: 'اشتراك VIP سنوي جديد',
      detail: 'انضم خالد السبيعي إلى باقة VIP بنجاح',
      time: 'منذ 7 دقائق',
      type: 'vip',
    },
    {
      id: 3,
      title: 'تأكيد اتصال جسر السيولة ECN',
      detail: 'معدل الاستجابة ممتاز 8ms على خادم LD4',
      time: 'منذ 15 دقيقة',
      type: 'system',
    },
  ];

  return (
    <header className="fixed top-0 right-0 md:right-72 left-0 h-20 bg-canvas-deep/85 backdrop-blur-xl border-b border-border-structural z-40 flex flex-col transition-[right] duration-200">
      {/* 1. Live Ticker Stream Bar (Matching Website Experience) */}
      <TickerBar />

      {/* 2. Controls & User Bar */}
      <div className="h-[52px] px-3 sm:px-4 md:px-space-lg flex items-center justify-between gap-2 sm:gap-space-md">
        <div className="flex items-center gap-2 sm:gap-space-md">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden w-8 h-8 rounded-lg bg-surface-container border border-border-structural flex items-center justify-center text-text-secondary hover:text-text-primary cursor-pointer shrink-0"
            type="button"
            title="القائمة الجانبية"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>

          {/* Command Palette Trigger */}
          <div
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-1.5 sm:gap-space-xs px-2.5 sm:px-space-sm py-1.5 bg-surface-container rounded-xl border border-border-structural text-text-muted hover:border-primary-container transition-all cursor-pointer shrink-0"
            title="لوحة الأوامر السريعة (⌘K)"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">
              terminal
            </span>
            <span className="font-label-sm text-label-sm text-text-secondary hidden sm:inline">
              لوحة الأوامر السريعة
            </span>
            <kbd className="font-telemetry-micro text-telemetry-micro px-1.5 py-0.5 rounded bg-surface-elevated border border-border-structural text-text-muted dir-ltr text-[10px]">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-space-md">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 sm:gap-space-2xs px-2 sm:px-space-sm py-1 rounded-xl bg-surface-container border border-border-structural text-text-secondary hover:text-on-surface hover:border-primary transition-all cursor-pointer shrink-0"
            type="button"
            title="تغيير اللغة"
          >
            <span className="material-symbols-outlined text-[18px]">translate</span>
            <span className="font-label-sm text-label-sm font-bold hidden xs:inline sm:inline">
              {lang === 'ar' ? 'العربية' : 'EN'}
            </span>
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container border border-border-structural text-text-secondary hover:text-on-surface hover:border-primary transition-all relative cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
              <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-accent-hover border border-canvas-deep"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface-container border border-border-structural rounded-2xl shadow-2xl p-space-sm z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-border-structural/50">
                  <span className="font-label-md text-label-md font-bold text-text-primary">
                    مركز التنبيهات
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-hover/20 text-accent-hover">
                    3 جديد
                  </span>
                </div>
                <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-2 rounded-xl bg-surface-elevated/80 hover:bg-surface-elevated transition-all flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-primary">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        {notif.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin Auth Link if not logged in (rendered after mount to avoid SSR mismatch) */}
          {mounted && !isAuthenticated && (
            <Link
              href="/login"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-accent-hover/20 hover:bg-accent-hover/30 border border-accent-hover/40 text-accent-hover font-bold text-xs transition-all cursor-pointer shadow-sm shrink-0"
              title="تسجيل الدخول كمسؤول"
            >
              <span className="material-symbols-outlined text-[16px]">vpn_key</span>
              <span className="hidden sm:inline">تسجيل الدخول</span>
            </Link>
          )}

          <div className="h-6 w-px bg-border-structural"></div>

          {/* User Profile & Security Clearance Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-space-sm p-1 rounded-xl hover:bg-surface-elevated/80 border border-transparent hover:border-border-structural transition-all cursor-pointer select-none"
            >
              <div className="hidden md:flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-label-sm text-label-sm text-text-primary font-bold"
                    suppressHydrationWarning
                  >
                    {!mounted ? 'Master Super Admin' : (adminUser?.fullName || (isAuthenticated ? 'Master Super Admin' : 'غير مسجل (Guest)'))}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      !mounted || isAuthenticated ? 'bg-bullish-up' : 'bg-amber-400 animate-pulse'
                    }`}
                  ></span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="font-telemetry-micro text-[10px] text-amber-400 font-mono font-bold dir-ltr"
                    suppressHydrationWarning
                  >
                    {!mounted || isAuthenticated
                      ? superAdminDossier?.securityClearance || 'L5 ROOT'
                      : 'NO AUTH'}
                  </span>
                  <span className="text-[10px] text-text-muted">•</span>
                  <span
                    className={`font-telemetry-micro text-[10px] dir-ltr ${
                      !mounted || isAuthenticated ? 'text-primary' : 'text-bearish-down'
                    }`}
                  >
                    {!mounted || isAuthenticated ? 'Secured' : 'Unauthorized'}
                  </span>
                </div>
              </div>

              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-primary-container/60 shadow-sm shadow-primary/20 shrink-0">
                <Image
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Profile"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <span className="material-symbols-outlined text-[16px] text-text-muted">
                expand_more
              </span>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-surface-container border border-border-structural rounded-2xl shadow-2xl p-space-sm z-50 animate-in fade-in zoom-in-95 space-y-2">
                {/* Identity Header */}
                <div className="p-2.5 rounded-xl bg-surface-elevated/70 border border-border-structural/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">
                      {adminUser?.fullName || 'Master Super Admin'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-mono font-bold dir-ltr">
                      LEVEL 5
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-text-muted dir-ltr block truncate">
                    {adminUser?.email || 'admin@fxengen.com'}
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setIsDossierModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary text-xs font-medium transition-colors cursor-pointer text-right"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      shield_person
                    </span>
                    <span className="flex-1">ملف الأمان والترخيص السيادي</span>
                    <span className="text-[10px] font-mono text-text-muted dir-ltr">GET /auth</span>
                  </button>

                  <Link
                    href="/login"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary text-xs font-medium transition-colors cursor-pointer text-right"
                  >
                    <span className="material-symbols-outlined text-[18px] text-accent-hover">
                      vpn_key
                    </span>
                    <span className="flex-1">تسجيل الدخول</span>
                    <span className="text-[10px] font-mono text-text-muted dir-ltr">/login</span>
                  </Link>

                  <div className="h-px bg-border-structural/60 my-1"></div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      logoutSuperAdmin();
                      toast.info('تم تسجيل الخروج الإداري وإبطال التوكن المحلي بنجاح');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-bearish-down/10 text-text-secondary hover:text-bearish-down text-xs font-medium transition-colors cursor-pointer text-right"
                  >
                    <span className="material-symbols-outlined text-[18px] text-bearish-down">
                      logout
                    </span>
                    <span>تسجيل الخروج الإداري</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <SuperAdminDossierModal />
      <AdminLoginModal />
    </header>
  );
}
