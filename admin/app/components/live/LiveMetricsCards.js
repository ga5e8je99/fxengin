'use client';

import React from 'react';
import {
  HiOutlineVideoCamera,
  HiOutlineCalendar,
  HiOutlineUsers,
  HiOutlineChatAlt2,
} from 'react-icons/hi';

export default function LiveMetricsCards({
  sessions = [],
  isLoading = false,
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
              <div className="h-8 w-24 bg-[#12315C]/80 rounded-lg" />
            </div>
            <div className="pt-3 border-t border-[#12315C]/40 flex items-center gap-2">
              <div className="h-3 w-20 bg-[#12315C]/40 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const liveNow = sessions.filter((s) => s.status === 'LIVE').length;
  const scheduled = sessions.filter((s) => s.status === 'SCHEDULED').length;
  const totalParticipants = sessions.reduce(
    (acc, s) => acc + (s.maxParticipants || s.participantsCount || 0),
    0
  );
  const totalMessages = sessions.reduce(
    (acc, s) => acc + (s.messagesCount || s.totalMessagesCount || s._count?.messages || 0),
    0
  );

  const cards = [
    {
      title: 'البث المباشر الحي (Live Now)',
      value: liveNow.toString(),
      badgeText: liveNow > 0 ? 'ON AIR' : 'OFFLINE',
      change: liveNow > 0 ? 'بث نشط حالياً' : 'لا يوجد بث حي',
      isPositive: liveNow > 0,
      period: 'غرف التداول الحية المفتوحة',
      icon: HiOutlineVideoCamera,
      iconBg: liveNow > 0 ? 'rgba(22, 199, 132, 0.15)' : 'rgba(167, 175, 191, 0.12)',
      iconColor: liveNow > 0 ? '#16C784' : '#A7AFBF',
    },
    {
      title: 'الجلسات المجدولة القادمة',
      value: scheduled.toString(),
      badgeText: 'UPCOMING',
      change: `${scheduled} جلسة مجدولة`,
      isPositive: true,
      period: 'افتتاح الأسواق وجلسات التحليل',
      icon: HiOutlineCalendar,
      iconBg: 'rgba(4, 136, 248, 0.12)',
      iconColor: '#0488F8',
    },
    {
      title: 'سعة استيعاب الحضور',
      value: totalParticipants.toLocaleString('en-US'),
      badgeText: 'CAPACITY',
      change: 'بث فائق السرعة',
      isPositive: true,
      period: 'مجموع الطاقة الاستيعابية',
      icon: HiOutlineUsers,
      iconBg: 'rgba(251, 135, 4, 0.12)',
      iconColor: '#FB8704',
    },
    {
      title: 'رسائل وتفاعل الدردشة الحية',
      value: totalMessages.toLocaleString('en-US'),
      badgeText: 'INTERACTIONS',
      change: '+15% تفاعل حي',
      isPositive: true,
      period: 'تثبيت وتدقيق الشات الفوري',
      icon: HiOutlineChatAlt2,
      iconBg: 'rgba(168, 85, 247, 0.12)',
      iconColor: '#A855F7',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="surface-card p-5 sm:p-6 relative overflow-hidden group flex flex-col justify-between hover:border-[#0488F8]/40 transition-all duration-200"
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10 opacity-20 group-hover:opacity-50 transition-opacity"
              style={{
                background: `radial-gradient(circle, ${card.iconColor} 0%, transparent 70%)`,
              }}
            />

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

            <div className="relative z-10 my-1">
              <span className="text-3xl sm:text-4xl font-extrabold font-tabular text-[#F5F7FA]">
                {card.value}
              </span>
            </div>

            <div className="relative z-10 mt-4 pt-3 border-t border-[#12315C]/60 flex items-center justify-between text-xs gap-2">
              <span className="text-[#687287] truncate">{card.period}</span>
              {card.change && (
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                    card.isPositive
                      ? 'bg-[#16C784]/15 text-[#16C784]'
                      : 'bg-[#A7AFBF]/15 text-[#A7AFBF]'
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
  );
}
