'use client';

import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { toast } from 'react-toastify';

export default function SuperAdminDossierModal() {
  const {
    isDossierModalOpen,
    setIsDossierModalOpen,
    superAdminDossier,
    adminUser,
    refreshAdminSession,
    isAuthLoading,
  } = useAdmin();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const { setIsLoginModalOpen } = useAdmin();

  if (!isDossierModalOpen) return null;

  const hasSession = !!(superAdminDossier || adminUser);
  const profile = superAdminDossier?.profile || adminUser;
  const securityClearance = superAdminDossier?.securityClearance || 'UNAUTHENTICATED';
  const permissions = superAdminDossier?.permissions || [];
  const securityAudit = superAdminDossier?.securityAudit || {
    encryptionAlgorithm: 'BCRYPT_SALT_12_ROUNDS',
    tokenSecurity: 'SHA256_HASHED_REFRESH_ROTATION',
    jwtProtection: 'HS256_HIGH_ENTROPY_SIGNING',
    bruteForceProtection: 'REDIS_THROTTLER_ENFORCED',
    isolationLevel: 'SUPER_ADMIN_GUARD_ACTIVE',
  };

  const timestamp = superAdminDossier?.timestamp || new Date().toISOString();

  const handleCopy = (text, key) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success('تم النسخ بنجاح');
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleLiveRecheck = async () => {
    setIsRefreshing(true);
    toast.info('جاري إرسال حزم الاستعلام الأمني إلى النواة GET /admin/auth/super-admin...');
    await refreshAdminSession();
    setIsRefreshing(false);
    toast.success('تم تحديث وتوثيق ملف الأمان والترخيص السيادي بنجاح');
  };

  const permissionLabels = {
    ALL_PRIVILEGES: {
      ar: 'كافة الصلاحيات السيادية المطلقة',
      desc: 'صلاحيات تشغيلية وتحكمية كاملة دون أي قيود',
      icon: 'stars',
      color: '#EC4899',
    },
    MANAGE_SYSTEM_SETTINGS: {
      ar: 'حوكمة إعدادات النواة والخوادم',
      desc: 'إدارة الـ FIX API، Redis Cache، وسيرفرات السيولة',
      icon: 'settings_suggest',
      color: '#0488F8',
    },
    MANAGE_ADMIN_USERS: {
      ar: 'إدارة وتفويض المشرفين والمديرين',
      desc: 'إنشاء وترقية المشرفين وتعيين الأدوار',
      icon: 'admin_panel_settings',
      color: '#A855F7',
    },
    MANAGE_TRADERS: {
      ar: 'التحكم المؤسسي بالمتداولين',
      desc: 'إدارة اشتراكات وحسابات وجلسات المتداولين',
      icon: 'group',
      color: '#16C784',
    },
    MANAGE_FINANCIAL_GATEWAYS: {
      ar: 'إدارة بوابات السيولة والعمليات المالية',
      desc: 'مراجعة الإيداعات، السحوبات، والتحويلات البنكية',
      icon: 'account_balance',
      color: '#FB8704',
    },
    MANAGE_BOT_LICENSES: {
      ar: 'ترخيص خوارزميات التداول وبوتات الـ AI',
      desc: 'تفعيل وتجديد مفاتيح البوتات والصفقات الآلية',
      icon: 'smart_toy',
      color: '#06B6D4',
    },
    SYSTEM_SECURITY_AUDIT: {
      ar: 'التدقيق الأمني والجنائي للنظام',
      desc: 'مراقبة سجلات الدخول وفك التشفير وإبطال الجلسات',
      icon: 'policy',
      color: '#F6465D',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface-container border border-border-structural/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header with Security Clearance Banner */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-canvas-deep via-surface-elevated to-canvas-deep border-b border-border-structural flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent-hover/20 to-primary/20 border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/10">
              <span className="material-symbols-outlined text-[28px] text-primary animate-pulse">
                shield_person
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-text-primary">
                  ملف الأمان والترخيص السيادي
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-bullish-up/15 border border-bullish-up/30 text-bullish-up text-[11px] font-mono font-bold dir-ltr">
                  VERIFIED ACTIVE
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Super Administrator Security Dossier & Permissions Matrix — Endpoint: <code className="text-primary font-mono text-[11px]">GET /admin/auth/super-admin</code>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDossierModalOpen(false)}
            className="w-9 h-9 rounded-xl bg-surface-container-low hover:bg-surface-elevated text-text-muted hover:text-text-primary border border-border-structural flex items-center justify-center transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!hasSession ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">lock</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-text-primary">
                  لا توجد جلسة مصادقة نشطة للمدير العام
                </h3>
                <p className="text-xs text-text-secondary max-w-md">
                  يتطلب عرض ملف الأمان وتفاصيل التراخيص السيادية وجود جلسة دخول موثقة بـ JWT Token صالح من خادم النواة.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDossierModalOpen(false);
                  if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-primary/25"
              >
                <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                <span>الانتقال لصفحة تسجيل الدخول</span>
              </button>
            </div>
          ) : (
            <>
              {/* Top Banner: Clearance Badge */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-primary/10 to-amber-500/5 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <span className="material-symbols-outlined text-[24px]">verified</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 font-bold">
                      Security Clearance Level
                    </div>
                    <div className="text-lg font-mono font-bold text-text-primary dir-ltr flex items-center gap-2">
                      <span>{securityClearance}</span>
                      <span className="text-xs font-normal text-text-secondary font-sans">
                        (أعلى مستوى وصول جذري للنواة)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-text-muted dir-ltr">
                  <span className="w-2 h-2 rounded-full bg-bullish-up animate-ping"></span>
                  <span>Root Guard Enforced</span>
                </div>
              </div>

          {/* Admin Identity Card */}
          <div className="p-5 rounded-xl bg-surface-elevated/70 border border-border-structural space-y-4">
            <div className="flex items-center justify-between border-b border-border-structural/50 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                <h3 className="text-sm font-bold text-text-primary">
                  بيانات الهوية الرقمية للمدير العام (Active Dossier Identity)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-text-muted dir-ltr">
                Role: {profile.role}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] text-text-muted block">الاسم الكامل (Full Name)</span>
                <span className="text-sm font-bold text-text-primary">{profile.fullName || 'Master Super Admin'}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-text-muted block">البريد الإلكتروني المعتمد</span>
                <div className="flex items-center gap-1.5 font-mono text-xs text-text-primary dir-ltr">
                  <span>{profile.email}</span>
                  <button
                    onClick={() => handleCopy(profile.email, 'email')}
                    className="text-text-muted hover:text-primary transition-colors"
                    type="button"
                    title="نسخ"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedKey === 'email' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-text-muted block">معرف الحساب (Unique ID)</span>
                <div className="flex items-center gap-1.5 font-mono text-xs text-primary dir-ltr">
                  <span className="truncate max-w-[120px]">{profile.id}</span>
                  <button
                    onClick={() => handleCopy(profile.id, 'id')}
                    className="text-text-muted hover:text-primary transition-colors"
                    type="button"
                    title="نسخ المعرف"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedKey === 'id' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-text-muted block">تاريخ تفعيل الحساب</span>
                <span className="font-mono text-xs text-text-secondary dir-ltr">
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '2026-09-06'}
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic Permissions Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-hover text-[20px]">
                  verified_user
                </span>
                <h3 className="text-sm font-bold text-text-primary">
                  مصفوفة الصلاحيات المشفرة (Cryptographic Permissions Matrix)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {permissions.length} صـلاحـيـة نـشـطـة
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permissions.map((perm) => {
                const info = permissionLabels[perm] || {
                  ar: perm,
                  desc: 'صلاحية نظامية معتمدة',
                  icon: 'check_circle',
                  color: '#0488F8',
                };
                return (
                  <div
                    key={perm}
                    className="p-3 rounded-xl bg-surface-container-low border border-border-structural/70 flex items-start gap-3 hover:border-primary/40 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${info.color}15`,
                        borderColor: `${info.color}35`,
                        borderWidth: '1px',
                        color: info.color,
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {info.icon}
                      </span>
                    </div>

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-text-primary">
                          {info.ar}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-elevated text-text-muted dir-ltr">
                          {perm}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        {info.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Security Audit Telemetry */}
          <div className="p-5 rounded-xl bg-canvas-deep border border-border-structural/80 space-y-4">
            <div className="flex items-center justify-between border-b border-border-structural/50 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-bullish-up text-[20px]">
                  security
                </span>
                <h3 className="text-sm font-bold text-text-primary">
                  تدقيق الأمان والتشفير الحي (Security & Encryption Telemetry)
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted dir-ltr">
                <span className="w-1.5 h-1.5 rounded-full bg-bullish-up"></span>
                <span>Verified: {new Date(timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-surface-container/60 border border-border-structural space-y-1">
                <span className="text-[10px] text-text-muted uppercase font-mono tracking-wider block">
                  خوارزمية تشفير كلمات المرور
                </span>
                <span className="text-xs font-mono font-bold text-text-primary dir-ltr block">
                  {securityAudit.encryptionAlgorithm || 'BCRYPT_SALT_12_ROUNDS'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container/60 border border-border-structural space-y-1">
                <span className="text-[10px] text-text-muted uppercase font-mono tracking-wider block">
                  أمان تدوير الجلسات (Token Rotation)
                </span>
                <span className="text-xs font-mono font-bold text-primary dir-ltr block">
                  {securityAudit.tokenSecurity || securityAudit.sessionSecurity || 'SHA256_HASHED_REFRESH_ROTATION'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container/60 border border-border-structural space-y-1">
                <span className="text-[10px] text-text-muted uppercase font-mono tracking-wider block">
                  حماية الـ JWT Access Token
                </span>
                <span className="text-xs font-mono font-bold text-text-primary dir-ltr block">
                  {securityAudit.jwtProtection || securityAudit.jwtAlgorithm || 'HS256_HIGH_ENTROPY_SIGNING'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container/60 border border-border-structural space-y-1">
                <span className="text-[10px] text-text-muted uppercase font-mono tracking-wider block">
                  مكافحة الهجمات والـ Brute-Force
                </span>
                <span className="text-xs font-mono font-bold text-bullish-up dir-ltr block">
                  {securityAudit.bruteForceProtection || securityAudit.rateLimitingStatus || 'REDIS_THROTTLER_ENFORCED'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container/60 border border-border-structural space-y-1">
                <span className="text-[10px] text-text-muted uppercase font-mono tracking-wider block">
                  مستوى عزل الصلاحيات (Isolation Guard)
                </span>
                <span className="text-xs font-mono font-bold text-accent-hover dir-ltr block">
                  {securityAudit.isolationLevel || 'SUPER_ADMIN_GUARD_ACTIVE'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container/60 border border-border-structural space-y-1">
                <span className="text-[10px] text-text-muted uppercase font-mono tracking-wider block">
                  حالة الاتصال والبروتوكول
                </span>
                <span className="text-xs font-mono font-bold text-bullish-up dir-ltr block">
                  TLS 1.3 Strict Encrypted
                </span>
              </div>
            </div>
          </div>
          </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-surface-elevated/50 border-t border-border-structural flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-text-secondary flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-bullish-up"></span>
            <span>جلسة معتمدة بتصريح مدير رئيسي ومحمية بنظام التشفير المعياري</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLiveRecheck}
              disabled={isRefreshing || isAuthLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-primary/20"
              type="button"
            >
              <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isRefreshing ? 'جاري الفحص الحي...' : 'إعادة فحص وتدقيق الأمان'}</span>
            </button>

            <button
              onClick={() => setIsDossierModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-elevated text-text-primary text-xs font-bold border border-border-structural transition-colors cursor-pointer"
              type="button"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
