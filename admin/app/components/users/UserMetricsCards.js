'use client';

import React from 'react';
import {
  HiUsers,
  HiUserGroup,
  HiShieldExclamation,
  HiSparkles,
  HiRefresh,
  HiTrendingUp,
} from 'react-icons/hi';

export default function UserMetricsCards({
  metrics,
  isLoading = false,
  onRefresh,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="surface-card p-5 sm:p-6 relative overflow-hidden animate-pulse flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-[#12315C]/60 rounded-md" />
              <div className="w-10 h-10 rounded-xl bg-[#12315C]/60" />
            </div>
            <div className="my-3">
              <div className="h-8 w-32 bg-[#12315C]/80 rounded-lg" />
            </div>
            <div className="pt-3 border-t border-[#12315C]/40 flex items-center gap-2">
              <div className="h-3 w-24 bg-[#12315C]/40 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalUsers = metrics?.totalUsers ?? 0;
  const activeUsers = metrics?.activeUsers ?? 0;
  const suspendedUsers = metrics?.suspendedUsers ?? 0;
  const roles = metrics?.roles || {};
  const growth = metrics?.growth || {};

  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const vipAndTraders = (roles.VIP || 0) + (roles.TRADER || 0);

  const cards = [
    {
      title: 'إجمالي المسجلين في المنظومة',
      value: totalUsers.toLocaleString('en-US'),
      badgeText: 'TOTAL USERS',
      change: growth.last30Days ? `+${growth.last30Days}` : undefined,
      isPositive: true,
      period: 'مسجل جديد خلال 30 يوماً',
      icon: HiUsers,
      iconBg: 'rgba(4, 136, 248, 0.12)',
      iconColor: '#0488F8',
    },
    {
      title: 'المتداولون النشطون',
      value: activeUsers.toLocaleString('en-US'),
      badgeText: `${activeRate}% نسبة النشاط`,
      change: growth.last24Hours ? `+${growth.last24Hours}` : undefined,
      isPositive: true,
      period: 'تفاعل جديد خلال 24 ساعة',
      icon: HiUserGroup,
      iconBg: 'rgba(22, 199, 132, 0.12)',
      iconColor: '#16C784',
    },
    {
      title: 'أعضاء VIP والمتداولون المحترفون',
      value: vipAndTraders.toLocaleString('en-US'),
      badgeText: 'VIP & TRADERS',
      change: `${roles.VIP || 0} VIP`,
      isPositive: true,
      period: `${roles.TRADER || 0} متداول معتمد`,
      icon: HiSparkles,
      iconBg: 'rgba(251, 135, 4, 0.12)',
      iconColor: '#FB8704',
    },
    {
      title: 'الحسابات المعلقة / المحظورة',
      value: suspendedUsers.toLocaleString('en-US'),
      badgeText: 'SUSPENDED',
      change: suspendedUsers > 0 ? `${suspendedUsers} موقوف` : '0 موقوف',
      isPositive: suspendedUsers === 0,
      period: 'حسابات خاضعة للتدقيق الأمني',
      icon: HiShieldExclamation,
      iconBg: 'rgba(246, 70, 93, 0.12)',
      iconColor: '#F6465D',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="surface-card p-5 sm:p-6 relative overflow-hidden group flex flex-col justify-between hover:border-[#0488F8]/40 transition-all duration-200"
            >
              {/* Background ambient glow */}
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10 opacity-20 group-hover:opacity-50 transition-opacity"
                style={{
                  background: `radial-gradient(circle, ${card.iconColor} 0%, transparent 70%)`,
                }}
              />

              {/* Card Header */}
              <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
                <span className="text-xs sm:text-sm font-semibold text-[#A7AFBF] line-clamp-1">
                  {card.title}
                </span>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105"
                  style={{ backgroundColor: card.iconBg, color: card.iconColor }}
                >
                  <Icon className="text-xl" />
                </div>
              </div>

              {/* Value */}
              <div className="relative z-10 my-1">
                <span className="text-3xl sm:text-4xl font-extrabold font-tabular text-[#F5F7FA]">
                  {card.value}
                </span>
              </div>

              {/* Bottom footer */}
              <div className="relative z-10 mt-4 pt-3 border-t border-[#12315C]/60 flex items-center justify-between text-xs gap-2">
                <span className="text-[#687287] truncate">{card.period}</span>
                {card.change && (
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                      card.isPositive
                        ? 'bg-[#16C784]/15 text-[#16C784]'
                        : 'bg-[#F6465D]/15 text-[#F6465D]'
                    }`}
                  >
                    {card.change}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Role & Experience Breakdown Quick Strip */}
      {metrics?.roles && (
        <div className="bg-[#0A1B3D]/80 border border-[#12315C] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#A7AFBF]">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">توزيع الصلاحيات:</span>
            <span className="px-2 py-0.5 rounded bg-[#12315C] text-[#F5F7FA]">
              مستخدمين: {roles.USER ?? 0}
            </span>
            <span className="px-2 py-0.5 rounded bg-[#0488F8]/20 text-[#0488F8] font-bold">
              متداولين: {roles.TRADER ?? 0}
            </span>
            <span className="px-2 py-0.5 rounded bg-[#FB8704]/20 text-[#FB8704] font-bold">
              VIP: {roles.VIP ?? 0}
            </span>
            <span className="px-2 py-0.5 rounded bg-[#A855F7]/20 text-[#A855F7] font-bold">
              إدارة: {(roles.ADMIN ?? 0) + (roles.SUPER_ADMIN ?? 0)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {metrics?.computedAt && (
              <span className="text-[11px] text-[#687287] dir-ltr">
                تحديث: {new Date(metrics.computedAt).toLocaleTimeString('ar-SA')}
              </span>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-lg bg-[#12315C] text-[#A7AFBF] hover:text-white hover:bg-[#1A4278] transition-colors"
                title="تحديث المؤشرات"
                type="button"
              >
                <HiRefresh className="text-sm" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
