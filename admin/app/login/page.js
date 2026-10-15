'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../context/AdminContext';
import { toast } from 'react-toastify';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginSuperAdmin, isAuthLoading } = useAdmin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverStatus] = useState({ ping: 12, status: 'ONLINE' });
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      const msg = 'يرجى إدخال البريد الإلكتروني وكلمة المرور';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginSuperAdmin({ email: email.trim(), password });
      if (res.ok) {
        toast.success(`تمت المصادقة بنجاح! مرحباً ${res.data?.admin?.fullName || 'Master Super Admin'}`);
        router.push('/dashboard');
      } else {
        let msg = 'تعذر الاتصال بخادم المصادقة';
        if (res.status === 401) {
          msg = 'بيانات الاعتماد غير صحيحة، يرجى التأكد من البريد وكلمة المرور';
        } else if (res.status === 429) {
          msg = 'تم تجاوز معدل المحاولات المسموح بها (Rate Limit)';
        } else if (res.data?.message) {
          msg = Array.isArray(res.data.message) ? res.data.message.join('، ') : res.data.message;
        } else if (res.error) {
          msg = res.error;
        }
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch {
      const msg = 'حدث خطأ غير متوقع أثناء تسجيل الدخول';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#00030D] text-on-surface flex flex-col justify-between relative overflow-hidden select-none">
      {/* High-Tech Background Glows & Ambient Radial FX */}
      <div className="absolute top-[-15%] right-[-10%] w-[650px] h-[650px] rounded-full bg-primary/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent-hover/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-surface-elevated/20 blur-[160px] pointer-events-none" />

      {/* Background Tech Grid Lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#2a91ff 1px, transparent 1px), linear-gradient(90deg, #2a91ff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Header Bar */}
      <header className="h-20 border-b border-border-structural px-6 sm:px-12 flex items-center justify-between backdrop-blur-md bg-canvas-deep/60 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">terminal</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-text-primary tracking-wide">
                FXENGIN <span className="text-primary font-normal">ADMIN</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-primary border border-primary/30 dir-ltr">
                v3.4
              </span>
            </div>
            <span className="text-[10px] text-text-muted">نظام إدارة التداول السيادي</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-border-structural text-text-muted dir-ltr">
            <span className="w-2 h-2 rounded-full bg-bullish-up animate-pulse" />
            <span>ECN BRIDGE: {serverStatus.status} ({serverStatus.ping}ms)</span>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-container border border-border-structural text-text-secondary hover:text-text-primary transition-all text-xs cursor-pointer"
          >
            <span>لوحة التحكم</span>
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          </Link>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10 my-8">
        <div className="w-full max-w-md bg-surface-container border border-border-structural/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Card Top Strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent-hover to-bullish-up" />

          <div className="p-6 sm:p-8 space-y-6">
            {/* Title & Badge */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold mb-1 dir-ltr">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>LEVEL 5 ROOT ACCESS</span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                تسجيل دخول المدير العام
              </h1>
              <p className="text-xs text-text-secondary">
                مصادقة وصول آمنة للنواة المركزية عبر معايير التشفير العالية
              </p>
            </div>

            {/* Secure Admin Gate Notice */}
            <div className="p-3.5 rounded-xl bg-surface-elevated/80 border border-border-structural/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </div>
                <div className="space-y-0.5 text-right flex-1">
                  <div className="text-xs font-bold text-text-primary">
                    بوابة إدارة النظام المحمية
                  </div>
                  <div className="text-[11px] text-text-muted">
                    حساب المدير العام المعتمد للنظام
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@fxengen.com');
                  setPassword('FXAdmin#2026!MasterEngine$SecureKey');
                  setErrorMessage('');
                }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 transition-all cursor-pointer whitespace-nowrap"
                title="تعبئة بيانات حساب المدير العام"
              >
                تعبئة تلقائية
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 animate-fadeIn">
                <span className="material-symbols-outlined text-[20px] shrink-0 text-red-400">
                  error
                </span>
                <span className="text-xs font-semibold flex-1">
                  {errorMessage}
                </span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-primary">
                  البريد الإلكتروني الإداري (Administrator Email)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="admin@fxengen.com"
                    required
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-xs font-mono focus:outline-none focus:border-primary transition-all dir-ltr"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted">
                    alternate_email
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-text-primary">
                    كلمة المرور الرئيسية (Master Key)
                  </label>
                  <span className="text-[10px] font-mono text-text-muted dir-ltr">Min 12 Chars</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="••••••••••••••••••••"
                    required
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-xs font-mono focus:outline-none focus:border-primary transition-all dir-ltr"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted">
                    lock
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isAuthLoading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent-hover hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-primary/30"
                >
                  {isSubmitting || isAuthLoading ? (
                    <>
                      <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>جارٍ التحقق والمصادقة الأمنية...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">login</span>
                      <span>مصادقة ودخول لوحة التحكم</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Security Telemetry Footer */}
            <div className="pt-2 border-t border-border-structural/60 flex items-center justify-between text-[11px] text-text-muted">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-bullish-up">verified_user</span>
                <span>SHA-256 Token Rotation</span>
              </span>
              <span className="font-mono dir-ltr text-[10px]">POST /admin/auth/login</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-text-muted border-t border-border-structural/40 z-10">
        منصة FXENGIN — جميع الحقوق محفوظة © {new Date().getFullYear()} • حماية مشددة بمعايير التشفير المؤسسية
      </footer>
    </div>
  );
}
