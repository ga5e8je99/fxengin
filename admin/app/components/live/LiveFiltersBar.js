'use client';

import React from 'react';
import { HiSearch, HiRefresh, HiX } from 'react-icons/hi';
import { LIVE_STATUSES, STREAM_TYPES } from '../../services/liveService';

export default function LiveFiltersBar({
  filters,
  onFilterChange,
  onResetFilters,
  totalResults = 0,
}) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.status !== 'ALL' ||
    filters.streamType !== 'ALL';

  return (
    <div className="surface-card p-4 sm:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <HiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A7AFBF] text-lg pointer-events-none" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="ابحث بعنوان جلسة البث، اسم المحلل، أو الوصف..."
            className="w-full h-11 pr-10 pl-10 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] placeholder:text-[#687287] text-sm outline-none focus:border-[#0488F8] transition-all"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange('search', '')}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A7AFBF] hover:text-white"
            >
              <HiX className="text-base" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="h-11 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-xs sm:text-sm text-[#F5F7FA] outline-none focus:border-[#0488F8] cursor-pointer"
          >
            <option value="ALL">جميع الحالات (All Statuses)</option>
            {Object.keys(LIVE_STATUSES).map((k) => (
              <option key={k} value={k}>
                {LIVE_STATUSES[k].labelAr}
              </option>
            ))}
          </select>

          {/* Stream Type */}
          <select
            value={filters.streamType || 'ALL'}
            onChange={(e) => onFilterChange('streamType', e.target.value)}
            className="h-11 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-xs sm:text-sm text-[#F5F7FA] outline-none focus:border-[#0488F8] cursor-pointer"
          >
            <option value="ALL">كافة مصادر البث (All Sources)</option>
            {Object.keys(STREAM_TYPES).map((k) => (
              <option key={k} value={k}>
                {STREAM_TYPES[k].labelAr}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="h-11 px-3 rounded-xl bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] hover:bg-[#F6465D]/20 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
            >
              <HiRefresh className="text-sm" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>
      </div>

      {/* Meta Indicators */}
      <div className="flex items-center justify-between pt-2 border-t border-[#12315C]/40 text-xs text-[#A7AFBF]">
        <div className="flex items-center gap-2">
          <span>الجلسات المعروضة:</span>
          <span className="font-bold text-[#F5F7FA] font-tabular">
            {totalResults} جلسة بث
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#16C784] animate-pulse" />
          <span className="text-[11px]">خادم البث المباشر (RTMP / HLS Gateway): متصل</span>
        </div>
      </div>
    </div>
  );
}
