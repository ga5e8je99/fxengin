'use client';

import React from 'react';
import {
  IoReceiptOutline,
  IoCashOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5';

export default function DepositSummary({ deposits = [], isLoading = false, isRtl = true }) {
  // Skeleton loader cards when loading
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
              <div className="h-3 w-20 bg-[#12315C]/40 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Calculate metrics
  const totalCount = deposits.length;
  const totalUsdt = deposits.reduce((acc, item) => {
    if (item.coin === 'USDT' || !item.coin) {
      return acc + (item.numericAmount || 0);
    }
    return acc;
  }, 0);

  const completedCount = deposits.filter((item) => item.status === 1).length;
  const pendingCount = deposits.filter((item) => item.status !== 1).length;

  const cards = [
    {
      id: 'total-deposits',
      title: isRtl ? 'إجمالي الإيداعات' : 'Total Deposits',
      value: totalCount.toLocaleString(),
      subtitle: isRtl ? 'سجل العمليات المؤكدة والواردة' : 'All recorded deposits',
      icon: IoReceiptOutline,
      iconColor: '#0488F8',
      iconBg: 'rgba(4, 136, 248, 0.12)',
      glowColor: '#0488F8',
      badge: isRtl ? 'معاملة' : 'txns',
    },
    {
      id: 'total-usdt',
      title: isRtl ? 'إجمالي USDT المستلم' : 'Total USDT Volume',
      value: `${totalUsdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`,
      subtitle: isRtl ? 'حجم السيولة المودعة بالمنصة' : 'Total credited volume',
      icon: IoCashOutline,
      iconColor: '#FB8704',
      iconBg: 'rgba(251, 135, 4, 0.12)',
      glowColor: '#FB8704',
      badge: 'USDT',
    },
    {
      id: 'completed-deposits',
      title: isRtl ? 'الإيداعات المكتملة' : 'Completed Deposits',
      value: completedCount.toLocaleString(),
      subtitle: totalCount > 0 ? `${((completedCount / totalCount) * 100).toFixed(0)}% ${isRtl ? 'نسبة النجاح' : 'Success rate'}` : '—',
      icon: IoCheckmarkCircleOutline,
      iconColor: '#16C784',
      iconBg: 'rgba(22, 199, 132, 0.12)',
      glowColor: '#16C784',
      badge: isRtl ? 'ناجحة' : 'Success',
    },
    {
      id: 'pending-deposits',
      title: isRtl ? 'الإيداعات المعلقة' : 'Pending Deposits',
      value: pendingCount.toLocaleString(),
      subtitle: isRtl ? 'بانتظار تأكيدات الشبكة' : 'Awaiting confirmation',
      icon: IoTimeOutline,
      iconColor: '#FBBF24',
      iconBg: 'rgba(251, 191, 36, 0.12)',
      glowColor: '#FBBF24',
      badge: isRtl ? 'قيد المعالجة' : 'Pending',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="surface-card p-5 sm:p-6 relative overflow-hidden group flex flex-col justify-between hover:border-[#0488F8]/40 transition-all duration-200"
          >
            {/* Ambient background glow */}
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10 transition-opacity duration-300 group-hover:opacity-60 opacity-20"
              style={{
                background: `radial-gradient(circle, ${card.glowColor}40 0%, transparent 70%)`,
              }}
            />

            {/* Top row: Title, badge, icon */}
            <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-[#A7AFBF]">
                  {card.title}
                </span>
                {card.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#12315C]/80 text-[#A7AFBF] font-medium font-tabular">
                    {card.badge}
                  </span>
                )}
              </div>

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 flex-shrink-0 border border-white/5 shadow-sm"
                style={{ backgroundColor: card.iconBg, color: card.iconColor }}
              >
                <Icon className="text-lg" />
              </div>
            </div>

            {/* Main Value */}
            <div className="relative z-10 my-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-tabular tracking-tight text-[#F5F7FA] truncate">
                {card.value}
              </div>
            </div>

            {/* Subtitle / context */}
            <div className="relative z-10 mt-3 pt-3 border-t border-[#12315C]/60 flex items-center justify-between text-xs text-[#687287]">
              <span className="truncate">{card.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
