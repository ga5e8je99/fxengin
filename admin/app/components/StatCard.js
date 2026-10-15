'use client';

import React from 'react';
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';

export default function StatCard({
  title,
  value,
  change,
  isPositive = true,
  period = 'مقارنة بالشهر الماضي',
  icon: Icon,
  iconBg = 'rgba(4, 136, 248, 0.12)',
  iconColor = '#0488F8',
  badgeText,
  sparkline = null,
}) {
  // Generate SVG path for sparkline if provided
  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;

    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    const width = 76;
    const height = 24;
    const padding = 2;

    const points = sparkline.map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;
    const strokeColor = isPositive ? '#16C784' : '#F6465D';
    const gradientId = `spark-grad-${title.replace(/\s+/g, '-').slice(0, 10)}`;

    return (
      <div className="relative w-18 h-6 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#${gradientId})`} />
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="surface-card p-6 sm:p-7 relative overflow-hidden group flex flex-col justify-between hover:border-[#0488F8]/40 transition-all duration-200">
      {/* Subtle ambient background glow */}
      <div
        className="absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12 transition-opacity duration-300 group-hover:opacity-60 opacity-20"
        style={{
          background: `radial-gradient(circle, ${iconColor}40 0%, transparent 70%)`,
        }}
      />

      {/* Top Row: Title & Icon */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#A7AFBF]">
            {title}
          </p>
          {badgeText && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#12315C]/80 text-[#A7AFBF] font-medium">
              {badgeText}
            </span>
          )}
        </div>

        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 flex-shrink-0 border border-white/5 shadow-sm"
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            <Icon className="text-lg" />
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="relative z-10 my-1">
        <span className="text-3xl sm:text-4xl font-extrabold font-tabular tracking-tight text-[#F5F7FA]">
          {value}
        </span>
      </div>

      {/* Bottom Metric Row: Change Pill & Period + Sparkline */}
      <div className="relative z-10 mt-5 pt-4 border-t border-[#12315C]/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {change !== undefined && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold font-tabular ${
                isPositive
                  ? 'bg-[#16C784]/15 text-[#16C784]'
                  : 'bg-[#F6465D]/15 text-[#F6465D]'
              }`}
            >
              {isPositive ? <HiTrendingUp /> : <HiTrendingDown />}
              {change}
            </span>
          )}
          <span className="text-xs text-[#687287] truncate">
            {period}
          </span>
        </div>

        {renderSparkline()}
      </div>
    </div>
  );
}
