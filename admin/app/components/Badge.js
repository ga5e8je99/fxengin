'use client';

import React from 'react';
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';

export default function Badge({ type = 'default', children, variant, size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  // Specific FinTech & Role Styles matching design.md
  if (variant === 'vip' || type === 'VIP') {
    return (
      <span
        style={{
          background: 'linear-gradient(135deg, #0458EC 0%, #FB8704 100%)',
          color: '#F5F7FA',
        }}
        className={`inline-flex items-center gap-1 font-bold rounded-full ${sizeClasses} shadow-sm`}
      >
        <span>★ VIP</span>
        {children && <span>{children}</span>}
      </span>
    );
  }

  if (variant === 'premium' || type === 'PREMIUM') {
    return (
      <span
        style={{
          backgroundColor: 'rgba(4, 136, 248, 0.15)',
          color: '#0488F8',
          border: '1px solid rgba(4, 136, 248, 0.3)',
        }}
        className={`inline-flex items-center gap-1 font-semibold rounded-full ${sizeClasses}`}
      >
        <span>Premium</span>
        {children && <span>{children}</span>}
      </span>
    );
  }

  if (variant === 'free' || type === 'FREE') {
    return (
      <span
        style={{
          backgroundColor: '#12315C',
          color: '#A7AFBF',
        }}
        className={`inline-flex items-center gap-1 font-medium rounded-full ${sizeClasses}`}
      >
        <span>مجاني</span>
        {children && <span>{children}</span>}
      </span>
    );
  }

  if (variant === 'bullish' || type === 'BULLISH') {
    return (
      <span
        style={{
          backgroundColor: 'rgba(22, 199, 132, 0.15)',
          color: '#16C784',
          border: '1px solid rgba(22, 199, 132, 0.3)',
        }}
        className={`inline-flex items-center gap-1 font-bold rounded-full ${sizeClasses}`}
      >
        <HiTrendingUp className="text-sm" />
        <span>{children || 'صعودي'}</span>
      </span>
    );
  }

  if (variant === 'bearish' || type === 'BEARISH') {
    return (
      <span
        style={{
          backgroundColor: 'rgba(246, 70, 93, 0.15)',
          color: '#F6465D',
          border: '1px solid rgba(246, 70, 93, 0.3)',
        }}
        className={`inline-flex items-center gap-1 font-bold rounded-full ${sizeClasses}`}
      >
        <HiTrendingDown className="text-sm" />
        <span>{children || 'هبوطي'}</span>
      </span>
    );
  }

  if (type === 'ACTIVE' || type === 'PUBLISHED' || type === 'SUCCESS') {
    return (
      <span
        style={{
          backgroundColor: 'rgba(22, 199, 132, 0.12)',
          color: '#16C784',
          border: '1px solid rgba(22, 199, 132, 0.25)',
        }}
        className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#16C784] animate-pulse" />
        <span>{children || (type === 'ACTIVE' ? 'نشط' : type === 'PUBLISHED' ? 'منشور' : 'ناجحة')}</span>
      </span>
    );
  }

  if (type === 'SUSPENDED' || type === 'FAILED') {
    return (
      <span
        style={{
          backgroundColor: 'rgba(246, 70, 93, 0.12)',
          color: '#F6465D',
          border: '1px solid rgba(246, 70, 93, 0.25)',
        }}
        className={`inline-flex items-center gap-1 font-medium rounded-full ${sizeClasses}`}
      >
        <span>{children || (type === 'SUSPENDED' ? 'معلق' : 'فاشلة')}</span>
      </span>
    );
  }

  if (type === 'DRAFT' || type === 'PENDING') {
    return (
      <span
        style={{
          backgroundColor: 'rgba(251, 191, 36, 0.12)',
          color: '#FBBF24',
          border: '1px solid rgba(251, 191, 36, 0.25)',
        }}
        className={`inline-flex items-center gap-1 font-medium rounded-full ${sizeClasses}`}
      >
        <span>{children || (type === 'DRAFT' ? 'مسودة' : 'قيد الانتظار')}</span>
      </span>
    );
  }

  return (
    <span
      style={{
        backgroundColor: '#06142F',
        color: '#A7AFBF',
        border: '1px solid #12315C',
      }}
      className={`inline-flex items-center gap-1 font-medium rounded-full ${sizeClasses}`}
    >
      {children}
    </span>
  );
}
